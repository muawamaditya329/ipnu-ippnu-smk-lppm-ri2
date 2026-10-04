<script lang="ts">
	import { CalendarDays, Images } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { fmtTanggalPendek } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Galeri Kegiatan — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Dokumentasi foto kegiatan komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja."
	/>
</svelte:head>

<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			eyebrow="Dokumentasi"
			title="Galeri Kegiatan"
			desc="Jejak langkah organisasi dalam kumpulan foto — kajian, bakti sosial, lomba, hingga perayaan besar."
		/>
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	{#if data.albums.length === 0}
		<EmptyState
			icon={Images}
			title="Belum ada album"
			desc="Dokumentasi foto kegiatan akan tampil di sini. Silakan kunjungi kembali lain waktu."
		/>
	{:else}
		<p class="mb-6 text-sm text-stone-500">
			Menampilkan <b>{data.albums.length}</b> album dokumentasi
		</p>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.albums as album (album.id)}
				<a
					href="/galeri/{album.id}"
					class="card group block overflow-hidden transition hover:shadow-lift"
					aria-label="Buka album {album.judul}"
				>
					<div class="relative aspect-[4/3] overflow-hidden bg-stone-100">
						{#if album.cover}
							<img
								src="/uploads/{album.cover}"
								alt={album.judul}
								loading="lazy"
								class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
							/>
						{:else}
							<div
								class="pattern-islamic flex h-full w-full items-center justify-center bg-primary-800"
							>
								<Images class="h-12 w-12 text-white/60" />
							</div>
						{/if}
						<div
							class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent p-4 pt-12"
						>
							<h3 class="font-display text-base font-bold text-white sm:text-lg">{album.judul}</h3>
							<div
								class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-200"
							>
								<span class="inline-flex items-center gap-1.5"
									><Images class="h-3.5 w-3.5" /> {album.jumlah_foto} foto</span
								>
								{#if album.tanggal}
									<span class="inline-flex items-center gap-1.5"
										><CalendarDays class="h-3.5 w-3.5" /> {fmtTanggalPendek(album.tanggal)}</span
									>
								{/if}
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
