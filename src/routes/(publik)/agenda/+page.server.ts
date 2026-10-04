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

	// Akan datang: masih berstatus terjadwal & tanggalnya hari ini atau setelahnya.
	const akanDatang = db
		.prepare(
			`SELECT * FROM events WHERE status = 'terjadwal' AND tanggal >= ? ${filter}
			 ORDER BY tanggal ASC, jam ASC`
		)
		.all(hari, ...nilai) as EventItem[];

	// Telah berlalu: tanggal sudah lewat, atau hari ini tetapi sudah selesai/dibatalkan.
	// Bisa dari status apa pun — batasi 5 terakhir.
	const telahBerlalu = db
		.prepare(
			`SELECT * FROM events WHERE (tanggal < ? OR (tanggal = ? AND status != 'terjadwal')) ${filter}
			 ORDER BY tanggal DESC, jam DESC LIMIT 5`
		)
		.all(hari, hari, ...nilai) as EventItem[];

	return { jenis, akanDatang, telahBerlalu };
};
