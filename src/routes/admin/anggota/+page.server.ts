import { fail, redirect } from '@sveltejs/kit';
import { db, nextRegNumber, type Member } from '#lib/server/db.ts';
import { LABEL_STATUS_MEMBER } from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

const PER_HALAMAN = 20;
const STATUS_VALID = ['pending', 'aktif', 'ditolak', 'alumni'];

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilAksi = {
	sukses: boolean;
	pesan: string;
	/** Teks CSV siap unduh (action ?/csv). Null pada aksi lain. */
	csv: string | null;
};

/** Susun klausa WHERE dari filter pencarian — dipakai load & action csv. */
function bangunFilter(q: string, status: string, jk: string) {
	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push('(nama LIKE ? OR nis LIKE ?)');
		nilai.push(`%${q}%`, `%${q}%`);
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
		(db.prepare('SELECT id, nama, jenis_kelamin, status FROM members WHERE id = ?').get(id) as
			| { id: number; nama: string; jenis_kelamin: 'L' | 'P'; status: Member['status'] }
			| undefined) ?? null
	);
}

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const statusMentah = url.searchParams.get('status') ?? '';
	const jkMentah = url.searchParams.get('jk') ?? '';
	const status = STATUS_VALID.includes(statusMentah) ? statusMentah : '';
	const jk = jkMentah === 'L' || jkMentah === 'P' ? jkMentah : '';
	const halaman = Math.max(1, Number(url.searchParams.get('halaman')) || 1);

	const { where, nilai } = bangunFilter(q, status, jk);

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM members ${where}`).get(...nilai) as { n: number }
	).n;
	const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

	// Pendaftar menunggu verifikasi ditampilkan paling atas agar cepat ditindaklanjuti.
	const anggota = db
		.prepare(
			`SELECT * FROM members ${where}
			 ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'aktif' THEN 1 WHEN 'alumni' THEN 2 ELSE 3 END,
								created_at DESC
			 LIMIT ? OFFSET ?`
		)
		.all(...nilai, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as Member[];

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

		const noReg = nextRegNumber(anggota.jenis_kelamin);
		db.prepare(
			`UPDATE members SET no_reg = ?, status = 'aktif', approved_at = datetime('now'), approved_by = ? WHERE id = ?`
		).run(noReg, locals.user.id, anggota.id);

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

		db.prepare(
			`UPDATE members SET status = 'ditolak', catatan = 'Ditolak oleh pengurus' WHERE id = ?`
		).run(anggota.id);

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

		db.prepare(`UPDATE members SET status = 'alumni' WHERE id = ?`).run(anggota.id);

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

		db.prepare(`UPDATE members SET status = 'aktif' WHERE id = ?`).run(anggota.id);

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

		db.prepare('DELETE FROM members WHERE id = ?').run(anggota.id);

		return {
			sukses: true,
			pesan: `Data anggota ${anggota.nama} dihapus.`,
			csv: null
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
			return /[";\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
		};

		const kepala = [
			'No',
			'Nama',
			'JK',
			'NIS',
			'Kelas',
			'Jurusan',
			'No HP',
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
				LABEL_STATUS_MEMBER[m.status] ?? m.status,
				m.no_reg ?? '',
				m.created_at.slice(0, 10)
			]
				.map(amanCsv)
				.join(';')
		);

		// Prefiks BOM (U+FEFF) agar Excel membaca berkas sebagai UTF-8.
		const csv = ['\uFEFF' + kepala.join(';'), ...isi].join('\r\n');

		return { sukses: true, pesan: '', csv } satisfies HasilAksi;
	}
};
