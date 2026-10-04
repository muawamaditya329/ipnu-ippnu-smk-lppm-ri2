import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import skemaSql from './schema.sql?raw';

/** Direktori data (database & unggahan) — bisa dioverride lewat env DATA_DIR. */
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(skemaSql);

export type User = {
	id: number;
	nama: string;
	username: string;
	role: 'admin' | 'pengurus';
};

export type Member = {
	id: number;
	no_reg: string | null;
	nama: string;
	jenis_kelamin: 'L' | 'P';
	nis: string | null;
	kelas: string | null;
	jurusan: string | null;
	tanggal_lahir: string | null;
	alamat: string | null;
	no_hp: string | null;
	nama_ortu: string | null;
	motivasi: string | null;
	foto: string | null;
	status: 'pending' | 'aktif' | 'ditolak' | 'alumni';
	catatan: string | null;
	created_at: string;
	approved_at: string | null;
};

export type Post = {
	id: number;
	slug: string;
	judul: string;
	ringkasan: string | null;
	konten: string;
	kategori: string;
	cover: string | null;
	cakupan: 'umum' | 'ipnu' | 'ippnu';
	status: 'draft' | 'terbit';
	penulis_id: number | null;
	penulis_nama: string | null;
	views: number;
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

export type EventItem = {
	id: number;
	judul: string;
	deskripsi: string | null;
	jenis: 'rutin' | 'kegiatan' | 'rapat' | 'kajian' | 'lomba';
	lokasi: string | null;
	tanggal: string;
	jam: string | null;
	tanggal_selesai: string | null;
	cakupan: 'umum' | 'ipnu' | 'ippnu';
	poster: string | null;
	status: 'terjadwal' | 'selesai' | 'dibatalkan';
};

export type Transaction = {
	id: number;
	jenis: 'masuk' | 'keluar';
	jumlah: number;
	kategori: string;
	keterangan: string;
	tanggal: string;
	dicatat_oleh: string | null;
};

export type Album = {
	id: number;
	judul: string;
	deskripsi: string | null;
	tanggal: string | null;
	jumlah_foto: number;
	cover: string | null;
};

export type Photo = {
	id: number;
	album_id: number;
	file: string;
	caption: string | null;
};

export type DocumentItem = {
	id: number;
	judul: string;
	deskripsi: string | null;
	kategori: string;
	file: string;
	nama_file: string | null;
	ukuran: number | null;
	downloads: number;
	created_at: string;
};

export type Settings = Record<string, string>;

/** Nomor urut berikutnya untuk no_reg, contoh: IPN/2026/0007 */
export function nextRegNumber(jenisKelamin: 'L' | 'P', tahun = new Date().getFullYear()): string {
	const prefix = jenisKelamin === 'L' ? 'IPN' : 'IPP';
	const count = db
		.prepare(
			`SELECT COUNT(*) AS n FROM members
			 WHERE jenis_kelamin = ? AND strftime('%Y', created_at) = ?`
		)
		.get(jenisKelamin, String(tahun)) as { n: number };
	return `${prefix}/${tahun}/${String(count.n + 1).padStart(4, '0')}`;
}
