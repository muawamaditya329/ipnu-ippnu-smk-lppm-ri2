import { fail, redirect } from '@sveltejs/kit';
import { hapusUnggahan } from '#lib/server/uploads.ts';
import { db, type Post } from '#lib/server/db.ts';
import { CAKUPAN_POSTS, STATUS_POSTS } from '#lib/server/berita.ts';
import { escapeLike, keNomorHalaman } from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

const PER_HALAMAN = 15;

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const cakupan = url.searchParams.get('cakupan') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const mintaHalaman = keNomorHalaman(url.searchParams.get('halaman'));

	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push("(judul LIKE ? ESCAPE '\\' OR ringkasan LIKE ? ESCAPE '\\')");
		nilai.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
	}
	if ((CAKUPAN_POSTS as readonly string[]).includes(cakupan)) {
		syarat.push('cakupan = ?');
		nilai.push(cakupan);
	}
	if ((STATUS_POSTS as readonly string[]).includes(status)) {
		syarat.push('status = ?');
		nilai.push(status);
	}
	const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM posts ${where}`).get(...nilai) as { n: number }
	).n;
	const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
	// Jepit nomor halaman agar ?halaman=99 tidak menampilkan daftar kosong.
	const halaman = Math.min(mintaHalaman, totalHalaman);

	const posts = db
		.prepare(
			`SELECT p.*, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 ${where} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`
		)
		.all(...nilai, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as Post[];

	return { posts, total, halaman, totalHalaman, q, cakupan, status };
};

export const actions: Actions = {
	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		if (!Number.isInteger(id) || id < 1) return fail(400, { galat: 'Berita tidak ditemukan.' });

		const post = db.prepare('SELECT id, cover FROM posts WHERE id = ?').get(id) as
			{ id: number; cover: string | null } | undefined;
		if (!post) return fail(404, { galat: 'Berita tidak ditemukan atau sudah terhapus.' });

		hapusUnggahan(post.cover);
		db.prepare('DELETE FROM posts WHERE id = ?').run(id);
		return { sukses: true };
	}
};
