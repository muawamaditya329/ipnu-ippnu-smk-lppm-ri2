import { db, type EventItem, type Transaction } from '#lib/server/db.ts';
import { getSettings } from '#lib/server/settings.ts';
import { hariIni } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

type PendaftarBaru = {
	id: number;
	nama: string;
	jenis_kelamin: 'L' | 'P';
	kelas: string | null;
	jurusan: string | null;
	created_at: string;
};

type AgendaTerdekat = Pick<EventItem, 'id' | 'judul' | 'lokasi' | 'tanggal' | 'jam'>;
type KasTerbaru = Pick<Transaction, 'id' | 'jenis' | 'jumlah' | 'keterangan' | 'tanggal'>;

export const load: PageServerLoad = async () => {
	const pengaturan = getSettings();

	const statistik = db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM members WHERE status = 'aktif') AS anggotaAktif,
				(SELECT COUNT(*) FROM members WHERE status = 'pending') AS menunggu,
				(SELECT COUNT(*) FROM posts WHERE status = 'terbit') AS beritaTerbit`
		)
		.get() as { anggotaAktif: number; menunggu: number; beritaTerbit: number };

	const kasSaldo = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions`
		)
		.get() as { masuk: number; keluar: number };

	const pendaftar = db
		.prepare(
			`SELECT id, nama, jenis_kelamin, kelas, jurusan, created_at FROM members
			 WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5`
		)
		.all() as PendaftarBaru[];

	const agenda = db
		.prepare(
			`SELECT id, judul, lokasi, tanggal, jam FROM events
			 WHERE status = 'terjadwal' AND COALESCE(tanggal_selesai, tanggal) >= ?
			 ORDER BY tanggal ASC, jam ASC LIMIT 4`
		)
		.all(hariIni()) as AgendaTerdekat[];

	const kas = db
		.prepare(
			`SELECT id, jenis, jumlah, keterangan, tanggal FROM transactions
			 ORDER BY tanggal DESC, id DESC LIMIT 5`
		)
		.all() as KasTerbaru[];

	return {
		namaOrganisasi: pengaturan.nama_organisasi,
		anggotaAktif: statistik.anggotaAktif,
		menunggu: statistik.menunggu,
		beritaTerbit: statistik.beritaTerbit,
		saldo: kasSaldo.masuk - kasSaldo.keluar,
		pendaftar,
		agenda,
		kas
	};
};
