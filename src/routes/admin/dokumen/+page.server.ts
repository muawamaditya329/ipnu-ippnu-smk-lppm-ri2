import { fail, redirect } from '@sveltejs/kit';
import { db, type DocumentItem } from '#lib/server/db.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import { KATEGORI_DOKUMEN, escapeLike } from '#lib/utils.ts';
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
		syarat.push(
			"(judul LIKE ? ESCAPE '\\' OR deskripsi LIKE ? ESCAPE '\\' OR nama_file LIKE ? ESCAPE '\\')"
		);
		nilai.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
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

		// Semua field diperiksa sekaligus agar galat tampil per field, bukan satu per kirim.
		const galat: Record<string, string> = {};
		if (!judul) galat.judul = 'Judul dokumen wajib diisi.';
		else if (judul.length > 180) galat.judul = 'Judul maksimal 180 karakter.';
		if (deskripsi.length > 400) galat.deskripsi = 'Deskripsi maksimal 400 karakter.';
		if (kategoriRaw && !KATEGORI_DOKUMEN.includes(kategoriRaw)) {
			galat.kategori = 'Kategori tidak valid.';
		}

		/** Hasil unggahan (path + metadata file) — null bila file tidak/belum tersimpan. */
		let tersimpan: { path: string; nama: string; ukuran: number } | null = null;
		if (berkas) {
			try {
				tersimpan = {
					path: await simpanUnggahan(berkas, 'dokumen', 'dokumen'),
					nama: berkas.name,
					ukuran: berkas.size
				};
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
		} else {
			galat.file = 'Pilih file dokumen yang akan diunggah.';
		}

		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat,
				mode: 'buat',
				id: null,
				nilai
			} satisfies HasilDokumen);
		}

		// tersimpan pasti terisi: galat.file (berkas kosong) sudah dikembalikan di atas.
		const unggah = tersimpan as { path: string; nama: string; ukuran: number };

		try {
			db.prepare(
				'INSERT INTO documents (judul, deskripsi, kategori, file, nama_file, ukuran) VALUES (?, ?, ?, ?, ?, ?)'
			).run(
				judul,
				deskripsi || null,
				rapiKategori(kategoriRaw),
				unggah.path,
				unggah.nama,
				unggah.ukuran
			);
		} catch (e) {
			// Gagal menulis baris: berkas yang sudah tersimpan di disk ikut dihapus
			// agar tidak menjadi orphan tanpa pemilik.
			hapusUnggahan(unggah.path);
			throw e;
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

		const galat: Record<string, string> = {};
		if (!judul) galat.judul = 'Judul dokumen wajib diisi.';
		else if (judul.length > 180) galat.judul = 'Judul maksimal 180 karakter.';
		if (deskripsi.length > 400) galat.deskripsi = 'Deskripsi maksimal 400 karakter.';
		if (kategoriRaw && !KATEGORI_DOKUMEN.includes(kategoriRaw)) {
			galat.kategori = 'Kategori tidak valid.';
		}
		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat,
				mode: 'ubah',
				id: lama.id,
				nilai
			} satisfies HasilDokumen);
		}

		// File opsional saat ubah: diisi → ganti file lama (file lamanya ikut dihapus
		// SETELAH baris berhasil diperbarui, bukan sebelumnya).
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

			try {
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
			} catch (e) {
				// Gagal memperbarui baris: batalkan file baru agar tidak jadi orphan;
				// file lama tetap dirujuk DB sehingga tidak boleh dihapus di sini.
				hapusUnggahan(path);
				throw e;
			}

			// Baris sudah aman menunjuk file baru → baru file lama dihapus dari disk.
			if (lama.file !== path) hapusUnggahan(lama.file);
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
