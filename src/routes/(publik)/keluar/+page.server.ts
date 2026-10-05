import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/auth.ts';
import { logoutAnggota } from '#lib/server/auth-anggota.ts';
import type { Actions, PageServerLoad } from './$types';

// Buka /keluar lewat URL (bukan tombol)? Cukup kembali ke beranda.
export const load: PageServerLoad = async () => {
	redirect(303, '/');
};

// Satu endpoint keluar untuk dua jenis sesi: pengurus maupun anggota.
// Keduanya dipanggil — yang tidak ada sesinya cukup menghapus cookie kosong.
export const actions: Actions = {
	default: async ({ cookies }) => {
		logout(cookies);
		logoutAnggota(cookies);
		redirect(303, '/');
	}
};
