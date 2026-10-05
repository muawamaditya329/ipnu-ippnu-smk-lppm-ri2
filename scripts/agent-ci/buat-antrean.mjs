// buat-antrean.mjs — hasilkan antrean tugas agent CI dari script workflow pipeline.
// Pakai:  node scripts/agent-ci/buat-antrean.mjs <script-workflow-1.js> [script-2.js …]
//
// Script pipeline dijalankan dengan stub (agent/parallel/pipeline/phase/log) sehingga
// setiap agent() terekam urut dengan prompt finalnya (interpolasi lengkap), tanpa
// benar-benar mengerjakan apa pun. Hasil: ci-agents/urutan.json + satu JSON per agent.
// Prompt yang persis sama (putaran sapuan berulang) hanya dicatat sekali.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

const scripts = process.argv.slice(2);
if (scripts.length === 0) {
	console.error('Pemakaian: node buat-antrean.mjs <script1.js> [script2.js …]');
	process.exit(1);
}

const tercatat = [];
const pernah = new Set();

const agent = async (prompt, opts = {}) => {
	const kunci = prompt.trim();
	if (!pernah.has(kunci)) {
		pernah.add(kunci);
		tercatat.push({ prompt, label: opts.label ?? 'agent', usaha: opts.effort ?? '' });
	}
	return { bersih: true, temuan: [], ringkasan: 'stub-antrean' };
};
const parallel = (tugas) => Promise.all(tugas.map((t) => t()));
const pipeline = async (item, ...tahap) => {
	let hasil = [];
	for (const it of item) {
		let v = it;
		for (const t of tahap) v = await t(v, it);
		hasil.push(v);
	}
	return hasil;
};
const phase = () => {};
const log = (m) => console.log('[stub]', m);
const budget = { total: null, spent: () => 0, remaining: () => Infinity };

for (const berkas of scripts) {
	const src = readFileSync(berkas, 'utf8').replace('export const meta', 'const meta');
	const fn = new Function(
		'agent', 'parallel', 'pipeline', 'phase', 'log', 'budget', 'args',
		`return (async () => {\n${src}\n})();`
	);
	await fn(agent, parallel, pipeline, phase, log, budget, undefined);
	console.log(`[stub] ${basename(berkas)}: total ${tercatat.length} agent tercatat`);
}

// --- Tulis antrean -----------------------------------------------------------
const slug = (s) =>
	s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'tugas';

mkdirSync('ci-agents', { recursive: true });
const daftar = [];
tercatat.forEach((t, i) => {
	const nomor = String(i + 1).padStart(3, '0');
	const id = `${nomor}-${slug(t.label)}`;
	daftar.push(id);
	writeFileSync(
		`ci-agents/${id}.json`,
		JSON.stringify(
			{
				id,
				urutan: i + 1,
				judul: t.label,
				browser: /shot\.mjs|tap\.mjs|peramban|screenshot|playwright/i.test(t.prompt),
				berikut: '', // diisi setelah semua id final
				prompt: t.prompt.split('/opt/mobile-lab').join('scripts/agent-ci/lab'),
			},
			null,
			2
		) + '\n'
	);
});
// Rantai: tiap tugas tahu id berikutnya.
daftar.forEach((id, i) => {
	const berkas = JSON.parse(readFileSync(`ci-agents/${id}.json`, 'utf8'));
	berkas.berikut = daftar[i + 1] ?? '';
	writeFileSync(`ci-agents/${id}.json`, JSON.stringify(berkas, null, 2) + '\n');
});
writeFileSync(
	'ci-agents/urutan.json',
	JSON.stringify({ dibuat: new Date().toISOString(), jumlah: daftar.length, daftar }, null, 2) + '\n'
);
console.log(`[selesai] ${daftar.length} tugas ditulis ke ci-agents/`);
