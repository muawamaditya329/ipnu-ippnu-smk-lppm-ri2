import { db, type EventItem, type Post } from '#lib/server/db.ts';
import { hariIni } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

type FotoGaleri = {
	id: number;
	file: string;
	caption: string | null;
	album_id: number;
	album_judul: string;
};

export const load: PageServerLoad = async () => {
	const hari = hariIni();
	const tahun = hari.slice(0, 4);

	const hitung = (sql: string, ...nilai: unknown[]): number =>
		(db.prepare(sql).get(...nilai) as { n: number }).n;

	// 4 berita terbit terbaru (terbaru dari tanggal terbit, fallback tanggal dibuat):
	// 1 jadi berita unggulan beranda, sisanya masuk daftar pendamping.
	const beritaTerbaru = db
		.prepare(
			`SELECT * FROM posts WHERE status = 'terbit'
			 ORDER BY COALESCE(published_at, created_at) DESC LIMIT 4`
		)
		.all() as Post[];

	// 4 agenda terdekat: masih terjadwal & belum usai — sama dengan definisi
	// "Akan Datang" di halaman agenda, supaya kegiatan multi-hari yang tanggal
	// mulainya sudah lewat tapi masih berlangsung tetap ikut tampil.
	const agendaMendatang = db
		.prepare(
			`SELECT * FROM events WHERE status = 'terjadwal' AND COALESCE(tanggal_selesai, tanggal) >= ?
			 ORDER BY tanggal ASC, jam ASC LIMIT 4`
		)
		.all(hari) as EventItem[];

	// Statistik ringkas untuk kartu angka di beranda.
	const statistik = {
		aktif: hitung(`SELECT COUNT(*) AS n FROM members WHERE status = 'aktif'`),
		putra: hitung(
			`SELECT COUNT(*) AS n FROM members WHERE status = 'aktif' AND jenis_kelamin = 'L'`
		),
		putri: hitung(
			`SELECT COUNT(*) AS n FROM members WHERE status = 'aktif' AND jenis_kelamin = 'P'`
		),
		kegiatan: hitung(`SELECT COUNT(*) AS n FROM events WHERE strftime('%Y', tanggal) = ?`, tahun),
		berita: hitung(`SELECT COUNT(*) AS n FROM posts WHERE status = 'terbit'`)
	};

	// 5 foto terbaru sebagai strip galeri beranda — 1 besar + 4 pendamping.
	const fotoGaleri = db
		.prepare(
			`SELECT p.id, p.file, p.caption, a.id AS album_id, a.judul AS album_judul
			 FROM photos p JOIN albums a ON a.id = p.album_id
			 ORDER BY p.created_at DESC, p.id DESC LIMIT 5`
		)
		.all() as FotoGaleri[];

	return { beritaTerbaru, agendaMendatang, statistik, fotoGaleri };
};
