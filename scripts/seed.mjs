// ============================================================
// Seed data contoh — Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja
// Jalankan:  node scripts/seed.mjs          (hanya jika db masih kosong)
//            node scripts/seed.mjs --force  (hapus & isi ulang semua data)
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { scryptSync, randomBytes } from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';

const FORCE = process.argv.includes('--force');
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(DATA, 'uploads');

mkdirSync(path.join(UPLOADS, 'galeri'), { recursive: true });
mkdirSync(path.join(UPLOADS, 'dokumen'), { recursive: true });

const db = new Database(path.join(DATA, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(path.join(ROOT, 'src/lib/server/schema.sql'), 'utf-8'));

const hash = (pw) => {
	const salt = randomBytes(16).toString('hex');
	return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;
};

const adaData = db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
if (adaData && !FORCE) {
	console.log('Database sudah berisi data. Gunakan --force untuk mengisi ulang dari awal.');
	process.exit(0);
}
if (FORCE) {
	db.exec(`DELETE FROM photos; DELETE FROM albums; DELETE FROM transactions; DELETE FROM events;
		DELETE FROM posts; DELETE FROM documents; DELETE FROM members; DELETE FROM sessions;
		DELETE FROM users; DELETE FROM settings;`);
}

// ---------- Pengguna ----------
const userStmt = db.prepare(
	'INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)'
);
const admin = userStmt.run('Admin Komisariat', 'admin', hash('admin123'), 'admin').lastInsertRowid;
const pIpnu = userStmt.run('H. Ahmad Syaikhu (Pembina)', 'ipnu', hash('ipnu123'), 'pengurus').lastInsertRowid;
const pIppnu = userStmt.run('Ny. Hj. Sholihah (Pembina)', 'ippnu', hash('ippnu123'), 'pengurus').lastInsertRowid;

// ---------- Pengaturan ----------
const setStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
const settings = {
	nama_organisasi: 'Pimpinan Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja',
	deskripsi:
		'Organisasi pelajar Nahdlatul Ulama putra dan putri di lingkungan SMK LPPM RI 2 Kedungreja, Kabupaten Cilacap, Jawa Tengah. Wadah pengembangan diri pelajar melalui kegiatan keagamaan, sosial, dan kepemimpinan dengan landasan ahlussunnah wal jamaah.',
	visi: 'Mewujudkan pelajar SMK LPPM RI 2 Kedungreja yang beriman, bertakwa, berakhlakul karimah, berprestasi, dan mandiri dengan landasan ahlussunnah wal jamaah ala nahdliyah.',
	misi: 'Menyelenggarakan kajian keagamaan rutin bagi pelajar;\nMengembangkan potensi akademik dan keterampilan vokasi anggota;\nMenumbuhkan semangat kebersamaan, disiplin, dan kepemimpinan;\nBerperan aktif dalam kegiatan sosial di sekolah dan masyarakat.',
	alamat: 'Jl. Raya Kedungreja, Kec. Kedungreja, Kab. Cilacap, Jawa Tengah 53267',
	no_telp: '0812-0000-0000',
	email: 'ipnuippnu.lppm2@gmail.com',
	instagram: 'ipnuippnu.lppm2',
	youtube: '',
	tiktok: '',
	periode: '2025 / 2026'
};
for (const [k, v] of Object.entries(settings)) setStmt.run(k, v);

// ---------- Anggota ----------
const memberStmt = db.prepare(
	`INSERT INTO members (no_reg, nama, jenis_kelamin, nis, kelas, jurusan, tanggal_lahir, alamat, no_hp, nama_ortu, motivasi, status, created_at, approved_at, approved_by)
	 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const L = [
	['Ahmad Fauzi', 'XII', 'Teknik Komputer & Jaringan', 2008],
	['Rizky Maulana Hakim', 'XI', 'Rekayasa Perangkat Lunak', 2009],
	['Bagus Prasetyo', 'XI', 'Teknik Otomotif', 2009],
	['Dimas Ramadhan', 'X', 'Teknik Komputer & Jaringan', 2010],
	['Fajar Nugroho', 'X', 'Akuntansi & Keuangan Lembaga', 2010],
	['Wildan Hakim', 'XII', 'Teknik Bisnis & Sepeda Motor', 2008]
];
const P = [
	['Siti Aminah', 'XII', 'Akuntansi & Keuangan Lembaga', 2008],
	['Nurul Hidayah', 'XI', 'Teknik Komputer & Jaringan', 2009],
	['Fitriani Az Zahra', 'XI', 'Bisnis Digital', 2009],
	['Zulfa Nabila', 'X', 'Rekayasa Perangkat Lunak', 2010],
	['Dinda Ayu Kurnia', 'X', 'Akuntansi & Keuangan Lembaga', 2010],
	['Aisyah Rahmawati', 'XII', 'Desain Komunikasi Visual', 2008]
];
const kelurahan = ['Dusun Krajan', 'Dusun Karangsari', 'Dusun Wanacacing', 'Dusun Kembangsari'];
const hidupkan = (i) => `${kelurahan[i % kelurahan.length]}, Kedungreja`;
let noL = 0;
let noP = 0;
for (const [nama, kelas, jurusan, lahir] of L) {
	noL++;
	memberStmt.run(
		`IPN/2025/${String(noL).padStart(4, '0')}`, nama, 'L', `2025${String(1000 + noL)}`, kelas, jurusan,
		`${lahir}-0${(noL % 9) + 1}-1${noL % 9}`, hidupkan(noL), `0812-345${noL}-678${noL}`,
		'Bpk. ' + nama.split(' ')[0] + ' (Ayah)',
		'Ingin menambah wawasan agama dan bergabung dengan organisasi pelajar NU.', 'aktif',
		'2025-08-17 09:00:00', '2025-08-20 10:00:00', admin
	);
}
for (const [nama, kelas, jurusan, lahir] of P) {
	noP++;
	memberStmt.run(
		`IPP/2025/${String(noP).padStart(4, '0')}`, nama, 'P', `2025${String(2000 + noP)}`, kelas, jurusan,
		`${lahir}-1${(noP % 2) + 1}-2${noP % 8}`, hidupkan(noP + 1), `0813-456${noP}-789${noP}`,
		'Ibu ' + nama.split(' ')[0],
		'Bergabung demi ikut kegiatan kajian dan sosial bersama teman-teman IPPNU.', 'aktif',
		'2025-08-17 09:30:00', '2025-08-20 10:00:00', admin
	);
}
// Pendaftar baru (menunggu verifikasi)
const pending = [
	['Galih Saputra', 'L', 'X', 'Teknik Otomotif'],
	['Raffi Aulia Rahman', 'L', 'X', 'Rekayasa Perangkat Lunak'],
	['Hanif Abdurrahman', 'L', 'XI', 'Teknik Komputer & Jaringan'],
	['Laila Fitriani', 'P', 'X', 'Bisnis Digital'],
	['Maulida Putri', 'P', 'XI', 'Akuntansi & Keuangan Lembaga'],
	['Salma Syakirah', 'P', 'X', 'Desain Komunikasi Visual']
];
for (const [nama, jk, kelas, jurusan] of pending) {
	memberStmt.run(
		null, nama, jk, null, kelas, jurusan, null, hidupkan(2), `0857-123-45${Math.floor(Math.random() * 90 + 10)}`,
		null, 'Ingin bergabung dengan organisasi pelajar NU di sekolah.', 'pending', '2026-09-28 08:00:00', null, null
	);
}

// ---------- Berita ----------
const postStmt = db.prepare(
	`INSERT INTO posts (slug, judul, ringkasan, konten, kategori, cover, cakupan, status, penulis_id, views, published_at, created_at, updated_at)
	 VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`
);
const post = (slug, judul, ringkasan, konten, kategori, cakupan, status, penulis, views, tgl) =>
	postStmt.run(slug, judul, ringkasan, konten, kategori, cakupan, status, penulis, views, `${tgl} 08:00:00`, `${tgl} 08:00:00`, `${tgl} 08:00:00`);

post(
	'kajian-rutin-kitab-bulanan',
	'Kajian Kitab Rutin Bulanan Dihadiri Puluhan Pelajar',
	'Kajian kitab bulanan komisariat menghadirkan puluhan pelajar putra dan putri dengan pembahasan akhlak kepada orang tua.',
	`Komisariat IPNU dan IPPNU **SMK LPPM RI 2 Kedungreja** kembali menyelenggarakan kajian kitab rutin bulanan di masjid sekolah. Kegiatan yang masuk kalender rutin bulan ini dihadiri oleh puluhan pelajar dari berbagai jurusan.\n\nPada kesempatan kali ini, pembahasan menyoroti bab *akhlak kepada orang tua* yang dirasa sangat dekat dengan keseharian para pelajar. Peserta antusias mengajukan pertanyaan seputar adab berbakti di tengah kesibukan sekolah.\n\nKajian rutin ini diselenggarakan setiap **Jumat pekan kedua** setelah salat Jumat. Seluruh anggota diharapkan hadir tepat waktu dan membawa kitab masing-masing.`,
	'kabar', 'umum', 'terbit', pIpnu, 124, '2026-09-20'
);
post(
	'pengumuman-pendaftaran-anggota-baru',
	'Pendaftaran Anggota Baru Periode 2026 Dibuka',
	'Komisariat membuka pendaftaran anggota baru bagi seluruh pelajar putra dan putri SMK LPPM RI 2. Daftar melalui website!',
	`Assalamu'alaikum warahmatullahi wabarakatuh.\n\nKepada seluruh pelajar **SMK LPPM RI 2 Kedungreja**, pendaftaran anggota baru Komisariat IPNU (putra) dan IPPNU (putri) periode 2026/2027 resmi **dibuka**.\n\nCara mendaftar:\n1. Klik menu **Daftar Anggota** di website ini.\n2. Isi seluruh data dengan benar.\n3. Tunggu verifikasi dari pengurus — maksimal 3 hari.\n4. Cek status pendaftaran melalui menu **Cek Status**.\n\nAnggota yang telah terverifikasi berhak mengikuti seluruh kegiatan komisariat dan menerima kartu anggota. Kuota terbatas, segera daftarkan diri Anda!`,
	'pengumuman', 'umum', 'terbit', admin, 89, '2026-09-10'
);
post(
	'ippnu-juara-lomba-anoling',
	'Tim IPPNU Juara Umum Lomba Anoling Tingkat Kabupaten',
	'Tim 4H dan cerdas cermat IPPNU SMK LPPM RI 2 meraih juara umum dalam Anoling tingkat kabupaten Cilacap.',
	`Alhamdulillah, tim kepramukaan **4H (Hip Hip Hura)** dan cerdas cermat IPPNU SMK LPPM RI 2 Kedungreja berhasil meraih **juara umum** dalam kegiatan Anoling (Anak Ranting Pelajar Nahdlatul Ulama... Angkatan Muda) tingkat kabupaten Cilacap.\n\nCapaian detail:\n- **Juara 1** Cerdas Cermat Aqlam\n- **Juara 1** Lomba 4H\n- **Juara 2** Kaligrafi\n\nPrestasi ini merupakan buah latihan rutin selama liburan dan dukungan penuh pembina serta sekolah. Semoga menjadi motivasi untuk berprestasi lebih baik lagi di tingkat cabang dan wilayah.`,
	'prestasi', 'ippnu', 'terbit', pIppnu, 210, '2026-08-30'
);
post(
	'santunan-anak-yatim-kedungreja',
	'Santunan Anak Yatim & Dhuafa Keliling Desa',
	'Dana kas komisariat tersalurkan untuk santunan 25 anak yatim dan dhuafa di sekitar Kedungreja.',
	`Sebagai wujud kepedulian, komisariat menyelenggarakan **santunan anak yatim dan dhuafa** yang bersalur dari dana kas organisasi dan donasi anggota. Sebanyak 25 paket santunan dibagikan secara keliling ke empat dusun di Kedungreja.\n\nKegiatan dilaksanakan oleh tim gabungan putra IPNU dan putri IPPNU yang terbagi menjadi tiga kelompok rute. Paket berisi sembako, alat sekolah, dan bingkisan Lebaran.\n\nTerima kasih kepada seluruh anggota yang berdonasi. Laporan lengkap dapat dipantau di halaman **Laporan Kas**.`,
	'kabar', 'umum', 'terbit', admin, 67, '2026-08-12'
);
post(
	'ipnu-hadirkan-bincang-vokasi',
	'IPNU Hadirkan Bincang Santai "Vokasi Itu Keren"',
	'Alumni TKJ yang kini bekerja di bidang jaringan berbagi pengalaman karier kepada anggota IPNU.',
	`Bidang Pendidikan dan Kaderisasi IPNU menghadirkan acara *bincang santai* bertema **"Vokasi Itu Keren"**. Menghadirkan alumni SMK LPPM RI 2 angkatan 2019 yang kini bekerja sebagai teknisi jaringan.\n\nPembicara berbagi pengalaman mulai dari masa-masa magang, sertifikasi yang penting diambil, hingga peluang kerja di industri telekomunikasi. Diakhiri sesi tanya jawab yang hangat.\n\nAcara sejenis akan digelar rutin setiap bulan dengan pembicara dari berbagai bidang keahlian sesuai jurusan yang ada di sekolah.`,
	'artikel', 'ipnu', 'terbit', pIpnu, 45, '2026-07-25'
);
post(
	'muharraman-peringatan-tahun-baru-hijriah',
	'Muharraman: Peringatan Tahun Baru Hijriah di Sekolah',
	'Peringatan tahun baru hijriah diisi lomba azan, tartil, dan ceramah cendekia antar kelas.',
	`Komisariat bersama OSIS menyelenggarakan **Muharraman**, rangkaian peringatan tahun baru hijriah di lingkungan sekolah. Rangkaian dimulai dari peringatan *Asyura* hingga puncak acara di aula sekolah.\n\nRangkaian lomba antar kelas:\n- Lomba Azan\n- Lomba Tartil Qur'an\n- Ceramah Cendekia\n- Poster digital dakwah\n\nSeluruh juara diumumkan dan menerima piala bergilir dari pembina. Semoga semangat dakwah ini terus menyala sepanjang tahun hijriah baru.`,
	'kabar', 'umum', 'terbit', admin, 98, '2026-06-27'
);
post(
	'draf-rundown-milenial-muda',
	'Draf: Rundown Milenial Muda IPNU Ranting',
	'Konsep rundown kegiatan gabungan ranting, masih menunggu persetujuan pembina.',
	`Catatan kasar rundown kegiatan gabungan antar komisariat se-Kecamatan Kedungreja. Masih menunggu masukan pembina sebelum ditayangkan.\n\n- Sesi 1: Pembukaan dan ta'awun\n- Sesi 2: Materi kepemimpinan\n- Sesi 3: Diskusi kelompok\n- Sesi 4: Evaluasi dan rencana tindak lanjut`,
	'kabar', 'ipnu', 'draft', pIpnu, 0, '2026-09-25'
);

// ---------- Agenda / jadwal ----------
const eventStmt = db.prepare(
	`INSERT INTO events (judul, deskripsi, jenis, lokasi, tanggal, jam, tanggal_selesai, cakupan, status)
	 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const tanggalDatang = (hari) => {
	const d = new Date(Date.now() + hari * 86400000);
	return d.toISOString().slice(0, 10);
};
const tanggalLampau = (hari) => tanggalDatang(-hari);
const jumatBerikutnya = () => {
	const d = new Date();
	const beda = (5 - d.getDay() + 7) % 7 || 7;
	return tanggalDatang(beda);
};

eventStmt.run('Kajian Kitab Rutin', 'Kajian kitab bab akhlak bersama pembina, setiap Jumat pekan kedua. Wajib bagi anggota putra.', 'kajian', 'Masjid Sekolah', jumatBerikutnya(), '15:45', null, 'ipnu', 'terjadwal');
eventStmt.run('Rapat Rutin Pengurus', 'Evaluasi bulanan dan pembahasan program kerja bulan berikutnya. Membawa laporan bidang masing-masing.', 'rapat', 'Ruang OSIS', tanggalDatang(9), '15:30', null, 'umum', 'terjadwal');
eventStmt.run('Kajian Rutin IPPNU: Fikih Praktis', 'Kajian fikih seputar thaharah dan salat bersama Ustadzah pembina.', 'kajian', 'Aula Sekolah', tanggalDatang(12), '15:45', null, 'ippnu', 'terjadwal');
eventStmt.run('LDK: Latihan Dasar Kepemimpinan', 'Pelatihan dasar kepemimpinan bagi calon pengurus periode berikutnya. Dua hari satu malam, membawa perlengkapan pribadi.', 'kegiatan', 'Lapangan Sekolah & Masjid', tanggalDatang(21), '07:00', tanggalDatang(22), 'umum', 'terjadwal');
eventStmt.run('HUT NU ke-', 'Peringatan hari lahir Nahdlatul Ulama: kirab budaya, santunan, dan pengajian akbar. Patungan panitia dengan ranting.', 'kegiatan', 'Halaman Sekolah', tanggalDatang(35), '08:00', null, 'umum', 'terjadwal');
eventStmt.run('Jumat Berbagi', 'Anggota mengundang teman sekolah menabung seikhlasnya untuk kas sosial komisariat.', 'kegiatan', 'Gerbang Sekolah', tanggalDatang(5), '06:30', null, 'umum', 'terjadwal');
eventStmt.run('Santunan Anak Yatim', 'Penyaluran santunan hasil kas dan donasi anggota ke 25 anak yatim sekitar Kedungreja.', 'kegiatan', 'Keliling Dusun', tanggalLampau(30), '08:00', tanggalLampau(29), 'umum', 'selesai');
eventStmt.run('Lomba Antar Kelasa Muharraman', 'Lomba azan, tartil, dan ceramah cendekia dalam rangka peringatan tahun baru hijriah.', 'lomba', 'Aula Sekolah', tanggalLampau(60), '09:00', tanggalLampau(59), 'umum', 'selesai');

// ---------- Kas ----------
const kasStmt = db.prepare(
	`INSERT INTO transactions (jenis, jumlah, kategori, keterangan, tanggal, dicatat_oleh)
	 VALUES (?, ?, ?, ?, ?, ?)`
);
const bulanLalu = (n) => {
	const d = new Date();
	d.setMonth(d.getMonth() - n);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-`;
};
let kas = [];
for (let m = 3; m >= 0; m--) {
	const bl = bulanLalu(m);
	kas.push(['masuk', 850000, 'Iuran Anggota', `Iuran bulanan anggota putra & putri (${bl}05)`, bl + '05']);
	kas.push(['masuk', 150000, 'Donasi', 'Donasi sukarela pembina & alumni', bl + '10']);
	kas.push(['keluar', 120000, 'Konsumsi', 'Konsumsi kajian kitab rutin', bl + '14']);
	kas.push(['keluar', 75000, 'Alat Tulis & ATK', 'Spanduk & alat tulis sekretariat', bl + '18']);
	if (m === 1) kas.push(['keluar', 1250000, 'Santunan & Donasi', 'Santunan 25 anak yatim sekitar Kedungreja', bl + '20']);
	if (m === 1) kas.push(['masuk', 900000, 'Donasi', 'Donasi khusus program santunan dari warga', bl + '19']);
	if (m === 2) kas.push(['keluar', 400000, 'Acara', 'Konsumsi & perlengkapan Muharraman', bl + '24']);
	if (m === 0) kas.push(['masuk', 225000, 'Sisa Anggaran Acara', 'Sisa panitia Jumat Berbagi', bl + '06']);
}
for (const [jenis, jumlah, kategori, keterangan, tanggal] of kas)
	kasStmt.run(jenis, jumlah, kategori, keterangan, tanggal, admin);

// ---------- Galeri ----------
const albumStmt = db.prepare('INSERT INTO albums (judul, deskripsi, tanggal) VALUES (?, ?, ?)');
const photoStmt = db.prepare('INSERT INTO photos (album_id, file, caption) VALUES (?, ?, ?)');
const fotoSvg = (judul, c1, c2) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><path d="M320 120l28 84 84 28-84 28-28 84-28-84-84-28 84-28z" fill="#ffffff" fill-opacity="0.35"/><text x="320" y="400" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${judul}</text></svg>`;

const album = (judul, deskripsi, tanggal, fotos) => {
	const id = albumStmt.run(judul, deskripsi, tanggal).lastInsertRowid;
	fotos.forEach(([nama, caption, c1, c2], i) => {
		const file = `galeri/${judul.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}.svg`;
		writeFileSync(path.join(UPLOADS, file), fotoSvg(nama, c1, c2));
		photoStmt.run(id, file, caption);
	});
};
album(
	'Kajian Kitab Bulanan', 'Dokumentasi kajian kitab rutin komisariat bersama pembina.', '2026-09-20', [
		['Kajian Kitab', 'Suasana kajian di masjid sekolah', '#047857', '#022c22'],
		['Diskusi Anggota', 'Sesi tanya jawab bersama pembina', '#065f46', '#047857']
	]
);
album(
	'Santunan Anak Yatim', 'Penyaluran santunan ke 25 anak yatim dan dhuafa sekitar Kedungreja.', '2026-08-12', [
		['Tim Santunan', 'Kelompok putra sebelum berangkat keliling dusun', '#b45309', '#78350f'],
		['Penyerahan Paket', 'Penyerahan paket sembako kepada penerima', '#d97706', '#92400e']
	]
);
album(
	'Muharraman 1448 H', 'Lomba azan, tartil, dan ceramah cendekia antar kelas.', '2026-06-27', [
		['Lomba Azan', 'Peserta lomba azan antar kelas', '#b91c1c', '#450a0a'],
		['Penutupan', 'Penyerahan piala kepada juara', '#991b1b', '#7f1d1d']
	]
);

// ---------- Dokumen ----------
const buatPdf = (judul, baris) => {
	const esc = (s) => s.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
	const isi =
		`BT /F1 16 Tf 50 800 Td (${esc(judul)}) Tj ET\n` +
		`BT /F1 11 Tf 50 770 Td 16 TL\n` + baris.map((b) => `(${esc(b)}) Tj T*`).join('\n') + `\nET`;
	const obj = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${Buffer.byteLength(isi)} >>\nstream\n${isi}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];
	let pdf = '%PDF-1.4\n';
	const xref = [];
	obj.forEach((o, i) => {
		xref.push(Buffer.byteLength(pdf));
		pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
	});
	const xrefPos = Buffer.byteLength(pdf);
	pdf += `xref\n0 ${obj.length + 1}\n0000000000 65535 f \n` + xref.map((p) => String(p).padStart(10, '0') + ' 00000 n \n').join('');
	pdf += `trailer\n<< /Size ${obj.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
	return Buffer.from(pdf, 'latin1');
};

const docStmt = db.prepare(
	'INSERT INTO documents (judul, deskripsi, kategori, file, nama_file, ukuran) VALUES (?, ?, ?, ?, ?, ?)'
);
const dokumen = [
	['AD/ART IPNU (Salinan)', 'Anggaran Dasar dan Anggaran Rumah Tangga Ikatan Pelajar Nahdlatul Ulama.', 'AD/ART', ['Anggaran Dasar Ikatan Pelajar Nahdlatul Ulama', 'Disahkan pada Kongres ke-', 'Salinan untuk kalangan sendiri', 'Dokumen contoh untuk kebutuhan demo.']],
	['AD/ART IPPNU (Salinan)', 'Anggaran Dasar dan Anggaran Rumah Tangga Ikatan Pelajar Putri Nahdlatul Ulama.', 'AD/ART', ['Anggaran Dasar Ikatan Pelajar Putri Nahdlatul Ulama', 'Disahkan pada Kongres ke-', 'Salinan untuk kalangan sendiri', 'Dokumen contoh untuk kebutuhan demo.']],
	['Program Kerja Periode 2025/2026', 'Rincian program kerja komisariat beserta penanggung jawab bidang dan anggaran.', 'Program Kerja', ['PROGRAM KERJA KOMISARIAT', 'Periode 2025 / 2026', 'SMK LPPM RI 2 Kedungreja', 'Dokumen contoh untuk kebutuhan demo.']],
	['Formulir Pendaftaran Anggota (Cetak)', 'Formulir pendaftaran versi cetak bagi yang ingin mendaftar manual ke pengurus.', 'Formulir', ['FORMULIR PENDAFTARAN ANGGOTA', 'Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja', 'Isi data lengkap dan serahkan kepada pengurus.', 'Dokumen contoh untuk kebutuhan demo.']]
];
for (const [judul, deskripsi, kategori, baris] of dokumen) {
	const file = `dokumen/${judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`;
	const buf = buatPdf(judul, baris);
	writeFileSync(path.join(UPLOADS, file), buf);
	docStmt.run(judul, deskripsi, kategori, file, `${judul}.pdf`, buf.length);
}

console.log('Seed selesai ✔');
console.log('  Akun : admin/admin123 · ipnu/ipnu123 · ippnu/ippnu123');
console.log(`  Data : ${db.prepare('SELECT COUNT(*) n FROM members').get().n} anggota, ${db.prepare('SELECT COUNT(*) n FROM posts').get().n} berita, ${db.prepare('SELECT COUNT(*) n FROM events').get().n} agenda`);
