<script lang="ts">
	import { Camera, Images } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { fmtTanggalPendek } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Komposisi asimetris: album terbaru tampil besar, sisanya daftar baris
	// dengan thumbnail kecil — bukan grid kartu identik (DESIGN.md §3.4).
	const utama = $derived(data.albums[0] ?? null);
	const lainnya = $derived(data.albums.slice(1));
</script>

<svelte:head>
	<title>Galeri Kegiatan — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Dokumentasi foto kegiatan komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja."
	/>
</svelte:head>

<PageHeader
	kicker="Dokumentasi"
	title="Galeri Kegiatan"
	desc="Jejak langkah organisasi dalam kumpulan foto — kajian, bakti sosial, lomba, hingga perayaan besar."
/>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	{#if data.albums.length === 0}
		<EmptyState
			title="Belum ada album"
			desc="Dokumentasi foto kegiatan akan tampil di sini. Silakan kunjungi kembali lain waktu."
		/>
	{:else}
		<p class="mb-6 text-sm text-stone-500">
			Menampilkan <b>{data.albums.length}</b> album dokumentasi — pilih untuk membuka isinya.
		</p>

		<div class="grid gap-8 lg:grid-cols-12">
			{#if utama}
				<!-- Album terbaru: foto besar di kiri -->
				<a
					href="/galeri/{utama.id}"
					class="group relative block overflow-hidden rounded-xl bg-stone-200 lg:col-span-7"
					aria-label="Buka album {utama.judul}"
				>
					<div class="aspect-[4/3] lg:aspect-[16/10]">
						{#if utama.cover}
							<img
								src="/uploads/{utama.cover}"
								alt={utama.judul}
								class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center text-stone-400">
								<Camera class="h-10 w-10" aria-hidden="true" />
							</div>
						{/if}
					</div>
					<div
						class="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline justify-between gap-2 bg-stone-950/75 px-4 py-3"
					>
						<h2 class="font-display text-lg font-bold text-white">{utama.judul}</h2>
						<p class="text-xs text-stone-200">
							{utama.jumlah_foto} foto
							{#if utama.tanggal}
								&middot; {fmtTanggalPendek(utama.tanggal)}
							{/if}
						</p>
					</div>
				</a>
			{/if}

			<!-- Album lainnya: daftar baris bergaris dengan thumbnail kecil -->
			{#if lainnya.length > 0}
				<div class="lg:col-span-5">
					<p class="kicker">Album lainnya</p>
					<div class="mt-3 divide-y divide-stone-200 border-y border-stone-200">
						{#each lainnya as album (album.id)}
							<a href="/galeri/{album.id}" class="group flex items-center gap-4 py-4" aria-label="Buka album {album.judul}">
								<div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-200">
									{#if album.cover}
										<img
											src="/uploads/{album.cover}"
											alt={album.judul}
											loading="lazy"
											class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center text-stone-400">
											<Images class="h-5 w-5" aria-hidden="true" />
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<h3
										class="font-display text-base leading-snug font-bold text-stone-900 transition group-hover:text-primary-800"
									>
										{album.judul}
									</h3>
									<p class="mt-1 text-xs text-stone-500">
										{album.jumlah_foto} foto
										{#if album.tanggal}
											&middot; {fmtTanggalPendek(album.tanggal)}
										{/if}
									</p>
								</div>
								<span class="shrink-0 text-sm font-semibold text-stone-400 group-hover:text-primary-800" aria-hidden="true">
									&rarr;
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</section>
