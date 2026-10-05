import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { db, type DocumentItem } from '#lib/server/db.ts';
import { pathDalamUpload } from '#lib/server/uploads.ts';
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

	// Path relatif di kolom `file` berasal dari sistem unggahan, tetap disanitasi
	// + dipastikan berada di dalam data/uploads (sama seperti /uploads/[...path]).
	const berkas = pathDalamUpload(dokumen.file);
	if (!berkas) error(404, 'File dokumen tidak ditemukan');

	const isi = await bacaFile(berkas);

	// Penghitung hanya bertambah bila file benar-benar berhasil dibaca & dikirim.
	db.prepare('UPDATE documents SET downloads = downloads + 1 WHERE id = ?').run(dokumen.id);

	const namaTersimpan = berkas.split('/').at(-1) ?? '';
	const ekstensi = namaTersimpan.split('.').pop() ?? '';
	const namaUnduh =
		dokumen.nama_file || (ekstensi ? `${dokumen.judul}.${ekstensi}` : dokumen.judul);
	// Buang SEMUA karakter kontrol (C0 + DEL, termasuk CR/LF) agar tidak ada cara
	// memecah/menyuntik header Content-Disposition, lalu Escape tanda kutip,
	// pemisah jalur, dan pemisah parameter header.
	// eslint-disable-next-line no-control-regex -- kelas karakter kontrol memang tujuannya
	const namaBersih = namaUnduh.replace(/[\u0000-\u001f\u007f]/g, '').trim();
	const namaAman = namaBersih.replace(/[/\\:*?<>|"]/g, '-').trim() || 'dokumen';

	return new Response(new Uint8Array(isi), {
		headers: {
			'content-type': 'application/octet-stream',
			'content-disposition': `attachment; filename="${namaAman}"; filename*=UTF-8''${encodeURIComponent(namaBersih)}`,
			'x-content-type-options': 'nosniff'
		}
	});
};
