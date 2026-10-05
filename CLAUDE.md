# Website Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja

Aplikasi web organisasi pelajar (SvelteKit + SQLite) untuk Pimpinan Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja, Cilacap. Bahasa UI: **Indonesia baku** — seluruh teks tampilan, pesan galat, dan komentar kode memakai bahasa Indonesia.

## Teknologi

- **SvelteKit 3** + Svelte 5 runes + TypeScript, **adapter-node** (siap deploy VPS)
- **Tailwind CSS v4** — design system di `src/routes/layout.css`, arah desain di `DESIGN.md` (mengikat)
- **SQLite** via `better-sqlite3` — file `data/app.db`, skema `src/lib/server/schema.sql` (DB lama di-ALTER otomatis oleh `db.ts`)

## Perintah

```bash
npm run dev         # dev server (http://localhost:5173)
npm run check       # svelte-check — HARUS 0 error sebelum selesai
npm run build       # build produksi ke ./build
npm run seed        # isi data contoh; db:reset = hapus & isi ulang
npm run lint        # prettier --check + eslint
```

Jangan menjalankan `npm run db:reset` sembarangan (menghapus data), dan jangan `git commit` tanpa diminta.

## Konvensi penting

- Alias `$lib` tidak dipakai. Gunakan **`#lib/...` dengan ekstensi file**: `#lib/server/db.ts`, `#lib/utils.ts`, `#lib/components/ui/Modal.svelte`. (Peta alias ada di `package.json` → `imports`.)
- `$app/environment` → `$app/env`; `Handle` dari `@sveltejs/kit/hooks`.
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props()`, snippet + `{@render}`; komponen menerima prop dengan `let { data, form }: PageProps = $props();` dari `./$types`.
- **Class design system** (`layout.css`): `card` (datar, tanpa shadow) + `card-hover`, `btn` + varian (`btn-primary/outline/ghost/danger/sm/lg`; **`btn-gold` hanya CTA pendaftaran**), `input`, `label` (uppercase kecil), `hint`, `error-text`, `th`, `td`, `badge` + tone (`badge-green/red/amber/gray/blue` — kotak border 1px, bukan pill), `kicker` (label uppercase rata kiri), `rule-num` (nomor section emas), `aksen-ipnu`/`aksen-ippnu`/`aksen-kas` (garis kiri 2px). Radius maks `rounded-lg` (10px; `xl` hanya media/foto). Shadow hanya `shadow-overlay` untuk modal/dropdown — kartu & section datar. Ikon dari `@lucide/svelte` (inline kecil, tanpa kotak pastel). Komponen UI bersama di `src/lib/components/ui/` (Modal, ConfirmDialog, EmptyState, StatCard, Pagination, SectionHeading — editorial rata kiri dengan prop `nomor`, tanpa prop `center` —, Badge, Button). Font self-host: Fraunces (display) & Archivo (sans) di `/static/fonts`, dideklarasikan di `layout.css`.
- **Pola form action**: satu type `HasilAksi` seragam untuk semua return action; validasi server per-field → `fail(400, { galat: { field: 'pesan' } })`; nilai isian dikembalikan lewat `nilai` agar form terisi ulang; success juga membawa `sukses: true, pesan`. Lihat contoh matang: `admin/pengguna`, `admin/anggota`, `(publik)/daftar`.
- Aksi yang merusak data selalu POST + konfirmasi via `kirimJikaSetuju()` (`#lib/konfirmasi.svelte.ts`).
- Keamanan jangan diturunkan: guard `/admin` & `/anggota` di `hooks.server.ts`, hash password scrypt (`auth.ts`, format `scrypt$N$r$p$salt$hash`), batas panjang isian sebelum scrypt, rate limit login & pendaftaran, eksplisit pemilihan kolom (jangan `SELECT *` pada halaman publik/sesi).
- Zona waktu: tanggal kalender memakai WIB (`hariIni()`, `tanggalWib()` di `#lib/utils.ts`) — jangan pakai tahun/tanggal UTC mentah.

## Akun & data demo (seed)

- Pengurus: `admin/admin123` (admin), `ipnu/ipnu123` & `ippnu/ippnu123` (pengurus).
- Anggota: login **tab Anggota** di `/masuk` — NIS `20251001` (putra/IPNU) atau `20252001` (putri/IPPNU), password `anggota123`.

## Area anggota & akun anggota

- Route `/anggota` (dasbor anggota) dan `/anggota/profil` (ubah kontak, ganti password); guard sesi tersendiri (cookie `sesi_anggota`, logika di `#lib/server/auth-anggota.ts`) — terpisah dari sesi pengurus (`auth.ts`).
- Akun anggota lahir dari dua jalur: (1) pendaftar mengisi Password + Konfirmasi di formulir `/daftar` (min. 6 karakter, di-hash sejak INSERT); (2) pengurus mengatur ulang lewat tombol **Atur Password** di `/admin/anggota` (action `?/password`, modal kecil) — mengganti password memutus sesi anggota terkait.
- Tabel `/admin/anggota` menampilkan badge **Ada akun / Tanpa akun** dari keberadaan `members.password_hash`; kolom hash tidak pernah dikirim ke klien (load memilih kolom eksplisit + flag `punya_akun`).
- Login anggota menentukan status: `pending` → "belum diverifikasi", `ditolak` → penolakan, tanpa password → "hubungi pengurus"; hanya `aktif`/`alumni` yang bisa masuk.
- `/daftar/status` menampilkan hint **"Sudah punya akun? Masuk di sini"** → `/masuk?tab=anggota` untuk pendaftar yang sudah aktif.

## Jebakan yang sudah ditemukan

- adapter-node membaca `ORIGIN` **saat build**, bukan saat runtime — POST form ditolak 403 bila `ORIGIN` tidak cocok (detail di README bagian Deploy).
- npm 12 memblokir script install `better-sqlite3`: perlu `npm install-scripts approve better-sqlite3` + `npm rebuild`.
- Dev server SvelteKit tidak mengecek CSRF seperti adapter-node produksi; tetap uji lewat form sungguhan.
