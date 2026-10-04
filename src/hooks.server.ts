import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '#lib/server/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getSessionUser(event.cookies.get('sesi_komisariat'));

	// Lindungi semua rute /admin — kecuali pengunjung anonim yang diarahkan ke login.
	if (event.url.pathname.startsWith('/admin') && !event.locals.user) {
		redirect(303, '/masuk');
	}

	return resolve(event);
};
