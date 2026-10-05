import { db, type Transaction } from '#lib/server/db.ts';
import { hariIni } from '#lib/utils.ts';
import type { PageServerLoad } from './$types';

/** Baris transaksi utk publik — tanpa kolom internal (dicatat_oleh dsb.). */
type BarisPublik = Pick<
	Transaction,
	'id' | 'jenis' | 'jumlah' | 'kategori' | 'keterangan' | 'tanggal'
>;

type RekapBulan = { bulan: string; masuk: number; keluar: number; saldo: number };

export const load: PageServerLoad = async () => {
	const total = db
		.prepare(
			`SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions`
		)
		.get() as { masuk: number; keluar: number };

	// Rekap seluruh riwayat per bulan — dipakai untuk saldo kumulatif yang akurat.
	const perBulan = db
		.prepare(
			`SELECT strftime('%Y-%m', tanggal) AS bulan,
					COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah END), 0) AS masuk,
					COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah END), 0) AS keluar
			 FROM transactions
			 GROUP BY strftime('%Y-%m', tanggal)
			 ORDER BY bulan ASC`
		)
		.all() as { bulan: string; masuk: number; keluar: number }[];

	// Kunci 12 bulan terakhir (termasuk bulan berjalan) — bulan tanpa transaksi tetap tampil bernilai 0.
	const bulanBerjalan = hariIni().slice(0, 7);
	const [thn, bln] = bulanBerjalan.split('-').map(Number);
	const kunciBulan: string[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(Date.UTC(thn, bln - 1 - i, 1));
		kunciBulan.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
	}

	// Transaksi bertanggal setelah bulan berjalan (catatan bendahara utk acara mendatang)
	// tetap harus mendapat barisnya, kalau tidak saldo rekap tidak akan cocok dengan
	// "Saldo Saat Ini" yang menjumlahkan seluruh riwayat. Bulan kosong di antaranya
	// diisi baris 0 agar tabel tetap runtut (maks. 12 bulan ke depan).
	const bulanTerakhirMendatang = perBulan
		.map((r) => r.bulan)
		.filter((b): b is string => !!b && b > bulanBerjalan)
		.at(-1);
	if (bulanTerakhirMendatang) {
		const kursor = new Date(Date.UTC(thn, bln, 1)); // bulan pertama setelah bulan berjalan
		for (let i = 0; i < 12; i++) {
			const k = `${kursor.getUTCFullYear()}-${String(kursor.getUTCMonth() + 1).padStart(2, '0')}`;
			if (k > bulanTerakhirMendatang) break;
			kunciBulan.push(k);
			kursor.setUTCMonth(kursor.getUTCMonth() + 1);
		}
	}

	const peta = new Map(perBulan.map((r) => [r.bulan, r]));
	let saldo = 0;
	for (const r of perBulan) {
		if (r.bulan < (kunciBulan[0] ?? '')) saldo += r.masuk - r.keluar;
	}
	const rekap: RekapBulan[] = kunciBulan.map((b) => {
		const d = peta.get(b);
		if (d) saldo += d.masuk - d.keluar;
		return { bulan: b, masuk: d?.masuk ?? 0, keluar: d?.keluar ?? 0, saldo };
	});

	const terbaru = db
		.prepare(
			`SELECT id, jenis, jumlah, kategori, keterangan, tanggal
			 FROM transactions ORDER BY tanggal DESC, id DESC LIMIT 15`
		)
		.all() as BarisPublik[];

	return { totalMasuk: total.masuk, totalKeluar: total.keluar, bulanBerjalan, rekap, terbaru };
};
