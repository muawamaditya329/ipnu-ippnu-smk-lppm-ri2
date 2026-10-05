<script lang="ts">
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { fmtRp, fmtTanggal, hariIni } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** '2026-10' -> 'Oktober 2026'; bulan di luar jangkauan kalender tampil apa adanya. */
	const fmtBulan = new Intl.DateTimeFormat('id-ID', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
	const namaBulan = (b: string) => {
		const d = new Date(`${b}-01T00:00:00Z`);
		return Number.isNaN(d.getTime()) ? b : fmtBulan.format(d);
	};

	const saldo = $derived(data.totalMasuk - data.totalKeluar);
</script>

<svelte:head>
	<title>Laporan Kas — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Laporan kas terbuka Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja: total pemasukan, pengeluaran, saldo, dan rekap bulanan."
	/>
</svelte:head>

<PageHeader
	kicker="Keuangan Komisariat"
	title="Laporan Kas"
	desc="Kas organisasi dikelola secara amanah dan dilaporkan terbuka kepada seluruh anggota — setiap pemasukan dan pengeluaran dibukukan bendahara."
/>

<section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
	<!-- Nota saldo: gaya buku kas — baris bergaris, angka tabular, total dgn garis ganda -->
	<section aria-label="Ringkasan kas">
		<SectionHeading nomor="01" title="Saldo Kas" />
		<div class="aksen-kas card mt-4 px-5 py-4 sm:px-7 sm:py-5">
			<p class="text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">
				Buku Kas Komisariat &middot; Periode {namaBulan(data.bulanBerjalan)}
			</p>

			<div class="mt-4 space-y-3">
				<div class="flex items-baseline gap-3">
					<span class="text-sm text-stone-600">Total Pemasukan</span>
					<span class="flex-1 border-b border-dotted border-stone-300" aria-hidden="true"></span>
					<span class="font-display text-lg font-bold tabular-nums text-primary-800 sm:text-xl">
						{fmtRp(data.totalMasuk)}
					</span>
				</div>
				<div class="flex items-baseline gap-3">
					<span class="text-sm text-stone-600">Total Pengeluaran</span>
					<span class="flex-1 border-b border-dotted border-stone-300" aria-hidden="true"></span>
					<span class="font-display text-lg font-bold tabular-nums text-accent-800 sm:text-xl">
						{fmtRp(data.totalKeluar)}
					</span>
				</div>
			</div>

			<!-- Total: garis ganda khas nota -->
			<div class="mt-4 flex items-baseline gap-3 border-t-4 border-double border-stone-900 pt-3">
				<span class="text-sm font-bold tracking-[0.08em] text-stone-900 uppercase">Saldo Kas</span>
				<span class="flex-1" aria-hidden="true"></span>
				<span class="font-display text-2xl font-bold tabular-nums text-stone-900 sm:text-3xl">
					{fmtRp(saldo)}
				</span>
			</div>
			<p class="mt-2 text-xs text-stone-500">
				Dihitung dari seluruh riwayat transaksi s.d. {fmtTanggal(hariIni())} WIB.
			</p>
		</div>
	</section>

	<!-- Rekap bulanan -->
	<section class="mt-12" aria-label="Rekap bulanan">
		<SectionHeading
			nomor="02"
			title="Rekap Bulanan"
			desc="Dua belas bulan terakhir; saldo dihitung kumulatif dari seluruh riwayat kas."
		/>
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
							<td class="td font-semibold text-stone-900">
								{namaBulan(r.bulan)}
								{#if r.bulan > data.bulanBerjalan}
									<span class="text-xs font-normal text-stone-400">&middot; mendatang</span>
								{/if}
							</td>
							<td class="td text-right tabular-nums {r.masuk ? 'text-primary-700' : 'text-stone-400'}"
								>{fmtRp(r.masuk)}</td
							>
							<td class="td text-right tabular-nums {r.keluar ? 'text-accent-700' : 'text-stone-400'}"
								>{fmtRp(r.keluar)}</td
							>
							<td
								class="td text-right font-bold tabular-nums {r.saldo < 0
									? 'text-accent-700'
									: 'text-stone-900'}"
								>{fmtRp(r.saldo)}</td
							>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t-4 border-double border-stone-900">
						<td class="td text-[11px] font-semibold tracking-[0.08em] text-stone-900 uppercase">
							Seluruh riwayat
						</td>
						<td class="td text-right font-bold tabular-nums text-primary-800">
							{fmtRp(data.totalMasuk)}
						</td>
						<td class="td text-right font-bold tabular-nums text-accent-800">
							{fmtRp(data.totalKeluar)}
						</td>
						<td class="td text-right font-bold tabular-nums text-stone-900">{fmtRp(saldo)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<!-- Transaksi terbaru -->
	<section class="mt-12" aria-label="Transaksi terbaru">
		<SectionHeading
			nomor="03"
			title="Transaksi Terbaru"
			desc="Lima belas catatan kas terakhir yang dibukukan bendahara."
		/>
		{#if data.terbaru.length === 0}
			<div class="mt-4">
				<EmptyState
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
								<td class="td text-xs whitespace-nowrap tabular-nums">
									{fmtTanggal(t.tanggal)}
									<!-- Catatan bertanggal setelah hari ini (mis. pencatatan awal acara)
									     ditandai, sejalan dgn penanda "mendatang" pd rekap bulanan. -->
									{#if t.tanggal.slice(0, 10) > hariIni()}
										<span class="text-stone-400">&middot; mendatang</span>
									{/if}
								</td>
								<td class="td max-w-sm">{t.keterangan}</td>
								<td class="td text-stone-500">{t.kategori}</td>
								<td class="td"
									><span class="badge {t.jenis === 'masuk' ? 'badge-green' : 'badge-red'}"
										>{t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span
									></td
								>
								<td
									class="td text-right font-semibold tabular-nums {t.jenis === 'masuk'
										? 'text-primary-700'
										: 'text-accent-700'}"
								>
									{t.jenis === 'masuk' ? '+' : '−'}{fmtRp(t.jumlah)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<p class="hint mt-8">
		Iuran per anggota tidak ditampilkan demi privasi. Pertanyaan seputar kas dapat disampaikan
		kepada bendahara melalui kontak pada footer halaman.
	</p>
</section>
