import { db, type Member } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const nis = (url.searchParams.get('nis') ?? '').trim();

	if (!nis) return { nis: '', member: null };

	// Bila NIS pernah dipakai lebih dari sekali, tampilkan pendaftaran terbaru.
	const member = db
		.prepare('SELECT * FROM members WHERE nis = ? ORDER BY id DESC LIMIT 1')
		.get(nis) as Member | undefined;

	return { nis, member: member ?? null };
};
