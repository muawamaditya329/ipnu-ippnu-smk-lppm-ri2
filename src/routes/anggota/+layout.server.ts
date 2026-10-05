import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Gerbang area anggota: seluruh halaman di bawah /anggota menuntut sesi anggota
 * (cookie sesi_anggota). Tanpa sesi → login tab Anggota. hooks.server.ts sudah
 * menjaga path yang sama; pemeriksaan ini lapis kedua sekaligus penenang
 * type-checker agar `locals.anggota` tidak lagi nullable di halaman anak.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.anggota) redirect(303, '/masuk?tab=anggota');

	// Untuk bilah atas layout: nama & status diambil dari sesi (data minim yang
	// terbukti masih sah — getSessionAnggota menolak status di luar aktif/alumni).
	return { anggota: locals.anggota };
};
