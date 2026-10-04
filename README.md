# Website Komisariat IPNU & IPPNU — SMK LPPM RI 2 Kedungreja

Aplikasi web organisasi pelajar (mini-SaaS) untuk Pimpinan Komisariat Ikatan Pelajar Nahdlatul Ulama (IPNU) dan Ikatan Pelajar Putri Nahdlatul Ulama (IPPNU) SMK LPPM RI 2 Kedungreja, Cilacap.

## Fitur

| Bagian | Keterangan |
| --- | --- |
| Beranda | Profil singkat, statistik, visi–misi, agenda terdekat, berita terbaru, galeri |
| Pendaftaran anggota | Formulir online (putra → IPNU, putri → IPPNU), cek status lewat NIS, kartu anggota digital dengan QR + siap cetak |
| Berita & artikel | Kategori (kabar/pengumuman/artikel/prestasi), cakupan umum/IPNU/IPPNU, draft & terbit, hitung pembaca, tombol bagikan |
| Agenda kegiatan | Jadwal rutin & insidental, filter jenis, pemisahan akan datang / telah berlalu |
| Kas & iuran | Pencatatan pemasukan–pengeluaran, kategori, rekap bulanan, laporan publik (transparansi) |
| Galeri | Album foto + lightbox, unggah banyak foto sekaligus |
| Dokumen | AD/ART, program kerja, formulir — unduhan terhitung |
| Dasbor pengurus | Ringkasan statistik, pendaftar terbaru, agenda terdekat, kas terbaru |
| Manajemen | Verifikasi anggota + ekspor CSV, kelola pengguna (admin), pengaturan organisasi |

## Teknologi

- **SvelteKit 3** (Svelte 5 runes) + TypeScript
- **Tailwind CSS v4** — design system di `src/routes/layout.css` (hijau = IPNU/NU, merah = IPPNU, emas = aksen)
- **SQLite** via `better-sqlite3` — file `data/app.db`, skema di `src/lib/server/schema.sql`
- **adapter-node** — siap di-deploy ke VPS

## Menjalankan

```bash
npm install
npm run seed        # isi data contoh (admin/admin123, ipnu/ipnu123, ippnu/ippnu123)
npm run dev         # buka http://localhost:5173
```

Perintah lain:

```bash
npm run check       # type-check
npm run build       # build produksi ke ./build
npm run db:reset    # hapus & isi ulang data contoh
npm run lint        # prettier + eslint
```

Data (database & unggahan) tersimpan di folder `data/`. Pindahkan/backup folder ini untuk memindahkan isi situs.

## Deploy (VPS)

```bash
ORIGIN=https://domain-anda npm run build
PORT=3000 node build
```

> `ORIGIN` dibaca **saat build** dan dipakai untuk validasi CSRF form. Tanpa reverse proxy HTTPS, jalankan dengan header protokol:
> `PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=host node build`
> (set header tersebut di Nginx/Caddy). Lihat `src/routes/admin/` untuk menu; login di `/masuk`.

Contoh systemd / PM2: `pm2 start build/index.js --name ipnu-ippnu-web`.

## Struktur penting

```
src/routes/(publik)/   halaman publik (beranda, berita, agenda, galeri, dokumen, daftar, laporan-kas, tentang)
src/routes/admin/      dasbor & manajemen (anggota, berita, agenda, kas, galeri, dokumen, pengguna, pengaturan)
src/lib/server/        db + skema, auth sesi, unggahan, pengaturan
src/lib/components/    komponen UI & layout bersama
scripts/seed.mjs       data contoh (berita, agenda, kas, anggota, album, dokumen)
```

## Keamanan

- Password di-hash dengan scrypt; sesi via cookie httpOnly 30 hari.
- Seluruh `/admin/*` dilindungi di `src/hooks.server.ts`.
- Unggahan divalidasi (jenis & ukuran file) dan disajikan lewat rute `/uploads` yang aman dari path traversal.
- Konten artikel dirender dengan sanitasi (tanpa HTML mentah).
