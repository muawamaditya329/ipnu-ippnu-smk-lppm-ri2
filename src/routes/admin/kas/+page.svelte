<script lang="ts">
	import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import {
		fmtRp,
		fmtTanggal,
		hariIni,
		KATEGORI_KAS_KELUAR,
		KATEGORI_KAS_MASUK
	} from '#lib/utils.ts';
	import { kirimJikaSetuju } from '#lib/konfirmasi.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Bentuk galat dari semua action diseragamkan agar aman diakses per field di template.
	const galat = $derived((form?.galat ?? null) as Record<string, string> | null);

	const fmtBulan = new Intl.DateTimeFormat('id-ID', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
	const namaBulanIni = fmtBulan.format(new Date(`${hariIni().slice(0, 7)}-01T00:00:00Z`));

	// Saat filter aktif, kartu ringkasan menunjuk set yang sama dengan daftar
	// di bawahnya sehingga saldo = masuk − keluar tetap konsisten.
	const adaFilter = $derived(Boolean(data.bulan || data.jenis));
	const namaBulanFilter = $derived(
		data.bulan ? fmtBulan.format(new Date(`${data.bulan}-01T00:00:00Z`)) : ''
	);
	const labelFilter = $derived(
		[namaBulanFilter, data.jenis === 'masuk' ? 'Masuk' : data.jenis === 'keluar' ? 'Keluar' : '']
			.filter(Boolean)
			.join(' • ')
	);

	// --- Modal catat transaksi ---
	let bukaModal = $state(false);
	let memproses = $state(false);
	let jenisForm = $state<'masuk' | 'keluar'>('masuk');
	let jumlahForm = $state<string | number>('');
	let kategoriForm = $state(KATEGORI_KAS_MASUK[0] ?? '');
	let keteranganForm = $state('');
	let tanggalForm = $state(hariIni());

	// Opsi kategori mengikuti jenis yang dipilih.
	const opsiKategori = $derived(jenisForm === 'masuk' ? KATEGORI_KAS_MASUK : KATEGORI_KAS_KELUAR);

	function gantiJenis(j: 'masuk' | 'keluar') {
		jenisForm = j;
		kategoriForm = (j === 'masuk' ? KATEGORI_KAS_MASUK : KATEGORI_KAS_KELUAR)[0] ?? '';
	}

	function bersihkanForm() {
		jenisForm = 'masuk';
		jumlahForm = '';
		kategoriForm = KATEGORI_KAS_MASUK[0] ?? '';
		keteranganForm = '';
		tanggalForm = hariIni();
	}

	function bukaFormBaru() {
		bersihkanForm();
		memproses = false;
		bukaModal = true;
	}

	// Sinkron hasil aksi server: sukses → tutup modal; gagal validasi → buka ulang & isi kembali.
	// Modal hanya dibuka bila kegagalan berasal dari form catat transaksi (action buat
	// selalu mengirim `nilai`); kegagalan aksi lain (mis. hapus ditolak admin) tampil
	// sebagai banner di halaman, bukan modal kosong.
	$effect(() => {
		if (form) memproses = false;
		if (form?.sukses) {
			bukaModal = false;
		} else if (form?.galat && form.nilai) {
			const n = form.nilai;
			if (n) {
				jenisForm = n.jenis === 'keluar' ? 'keluar' : 'masuk';
				jumlahForm = n.jumlah;
				// Kategori dikembalikan hanya bila masih sah utk jenis terpilih;
				// kalau tidak, pakai opsi pertama daftar jenis itu.
				const daftar = jenisForm === 'masuk' ? KATEGORI_KAS_MASUK : KATEGORI_KAS_KELUAR;
				kategoriForm = daftar.includes(n.kategori) ? n.kategori : (daftar[0] ?? '');
				keteranganForm = n.keterangan;
				tanggalForm = n.tanggal;
			}
			bukaModal = true;
		}
	});
</script>

<svelte:head><title>Kas & Iuran — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kas & Iuran</h1>
		<p class="mt-1 text-sm text-stone-500">
			Catatan pemasukan & pengeluaran kas komisariat, termasuk iuran anggota.
			{#if data.user.role !== 'admin'}
				<span class="block text-xs">
					Anda dapat mencatat transaksi; penghapusan catatan kas hanya dapat dilakukan admin.
				</span>
			{/if}
		</p>
	</div>
	<button class="btn btn-primary" onclick={bukaFormBaru}
		><Plus class="h-4 w-4" /> Catat Transaksi</button
	>
</div>

<div class="mb-6 grid gap-4 sm:grid-cols-3">
	{#if adaFilter}
		<StatCard
			label="Saldo Terpilih"
			value={fmtRp(data.masukTerpilih - data.keluarTerpilih)}
			icon={Wallet}
			tone="amber"
			hint="Saldo keseluruhan: {fmtRp(data.totalMasuk - data.totalKeluar)}"
		/>
		<StatCard
			label="Masuk Terpilih"
			value={fmtRp(data.masukTerpilih)}
			icon={TrendingUp}
			tone="green"
			hint={labelFilter}
		/>
		<StatCard
			label="Keluar Terpilih"
			value={fmtRp(data.keluarTerpilih)}
			icon={TrendingDown}
			tone="red"
			hint={labelFilter}
		/>
	{:else}
		<StatCard
			label="Saldo Kas"
			value={fmtRp(data.totalMasuk - data.totalKeluar)}
			icon={Wallet}
			tone="amber"
			hint="Total masuk dikurangi total keluar"
		/>
		<StatCard
			label="Masuk Bulan Ini"
			value={fmtRp(data.masukBulanIni)}
			icon={TrendingUp}
			tone="green"
			hint={namaBulanIni}
		/>
		<StatCard
			label="Keluar Bulan Ini"
			value={fmtRp(data.keluarBulanIni)}
			icon={TrendingDown}
			tone="red"
			hint={namaBulanIni}
		/>
	{/if}
</div>

{#if form?.sukses}
	<div
		class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
	>
		{form.terhapus ? 'Transaksi berhasil dihapus.' : 'Transaksi berhasil dicatat.'}
	</div>
{/if}

{#if form?.galat?.umum && !form?.nilai}
	<div
		class="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
		role="alert"
	>
		{form.galat.umum}
	</div>
{/if}

<!-- Filter bulan & jenis -->
<div class="card mb-6 p-4">
	<form method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="sm:w-44">
			<label class="label" for="f-bulan">Bulan</label>
			<input id="f-bulan" name="bulan" type="month" value={data.bulan} class="input" />
		</div>
		<div class="sm:w-44">
			<label class="label" for="f-jenis">Jenis</label>
			<select id="f-jenis" name="jenis" class="input">
				<option value="">Semua Jenis</option>
				<option value="masuk" selected={data.jenis === 'masuk'}>Masuk</option>
				<option value="keluar" selected={data.jenis === 'keluar'}>Keluar</option>
			</select>
		</div>
		<button class="btn btn-outline" type="submit">Terapkan</button>
		{#if data.bulan || data.jenis}
			<a href="/admin/kas" class="btn btn-ghost">Reset</a>
		{/if}
	</form>
</div>

{#if data.transaksi.length === 0}
	<EmptyState
		icon={Wallet}
		title="Belum ada transaksi"
		desc="Belum ada catatan kas yang cocok dengan filter. Catat transaksi pertama atau ubah filter bulan & jenis."
	>
		<button class="btn btn-primary" onclick={bukaFormBaru}>Catat transaksi pertama</button>
	</EmptyState>
{:else}
	<p class="mb-3 text-sm text-stone-500">
		Menampilkan <b>{data.transaksi.length}</b> dari <b>{data.jumlahTransaksi}</b> transaksi — 25 terakhir
		menurut tanggal. Gunakan filter bulan untuk melihat catatan lebih lama.
	</p>
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[840px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">Tanggal</th>
					<th class="th">Jenis</th>
					<th class="th">Kategori</th>
					<th class="th">Keterangan</th>
					<th class="th text-right">Jumlah</th>
					<th class="th">Dicatat Oleh</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.transaksi as t (t.id)}
					<tr class="hover:bg-stone-50">
						<td class="td text-xs whitespace-nowrap">{fmtTanggal(t.tanggal)}</td>
						<td class="td">
							<span class="badge {t.jenis === 'masuk' ? 'badge-green' : 'badge-red'}"
								>{t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span
							>
						</td>
						<td class="td">{t.kategori}</td>
						<td class="td max-w-xs">{t.keterangan}</td>
						<td
							class="td text-right font-semibold {t.jenis === 'masuk'
								? 'text-primary-700'
								: 'text-accent-700'}"
						>
							{t.jenis === 'masuk' ? '+' : '-'}{fmtRp(t.jumlah)}
						</td>
						<td class="td text-xs">{t.dicatat_oleh_nama ?? '—'}</td>
						<td class="td">
							<div class="flex justify-end">
								{#if data.user.role === 'admin'}
									<form
										method="POST"
										action="?/hapus&id={t.id}"
										onsubmit={(e) =>
											kirimJikaSetuju(e, {
												judul: 'Hapus Transaksi',
												pesan: `Hapus transaksi "${t.keterangan}" (${fmtRp(t.jumlah)})? Saldo akan dihitung ulang.`,
												tombol: 'Hapus'
											})}
									>
										<button
											class="btn btn-danger btn-sm"
											aria-label="Hapus transaksi {t.keterangan}"
											><Trash2 class="h-3.5 w-3.5" /> Hapus</button
										>
									</form>
								{:else}
									<span class="text-xs text-stone-400">Hanya admin</span>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Modal open={bukaModal} title="Catat Transaksi" onclose={() => (bukaModal = false)}>
	<form method="POST" action="?/buat" class="space-y-4" onsubmit={() => (memproses = true)}>
		{#if galat?.umum}
			<div
				class="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
				role="alert"
			>
				{galat.umum}
			</div>
		{/if}

		<div>
			<span class="label">Jenis transaksi</span>
			<div class="grid grid-cols-2 gap-3">
				<label
					class="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition {jenisForm ===
					'masuk'
						? 'border-primary-500 bg-primary-50 text-primary-800'
						: 'border-stone-200 text-stone-600 hover:border-stone-300'}"
				>
					<input
						type="radio"
						name="jenis"
						value="masuk"
						class="accent-primary-700"
						checked={jenisForm === 'masuk'}
						onchange={() => gantiJenis('masuk')}
					/>
					<TrendingUp class="h-4 w-4" /> Masuk
				</label>
				<label
					class="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition {jenisForm ===
					'keluar'
						? 'border-accent-500 bg-accent-50 text-accent-800'
						: 'border-stone-200 text-stone-600 hover:border-stone-300'}"
				>
					<input
						type="radio"
						name="jenis"
						value="keluar"
						class="accent-accent-700"
						checked={jenisForm === 'keluar'}
						onchange={() => gantiJenis('keluar')}
					/>
					<TrendingDown class="h-4 w-4" /> Keluar
				</label>
			</div>
			{#if galat?.jenis}<p class="error-text">{galat.jenis}</p>{/if}
		</div>

		<div>
			<label class="label" for="jumlah">Jumlah (Rp) <span class="text-accent-600">*</span></label>
			<input
				id="jumlah"
				name="jumlah"
				type="number"
				min="1"
				step="1"
				placeholder="mis. 25000"
				required
				bind:value={jumlahForm}
				class="input {galat?.jumlah ? 'input-error' : ''}"
			/>
			{#if galat?.jumlah}<p class="error-text">{galat.jumlah}</p>{/if}
		</div>

		<div>
			<label class="label" for="kategori">Kategori</label>
			<select id="kategori" name="kategori" class="input" bind:value={kategoriForm}>
				{#each opsiKategori as k (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
			{#if galat?.kategori}<p class="error-text">{galat.kategori}</p>{/if}
		</div>

		<div>
			<label class="label" for="keterangan">Keterangan <span class="text-accent-600">*</span></label
			>
			<input
				id="keterangan"
				name="keterangan"
				type="text"
				required
				maxlength="200"
				placeholder="mis. Iuran anggota bulan Oktober"
				bind:value={keteranganForm}
				class="input {galat?.keterangan ? 'input-error' : ''}"
			/>
			{#if galat?.keterangan}<p class="error-text">{galat.keterangan}</p>{/if}
		</div>

		<div>
			<label class="label" for="tanggal">Tanggal</label>
			<input
				id="tanggal"
				name="tanggal"
				type="date"
				bind:value={tanggalForm}
				class="input {galat?.tanggal ? 'input-error' : ''}"
			/>
			{#if galat?.tanggal}<p class="error-text">{galat.tanggal}</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-3 pt-1">
			<button type="button" class="btn btn-ghost" onclick={() => (bukaModal = false)}>Batal</button>
			<button class="btn btn-primary" type="submit" disabled={memproses}
				>{memproses ? 'Menyimpan…' : 'Simpan Transaksi'}</button
			>
		</div>
	</form>
</Modal>
