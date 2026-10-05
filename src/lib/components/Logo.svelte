<script lang="ts">
	type Props = {
		size?: number;
		teks?: boolean;
		/** true = teks terang untuk latar gelap */
		terang?: boolean;
	};
	let { size = 40, teks = true, terang = false }: Props = $props();
</script>

<a
	href="/"
	class="flex items-center gap-3"
	aria-label="Beranda — IPNU IPPNU SMK LPPM RI 2 Kedungreja"
>
	<!-- Lambang komisariat: bintang NU di kotak hijau tinta, pusaran merah IPPNU. -->
	<svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
		<rect x="1" y="1" width="46" height="46" rx="10" fill="#065f46" />
		<rect
			x="1.5"
			y="1.5"
			width="45"
			height="45"
			rx="9.5"
			fill="none"
			stroke="#022c22"
			stroke-width="1"
		/>
		<path d="M24 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#ffffff" fill-opacity="0.97" />
		<circle cx="24" cy="24" r="4.5" fill="#b91c1c" />
	</svg>
	{#if teks}
		<div class="leading-tight">
			<p
				class="font-display text-lg font-bold tracking-tight {terang
					? 'text-white'
					: 'text-stone-900'}"
			>
				IPNU <span class={terang ? 'text-accent-300' : 'text-accent-700'}>IPPNU</span>
			</p>
			<p
				class="mt-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase {terang
					? 'text-primary-200'
					: 'text-stone-500'}"
			>
				SMK LPPM RI 2 Kedungreja
			</p>
		</div>
	{/if}
</a>
