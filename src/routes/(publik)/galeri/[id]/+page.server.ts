import { error } from '@sveltejs/kit';
import { db, type Album, type Photo } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const album = db
		.prepare(
			`SELECT a.*,
					(SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS jumlah_foto,
					(SELECT p2.file FROM photos p2 WHERE p2.album_id = a.id ORDER BY p2.id LIMIT 1) AS cover
			 FROM albums a
			 WHERE a.id = ?`
		)
		.get(Number.isInteger(id) ? id : 0) as Album | undefined;

	if (!album) error(404, 'Album tidak ditemukan');

	const fotos = db
		.prepare('SELECT id, album_id, file, caption FROM photos WHERE album_id = ? ORDER BY id ASC')
		.all(album.id) as Photo[];

	return { album, fotos };
};
