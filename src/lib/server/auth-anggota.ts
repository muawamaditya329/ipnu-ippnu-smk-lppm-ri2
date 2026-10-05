import { randomBytes } from 'node:crypto';
import { dev } from '$app/env';
import type { Cookies } from '@sveltejs/kit';
import { db, type Member } from './db.ts';
import {
	catatGagal,
	formatWaktuDb,
	resetPercobaanGagal,
	verifikasiBayangan,
	verifyPassword
} from './auth.ts';

/**
 * Sesi login ANGGOTA — terpisah dari sesi pengurus (auth.ts) agar seorang
 * anggota tidak pernah dianggap pengurus dan sebaliknya. Cookie, tabel, dan
 * helpernya sendiri; polanya mengikuti auth.ts.
 */

/** Nama cookie sesi anggota — dipakai bersama hooks.server.ts, jangan diubah terpisah. */
export const SESI_ANGGOTA_COOKIE = 'sesi_anggota';
const UMUR_SESI_HARI = 30;

/** Data anggota yang dibawa sesi (sengaja tanpa PII lain — bukan halaman publik sih, tapi minimalkan). */
export type AnggotaSesi = Pick<
	Member,
	'id' | 'nama' | 'jenis_kelamin' | 'status' | 'no_reg' | 'nis'
>;

/** Status yang boleh memiliki sesi login. */
const STATUS_BOLEH_MASUK = ['aktif', 'alumni'];

/**
 * Coba login anggota dengan NIS + password; jika sukses set cookie sesi dan
 * kembalikan data anggotanya. Pesan kegagalan dibuat ramah & spesifik per
 * status pendaftaran — kecuali NIS yang memang tidak terdaftar, yang tetap
 * dibalas generik (NIS/password salah) supaya keberadaan NIS tidak bisa diproba.
 *
 * `ip` & `url` sama gunanya dengan pada login() pengurus: pembatas percobaan
 * gagal per IP+NIS, serta flag Secure cookie mengikuti protokol permintaan.
 */
export function loginAnggota(
	cookies: Cookies,
	nis: string,
	password: string,
	ip = '',
	url: URL | null = null
): { ok: true; anggota: AnggotaSesi } | { ok: false; pesan: string } {
	// Satu NIS bisa saja tercatat lebih dari sekali (pendaftar lama yang mendaftar
	// ulang); ambil baris yang paling layak masuk — statusnya aktif/alumni — atau
	// baris terbaru bila tidak ada, agar pesannya tetap masuk akal.
	const baris = db
		.prepare(
			`SELECT id, nama, jenis_kelamin, status, no_reg, nis, password_hash
			 FROM members WHERE nis = ? ORDER BY id`
		)
		.all(nis) as (AnggotaSesi & { password_hash: string | null })[];
	const member =
		baris.find((m) => STATUS_BOLEH_MASUK.includes(m.status)) ?? baris[baris.length - 1];

	if (!member) {
		// NIS tidak terdaftar — jalankan satu derivasi scrypt palsu agar latensi
		// responsnya setara dgn percobaan yang NIS-nya benar (anti timing probe).
		verifikasiBayangan(password);
		if (ip) catatGagal(nis, ip);
		return { ok: false, pesan: 'NIS atau password salah.' };
	}

	if (member.status === 'pending') {
		if (ip) catatGagal(nis, ip);
		return { ok: false, pesan: 'Pendaftaranmu belum diverifikasi pengurus.' };
	}
	if (member.status === 'ditolak') {
		if (ip) catatGagal(nis, ip);
		return {
			ok: false,
			pesan:
				'Pendaftaranmu tidak dapat kami setujui. Hubungi pengurus untuk keterangan lebih lanjut.'
		};
	}
	if (!member.password_hash) {
		if (ip) catatGagal(nis, ip);
		return { ok: false, pesan: 'Akunmu belum punya password. Hubungi pengurus komisariat.' };
	}
	if (!verifyPassword(password, member.password_hash)) {
		if (ip) catatGagal(nis, ip);
		return { ok: false, pesan: 'NIS atau password salah.' };
	}

	// Sukses: hapus hitungan gagal utk kombinasi ini.
	if (ip) resetPercobaanGagal(nis, ip);

	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + UMUR_SESI_HARI * 24 * 3600 * 1000);
	db.prepare('INSERT INTO anggota_sessions (token, member_id, expires_at) VALUES (?, ?, ?)').run(
		token,
		member.id,
		formatWaktuDb(expires)
	);
	// Bersihkan sesi anggota lama yang sudah kedaluwarsa (pola sama dgn login pengurus).
	db.prepare("DELETE FROM anggota_sessions WHERE expires_at <= datetime('now')").run();

	cookies.set(SESI_ANGGOTA_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// Sama dgn sesi pengurus: Secure hanya di HTTPS, agar login LAN/dev HTTP tidak gagal diam-diam.
		secure: url ? url.protocol === 'https:' : !dev,
		expires
	});

	return {
		ok: true,
		anggota: {
			id: member.id,
			nama: member.nama,
			jenis_kelamin: member.jenis_kelamin,
			status: member.status,
			no_reg: member.no_reg,
			nis: member.nis
		}
	};
}

/** Ambil sesi anggota dari token cookie — null bila tidak sah, kedaluwarsa, atau statusnya sudah tidak boleh masuk. */
export function getSessionAnggota(token: string | undefined): AnggotaSesi | null {
	if (!token) return null;
	const row = db
		.prepare(
			`SELECT m.id, m.nama, m.jenis_kelamin, m.status, m.no_reg, m.nis
			 FROM anggota_sessions s JOIN members m ON m.id = s.member_id
			 WHERE s.token = ? AND s.expires_at > datetime('now')
			   AND m.status IN ('aktif', 'alumni')`
		)
		.get(token) as AnggotaSesi | undefined;
	return row ?? null;
}

/** Keluar: hapus baris sesinya lalu cookie-nya. Aman dipanggil tanpa sesi. */
export function logoutAnggota(cookies: Cookies): void {
	const token = cookies.get(SESI_ANGGOTA_COOKIE);
	if (token) db.prepare('DELETE FROM anggota_sessions WHERE token = ?').run(token);
	cookies.delete(SESI_ANGGOTA_COOKIE, { path: '/' });
}

/**
 * Putus semua sesi milik seorang anggota — dipakai saat keanggotaannya dinonaktifkan
 * atau statusnya berubah agar token yang sudah beredar mati seketika (getSessionAnggota
 * sendiri juga menolak status di luar aktif/alumni, ini lapis kedua).
 * `kecualiToken` membiarkan satu sesi tetap hidup — dipakai saat anggota mengganti
 * passwordnya sendiri: sesi lain mati, yang sedang dipakai tidak terkeluar paksa
 * (pola sama dgn hapusSesi() di auth.ts).
 */
export function hapusSesiAnggota(memberId: number, kecualiToken?: string): void {
	if (kecualiToken) {
		db.prepare('DELETE FROM anggota_sessions WHERE member_id = ? AND token <> ?').run(
			memberId,
			kecualiToken
		);
	} else {
		db.prepare('DELETE FROM anggota_sessions WHERE member_id = ?').run(memberId);
	}
}
