<script lang="ts">
	import { FileText, Pencil, Plus, Search, Trash2, Upload } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import { fmtTanggalPendek, KATEGORI_DOKUMEN, ukuranFile } from '#lib/utils.ts';
	import type { DocumentItem } from '#lib/server/db.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Bentuk galat dari semua action diseragamkan agar aman diakses per field di template.
	const galat = $derived((form?.galat ?? null) as Record<string, string> | null);

	// --- Modal unggah / ubah dokumen ---
	let bukaForm = $state(false);
	let modeForm = $state<'buat' | 'ubah'>('buat');
	let dokAktif = $state<DocumentItem | null>(null);
	let judulForm = $state('');
	let deskripsiForm = $state('');
	let kategoriForm = $state<string>(KATEGORI_DOKUMEN[0] ?? 'Umum');
	let memproses = $state(false);

	function isiForm(
		dok: DocumentItem | null,
		nilai?: { judul: string; deskripsi: string; kategori: string } | null
	) {
		modeForm = dok ? 'ubah' : 'buat';
		dokAktif = dok;
		judulForm = nilai?.judul ?? dok?.judul ?? '';
		deskripsiForm = nilai?.deskripsi ?? dok?.deskripsi ?? '';
		kategoriForm =
			nilai?.kategori ??
			(dok && KATEGORI_DOKUMEN.includes(dok.kategori)
				? dok.kategori
				: (KATEGORI_DOKUMEN[0] ?? 'Umum'));
		bukaForm = true;
	}
	function bukaUnggah() {
		isiForm(null);
	}
	function bukaUbah(dok: DocumentItem) {
		isiForm(dok);
	}
	const actionForm = $derived(modeForm === 'buat' ? '?/buat' : `?/ubah&id=${dokAktif?.id ?? 0}`);

	// Sinkron hasil aksi server: sukses → tutup modal; gagal validasi → buka ulang & isi kembali.
	$effect(() => {
		if (!form) return;
		memproses = false;

		if (form.galat) {
			if (form.mode === 'buat') isiForm(null, form.nilai);
			else if (form.mode === 'ubah')
				isiForm(data.dokumen.find((d) => d.id === form.id) ?? null, form.nilai);
		} else if (form.sukses) {
			bukaForm = false;
		}
	});
</script>

<svelte:head><title>Kelola Dokumen — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Dokumen</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.jumlah} dokumen — {data.unduhan} kali diunduh publik.
		</p>
	</div>
	<button class="btn btn-primary" onclick={bukaUnggah}
		><Plus class="h-4 w-4" /> Unggah Dokumen</button
	>
</div>

{#if form?.sukses}
	<div
		class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
	>
		{form.terhapus ? 'Dokumen berhasil dihapus.' : 'Dokumen berhasil disimpan.'}
	</div>
{/if}

<div class="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
	<form method="GET" class="flex gap-2 sm:w-80">
		<div class="relative flex-1">
			<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
			<input
				name="q"
				value={data.q}
				class="input pl-10"
				placeholder="Cari judul / nama file…"
				aria-label="Cari dokumen"
			/>
		</div>
		<button class="btn btn-outline" type="submit">Cari</button>
	</form>
</div>

{#if data.dokumen.length === 0}
	<EmptyState
		icon={FileText}
		title={data.q ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen'}
		desc={data.q
			? 'Tidak ada dokumen yang cocok dengan pencarian. Coba kata kunci lain.'
			: 'Unggah dokumen resmi komisariat agar bisa diunduh publik lewat halaman Dokumen & Unduhan.'}
	>
		{#if !data.q}
			<button class="btn btn-primary" onclick={bukaUnggah}>Unggah dokumen pertama</button>
		{/if}
	</EmptyState>
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[760px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">Judul</th>
					<th class="th">Kategori</th>
					<th class="th">Ukuran</th>
					<th class="th">Unduhan</th>
					<th class="th">Tanggal</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.dokumen as d (d.id)}
					<tr class="hover:bg-stone-50">
						<td class="td max-w-xs">
							<span class="font-semibold text-stone-900">{d.judul}</span>
							<p class="truncate text-xs text-stone-400">{d.nama_file ?? d.file}</p>
						</td>
						<td class="td"><span class="badge badge-blue">{d.kategori}</span></td>
						<td class="td whitespace-nowrap">{ukuranFile(d.ukuran)}</td>
						<td class="td">{d.downloads}</td>
						<td class="td text-xs whitespace-nowrap"
							>{fmtTanggalPendek(d.created_at.slice(0, 10))}</td
						>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								<button
									class="btn btn-outline btn-sm"
									onclick={() => bukaUbah(d)}
									aria-label="Ubah {d.judul}"
								>
									<Pencil class="h-3.5 w-3.5" /> Ubah
								</button>
								<form
									method="POST"
									action="?/hapus&id={d.id}"
									onsubmit={(e) => {
										if (!confirm(`Hapus dokumen "${d.judul}"?`)) e.preventDefault();
									}}
								>
									<button class="btn btn-danger btn-sm" aria-label="Hapus {d.judul}"
										><Trash2 class="h-3.5 w-3.5" /></button
									>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-3 text-xs text-stone-400">
		<Upload class="mr-1 inline h-3.5 w-3.5" />
		Dokumen dapat diunduh publik lewat tautan
		<code class="rounded bg-stone-100 px-1 py-0.5">/dokumen/{'{id}'}/unduh</code>.
	</p>
{/if}

<!-- Modal unggah / ubah dokumen -->
<Modal
	open={bukaForm}
	title={modeForm === 'buat' ? 'Unggah Dokumen' : 'Ubah Dokumen'}
	onclose={() => (bukaForm = false)}
>
	<form
		method="POST"
		action={actionForm}
		enctype="multipart/form-data"
		class="space-y-4"
		onsubmit={() => (memproses = true)}
	>
		{#if galat?.umum}
			<div
				class="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
				role="alert"
			>
				{galat.umum}
			</div>
		{/if}

		<div>
			<label class="label" for="d-judul">Judul dokumen <span class="text-accent-600">*</span></label
			>
			<input
				id="d-judul"
				name="judul"
				class="input {galat?.judul ? 'input-error' : ''}"
				required
				maxlength="180"
				placeholder="mis. Program Kerja Periode 2026/2027"
				bind:value={judulForm}
			/>
			{#if galat?.judul}<p class="error-text">{galat.judul}</p>{/if}
		</div>

		<div>
			<label class="label" for="d-deskripsi">Deskripsi</label>
			<textarea
				id="d-deskripsi"
				name="deskripsi"
				rows="3"
				maxlength="400"
				class="input"
				placeholder="Jelaskan isi & kegunaan dokumen…"
				bind:value={deskripsiForm}></textarea>
		</div>

		<div>
			<label class="label" for="d-kategori">Kategori</label>
			<select id="d-kategori" name="kategori" class="input" bind:value={kategoriForm}>
				{#each KATEGORI_DOKUMEN as k (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
			<p class="hint">Dokumen dikelompokkan per kategori di halaman publik.</p>
		</div>

		<div>
			<label class="label" for="d-file">
				File dokumen {#if modeForm === 'buat'}<span class="text-accent-600">*</span>{/if}
			</label>
			<input
				id="d-file"
				name="file"
				type="file"
				required={modeForm === 'buat'}
				accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.svg,.zip"
				class="input file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-700 {galat?.file
					? 'input-error'
					: ''}"
			/>
			{#if modeForm === 'ubah' && dokAktif}
				<p class="hint">
					File saat ini: <b>{dokAktif.nama_file ?? dokAktif.file}</b> ({ukuranFile(
						dokAktif.ukuran
					)}). Biarkan kosong bila tidak diganti.
				</p>
			{:else}
				<p class="hint">PDF/Word/Excel/PowerPoint/gambar/ZIP maks. 25 MB.</p>
			{/if}
			{#if galat?.file}<p class="error-text">{galat.file}</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-1">
			<button type="button" class="btn btn-ghost" onclick={() => (bukaForm = false)}>Batal</button>
			<button class="btn btn-primary" type="submit" disabled={memproses}>
				{memproses ? 'Menyimpan…' : modeForm === 'buat' ? 'Unggah Dokumen' : 'Simpan Perubahan'}
			</button>
		</div>
	</form>
</Modal>
