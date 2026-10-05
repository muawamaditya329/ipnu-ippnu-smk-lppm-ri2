import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from './db';

const EKSTENSI_GAMBAR = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const EKSTENSI_DOKUMEN = [
	...EKSTENSI_GAMBAR,
	'pdf',
	'doc',
	'docx',
	'xls',
	'xlsx',
	'ppt',
	'pptx',
	'zip'
];

const MAKS_GAMBAR = 5 * 1024 * 1024; // 5 MB
const MAKS_DOKUMEN = 25 * 1024 * 1024; // 25 MB

export class UploadError extends Error {}

/**
 * Simpan File ke data/uploads/<subdir>/ dan kembalikan path relatif
 * (dipakai sebagai nilai kolom `file`/`cover`, diakses lewat /uploads/<path>).
 */
export async function simpanUnggahan(
	file: File,
	subdir: string,
	jenis: 'gambar' | 'dokumen' = 'gambar'
): Promise<string> {
	if (!file || file.size === 0) throw new UploadError('File kosong atau tidak terkirim.');
	const boleh = jenis === 'gambar' ? EKSTENSI_GAMBAR : EKSTENSI_DOKUMEN;
	const maks = jenis === 'gambar' ? MAKS_GAMBAR : MAKS_DOKUMEN;

	const asli = file.name ?? '';
	// Ekstensi hanya diambil dari titik terakhir nama asli, lalu dicocokkan ke daftar
	// putih — nama file tidak pernah dipakai apa adanya di disk (nama disimpan = UUID).
	const ekstensi = asli.split('.').pop()?.toLowerCase() ?? '';
	if (!asli.includes('.') || !boleh.includes(ekstensi)) {
		throw new UploadError(
			`Format .${ekstensi || '?'} tidak didukung. Gunakan: ${boleh.join(', ')}`
		);
	}
	if (file.size > maks) {
		throw new UploadError(`Ukuran maksimal ${Math.round(maks / 1024 / 1024)} MB.`);
	}

	// subdir dibatasi pada segmen aman (tanpa '..', '.', pemisah absolut) agar penulis
	// file selamanya tetap di dalam UPLOAD_DIR, sekalipun pemanggil lupa memvalidasi.
	const segmenSubdir = String(subdir ?? '')
		.replaceAll('\\', '/')
		.split('/')
		.filter((s) => s && s !== '.' && s !== '..');
	if (!segmenSubdir.length) throw new UploadError('Lokasi unggahan tidak valid.');

	const dir = path.join(UPLOAD_DIR, ...segmenSubdir);
	mkdirSync(dir, { recursive: true });
	const nama = `${randomUUID()}.${ekstensi}`;
	const penuh = path.join(dir, nama);
	try {
		writeFileSync(penuh, Buffer.from(await file.arrayBuffer()));
	} catch (e) {
		// Penulisan gagal di tengah jalan (disk penuh, izin, dsb.): bersihkan jejak
		// file yang mungkin sudah tertulis sebagian agar tidak ada orphan di disk.
		try {
			unlinkSync(penuh);
		} catch {
			/* file memang belum sempat dibuat */
		}
		throw e;
	}
	return `${segmenSubdir.join('/')}/${nama}`;
}

/**
 * Lus jalur absolut file di dalam UPLOAD_DIR dari path relatif kolom `file`/`cover`
 * (atau permintaan /uploads/<path>). Mengembalikan null bila jalurnya kosong atau
 * mencoba keluar dari direktori unggahan.
 */
export function pathDalamUpload(relPath: string): string | null {
	const segmen = relPath
		.replaceAll('\\', '/')
		.split('/')
		.filter((s) => s && s !== '.' && s !== '..');
	if (!segmen.length) return null;

	const penuh = path.join(UPLOAD_DIR, ...segmen);
	// Pengaman kedua di luar penyaring segmen: pastikan hasil akhirnya memang
	// masih di dalam UPLOAD_DIR (menghitung ulang, bukan hanya membandingkan awalan).
	const relatif = path.relative(UPLOAD_DIR, penuh);
	if (!relatif || relatif.startsWith('..') || path.isAbsolute(relatif)) return null;
	return penuh;
}

/** Hapus file unggahan berdasarkan path relatif. Aman dari path traversal. */
export function hapusUnggahan(relPath: string | null | undefined): void {
	if (!relPath) return;
	const berkas = pathDalamUpload(relPath);
	if (!berkas) return;
	try {
		unlinkSync(berkas);
	} catch {
		/* file mungkin sudah tidak ada */
	}
}
