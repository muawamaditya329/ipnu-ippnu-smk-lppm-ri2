<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		label: string;
		value: string | number;
		icon?: Component;
		tone?: 'green' | 'red' | 'amber' | 'blue' | 'stone';
		hint?: string;
		href?: string;
	};

	let { label, value, icon: Icon, tone = 'green', hint = '', href }: Props = $props();

	// Gaya buku kas: garis kiri 2px berwarna, angka display besar, label kecil uppercase.
	const aksen: Record<string, string> = {
		green: 'aksen-ipnu',
		red: 'aksen-ippnu',
		amber: 'aksen-kas',
		blue: 'border-l-2 border-l-sky-700',
		stone: 'border-l-2 border-l-stone-400'
	};

	// Nilai uang ("Rp 2.740.000") lebih panjang dari angka polos —
	// kecilkan sedikit agar tetap muat dalam kartu tanpa meluber.
	const angkaPanjang = $derived(String(value).length >= 9);
</script>

{#if href}
	<a {href} class="card card-hover {aksen[tone]} block p-5">
		{@render Isi()}
	</a>
{:else}
	<div class="card {aksen[tone]} p-5">
		{@render Isi()}
	</div>
{/if}

{#snippet Isi()}
	<p class="kicker flex items-center gap-1.5">
		{#if Icon}<Icon class="h-3.5 w-3.5" aria-hidden="true" />{/if}
		{label}
	</p>
	<p
		class="mt-1.5 font-display leading-none font-bold tracking-tight break-words text-stone-900 {angkaPanjang
			? 'text-2xl'
			: 'text-3xl'}"
	>
		{value}
	</p>
	{#if hint}
		<p class="mt-1 truncate text-xs text-stone-500">{hint}</p>
	{/if}
{/snippet}
