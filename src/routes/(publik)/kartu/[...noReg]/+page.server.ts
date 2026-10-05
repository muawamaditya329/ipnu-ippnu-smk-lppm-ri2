import { redirect } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { db, type Member } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

/** Hanya data yang dicetak di kartu — halaman ini publik, jangan bocorkan PII lain. */
type KartuMember = Pick<Member, 'nama' | 'jenis_kelamin' | 'no_reg' | 'nis' | 'kelas' | 'jurusan'>;

export const load: PageServerLoad = async ({ params, url }) => {
	// no_reg memakai '/' (contoh: IPN/2026/0001). Tautan resmi meng-encode-nya menjadi
	// %2F dan params.noReg berisi no_reg utuh; route [...noReg] juga menerima bentuk
	// mentah (/kartu/IPN/2026/0001) — mis. hasil ketik manual setelah memindai QR.
	const noReg = (params.noReg ?? '').trim();
	const token = (url.searchParams.get('token') ?? '').trim();

	// no_reg berpola mudah ditebak (IPN/2025/0001), sehingga tanpa pengaman halaman
	// publik ini bisa dipakai mengenumerasi anggota. Karena itu kartu hanya tampil
	// bila tautannya menyertakan token pribadi anggota (kolom members.token_kartu).
	// Tautan resmi diberikan di halaman Cek Status dan dasbor admin.
	const member = db
		.prepare(
			`SELECT nama, jenis_kelamin, no_reg, nis, kelas, jurusan
			 FROM members WHERE no_reg = ? AND token_kartu = ? AND status = 'aktif'`
		)
		.get(noReg, token) as KartuMember | undefined;

	// Kartu hanya untuk anggota aktif dengan token cocok; selain itu arahkan ke
	// halaman cek status (yang juga menjadi tempat memulihkan tautan kartu).
	if (!member) redirect(303, '/daftar/status');

	// QR memuat tautan kartu lengkap dengan token: hasil pindaiannya langsung
	// membuka halaman verifikasi ini, bukan sekadar teks yang tak bisa diperiksa.
	const tautan = `${url.origin}/kartu/${encodeURIComponent(noReg)}?token=${token}`;
	const qr = await QRCode.toDataURL(tautan, { margin: 1, width: 240 });

	return { member, qr };
};
