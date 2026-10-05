import { db } from './db';
import { slugify } from '#lib/utils.ts';

/** Nilai enum posts yang sah (dipakai utk validasi input form). */
export const CAKUPAN_POSTS = ['umum', 'ipnu', 'ippnu'] as const;
export const KATEGORI_POSTS = ['kabar', 'pengumuman', 'artikel', 'prestasi'] as const;
export const STATUS_POSTS = ['draft', 'terbit'] as const;

/** Buat slug unik dari judul; slug = slug + '-2', '-3', dst bila bentrok. */
export function slugUnik(judul: string, kecualiId = -1): string {
	const dasar = slugify(judul);
	let slug = dasar;
	let i = 2;
	while (db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, kecualiId)) {
		slug = `${dasar}-${i}`;
		i++;
	}
	return slug;
}
