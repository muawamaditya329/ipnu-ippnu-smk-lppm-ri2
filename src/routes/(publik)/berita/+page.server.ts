import { db, type Post } from '#lib/server/db.ts';
import { escapeLike, keNomorHalaman } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

const PER_HALAMAN = 9;

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const cakupan = url.searchParams.get('cakupan') ?? '';
	const mintaHalaman = keNomorHalaman(url.searchParams.get('halaman'));

	const syarat: string[] = ["status = 'terbit'"];
	const nilai: unknown[] = [];
	if (q) {
		syarat.push("(judul LIKE ? ESCAPE '\\' OR ringkasan LIKE ? ESCAPE '\\')");
		nilai.push(`%${escapeLike(q)}%`, `%${escapeLike(q)}%`);
	}
	if (cakupan === 'ipnu' || cakupan === 'ippnu') {
		syarat.push('cakupan = ?');
		nilai.push(cakupan);
	}
	const where = `WHERE ${syarat.join(' AND ')}`;

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
			 ${where} ORDER BY COALESCE(p.published_at, p.created_at) DESC
			 LIMIT ? OFFSET ?`
		)
		.all(...nilai, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as Post[];

	return { posts, total, halaman, totalHalaman, q, cakupan };
};
