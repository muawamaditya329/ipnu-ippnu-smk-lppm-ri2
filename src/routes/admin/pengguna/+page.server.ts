import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import type { Actions, PageServerLoad } from './$types';

type BarisPengguna = {
	id: number;
	nama: string;
	username: string;
	role: 'admin' | 'pengurus';
	aktif: number;
	created_at: string;
};

type NilaiForm = { nama: string; username: string; role: string };

/** Bentuk seragam utk semua return action agar `form?.galat` dsb. mudah ditipkan di halaman. */
type HasilAksi = {
	sukses: boolean;
	pesan: string | null;
	galat: Record<string, string> | null;
	nilai: NilaiForm | null;
	/** Modal yang harus dibuka ulang setelah gagal validasi. */
	modal: 'baru' | 'reset' | null;
	/** Pengguna target aksi reset password (utk membuka ulang modalnya). */
	userId: number | null;
	userNama: string | null;
};

const REGEX_USERNAME = /^[a-z0-9_.]{3,20}$/;

/** Kerangka return action yang belum berisi apa pun (di-spread lalu dioverride per aksi). */
const kosong = {
	sukses: false,
	pesan: null,
	galat: null,
	nilai: null,
	modal: null,
	userId: null,
	userNama: null
};

function dilarang(pesan = 'Hanya admin yang dapat melakukan tindakan ini.') {
	return fail(403, { ...kosong, sukses: false, pesan } satisfies HasilAksi);
}

function tidakDitemukan(pesan = 'Pengguna tidak ditemukan.') {
	return fail(404, { ...kosong, sukses: false, pesan } satisfies HasilAksi);
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') redirect(303, '/admin');

	const users = db
		.prepare(
			`SELECT id, nama, username, role, aktif, created_at FROM users
			 ORDER BY (role = 'admin') DESC, nama ASC`
		)
		.all() as BarisPengguna[];

	return { users };
};

export const actions: Actions = {
	buat: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		if (locals.user.role !== 'admin') return dilarang();

		const fd = await request.formData();
		const nama = String(fd.get('nama') ?? '').trim();
		const username = String(fd.get('username') ?? '').trim().toLowerCase();
		const password = String(fd.get('password') ?? '');
		const role = String(fd.get('role') ?? 'pengurus');

		const nilai: NilaiForm = { nama, username, role };
		const galat: Record<string, string> = {};

		if (nama.length < 3) galat.nama = 'Nama minimal 3 karakter.';
		if (!REGEX_USERNAME.test(username)) {
			galat.username = 'Username 3–20 karakter, hanya huruf kecil, angka, titik, dan garis bawah.';
		}
		if (password.length < 6) galat.password = 'Password minimal 6 karakter.';
		if (role !== 'admin' && role !== 'pengurus') galat.role = 'Role tidak valid.';

		// Username harus unik ( tabel users punya UNIQUE, tapi cek manual agar pesannya ramah ).
		if (!galat.username) {
			const ada = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username) as
				| { id: number }
				| undefined;
			if (ada) galat.username = 'Username sudah dipakai. Gunakan yang lain.';
		}

		if (Object.keys(galat).length) {
			return fail(400, { ...kosong, sukses: false, galat, nilai, modal: 'baru' } satisfies HasilAksi);
		}

		db.prepare('INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
			nama,
			username,
			hashPassword(password),
			role
		);

		return {
			...kosong,
			sukses: true,
			pesan: `Pengguna "${nama}" berhasil ditambahkan.`
		} satisfies HasilAksi;
	},

	toggle: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		if (locals.user.role !== 'admin') return dilarang();

		const id = Number(url.searchParams.get('id'));
		const user = db.prepare('SELECT id, nama, aktif FROM users WHERE id = ?').get(id) as
			| { id: number; nama: string; aktif: number }
			| undefined;
		if (!user) return tidakDitemukan();

		// Menonaktifkan akun sendiri akan mengunci sesi sendiri — cegah di sini.
		if (user.id === locals.user.id) {
			return fail(400, {
				...kosong,
				sukses: false,
				pesan: 'Tidak dapat mengubah status akun sendiri.'
			} satisfies HasilAksi);
		}

		db.prepare('UPDATE users SET aktif = ? WHERE id = ?').run(user.aktif ? 0 : 1, user.id);

		return {
			...kosong,
			sukses: true,
			pesan: user.aktif
				? `Akun "${user.nama}" dinonaktifkan.`
				: `Akun "${user.nama}" diaktifkan kembali.`
		} satisfies HasilAksi;
	},

	resetPassword: async ({ url, request, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		if (locals.user.role !== 'admin') return dilarang();

		const id = Number(url.searchParams.get('id'));
		const user = db.prepare('SELECT id, nama FROM users WHERE id = ?').get(id) as
			| { id: number; nama: string }
			| undefined;
		if (!user) return tidakDitemukan();

		const fd = await request.formData();
		const password = String(fd.get('password') ?? '');

		if (password.length < 6) {
			return fail(400, {
				...kosong,
				sukses: false,
				galat: { password: 'Password minimal 6 karakter.' },
				modal: 'reset',
				userId: user.id,
				userNama: user.nama
			} satisfies HasilAksi);
		}

		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id);

		return {
			...kosong,
			sukses: true,
			pesan: `Password ${user.nama} berhasil direset. Jangan lupa memberitahu pengguna tersebut.`
		} satisfies HasilAksi;
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		if (locals.user.role !== 'admin') return dilarang();

		const id = Number(url.searchParams.get('id'));
		if (id === locals.user.id) {
			return fail(400, {
				...kosong,
				sukses: false,
				pesan: 'Tidak dapat menghapus akun sendiri.'
			} satisfies HasilAksi);
		}

		const user = db.prepare('SELECT id, nama FROM users WHERE id = ?').get(id) as
			| { id: number; nama: string }
			| undefined;
		if (!user) return tidakDitemukan();

		// Sesi pengguna ikut terhapus otomatis (sessions.user_id ON DELETE CASCADE).
		db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

		return { ...kosong, sukses: true, pesan: `Pengguna "${user.nama}" dihapus.` } satisfies HasilAksi;
	}
};
