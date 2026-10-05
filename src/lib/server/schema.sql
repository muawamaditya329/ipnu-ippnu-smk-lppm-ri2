-- =============================================================
-- Skema database — Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja
-- SQLite (better-sqlite3). File: data/app.db
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	nama TEXT NOT NULL,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'pengurus' CHECK (role IN ('admin', 'pengurus')),
	aktif INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- Calon & anggota. jenis_kelamin 'L' = IPNU, 'P' = IPPNU.
CREATE TABLE IF NOT EXISTS members (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	no_reg TEXT UNIQUE,
	nama TEXT NOT NULL,
	jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
	nis TEXT,
	kelas TEXT,
	jurusan TEXT,
	tanggal_lahir TEXT,
	alamat TEXT,
	no_hp TEXT,
	nama_ortu TEXT,
	motivasi TEXT,
	foto TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'aktif', 'ditolak', 'alumni')),
	catatan TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	approved_at TEXT,
	approved_by INTEGER REFERENCES users(id),
	-- Token acak (16 hex) yang menuntut keberadaan no_reg pada tautan kartu anggota.
	-- no_reg berpola mudah ditebak (IPN/2025/0001), jadi /kartu hanya tampil bila
	-- tautannya menyertakan token ini. DB lama memperoleh kolom ini lewat ALTER TABLE
	-- otomatis di src/lib/server/db.ts (beserta pengisian token untuk baris lama).
	token_kartu TEXT,
	-- Hash password login anggota (format sama dgn users.password_hash). Boleh NULL:
	-- anggota belum tentu punya akses login sampai pengurus menyiapkannya.
	-- DB lama memperoleh kolom ini lewat ALTER TABLE otomatis di db.ts.
	password_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);
CREATE INDEX IF NOT EXISTS idx_members_kelamin ON members (jenis_kelamin);

-- Sesi login anggota (terpisah dari sessions pengurus agar kebijakan
-- masa berlaku & pembersihannya tidak saling tergantung).
CREATE TABLE IF NOT EXISTS anggota_sessions (
	token TEXT PRIMARY KEY,
	member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_anggota_sessions_member ON anggota_sessions (member_id);
CREATE INDEX IF NOT EXISTS idx_anggota_sessions_expires ON anggota_sessions (expires_at);

-- Berita / artikel / pengumuman.
CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	judul TEXT NOT NULL,
	ringkasan TEXT,
	konten TEXT NOT NULL,
	kategori TEXT NOT NULL DEFAULT 'kabar',
	cover TEXT,
	cakupan TEXT NOT NULL DEFAULT 'umum' CHECK (cakupan IN ('umum', 'ipnu', 'ippnu')),
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'terbit')),
	penulis_id INTEGER REFERENCES users(id),
	views INTEGER NOT NULL DEFAULT 0,
	published_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);

-- Agenda / jadwal kegiatan.
CREATE TABLE IF NOT EXISTS events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	judul TEXT NOT NULL,
	deskripsi TEXT,
	jenis TEXT NOT NULL DEFAULT 'kegiatan' CHECK (jenis IN ('rutin', 'kegiatan', 'rapat', 'kajian', 'lomba')),
	lokasi TEXT,
	tanggal TEXT NOT NULL,
	jam TEXT,
	tanggal_selesai TEXT,
	cakupan TEXT NOT NULL DEFAULT 'umum' CHECK (cakupan IN ('umum', 'ipnu', 'ippnu')),
	poster TEXT,
	status TEXT NOT NULL DEFAULT 'terjadwal' CHECK (status IN ('terjadwal', 'selesai', 'dibatalkan')),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_tanggal ON events (tanggal);

-- Kas & iuran. jumlah disimpan dalam rupiah penuh (integer).
CREATE TABLE IF NOT EXISTS transactions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
	jumlah INTEGER NOT NULL,
	kategori TEXT NOT NULL,
	keterangan TEXT NOT NULL,
	tanggal TEXT NOT NULL,
	dicatat_oleh INTEGER REFERENCES users(id),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions (tanggal);

CREATE TABLE IF NOT EXISTS albums (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	judul TEXT NOT NULL,
	deskripsi TEXT,
	tanggal TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
	file TEXT NOT NULL,
	caption TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	judul TEXT NOT NULL,
	deskripsi TEXT,
	kategori TEXT NOT NULL DEFAULT 'umum',
	file TEXT NOT NULL,
	nama_file TEXT,
	ukuran INTEGER,
	downloads INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Profil organisasi yang bisa diedit pengurus (key-value).
CREATE TABLE IF NOT EXISTS settings (
	key TEXT PRIMARY KEY,
	value TEXT
);
