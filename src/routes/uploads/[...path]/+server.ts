import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '#lib/server/db.ts';
import type { RequestHandler } from './$types';

const MIME: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif',
	svg: 'image/svg+xml',
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	zip: 'application/zip'
};

/** Melayani file unggahan dari data/uploads (aman dari path traversal). */
export const GET: RequestHandler = async ({ params }) => {
	const segmen = (params.path ?? '')
		.replaceAll('\\', '/')
		.split('/')
		.filter((s) => s && s !== '.' && s !== '..');

	if (!segmen.length) error(404, 'File tidak ditemukan');

	const berkas = path.join(UPLOAD_DIR, ...segmen);
	if (!berkas.startsWith(UPLOAD_DIR)) error(403, 'Akses ditolak');

	try {
		const isi = await readFile(berkas);
		const ekstensi = segmen.at(-1)?.split('.').pop()?.toLowerCase() ?? '';
		return new Response(new Uint8Array(isi), {
			headers: {
				'content-type': MIME[ekstensi] ?? 'application/octet-stream',
				'cache-control': 'public, max-age=86400'
			}
		});
	} catch {
		error(404, 'File tidak ditemukan');
	}
};
