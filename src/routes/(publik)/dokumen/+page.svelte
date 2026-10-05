<script lang="ts">
	import { Download } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { KATEGORI_DOKUMEN, ukuranFile } from '#lib/utils.ts';
	import type { DocumentItem } from '#lib/server/db.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Kelompokkan dokumen per kategori sesuai urutan KATEGORI_DOKUMEN; kategori tak dikenal masuk "Umum".
	const kategoriDokumen = (d: DocumentItem) =>
		KATEGORI_DOKUMEN.includes(d.kategori) ? d.kategori : 'Umum';

	const kelompok = $derived.by(() =>
		KATEGORI_DOKUMEN.map((kategori) => ({
			kategori,
			items: data.dokumen.filter((d) => kategoriDokumen(d) === kategori)
		})).filter((g) => g.items.length > 0)
	);
</script>

<svelte:head>
	<title>Dokumen & Unduhan — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Perpustakaan dokumen komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja: AD/ART, program kerja, formulir, dan laporan."
	/>
</svelte:head>

<PageHeader
	kicker="Arsip Resmi"
	title="Dokumen & Unduhan"
	desc="Kumpulan dokumen resmi komisariat yang dapat diunduh — anggaran dasar, program kerja, formulir, hingga laporan kegiatan."
/>

<section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
	{#if data.dokumen.length === 0}
		<EmptyState
			title="Belum ada dokumen"
			desc="Dokumen yang dapat diunduh akan dipublikasikan pengurus di halaman ini. Silakan cek kembali lain waktu."
		/>
	{:else}
		<p class="mb-2 text-sm text-stone-500">
			Tersedia <b>{data.dokumen.length}</b> dokumen dalam <b>{kelompok.length}</b> kategori.
		</p>

		<div class="mt-8 space-y-10">
			{#each kelompok as g, i (g.kategori)}
				<section>
					<SectionHeading nomor={String(i + 1).padStart(2, '0')} title={g.kategori} />
					<!-- Daftar arsip: satu baris per berkas dengan garis kiri emas -->
					<div class="mt-4 border-t border-stone-200">
						{#each g.items as d (d.id)}
							<article
								class="aksen-kas flex flex-col gap-3 border-b border-stone-200 bg-white py-4 pl-4 sm:flex-row sm:items-center sm:gap-5 sm:pr-4"
							>
								<div class="min-w-0 flex-1">
									<h3 class="font-display text-base font-bold text-stone-900">{d.judul}</h3>
									{#if d.deskripsi}
										<p class="mt-0.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
											{d.deskripsi}
										</p>
									{/if}
									<p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
										<span class="badge badge-gray">{kategoriDokumen(d)}</span>
										<span class="tabular-nums">{ukuranFile(d.ukuran)}</span>
										<span class="inline-flex items-center gap-1 tabular-nums"
											><Download class="h-3 w-3" aria-hidden="true" /> {d.downloads} unduhan</span
										>
									</p>
								</div>
								<a
									href="/dokumen/{d.id}/unduh"
									class="btn btn-outline btn-sm shrink-0 self-start sm:self-auto"
									download
								>
									<Download class="h-3.5 w-3.5" aria-hidden="true" /> Unduh
								</a>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</section>
