<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import { Inbox } from '@lucide/svelte';

	type Props = {
		icon?: Component;
		title: string;
		desc?: string;
		children?: Snippet;
	};

	let { icon: Icon = Inbox, title, desc = '', children }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
	<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
		<Icon class="h-7 w-7" />
	</div>
	<h3 class="font-display text-base font-bold text-stone-800">{title}</h3>
	{#if desc}
		<p class="mt-1 max-w-md text-sm text-stone-500">{desc}</p>
	{/if}
	{#if children}
		<div class="mt-5">{@render children()}</div>
	{/if}
</div>
