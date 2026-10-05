<script lang="ts">
	import BeritaForm from '#lib/components/admin/BeritaForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Ubah Berita — Dasbor</title></svelte:head>

<div class="mb-6">
	<h1 class="font-display text-2xl font-extrabold text-stone-900">Ubah Berita</h1>
	<p class="mt-1 text-sm text-stone-500">Terakhir diperbarui: {data.post.updated_at}</p>
</div>

<BeritaForm
	post={data.post}
	galat={form?.galat ?? null}
	nilai={form?.nilai ?? null}
	action="?/simpan"
/>
