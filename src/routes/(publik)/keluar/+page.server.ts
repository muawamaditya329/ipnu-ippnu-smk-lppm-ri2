import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		logout(cookies);
		redirect(303, '/');
	}
};
