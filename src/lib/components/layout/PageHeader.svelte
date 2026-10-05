<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** Label kecil di atas judul (uppercase, emas) — mis. "Kabar Organisasi". */
		kicker: string;
		title: string;
		desc?: string;
		/** Baris tambahan di bawah deskripsi (mis. breadcrumb atau meta album). */
		children?: Snippet;
	};

	let { kicker, title, desc = '', children }: Props = $props();
</script>

<!-- Kop kategori halaman publik: satu-satunya blok hijau tinta penuh di halaman
	(footer memakai kertas). Saudara kecil hero beranda — pola islami + garis emas
	bawah, semuanya rata kiri. Dipakai bersama oleh seluruh halaman publik agar
	kop antarhalaman konsisten (DESIGN.md §3.2). -->
<section class="pattern-islamic border-b-2 border-gold-500 bg-primary-950">
	<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
		<p class="text-[11px] font-semibold tracking-[0.14em] text-gold-300 uppercase">{kicker}</p>
		<h1
			class="mt-3 max-w-3xl font-display text-3xl leading-[1.08] font-bold tracking-tight text-white sm:text-4xl"
		>
			{title}
		</h1>
		{#if desc}
			<p class="mt-4 max-w-2xl text-sm leading-relaxed text-primary-100 sm:text-base">{desc}</p>
		{/if}
		{#if children}
			<div class="mt-5">{@render children()}</div>
		{/if}
	</div>
</section>
