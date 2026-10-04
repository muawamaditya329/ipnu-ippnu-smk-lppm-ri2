<script lang="ts">
	import BeritaForm from '#lib/components/admin/BeritaForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Tulis Berita — Dasbor</title></svelte:head>

<h1 class="mb-6 font-display text-2xl font-extrabold text-stone-900">Tulis Berita Baru</h1>

<BeritaForm galat={form?.galat ?? data.galat} />
