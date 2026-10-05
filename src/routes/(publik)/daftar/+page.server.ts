import { fail } from '@sveltejs/kit';
import { hashPassword } from '#lib/server/auth.ts';
import { db, tokenKartuBaru } from '#lib/server/db.ts';
import { melebihiLaju } from '#lib/server/rate-limit.ts';
import { hariIni, JURUSAN_SMK, TINGKAT_KELAS } from '#lib/utils.ts';
import type { Actions } from './$types';

// Batas anti-spam pendaftaran (lihat src/lib/server/rate-limit.ts):
// - per IP  : 10 kali kirim formulir per menit — menghentikan banjir permintaan
//             dari satu titik, termasuk permintaan yang gagal validasi;
// - per NIS : maksimal 3 pendaftaran per jam dgn NIS sama — lapis kedua bila
//             spam datang dari banyak IP sekaligus. Tidak perlu tabel baru:
//             percobaan yang benar-benar tercatat sudah tampak di kolom
//             members.created_at, jadi cukup dihitung dari situ (tetap berlaku
//             walau server di-restart).
const MAKS_KIRIM_PER_IP = 10;
const JENDELA_PER_IP_MS = 60 * 1000;
const MAKS_PER_NIS_JAM = 3;

/** Tanggal murni YYYY-MM-DD yang benar-benar ada di kalender (mis. 2009-02-31 ditolak). */
function tanggalKalenderValid(s: string): boolean {
	const [y, m, d] = s.split('-').map(Number);
	if (!y || !m || !d) return false;
	const t = new Date(Date.UTC(y, m - 1, d));
	return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

type NilaiForm = {
	nama: string;
	jenis_kelamin: string;
	nis: string;
	kelas: string;
	jurusan: string;
	tanggal_lahir: string;
	alamat: string;
	no_hp: string;
	nama_ortu: string;
	motivasi: string;
};

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilDaftar = {
	sukses: boolean;
	nama: string;
	nis: string;
	/** Pesan global non-field (mis. penolakan rate limit); null bila tidak ada. */
	pesan: string | null;
	galat: Record<string, string> | null;
	nilai: NilaiForm | null;
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const fd = await request.formData();

		const nama = String(fd.get('nama') ?? '').trim();
		const jenis_kelamin = String(fd.get('jenis_kelamin') ?? '');
		const nis = String(fd.get('nis') ?? '').trim();
		const kelas = String(fd.get('kelas') ?? '');
		const jurusan = String(fd.get('jurusan') ?? '');
		const tanggal_lahir = String(fd.get('tanggal_lahir') ?? '').trim();
		const alamat = String(fd.get('alamat') ?? '').trim();
		const no_hp = String(fd.get('no_hp') ?? '').trim();
		const nama_ortu = String(fd.get('nama_ortu') ?? '').trim();
		const motivasi = String(fd.get('motivasi') ?? '').trim();
		// Password akun anggota — sengaja TIDAK ikut `nilai` (yang dikirim balik ke
		// UI saat galat): isian yang sudah diketik tidak boleh tampil kembali.
		const password = String(fd.get('password') ?? '');
		const passwordKonfirmasi = String(fd.get('password_konfirmasi') ?? '');

		const nilai: NilaiForm = {
			nama,
			jenis_kelamin,
			nis,
			kelas,
			jurusan,
			tanggal_lahir,
			alamat,
			no_hp,
			nama_ortu,
			motivasi
		};
		const galat: Record<string, string> = {};

		// Anti-spam lapis 1: batasi laju kirim per IP. Dilakukan sebelum validasi
		// agar banjir permintaan berhenti sebelum menyentuh database. IP yang
		// gagal dideteksi (proxy salah konfigurasi) tidak diblokir — batas per
		// NIS di bawah tetap berlaku utk kasus itu.
		let ip = '';
		try {
			ip = getClientAddress();
		} catch {
			// Alamat klien tak tersedia — lanjut tanpa batas per IP.
		}
		if (ip && melebihiLaju(`daftar:${ip}`, MAKS_KIRIM_PER_IP, JENDELA_PER_IP_MS)) {
			return fail(429, {
				sukses: false,
				nama: '',
				nis: '',
				pesan:
					'Terlalu banyak percobaan pendaftaran dari jaringan ini. Tunggu sekitar satu menit, lalu kirim lagi — isianmu tetap tersimpan di formulir.',
				galat: null,
				nilai
			} satisfies HasilDaftar);
		}

		// Batas panjang sisi server (maxlength di HTML bisa dilewati).
		if (nama.length < 3) galat.nama = 'Nama minimal 3 karakter.';
		else if (nama.length > 100) galat.nama = 'Nama maksimal 100 karakter.';
		if (alamat.length > 200) galat.alamat = 'Alamat maksimal 200 karakter.';
		if (nama_ortu.length > 100) galat.nama_ortu = 'Nama orang tua maksimal 100 karakter.';
		if (motivasi.length > 500) galat.motivasi = 'Motivasi maksimal 500 karakter.';

		if (jenis_kelamin !== 'L' && jenis_kelamin !== 'P') {
			galat.jenis_kelamin = 'Pilih status putra (IPNU) atau putri (IPPNU).';
		}
		if (!/^[0-9]{4,15}$/.test(nis)) {
			galat.nis = 'NIS harus berupa angka (4–15 digit tanpa spasi).';
		} else {
			// Satu NIS hanya boleh dipakai sekali selama masih menunggu verifikasi / aktif.
			const bentrok = db
				.prepare(`SELECT id FROM members WHERE nis = ? AND status IN ('pending', 'aktif') LIMIT 1`)
				.get(nis) as { id: number } | undefined;
			if (bentrok) {
				galat.nis =
					'NIS ini sudah pernah dipakai mendaftar. Cek statusnya lewat halaman Cek Status, atau hubungi pengurus bila ini bukan NIS-mu.';
			} else {
				// Anti-spam lapis 2: satu NIS tidak boleh dipakai mendaftar lebih dari
				// MAKS_PER_NIS_JAM kali dalam satu jam — membatasi kerusakan bila
				// spammer memakai banyak IP sekaligus.
				const tercatat = (
					db
						.prepare(
							`SELECT COUNT(*) AS n FROM members
							 WHERE nis = ? AND created_at > datetime('now', '-1 hour')`
						)
						.get(nis) as { n: number }
				).n;
				if (tercatat >= MAKS_PER_NIS_JAM) {
					galat.nis =
						'NIS ini sudah dipakai mendaftar 3 kali dalam satu jam terakhir. Coba lagi beberapa saat lagi, atau hubungi pengurus bila ini bukan pengirimanmu.';
				}
			}
		}
		if (!TINGKAT_KELAS.includes(kelas)) galat.kelas = 'Pilih tingkat kelas.';
		if (!JURUSAN_SMK.includes(jurusan)) galat.jurusan = 'Pilih jurusan.';

		if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal_lahir)) {
			galat.tanggal_lahir = 'Tanggal lahir tidak valid.';
		} else if (!tanggalKalenderValid(tanggal_lahir)) {
			galat.tanggal_lahir = 'Tanggal lahir tidak valid — periksa kembali hari dan bulannya.';
		} else if (tanggal_lahir > hariIni() || tanggal_lahir < '1990-01-01') {
			// Calon anggota adalah pelajar SMK: batasi ke rentang lahir yang wajar.
			galat.tanggal_lahir = 'Tanggal lahir harus antara 1990-01-01 dan hari ini.';
		}

		const digitHp = no_hp.replace(/\D/g, '');
		if (!/^[0-9()+\s-]{9,25}$/.test(no_hp) || digitHp.length < 8 || digitHp.length > 15) {
			galat.no_hp = 'Nomor HP tidak valid, contoh: 0812-3456-7890.';
		}

		// Password akun anggota — dipakai untuk masuk (tab Anggota) setelah
		// pendaftaran disetujui. Batas atas mencegah scrypt menghabiskan CPU
		// untuk isian raksasa; pola sama dgn validasi password pengguna/pengurus.
		if (password.length < 6) {
			galat.password = 'Password minimal 6 karakter.';
		} else if (password.length > 128) {
			galat.password = 'Password maksimal 128 karakter.';
		} else if (passwordKonfirmasi !== password) {
			galat.password_konfirmasi = 'Konfirmasi password tidak sama dengan password di atas.';
		}

		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				nama: '',
				nis: '',
				pesan: null,
				galat,
				nilai
			} satisfies HasilDaftar);
		}

		db.prepare(
			`INSERT INTO members (nama, jenis_kelamin, nis, kelas, jurusan, tanggal_lahir, alamat, no_hp, nama_ortu, motivasi, status, token_kartu, password_hash)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
		).run(
			nama,
			jenis_kelamin,
			nis,
			kelas,
			jurusan,
			tanggal_lahir,
			alamat || null,
			no_hp,
			nama_ortu || null,
			motivasi || null,
			// Token kartu langsung dibuat sejak pendaftaran agar tautan kartu siap
			// dipakai begitu pendaftar disetujui.
			tokenKartuBaru(),
			// Akun anggota siap sejak pendaftaran: setelah pengurus menyetujui,
			// pendaftar langsung bisa masuk dgn NIS + password ini.
			hashPassword(password)
		);

		return { sukses: true, nama, nis, pesan: null, galat: null, nilai: null } satisfies HasilDaftar;
	}
};
