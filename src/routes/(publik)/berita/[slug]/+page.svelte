<script lang="ts">
	import { CalendarDays, Eye, UserRound, ArrowLeft, Share2, ChevronRight } from '@lucide/svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import {
		renderKonten,
		fmtTanggalPendek,
		LABEL_CAKUPAN,
		LABEL_KATEGORI_BERITA
	} from '#lib/utils.ts';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const post = $derived(data.post);
	const url = $derived(page.url.href);
	const bagikan = $derived([
		{
			label: 'WhatsApp',
			href: `https://wa.me/?text=${encodeURIComponent(post.judul + ' — ' + url)}`
		},
		{
			label: 'Facebook',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
		},
		{
			label: 'Telegram',
			href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.judul)}`
		}
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
	<!-- Kepala artikel: kertas editorial, bukan blok hijau -->
	<header class="border-b border-stone-200">
		<div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
			<nav class="kicker flex items-center gap-1.5" aria-label="Breadcrumb">
				<a href="/berita" class="inline-flex items-center gap-1 hover:text-stone-900"
					><ArrowLeft class="h-3.5 w-3.5" /> Berita</a
				>
				<ChevronRight class="h-3 w-3" />
				<span class="text-stone-900">{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}</span>
			</nav>
			{#if post.cakupan !== 'umum'}
				<div class="mt-4">
					<span class="badge {post.cakupan === 'ippnu' ? 'badge-red' : 'badge-green'}"
						>{LABEL_CAKUPAN[post.cakupan]}</span
					>
				</div>
			{/if}
			<h1
				class="mt-3 font-display text-3xl leading-tight font-bold tracking-tight text-stone-900 sm:text-4xl"
			>
				{post.judul}
			</h1>
			<div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-500">
				<span class="inline-flex items-center gap-1.5"
					><UserRound class="h-4 w-4" /> {post.penulis_nama ?? 'Pengurus'}</span
				>
				<span class="inline-flex items-center gap-1.5"
					><CalendarDays class="h-4 w-4" />
					{fmtTanggalPendek(post.published_at ?? post.created_at)}</span
				>
				<span class="inline-flex items-center gap-1.5"
					><Eye class="h-4 w-4" /> {post.views} kali dibaca</span
				>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
		{#if post.cover}
			<img
				src="/uploads/{post.cover}"
				alt={post.judul}
				class="mb-8 w-full rounded-lg object-cover"
			/>
		{/if}

		<div class="prose max-w-none prose-stone prose-headings:font-display">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderKonten meng-escape HTML sebelum menambah markup tebal/miring -->
			{@html renderKonten(post.konten)}
		</div>

		<div class="mt-10 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
			<span class="inline-flex items-center gap-1.5 text-sm font-bold text-stone-500"
				><Share2 class="h-4 w-4" /> Bagikan:</span
			>
			{#each bagikan as b (b.label)}
				<a href={b.href} target="_blank" rel="noopener" class="btn btn-outline btn-sm">{b.label}</a>
			{/each}
		</div>
	</div>
</article>

{#if data.terkait.length}
	<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
		<SectionHeading title="Berita Terkait" />
		<div class="mt-4 divide-y divide-stone-200 border-t border-stone-200">
			{#each data.terkait as p (p.id)}
				<a
					href="/berita/{p.slug}"
					class="group grid gap-1 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-6"
				>
					<p class="text-[11px] leading-5 font-semibold tracking-[0.08em] text-stone-500 uppercase">
						{fmtTanggalPendek(p.published_at ?? p.created_at)}
					</p>
					<h3
						class="font-display text-base leading-snug font-bold text-stone-900 transition group-hover:text-primary-800"
					>
						{p.judul}
					</h3>
				</a>
			{/each}
		</div>
	</section>
{/if}
