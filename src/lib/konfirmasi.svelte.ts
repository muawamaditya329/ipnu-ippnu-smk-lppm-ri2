// Dialog konfirmasi in-app — pengganti confirm() bawaan browser.
// Satu instance <ConfirmDialog /> dipasang di layout (admin), state-nya modul ini.

export type OpsiKonfirmasi = {
	judul?: string;
	pesan: string;
	tombol?: string; // label tombol aksi, mis. 'Hapus'
	bahaya?: boolean; // true (bawaan) = aksi destruktif (merah); false = aksi biasa
};

export const dialog = $state<{ opsi: OpsiKonfirmasi | null; terbuka: boolean }>({
	opsi: null,
	terbuka: false
});

let penyelesai: ((setuju: boolean) => void) | undefined;

/** Tampilkan dialog konfirmasi; resolve true bila pengguna menyetujui. */
export function konfirmasi(opsi: OpsiKonfirmasi): Promise<boolean> {
	// bila ada permintaan yang masih menunggu, batalkan dengan false
	penyelesai?.(false);
	dialog.opsi = opsi;
	dialog.terbuka = true;
	return new Promise((res) => {
		penyelesai = res;
	});
}

export function jawabKonfirmasi(setuju: boolean) {
	penyelesai?.(setuju);
	penyelesai = undefined;
	dialog.terbuka = false;
	dialog.opsi = null;
}

/** Pasang di onsubmit form aksi (hapus/tolak): cegah kirim bawaan, tampilkan
 *  dialog, lalu kirim ulang form secara native bila disetujui. */
export function kirimJikaSetuju(e: SubmitEvent, opsi: OpsiKonfirmasi) {
	e.preventDefault();
	const form = e.currentTarget as HTMLFormElement;
	void konfirmasi(opsi).then((setuju) => {
		if (setuju) form.submit();
	});
}
