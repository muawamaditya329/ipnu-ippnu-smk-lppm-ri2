import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/env';
import type { Cookies } from '@sveltejs/kit';
import { db, type User } from './db';

/** Nama cookie sesi — dipakai bersama hooks.server.ts, jangan diganti di satu tempat saja. */
export const SESI_COOKIE = 'sesi_komisariat';
const UMUR_SESI_HARI = 30;

/** Ubah Date menjadi 'YYYY-MM-DD HH:MM:SS' UTC — format yang konsisten dgn datetime('now') SQLite. */
export function formatWaktuDb(d: Date): string {
	return d.toISOString().slice(0, 19).replace('T', ' ');
}

// ---------------------------------------------------------------------------
// Scrypt. Parameter disimpan bersama hash (format baru: scrypt$N$r$p$salt$hash)
// agar bisa diperkuat tanpa merusak hash yang sudah ada. Format lama
// 'salt:hash' (parameter bawaan node: 2^14, 8, 1) tetap sah & otomatis di-upgrade
// ke format baru saat pemiliknya berhasil login — lihat login().
// ---------------------------------------------------------------------------
const KUNCI_PANJANG = 64;
const MAXMEM = 128 * 1024 * 1024; // kebutuhan memori 128*N*r = 64 MB + ruang aman
const PARAM_BARU = { N: 2 ** 16, r: 8, p: 1 } as const;
const PARAM_LAMA = { N: 2 ** 14, r: 8, p: 1 } as const; // sama dgn default scryptSync lama

function turunkanKunci(
	password: string,
	salt: string,
	param: { N: number; r: number; p: number }
): Buffer {
	return scryptSync(password, salt, KUNCI_PANJANG, { ...param, maxmem: MAXMEM });
}

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = turunkanKunci(password, salt, PARAM_BARU).toString('hex');
	return `scrypt$${PARAM_BARU.N}$${PARAM_BARU.r}$${PARAM_BARU.p}$${salt}$${hash}`;
}

/** Bandingkan kunci hasil derivasi dgn hash tersimpan — timing-safe, tanpa short-circuit. */
function samaTiming(kandidat: Buffer, hashTersimpan: string): boolean {
	const asli = Buffer.from(hashTersimpan, 'hex');
	return kandidat.length === asli.length && timingSafeEqual(kandidat, asli);
}

// ---------------------------------------------------------------------------
// Pembatas percobaan login gagal (anti brute-force) — sederhana, di memori
// proses: cukup utk satu instansi server, tanpa dependensi tambahan.
// ---------------------------------------------------------------------------
const MAKS_GAGAL = 8; // percobaan gagal
const JENDELA_MS = 10 * 60 * 1000; // per 10 menit
const percobaanGagal = new Map<string, { n: number; reset: number }>();

function kunciPercobaan(username: string, ip: string): string {
	return `${ip}|${username.trim().toLowerCase()}`;
}

/** True bila kombinasi IP+username sudah melewati batas gagal & masih diblokir. */
export function loginDiblokir(username: string, ip: string): boolean {
	const entri = percobaanGagal.get(kunciPercobaan(username, ip));
	return !!entri && entri.n >= MAKS_GAGAL && Date.now() < entri.reset;
}

export function catatGagal(username: string, ip: string): void {
	const kunci = kunciPercobaan(username, ip);
	const sekarang = Date.now();
	const entri = percobaanGagal.get(kunci);
	if (!entri || sekarang >= entri.reset) {
		percobaanGagal.set(kunci, { n: 1, reset: sekarang + JENDELA_MS });
	} else {
		entri.n += 1;
	}
	// Buang entri yang sudah kedaluwarsa agar Map tidak tumbuh tanpa batas.
	if (percobaanGagal.size > 1000) {
		for (const [k, v] of percobaanGagal) if (sekarang >= v.reset) percobaanGagal.delete(k);
	}
}

/** Hapus hitungan gagal setelah sukses — dipakai juga login anggota (identifier bebas). */
export function resetPercobaanGagal(username: string, ip: string): void {
	percobaanGagal.delete(kunciPercobaan(username, ip));
}

export function verifyPassword(password: string, stored: string): boolean {
	// Format baru: scrypt$N$r$p$salt$hash. Parameter dari database dibatasi ketat
	// agar baris yang rusak/dirusak tidak bisa memaksa komputasi raksasa (DoS).
	const bagian = stored.split('$');
	if (bagian.length === 6 && bagian[0] === 'scrypt') {
		const N = Number(bagian[1]);
		const r = Number(bagian[2]);
		const p = Number(bagian[3]);
		const [salt, hash] = [bagian[4], bagian[5]];
		if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
		if (N < 2 ** 14 || N > 2 ** 21 || r < 8 || r > 64 || p < 1 || p > 8) return false;
		if (128 * N * r > MAXMEM) return false;
		try {
			return samaTiming(turunkanKunci(password, salt, { N, r, p }), hash);
		} catch {
			return false;
		}
	}

	// Format lama: salt:hash.
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	try {
		return samaTiming(turunkanKunci(password, salt, PARAM_LAMA), hash);
	} catch {
		return false;
	}
}

// Verifikasi palsu dengan biaya komputasi setara verifikasi sungguhan: dipakai
// saat username tidak terdaftar supaya waktu respons login tidak membocorkan
// keberadaan akun (tidak ada selisih latensi yang bisa diamati). Hash contoh
// dibuat malas (lazy) agar tidak membebani proses start.
let hashBayangan: string | undefined;
function scryptBayangan(password: string): void {
	hashBayangan ??= hashPassword('akun-bayangan-utk-menyamakan-waktu-verifikasi-login');
	verifyPassword(password, hashBayangan);
}

/** Verifikasi bayangan utk identifier yang TIDAK terdaftar — dipakai juga login anggota. */
export function verifikasiBayangan(password: string): void {
	scryptBayangan(password);
}

/**
 * Coba login; jika sukses set cookie sesi dan kembalikan user-nya.
 *
 * `url` = URL permintaan (event.url pada action login). Protokolnya menentukan
 * flag `secure` cookie sesi: di HTTPS cookie diberi flag Secure (browser tidak
 * akan mengirimnya lewat HTTP), sedangkan di HTTP murni — dev server atau
 * deploy LAN/VPS tanpa TLS, yang juga didokumentasikan di README — tanpa flag
 * itu agar login tidak gagal diam-diam. Sumber protokolnya sama dengan yang
 * dipakai validasi CSRF adapter-node (ORIGIN / PROTOCOL_HEADER), sehingga
 * kebijakan cookie dan kebijakan origin selalu konsisten.
 */
export function login(
	cookies: Cookies,
	username: string,
	password: string,
	ip = '',
	url: URL | null = null
): { ok: true; user: User } | { ok: false; pesan: string } {
	const row = db
		.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
		.get(username.trim()) as (User & { password_hash: string; aktif: number }) | undefined;

	if (!row) {
		// Username tidak terdaftar — tetap jalankan satu derivasi scrypt agar
		// latensinya sebanding dengan verifikasi sungguhan.
		scryptBayangan(password);
		if (ip) catatGagal(username, ip);
		return { ok: false, pesan: 'Username atau password salah.' };
	}
	if (!verifyPassword(password, row.password_hash)) {
		if (ip) catatGagal(username, ip);
		return { ok: false, pesan: 'Username atau password salah.' };
	}
	if (!row.aktif) {
		return { ok: false, pesan: 'Akun dinonaktifkan. Hubungi admin.' };
	}
	// Sukses: hapus hitungan gagal utk kombinasi ini.
	if (ip) percobaanGagal.delete(kunciPercobaan(username, ip));

	// Hash format lama diperbarui ke format baru (salt segar + parameter terkini).
	if (!row.password_hash.startsWith('scrypt$')) {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
			hashPassword(password),
			row.id
		);
	}

	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + UMUR_SESI_HARI * 24 * 3600 * 1000);
	db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
		token,
		row.id,
		formatWaktuDb(expires)
	);
	// Bersihkan sesi lama yang sudah kedaluwarsa (perbandingan string pada kolom
	// — formatnya UTC seragam — agar indeks expires_at terpakai).
	db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();

	cookies.set(SESI_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// Di HTTPS (produksi) wajib Secure supaya token tidak ikut terkirim bila
		// ada permintaan HTTP; di dev selalu http, jadi tanpa flag Secure.
		secure: url ? url.protocol === 'https:' : !dev,
		expires
	});

	const user: User = { id: row.id, nama: row.nama, username: row.username, role: row.role };
	return { ok: true, user };
}

export function getSessionUser(token: string | undefined): User | null {
	if (!token) return null;
	const row = db
		.prepare(
			`SELECT u.id, u.nama, u.username, u.role
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.token = ? AND s.expires_at > datetime('now') AND u.aktif = 1`
		)
		.get(token) as User | undefined;
	return row ?? null;
}

export function logout(cookies: Cookies): void {
	const token = cookies.get(SESI_COOKIE);
	if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
	cookies.delete(SESI_COOKIE, { path: '/' });
}

/**
 * Putus semua sesi milik seorang pengguna — dipanggil saat akunnya dinonaktifkan
 * atau passwordnya direset, supaya token yang sudah terlanjur beredar mati
 * seketika (getSessionUser sendiri juga menolak user non-aktif, ini lapis kedua).
 * `kecualiToken` membiarkan sesi saat ini tetap hidup, mis. admin mengganti
 * passwordnya sendiri lewat pengaturan.
 */
export function hapusSesi(userId: number, kecualiToken?: string): void {
	if (kecualiToken) {
		db.prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?').run(userId, kecualiToken);
	} else {
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
	}
}
