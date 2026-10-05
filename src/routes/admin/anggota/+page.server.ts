import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from '#lib/server/auth.ts';
import { hapusSesiAnggota } from '#lib/server/auth-anggota.ts';
import { db, nextRegNumber, transaksiUnik, type Member } from '#lib/server/db.ts';
import {
	LABEL_STATUS_MEMBER,
	escapeLike,
	hariIni,
	keNomorHalaman,
	tanggalWib
} from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

const PER_HALAMAN = 20;
const STATUS_VALID = ['pending', 'aktif', 'ditolak', 'alumni'];

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilAksi = {
	sukses: boolean;
	pesan: string;
	/** Teks CSV siap unduh (action ?/csv). Null pada aksi lain. */
	csv: string | null;
	/** Galat per isian (action ?/password). Null/tanpa pada aksi lain. */
	galat?: Record<string, string> | null;
	/** Anggota yang modal passwordnya harus dibuka ulang setelah gagal validasi. */
	anggotaId?: number | null;
	anggotaNama?: string | null;
};

/** Baris anggota yang dikirim ke tabel halaman — tanpa password_hash. */
type BarisAnggota = Pick<
	Member,
	| 'id'
	| 'no_reg'
	| 'nama'
	| 'jenis_kelamin'
	| 'nis'
	| 'kelas'
	| 'jurusan'
	| 'no_hp'
	| 'motivasi'
	| 'status'
	| 'created_at'
	| 'token_kartu'
> & {
	/** 1 bila anggota sudah punya akun (password_hash terisi) — sumber badge di tabel. */
	punya_akun: number;
};

/** Susun klausa WHERE dari filter pencarian — dipakai load & action csv. */
function bangunFilter(q: string, status: string, jk: string) {
	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push("(nama LIKE ? ESCAPE '\\' OR nis LIKE ? ESCAPE '\\')");
		nilai.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
	}
	if (STATUS_VALID.includes(status)) {
		syarat.push('status = ?');
		nilai.push(status);
	}
	if (jk === 'L' || jk === 'P') {
		syarat.push('jenis_kelamin = ?');
		nilai.push(jk);
	}
	return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', nilai };
}

function ambilAnggota(url: URL) {
	const id = Number(url.searchParams.get('id'));
	if (!Number.isInteger(id) || id <= 0) return null;
	return (
		(db.prepare('SELECT id, nama, nis, jenis_kelamin, status FROM members WHERE id = ?').get(id) as
			| {
					id: number;
					nama: string;
					nis: string | null;
					jenis_kelamin: 'L' | 'P';
					status: Member['status'];
			  }
			| undefined) ?? null
	);
}

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const statusMentah = url.searchParams.get('status') ?? '';
	const jkMentah = url.searchParams.get('jk') ?? '';
	const status = STATUS_VALID.includes(statusMentah) ? statusMentah : '';
	const jk = jkMentah === 'L' || jkMentah === 'P' ? jkMentah : '';
	const mintaHalaman = keNomorHalaman(url.searchParams.get('halaman'));

	const { where, nilai } = bangunFilter(q, status, jk);

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM members ${where}`).get(...nilai) as { n: number }
	).n;
	const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
	// Jepit nomor halaman agar ?halaman=9999 tidak menampilkan daftar kosong.
	const halaman = Math.min(mintaHalaman, totalHalaman);

	// Pendaftar menunggu verifikasi ditampilkan paling atas agar cepat ditindaklanjuti.
	// Kolom dipilih eksplisit (bukan SELECT *) agar password_hash tidak ikut
	// terserialisasi ke payload klien — keberadaan akun cukup diwakili flag
	// punya_akun yang dipakai badge di tabel.
	const anggota = db
		.prepare(
			`SELECT id, no_reg, nama, jenis_kelamin, nis, kelas, jurusan, no_hp, motivasi, status, created_at, token_kartu,
					(password_hash IS NOT NULL) AS punya_akun
			 FROM members ${where}
			 ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'aktif' THEN 1 WHEN 'alumni' THEN 2 ELSE 3 END,
								created_at DESC
			 LIMIT ? OFFSET ?`
		)
		.all(...nilai, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as BarisAnggota[];

	const statistik = db
		.prepare(
			`SELECT COALESCE(SUM(status = 'aktif'), 0) AS aktif,
					COALESCE(SUM(status = 'pending'), 0) AS menunggu,
					COALESCE(SUM(status = 'alumni'), 0) AS alumni,
					COALESCE(SUM(status = 'ditolak'), 0) AS ditolak
			 FROM members`
		)
		.get() as { aktif: number; menunggu: number; alumni: number; ditolak: number };

	return { anggota, total, halaman, totalHalaman, q, status, jk, statistik };
};

export const actions: Actions = {
	setujui: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null
			} satisfies HasilAksi);
		}
		if (anggota.status !== 'pending') {
			return fail(400, {
				sukses: false,
				pesan: `${anggota.nama} sudah diproses sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		// Satu transaksi: hitung nomor baru & simpan sekaligus, agar dua
		// persetujuan berurutan tak pernah menghasilkan no_reg kembar.
		// Kunci ganda utk kiriman ganda (double submit):
		//  1. UPDATE diberi syarat `status = 'pending'` di WHERE — hanya kiriman
		//     yang benar-benar mengubah baris (changes = 1) yang dianggap berhasil,
		//     jadi kiriman kedua tidak menimpa no_reg yang sudah terbit;
		//  2. transaksi + batasan UNIQUE(no_reg) menjaga nomor tetap tunggal
		//     bila dua pendaftar berbeda disetujui hampir bersamaan.
		// transaksiUnik memakai BEGIN IMMEDIATE + pengulangan: bila dua proses
		// server menghitung nomor sama persis, yang kena UNIQUE(no_reg) menghitung
		// ulang dari tabel terkini dan berhasil — bukan error 500 ke pengurus.
		const userId = locals.user.id;
		const noReg = transaksiUnik((): string | null => {
			const id = anggota.id;
			let nomor = nextRegNumber(anggota.jenis_kelamin);
			// Pengaman ekstra: bila nomor kebetulan sudah terpakai, naikkan sampai bebas.
			const dipakai = db.prepare('SELECT 1 FROM members WHERE no_reg = ?');
			for (let i = 0; i < 9999 && dipakai.get(nomor); i++) {
				const bagian = nomor.split('/');
				bagian[2] = String(Number(bagian[2]) + 1).padStart(4, '0');
				nomor = bagian.join('/');
			}
			const hasil = db
				.prepare(
					`UPDATE members SET no_reg = ?, status = 'aktif', approved_at = datetime('now'), approved_by = ?
					 WHERE id = ? AND status = 'pending'`
				)
				.run(nomor, userId, id);
			// changes = 0 → baris sudah diproses/dihapus di antara dua kiriman.
			return hasil.changes === 1 ? nomor : null;
		});

		if (noReg === null) {
			return fail(400, {
				sukses: false,
				pesan: `${anggota.nama} sudah diproses sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		return {
			sukses: true,
			pesan: `${anggota.nama} disetujui sebagai anggota aktif dengan nomor registrasi ${noReg}.`,
			csv: null
		} satisfies HasilAksi;
	},

	tolak: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null
			} satisfies HasilAksi);
		}
		if (anggota.status !== 'pending') {
			return fail(400, {
				sukses: false,
				pesan: 'Hanya pendaftar yang masih menunggu verifikasi yang bisa ditolak.',
				csv: null
			} satisfies HasilAksi);
		}

		// Catatan ini dibaca calon anggota di halaman Cek Status.
		// Tanggalnya hari kalender WIB — bukan tanggal UTC (bisa selisih sehari malam hari).
		// Syarat `status = 'pending'` di WHERE: bila pengurus lain menyetujui
		// pendaftar yang sama di saat bersamaan, penolakan ini tidak jalan —
		// anggota aktif tak bisa terflip menjadi 'ditolak' dengan no_reg masih menempel.
		const hasil = db
			.prepare(
				`UPDATE members SET status = 'ditolak', catatan = ? WHERE id = ? AND status = 'pending'`
			)
			.run(`Ditolak oleh ${locals.user.nama} pada ${hariIni()}.`, anggota.id);
		if (hasil.changes === 0) {
			return fail(400, {
				sukses: false,
				pesan: `${anggota.nama} sudah diproses sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		return {
			sukses: true,
			pesan: `Pendaftaran ${anggota.nama} ditolak. Calon anggota bisa melihat catatan ini di halaman cek status.`,
			csv: null
		} satisfies HasilAksi;
	},

	alumni: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null
			} satisfies HasilAksi);
		}
		if (anggota.status !== 'aktif') {
			return fail(400, {
				sukses: false,
				pesan: 'Hanya anggota aktif yang bisa dijadikan alumni.',
				csv: null
			} satisfies HasilAksi);
		}

		// no_reg TIDAK disentuh di sini maupun saat diaktifkan kembali — nomor
		// registrasi alumni tetap miliknya sepanjang masa.
		const hasil = db
			.prepare(`UPDATE members SET status = 'alumni' WHERE id = ? AND status = 'aktif'`)
			.run(anggota.id);
		if (hasil.changes === 0) {
			return fail(400, {
				sukses: false,
				pesan: `${anggota.nama} sudah diproses sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		return {
			sukses: true,
			pesan: `${anggota.nama} kini tercatat sebagai alumni.`,
			csv: null
		} satisfies HasilAksi;
	},

	aktifkan: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null
			} satisfies HasilAksi);
		}
		if (anggota.status !== 'alumni') {
			return fail(400, {
				sukses: false,
				pesan: 'Hanya alumni yang bisa diaktifkan kembali.',
				csv: null
			} satisfies HasilAksi);
		}

		const hasil = db
			.prepare(`UPDATE members SET status = 'aktif' WHERE id = ? AND status = 'alumni'`)
			.run(anggota.id);
		if (hasil.changes === 0) {
			return fail(400, {
				sukses: false,
				pesan: `${anggota.nama} sudah diproses sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		return {
			sukses: true,
			pesan: `${anggota.nama} diaktifkan kembali sebagai anggota.`,
			csv: null
		} satisfies HasilAksi;
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null
			} satisfies HasilAksi);
		}

		// Hapus permanen aman utk status apa pun (termasuk anggota aktif): tidak ada
		// tabel lain yang merujuk members (kas/pengguna memakai users.id), dan no_reg
		// yang dibebaskan tidak akan dipakai ulang karena nextRegNumber mengambil
		// nomor dari no_reg TERTINGGI yang tersisa, bukan dari hitungan baris.
		const hasil = db.prepare('DELETE FROM members WHERE id = ?').run(anggota.id);
		if (hasil.changes === 0) {
			return fail(404, {
				sukses: false,
				pesan: `Data anggota ${anggota.nama} sudah terhapus sebelumnya.`,
				csv: null
			} satisfies HasilAksi);
		}

		return {
			sukses: true,
			pesan: `Data anggota ${anggota.nama} dihapus.`,
			csv: null
		} satisfies HasilAksi;
	},

	/**
	 * Atur password akun anggota — setelah ini anggota bisa masuk lewat tab
	 * Anggota dengan NIS + password ini (statusnya tetap menentukan: pending
	 * belum bisa masuk sampai disetujui).
	 */
	password: async ({ url, request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const anggota = ambilAnggota(url);
		if (!anggota) {
			return fail(404, {
				sukses: false,
				pesan: 'Data anggota tidak ditemukan.',
				csv: null,
				galat: null,
				anggotaId: null,
				anggotaNama: null
			} satisfies HasilAksi);
		}

		const fd = await request.formData();
		const password = String(fd.get('password') ?? '');

		// Pola validasi sama dgn reset password pengguna: batas bawah menjaga
		// kualitas akun, batas atas mencegah scrypt menghabiskan CPU utk isian raksasa.
		const galat: Record<string, string> = {};
		if (password.length < 6) galat.password = 'Password minimal 6 karakter.';
		else if (password.length > 128) galat.password = 'Password maksimal 128 karakter.';

		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				pesan: '',
				csv: null,
				galat,
				anggotaId: anggota.id,
				anggotaNama: anggota.nama
			} satisfies HasilAksi);
		}

		db.prepare('UPDATE members SET password_hash = ? WHERE id = ?').run(
			hashPassword(password),
			anggota.id
		);
		// Sesi lama si anggota dimatikan agar pihak yang memegang akses lama
		// tidak tetap masuk setelah passwordnya diganti (pola reset password pengguna).
		hapusSesiAnggota(anggota.id);

		return {
			sukses: true,
			pesan: `Password akun ${anggota.nama} disimpan. Anggota bisa masuk dengan NIS ${anggota.nis ?? '—'} dan password baru itu lewat tab Anggota.`,
			csv: null,
			galat: null,
			anggotaId: null,
			anggotaNama: null
		} satisfies HasilAksi;
	},

	/** Unduh CSV seluruh anggota sesuai filter aktif. */
	csv: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const fd = await request.formData();
		const q = String(fd.get('q') ?? '').trim();
		const status = String(fd.get('status') ?? '');
		const jk = String(fd.get('jk') ?? '');
		const { where, nilai } = bangunFilter(q, status, jk);

		const baris = db
			.prepare(`SELECT * FROM members ${where} ORDER BY jenis_kelamin ASC, nama ASC`)
			.all(...nilai) as Member[];

		const amanCsv = (isi: unknown) => {
			const s = String(isi ?? '');
			// Netralisir formula injection: sel yang diawali karakter pemicu rumus
			// spreadsheet (= @ tab CR) diberi spasi di depan agar tidak dieksekusi
			// saat berkas dibuka di Excel/Sheets. Data tetap terbaca utuh.
			const aman = /^[=@\t\r]/.test(s) ? ` ${s}` : s;
			return /[";\n\r]/.test(aman) ? `"${aman.replaceAll('"', '""')}"` : aman;
		};

		const kepala = [
			'No',
			'Nama',
			'JK',
			'NIS',
			'Kelas',
			'Jurusan',
			'No HP',
			'Motivasi',
			'Status',
			'No Reg',
			'Tanggal Daftar'
		];
		const isi = baris.map((m, i) =>
			[
				i + 1,
				m.nama,
				m.jenis_kelamin === 'L' ? 'Putra' : 'Putri',
				m.nis ?? '',
				m.kelas ?? '',
				m.jurusan ?? '',
				m.no_hp ?? '',
				m.motivasi ?? '',
				LABEL_STATUS_MEMBER[m.status] ?? m.status,
				m.no_reg ?? '',
				// created_at adalah timestamp UTC — tampilkan tanggal kalendernya versi WIB.
				tanggalWib(m.created_at)
			]
				.map(amanCsv)
				.join(';')
		);

		// Prefiks BOM (U+FEFF) agar Excel membaca berkas sebagai UTF-8.
		const csv = ['\uFEFF' + kepala.join(';'), ...isi].join('\r\n');

		return { sukses: true, pesan: '', csv } satisfies HasilAksi;
	}
};
