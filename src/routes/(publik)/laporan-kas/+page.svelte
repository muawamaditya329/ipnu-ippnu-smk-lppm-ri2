<script lang="ts">
	import { Info, TrendingDown, TrendingUp, Wallet } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { fmtRp, fmtTanggal } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** '2026-10' -> 'Oktober 2026' */
	const fmtBulan = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
	const namaBulan = (b: string) => fmtBulan.format(new Date(`${b}-01T00:00:00Z`));

	const saldo = $derived(data.totalMasuk - data.totalKeluar);
</script>

<svelte:head>
	<title>Laporan Kas — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content="Laporan kas terbuka Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja: total pemasukan, pengeluaran, saldo, dan rekap bulanan." />
</svelte:head>

<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			eyebrow="Transparansi"
			title="Laporan Kas"
			desc="Kas organisasi dikelola secara amanah dan dilaporkan terbuka kepada seluruh anggota."
		/>
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<!-- Ringkasan angka besar -->
	<div class="grid gap-5 sm:grid-cols-3">
		<div class="card p-6">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
				<TrendingUp class="h-5 w-5" />
			</div>
			<p class="mt-4 text-sm font-medium text-stone-500">Total Pemasukan</p>
			<p class="font-display text-3xl font-extrabold text-primary-700">{fmtRp(data.totalMasuk)}</p>
		</div>
		<div class="card p-6">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
				<TrendingDown class="h-5 w-5" />
			</div>
			<p class="mt-4 text-sm font-medium text-stone-500">Total Pengeluaran</p>
			<p class="font-display text-3xl font-extrabold text-accent-700">{fmtRp(data.totalKeluar)}</p>
		</div>
		<div class="card p-6">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-900 text-white">
				<Wallet class="h-5 w-5" />
			</div>
			<p class="mt-4 text-sm font-medium text-stone-500">Saldo Saat Ini</p>
			<p class="font-display text-3xl font-extrabold text-primary-900">{fmtRp(saldo)}</p>
		</div>
	</div>

	<!-- Rekap bulanan (12 bulan terakhir, saldo kumulatif) -->
	<div class="mt-10">
		<h2 class="font-display text-xl font-bold text-stone-900">Rekap Bulanan</h2>
		<p class="mt-1 text-sm text-stone-500">Rincian 12 bulan terakhir — saldo dihitung kumulatif dari seluruh riwayat kas.</p>
		<div class="card mt-4 overflow-x-auto">
			<table class="w-full min-w-[560px]">
				<thead class="border-b border-stone-200 bg-stone-50">
					<tr>
						<th class="th">Bulan</th>
						<th class="th text-right">Masuk</th>
						<th class="th text-right">Keluar</th>
						<th class="th text-right">Saldo Akhir Bulan</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-stone-100">
					{#each data.rekap as r (r.bulan)}
						<tr class="hover:bg-stone-50">
							<td class="td font-semibold text-stone-900">{namaBulan(r.bulan)}</td>
							<td class="td text-right {r.masuk ? 'text-primary-700' : 'text-stone-400'}">{fmtRp(r.masuk)}</td>
							<td class="td text-right {r.keluar ? 'text-accent-700' : 'text-stone-400'}">{fmtRp(r.keluar)}</td>
							<td class="td text-right font-bold {r.saldo < 0 ? 'text-accent-700' : 'text-stone-900'}">{fmtRp(r.saldo)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Transaksi terbaru -->
	<div class="mt-10">
		<h2 class="font-display text-xl font-bold text-stone-900">Transaksi Terbaru</h2>
		<p class="mt-1 text-sm text-stone-500">15 catatan kas terakhir yang dibukukan bendahara.</p>
		{#if data.terbaru.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Wallet}
					title="Belum ada transaksi"
					desc="Catatan kas akan tampil di sini setelah bendahara membukukan pemasukan atau pengeluaran."
				/>
			</div>
		{:else}
			<div class="card mt-4 overflow-x-auto">
				<table class="w-full min-w-[640px]">
					<thead class="border-b border-stone-200 bg-stone-50">
						<tr>
							<th class="th">Tanggal</th>
							<th class="th">Keterangan</th>
							<th class="th">Kategori</th>
							<th class="th">Jenis</th>
							<th class="th text-right">Jumlah</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-stone-100">
						{#each data.terbaru as t (t.id)}
							<tr class="hover:bg-stone-50">
								<td class="td whitespace-nowrap text-xs">{fmtTanggal(t.tanggal)}</td>
								<td class="td max-w-sm">{t.keterangan}</td>
								<td class="td">{t.kategori}</td>
								<td class="td"><span class="badge {t.jenis === 'masuk' ? 'badge-green' : 'badge-red'}">{t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
								<td class="td text-right font-semibold {t.jenis === 'masuk' ? 'text-primary-700' : 'text-accent-700'}">
									{t.jenis === 'masuk' ? '+' : '-'}{fmtRp(t.jumlah)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<p class="hint mt-8 flex items-start gap-1.5">
		<Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
		Iuran per anggota tidak ditampilkan demi privasi. Pertanyaan? Hubungi bendahara.
	</p>
</section>
