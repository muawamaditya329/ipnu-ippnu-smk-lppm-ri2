import { fail, redirect } from '@sveltejs/kit';
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

/**
 * Batas panjang per kunci — mencerminkan maxlength di formulir (kolom teks)
 * plus batas longgar untuk textarea panjang (visi/misi/tentang). Server tetap
 * memeriksa karena maxlength di HTML bisa dilewati.
 */
const BATAS_PANJANG: Record<(typeof KUNCI)[number], number> = {
	nama_organisasi: 150,
	periode: 40,
	deskripsi: 300,
	visi: 1000,
	misi: 3000,
	tentang_panjang: 20_000,
	alamat: 200,
	no_telp: 30,
	email: 100,
	instagram: 60,
	youtube: 100,
	tiktok: 60
};

export const actions: Actions = {
	simpan: async ({ request, locals }) => {
		// Pemeriksaan ganda di dalam action (hooks sudah menjaga /admin) — pola yang
		// sama dipakai semua action admin lain.
		if (!locals.user) redirect(303, '/masuk');

		const fd = await request.formData();

		const nilai: Record<string, string> = {};
		for (const kunci of KUNCI) nilai[kunci] = String(fd.get(kunci) ?? '').trim();

		// Handle sosial media disimpan tanpa '@' di awal agar tautan footer/tentang
		// (mis. https://youtube.com/@handle) tidak menjadi ganda 'https://youtube.com/@@handle'
		// bila pengurus mengetik '@handle' di form.
		for (const kunci of ['instagram', 'youtube', 'tiktok']) {
			nilai[kunci] = nilai[kunci].replace(/^@+/, '').trim();
		}

		const galat: Record<string, string> = {};
		if (nilai.nama_organisasi.length < 3)
			galat.nama_organisasi = 'Nama organisasi minimal 3 karakter.';
		for (const kunci of KUNCI) {
			if (!galat[kunci] && nilai[kunci].length > BATAS_PANJANG[kunci]) {
				galat[kunci] = `Maksimal ${BATAS_PANJANG[kunci].toLocaleString('id-ID')} karakter.`;
			}
		}
		if (nilai.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai.email))
			galat.email = 'Format email tidak valid.';

		// Gagal validasi: kembalikan nilai yg diketik agar form tidak kosong kembali.
		if (Object.keys(galat).length) return fail(400, { galat, nilai });

		for (const kunci of KUNCI) setSetting(kunci, nilai[kunci]);

		return { sukses: true };
	}
};
