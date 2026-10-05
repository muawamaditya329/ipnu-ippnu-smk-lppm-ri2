<script lang="ts">
	type Props = {
		/** Nomor urut section (01, 02, …) — dicetak emas di kiri judul. */
		nomor?: string;
		title: string;
		desc?: string;
	};

	let { nomor = '', title, desc = '' }: Props = $props();
</script>

<!-- Header section editorial: rata kiri, nomor emas + judul display + garis memanjang.
	Tidak ada varian terpusat — label kecil di atas judul (eyebrow) dihapus dari sistem. -->
<div>
	<div class="flex items-center gap-4">
		{#if nomor}<span class="rule-num shrink-0">{nomor}</span>{/if}
		<h2
			class="font-display text-2xl leading-tight font-bold tracking-tight text-stone-900 sm:text-[1.75rem]"
		>
			{title}
		</h2>
		<span class="h-px min-w-10 flex-1 bg-stone-300" aria-hidden="true"></span>
	</div>
	{#if desc}
		<p class="mt-2.5 max-w-2xl text-sm leading-relaxed text-stone-600">{desc}</p>
	{/if}
</div>
