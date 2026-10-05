<script lang="ts">
	import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Images, X } from '@lucide/svelte';
	// ChevronLeft/Right + X dipakai lightbox; ArrowLeft untuk tautan kembali ke arsip.
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { fmtTanggalPendek } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const album = $derived(data.album);
	const fotos = $derived(data.fotos);

	// --- Lightbox sederhana (client-side) ---
	let aktif = $state<number | null>(null);

	const fotoAktif = $derived(aktif !== null ? (fotos[aktif] ?? null) : null);
	const adaLightbox = $derived(fotoAktif !== null);

	function tutup() {
		aktif = null;
	}
	function berikutnya() {
		if (aktif === null || fotos.length < 2) return;
		aktif = (aktif + 1) % fotos.length;
	}
	function sebelumnya() {
		if (aktif === null || fotos.length < 2) return;
		aktif = (aktif - 1 + fotos.length) % fotos.length;
	}
	function tombol(e: KeyboardEvent) {
		if (!adaLightbox) return;
		if (e.key === 'Escape') tutup();
		else if (e.key === 'ArrowRight') berikutnya();
		else if (e.key === 'ArrowLeft') sebelumnya();
	}
</script>

<svelte:window onkeydown={tombol} />

<svelte:head>
	<title>{album.judul} — Galeri — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={album.deskripsi ?? album.judul} />
</svelte:head>

<!-- Kop album: blok hijau kategori (konsisten dgn halaman publik lain) -->
<PageHeader kicker="Galeri — Album" title={album.judul} desc={album.deskripsi ?? ''}>
	<nav class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-100" aria-label="Breadcrumb">
		<a
			href="/galeri"
			class="inline-flex items-center gap-1.5 font-semibold text-gold-300 hover:text-gold-200"
		>
			<ArrowLeft class="h-4 w-4" /> Semua album
		</a>
		{#if album.tanggal}
			<span class="inline-flex items-center gap-1.5"
				><CalendarDays class="h-4 w-4" /> {fmtTanggalPendek(album.tanggal)}</span
			>
		{/if}
		<span class="inline-flex items-center gap-1.5"><Images class="h-4 w-4" /> {fotos.length} foto</span>
	</nav>
</PageHeader>

<section class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
	{#if fotos.length === 0}
		<EmptyState
			icon={Images}
			title="Album ini belum memiliki foto"
			desc="Foto untuk album ini akan segera ditambahkan pengurus. Silakan cek kembali lain waktu."
		/>
	{:else}
		<p class="mb-5 text-sm text-stone-500">Klik foto untuk memperbesar.</p>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each fotos as f, i (f.id)}
				<button
					type="button"
					class="group relative aspect-square overflow-hidden rounded-xl bg-stone-100"
					onclick={() => (aktif = i)}
					aria-label="Perbesar foto {i + 1}"
				>
					<img
						src="/uploads/{f.file}"
						alt={f.caption ?? album.judul}
						loading="lazy"
						class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
					/>
					{#if f.caption}
						<span
							class="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-stone-950/80 to-transparent px-2.5 pt-6 pb-2 text-left text-[11px] font-medium text-white"
						>
							{f.caption}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</section>

{#if adaLightbox && fotoAktif}
	<div
		class="fixed inset-0 z-50 bg-stone-950/90"
		role="dialog"
		aria-modal="true"
		aria-label="Pratinjau foto"
	>
		<!-- Latar: klik untuk menutup -->
		<button
			class="absolute inset-0 h-full w-full cursor-default"
			aria-label="Tutup pratinjau"
			onclick={tutup}
		></button>

		<button
			class="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/25"
			onclick={tutup}
			aria-label="Tutup"
		>
			<X class="h-5 w-5" />
		</button>

		{#if fotos.length > 1}
			<button
				class="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/25 sm:left-5"
				onclick={sebelumnya}
				aria-label="Foto sebelumnya"
			>
				<ChevronLeft class="h-6 w-6" />
			</button>
			<button
				class="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/25 sm:right-5"
				onclick={berikutnya}
				aria-label="Foto berikutnya"
			>
				<ChevronRight class="h-6 w-6" />
			</button>
		{/if}

		<!-- pointer-events-none: area kosong figure tembus ke tombol latar di bawahnya,
			 sehingga "klik area gelap utk menutup" benar-benar berfungsi; gambar/keterangan
			 tetap dapat menerima klik lewat pointer-events-auto. -->
		<figure
			class="pointer-events-none relative flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-12"
		>
			<img
				src="/uploads/{fotoAktif.file}"
				alt={fotoAktif.caption ?? album.judul}
				class="pointer-events-auto mx-auto max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-overlay"
			/>
			{#if fotoAktif.caption}
				<figcaption class="pointer-events-auto max-w-2xl text-center text-sm text-stone-200">
					{fotoAktif.caption}
				</figcaption>
			{/if}
			{#if fotos.length > 1}
				<p class="text-xs font-semibold text-stone-400">{(aktif ?? 0) + 1} / {fotos.length}</p>
			{/if}
		</figure>
	</div>
{/if}
