<script lang="ts">
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import type { EventItem } from '#lib/server/db.ts';
	import { fmtTanggal, LABEL_CAKUPAN, LABEL_JENIS_AGENDA, pecahTanggal } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Warna badge per jenis agenda
	const badgeJenis: Record<string, string> = {
		rutin: 'badge-green',
		kajian: 'badge-green',
		rapat: 'badge-blue',
		lomba: 'badge-amber',
		kegiatan: 'badge-gray'
	};

	const labelStatus: Record<string, string> = {
		terjadwal: 'Terjadwal',
		selesai: 'Selesai',
		dibatalkan: 'Dibatalkan'
	};
	const badgeStatus: Record<string, string> = {
		terjadwal: 'badge-green',
		selesai: 'badge-gray',
		dibatalkan: 'badge-red'
	};

	// Garis atas blok tanggal mengikuti cakupan kegiatan — IPNU hijau, IPPNU merah.
	const garisCakupan: Record<string, string> = {
		ipnu: 'border-t-primary-800',
		ippnu: 'border-t-accent-700',
		umum: 'border-t-stone-400'
	};

	const chipJenis = [
		{ nilai: '', label: 'Semua' },
		...Object.entries(LABEL_JENIS_AGENDA).map(([nilai, label]) => ({ nilai, label }))
	];
</script>

{#snippet baris(item: EventItem)}
	{@const tg = pecahTanggal(item.tanggal)}
	<article class="flex items-start gap-4 py-4 sm:gap-6">
		<!-- Blok tanggal kotak: garis atas mengikuti cakupan (IPNU/IPPNU/umum) -->
		<div
			class="w-14 shrink-0 border border-t-2 border-stone-300 bg-white py-2 text-center sm:w-16 {garisCakupan[
				item.cakupan
			] ?? 'border-t-stone-400'}"
		>
			<span class="block font-display text-2xl leading-none font-bold text-stone-900">{tg.d}</span>
			<span class="mt-1 block text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase"
				>{tg.m}</span
			>
			<span class="mt-0.5 block text-[10px] text-stone-400">{tg.y}</span>
		</div>

		<div class="min-w-0 flex-1">
			<h3 class="font-display text-base leading-snug font-bold text-stone-900 sm:text-lg">
				{item.judul}
			</h3>
			<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
				<span class="badge {badgeJenis[item.jenis] ?? 'badge-gray'}"
					>{LABEL_JENIS_AGENDA[item.jenis] ?? item.jenis}</span
				>
				{#if item.cakupan !== 'umum'}
					<span class="badge {item.cakupan === 'ippnu' ? 'badge-red' : 'badge-green'}"
						>{LABEL_CAKUPAN[item.cakupan] ?? item.cakupan}</span
					>
				{/if}
				{#if item.status !== 'terjadwal'}
					<span class="badge {badgeStatus[item.status] ?? 'badge-gray'}"
						>{labelStatus[item.status] ?? item.status}</span
					>
				{/if}
			</div>
			<p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
				{#if item.jam}<span>{item.jam} WIB</span>{/if}
				{#if item.lokasi}<span>{item.lokasi}</span>{/if}
				{#if item.tanggal_selesai && item.tanggal_selesai !== item.tanggal}
					<span>s.d. {fmtTanggal(item.tanggal_selesai)}</span>
				{/if}
			</p>
			{#if item.deskripsi}
				<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{item.deskripsi}</p>
			{/if}
		</div>
	</article>
{/snippet}

<svelte:head>
	<title>Agenda & Kegiatan — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<PageHeader
	kicker="Papan Kegiatan"
	title="Agenda & Kegiatan"
	desc="Rundown kegiatan, rapat, kajian, dan lomba komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja — diurut menurut tanggal."
/>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<!-- Filter jenis -->
	<div class="mb-10 flex flex-wrap gap-2">
		{#each chipJenis as c (c.nilai)}
			<a
				href="/agenda{c.nilai ? `?jenis=${c.nilai}` : ''}"
				class="btn btn-sm {data.jenis === c.nilai || (!data.jenis && !c.nilai)
					? 'btn-primary'
					: 'btn-outline'}"
			>
				{c.label}
			</a>
		{/each}
	</div>

	<!-- Akan datang -->
	<section class="mb-12">
		<SectionHeading nomor="01" title="Akan Datang" />
		{#if data.akanDatang.length === 0}
			<div class="mt-5">
				<EmptyState
					title="Tidak ada agenda mendatang"
					desc="Belum ada jadwal kegiatan yang akan datang pada filter ini. Silakan cek kembali lain waktu."
				/>
			</div>
		{:else}
			<div class="mt-5 divide-y divide-stone-200 border-t border-stone-200">
				{#each data.akanDatang as item (item.id)}
					{@render baris(item)}
				{/each}
			</div>
		{/if}
	</section>

	<!-- Telah berlalu -->
	<section>
		<SectionHeading nomor="02" title="Telah Berlalu" desc="Lima kegiatan terakhir yang sudah usai." />
		{#if data.telahBerlalu.length === 0}
			<div class="mt-5">
				<EmptyState
					title="Belum ada riwayat agenda"
					desc="Kegiatan yang sudah lewat akan terekam di sini sebagai dokumentasi perjalanan organisasi."
				/>
			</div>
		{:else}
			<div class="mt-5 divide-y divide-stone-200 border-t border-stone-200">
				{#each data.telahBerlalu as item (item.id)}
					{@render baris(item)}
				{/each}
			</div>
		{/if}
	</section>
</section>
