import { fail } from '@sveltejs/kit';
import { getSettings, setSetting } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

/** Kunci settings yang disimpan dari form (nilai kosong diperbolehkan, terutama sosial). */
const KUNCI = [
	'nama_organisasi',
	'periode',
	'deskripsi',
	'visi',
	'misi',
	'tentang_panjang',
	'alamat',
	'no_telp',
	'email',
	'instagram',
	'youtube',
	'tiktok'
] as const;

export const load: PageServerLoad = async () => {
	return { setelan: getSettings() };
};

export const actions: Actions = {
	simpan: async ({ request }) => {
		const fd = await request.formData();

		const nilai: Record<string, string> = {};
		for (const kunci of KUNCI) nilai[kunci] = String(fd.get(kunci) ?? '').trim();

		const galat: Record<string, string> = {};
		if (nilai.nama_organisasi.length < 3) galat.nama_organisasi = 'Nama organisasi minimal 3 karakter.';
		if (nilai.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai.email)) galat.email = 'Format email tidak valid.';

		// Gagal validasi: kembalikan nilai yg diketik agar form tidak kosong kembali.
		if (Object.keys(galat).length) return fail(400, { galat, nilai });

		for (const kunci of KUNCI) setSetting(kunci, nilai[kunci]);

		return { sukses: true };
	}
};
