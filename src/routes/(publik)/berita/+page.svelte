<script lang="ts">
	import { Search } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { fmtTanggalPendek, LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const chipCakupan = [
		{ nilai: '', label: 'Semua' },
		{ nilai: 'ipnu', label: 'IPNU' },
		{ nilai: 'ippnu', label: 'IPPNU' }
	];

	const hrefHalaman = (p: number) => {
		const sp = new SvelteURLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (data.cakupan) sp.set('cakupan', data.cakupan);
		if (p > 1) sp.set('halaman', String(p));
		const qs = sp.toString();
		return `/berita${qs ? `?${qs}` : ''}`;
	};

	// Chip cakupan mempertahankan kata kunci pencarian yang sedang aktif.
	const hrefChip = (cakupan: string) => {
		const sp = new SvelteURLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (cakupan) sp.set('cakupan', cakupan);
		const qs = sp.toString();
		return `/berita${qs ? `?${qs}` : ''}`;
	};

	// Satu unggulan + daftar baris — bukan grid kartu identik (DESIGN.md §3.4).
	const unggulan = $derived(data.posts[0] ?? null);
	const baris = $derived(data.posts.slice(1));
</script>

<svelte:head>
	<title>Berita & Kabar — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<PageHeader
	kicker="Kabar Organisasi"
	title="Berita & Kabar"
	desc="Dokumentasi kegiatan, pengumuman resmi, dan tulisan pelajar komisariat — diurut dari yang terbit terbaru."
/>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<!-- Filter & pencarian -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex gap-2">
			{#each chipCakupan as c (c.label)}
				<a
					href={hrefChip(c.nilai)}
					class="btn btn-sm {data.cakupan === c.nilai || (!data.cakupan && !c.nilai)
						? 'btn-primary'
						: 'btn-outline'}"
				>
					{c.label}
				</a>
			{/each}
		</div>
		<form method="GET" action="/berita" class="flex gap-2 sm:w-80" role="search">
			{#if data.cakupan}
				<input type="hidden" name="cakupan" value={data.cakupan} />
			{/if}
			<div class="relative flex-1">
				<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
				<input
					name="q"
					value={data.q}
					class="input pl-10"
					placeholder="Cari berita…"
					aria-label="Cari berita"
				/>
			</div>
			<button class="btn btn-primary" type="submit">Cari</button>
		</form>
	</div>

	{#if data.posts.length === 0}
		<EmptyState
			title="Belum ada berita"
			desc="Berita yang cocok dengan pencarian belum tersedia. Coba kata kunci lain atau kunjungi lagi nanti."
		/>
	{:else}
		<p class="mb-6 text-sm text-stone-500">
			Menampilkan <b>{data.posts.length}</b> dari <b>{data.total}</b> berita
		</p>

		{#if unggulan}
			<!-- Berita unggulan: lembar editorial besar, bukan kartu -->
			<article class="border-b border-stone-200 pb-8">
				{#if unggulan.cover}
					<a
						href="/berita/{unggulan.slug}"
						class="group mb-6 block max-w-3xl overflow-hidden rounded-xl bg-stone-200"
					>
						<img
							src="/uploads/{unggulan.cover}"
							alt={unggulan.judul}
							class="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
						/>
					</a>
				{/if}
				<p class="kicker">Terbaru &middot; {fmtTanggalPendek(unggulan.published_at ?? unggulan.created_at)}</p>
				<h2 class="mt-2 max-w-3xl font-display text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
					<a href="/berita/{unggulan.slug}" class="transition hover:text-primary-800">
						{unggulan.judul}
					</a>
				</h2>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class="badge">
						{LABEL_KATEGORI_BERITA[unggulan.kategori] ?? unggulan.kategori}
					</span>
					{#if unggulan.cakupan !== 'umum'}
						<span class="badge {unggulan.cakupan === 'ippnu' ? 'badge-red' : 'badge-green'}">
							{LABEL_CAKUPAN[unggulan.cakupan] ?? unggulan.cakupan}
						</span>
					{/if}
					<span class="text-xs text-stone-400">{unggulan.views} dibaca</span>
				</div>
				{#if unggulan.ringkasan}
					<p class="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
						{unggulan.ringkasan}
					</p>
				{/if}
				<a
					href="/berita/{unggulan.slug}"
					class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-800 hover:text-primary-950"
				>
					Baca selengkapnya <span aria-hidden="true">&rarr;</span>
				</a>
			</article>
		{/if}

		<!-- Arsip baris: tanggal — judul — jumlah baca, pemisah 1px -->
		{#if baris.length > 0}
			<div class="divide-y divide-stone-200 border-b border-stone-200">
				{#each baris as post (post.id)}
					<a
						href="/berita/{post.slug}"
						class="group grid gap-1.5 py-5 sm:grid-cols-[8.5rem_1fr_auto] sm:gap-6"
					>
						<p class="text-[11px] leading-5 font-semibold tracking-[0.08em] text-stone-500 uppercase">
							{fmtTanggalPendek(post.published_at ?? post.created_at)}
							<span class="block font-normal text-stone-400 normal-case">
								{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}
							</span>
						</p>
						<div class="min-w-0">
							<h3
								class="font-display text-lg leading-snug font-bold text-stone-900 transition group-hover:text-primary-800"
							>
								{post.judul}
							</h3>
							{#if post.ringkasan}
								<p class="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">
									{post.ringkasan}
								</p>
							{/if}
						</div>
						<p class="hidden shrink-0 self-center text-right text-xs text-stone-400 sm:block">
							{#if post.cakupan !== 'umum'}
								<span
									class="font-semibold uppercase {post.cakupan === 'ippnu'
										? 'text-accent-700'
										: 'text-primary-700'}"
								>
									{LABEL_CAKUPAN[post.cakupan] ?? post.cakupan}
								</span>
								<span class="mx-1" aria-hidden="true">&middot;</span>
							{/if}
							{post.views} dibaca
						</p>
					</a>
				{/each}
			</div>
		{/if}

		<Pagination page={data.halaman} totalPages={data.totalHalaman} href={hrefHalaman} />
	{/if}
</section>
