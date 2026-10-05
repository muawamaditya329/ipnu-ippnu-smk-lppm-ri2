# DESIGN.md — Arah Desain Website Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja

Dokumen ini **MENGikat**. Setiap perubahan tampilan wajib mengikutinya. Tujuannya: situs yang terasa dirancang khusus untuk organisasi pelajar NU nyata — bukan hasil template generik.

## 1. Diagnosis: jejak template generik yang dihapus

Tanda-tanda berikut DILARANG muncul lagi di mana pun:

1. Font **Inter / Plus Jakarta Sans / Poppins / Roboto** (pasangan font paling klise di web).
2. Triti terpusat **eyebrow kecil uppercase → judul besar → subjudul abu** di setiap section.
3. **Kartu identik berbaris 3 kolom** berisi ikon dalam kotak pastel membulat + judul tebal + teks abu.
4. **Ikon dalam chip/kotak pastel** (`h-12 w-12 rounded-xl bg-primary-100`) di mana-mana.
5. **rounded-2xl/3xl + shadow lembut pada semua elemen** tanpa hierarki.
6. **Panel CTA hijau tua rounded-3xl terpusat + tombol emas** di bawah setiap halaman (pola template landing generik).
7. **Copy generik tanpa fakta**: "Wadah pengembangan diri", "Satu Semangat", "Bergabunglah bersama kami", daftar paralel "X & Y" tanpa satu pun contoh nyata.
8. Badge **pill warna penuh**, kartu/section berlatar pastel penuh (`bg-primary-50/100` selebar section), teks abu muda di latar terang (kontras gagal).
9. Emoji di UI (❤️ ✨ dsb.), angka statistik palsu, teks pengisi tanpa makna.

## 2. Arah: "berkas resmi + papan pengumuman pesantren"

Bayangkan gabungan **lembar dokumen resmi organisasi** (rasio, garis, stempel, tanda tangan) dan **papan pengumuman asrama** (padat, faktual, urut tanggal) yang ditata dengan tipografi editorial. Terasa: tegas, jujur, hangat, khas NU.

## 3. Aturan konkret

### 3.1 Tipografi (WAJIB diubah)

- **Display**: `Fraunces` (weight 600–700, optical size besar) — serif berkarakter untuk judul & angka besar.
- **Body**: `Archivo` (400/500/600/700) — grotesque pekerja yang bukan Inter.
- **Self-host**: unduh woff2 ke `/static/fonts/`, deklarasikan `@font-face` di `layout.css`, **hapus** link fonts.googleapis dari `app.html` (situs harus jalan offline/LAN). Bila unduhan gagal: gunakan stack sistem dengan karakter (Georgia/serif untuk display) dan catat di DESIGN.md.
- Judul display: `tracking-tight`, ukuran berani (hero 44–72px), tinggi baris ketat (1.05–1.15).
- Label kecil/kicker: uppercase 11–12px, `tracking-[0.14em]`, weight 600 — tapi rata kiri, BUKAN terpusat.
- **Keputusan teknis (terlaksana)**: Archivo & Fraunces variabel (woff2, subset latin + latin-ext) tersimpan di `/static/fonts/`, dideklarasikan lewat `@font-face` (`font-display: swap`) di `src/routes/layout.css`; tidak ada lagi link `fonts.googleapis.com`/preconnect di `src/app.html` — situs jalan offline/LAN.

### 3.2 Warna

- Latar **kertas**: `stone-50`/`white`; teks tinta `stone-900`.
- **Hijau NU = tinta**, bukan cat air: `primary-800/900` untuk teks aksen, header blok, garis. DILARANG: section penuh `bg-primary-50`, kartu `bg-primary-100`, chip pastel.
- **Merah** hanya menandai IPPNU (garis/badge kecil/aksen), bukan blok besar.
- **Emas** hanya aksen tipis: garis 2px, nomor section, satu tombol CTA utama. Bukan latar blok.
- Maksimal **satu blok hijau tua penuh per halaman** (header kategori atau CTA akhir — pilih satu), pola islami hanya di blok itu & kartu anggota.
- **Keputusan teknis (terlaksana)**: kepala setiap halaman publik memakai **kop kategori hijau tinta** — komponen `PageHeader` (kicker emas + judul display rata kiri + pola islami + garis emas bawah), konsisten antarhalaman; tidak ada blok hijau duplikat di tengah halaman. Karena kop sudah hijau, **seluruh halaman publik memakai footer kertas** (kolofon terang) — hanya ada satu blok hijau penuh per halaman. Di beranda peran kop diambil **hero** (pola islami + garis emas). CTA akhir beranda berupa baris kertas bergaris emas + `btn-gold`, bukan panel hijau membulat. Kartu anggota `/kartu` tetap hijau penuh sebagai pengecualian resmi.

### 3.3 Bentuk & garis

- Radius: kartu & tombol `rounded-lg` (8–10px) maksimum; media/foto boleh `rounded-xl`. Tidak ada rounded-3xl.
- **Keputusan teknis (token radius di `layout.css`)**: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 10px` (maks kartu/tombol), `--radius-xl: 12px` (khusus media/foto), `--radius-2xl/3xl` disamakan ke 12px sebagai pengaman — pemakaian lama tak pernah lebih membulat dari itu.
- Border `1px stone-200/300` tegas sebagai pembatas utama; **shadow hanya untuk overlay** (modal, dropdown) — kartu datar, terangkat hanya saat hover tautan.
- **Keputusan teknis (token bayangan)**: hanya satu level, `--shadow-overlay`, dipakai eksklusif Modal/lightbox. Token `shadow-soft`/`shadow-lift` dihapus; kartu memakai `.card` (datar) + `.card-hover` bila berupa tautan.
- Pemisah section: garis `1px` atau perubahan latar kertas↔putih, bukan jarak kosong besar.
- Aksen khas: garis kiri 2px pada kartu penting — kelas siap pakai **`.aksen-ipnu`** (hijau tinta), **`.aksen-ippnu`** (merah), **`.aksen-kas`** (emas keuangan), gaya "stempel/arsip". Didefinisikan SETELAH `.card` agar menang di sisi kiri saat digabung.

### 3.4 Layout & ritme

- **Section header editorial rata kiri**: nomor urut emas kecil (`01`, `02`) + judul display + garis memanjang ke kanan. BUKAN terpusat.
- Grid **asimetris & bervariasi**: 12-kolom (7+5, 8+4), daftar 1 kolom lebar, atau 2 kolom tak sama. DILARANG grid kartu identik 3 kolom.
- Ritme tinggi section bervariasi (`py-12` … `py-20`); halaman tidak boleh terasa "slot mesin".
- Konten padat & faktual: tanggal, angka, nama nyata. Kartu kegiatan wajib menyebut contoh konkret (mis. "Kajian Kitab Bulanan, Jumat Bersih, Lomba 17-an").
- Hero: komposisi asimetris, tipografi besar, info nyata (periode, nama sekolah, dua organisasi) — bukan teks terpusat di atas pola.
- **Beranda (terlaksana)**: hero = blok hijau tinta penuh (`pattern-islamic` + garis emas bawah) rata kiri, judul display bertingkat "IPNU & IPPNU / SMK LPPM RI 2 Kedungreja" + lembar "Data Komisariat" 4 kolom; statistik = strip baris horizontal bergaris 1px (angka Fraunces + label uppercase, tanpa kartu); dua organisasi = kartu tak identik 7/5 (IPNU garis hijau + daftar bergaris emas, IPPNU garis merah + daftar bernomor + catatan prestasi); agenda = daftar baris dengan blok tanggal kotak (garis atas mengikuti cakupan); berita = 1 unggulan kolom 8 + daftar kolom 4; galeri = strip 5 foto, 1 besar; CTA akhir = baris kertas bergaris emas.

### 3.5 Komponen

- **Ikon**: inline kecil (16–20px) di samping teks, atau di sudut kartu dengan stroke tipis — TANPA kotak pastel.
- **Badge**: kotak kecil 10–11px uppercase, border 1px + teks berwarna (bukan pill penuh warna). **Terlaksana**: `.badge` = latar putih + border 1px + teks 10px uppercase `tracking-[0.08em]`; varian tone (`.badge-green/red/amber/gray/blue`) hanya mengubah warna garis & teks.
- **Button**: tegas radius-md; primary hijau tinta; gold hanya "Daftar Anggota"; outline stone; danger merah tinta.
- **Kicker**: kelas **`.kicker`** — label uppercase 11px `tracking-[0.14em]` weight 600, rata kiri, warna `stone-500` bawaan.
- **Nomor section**: kelas **`.rule-num`** — angka emas Fraunces (`gold-700`, bold) untuk penomoran `01, 02, …` pada header section & daftar bernomor.
- **StatCard** → gaya buku kas: angka display besar, label uppercase kecil, garis kiri berwarna 2px, tanpa ikon chip. **Terlaksana**: ikon (bila diberi) dirender inline 14px di samping label.
- **SectionHeading** → editorial: properti `nomor` + judul + garis; rata kiri. Prop `center` dihapus — tidak ada lagi header section terpusat.
- **Tabel admin**: rapat profesional — th uppercase 11px stone-500, baris 1px, header sticky di halaman panjang, zebra halus bila membantu.
- **Modal/form**: datar, border tegas, label kecil uppercase, tanpa dekorasi.
- **EmptyState**: kering & jujur (satu kalimat + tautan aksi), tanpa ilustrasi klise.

### 3.6 Bahasa

- Indonesia baku, langsung, faktual, hangat khas organisasi. Nama nyata: Kedungreja, Cilacap, SMK LPPM RI 2, periode 2025/2026, nama kegiatan dari data seed.
- Setiap kalimat promosi harus bisa dijawab "ya" oleh fakta di situs sendiri (anggota, kas, agenda).
- Tanpa emoji di UI. Tanpa "Dibangun dengan ❤️" — ganti baris hak cipta profesional.

## 4. Checklist penerimaan tiap halaman

- [ ] Tidak ada satu pun item di daftar DILARANG (§1).
- [ ] Section header editorial rata kiri dengan nomor/garis.
- [ ] Tidak ada grid kartu identik; ada variasi komposisi.
- [ ] Maksimal satu blok hijau penuh; pola islami dijahit.
- [ ] Semua teks kontras ≥ 4.5:1; tidak ada teks terang di latar terang.
- [ ] Ada minimal satu data nyata (tanggal/angka/nama) di tiap section.
- [ ] `npm run check` 0 error; desktop & mobile 390px tak rusak.
