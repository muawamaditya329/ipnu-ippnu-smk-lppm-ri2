import { redirect } from '@sveltejs/kit';
import { hapusUnggahan } from '#lib/server/uploads.ts';
import { db, type Post } from '#lib/server/db.ts';
import type { Actions, PageServerLoad } from './$types';

const PER_HALAMAN = 15;

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const halaman = Math.max(1, Number(url.searchParams.get('halaman')) || 1);

	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push('(judul LIKE ? OR ringkasan LIKE ?)');
		nilai.push(`%${q}%`, `%${q}%`);
	}
	const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';

	const total = (db.prepare(`SELECT COUNT(*) AS n FROM posts ${where}`).get(...nilai) as { n: number }).n;
	const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

	const posts = db
		.prepare(
			`SELECT p.*, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
		)
		.all(...nilai, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as Post[];

	return { posts, total, halaman, totalHalaman, q };
};

export const actions: Actions = {
	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const id = Number(url.searchParams.get('id'));
		const post = db.prepare('SELECT id, cover FROM posts WHERE id = ?').get(id) as
			| { id: number; cover: string | null }
			| undefined;
		if (post) {
			hapusUnggahan(post.cover);
			db.prepare('DELETE FROM posts WHERE id = ?').run(id);
		}
		return { sukses: true };
	}
};
