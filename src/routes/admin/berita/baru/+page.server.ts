import { fail, redirect } from '@sveltejs/kit';
import { db, transaksiUnik } from '#lib/server/db.ts';
import { CAKUPAN_POSTS, KATEGORI_POSTS, slugUnik } from '#lib/server/berita.ts';
import { hapusUnggahan, simpanUnggahan, UploadError } from '#lib/server/uploads.ts';
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

		// Nilai terkirim dipulihkan ke formulir bila validasi gagal.
		const nilai = {
			judul,
			ringkasan: String(fd.get('ringkasan') ?? '')
				.trim()
				.slice(0, 300),
			konten,
			kategori: String(fd.get('kategori') ?? 'kabar'),
			cakupan: String(fd.get('cakupan') ?? 'umum'),
			status: String(fd.get('status') ?? 'terbit')
		};

		const galat: Record<string, string> = {};
		// Panjang maksimal diset server juga — maxlength di HTML bisa dilewati.
		if (judul.length < 5) galat.judul = 'Judul minimal 5 karakter.';
		else if (judul.length > 180) galat.judul = 'Judul maksimal 180 karakter.';
		if (konten.length < 20) galat.konten = 'Isi berita minimal 20 karakter.';
		else if (konten.length > 50_000) galat.konten = 'Isi berita maksimal 50.000 karakter.';
		// Enum: kosong → nilai bawaan; terisi tapi tidak sah → galat per field.
		if (nilai.kategori && !(KATEGORI_POSTS as readonly string[]).includes(nilai.kategori)) {
			galat.kategori = 'Kategori tidak valid.';
		}
		if (nilai.cakupan && !(CAKUPAN_POSTS as readonly string[]).includes(nilai.cakupan)) {
			galat.cakupan = 'Cakupan tidak valid.';
		}
		if (nilai.status && nilai.status !== 'draft' && nilai.status !== 'terbit') {
			galat.status = 'Status tidak valid.';
		}
		if (Object.keys(galat).length) return fail(400, { galat, nilai });

		let cover: string | null = null;
		const file = fd.get('cover');
		if (file instanceof File && file.size > 0) {
			try {
				cover = await simpanUnggahan(file, 'berita', 'gambar');
			} catch (e) {
				if (e instanceof UploadError) return fail(400, { galat: { cover: e.message }, nilai });
				throw e;
			}
		}

		const status = nilai.status === 'draft' ? 'draft' : 'terbit';
		const kategori = (KATEGORI_POSTS as readonly string[]).includes(nilai.kategori)
			? nilai.kategori
			: 'kabar';
		const cakupan = (CAKUPAN_POSTS as readonly string[]).includes(nilai.cakupan)
			? nilai.cakupan
			: 'umum';

		const penulisId = locals.user.id;
		try {
			// Slug dihitung & INSERT dijalankan dalam SATU transaksi bertenaga retry:
			// cek-slug-lalu-tulis yang terpisah bisa saja ditembus dua kiriman berjudul
			// sama (atau dua proses server) — keduanya lolos cek, lalu satu kena
			// UNIQUE(slug) jadi error 500. Dengan transaksi + pengulangan, yang kalah
			// balik menghitung ulang slug (judul-2) dan berhasil tersimpan.
			transaksiUnik(() => {
				db.prepare(
					`INSERT INTO posts (slug, judul, ringkasan, konten, kategori, cover, cakupan, status, penulis_id, published_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'terbit' THEN datetime('now') END)`
				).run(
					slugUnik(judul),
					judul,
					nilai.ringkasan || null,
					konten,
					kategori,
					cover,
					cakupan,
					status,
					penulisId,
					status
				);
			});
		} catch (e) {
			// Gagal menulis baris (mis. bentrok slug): cover yang sudah tersimpan di disk
			// ikut dihapus agar tidak menjadi file orphan tanpa pemilik.
			hapusUnggahan(cover);
			throw e;
		}

		redirect(303, '/admin/berita');
	}
};
