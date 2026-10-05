<script lang="ts">
	import { Images, Pencil, Plus, Trash2, X } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import { fmtTanggalPendek } from '#lib/utils.ts';
	import type { Album } from '#lib/server/db.ts';
	import { kirimJikaSetuju } from '#lib/konfirmasi.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Bentuk galat dari semua action diseragamkan agar aman diakses per field di template.
	const galat = $derived((form?.galat ?? null) as Record<string, string> | null);

	const cariAlbum = (id: number | null) =>
		id === null ? null : (data.albums.find((a) => a.id === id) ?? null);

	// --- Modal buat / ubah album ---
	let bukaAlbum = $state(false);
	let modeAlbum = $state<'buat' | 'ubah'>('buat');
	let albumAktif = $state<Album | null>(null);
	let judulForm = $state('');
	let deskripsiForm = $state('');
	let tanggalForm = $state('');

	function isiFormAlbum(
		album: Album | null,
		nilai?: { judul: string; deskripsi: string; tanggal: string } | null
	) {
		modeAlbum = album ? 'ubah' : 'buat';
		albumAktif = album;
		judulForm = nilai?.judul ?? album?.judul ?? '';
		deskripsiForm = nilai?.deskripsi ?? album?.deskripsi ?? '';
		tanggalForm = nilai?.tanggal ?? album?.tanggal ?? '';
		bukaAlbum = true;
	}
	function bukaAlbumBaru() {
		isiFormAlbum(null);
	}
	function bukaUbahAlbum(album: Album) {
		isiFormAlbum(album);
	}
	const actionAlbum = $derived(
		modeAlbum === 'buat' ? '?/buat' : `?/ubah&id=${albumAktif?.id ?? 0}`
	);

	// --- Modal kelola foto ---
	let bukaFoto = $state(false);
	let albumFoto = $state<Album | null>(null);

	function bukaKelolaFoto(album: Album) {
		albumFoto = album;
		bukaFoto = true;
	}
	// Foto-foto milik album yang sedang dikelola.
	const fotosAlbum = $derived.by(() => {
		const id = albumFoto?.id;
		return id === undefined ? [] : data.fotos.filter((f) => f.album_id === id);
	});
	let memproses = $state(false);

	// Sinkron hasil aksi server: sukses → tutup modal (modal foto tetap terbuka agar bisa lanjut unggah),
	// gagal validasi → buka ulang modal terkait & isi kembali.
	$effect(() => {
		if (!form) return;
		memproses = false;

		if (form.galat) {
			if (form.mode === 'album') {
				isiFormAlbum(cariAlbum(form.albumId), form.nilai);
			} else if (form.mode === 'foto') {
				const album = cariAlbum(form.albumId);
				if (album) bukaKelolaFoto(album);
			}
		} else if (form.sukses) {
			if (form.mode === 'foto') {
				const album = cariAlbum(form.albumId);
				if (album) bukaKelolaFoto(album);
				else bukaFoto = false;
				bukaAlbum = false;
			} else {
				bukaAlbum = false;
				bukaFoto = false;
			}
		}
	});
</script>

<svelte:head><title>Kelola Galeri — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Galeri</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.albums.length} album — {data.fotos.length} foto dokumentasi kegiatan.
		</p>
	</div>
	<button class="btn btn-primary" onclick={bukaAlbumBaru}
		><Plus class="h-4 w-4" /> Buat Album</button
	>
</div>

{#if form?.sukses}
	<div
		class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
	>
		{form.terhapus
			? form.mode === 'foto'
				? 'Foto berhasil dihapus dari album.'
				: 'Album beserta seluruh fotonya berhasil dihapus.'
			: form.mode === 'foto'
				? 'Foto berhasil ditambahkan ke album.'
				: 'Album berhasil disimpan.'}
	</div>
{/if}

{#if data.albums.length === 0}
	<EmptyState
		icon={Images}
		title="Belum ada album"
		desc="Buat album untuk mengelompokkan dokumentasi foto kegiatan, lalu unggah foto-fotanya."
	>
		<button class="btn btn-primary" onclick={bukaAlbumBaru}>Buat album pertama</button>
	</EmptyState>
{:else}
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.albums as album (album.id)}
			<article class="card flex flex-col overflow-hidden">
				<div class="relative aspect-[4/3] bg-stone-100">
					{#if album.cover}
						<img
							src="/uploads/{album.cover}"
							alt={album.judul}
							loading="lazy"
							class="h-full w-full object-cover"
						/>
					{:else}
						<div
							class="pattern-islamic flex h-full w-full items-center justify-center bg-primary-800"
						>
							<Images class="h-10 w-10 text-white/60" />
						</div>
					{/if}
					<span class="badge absolute top-3 right-3 bg-white/90 text-stone-700">
						<Images class="h-3 w-3" />
						{album.jumlah_foto} foto
					</span>
				</div>
				<div class="flex flex-1 flex-col p-4">
					<h3 class="font-display text-base font-bold text-stone-900">{album.judul}</h3>
					{#if album.deskripsi}
						<p class="mt-1 line-clamp-2 text-sm text-stone-500">{album.deskripsi}</p>
					{/if}
					<p class="mt-2 text-xs text-stone-400">
						Dibuat {fmtTanggalPendek(album.tanggal ?? album.created_at)}
					</p>
					<div class="mt-4 flex flex-wrap items-center gap-1.5 pt-1">
						<button class="btn btn-outline btn-sm" onclick={() => bukaKelolaFoto(album)}>
							<Images class="h-3.5 w-3.5" /> Kelola Foto
						</button>
						<button class="btn btn-outline btn-sm" onclick={() => bukaUbahAlbum(album)}>
							<Pencil class="h-3.5 w-3.5" /> Ubah
						</button>
						<form
							method="POST"
							action="?/hapus&id={album.id}"
							onsubmit={(e) =>
								kirimJikaSetuju(e, {
									judul: 'Hapus Album',
									pesan: `Album "${album.judul}" beserta ${album.jumlah_foto} foto di dalamnya akan dihapus permanen.`,
									tombol: 'Hapus'
								})}
						>
							<button class="btn btn-danger btn-sm" aria-label="Hapus album {album.judul}"
								><Trash2 class="h-3.5 w-3.5" /></button
							>
						</form>
					</div>
				</div>
			</article>
		{/each}
	</div>
{/if}

<!-- Modal buat / ubah album -->
<Modal
	open={bukaAlbum}
	title={modeAlbum === 'buat' ? 'Buat Album' : 'Ubah Album'}
	onclose={() => (bukaAlbum = false)}
>
	<form method="POST" action={actionAlbum} class="space-y-4" onsubmit={() => (memproses = true)}>
		{#if galat?.umum}
			<div
				class="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
				role="alert"
			>
				{galat.umum}
			</div>
		{/if}

		<div>
			<label class="label" for="a-judul">Judul album <span class="text-accent-600">*</span></label>
			<input
				id="a-judul"
				name="judul"
				class="input {galat?.judul ? 'input-error' : ''}"
				required
				maxlength="150"
				placeholder="mis. Kajian Kitab Bulanan"
				bind:value={judulForm}
			/>
			{#if galat?.judul}<p class="error-text">{galat.judul}</p>{/if}
		</div>

		<div>
			<label class="label" for="a-deskripsi">Deskripsi</label>
			<textarea
				id="a-deskripsi"
				name="deskripsi"
				rows="3"
				maxlength="400"
				class="input {galat?.deskripsi ? 'input-error' : ''}"
				placeholder="Ceritakan singkat kegiatan yang didokumentasikan…"
				bind:value={deskripsiForm}></textarea>
			{#if galat?.deskripsi}<p class="error-text">{galat.deskripsi}</p>{/if}
		</div>

		<div>
			<label class="label" for="a-tanggal">Tanggal kegiatan</label>
			<input
				id="a-tanggal"
				name="tanggal"
				type="date"
				class="input {galat?.tanggal ? 'input-error' : ''}"
				bind:value={tanggalForm}
			/>
			<p class="hint">Tanggal saat kegiatan dilaksanakan (tampil di kartu album).</p>
			{#if galat?.tanggal}<p class="error-text">{galat.tanggal}</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-1">
			<button type="button" class="btn btn-ghost" onclick={() => (bukaAlbum = false)}>Batal</button>
			<button class="btn btn-primary" type="submit" disabled={memproses}>
				{memproses ? 'Menyimpan…' : modeAlbum === 'buat' ? 'Buat Album' : 'Simpan Perubahan'}
			</button>
		</div>
	</form>
</Modal>

<!-- Modal kelola foto album -->
<Modal
	open={bukaFoto}
	title={albumFoto ? `Kelola Foto — ${albumFoto.judul}` : 'Kelola Foto'}
	wide
	onclose={() => (bukaFoto = false)}
>
	{#if albumFoto}
		{#if galat?.umum}
			<div
				class="mb-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
				role="alert"
			>
				{galat.umum}
			</div>
		{/if}

		{#if fotosAlbum.length === 0}
			<p
				class="mb-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500"
			>
				Album ini belum memiliki foto. Unggah foto pertama lewat formulir di bawah.
			</p>
		{:else}
			<div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each fotosAlbum as f (f.id)}
					<figure class="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
						<img
							src="/uploads/{f.file}"
							alt={f.caption ?? 'Foto album'}
							loading="lazy"
							class="aspect-square w-full object-cover"
						/>
						<form
							method="POST"
							action="?/hapusFoto&fotoId={f.id}&albumId={albumFoto.id}"
							class="absolute top-2 right-2"
							onsubmit={(e) =>
								kirimJikaSetuju(e, {
									judul: 'Hapus Foto',
									pesan: 'Hapus foto ini dari album?',
									tombol: 'Hapus'
								})}
						>
							<button
								class="rounded-lg bg-stone-950/60 p-1.5 text-white backdrop-blur transition hover:bg-accent-700"
								aria-label="Hapus foto"
								title="Hapus foto"
							>
								<X class="h-4 w-4" />
							</button>
						</form>
						{#if f.caption}
							<figcaption
								class="absolute inset-x-0 bottom-0 truncate bg-stone-950/60 px-2 py-1 text-[11px] font-medium text-white"
							>
								{f.caption}
							</figcaption>
						{/if}
					</figure>
				{/each}
			</div>
		{/if}

		<form
			method="POST"
			action="?/unggahFoto"
			enctype="multipart/form-data"
			class="space-y-4 border-t border-stone-200 pt-4"
			onsubmit={() => (memproses = true)}
		>
			<input type="hidden" name="albumId" value={albumFoto.id} />
			<div>
				<label class="label" for="f-foto">Tambah foto</label>
				<input
					id="f-foto"
					name="foto"
					type="file"
					accept="image/*"
					multiple
					class="input file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-700 {galat?.foto
						? 'input-error'
						: ''}"
				/>
				<p class="hint">
					Bisa memilih beberapa foto sekaligus. JPG/PNG/WebP/GIF/SVG maks. 5 MB per foto.
				</p>
				{#if galat?.foto}<p class="error-text">{galat.foto}</p>{/if}
			</div>
			<div>
				<label class="label" for="f-caption">Keterangan (opsional)</label>
				<input
					id="f-caption"
					name="caption"
					class="input {galat?.caption ? 'input-error' : ''}"
					maxlength="150"
					placeholder="Berlaku untuk semua foto dalam unggahan ini"
				/>
				{#if galat?.caption}<p class="error-text">{galat.caption}</p>{/if}
			</div>
			<div class="flex items-center justify-end gap-2">
				<button type="button" class="btn btn-ghost" onclick={() => (bukaFoto = false)}>Tutup</button
				>
				<button class="btn btn-primary" type="submit" disabled={memproses}>
					{memproses ? 'Mengunggah…' : 'Unggah Foto'}
				</button>
			</div>
		</form>
	{/if}
</Modal>
