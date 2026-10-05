import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, verifyPassword } from '#lib/server/auth.ts';
import { hapusSesiAnggota, SESI_ANGGOTA_COOKIE } from '#lib/server/auth-anggota.ts';
import { db } from '#lib/server/db.ts';
import type { Actions, PageServerLoad } from './$types';

/** Baris profil yang boleh diubah anggota sendiri — nama, kelas, status, dst. hanya lewat pengurus. */
type ProfilProfil = {
	nama: string;
	status: 'aktif' | 'alumni';
	no_hp: string | null;
	alamat: string | null;
};

/** Bentuk seragam utk semua return action agar `form?.galat` dsb. mudah ditipkan di halaman. */
type HasilProfil = {
	/** Bagian mana yang berhasil — null bila gagal validasi. */
	sukses: 'kontak' | 'password' | null;
	galat: Record<string, string> | null;
	/** Nilai no_hp/alamat yang diketik, dikembalikan saat validasi kontak gagal. */
	nilai: { no_hp: string; alamat: string } | null;
};

const kosong: HasilProfil = { sukses: null, galat: null, nilai: null };

export const load: PageServerLoad = async ({ locals }) => {
	// Lapis kedua di atas guard layout & hooks.server.ts.
	if (!locals.anggota) redirect(303, '/masuk?tab=anggota');

	const profil = db
		.prepare(
			`SELECT nama, status, no_hp, alamat FROM members
			 WHERE id = ? AND status IN ('aktif', 'alumni')`
		)
		.get(locals.anggota.id) as ProfilProfil | undefined;

	// Sesi menggantung (anggota dihapus/dinonaktifkan di antara dua permintaan)?
	if (!profil) redirect(303, '/masuk?tab=anggota');

	return { profil };
};

export const actions: Actions = {
	/** Ubah kontak (no_hp & alamat) — satu-satunya data yang anggota boleh ubah sendiri. */
	kontak: async ({ request, locals }) => {
		if (!locals.anggota) redirect(303, '/masuk?tab=anggota');

		const fd = await request.formData();
		const noHp = String(fd.get('no_hp') ?? '').trim();
		const alamat = String(fd.get('alamat') ?? '').trim();

		// Batas panjang: mengikuti maxlength formulir, diperiksa ulang di server.
		const galat: Record<string, string> = {};
		if (noHp.length > 30) galat.no_hp = 'No. HP maksimal 30 karakter.';
		else if (noHp && !/^[0-9+()\-.\s]{5,}$/.test(noHp)) {
			galat.no_hp = 'No. HP hanya boleh berisi angka, spasi, dan tanda + - ( ) .';
		}
		if (alamat.length > 200) galat.alamat = 'Alamat maksimal 200 karakter.';

		// Gagal validasi: kembalikan nilai yg diketik agar form tidak kosong kembali.
		if (Object.keys(galat).length) {
			const hasil: HasilProfil = { ...kosong, galat, nilai: { no_hp: noHp, alamat } };
			return fail(400, hasil);
		}

		// WHERE id = ? — hanya baris anggota pemilik sesi yang tersentuh.
		db.prepare('UPDATE members SET no_hp = ?, alamat = ? WHERE id = ?').run(
			noHp || null,
			alamat || null,
			locals.anggota.id
		);

		const sukses: HasilProfil = { ...kosong, sukses: 'kontak' };
		return sukses;
	},

	/**
	 * Ganti password: password lama wajib benar (verifikasi scrypt), baru minimal
	 * 6 karakter dan cocok dengan konfirmasinya. Sesi perangkat LAIN diputus agar
	 * siapa pun yang sempat mencuri sesi lama tidak tetap masuk; sesi saat ini
	 * dibiarkan hidup agar anggota tidak terkeluar sendiri.
	 */
	password: async ({ request, locals, cookies }) => {
		if (!locals.anggota) redirect(303, '/masuk?tab=anggota');

		const fd = await request.formData();
		const lama = String(fd.get('password_lama') ?? '');
		const baru = String(fd.get('password_baru') ?? '');
		const konfirmasi = String(fd.get('konfirmasi') ?? '');

		const galat: Record<string, string> = {};
		if (!lama) galat.password_lama = 'Password lama wajib diisi.';
		if (!baru) galat.password_baru = 'Password baru wajib diisi.';
		else if (baru.length < 6) galat.password_baru = 'Password baru minimal 6 karakter.';
		else if (baru.length > 128) galat.password_baru = 'Password baru maksimal 128 karakter.';
		if (!konfirmasi) galat.konfirmasi = 'Konfirmasi password wajib diisi.';
		else if (!galat.password_baru && konfirmasi !== baru) {
			galat.konfirmasi = 'Konfirmasi tidak cocok dengan password baru.';
		}

		if (Object.keys(galat).length) {
			const hasil: HasilProfil = { ...kosong, galat };
			return fail(400, hasil);
		}

		const baris = db
			.prepare(
				`SELECT password_hash FROM members
				 WHERE id = ? AND status IN ('aktif', 'alumni')`
			)
			.get(locals.anggota.id) as { password_hash: string | null } | undefined;

		// Sesi menggantung (anggota dihapus/dinonaktifkan di antara dua permintaan)?
		if (!baris) redirect(303, '/masuk?tab=anggota');
		if (!baris.password_hash || !verifyPassword(lama, baris.password_hash)) {
			// Pesan sengaja digabung: jangan bocorkan apakah akun ini punya password.
			const hasil: HasilProfil = {
				...kosong,
				galat: { password_lama: 'Password lama tidak sesuai.' }
			};
			return fail(400, hasil);
		}

		db.prepare('UPDATE members SET password_hash = ? WHERE id = ?').run(
			hashPassword(baru),
			locals.anggota.id
		);
		hapusSesiAnggota(locals.anggota.id, cookies.get(SESI_ANGGOTA_COOKIE));

		const sukses: HasilProfil = { ...kosong, sukses: 'password' };
		return sukses;
	}
};
