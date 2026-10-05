import { fail, redirect } from '@sveltejs/kit';
import { db, type Transaction } from '#lib/server/db.ts';
import { hariIni, KATEGORI_KAS_KELUAR, KATEGORI_KAS_MASUK, tanggalValid } from '#lib/utils.ts';
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

	// Ringkasan khusus set yang terfilter — agar kartu saldo selalu konsisten
	// dengan daftar transaksi yang sedang tampil di bawah filter.
	const terpilih = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions ${where}`
		)
		.get(...nilai) as { masuk: number; keluar: number };

	const bulanIni = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions WHERE strftime('%Y-%m', tanggal) = ?`
		)
		.get(hariIni().slice(0, 7)) as { masuk: number; keluar: number };

	const bulanValid = /^\d{4}-\d{2}$/.test(bulan);
	const jenisValid = jenis === 'masuk' || jenis === 'keluar';

	return {
		transaksi,
		jumlahTransaksi,
		totalMasuk: total.masuk,
		totalKeluar: total.keluar,
		masukTerpilih: terpilih.masuk,
		keluarTerpilih: terpilih.keluar,
		masukBulanIni: bulanIni.masuk,
		keluarBulanIni: bulanIni.keluar,
		adaFilter: bulanValid || jenisValid,
		bulan: bulanValid ? bulan : '',
		jenis: jenisValid ? jenis : ''
	};
};

// Batas atas nominal satu transaksi (Rp10 miliar) — melindungi dari isian tak
// masuk akal (mis. 1e21 yang tersimpan sebagai REAL dan merusak laporan saldo).
const MAKS_JUMLAH = 10_000_000_000;

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
		if (!Number.isInteger(jumlah) || jumlah <= 0)
			galat.jumlah = 'Jumlah wajib diisi angka bulat lebih dari 0.';
		else if (jumlah > MAKS_JUMLAH) galat.jumlah = 'Jumlah maksimal Rp10.000.000.000.';
		if (!(jenis === 'masuk' ? KATEGORI_KAS_MASUK : KATEGORI_KAS_KELUAR).includes(kategori)) {
			galat.kategori = 'Kategori tidak valid.';
		}
		if (!keterangan) galat.keterangan = 'Keterangan wajib diisi.';
		else if (keterangan.length > 200) galat.keterangan = 'Keterangan maksimal 200 karakter.';
		if (!tanggalValid(tanggal)) galat.tanggal = 'Tanggal tidak valid.';
		if (Object.keys(galat).length)
			return fail(400, { sukses: false, terhapus: false, galat, nilai });

		db.prepare(
			`INSERT INTO transactions (jenis, jumlah, kategori, keterangan, tanggal, dicatat_oleh)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(jenis, jumlah, kategori, keterangan, tanggal, locals.user.id);

		return { sukses: true, terhapus: false, galat: null, nilai: null } satisfies HasilKas;
	},

	hapus: async ({ url, locals }) => {
		if (!locals.user) redirect(303, '/masuk');

		// KEPUTUSAN ROLE: menghapus transaksi kas HANYA untuk admin. Kas adalah
		// catatan pertanggungjawaban uang organisasi sekaligus sumber laporan kas
		// publik (/laporan-kas) — penghapusan senyap mengubah sejarah keuangan tanpa
		// jejak. Pengurus tetap bisa MENCATAT transaksi (action buat) dan mengelola
		// seluruh konten lain; koreksi catatan yang salah lewat admin. Pembedaan
		// "input vs. hapus" ini juga diikuti UI (tombol hapus disembunyikan).
		if (locals.user.role !== 'admin') {
			return fail(403, {
				sukses: false,
				terhapus: false,
				galat: {
					umum: 'Hanya admin yang dapat menghapus transaksi kas. Hubungi admin untuk koreksi catatan.'
				},
				nilai: null
			} satisfies HasilKas);
		}

		const id = Number(url.searchParams.get('id'));
		if (Number.isInteger(id) && id > 0) {
			const ada = db.prepare('SELECT id FROM transactions WHERE id = ?').get(id) as
				{ id: number } | undefined;
			if (ada) db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
		}
		return { sukses: true, terhapus: true, galat: null, nilai: null } satisfies HasilKas;
	}
};
