import { db, type DocumentItem } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const dokumen = db
		.prepare('SELECT * FROM documents ORDER BY judul COLLATE NOCASE ASC, id ASC')
		.all() as DocumentItem[];

	return { dokumen };
};
