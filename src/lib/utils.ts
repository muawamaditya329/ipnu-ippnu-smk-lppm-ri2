// ============================================================
// Helper bersama (boleh dipakai client & server). Tanpa import node.
// ============================================================

const formatterRupiah = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

const bulanID = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];
const hariID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** 25000 -> "Rp25.000" */
export function fmtRp(n: number | null | undefined): string {
	return formatterRupiah.format(Number(n ?? 0));
}

/**
 * WIB = UTC+7 dan TIDAK punya waktu musim panas, jadi tanggal kalender WIB bisa
 * didapat dengan menggeser epoch +7 jam lalu membaca komponen UTC-nya. Ini
 * deterministik di server maupun browser, betapapun zona waktu mesinnya
 * (server produksi biasanya UTC — tanpa geseran ini tampilan jam akan salah 7 jam).
 */
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;

/** True bila string memuat bagian jam → timestamp ('2026-10-04 09:15:00' atau ISO 'T'). */
function adaBagianJam(s: string): boolean {
	return s.includes(' ') || s.includes('T');
}

/** Timestamp ('2026-10-04 09:15:00' UTC / ISO) -> epoch ms; null bila tidak bisa di-parse. */
function epochDariTimestamp(s: string): number | null {
	const iso = s.includes('T') ? s : s.replace(' ', 'T');
	const t = Date.parse(iso.endsWith('Z') ? iso : `${iso}Z`);
	return Number.isNaN(t) ? null : t;
}

/** Komponen kalender WIB ({y, m, d, hari}) dari epoch ms. */
function kalenderWib(epoch: number): { y: number; m: number; d: number; hari: string } {
	const d = new Date(epoch + OFFSET_WIB_MS);
	return {
		y: d.getUTCFullYear(),
		m: d.getUTCMonth() + 1,
		d: d.getUTCDate(),
		hari: hariID[d.getUTCDay()]
	};
}

/**
 * Tanggal kalender (YYYY-MM-DD) versi WIB dari timestamp UTC — dipakai saat
 * bagian "tanggal saja" dari timestamp dibutuhkan (CSV, max input, dsb.).
 * Input yang sudah tanggal murni dikembalikan apa adanya (dipotong 10 karakter).
 */
export function tanggalWib(s: string | null | undefined): string {
	if (!s) return '';
	if (!adaBagianJam(s)) return s.slice(0, 10);
	const epoch = epochDariTimestamp(s);
	if (epoch === null) return s.slice(0, 10);
	const d = new Date(epoch + OFFSET_WIB_MS);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
		d.getUTCDate()
	).padStart(2, '0')}`;
}

/**
 * '2026-10-04' -> '4 Oktober 2026'. Timestamp ('2026-10-04 09:15:00' UTC) juga
 * diterima: tanggalnya dihitung versi WIB, jadi '2026-12-31 18:00:00' tampil
 * sebagai '1 Januari 2027' (bukan tanggal UTC yang masih 31 Desember).
 */
export function fmtTanggal(s: string | null | undefined): string {
	if (!s) return '-';
	if (adaBagianJam(s)) {
		const epoch = epochDariTimestamp(s);
		if (epoch === null) return s;
		const k = kalenderWib(epoch);
		return `${k.d} ${bulanID[k.m - 1]} ${k.y}`;
	}
	const [y, m, d] = s.slice(0, 10).split('-').map(Number);
	if (!y || !m || !d || !tanggalValid(s.slice(0, 10))) return s;
	return `${d} ${bulanID[m - 1]} ${y}`;
}

/** '2026-10-04' -> 'Minggu, 4 Okt 2026' (timestamp juga: nama hari versi WIB). */
export function fmtTanggalPendek(s: string | null | undefined): string {
	if (!s) return '-';
	if (adaBagianJam(s)) {
		const epoch = epochDariTimestamp(s);
		if (epoch === null) return s;
		const k = kalenderWib(epoch);
		return `${k.hari}, ${k.d} ${bulanID[k.m - 1].slice(0, 3)} ${k.y}`;
	}
	const [y, m, d] = s.slice(0, 10).split('-').map(Number);
	if (!y || !m || !d || !tanggalValid(s.slice(0, 10))) return s;
	const hari = hariID[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
	return `${hari}, ${d} ${bulanID[m - 1].slice(0, 3)} ${y}`;
}

/** Timestamp SQLite ('2026-10-04 09:15:00' UTC) -> '4 Okt 2026, 16:15 WIB' */
export function fmtWaktu(s: string | null | undefined): string {
	if (!s) return '-';
	const epoch = epochDariTimestamp(s);
	if (epoch === null) return s;
	const d = new Date(epoch + OFFSET_WIB_MS);
	const tanggal = `${d.getUTCDate()} ${bulanID[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
	const jam =
		String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
	return `${tanggal}, ${jam} WIB`;
}

/** '2026-10-04' -> objek {d:'04', m:'OKT', y:'2026'} untuk badge tanggal agenda */
export function pecahTanggal(s: string | null | undefined): { d: string; m: string; y: string } {
	const [y, m, d] = (s ?? '').slice(0, 10).split('-');
	return { d: d ?? '-', m: (bulanID[Number(m) - 1] ?? '?').slice(0, 3).toUpperCase(), y: y ?? '' };
}

export function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/[\s_]+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 80) || 'tanpa-judul'
	);
}

/** Ini utk nama: "Ahmad Fauzi" -> "AF" */
export function inisial(nama: string): string {
	return nama
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((k) => k[0]?.toUpperCase() ?? '')
		.join('');
}

/** Rata-rata 2 kata pertama dari nama panjang utk kartu/table */
export function namaSingkat(nama: string, maks = 28): string {
	if (nama.length <= maks) return nama;
	return nama.slice(0, maks - 1).trimEnd() + '…';
}

/**
 * Render konten artikel sederhana (aman dari XSS):
 * escape HTML dulu, lalu dukung **tebal**, *miring*, dan paragraf.
 */
export function renderKonten(konten: string): string {
	const esc = konten
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

	return esc
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean)
		.map(
			(p) =>
				`<p>${p
					.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
					.replace(/\*([^*]+)\*/g, '<em>$1</em>')
					.replace(/\n/g, '<br />')}</p>`
		)
		.join('\n');
}

/** Dari timestamp SQLite ke "3 hari lalu" */
export function waktuRelatif(s: string | null | undefined): string {
	if (!s) return '-';
	const epoch = epochDariTimestamp(s);
	if (epoch === null) return s;
	const beda = Math.floor((Date.now() - epoch) / 1000);
	if (beda < 60) return 'baru saja';
	if (beda < 3600) return `${Math.floor(beda / 60)} menit lalu`;
	if (beda < 86400) return `${Math.floor(beda / 3600)} jam lalu`;
	if (beda < 2592000) return `${Math.floor(beda / 86400)} hari lalu`;
	return fmtWaktu(s);
}

/** Tanggal hari ini format YYYY-MM-DD (WIB) */
export function hariIni(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

/** Benar-benar tanggal kalender YYYY-MM-DD — '2026-02-31' & '2026-13-01' ditolak walau polanya cocok. */
export function tanggalValid(s: string | null | undefined): boolean {
	if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const [y, m, d] = s.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === s;
}

/**
 * Aman-kan kata kunci pencarian utk klausa LIKE: wildcard LIKE (% dan _) serta
 * karakter escape-nya (\) diubah jadi literal, sehingga pola yang diketik
 * pengguna dicari apa adanya (mis. "100%" tidak menemukan "100abc").
 * Pasangkan dgn SQL `LIKE ? ESCAPE '\'`.
 */
export function escapeLike(s: string): string {
	return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

/** Batas atas nomor halaman — angka tak masuk akal (?halaman=1e999) berhenti di sini. */
const BATAS_HALAMAN = 1_000_000;

/**
 * Ubah nilai parameter ?halaman= menjadi nomor halaman bulat yang aman dipakai
 * dlm LIMIT/OFFSET: kosong/tidak ada/bukan angka → 1, pecahan dipotong
 * ('2.9' → 2), tak hingga → batas atas (untuk dijepit ke halaman terakhir
 * oleh pemanggil). Tanpa ini OFFSET pecahan membuat SQLite melempar
 * "datatype mismatch" (500).
 */
export function keNomorHalaman(raw: string | null | undefined): number {
	const n = Number(raw ?? '');
	if (Number.isNaN(n)) return 1;
	if (!Number.isFinite(n)) return BATAS_HALAMAN;
	return Math.min(Math.max(1, Math.trunc(n)), BATAS_HALAMAN);
}

export function ukuranFile(bytes: number | null | undefined): string {
	if (!bytes) return '-';
	const satuan = ['B', 'KB', 'MB'];
	let v = bytes;
	let i = 0;
	while (v >= 1024 && i < satuan.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${satuan[i]}`;
}

// ============================================================
// Label & opsi standar
// ============================================================

export const LABEL_CAKUPAN: Record<string, string> = {
	umum: 'Umum',
	ipnu: 'IPNU',
	ippnu: 'IPPNU'
};

export const LABEL_STATUS_MEMBER: Record<string, string> = {
	pending: 'Menunggu Verifikasi',
	aktif: 'Anggota Aktif',
	ditolak: 'Ditolak',
	alumni: 'Alumni'
};

export const LABEL_JENIS_AGENDA: Record<string, string> = {
	rutin: 'Kegiatan Rutin',
	kegiatan: 'Kegiatan',
	rapat: 'Rapat',
	kajian: 'Kajian',
	lomba: 'Lomba'
};

export const LABEL_KATEGORI_BERITA: Record<string, string> = {
	kabar: 'Kabar',
	pengumuman: 'Pengumuman',
	artikel: 'Artikel',
	prestasi: 'Prestasi'
};

export const KATEGORI_KAS_MASUK = [
	'Iuran Anggota',
	'Donasi',
	'Salur Kas NU',
	'Sisa Anggaran Acara',
	'Lainnya'
];
export const KATEGORI_KAS_KELUAR = [
	'Konsumsi',
	'Alat Tulis & ATK',
	'Transportasi',
	'Santunan & Donasi',
	'Perlengkapan',
	'Acara',
	'Lainnya'
];

export const KATEGORI_DOKUMEN = [
	'AD/ART',
	'Program Kerja',
	'Formulir',
	'Laporan',
	'Sertifikat',
	'Umum'
];

export const JURUSAN_SMK = [
	'Teknik Komputer & Jaringan',
	'Rekayasa Perangkat Lunak',
	'Akuntansi & Keuangan Lembaga',
	'Teknik Otomotif',
	'Teknik Bisnis & Sepeda Motor',
	'Desain Komunikasi Visual',
	'Bisnis Digital',
	'Perhotelan',
	'Tata Kecantikan',
	'Agribisnis'
];
export const TINGKAT_KELAS = ['X', 'XI', 'XII'];

/** Tone badge utk status member */
export function toneStatusMember(status: string): 'amber' | 'green' | 'red' | 'gray' {
	switch (status) {
		case 'pending':
			return 'amber';
		case 'aktif':
			return 'green';
		case 'ditolak':
			return 'red';
		default:
			return 'gray';
	}
}

/**
 * Validasi tujuan redirect dari parameter (?lanjut=): hanya path internal
 * yang boleh, supaya tidak menjadi open redirect ke domain lain.
 * Mengembalikan path yang aman, atau undefined bila tidak valid.
 */
export function tujuanInternal(nilai: string | null | undefined): string | undefined {
	if (!nilai || nilai.length > 512) return undefined;
	if (!nilai.startsWith('/') || nilai.startsWith('//') || nilai.includes('\\')) return undefined;
	if (/^[a-z][a-z0-9+.-]*:/i.test(nilai)) return undefined;
	return nilai;
}
