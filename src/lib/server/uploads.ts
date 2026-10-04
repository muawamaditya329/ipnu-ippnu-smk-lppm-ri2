import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from './db';

const EKSTENSI_GAMBAR = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const EKSTENSI_DOKUMEN = [...EKSTENSI_GAMBAR, 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];

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
	const ekstensi = asli.split('.').pop()?.toLowerCase() ?? '';
	if (!boleh.includes(ekstensi)) {
		throw new UploadError(`Format .${ekstensi || '?'} tidak didukung. Gunakan: ${boleh.join(', ')}`);
	}
	if (file.size > maks) {
		throw new UploadError(`Ukuran maksimal ${Math.round(maks / 1024 / 1024)} MB.`);
	}

	const dir = path.join(UPLOAD_DIR, subdir);
	mkdirSync(dir, { recursive: true });
	const nama = `${randomUUID()}.${ekstensi}`;
	writeFileSync(path.join(dir, nama), Buffer.from(await file.arrayBuffer()));
	return `${subdir}/${nama}`;
}

/** Hapus file unggahan berdasarkan path relatif. Aman dari path traversal. */
export function hapusUnggahan(relPath: string | null | undefined): void {
	if (!relPath) return;
	const aman = relPath.replaceAll('\\', '/').split('/').filter((s) => s && s !== '.' && s !== '..');
	if (!aman.length) return;
	try {
		unlinkSync(path.join(UPLOAD_DIR, ...aman));
	} catch {
		/* file mungkin sudah tidak ada */
	}
}
