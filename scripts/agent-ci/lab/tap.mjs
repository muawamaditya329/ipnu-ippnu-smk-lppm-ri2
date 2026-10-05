// tap.mjs — klik elemen (selector) lalu tangkap tangkapan layar; untuk uji interaksi.
// Pakai:  node scripts/agent-ci/lab/tap.mjs <url> <selector-css> <nama-file.png> [viewport]
// Contoh: node scripts/agent-ci/lab/tap.mjs http://localhost:3462/masuk '#username' masuk.png 390x844
// Selector wajib; teks tombol dipakai lewat selector seperti 'button:has-text("Masuk")'.
import { chromium } from 'playwright-core';

const [url = 'http://localhost:3462/', selector = '', keluar = '/tmp/tap.png', vp = '390x844'] =
	process.argv.slice(2);
const [lebar, tinggi] = vp.split('x').map(Number);

const peramban = await chromium.launch({
	executablePath: process.env.CHROME_PATH || undefined,
	args: ['--no-sandbox', '--disable-gpu'],
});
const konteks = await peramban.newContext({
	viewport: { width: lebar || 390, height: tinggi || 844 },
	isMobile: lebar < 500,
	hasTouch: lebar < 500,
});
const halaman = await konteks.newPage();

halaman.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
halaman.on('console', (m) => {
	if (m.type() === 'error') console.log('CONSOLE-ERROR:', m.text());
});

await halaman.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await halaman.waitForTimeout(500);

try {
	await halaman.click(selector, { timeout: 8000 });
	await halaman.waitForTimeout(900);
	console.log('TAP OK:', selector);
} catch (e) {
	console.log('TAP GAGAL:', e.message.split('\n')[0]);
}

await halaman.screenshot({ path: keluar });
console.log('SHOT:', keluar);
await peramban.close();
