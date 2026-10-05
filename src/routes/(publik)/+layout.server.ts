import { getSettings } from '#lib/server/settings.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return { settings: getSettings(), user: locals.user, anggota: locals.anggota };
};
