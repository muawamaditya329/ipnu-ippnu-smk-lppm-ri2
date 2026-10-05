<script lang="ts">
	import { Plus, Search, Newspaper, Pencil, Trash2, Funnel } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { fmtTanggalPendek, LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';
	import { kirimJikaSetuju } from '#lib/konfirmasi.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const toneStatus = { terbit: 'green', draft: 'amber' } as const;
	const toneCakupan = { umum: 'blue', ipnu: 'green', ippnu: 'red' } as const;

	const hrefHalaman = (p: number) => {
		const sp = new SvelteURLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (data.cakupan) sp.set('cakupan', data.cakupan);
		if (data.status) sp.set('status', data.status);
		if (p > 1) sp.set('halaman', String(p));
		const qs = sp.toString();
		return `/admin/berita${qs ? `?${qs}` : ''}`;
	};

	const adaFilter = $derived(data.q || data.cakupan || data.status);
</script>

<svelte:head><title>Kelola Berita — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Berita</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.total} berita {adaFilter ? 'cocok dengan filter' : 'terdaftar'} — termasuk draf yang belum
			tayang.
		</p>
	</div>
	<a href="/admin/berita/baru" class="btn btn-primary"><Plus class="h-4 w-4" /> Tulis Berita</a>
</div>

{#if form?.sukses}
	<div
		class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
	>
		Berita berhasil dihapus.
	</div>
{:else if form?.galat}
	<div
		class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
	>
		{form.galat}
	</div>
{/if}

<div class="card mb-6 p-4">
	<form method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="flex-1">
			<label class="label" for="q-admin-berita">Cari berita</label>
			<div class="relative">
				<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
				<input
					id="q-admin-berita"
					name="q"
					value={data.q}
					class="input pl-10"
					placeholder="Cari judul / ringkasan…"
					aria-label="Cari berita"
				/>
			</div>
		</div>
		<div class="sm:w-40">
			<label class="label" for="cakupan-admin-berita">Cakupan</label>
			<select id="cakupan-admin-berita" name="cakupan" class="input">
				<option value="">Semua</option>
				{#each Object.entries(LABEL_CAKUPAN) as [k, label] (k)}
					<option value={k} selected={data.cakupan === k}>{label}</option>
				{/each}
			</select>
		</div>
		<div class="sm:w-40">
			<label class="label" for="status-admin-berita">Status</label>
			<select id="status-admin-berita" name="status" class="input">
				<option value="">Semua</option>
				<option value="terbit" selected={data.status === 'terbit'}>Terbit</option>
				<option value="draft" selected={data.status === 'draft'}>Draf</option>
			</select>
		</div>
		<button class="btn btn-outline" type="submit"><Funnel class="h-4 w-4" /> Terapkan</button>
		{#if adaFilter}
			<a href="/admin/berita" class="btn btn-ghost">Reset</a>
		{/if}
	</form>
</div>

{#if data.posts.length === 0}
	<EmptyState
		icon={Newspaper}
		title={adaFilter ? 'Tidak ada yang cocok' : 'Belum ada berita'}
		desc={adaFilter
			? 'Tidak ada berita yang cocok dengan filter saat ini. Coba ubah kata kunci atau reset filter.'
			: 'Tulisan pertama Anda akan tampil di halaman publik setelah berstatus terbit.'}
	>
		{#if adaFilter}
			<a href="/admin/berita" class="btn btn-outline">Reset filter</a>
		{:else}
			<a href="/admin/berita/baru" class="btn btn-primary">Tulis berita pertama</a>
		{/if}
	</EmptyState>
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[720px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">Judul</th>
					<th class="th">Kategori</th>
					<th class="th">Cakupan</th>
					<th class="th">Status</th>
					<th class="th">Dilihat</th>
					<th class="th">Tanggal</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.posts as post (post.id)}
					<tr class="hover:bg-stone-50">
						<td class="td max-w-xs">
							<a
								href="/admin/berita/{post.id}"
								class="font-semibold text-stone-900 hover:text-primary-700">{post.judul}</a
							>
							<p class="text-xs text-stone-400">oleh {post.penulis_nama ?? '—'}</p>
						</td>
						<td class="td">{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}</td>
						<td class="td"
							><span class="badge badge-{toneCakupan[post.cakupan]}"
								>{LABEL_CAKUPAN[post.cakupan]}</span
							></td
						>
						<td class="td"
							><span class="badge badge-{toneStatus[post.status]}"
								>{post.status === 'terbit' ? 'Terbit' : 'Draf'}</span
							></td
						>
						<td class="td">{post.views}</td>
						<td class="td text-xs">{fmtTanggalPendek(post.published_at ?? post.created_at)}</td>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								<a
									href="/admin/berita/{post.id}"
									class="btn btn-outline btn-sm"
									aria-label="Ubah {post.judul}"><Pencil class="h-3.5 w-3.5" /> Ubah</a
								>
								<form
									method="POST"
									action="?/hapus&id={post.id}"
									onsubmit={(e) =>
										kirimJikaSetuju(e, {
											judul: 'Hapus Berita',
											pesan: `Berita "${post.judul}" akan dihapus permanen beserta cover-nya.`,
											tombol: 'Hapus'
										})}
								>
									<button class="btn btn-danger btn-sm" aria-label="Hapus {post.judul}"
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
	<Pagination page={data.halaman} totalPages={data.totalHalaman} href={hrefHalaman} />
{/if}
