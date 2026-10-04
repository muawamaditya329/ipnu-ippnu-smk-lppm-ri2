<script lang="ts">
	import { Download, FileText } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
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

<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			eyebrow="Perpustakaan"
			title="Dokumen & Unduhan"
			desc="Kumpulan dokumen resmi komisariat yang dapat diunduh — anggaran dasar, program kerja, formulir, hingga laporan kegiatan."
		/>
	</div>
</section>

<section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
	{#if data.dokumen.length === 0}
		<EmptyState
			icon={FileText}
			title="Belum ada dokumen"
			desc="Dokumen yang dapat diunduh akan dipublikasikan pengurus di halaman ini. Silakan cek kembali lain waktu."
		/>
	{:else}
		<p class="mb-8 text-sm text-stone-500">
			Tersedia <b>{data.dokumen.length}</b> dokumen dalam <b>{kelompok.length}</b> kategori.
		</p>

		<div class="space-y-10">
			{#each kelompok as g (g.kategori)}
				<section>
					<h2
						class="mb-4 flex items-center gap-2 font-display text-xl font-extrabold text-stone-900"
					>
						<FileText class="h-5 w-5 text-primary-700" />
						{g.kategori}
						<span class="badge badge-gray">{g.items.length}</span>
					</h2>
					<div class="space-y-3">
						{#each g.items as d (d.id)}
							<article class="card flex items-center gap-4 p-4">
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"
								>
									<FileText class="h-5 w-5" />
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-display text-sm font-bold text-stone-900 sm:text-base">
										{d.judul}
									</h3>
									{#if d.deskripsi}
										<p class="mt-0.5 line-clamp-2 text-sm text-stone-500">{d.deskripsi}</p>
									{/if}
									<p
										class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-400"
									>
										<span>{ukuranFile(d.ukuran)}</span>
										<span class="inline-flex items-center gap-1"
											><Download class="h-3 w-3" /> {d.downloads} unduhan</span
										>
									</p>
								</div>
								<a href="/dokumen/{d.id}/unduh" class="btn btn-outline btn-sm shrink-0" download>
									<Download class="h-3.5 w-3.5" /> Unduh
								</a>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</section>
