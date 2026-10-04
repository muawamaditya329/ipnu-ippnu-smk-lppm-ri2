import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR, db, type DocumentItem } from '#lib/server/db.ts';
import type { RequestHandler } from './$types';

/** Baca file dokumen dari direktori unggahan; 404 bila file hilang. */
async function bacaFile(berkas: string): Promise<Buffer> {
	try {
		return await readFile(berkas);
	} catch {
		error(404, 'File dokumen tidak ditemukan');
	}
}

/** Melayani unduhan dokumen + mencatat jumlah unduhan. */
export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const dokumen = db
		.prepare('SELECT * FROM documents WHERE id = ?')
		.get(Number.isInteger(id) ? id : 0) as DocumentItem | undefined;

	if (!dokumen) error(404, 'Dokumen tidak ditemukan');

	db.prepare('UPDATE documents SET downloads = downloads + 1 WHERE id = ?').run(dokumen.id);

	// Path relatif di kolom `file` sudah dari sistem unggahan, tetap disanitasi seperti /uploads/[...path].
	const segmen = dokumen.file
		.replaceAll('\\', '/')
		.split('/')
		.filter((s) => s && s !== '.' && s !== '..');
	if (!segmen.length) error(404, 'File dokumen tidak ditemukan');

	const berkas = path.join(UPLOAD_DIR, ...segmen);
	if (!berkas.startsWith(UPLOAD_DIR)) error(403, 'Akses ditolak');

	const isi = await bacaFile(berkas);

	const ekstensi = segmen.at(-1)?.split('.').pop() ?? '';
	const namaUnduh =
		dokumen.nama_file || (ekstensi ? `${dokumen.judul}.${ekstensi}` : dokumen.judul);
	// Escape tanda kutip, pemisah jalur, dan karakter tak valid utk header Content-Disposition.
	const namaAman =
		namaUnduh
			.replace(/[/\\:*?<>|]/g, '-')
			.replaceAll('"', "'")
			.replace(/[\r\n]/g, '')
			.trim() || 'dokumen';

	return new Response(new Uint8Array(isi), {
		headers: {
			'content-type': 'application/octet-stream',
			'content-disposition': `attachment; filename="${namaAman}"; filename*=UTF-8''${encodeURIComponent(namaUnduh)}`
		}
	});
};
