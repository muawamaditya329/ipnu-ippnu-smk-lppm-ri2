<script lang="ts">
	import type { Snippet, Component } from 'svelte';

	type Props = {
		icon?: Component;
		title: string;
		desc?: string;
		children?: Snippet;
	};

	let { icon: Icon, title, desc = '', children }: Props = $props();
</script>

<!-- Kering & jujur: satu kalimat + aksi. Tanpa ilustrasi, rata kiri mengikuti ritme dokumen. -->
<div class="rounded-lg border border-stone-200 bg-white px-5 py-8">
	<p class="flex items-center gap-2 text-sm font-semibold text-stone-800">
		{#if Icon}<Icon class="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />{/if}
		{title}
	</p>
	{#if desc}
		<p class="mt-1 text-sm leading-relaxed text-stone-500">{desc}</p>
	{/if}
	{#if children}
		<div class="mt-4">{@render children()}</div>
	{/if}
</div>
