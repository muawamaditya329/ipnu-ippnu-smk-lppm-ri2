import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { slugUnik } from '#lib/server/berita.ts';
import { simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { galat: null };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { galat: { umum: 'Sesi berakhir. Silakan masuk ulang.' } });

		const fd = await request.formData();
		const judul = String(fd.get('judul') ?? '').trim();
		const konten = String(fd.get('konten') ?? '').trim();
		const galat: Record<string, string> = {};

		if (judul.length < 5) galat.judul = 'Judul minimal 5 karakter.';
		if (konten.length < 20) galat.konten = 'Isi berita minimal 20 karakter.';
		if (Object.keys(galat).length) return fail(400, { galat });

		let cover: string | null = null;
		const file = fd.get('cover');
		if (file instanceof File && file.size > 0) {
			try {
				cover = await simpanUnggahan(file, 'berita', 'gambar');
			} catch (e) {
				if (e instanceof UploadError) return fail(400, { galat: { cover: e.message } });
				throw e;
			}
		}

		const slug = slugUnik(judul);
		const status = String(fd.get('status') ?? 'terbit') === 'draft' ? 'draft' : 'terbit';

		db.prepare(
			`INSERT INTO posts (slug, judul, ringkasan, konten, kategori, cover, cakupan, status, penulis_id, published_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			slug,
			judul,
			String(fd.get('ringkasan') ?? '').trim() || null,
			konten,
			String(fd.get('kategori') ?? 'kabar'),
			cover,
			['umum', 'ipnu', 'ippnu'].includes(String(fd.get('cakupan'))) ? String(fd.get('cakupan')) : 'umum',
			status,
			locals.user.id,
			status === 'terbit' ? new Date().toISOString() : null
		);

		redirect(303, '/admin/berita');
	}
};
