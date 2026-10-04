import { fail, redirect } from '@sveltejs/kit';
import { db, type EventItem } from '#lib/server/db.ts';
import { hapusUnggahan } from '#lib/server/uploads.ts';
import type { Actions, PageServerLoad } from './$types';

const JENIS_AGENDA = ['rutin', 'kegiatan', 'rapat', 'kajian', 'lomba'];
const CAKUPAN = ['umum', 'ipnu', 'ippnu'];
const STATUS_AGENDA = ['terjadwal', 'selesai', 'dibatalkan'];
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async ({ url }) => {
	const jenisParam = url.searchParams.get('jenis') ?? '';
	const statusParam = url.searchParams.get('status') ?? '';
	const jenis = JENIS_AGENDA.includes(jenisParam) ? jenisParam : '';
	const status = STATUS_AGENDA.includes(statusParam) ? statusParam : '';

	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (jenis) {
		syarat.push('jenis = ?');
		nilai.push(jenis);
	}
	if (status) {
		syarat.push('status = ?');
		nilai.push(status);
	}
	const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';

	const events = db
		.prepare(`SELECT * FROM events ${where} ORDER BY tanggal DESC, jam DESC, id DESC`)
		.all(...nilai) as EventItem[];

	const total = (db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n;

	return { events, total, jenis, status };
};

/** Baca & validasi form agenda. */
function bacaForm(fd: FormData): { nilai: Record<string, string>; galat: Record<string, string> } {
	const judul = String(fd.get('judul') ?? '').trim();
	const jenisMentah = String(fd.get('jenis') ?? 'kegiatan');
	const cakupanMentah = String(fd.get('cakupan') ?? 'umum');
	const lokasi = String(fd.get('lokasi') ?? '').trim();
	const tanggal = String(fd.get('tanggal') ?? '').trim();
	const jamMentah = String(fd.get('jam') ?? '').trim();
	const tanggalSelesai = String(fd.get('tanggal_selesai') ?? '').trim();
	const statusMentah = String(fd.get('status') ?? 'terjadwal');
	const deskripsi = String(fd.get('deskripsi') ?? '').trim();

	const nilai: Record<string, string> = {
		judul,
		jenis: JENIS_AGENDA.includes(jenisMentah) ? jenisMentah : 'kegiatan',
		cakupan: CAKUPAN.includes(cakupanMentah) ? cakupanMentah : 'umum',
		lokasi,
		tanggal,
		jam: jamMentah ? jamMentah.slice(0, 5) : '',
		tanggal_selesai: tanggalSelesai,
		status: STATUS_AGENDA.includes(statusMentah) ? statusMentah : 'terjadwal',
		deskripsi
	};

	const galat: Record<string, string> = {};
	if (!judul) galat.judul = 'Judul agenda wajib diisi.';
	else if (judul.length > 180) galat.judul = 'Judul maksimal 180 karakter.';

	if (!tanggal) galat.tanggal = 'Tanggal wajib diisi.';
	else if (!POLA_TANGGAL.test(tanggal)) galat.tanggal = 'Format tanggal tidak valid.';

	if (jamMentah && !/^\d{2}:\d{2}(:\d{2})?$/.test(jamMentah)) {
		galat.jam = 'Format jam tidak valid (contoh: 16:00).';
	}

	if (tanggalSelesai) {
		if (!POLA_TANGGAL.test(tanggalSelesai)) {
			galat.tanggal_selesai = 'Format tanggal tidak valid.';
		} else if (!galat.tanggal && tanggalSelesai < tanggal) {
			galat.tanggal_selesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
		}
	}

	if (deskripsi.length > 2000) galat.deskripsi = 'Deskripsi maksimal 2000 karakter.';

	return { nilai, galat };
}

export const actions: Actions = {
	buat: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { galat: { umum: 'Sesi berakhir. Silakan masuk ulang.' } });

		const { nilai, galat } = bacaForm(await request.formData());
		if (Object.keys(galat).length) return fail(400, { galat });

		db.prepare(
			`INSERT INTO events (judul, deskripsi, jenis, lokasi, tanggal, jam, tanggal_selesai, cakupan, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			nilai.judul,
			nilai.deskripsi || null,
			nilai.jenis,
			nilai.lokasi || null,
			nilai.tanggal,
			nilai.jam || null,
			nilai.tanggal_selesai || null,
			nilai.cakupan,
			nilai.status
		);

		return { sukses: true, pesan: `Agenda "${nilai.judul}" berhasil ditambahkan.` };
	},

	ubah: async ({ request, url, locals }) => {
		if (!locals.user) return fail(401, { galat: { umum: 'Sesi berakhir. Silakan masuk ulang.' } });

		const id = Number(url.searchParams.get('id'));
		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { galat: { umum: 'Agenda tidak ditemukan.' } });
		}

		const { nilai, galat } = bacaForm(await request.formData());
		if (Object.keys(galat).length) return fail(400, { galat });

		const hasil = db
			.prepare(
				`UPDATE events SET judul = ?, deskripsi = ?, jenis = ?, lokasi = ?, tanggal = ?, jam = ?,
				 tanggal_selesai = ?, cakupan = ?, status = ? WHERE id = ?`
			)
			.run(
				nilai.judul,
				nilai.deskripsi || null,
				nilai.jenis,
				nilai.lokasi || null,
				nilai.tanggal,
				nilai.jam || null,
				nilai.tanggal_selesai || null,
				nilai.cakupan,
				nilai.status,
				id
			);

		if (hasil.changes === 0) {
			return fail(404, { galat: { umum: 'Agenda tidak ditemukan atau sudah dihapus.' } });
		}

		return { sukses: true, pesan: `Agenda "${nilai.judul}" berhasil diperbarui.` };
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		const id = Number(url.searchParams.get('id'));
		const agenda = db.prepare('SELECT id, poster FROM events WHERE id = ?').get(id) as
			{ id: number; poster: string | null } | undefined;

		if (agenda) {
			hapusUnggahan(agenda.poster);
			db.prepare('DELETE FROM events WHERE id = ?').run(id);
		}

		return { sukses: true, pesan: 'Agenda berhasil dihapus.' };
	}
};
