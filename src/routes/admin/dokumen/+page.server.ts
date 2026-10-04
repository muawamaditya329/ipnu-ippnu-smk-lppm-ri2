import { fail, redirect } from '@sveltejs/kit';
import { db, type DocumentItem } from '#lib/server/db.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import { KATEGORI_DOKUMEN } from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

type NilaiDokumen = { judul: string; deskripsi: string; kategori: string };

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilDokumen = {
	sukses: boolean;
	terhapus: boolean;
	galat: Record<string, string> | null;
	/** 'buat' | 'ubah' = modal form dokumen, null = tidak relevan */
	mode: 'buat' | 'ubah' | null;
	id: number | null;
	nilai: NilaiDokumen | null;
};

const rapiKategori = (raw: string) => (KATEGORI_DOKUMEN.includes(raw) ? raw : 'Umum');

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();

	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push('(judul LIKE ? OR deskripsi LIKE ? OR nama_file LIKE ?)');
		nilai.push(`%${q}%`, `%${q}%`, `%${q}%`);
	}
	const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';

	const dokumen = db
		.prepare(`SELECT * FROM documents ${where} ORDER BY created_at DESC, id DESC`)
		.all(...nilai) as DocumentItem[];

	const ringkas = db
		.prepare(
			`SELECT COUNT(*) AS jumlah, COALESCE(SUM(downloads), 0) AS unduhan FROM documents ${where}`
		)
		.get(...nilai) as { jumlah: number; unduhan: number };

	return { dokumen, jumlah: ringkas.jumlah, unduhan: ringkas.unduhan, q };
};

export const actions: Actions = {
	buat: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const deskripsi = String(fd.get('deskripsi') ?? '').trim();
		const kategoriRaw = String(fd.get('kategori') ?? '').trim();
		const nilai: NilaiDokumen = { judul, deskripsi, kategori: kategoriRaw };

		const file = fd.get('file');
		const berkas = file instanceof File && file.size > 0 ? file : null;

		if (!judul) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat: { judul: 'Judul dokumen wajib diisi.' },
				mode: 'buat',
				id: null,
				nilai
			} satisfies HasilDokumen);
		}
		if (!berkas) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat: { file: 'Pilih file dokumen yang akan diunggah.' },
				mode: 'buat',
				id: null,
				nilai
			} satisfies HasilDokumen);
		}

		let path: string;
		try {
			path = await simpanUnggahan(berkas, 'dokumen', 'dokumen');
		} catch (e) {
			if (e instanceof UploadError) {
				return fail(400, {
					sukses: false,
					terhapus: false,
					galat: { file: e.message },
					mode: 'buat',
					id: null,
					nilai
				} satisfies HasilDokumen);
			}
			throw e;
		}

		db.prepare(
			'INSERT INTO documents (judul, deskripsi, kategori, file, nama_file, ukuran) VALUES (?, ?, ?, ?, ?, ?)'
		).run(judul, deskripsi || null, rapiKategori(kategoriRaw), path, berkas.name, berkas.size);

		return {
			sukses: true,
			terhapus: false,
			galat: null,
			mode: null,
			id: null,
			nilai: null
		} satisfies HasilDokumen;
	},

	ubah: async ({ url, request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		const lama = db
			.prepare('SELECT * FROM documents WHERE id = ?')
			.get(Number.isInteger(id) ? id : 0) as DocumentItem | undefined;
		if (!lama) {
			return fail(404, {
				sukses: false,
				terhapus: false,
				galat: { umum: 'Dokumen tidak ditemukan.' },
				mode: null,
				id: null,
				nilai: null
			} satisfies HasilDokumen);
		}

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const deskripsi = String(fd.get('deskripsi') ?? '').trim();
		const kategoriRaw = String(fd.get('kategori') ?? '').trim();
		const nilai: NilaiDokumen = { judul, deskripsi, kategori: kategoriRaw };

		if (!judul) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat: { judul: 'Judul dokumen wajib diisi.' },
				mode: 'ubah',
				id: lama.id,
				nilai
			} satisfies HasilDokumen);
		}

		// File opsional saat ubah: diisi → ganti file lama (file lamanya ikut dihapus).
		const file = fd.get('file');
		if (file instanceof File && file.size > 0) {
			let path: string;
			try {
				path = await simpanUnggahan(file, 'dokumen', 'dokumen');
			} catch (e) {
				if (e instanceof UploadError) {
					return fail(400, {
						sukses: false,
						terhapus: false,
						galat: { file: e.message },
						mode: 'ubah',
						id: lama.id,
						nilai
					} satisfies HasilDokumen);
				}
				throw e;
			}

			hapusUnggahan(lama.file);
			db.prepare(
				'UPDATE documents SET judul = ?, deskripsi = ?, kategori = ?, file = ?, nama_file = ?, ukuran = ? WHERE id = ?'
			).run(
				judul,
				deskripsi || null,
				rapiKategori(kategoriRaw),
				path,
				file.name,
				file.size,
				lama.id
			);
		} else {
			db.prepare('UPDATE documents SET judul = ?, deskripsi = ?, kategori = ? WHERE id = ?').run(
				judul,
				deskripsi || null,
				rapiKategori(kategoriRaw),
				lama.id
			);
		}

		return {
			sukses: true,
			terhapus: false,
			galat: null,
			mode: null,
			id: null,
			nilai: null
		} satisfies HasilDokumen;
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		const dokumen = db
			.prepare('SELECT id, file FROM documents WHERE id = ?')
			.get(Number.isInteger(id) ? id : 0) as { id: number; file: string } | undefined;

		if (dokumen) {
			hapusUnggahan(dokumen.file);
			db.prepare('DELETE FROM documents WHERE id = ?').run(dokumen.id);
		}

		return {
			sukses: true,
			terhapus: true,
			galat: null,
			mode: null,
			id: null,
			nilai: null
		} satisfies HasilDokumen;
	}
};
