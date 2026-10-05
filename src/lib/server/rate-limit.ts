/**
 * Pembatas laju sederhana (jendela tetap / fixed window) di memori proses —
 * tanpa dependensi tambahan. Cukup untuk satu instansi server adapter-node dan
 * volume trafik situs komisariat; bukan pengganti pembatasan di reverse proxy.
 *
 * Setiap penghitung hanya hidup selama durasi jendelanya dan dibersihkan
 * berkala, sehingga Map tidak tumbuh tanpa batas walau permintaan datang dari
 * banyak IP berbeda.
 */

type Jendela = { n: number; reset: number };

const penghitung = new Map<string, Jendela>();

/** Pembersihan entri kedaluwarsa dilakukan paling sering sekali per menit. */
const SAPU_TIAP_MS = 60 * 1000;
let sapuTerakhir = Date.now();

/**
 * Catat satu permintaan untuk `kunci` (mis. `daftar:1.2.3.4`) dan laporkan
 * apakah ia melewati batas: true berarti sudah lebih dari `maks` permintaan
 * dalam jendela `jendelaMs` milidetik terakhir (permintaan ini ikut dihitung).
 */
export function melebihiLaju(kunci: string, maks: number, jendelaMs: number): boolean {
	const sekarang = Date.now();

	// Sapu entri kedaluwarsa secara berkala (bukan lewat timer) supaya modul
	// ini tidak menambah side-effect di luar siklus permintaan.
	if (sekarang - sapuTerakhir >= SAPU_TIAP_MS) {
		sapuTerakhir = sekarang;
		for (const [k, v] of penghitung) if (sekarang >= v.reset) penghitung.delete(k);
	}

	const entri = penghitung.get(kunci);
	if (!entri || sekarang >= entri.reset) {
		penghitung.set(kunci, { n: 1, reset: sekarang + jendelaMs });
		return false;
	}
	entri.n += 1;
	return entri.n > maks;
}
