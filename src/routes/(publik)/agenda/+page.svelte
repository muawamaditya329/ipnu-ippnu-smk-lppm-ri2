<script lang="ts">
	import { CalendarClock, CalendarDays, Clock, History, MapPin } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
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

	const chipJenis = [
		{ nilai: '', label: 'Semua' },
		...Object.entries(LABEL_JENIS_AGENDA).map(([nilai, label]) => ({ nilai, label }))
	];
</script>

{#snippet kartu(item: EventItem)}
	{@const tg = pecahTanggal(item.tanggal)}
	<article class="card flex gap-4 p-4 sm:gap-5 sm:p-5">
		<!-- Kolom tanggal -->
		<div
			class="flex w-20 shrink-0 flex-col items-center justify-center self-start rounded-xl bg-primary-50 px-2 py-3 text-center"
		>
			<span class="font-display text-3xl leading-none font-extrabold text-primary-800">{tg.d}</span>
			<span class="mt-1 text-xs font-bold tracking-widest text-primary-700 uppercase">{tg.m}</span>
			<span class="mt-0.5 text-[11px] font-medium text-primary-600">{tg.y}</span>
		</div>

		<!-- Kolom keterangan -->
		<div class="min-w-0 flex-1">
			<h3 class="font-display text-base font-bold text-stone-900 sm:text-lg">{item.judul}</h3>
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
			{#if item.jam || item.lokasi || (item.tanggal_selesai && item.tanggal_selesai !== item.tanggal)}
				<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
					{#if item.jam}
						<span class="inline-flex items-center gap-1.5"
							><Clock class="h-4 w-4 text-stone-400" /> {item.jam} WIB</span
						>
					{/if}
					{#if item.lokasi}
						<span class="inline-flex items-center gap-1.5"
							><MapPin class="h-4 w-4 text-stone-400" /> {item.lokasi}</span
						>
					{/if}
					{#if item.tanggal_selesai && item.tanggal_selesai !== item.tanggal}
						<span class="inline-flex items-center gap-1.5"
							><CalendarDays class="h-4 w-4 text-stone-400" /> s.d. {fmtTanggal(
								item.tanggal_selesai
							)}</span
						>
					{/if}
				</div>
			{/if}
			{#if item.deskripsi}
				<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{item.deskripsi}</p>
			{/if}
		</div>
	</article>
{/snippet}

<svelte:head>
	<title>Agenda & Kegiatan — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			eyebrow="Jadwal"
			title="Agenda & Kegiatan"
			desc="Rundown kegiatan, rapat, kajian, dan lomba komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja."
		/>
	</div>
</section>

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
		<h2 class="mb-5 flex items-center gap-2 font-display text-xl font-extrabold text-stone-900">
			<CalendarClock class="h-5 w-5 text-primary-700" />
			Akan Datang
		</h2>
		{#if data.akanDatang.length === 0}
			<EmptyState
				icon={CalendarDays}
				title="Tidak ada agenda mendatang"
				desc="Belum ada jadwal kegiatan yang akan datang. Silakan cek kembali lain waktu."
			/>
		{:else}
			<div class="space-y-4">
				{#each data.akanDatang as item (item.id)}
					{@render kartu(item)}
				{/each}
			</div>
		{/if}
	</section>

	<!-- Telah berlalu -->
	<section>
		<h2 class="mb-5 flex items-center gap-2 font-display text-xl font-extrabold text-stone-900">
			<History class="h-5 w-5 text-stone-400" />
			Telah Berlalu
		</h2>
		{#if data.telahBerlalu.length === 0}
			<EmptyState
				icon={CalendarDays}
				title="Belum ada riwayat agenda"
				desc="Kegiatan yang sudah lewat akan terekam di sini sebagai dokumentasi perjalanan organisasi."
			/>
		{:else}
			<div class="space-y-4">
				{#each data.telahBerlalu as item (item.id)}
					{@render kartu(item)}
				{/each}
			</div>
		{/if}
	</section>
</section>
