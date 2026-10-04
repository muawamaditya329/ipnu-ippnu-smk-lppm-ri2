<script lang="ts">
	import { CalendarDays, Eye, UserRound, ArrowLeft, Share2, ChevronRight } from '@lucide/svelte';
	import BeritaCard from '#lib/components/BeritaCard.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { renderKonten, fmtTanggalPendek, LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const post = $derived(data.post);
	const url = $derived(page.url.href);
	const bagikan = $derived([
		{ label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(post.judul + ' — ' + url)}` },
		{ label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
		{ label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.judul)}` }
	]);
</script>

<svelte:head>
	<title>{post.judul} — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={post.ringkasan ?? post.judul} />
	<meta property="og:title" content={post.judul} />
	<meta property="og:type" content="article" />
	{#if post.cover}
		<meta property="og:image" content="{page.url.origin}/uploads/{post.cover}" />
	{/if}
</svelte:head>

<article class="bg-white">
	<!-- Kepala artikel -->
	<header class="pattern-islamic bg-primary-900 py-12 text-white">
		<div class="mx-auto max-w-3xl px-4 sm:px-6">
			<nav class="mb-5 flex items-center gap-1.5 text-xs font-medium text-primary-200" aria-label="Breadcrumb">
				<a href="/berita" class="inline-flex items-center gap-1 hover:text-white"><ArrowLeft class="h-3.5 w-3.5" /> Berita</a>
				<ChevronRight class="h-3.5 w-3.5" />
				<span class="text-white">{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}</span>
			</nav>
			<div class="flex flex-wrap items-center gap-2">
				<span class="badge bg-gold-400 text-primary-950">{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}</span>
				{#if post.cakupan !== 'umum'}
					<span class="badge {post.cakupan === 'ippnu' ? 'bg-accent-600' : 'bg-primary-600'} text-white">{LABEL_CAKUPAN[post.cakupan]}</span>
				{/if}
			</div>
			<h1 class="mt-3 font-display text-3xl leading-tight font-extrabold sm:text-4xl">{post.judul}</h1>
			<div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-200">
				<span class="inline-flex items-center gap-1.5"><UserRound class="h-4 w-4" /> {post.penulis_nama ?? 'Pengurus'}</span>
				<span class="inline-flex items-center gap-1.5"><CalendarDays class="h-4 w-4" /> {fmtTanggalPendek(post.published_at ?? post.created_at)}</span>
				<span class="inline-flex items-center gap-1.5"><Eye class="h-4 w-4" /> {post.views} kali dibaca</span>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
		{#if post.cover}
			<img src="/uploads/{post.cover}" alt={post.judul} class="mb-8 w-full rounded-2xl object-cover shadow-soft" />
		{/if}

		<div class="prose prose-stone prose-headings:font-display max-w-none">
			{@html renderKonten(post.konten)}
		</div>

		<div class="mt-10 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
			<span class="inline-flex items-center gap-1.5 text-sm font-bold text-stone-500"><Share2 class="h-4 w-4" /> Bagikan:</span>
			{#each bagikan as b (b.label)}
				<a href={b.href} target="_blank" rel="noopener" class="btn btn-outline btn-sm">{b.label}</a>
			{/each}
		</div>
	</div>
</article>

{#if data.terkait.length}
	<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
		<SectionHeading eyebrow="Lanjutkan membaca" title="Berita Terkait" />
		<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.terkait as p (p.id)}
				<BeritaCard post={p} />
			{/each}
		</div>
	</section>
{/if}
