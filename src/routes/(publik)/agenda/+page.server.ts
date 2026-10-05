import { db, type EventItem } from '#lib/server/db.ts';
import { hariIni } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

const JENIS_AGENDA = ['rutin', 'kegiatan', 'rapat', 'kajian', 'lomba'];

export const load: PageServerLoad = async ({ url }) => {
	const jenisParam = url.searchParams.get('jenis') ?? '';
	const jenis = JENIS_AGENDA.includes(jenisParam) ? jenisParam : '';
	const hari = hariIni();

	// Filter chip ?jenis= (kosong = semua jenis)
	const filter = jenis ? 'AND jenis = ?' : '';
	const nilai = jenis ? [jenis] : [];

	// Akan datang: masih terjadwal & belum usai — hari ini, setelahnya, atau kegiatan
	// multi-hari yang masih berlangsung (tanggal_selesai-nya hari ini / setelahnya).
	const akanDatang = db
		.prepare(
			`SELECT * FROM events WHERE status = 'terjadwal' AND COALESCE(tanggal_selesai, tanggal) >= ? ${filter}
			 ORDER BY tanggal ASC, jam ASC`
		)
		.all(hari, ...nilai) as EventItem[];

	// Telah berlalu: kebalikan dari akan datang supaya tidak ada agenda yang hilang
	// dari kedua daftar — sudah selesai/dibatalkan, atau waktunya (tanggal terakhir)
	// sudah lewat. Bisa dari status apa pun — batasi 5 terakhir.
	const telahBerlalu = db
		.prepare(
			`SELECT * FROM events WHERE (status != 'terjadwal' OR COALESCE(tanggal_selesai, tanggal) < ?) ${filter}
			 ORDER BY tanggal DESC, jam DESC LIMIT 5`
		)
		.all(hari, ...nilai) as EventItem[];

	return { jenis, akanDatang, telahBerlalu };
};
