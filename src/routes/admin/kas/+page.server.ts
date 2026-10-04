import { fail, redirect } from '@sveltejs/kit';
import { db, type Transaction } from '#lib/server/db.ts';
import { hariIni, KATEGORI_KAS_KELUAR, KATEGORI_KAS_MASUK } from '#lib/utils.ts';
import type { Actions, PageServerLoad } from './$types';

type BarisKas = Transaction & { dicatat_oleh_nama: string | null };

type NilaiForm = {
	jenis: string;
	jumlah: string;
	kategori: string;
	keterangan: string;
	tanggal: string;
};

/** Bentuk seragam utk semua return action agar `form?.galat` dsb. mudah ditipkan di halaman. */
type HasilKas = {
	sukses: boolean;
	terhapus: boolean;
	galat: Record<string, string> | null;
	nilai: NilaiForm | null;
};

export const load: PageServerLoad = async ({ url }) => {
	const bulan = url.searchParams.get('bulan') ?? '';
	const jenis = url.searchParams.get('jenis') ?? '';

	// Filter dinamis: bulan (YYYY-MM) & jenis transaksi.
	const syarat: string[] = [];
	const nilai: unknown[] = [];
	if (/^\d{4}-\d{2}$/.test(bulan)) {
		syarat.push(`strftime('%Y-%m', tanggal) = ?`);
		nilai.push(bulan);
	}
	if (jenis === 'masuk' || jenis === 'keluar') {
		syarat.push('jenis = ?');
		nilai.push(jenis);
	}
	const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';

	const jumlahTransaksi = (
		db.prepare(`SELECT COUNT(*) AS n FROM transactions ${where}`).get(...nilai) as { n: number }
	).n;

	const transaksi = db
		.prepare(
			`SELECT t.*, u.nama AS dicatat_oleh_nama FROM transactions t
			 LEFT JOIN users u ON u.id = t.dicatat_oleh
			 ${where} ORDER BY t.tanggal DESC, t.id DESC LIMIT 25`
		)
		.all(...nilai) as BarisKas[];

	const total = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions`
		)
		.get() as { masuk: number; keluar: number };

	const bulanIni = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions WHERE strftime('%Y-%m', tanggal) = ?`
		)
		.get(hariIni().slice(0, 7)) as { masuk: number; keluar: number };

	return {
		transaksi,
		jumlahTransaksi,
		totalMasuk: total.masuk,
		totalKeluar: total.keluar,
		masukBulanIni: bulanIni.masuk,
		keluarBulanIni: bulanIni.keluar,
		bulan: /^\d{4}-\d{2}$/.test(bulan) ? bulan : '',
		jenis: jenis === 'masuk' || jenis === 'keluar' ? jenis : ''
	};
};

export const actions: Actions = {
	buat: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, {
				sukses: false,
				terhapus: false,
				galat: { umum: 'Sesi berakhir. Silakan masuk ulang.' },
				nilai: null
			} satisfies HasilKas);
		}

		const fd = await request.formData();
		const jenis = String(fd.get('jenis') ?? '');
		const jumlahMentah = String(fd.get('jumlah') ?? '');
		const jumlah = Number(jumlahMentah);
		const kategori = String(fd.get('kategori') ?? '').trim();
		const keterangan = String(fd.get('keterangan') ?? '').trim();
		const tanggal = String(fd.get('tanggal') ?? '').trim();

		const nilai: NilaiForm = { jenis, jumlah: jumlahMentah, kategori, keterangan, tanggal };
		const galat: Record<string, string> = {};

		if (jenis !== 'masuk' && jenis !== 'keluar') galat.jenis = 'Pilih jenis transaksi.';
		if (!Number.isInteger(jumlah) || jumlah < 1000) galat.jumlah = 'Jumlah minimal Rp1.000 dan harus angka penuh.';
		if (!(jenis === 'masuk' ? KATEGORI_KAS_MASUK : KATEGORI_KAS_KELUAR).includes(kategori)) {
			galat.kategori = 'Kategori tidak valid.';
		}
		if (!keterangan) galat.keterangan = 'Keterangan wajib diisi.';
		if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) galat.tanggal = 'Tanggal tidak valid.';
		if (Object.keys(galat).length) return fail(400, { sukses: false, terhapus: false, galat, nilai });

		db.prepare(
			`INSERT INTO transactions (jenis, jumlah, kategori, keterangan, tanggal, dicatat_oleh)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(jenis, jumlah, kategori, keterangan, tanggal, locals.user.id);

		return { sukses: true, terhapus: false, galat: null, nilai: null } satisfies HasilKas;
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');
		const id = Number(url.searchParams.get('id'));
		if (Number.isInteger(id) && id > 0) {
			const ada = db.prepare('SELECT id FROM transactions WHERE id = ?').get(id) as
				| { id: number }
				| undefined;
			if (ada) db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
		}
		return { sukses: true, terhapus: true, galat: null, nilai: null } satisfies HasilKas;
	}
};
