# Website Komisariat IPNU & IPPNU — SMK LPPM RI 2 Kedungreja

[![CI](https://github.com/muawamaditya329/ipnu-ippnu-smk-lppm-ri2/actions/workflows/ci.yml/badge.svg)](https://github.com/muawamaditya329/ipnu-ippnu-smk-lppm-ri2/actions/workflows/ci.yml)

Aplikasi web organisasi pelajar (mini-SaaS) untuk Pimpinan Komisariat Ikatan Pelajar Nahdlatul Ulama (IPNU) dan Ikatan Pelajar Putri Nahdlatul Ulama (IPPNU) SMK LPPM RI 2 Kedungreja, Cilacap.

## Fitur

| Bagian              | Keterangan                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda             | Profil singkat, statistik, visi–misi, agenda terdekat, berita terbaru, galeri                                                                                                                                                                                                                                                                                                                                                                        |
| Pendaftaran anggota | Formulir online (putra → IPNU, putri → IPPNU) dengan password akun (min. 6 karakter), cek status lewat NIS, kartu anggota digital dengan QR + siap cetak. Tautan kartu memuat token pribadi (16 hex) agar no_reg tidak bisa dienumerasi orang lain                                                                                                                                                                                                   |
| Berita & artikel    | Kategori (kabar/pengumuman/artikel/prestasi), cakupan umum/IPNU/IPPNU, draft & terbit, hitung pembaca, tombol bagikan                                                                                                                                                                                                                                                                                                                                |
| Agenda kegiatan     | Jadwal rutin & insidental, filter jenis, pemisahan akan datang / telah berlalu                                                                                                                                                                                                                                                                                                                                                                       |
| Kas & iuran         | Pencatatan pemasukan–pengeluaran, kategori, rekap bulanan, laporan publik (transparansi)                                                                                                                                                                                                                                                                                                                                                             |
| Galeri              | Album foto + lightbox, unggah banyak foto sekaligus                                                                                                                                                                                                                                                                                                                                                                                                  |
| Dokumen             | AD/ART, program kerja, formulir — unduhan terhitung                                                                                                                                                                                                                                                                                                                                                                                                  |
| Dasbor pengurus     | Ringkasan statistik, pendaftar terbaru, agenda terdekat, kas terbaru                                                                                                                                                                                                                                                                                                                                                                                 |
| Akun anggota        | Login anggota di `/masuk` tab Anggota (NIS + password), area anggota `/anggota`: dasbor (profil keanggotaan, agenda & kabar sesuai organisasi, tautan kartu) dan `/anggota/profil` (ubah kontak, ganti password); sesi & cookie terpisah dari sesi pengurus. Akun dibuat saat pendaftaran (password diisi pendaftar) dan dapat diatur ulang pengurus dari Data Anggota (tombol Atur Password); tabel anggota menampilkan badge Ada akun / Tanpa akun |
| Manajemen           | Verifikasi anggota + ekspor CSV, atur password akun anggota, kelola pengguna (admin), pengaturan organisasi                                                                                                                                                                                                                                                                                                                                          |

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

Akun anggota contoh (setelah seed): login tab Anggota di `/masuk` dengan NIS
`20251001` (putra/IPNU) atau `20252001` (putri/IPPNU), password `anggota123`.
Pendaftar baru mengisi passwordnya sendiri di formulir `/daftar`; setelah pengurus
menyetujui pendaftarannya, ia langsung bisa masuk dengan NIS + password tersebut.

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

> `ORIGIN` (asal URL situs, mis. `https://domain-anda`) **wajib diset saat build**:
> pada adapter-node versi ini variabel itu hanya dibaca saat `npm run build`,
> bukan saat `node build` dijalankan. Nilainya menentukan dua hal yang harus konsisten:
>
> 1. **Validasi CSRF** — semua POST form (login, tulis berita, catat kas, hapus data, dst.)
>    ditolak `403` bila header `Origin` permintaan tidak sama dengan `ORIGIN`. Tanpa
>    `ORIGIN` adapter-node menganggap situs ber-HTTPS, sehingga POST lewat HTTP biasa ikut tertolak.
> 2. **Cookie sesi** — ber-flag `Secure` hanya bila `ORIGIN` ber-HTTPS (lihat bagian Keamanan).
>
> Alternatif tanpa `ORIGIN` saat build (asal permintaan diambil dari header — set header
> ini di Nginx/Caddy, situs harus benar-benar diakses sesuai protokolnya):
> `PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=host node build`.
>
> Untuk deploy HTTP murni (LAN tanpa TLS), set `ORIGIN=http://ip-atau-host:port` saat build —
> cookie sesi otomatis tanpa `Secure` sehingga login tetap berfungsi.
>
> Lihat `src/routes/admin/` untuk menu; login di `/masuk`.

Contoh systemd / PM2: `pm2 start build/index.js --name ipnu-ippnu-web`.

## CI/CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`) — jalan pada setiap push & PR: `npm ci` → `npm run check` → `npm run build` → smoke test server hasil build (8 halaman publik harus 200, rute tak dikenal 404).
- **Tinjauan AI** (`.github/workflows/ai-review.yml`) — setiap PR otomatis ditinjau model GLM; hasilnya jadi komentar di PR. Tidak memblokir merge.
- **Agent (GLM)** (`.github/workflows/agent.yml`) — pengembangan per-agent: **satu agent = satu run Action**. Tugas bersumber dari `ci-agents/*.json` (dibuat oleh `scripts/agent-ci/buat-antrean.mjs` dari rencana penyempurnaan + mobile). Agent mengerjakan tugas di runner (alat bash/baca/tulis berkas, uji peramban chromium), wajib lolos gerbang `check → build → smoke` sebelum hasilnya di-push, lalu otomatis melanjutkan ke tugas berikutnya. Status tiap tugas tercatat di `ci-agents/status.json`. Gagal = rantai berhenti (periksa log run).
- **Rencana AI** (`.github/workflows/ai-tugas.yml`) — jalankan manual di tab *Actions → Run workflow*: isi deskripsi tugas, GLM menyusun rencana implementasi lalu membuat issue baru.
- Kunci API GLM disimpan sebagai repo secret `GLM_API_KEY` (Settings → Secrets and variables → Actions) — tidak pernah ditulis di berkas repo.

## Struktur penting

```
src/routes/(publik)/   halaman publik (beranda, berita, agenda, galeri, dokumen, daftar, laporan-kas, tentang)
src/routes/admin/      dasbor & manajemen (anggota, berita, agenda, kas, galeri, dokumen, pengguna, pengaturan)
src/lib/server/        db + skema, auth sesi, unggahan, pengaturan
src/lib/components/    komponen UI & layout bersama
scripts/seed.mjs       data contoh (berita, agenda, kas, anggota, album, dokumen)
DESIGN.md              arah desain (tipografi, warna, komposisi) yang mengikat
```

## Keamanan

- Password di-hash dengan scrypt; sesi via cookie `sesi_komisariat` ber-`HttpOnly`, `SameSite=Lax`, `Path=/`, berlaku 30 hari, dan ber-flag `Secure` bila situs ber-HTTPS (mengikuti `ORIGIN`; di dev server otomatis tanpa flag itu). Token sesi acak 256-bit, sekali pakai per login, dan dihapus saat logout.
- **CSRF**: semua aksi tulis (buat/ubah/hapus, login, logout) hanya menerima POST melalui form action SvelteKit, yang menolak permintaan dengan `Origin` di luar `ORIGIN` (403). Tidak ada endpoint mutasi lewat GET — satu-satunya endpoint GET (`/uploads/<path>` dan `/dokumen/<id>/unduh`) hanya membaca file / menambah penghitung unduhan & baca.
- Seluruh `/admin/*` dilindungi di `src/hooks.server.ts` (dan action sensitif memeriksa role admin lagi).
- Percobaan login gagal dibatasi 8 kali per kombinasi IP + username per 10 menit; redirect setelah login divalidasi agar tidak jadi pintu open-redirect.
- Unggahan divalidasi (jenis & ukuran file, nama acak UUID) dan disajikan lewat rute `/uploads` yang aman dari path traversal + header `CSP: sandbox`.
- Header respons: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (anti clickjacking), `Referrer-Policy: strict-origin-when-cross-origin`.
- Konten artikel dirender dengan sanitasi (tanpa HTML mentah).

## Hak akses per role

Kebijakan role diputuskan sekali dan diterapkan konsisten di server (bukan hanya di menu/sidebar):

- **Admin** (`admin`): seluruh dasbor, termasuk manajemen akun pengguna (`/admin/pengguna`: buat, aktif/nonaktif, reset password, hapus) dan **penghapusan transaksi kas**.
- **Pengurus** (`pengurus`): mengelola seluruh konten & data organisasi — anggota (verifikasi, status, hapus data salah), berita, agenda, galeri, dokumen, mencatat kas, dan pengaturan profil organisasi. Menu Pengguna disembunyikan; aksi khusus admin ditolak server dengan 403 meski dicoba langsung.

Alasan pembatasan yang dipilih: yang dijaga adalah tindakan yang menghapus **pertanggungjawaban atau akses** — catatan kas adalah jejak keuangan organisasi (sumber laporan kas publik) sehingga penghapusannya butuh wewenang admin (pengurus dapat mencatat; koreksi lama lewat admin), dan pengelolaan akun menentukan siapa boleh masuk. Sebaliknya penghapusan konten (berita/agenda/galeri/dokumen/anggota) adalah bagian rutin pemeliharaan yang tetap diberikan ke pengurus.
