import { error } from '@sveltejs/kit';
import { db, type Post } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = db
		.prepare(
			`SELECT p.*, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 WHERE p.slug = ? AND p.status = 'terbit'`
		)
		.get(params.slug) as Post;

	if (!post) error(404, 'Berita tidak ditemukan');

	db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);

	const terkait = db
		.prepare(
			`SELECT * FROM posts WHERE status = 'terbit' AND id != ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3`
		)
		.all(post.id) as Post[];

	return { post, terkait };
};
