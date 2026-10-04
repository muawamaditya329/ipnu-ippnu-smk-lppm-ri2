import { fail, redirect } from '@sveltejs/kit';
import { login } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/admin');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') ?? '');
		const password = String(data.get('password') ?? '');

		if (!username || !password) {
			return fail(400, { pesan: 'Username dan password wajib diisi.', username });
		}

		const hasil = login(cookies, username, password);
		if (!hasil.ok) return fail(400, { pesan: hasil.pesan, username });

		redirect(303, '/admin');
	}
};
