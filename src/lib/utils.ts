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
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const hariID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** 25000 -> "Rp25.000" */
export function fmtRp(n: number | null | undefined): string {
	return formatterRupiah.format(Number(n ?? 0));
}

/** '2026-10-04' -> '4 Oktober 2026' */
export function fmtTanggal(s: string | null | undefined): string {
	if (!s) return '-';
	const [y, m, d] = s.slice(0, 10).split('-').map(Number);
	if (!y || !m || !d) return s;
	return `${d} ${bulanID[m - 1]} ${y}`;
}

/** '2026-10-04' -> 'Minggu, 4 Okt 2026' */
export function fmtTanggalPendek(s: string | null | undefined): string {
	if (!s) return '-';
	const [y, m, d] = s.slice(0, 10).split('-').map(Number);
	if (!y || !m || !d) return s;
	const hari = hariID[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
	return `${hari}, ${d} ${bulanID[m - 1].slice(0, 3)} ${y}`;
}

/** Timestamp SQLite ('2026-10-04 09:15:00' UTC) -> '4 Okt 2026, 16:15 WIB' */
export function fmtWaktu(s: string | null | undefined): string {
	if (!s) return '-';
	const iso = s.includes('T') ? s : s.replace(' ', 'T');
	const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
	if (Number.isNaN(d.getTime())) return s;
	const tanggal = `${d.getDate()} ${bulanID[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
	const jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
	return `${tanggal}, ${jam} WIB`;
}

/** '2026-10-04' -> objek {d:'04', m:'OKT', y:'2026'} untuk badge tanggal agenda */
export function pecahTanggal(s: string | null | undefined): { d: string; m: string; y: string } {
	const [y, m, d] = (s ?? '').slice(0, 10).split('-');
	return { d: d ?? '-', m: (bulanID[Number(m) - 1] ?? '?').slice(0, 3).toUpperCase(), y: y ?? '' };
}

export function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80) || 'tanpa-judul';
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
	const iso = s.includes('T') ? s : s.replace(' ', 'T');
	const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
	const beda = Math.floor((Date.now() - d.getTime()) / 1000);
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

export const KATEGORI_KAS_MASUK = ['Iuran Anggota', 'Donasi', 'Salur Kas NU', 'Sisa Anggaran Acara', 'Lainnya'];
export const KATEGORI_KAS_KELUAR = ['Konsumsi', 'Alat Tulis & ATK', 'Transportasi', 'Santunan & Donasi', 'Perlengkapan', 'Acara', 'Lainnya'];

export const KATEGORI_DOKUMEN = [
	'AD/ART',
	'Program Kerja',
	'Formulir',
	'Laporan',
	'Sertifikat',
	'Umum'
];

export const JURUSAN_SMK = ['Teknik Komputer & Jaringan', 'Rekayasa Perangkat Lunak', 'Akuntansi & Keuangan Lembaga', 'Teknik Otomotif', 'Teknik Bisnis & Sepeda Motor', 'Desain Komunikasi Visual', 'Bisnis Digital', 'Perhotelan', 'Tata Kecantikan', 'Agribisnis'];
export const TINGKAT_KELAS = ['X', 'XI', 'XII'];

/** Tone badge utk status member */
export function toneStatusMember(status: string): 'amber' | 'green' | 'red' | 'gray' {
	switch (status) {
		case 'pending': return 'amber';
		case 'aktif': return 'green';
		case 'ditolak': return 'red';
		default: return 'gray';
	}
}
