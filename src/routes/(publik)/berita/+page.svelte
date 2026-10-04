<script lang="ts">
	import { Search, Newspaper } from '@lucide/svelte';
	import BeritaCard from '#lib/components/BeritaCard.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const chipCakupan = [
		{ nilai: '', label: 'Semua' },
		{ nilai: 'ipnu', label: 'IPNU' },
		{ nilai: 'ippnu', label: 'IPPNU' }
	];

	const hrefHalaman = (p: number) => {
		const sp = new URLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (data.cakupan) sp.set('cakupan', data.cakupan);
		if (p > 1) sp.set('halaman', String(p));
		const qs = sp.toString();
		return `/berita${qs ? `?${qs}` : ''}`;
	};
</script>

<svelte:head>
	<title>Berita & Kabar — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading eyebrow="Informasi" title="Berita & Kabar" desc="Dokumentasi kegiatan, pengumuman resmi, dan tulisan pelajar komisariat." />
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<!-- Filter & pencarian -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex gap-2">
			{#each chipCakupan as c (c.label)}
				<a
					href="/berita{c.nilai ? `?cakupan=${c.nilai}` : ''}"
					class="btn btn-sm {data.cakupan === c.nilai || (!data.cakupan && !c.nilai) ? 'btn-primary' : 'btn-outline'}"
				>
					{c.label}
				</a>
			{/each}
		</div>
		<form method="GET" action="/berita" class="flex gap-2 sm:w-80">
			{#if data.cakupan}
				<input type="hidden" name="cakupan" value={data.cakupan} />
			{/if}
			<div class="relative flex-1">
				<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
				<input name="q" value={data.q} class="input pl-10" placeholder="Cari berita…" aria-label="Cari berita" />
			</div>
			<button class="btn btn-primary" type="submit">Cari</button>
		</form>
	</div>

	{#if data.posts.length === 0}
		<EmptyState icon={Newspaper} title="Belum ada berita" desc="Berita yang cocok dengan pencarian belum tersedia. Coba kata kunci lain atau kunjungi lagi nanti." />
	{:else}
		<p class="mb-5 text-sm text-stone-500">Menampilkan <b>{data.posts.length}</b> dari <b>{data.total}</b> berita</p>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.posts as post (post.id)}
				<BeritaCard {post} />
			{/each}
		</div>
		<Pagination page={data.halaman} totalPages={data.totalHalaman} href={hrefHalaman} />
	{/if}
</section>
