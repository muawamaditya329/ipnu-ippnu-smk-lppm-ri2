import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { pathDalamUpload } from '#lib/server/uploads.ts';
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
	const berkas = pathDalamUpload(params.path ?? '');
	if (!berkas) error(404, 'File tidak ditemukan');

	try {
		const isi = await readFile(berkas);
		const nama = berkas.split('/').at(-1) ?? '';
		const ekstensi = nama.split('.').pop()?.toLowerCase() ?? '';
		// hasOwn: lookup aman dari properti warisan prototype (mis. "constructor"),
		// sehingga content-type selalu berupa nilai MIME yang sah.
		const tipe = Object.hasOwn(MIME, ekstensi) ? MIME[ekstensi] : undefined;
		return new Response(new Uint8Array(isi), {
			headers: {
				'content-type': tipe ?? 'application/octet-stream',
				'cache-control': 'public, max-age=86400',
				// Sandbox: SVG (dan sejenisnya) tidak boleh mengeksekusi skrip saat dibuka langsung,
				// meski tetap tampil normal sebagai <img> di halaman situs.
				'content-security-policy': 'sandbox',
				// Cegah browser "menebak" tipe file unggahan (mis. HTML berisi skrip).
				'x-content-type-options': 'nosniff'
			}
		});
	} catch {
		error(404, 'File tidak ditemukan');
	}
};
