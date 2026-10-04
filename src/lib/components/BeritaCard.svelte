<script lang="ts">
	import { CalendarDays, Eye } from '@lucide/svelte';
	import type { Post } from '#lib/server/db.ts';
	import { fmtTanggalPendek, LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';

	let { post }: { post: Post } = $props();

	const toneCakupan = { umum: 'green', ipnu: 'green', ippnu: 'red' } as const;
</script>

<article class="card group flex h-full flex-col overflow-hidden transition hover:shadow-lift">
	<a href="/berita/{post.slug}" class="relative block aspect-video overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900">
		{#if post.cover}
			<img src="/uploads/{post.cover}" alt={post.judul} loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
		{:else}
			<div class="pattern-islamic flex h-full w-full items-center justify-center">
				<span class="font-display text-lg font-extrabold text-white/90">{LABEL_KATEGORI_BERITA[post.kategori] ?? 'Kabar'}</span>
			</div>
		{/if}
		<span class="badge absolute top-3 left-3 bg-white/95 text-stone-800 shadow-sm">
			{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}
		</span>
		{#if post.cakupan !== 'umum'}
			<span class="badge badge-{toneCakupan[post.cakupan]} absolute top-3 right-3 shadow-sm">
				{LABEL_CAKUPAN[post.cakupan]}
			</span>
		{/if}
	</a>

	<div class="flex flex-1 flex-col p-5">
		<p class="flex items-center gap-1.5 text-xs font-medium text-stone-400">
			<CalendarDays class="h-3.5 w-3.5" />
			{fmtTanggalPendek(post.published_at ?? post.created_at)}
			<span class="mx-1">·</span>
			<Eye class="h-3.5 w-3.5" />
			{post.views}
		</p>
		<h3 class="mt-2 font-display text-lg leading-snug font-bold text-stone-900">
			<a href="/berita/{post.slug}" class="transition hover:text-primary-700">{post.judul}</a>
		</h3>
		{#if post.ringkasan}
			<p class="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">{post.ringkasan}</p>
		{/if}
		<a href="/berita/{post.slug}" class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-800">
			Baca selengkapnya <span aria-hidden="true">→</span>
		</a>
	</div>
</article>
