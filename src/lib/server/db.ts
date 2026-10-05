import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { hariIni } from '#lib/utils.ts';
import skemaSql from './schema.sql?raw';

/** Direktori data (database & unggahan) — bisa dioverride lewat env DATA_DIR. */
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'app.db'));
db.pragma('journal_mode = WAL');
// Pasangan baku WAL: tulisan tetap tahan crash namun tidak dipaksa fsync penuh
// pada setiap commit (jauh lebih cepat untuk INSERT beruntun).
db.pragma('synchronous = NORMAL');
// Dua proses server (mis. cluster/PM2) memperebutkan kunci tulis yang sama:
// tunggu maksimal 5 detik alih-alih langsung gagal dengan SQLITE_BUSY.
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

db.exec(skemaSql);

// ---------- Migrasi ringan utk database lama ----------
// Kolom token_kartu ditambahkan belakangan. CREATE TABLE IF NOT EXISTS tidak
// mengubah tabel yang sudah ada, jadi kolomnya ditambahkan manual di sini.
// try/catch: error "duplicate column name" berarti kolom memang sudah ada.
try {
	db.exec('ALTER TABLE members ADD COLUMN token_kartu TEXT');
} catch {
	// Kolom sudah ada — tidak ada yang perlu dilakukan.
}

// Kolom password_hash untuk login anggota ditambahkan belakangan juga (skema
// di atas hanya berlaku utk database baru). Idempoten: "duplicate column name"
// berarti database lama sudah dimigrasi sebelumnya.
try {
	db.exec('ALTER TABLE members ADD COLUMN password_hash TEXT');
} catch {
	// Kolom sudah ada — tidak ada yang perlu dilakukan.
}

/** Token acak 16 digit hex — mengunci halaman kartu agar tak bisa di-enumerasi. */
export function tokenKartuBaru(): string {
	return randomBytes(8).toString('hex');
}

// Baris lama (maupun baris dari seed/versi sebelumnya) wajib punya token agar
// tautan kartunya tetap berfungsi. Diisi satu per satu supaya token tidak kembar.
const tanpaToken = db
	.prepare(`SELECT id FROM members WHERE token_kartu IS NULL OR token_kartu = ''`)
	.all() as { id: number }[];
if (tanpaToken.length) {
	const isiToken = db.prepare('UPDATE members SET token_kartu = ? WHERE id = ?');
	for (const { id } of tanpaToken) isiToken.run(tokenKartuBaru(), id);
}

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
	/** Kunci tautan kartu anggota (lihat komentar kolom di schema.sql). */
	token_kartu: string | null;
	/** Hash password login anggota — null bila akunnya belum disiapkan pengurus. */
	password_hash: string | null;
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
// Tahun diambil dari hari kalender WIB (Asia/Jakarta), bukan dari zona waktu mesin:
// malam tahun baru WIB (17:00 UTC 31 Des) server UTC masih "tahun lalu".
export function nextRegNumber(
	jenisKelamin: 'L' | 'P',
	tahun = Number(hariIni().slice(0, 4))
): string {
	const prefix = jenisKelamin === 'L' ? 'IPN' : 'IPP';
	const awalan = `${prefix}/${tahun}/`;
	// Nomor urut diambil dari no_reg TERTINGGI yang sudah terpakai dengan awalan
	// sama — bukan dari COUNT pendaftar. Dengan begitu nomor tetap benar & unik
	// walau ada pendaftar yang belum diproses, ada data yang dihapus, maupun
	// beberapa pendaftar disetujui satu per satu secara berurutan.
	const maks = (
		db
			.prepare(
				`SELECT COALESCE(MAX(CAST(substr(no_reg, ?) AS INTEGER)), 0) AS maks
				 FROM members WHERE no_reg LIKE ?`
			)
			.get(awalan.length + 1, `${awalan}%`) as { maks: number }
	).maks;
	return `${awalan}${String(maks + 1).padStart(4, '0')}`;
}

/** Apakah error ini bentrok batasan UNIQUE/PRIMARY KEY — dua penulisan memperebutkan nilai sama? */
export function bentrokUnik(e: unknown): boolean {
	const kode = (e as { code?: string } | null)?.code;
	return kode === 'SQLITE_CONSTRAINT_UNIQUE' || kode === 'SQLITE_CONSTRAINT_PRIMARYKEY';
}

/**
 * Jalankan `fn` dalam transaksi IMMEDIATE (kunci tulis diambil sejak BEGIN, bukan
 * menunggu pernyataan tulis pertama) dan ulangi hingga `maksPercobaan` kali bila
 * `fn` kena bentrok UNIQUE. Dipakai untuk penulisan yang MEMBANGKITKAN nilai unik
 * (slug berita, no_reg anggota): bila dua proses server kebetulan memperebutkan
 * nilai yang sama, percobaan berikutnya menghitung ulang dari isi tabel terkini
 * (slugUnik/nextRegNumber selalu membaca tabel) sehingga memperoleh nilai yang bebas.
 * Syarat: `fn` sinkron penuh (tanpa await) dan memanggil pembangkit nilai uniknya
 * DI DALAM `fn`, bukan sebelumnya.
 */
export function transaksiUnik<T>(fn: () => T, maksPercobaan = 5): T {
	let terakhir: unknown;
	for (let i = 0; i < maksPercobaan; i++) {
		try {
			return db.transaction(fn).immediate();
		} catch (e) {
			terakhir = e;
			if (!bentrokUnik(e)) throw e;
		}
	}
	throw terakhir;
}
