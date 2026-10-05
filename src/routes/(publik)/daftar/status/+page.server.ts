import { db } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

/**
 * Kolom yang memang tampil di halaman cek status. Halaman ini PUBLIK dan kunci
 * pencariannya (NIS) mudah diketahui/ditebak, jadi JANGAN memakai SELECT *:
 * kolom seperti alamat, no_hp, nama_ortu, tanggal_lahir, motivasi, dan foto
 * tetap ikut terserialisasi ke payload klien meskipun tidak dirender.
 */
type StatusMember = {
	id: number;
	nama: string;
	jenis_kelamin: 'L' | 'P';
	kelas: string | null;
	jurusan: string | null;
	no_reg: string | null;
	/** Dibutuhkan utk menyusun tautan kartu anggota yang sah (lihat /kartu). */
	token_kartu: string | null;
	catatan: string | null;
	status: 'pending' | 'aktif' | 'ditolak' | 'alumni';
	created_at: string;
};

export const load: PageServerLoad = async ({ url }) => {
	const nis = (url.searchParams.get('nis') ?? '').trim();

	if (!nis) return { nis: '', member: null };

	// Bila NIS pernah dipakai lebih dari sekali, tampilkan pendaftaran terbaru.
	const member = db
		.prepare(
			`SELECT id, nama, jenis_kelamin, kelas, jurusan, no_reg, token_kartu, catatan, status, created_at
			 FROM members WHERE nis = ? ORDER BY id DESC LIMIT 1`
		)
		.get(nis) as StatusMember | undefined;

	return { nis, member: member ?? null };
};
