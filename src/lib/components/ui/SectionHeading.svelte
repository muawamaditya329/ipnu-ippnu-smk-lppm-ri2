<script lang="ts">
	type Props = {
		eyebrow?: string;
		title: string;
		desc?: string;
		center?: boolean;
	};

	let { eyebrow = '', title, desc = '', center = false }: Props = $props();
</script>

<div class="{center ? 'mx-auto text-center' : ''} max-w-2xl">
	{#if eyebrow}
		<p class="mb-2 text-xs font-bold tracking-[0.2em] text-primary-700 uppercase">{eyebrow}</p>
	{/if}
	<h2 class="font-display text-3xl font-extrabold text-stone-900 sm:text-4xl">{title}</h2>
	{#if desc}
		<p class="mt-3 text-base leading-relaxed text-stone-500">{desc}</p>
	{/if}
</div>
