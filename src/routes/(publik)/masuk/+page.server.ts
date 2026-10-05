import { fail, redirect } from '@sveltejs/kit';
import { login, loginDiblokir } from '#lib/server/auth.ts';
import { loginAnggota } from '#lib/server/auth-anggota.ts';
import { tujuanInternal } from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Sudah login? Tidak perlu login lagi — langsung ke tujuan semula / dasbor.
	// Sesi anggota diarahkan ke area anggota, sesi pengurus ke dasbor admin —
	// KECUALI yang sengaja membuka tab Anggota (mis. dari guard /anggota): formnya
	// tetap perlu tampil walau yang membuka seorang pengurus.
	if (locals.anggota) redirect(303, '/anggota');
	if (locals.user && url.searchParams.get('tab') !== 'anggota') {
		redirect(303, tujuanInternal(url.searchParams.get('lanjut')) ?? '/admin');
	}
};

export const actions: Actions = {
	// Tab "Pengurus" — username + password ke dasbor admin. Diberi nama juga
	// (bukan `default`) karena SvelteKit melarang default action bersama named action.
	pengurus: async ({ request, cookies, url, getClientAddress }) => {
		const lanjut = tujuanInternal(url.searchParams.get('lanjut')) ?? '/admin';

		const data = await request.formData();
		const username = String(data.get('username') ?? '');
		const password = String(data.get('password') ?? '');

		// `tab` ikut dikembalikan agar halaman menampilkan tab yang benar setelah gagal.
		if (!username || !password) {
			return fail(400, { tab: 'pengurus', pesan: 'Username dan password wajib diisi.', username });
		}

		// Batas panjang: membatasi kerja scrypt (verifikasi password) dan menghentikan
		// isian tak wajar sebelum menyentuh database.
		if (username.length > 100 || password.length > 200) {
			return fail(400, {
				tab: 'pengurus',
				pesan: 'Username atau password terlalu panjang.',
				username
			});
		}

		// Anti brute-force: batasi percobaan gagal per kombinasi IP + username.
		if (loginDiblokir(username, getClientAddress())) {
			return fail(429, {
				tab: 'pengurus',
				pesan: 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.',
				username
			});
		}

		const hasil = login(cookies, username, password, getClientAddress(), url);
		if (!hasil.ok) return fail(400, { tab: 'pengurus', pesan: hasil.pesan, username });

		redirect(303, lanjut);
	},

	// Tab "Anggota" — NIS + password ke area anggota.
	anggota: async ({ request, cookies, url, getClientAddress }) => {
		const data = await request.formData();
		const nis = String(data.get('nis') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!nis || !password) {
			return fail(400, { tab: 'anggota', pesan: 'NIS dan password wajib diisi.', nis });
		}

		// Batas panjang: pola sama dgn login pengurus — scrypt di atas isian tak wajar
		// tidak boleh dipakai menguras CPU.
		if (nis.length > 50 || password.length > 200) {
			return fail(400, { tab: 'anggota', pesan: 'NIS atau password terlalu panjang.', nis });
		}

		// Anti brute-force: batasi percobaan gagal per kombinasi IP + NIS.
		if (loginDiblokir(nis, getClientAddress())) {
			return fail(429, {
				tab: 'anggota',
				pesan: 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.',
				nis
			});
		}

		const hasil = loginAnggota(cookies, nis, password, getClientAddress(), url);
		if (!hasil.ok) return fail(400, { tab: 'anggota', pesan: hasil.pesan, nis });

		redirect(303, '/anggota');
	}
};
