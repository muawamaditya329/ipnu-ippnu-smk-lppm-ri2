import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { hariIni, JURUSAN_SMK, TINGKAT_KELAS } from '#lib/utils.ts';
import type { Actions } from './$types';

type NilaiForm = {
	nama: string;
	jenis_kelamin: string;
	nis: string;
	kelas: string;
	jurusan: string;
	tanggal_lahir: string;
	alamat: string;
	no_hp: string;
	nama_ortu: string;
	motivasi: string;
};

/** Bentuk seragam utk semua return action agar mudah ditipkan di halaman. */
type HasilDaftar = {
	sukses: boolean;
	nama: string;
	nis: string;
	galat: Record<string, string> | null;
	nilai: NilaiForm | null;
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();

		const nama = String(fd.get('nama') ?? '').trim();
		const jenis_kelamin = String(fd.get('jenis_kelamin') ?? '');
		const nis = String(fd.get('nis') ?? '').trim();
		const kelas = String(fd.get('kelas') ?? '');
		const jurusan = String(fd.get('jurusan') ?? '');
		const tanggal_lahir = String(fd.get('tanggal_lahir') ?? '').trim();
		const alamat = String(fd.get('alamat') ?? '').trim();
		const no_hp = String(fd.get('no_hp') ?? '').trim();
		const nama_ortu = String(fd.get('nama_ortu') ?? '').trim();
		const motivasi = String(fd.get('motivasi') ?? '').trim();

		const nilai: NilaiForm = {
			nama,
			jenis_kelamin,
			nis,
			kelas,
			jurusan,
			tanggal_lahir,
			alamat,
			no_hp,
			nama_ortu,
			motivasi
		};
		const galat: Record<string, string> = {};

		if (nama.length < 3) galat.nama = 'Nama minimal 3 karakter.';
		if (jenis_kelamin !== 'L' && jenis_kelamin !== 'P') {
			galat.jenis_kelamin = 'Pilih status putra (IPNU) atau putri (IPPNU).';
		}
		if (!/^[0-9]{4,15}$/.test(nis)) {
			galat.nis = 'NIS harus berupa angka (4–15 digit tanpa spasi).';
		} else {
			// Satu NIS hanya boleh dipakai sekali selama masih menunggu verifikasi / aktif.
			const bentrok = db
				.prepare(`SELECT id FROM members WHERE nis = ? AND status IN ('pending', 'aktif') LIMIT 1`)
				.get(nis) as { id: number } | undefined;
			if (bentrok) galat.nis = 'NIS sudah terdaftar.';
		}
		if (!TINGKAT_KELAS.includes(kelas)) galat.kelas = 'Pilih tingkat kelas.';
		if (!JURUSAN_SMK.includes(jurusan)) galat.jurusan = 'Pilih jurusan.';
		if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal_lahir) || tanggal_lahir > hariIni()) {
			galat.tanggal_lahir = 'Tanggal lahir tidak valid.';
		}
		if (!/^[0-9()+\s-]{9,}$/.test(no_hp)) {
			galat.no_hp = 'Nomor HP tidak valid, contoh: 0812-3456-7890.';
		}

		if (Object.keys(galat).length) {
			return fail(400, { sukses: false, nama: '', nis: '', galat, nilai } satisfies HasilDaftar);
		}

		db.prepare(
			`INSERT INTO members (nama, jenis_kelamin, nis, kelas, jurusan, tanggal_lahir, alamat, no_hp, nama_ortu, motivasi, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
		).run(
			nama,
			jenis_kelamin,
			nis,
			kelas,
			jurusan,
			tanggal_lahir,
			alamat || null,
			no_hp,
			nama_ortu || null,
			motivasi || null
		);

		return { sukses: true, nama, nis, galat: null, nilai: null } satisfies HasilDaftar;
	}
};
