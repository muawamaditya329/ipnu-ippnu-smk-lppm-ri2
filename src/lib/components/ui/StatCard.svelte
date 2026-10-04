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

	const tones: Record<string, string> = {
		green: 'bg-primary-100 text-primary-700',
		red: 'bg-accent-100 text-accent-700',
		amber: 'bg-gold-100 text-gold-700',
		blue: 'bg-sky-100 text-sky-700',
		stone: 'bg-stone-100 text-stone-600'
	};
</script>

{#if href}
	<a {href} class="card flex items-center gap-4 p-5 transition hover:border-primary-300 hover:shadow-lift">
		<SlotTengah />
	</a>
{:else}
	<div class="card flex items-center gap-4 p-5">
		<SlotTengah />
	</div>
{/if}

{#snippet SlotTengah()}
	{#if Icon}
		<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {tones[tone]}">
			<Icon class="h-6 w-6" />
		</div>
	{/if}
	<div class="min-w-0">
		<p class="truncate text-sm font-medium text-stone-500">{label}</p>
		<p class="font-display text-2xl font-extrabold text-stone-900">{value}</p>
		{#if hint}
			<p class="mt-0.5 truncate text-xs text-stone-400">{hint}</p>
		{/if}
	</div>
{/snippet}
