<script lang="ts">
	import PublicNav from '#lib/components/layout/PublicNav.svelte';
	import PublicFooter from '#lib/components/layout/PublicFooter.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Setiap halaman publik memakai footer kertas (kolofon): blok hijau penuhnya
	// sudah dipakai kop kategori di kepala halaman — aturan maksimal satu blok
	// hijau per halaman (DESIGN.md §3.2).
</script>

<div class="flex min-h-screen flex-col">
	<PublicNav user={data.user ?? null} anggota={data.anggota ?? null} />
	<main class="flex-1">
		{@render children()}
	</main>
	<PublicFooter settings={data.settings} />
</div>
