import { error, fail, redirect } from '@sveltejs/kit';
import { db, transaksiUnik, type Post } from '#lib/server/db.ts';
import { CAKUPAN_POSTS, KATEGORI_POSTS, slugUnik } from '#lib/server/berita.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = db
		.prepare(
			'SELECT p.*, u.nama AS penulis_nama FROM posts p LEFT JOIN users u ON u.id = p.penulis_id WHERE p.id = ?'
		)
		.get(Number(params.id)) as Post;
	if (!post) error(404, 'Berita tidak ditemukan');
	return { post };
};

export const actions: Actions = {
	simpan: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { galat: { umum: 'Sesi berakhir. Silakan masuk ulang.' } });
		const id = Number(params.id);

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const konten = String(fd.get('konten') ?? '').trim();

		// Nilai terkirim dipulihkan ke formulir bila validasi gagal.
		const nilai = {
			judul,
			ringkasan: String(fd.get('ringkasan') ?? '')
				.trim()
				.slice(0, 300),
			konten,
			kategori: String(fd.get('kategori') ?? 'kabar'),
			cakupan: String(fd.get('cakupan') ?? 'umum'),
			status: String(fd.get('status') ?? 'draft')
		};

		const galat: Record<string, string> = {};
		// Panjang maksimal diset server juga — maxlength di HTML bisa dilewati.
		if (judul.length < 5) galat.judul = 'Judul minimal 5 karakter.';
		else if (judul.length > 180) galat.judul = 'Judul maksimal 180 karakter.';
		if (konten.length < 20) galat.konten = 'Isi berita minimal 20 karakter.';
		else if (konten.length > 50_000) galat.konten = 'Isi berita maksimal 50.000 karakter.';
		// Enum: kosong → nilai bawaan; terisi tapi tidak sah → galat per field.
		if (nilai.kategori && !(KATEGORI_POSTS as readonly string[]).includes(nilai.kategori)) {
			galat.kategori = 'Kategori tidak valid.';
		}
		if (nilai.cakupan && !(CAKUPAN_POSTS as readonly string[]).includes(nilai.cakupan)) {
			galat.cakupan = 'Cakupan tidak valid.';
		}
		if (nilai.status && nilai.status !== 'draft' && nilai.status !== 'terbit') {
			galat.status = 'Status tidak valid.';
		}
		if (Object.keys(galat).length) return fail(400, { galat, nilai });

		const lama = db.prepare('SELECT cover FROM posts WHERE id = ?').get(id) as
			{ cover: string | null } | undefined;
		if (!lama) error(404, 'Berita tidak ditemukan');

		let cover = lama.cover;
		/** Path cover BARU yang sudah tersimpan di disk — dibersihkan bila UPDATE gagal. */
		let coverBaru: string | null = null;
		const file = fd.get('cover');
		if (file instanceof File && file.size > 0) {
			try {
				coverBaru = await simpanUnggahan(file, 'berita', 'gambar');
			} catch (e) {
				if (e instanceof UploadError) return fail(400, { galat: { cover: e.message }, nilai });
				throw e;
			}
			cover = coverBaru;
		}

		const status = nilai.status === 'draft' ? 'draft' : 'terbit';
		const kategori = (KATEGORI_POSTS as readonly string[]).includes(nilai.kategori)
			? nilai.kategori
			: 'kabar';
		const cakupan = (CAKUPAN_POSTS as readonly string[]).includes(nilai.cakupan)
			? nilai.cakupan
			: 'umum';
		const lamaRow = db.prepare('SELECT published_at FROM posts WHERE id = ?').get(id) as
			{ published_at: string | null } | undefined;

		try {
			// Slug dihitung ulang DI DALAM transaksi bertenaga retry (lihat berita/baru):
			// dua penyuntingan berjudul sama yang berlangsung bersamaan tidak bisa lagi
			// saling memicu bentrok UNIQUE(slug) — yang kalah menghitung ulang slug.
			transaksiUnik(() => {
				db.prepare(
					`UPDATE posts SET slug = ?, judul = ?, ringkasan = ?, konten = ?, kategori = ?, cover = ?, cakupan = ?, status = ?,
					 published_at = COALESCE(?, CASE WHEN ? = 'terbit' THEN datetime('now') ELSE published_at END),
					 updated_at = datetime('now') WHERE id = ?`
				).run(
					slugUnik(judul, id),
					judul,
					nilai.ringkasan || null,
					konten,
					kategori,
					cover,
					cakupan,
					status,
					lamaRow?.published_at ?? null,
					status,
					id
				);
			});
		} catch (e) {
			// Gagal menyimpan baris: batalkan cover baru agar tidak jadi orphan;
			// cover lama tetap dirujuk DB sehingga tidak boleh dihapus di sini.
			hapusUnggahan(coverBaru);
			throw e;
		}

		// DB sudah aman menunjuk cover baru → baru file cover lama dihapus dari disk.
		if (coverBaru && lama.cover && lama.cover !== coverBaru) hapusUnggahan(lama.cover);

		redirect(303, '/admin/berita');
	}
};
