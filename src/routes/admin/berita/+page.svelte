<script lang="ts">
	import { Plus, Search, Newspaper, Pencil, Trash2 } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import { fmtTanggalPendek, LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const toneStatus = { terbit: 'green', draft: 'amber' } as const;
	const toneCakupan = { umum: 'blue', ipnu: 'green', ippnu: 'red' } as const;
</script>

<svelte:head><title>Kelola Berita — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Berita</h1>
		<p class="mt-1 text-sm text-stone-500">{data.total} berita terdaftar — termasuk draf yang belum tayang.</p>
	</div>
	<a href="/admin/berita/baru" class="btn btn-primary"><Plus class="h-4 w-4" /> Tulis Berita</a>
</div>

{#if form?.sukses}
	<div class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">
		Berita berhasil dihapus.
	</div>
{/if}

<div class="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
	<form method="GET" class="flex gap-2 sm:w-80">
		<div class="relative flex-1">
			<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
			<input name="q" value={data.q} class="input pl-10" placeholder="Cari judul berita…" aria-label="Cari berita" />
		</div>
		<button class="btn btn-outline" type="submit">Cari</button>
	</form>
</div>

{#if data.posts.length === 0}
	<EmptyState icon={Newspaper} title="Belum ada berita" desc="Tulisan pertama Anda akan tampil di halaman publik setelah berstatus terbit.">
		<a href="/admin/berita/baru" class="btn btn-primary">Tulis berita pertama</a>
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
							<a href="/admin/berita/{post.id}" class="font-semibold text-stone-900 hover:text-primary-700">{post.judul}</a>
							<p class="text-xs text-stone-400">oleh {post.penulis_nama ?? '—'}</p>
						</td>
						<td class="td">{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}</td>
						<td class="td"><span class="badge badge-{toneCakupan[post.cakupan]}">{LABEL_CAKUPAN[post.cakupan]}</span></td>
						<td class="td"><span class="badge badge-{toneStatus[post.status]}">{post.status === 'terbit' ? 'Terbit' : 'Draf'}</span></td>
						<td class="td">{post.views}</td>
						<td class="td text-xs">{fmtTanggalPendek(post.published_at ?? post.created_at)}</td>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								<a href="/admin/berita/{post.id}" class="btn btn-outline btn-sm" aria-label="Ubah {post.judul}"><Pencil class="h-3.5 w-3.5" /> Ubah</a>
								<form
									method="POST"
									action="?/hapus&id={post.id}"
									onsubmit={(e) => {
										if (!confirm(`Hapus berita "${post.judul}"?`)) e.preventDefault();
									}}
								>
									<button class="btn btn-danger btn-sm" aria-label="Hapus {post.judul}"><Trash2 class="h-3.5 w-3.5" /></button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination page={data.halaman} totalPages={data.totalHalaman} href={(p) => `/admin/berita?q=${encodeURIComponent(data.q)}&halaman=${p}`} />
{/if}
