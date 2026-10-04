import { fail, redirect } from '@sveltejs/kit';
import { db, type Album, type Photo } from '#lib/server/db.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

type NilaiAlbum = { judul: string; deskripsi: string; tanggal: string };

/** Baris album + kolom created_at dari SELECT a.* */
type BarisAlbum = Album & { created_at: string };

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilGaleri = {
	sukses: boolean;
	terhapus: boolean;
	galat: Record<string, string> | null;
	/** 'album' = form buat/ubah album, 'foto' = modal kelola foto, null = tidak relevan */
	mode: 'album' | 'foto' | null;
	albumId: number | null;
	nilai: NilaiAlbum | null;
};

const tanggalValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const load: PageServerLoad = async () => {
	const albums = db
		.prepare(
			`SELECT a.*,
					(SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS jumlah_foto,
					(SELECT p2.file FROM photos p2 WHERE p2.album_id = a.id ORDER BY p2.id LIMIT 1) AS cover
			 FROM albums a
			 ORDER BY a.created_at DESC, a.id DESC`
		)
		.all() as BarisAlbum[];

	const fotos = db
		.prepare('SELECT id, album_id, file, caption FROM photos ORDER BY album_id ASC, id ASC')
		.all() as Photo[];

	return { albums, fotos };
};

export const actions: Actions = {
	buat: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const deskripsi = String(fd.get('deskripsi') ?? '').trim();
		const tanggal = String(fd.get('tanggal') ?? '').trim();
		const nilai: NilaiAlbum = { judul, deskripsi, tanggal };

		const galat: Record<string, string> = {};
		if (!judul) galat.judul = 'Judul album wajib diisi.';
		if (tanggal && !tanggalValid(tanggal)) galat.tanggal = 'Tanggal tidak valid.';
		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat,
				mode: 'album',
				albumId: null,
				nilai
			} satisfies HasilGaleri);
		}

		db.prepare('INSERT INTO albums (judul, deskripsi, tanggal) VALUES (?, ?, ?)').run(
			judul,
			deskripsi || null,
			tanggal || null
		);

		return {
			sukses: true,
			terhapus: false,
			galat: null,
			mode: null,
			albumId: null,
			nilai: null
		} satisfies HasilGaleri;
	},

	ubah: async ({ url, request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		const album = db
			.prepare('SELECT id FROM albums WHERE id = ?')
			.get(Number.isInteger(id) ? id : 0) as { id: number } | undefined;
		if (!album) {
			return fail(404, {
				sukses: false,
				terhapus: false,
				galat: { umum: 'Album tidak ditemukan.' },
				mode: null,
				albumId: null,
				nilai: null
			} satisfies HasilGaleri);
		}

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const deskripsi = String(fd.get('deskripsi') ?? '').trim();
		const tanggal = String(fd.get('tanggal') ?? '').trim();
		const nilai: NilaiAlbum = { judul, deskripsi, tanggal };

		const galat: Record<string, string> = {};
		if (!judul) galat.judul = 'Judul album wajib diisi.';
		if (tanggal && !tanggalValid(tanggal)) galat.tanggal = 'Tanggal tidak valid.';
		if (Object.keys(galat).length) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat,
				mode: 'album',
				albumId: album.id,
				nilai
			} satisfies HasilGaleri);
		}

		db.prepare('UPDATE albums SET judul = ?, deskripsi = ?, tanggal = ? WHERE id = ?').run(
			judul,
			deskripsi || null,
			tanggal || null,
			album.id
		);

		return {
			sukses: true,
			terhapus: false,
			galat: null,
			mode: null,
			albumId: null,
			nilai: null
		} satisfies HasilGaleri;
	},

	/** Hapus album beserta seluruh file fotonya (baris photos terhapus otomatis oleh ON DELETE CASCADE). */
	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		const album = db
			.prepare('SELECT id FROM albums WHERE id = ?')
			.get(Number.isInteger(id) ? id : 0) as { id: number } | undefined;

		if (album) {
			const fotos = db.prepare('SELECT file FROM photos WHERE album_id = ?').all(album.id) as {
				file: string;
			}[];
			for (const f of fotos) hapusUnggahan(f.file);
			db.prepare('DELETE FROM albums WHERE id = ?').run(album.id);
		}

		return {
			sukses: true,
			terhapus: true,
			galat: null,
			mode: null,
			albumId: null,
			nilai: null
		} satisfies HasilGaleri;
	},

	/** Hapus satu foto dari album (beserta file unggahannya). */
	hapusFoto: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const fotoId = Number(url.searchParams.get('fotoId'));
		const albumId = Number(url.searchParams.get('albumId'));
		const foto = db
			.prepare('SELECT id, album_id, file FROM photos WHERE id = ?')
			.get(Number.isInteger(fotoId) ? fotoId : 0) as
			{ id: number; album_id: number; file: string } | undefined;

		if (foto) {
			hapusUnggahan(foto.file);
			db.prepare('DELETE FROM photos WHERE id = ?').run(foto.id);
		}

		return {
			sukses: true,
			terhapus: true,
			galat: null,
			mode: 'foto',
			albumId: foto?.album_id ?? (Number.isInteger(albumId) ? albumId : null),
			nilai: null
		} satisfies HasilGaleri;
	},

	/** Unggah satu atau beberapa foto ke album (caption berlaku utk seluruh unggahan). */
	unggahFoto: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const fd = await request.formData();
		const albumId = Number(fd.get('albumId'));
		const caption = String(fd.get('caption') ?? '').trim();

		const album = db
			.prepare('SELECT id FROM albums WHERE id = ?')
			.get(Number.isInteger(albumId) ? albumId : 0) as { id: number } | undefined;
		if (!album) {
			return fail(404, {
				sukses: false,
				terhapus: false,
				galat: { umum: 'Album tidak ditemukan.' },
				mode: null,
				albumId: null,
				nilai: null
			} satisfies HasilGaleri);
		}

		const files = fd.getAll('foto').filter((f): f is File => f instanceof File && f.size > 0);
		if (!files.length) {
			return fail(400, {
				sukses: false,
				terhapus: false,
				galat: { foto: 'Pilih minimal satu foto untuk diunggah.' },
				mode: 'foto',
				albumId: album.id,
				nilai: null
			} satisfies HasilGaleri);
		}

		const tersimpan: string[] = [];
		try {
			for (const file of files) {
				const path = await simpanUnggahan(file, 'galeri', 'gambar');
				tersimpan.push(path);
				db.prepare('INSERT INTO photos (album_id, file, caption) VALUES (?, ?, ?)').run(
					album.id,
					path,
					caption || null
				);
			}
		} catch (e) {
			// Gagal di tengah jalan: bersihkan file yang sudah tersimpan agar tidak jadi sampah.
			for (const p of tersimpan) hapusUnggahan(p);
			if (e instanceof UploadError) {
				return fail(400, {
					sukses: false,
					terhapus: false,
					galat: { foto: e.message },
					mode: 'foto',
					albumId: album.id,
					nilai: null
				} satisfies HasilGaleri);
			}
			throw e;
		}

		return {
			sukses: true,
			terhapus: false,
			galat: null,
			mode: 'foto',
			albumId: album.id,
			nilai: null
		} satisfies HasilGaleri;
	}
};
