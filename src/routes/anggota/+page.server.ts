import { redirect } from '@sveltejs/kit';
import { db, type EventItem, type Post } from '#lib/server/db.ts';
import { hariIni } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

/** Profil untuk kartu dasbor — hanya kolom yang memang ditampilkan di area anggota. */
type ProfilDasbor = {
	nama: string;
	jenis_kelamin: 'L' | 'P';
	status: 'aktif' | 'alumni';
	no_reg: string | null;
	nis: string | null;
	kelas: string | null;
	jurusan: string | null;
	tanggal_lahir: string | null;
	alamat: string | null;
	no_hp: string | null;
	foto: string | null;
	token_kartu: string | null;
};

export const load: PageServerLoad = async ({ locals }) => {
	// Lapis kedua di atas guard layout & hooks.server.ts.
	if (!locals.anggota) redirect(303, '/masuk?tab=anggota');

	// Profil dibaca segar dari database (kelas/jurusan/status bisa berubah),
	// SELALU terbatas pada anggota pemilik sesi — bukan data anggota lain.
	const profil = db
		.prepare(
			`SELECT nama, jenis_kelamin, status, no_reg, nis, kelas, jurusan,
			        tanggal_lahir, alamat, no_hp, foto, token_kartu
			 FROM members WHERE id = ? AND status IN ('aktif', 'alumni')`
		)
		.get(locals.anggota.id) as ProfilDasbor | undefined;

	// Sesi menggantung (anggota dihapus/dinonaktifkan di antara dua permintaan)?
	if (!profil) redirect(303, '/masuk?tab=anggota');

	// Cakupan konten mengikuti organisasinya: putra → IPNU, putri → IPPNU.
	const cakupan = profil.jenis_kelamin === 'P' ? 'ippnu' : 'ipnu';

	// Agenda untukmu: masih terjadwal, belum usai, cakupan umum + organisasinya —
	// 5 terdekat diurut naik (pola query sama dgn halaman agenda publik).
	const agenda = db
		.prepare(
			`SELECT * FROM events
			 WHERE status = 'terjadwal' AND cakupan IN ('umum', ?)
			   AND COALESCE(tanggal_selesai, tanggal) >= ?
			 ORDER BY tanggal ASC, jam ASC
			 LIMIT 5`
		)
		.all(cakupan, hariIni()) as EventItem[];

	// Kabar terbaru: berita terbit dengan cakupan yang sama, 5 terakhir.
	const berita = db
		.prepare(
			`SELECT p.*, u.nama AS penulis_nama FROM posts p
			 LEFT JOIN users u ON u.id = p.penulis_id
			 WHERE p.status = 'terbit' AND p.cakupan IN ('umum', ?)
			 ORDER BY COALESCE(p.published_at, p.created_at) DESC
			 LIMIT 5`
		)
		.all(cakupan) as Post[];

	// Tautan kartu menuntut no_reg + token pribadi (lihat /kartu) dan hanya utk
	// anggota aktif — alumni tidak lagi punya kartu yang sah.
	const tautanKartu =
		profil.no_reg && profil.token_kartu && profil.status === 'aktif'
			? `/kartu/${encodeURIComponent(profil.no_reg)}?token=${profil.token_kartu}`
			: null;

	return { profil, tautanKartu, agenda, berita, cakupan };
};
