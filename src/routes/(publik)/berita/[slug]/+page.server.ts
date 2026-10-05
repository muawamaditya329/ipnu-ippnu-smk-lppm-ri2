import { error } from '@sveltejs/kit';
import { db, type Post } from '#lib/server/db.ts';
import { KOLOM_POSTS } from '#lib/server/berita.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// Tambah hitungan baca lebih dulu supaya angka yang tampil sudah termasuk kunjungan ini.
	const ada = db
		.prepare(`SELECT id FROM posts WHERE slug = ? AND status = 'terbit'`)
		.get(params.slug) as { id: number } | undefined;

	if (!ada) error(404, 'Berita tidak ditemukan');

	db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(ada.id);

	const post = db
		.prepare(
			`SELECT ${KOLOM_POSTS}, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 WHERE p.slug = ? AND p.status = 'terbit'`
		)
		.get(params.slug) as Post;

	// Terkait: utamakan kategori & cakupan yang sama, lalu yang terbaru.
	const terkait = db
		.prepare(
			`SELECT ${KOLOM_POSTS}, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 WHERE p.status = 'terbit' AND p.id != ?
			 ORDER BY (p.kategori = ?) DESC, (p.cakupan = ? OR p.cakupan = 'umum') DESC,
			          COALESCE(p.published_at, p.created_at) DESC
			 LIMIT 3`
		)
		.all(post.id, post.kategori, post.cakupan) as Post[];

	return { post, terkait };
};
