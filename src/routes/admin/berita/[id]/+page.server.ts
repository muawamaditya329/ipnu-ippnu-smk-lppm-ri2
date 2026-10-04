import { error, fail, redirect } from '@sveltejs/kit';
import { db, type Post } from '#lib/server/db.ts';
import { slugUnik } from '#lib/server/berita.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = db
		.prepare('SELECT p.*, u.nama AS penulis_nama FROM posts p LEFT JOIN users u ON u.id = p.penulis_id WHERE p.id = ?')
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
		const galat: Record<string, string> = {};

		if (judul.length < 5) galat.judul = 'Judul minimal 5 karakter.';
		if (konten.length < 20) galat.konten = 'Isi berita minimal 20 karakter.';
		if (Object.keys(galat).length) return fail(400, { galat });

		const lama = db.prepare('SELECT cover FROM posts WHERE id = ?').get(id) as
			| { cover: string | null }
			| undefined;
		if (!lama) error(404, 'Berita tidak ditemukan');

		let cover = lama.cover;
		const file = fd.get('cover');
		if (file instanceof File && file.size > 0) {
			try {
				cover = await simpanUnggahan(file, 'berita', 'gambar');
				if (lama.cover) hapusUnggahan(lama.cover);
			} catch (e) {
				if (e instanceof UploadError) return fail(400, { galat: { cover: e.message } });
				throw e;
			}
		}

		const status = String(fd.get('status') ?? 'draft') === 'draft' ? 'draft' : 'terbit';
		const lamaRow = db.prepare('SELECT published_at FROM posts WHERE id = ?').get(id) as
			| { published_at: string | null }
			| undefined;

		db.prepare(
			`UPDATE posts SET slug = ?, judul = ?, ringkasan = ?, konten = ?, kategori = ?, cover = ?, cakupan = ?, status = ?,
			 published_at = COALESCE(?, CASE WHEN ? = 'terbit' THEN datetime('now') ELSE published_at END),
			 updated_at = datetime('now') WHERE id = ?`
		).run(
			slugUnik(judul, id),
			judul,
			String(fd.get('ringkasan') ?? '').trim() || null,
			konten,
			String(fd.get('kategori') ?? 'kabar'),
			cover,
			['umum', 'ipnu', 'ippnu'].includes(String(fd.get('cakupan'))) ? String(fd.get('cakupan')) : 'umum',
			status,
			lamaRow?.published_at ?? null,
			status,
			id
		);

		redirect(303, '/admin/berita');
	}
};
