import { db, type Settings } from './db';

const DEFAULTS: Settings = {
	nama_organisasi: 'Pimpinan Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja',
	deskripsi:
		'Organisasi pelajar Nahdlatul Ulama putra dan putri di lingkungan SMK LPPM RI 2 Kedungreja, Kabupaten Cilacap, Jawa Tengah.',
	visi: 'Mewujudkan pelajar SMK LPPM RI 2 Kedungreja yang beriman, bertakwa, berakhlakul karimah, berprestasi, dan mandiri dengan landasan ahlussunnah wal jamaah.',
	misi: 'Menyelenggarakan kajian keagamaan rutin bagi pelajar;\nMengembangkan potensi akademik dan keterampilan vokasi anggota;\nMenumbuhkan semangat kebersamaan, disiplin, dan kepemimpinan;\nBerperan aktif dalam kegiatan sosial di sekolah dan masyarakat.',
	alamat: 'Jl. Raya Kedungreja, Kec. Kedungreja, Kab. Cilacap, Jawa Tengah 53267',
	no_telp: '(0282) 000000',
	email: 'ipnuippnu@smklppmri2kedungreja.sch.id',
	instagram: 'ipnuippnu_lppm2',
	youtube: '',
	tiktok: '',
	periode: '2025 / 2026',
	logo: '',
	tentang_panjang:
		'Pimpinan Komisariat Ikatan Pelajar Nahdlatul Ulama (IPNU) dan Ikatan Pelajar Putri Nahdlatul Ulama (IPPNU) SMK LPPM RI 2 Kedungreja adalah organisasi pelajar yang menaungi santri dan pelajar putra serta putri di lingkungan SMK LPPM RI 2 Kedungreja. Organisasi ini menjadi wadah pengembangan diri bagi pelajar, mulai dari kegiatan keagamaan seperti kajian kitab dan peringatan hari besar Islam, kegiatan sosial seperti santunan dan bakti masyarakat, hingga pengembangan diri melalui latihan dasar kepemimpinan dan lomba-lomba antar pelajar.\n\nSebagai bagian dari keluarga besar Nahdlatul Ulama, komisariat ini berpegang teguh pada nilai ahlussunnah wal jamaah ala nahdliyah yang rahmah (mencintai), ihtiram (menghormati), dan tawassuth (moderat).'
};

export function getSettings(): Settings {
	const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
	const map: Settings = { ...DEFAULTS };
	for (const r of rows) map[r.key] = r.value;
	return map;
}

export function setSetting(key: string, value: string): void {
	db.prepare(
		`INSERT INTO settings (key, value) VALUES (?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
	).run(key, value);
}
