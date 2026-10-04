<script lang="ts">
	type Props = {
		size?: number;
		teks?: boolean;
		/** true = teks terang utk latar gelap */
		terang?: boolean;
	};
	let { size = 40, teks = true, terang = false }: Props = $props();
</script>

<a href="/" class="flex items-center gap-3" aria-label="Beranda — IPNU IPPNU SMK LPPM RI 2 Kedungreja">
	<svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
		<rect x="1" y="1" width="46" height="46" rx="12" fill="#047857" />
		<path d="M24 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#ffffff" fill-opacity="0.95" />
		<circle cx="24" cy="24" r="4.5" fill="#b91c1c" />
	</svg>
	{#if teks}
		<div class="leading-tight">
			<p class="font-display text-lg font-extrabold tracking-tight {terang ? 'text-white' : 'text-stone-900'}">
				IPNU <span class="text-accent-500 {terang ? '' : 'text-accent-600'}">IPPNU</span>
			</p>
			<p class="text-[11px] font-medium {terang ? 'text-primary-100' : 'text-stone-500'}">SMK LPPM RI 2 Kedungreja</p>
		</div>
	{/if}
</a>
