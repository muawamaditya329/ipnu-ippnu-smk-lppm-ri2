import { redirect } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { db, type Member } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// no_reg memakai '/' (contoh: IPN/2026/0001). Pada URL ia ter-encode menjadi %2F,
	// lalu SvelteKit menerjemahkannya kembali sehingga params.noReg berisi no_reg utuh.
	const noReg = params.noReg;

	const member = db
		.prepare(`SELECT * FROM members WHERE no_reg = ? AND status = 'aktif'`)
		.get(noReg) as Member | undefined;

	// Kartu hanya untuk anggota aktif; selain itu arahkan ke halaman cek status.
	if (!member) redirect(303, '/daftar/status');

	const qr = await QRCode.toDataURL(`IPNU-IPPNU|${noReg}|${member.nama}`, {
		margin: 1,
		width: 240
	});

	return { member, qr };
};
