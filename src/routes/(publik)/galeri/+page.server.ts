import { db, type Album } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Album + jumlah foto + foto pertama sebagai sampul.
	const albums = db
		.prepare(
			`SELECT a.*,
					(SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS jumlah_foto,
					(SELECT p2.file FROM photos p2 WHERE p2.album_id = a.id ORDER BY p2.id LIMIT 1) AS cover
			 FROM albums a
			 ORDER BY COALESCE(a.tanggal, substr(a.created_at, 1, 10)) DESC, a.id DESC`
		)
		.all() as Album[];

	return { albums };
};
