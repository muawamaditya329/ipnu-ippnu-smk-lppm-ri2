// shot.mjs — tangkap tangkapan layar halaman dengan peramban sungguhan (chromium).
// Pakai:  node scripts/agent-ci/lab/shot.mjs <url> <nama-file.png> [viewport] [mode]
//   viewport: 390x844 (default) | 1280x800 | 320x700 | 768x1024 | 844x390
//   mode: fold (default) | full | scroll:<piksel>
// Contoh: node scripts/agent-ci/lab/shot.mjs http://localhost:3462/ beranda 390x844 full
// Chromium dicari dari env CHROME_PATH; bila kosong, dibiarkan playwright resolve sendiri
// (di CI: `npx playwright install chromium`). Jalankan `npm i --no-save playwright-core`
// bila modul belum tersedia. Setiap error konsol/pageerror tercetak ke stdout.
import { chromium } from 'playwright-core';

const [url = 'http://localhost:3462/', keluar = '/tmp/shot.png', vp = '390x844', mode = 'fold'] =
	process.argv.slice(2);
const [lebar, tinggi] = vp.split('x').map(Number);

const opsi = {
	executablePath: process.env.CHROME_PATH || undefined,
	args: ['--no-sandbox', '--disable-gpu'],
};
const peramban = await chromium.launch(opsi);
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
await halaman.waitForTimeout(600);

if (mode === 'full') {
	await halaman.screenshot({ path: keluar, fullPage: true });
} else if (mode.startsWith('scroll:')) {
	await halaman.evaluate((y) => window.scrollTo(0, y), Number(mode.slice(7)));
	await halaman.waitForTimeout(400);
	await halaman.screenshot({ path: keluar });
} else {
	await halaman.screenshot({ path: keluar });
}
console.log('SHOT OK:', keluar);
await peramban.close();
