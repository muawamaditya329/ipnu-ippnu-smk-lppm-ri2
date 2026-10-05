import type { Handle } from '@sveltejs/kit/hooks';
import { getSessionUser, SESI_COOKIE } from '#lib/server/auth.ts';
import { getSessionAnggota, SESI_ANGGOTA_COOKIE } from '#lib/server/auth-anggota.ts';

/**
 * Pasang header keamanan pada sebuah respons, lalu kembalikan responsnya.
 * Dipanggil untuk SETIAP respons keluar — halaman, endpoint API, file unggahan,
 * halaman error, maupun redirect — sehingga tak ada respons yang lolos tanpa header.
 */
function pasangHeaderKeamanan(response: Response, pathname: string): Response {
	// Browser tidak boleh menebak tipe isi (penting utk file unggahan di /uploads).
	response.headers.set('x-content-type-options', 'nosniff');
	// Anti-clickjacking: halaman tak boleh di-frame situs lain sama sekali.
	// Khusus file unggahan (/uploads) dipakai SAMEORIGIN agar situs sendiri masih
	// bisa menampilkan pratinjau berkas (mis. PDF) dalam frame bila kelak perlu,
	// sementara situs lain tetap tidak bisa mem-frame-nya.
	response.headers.set('x-frame-options', pathname.startsWith('/uploads/') ? 'SAMEORIGIN' : 'DENY');
	// Jangan bocorkan URL penuh (mis. token/parameter) sebagai referrer ke situs luar.
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	// Matikan API/fitur browser yang tidak dipakai aplikasi ini sama sekali.
	response.headers.set(
		'permissions-policy',
		'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
	);
	// Isolasi browsing context: halaman lain tak bisa memegang window.opener
	// ke halaman kita (pelengkap rel="noopener" pada tautan eksternal).
	response.headers.set('cross-origin-opener-policy', 'same-origin');
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getSessionUser(event.cookies.get(SESI_COOKIE));
	event.locals.anggota = getSessionAnggota(event.cookies.get(SESI_ANGGOTA_COOKIE));

	// Lindungi semua rute /admin — pengunjung anonim diarahkan ke login,
	// dengan menyimpan tujuan awal agar setelah masuk kembali ke halaman itu.
	if (event.url.pathname.startsWith('/admin') && !event.locals.user) {
		const tujuan = event.url.pathname + event.url.search;
		// Respons redirect dibuat langsung (bukan lewat `redirect()`) supaya
		// header keamanan di atas tetap terpasang pada redirect ini juga.
		return pasangHeaderKeamanan(
			new Response(null, {
				status: 303,
				headers: { location: `/masuk?lanjut=${encodeURIComponent(tujuan)}` }
			}),
			event.url.pathname
		);
	}

	// Lindungi area anggota (/anggota) — berlaku untuk semua route di bawahnya,
	// tanpa mengubah guard /admin di atas. Sesinya beda dari sesi pengurus.
	const diAreaAnggota =
		event.url.pathname === '/anggota' || event.url.pathname.startsWith('/anggota/');
	if (diAreaAnggota && !event.locals.anggota) {
		return pasangHeaderKeamanan(
			new Response(null, {
				status: 303,
				headers: { location: '/masuk?tab=anggota' }
			}),
			event.url.pathname
		);
	}

	const response = await resolve(event);
	return pasangHeaderKeamanan(response, event.url.pathname);
};
