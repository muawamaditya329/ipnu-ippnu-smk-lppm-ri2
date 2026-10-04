<script lang="ts">
	import {
		Clock,
		Download,
		GraduationCap,
		IdCard,
		Search,
		Trash2,
		UserCheck,
		UserX,
		Users
	} from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import { fmtTanggalPendek, LABEL_STATUS_MEMBER, toneStatusMember } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const opsiStatus = [
		{ nilai: '', label: 'Semua status' },
		{ nilai: 'pending', label: LABEL_STATUS_MEMBER.pending },
		{ nilai: 'aktif', label: LABEL_STATUS_MEMBER.aktif },
		{ nilai: 'alumni', label: LABEL_STATUS_MEMBER.alumni },
		{ nilai: 'ditolak', label: LABEL_STATUS_MEMBER.ditolak }
	];

	const chipJk = [
		{ nilai: '', label: 'Semua' },
		{ nilai: 'L', label: 'Putra' },
		{ nilai: 'P', label: 'Putri' }
	];

	const hrefFilter = (jk: string) => {
		const sp = new URLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (data.status) sp.set('status', data.status);
		if (jk) sp.set('jk', jk);
		const qs = sp.toString();
		return `/admin/anggota${qs ? `?${qs}` : ''}`;
	};

	const hrefHalaman = (p: number) => {
		const sp = new URLSearchParams();
		if (data.q) sp.set('q', data.q);
		if (data.status) sp.set('status', data.status);
		if (data.jk) sp.set('jk', data.jk);
		if (p > 1) sp.set('halaman', String(p));
		const qs = sp.toString();
		return `/admin/anggota${qs ? `?${qs}` : ''}`;
	};

	// Berkas CSV dari action ?/csv langsung diunduh sebagai Blob.
	$effect(() => {
		const csv = form?.csv;
		if (!csv) return;
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
		const tautan = document.createElement('a');
		tautan.href = url;
		tautan.download = 'anggota.csv';
		document.body.appendChild(tautan);
		tautan.click();
		tautan.remove();
		URL.revokeObjectURL(url);
	});
</script>

<svelte:head><title>Data Anggota — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Data Anggota</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.total} anggota ditampilkan — kelola pendaftaran, keanggotaan, dan kartu anggota.
		</p>
	</div>
	<form method="POST" action="?/csv">
		{#if data.q}<input type="hidden" name="q" value={data.q} />{/if}
		{#if data.status}<input type="hidden" name="status" value={data.status} />{/if}
		{#if data.jk}<input type="hidden" name="jk" value={data.jk} />{/if}
		<button class="btn btn-outline" type="submit"><Download class="h-4 w-4" /> Unduh CSV</button>
	</form>
</div>

{#if form?.pesan}
	<div
		class="mb-5 rounded-xl border px-4 py-3 text-sm font-medium {form.sukses
			? 'border-primary-200 bg-primary-50 text-primary-800'
			: 'border-accent-200 bg-accent-50 text-accent-700'}"
		role="status"
	>
		{form.pesan}
	</div>
{:else if form?.csv}
	<div
		class="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800"
	>
		<span>Berkas CSV siap. Bila unduhan tidak berjalan otomatis, gunakan tautan berikut:</span>
		<a
			href={'data:text/csv;charset=utf-8,' + encodeURIComponent(form.csv)}
			download="anggota.csv"
			class="btn btn-outline btn-sm"
		>
			<Download class="h-3.5 w-3.5" /> Simpan anggota.csv
		</a>
	</div>
{/if}

<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<StatCard
		label="Anggota Aktif"
		value={data.statistik.aktif}
		icon={UserCheck}
		tone="green"
		href="/admin/anggota?status=aktif"
	/>
	<StatCard
		label="Menunggu Verifikasi"
		value={data.statistik.menunggu}
		icon={Clock}
		tone="amber"
		href="/admin/anggota?status=pending"
	/>
	<StatCard
		label="Alumni"
		value={data.statistik.alumni}
		icon={GraduationCap}
		tone="stone"
		href="/admin/anggota?status=alumni"
	/>
	<StatCard
		label="Ditolak"
		value={data.statistik.ditolak}
		icon={UserX}
		tone="red"
		href="/admin/anggota?status=ditolak"
	/>
</div>

<!-- Pencarian & filter -->
<div class="card mb-6 p-4">
	<form method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-end">
		{#if data.jk}<input type="hidden" name="jk" value={data.jk} />{/if}
		<div class="flex-1">
			<label class="label" for="f-q">Cari nama / NIS</label>
			<div class="relative">
				<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
				<input
					id="f-q"
					name="q"
					class="input pl-10"
					placeholder="mis. Ahmad atau 2025001"
					value={data.q}
				/>
			</div>
		</div>
		<div class="sm:w-48">
			<label class="label" for="f-status">Status</label>
			<select id="f-status" name="status" class="input">
				{#each opsiStatus as o (o.nilai)}
					<option value={o.nilai} selected={data.status === o.nilai}>{o.label}</option>
				{/each}
			</select>
		</div>
		<button class="btn btn-primary" type="submit">Terapkan</button>
		<a href="/admin/anggota" class="btn btn-ghost">Reset</a>
	</form>
	<div class="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
		<span class="text-xs font-bold tracking-wide text-stone-400 uppercase">Jenis kelamin</span>
		{#each chipJk as c (c.nilai)}
			<a
				href={hrefFilter(c.nilai)}
				class="btn btn-sm {data.jk === c.nilai || (!data.jk && !c.nilai)
					? 'btn-primary'
					: 'btn-outline'}"
			>
				{c.label}
			</a>
		{/each}
	</div>
</div>

{#if data.anggota.length === 0}
	<EmptyState
		icon={Users}
		title="Belum ada data anggota"
		desc="Belum ada anggota yang cocok dengan filter ini. Pendaftaran baru dari halaman publik akan tampil di sini untuk diverifikasi."
	/>
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[880px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">No. Reg / NIS</th>
					<th class="th">Nama</th>
					<th class="th">Kelas · Jurusan</th>
					<th class="th">No. HP</th>
					<th class="th">Status</th>
					<th class="th">Tgl Daftar</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.anggota as a (a.id)}
					<tr class="hover:bg-stone-50">
						<td class="td">
							{#if a.no_reg}
								<p class="font-mono text-xs font-bold text-stone-800">{a.no_reg}</p>
							{:else}
								<p class="text-xs text-stone-400 italic">belum ada</p>
							{/if}
							<p class="text-xs text-stone-500">NIS {a.nis ?? '—'}</p>
						</td>
						<td class="td">
							<div class="flex items-center gap-2">
								<span class="font-semibold text-stone-900">{a.nama}</span>
								<span class="badge {a.jenis_kelamin === 'L' ? 'badge-green' : 'badge-red'}">
									{a.jenis_kelamin === 'L' ? 'Putra' : 'Putri'}
								</span>
							</div>
						</td>
						<td class="td text-xs">{a.kelas ?? '—'} · {a.jurusan ?? '—'}</td>
						<td class="td text-xs">{a.no_hp ?? '—'}</td>
						<td class="td">
							<span class="badge badge-{toneStatusMember(a.status)}"
								>{LABEL_STATUS_MEMBER[a.status] ?? a.status}</span
							>
						</td>
						<td class="td text-xs">{fmtTanggalPendek(a.created_at)}</td>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								{#if a.status === 'pending'}
									<form method="POST" action="?/setujui&id={a.id}">
										<button class="btn btn-primary btn-sm" type="submit">
											<UserCheck class="h-3.5 w-3.5" /> Setujui
										</button>
									</form>
									<form
										method="POST"
										action="?/tolak&id={a.id}"
										onsubmit={(e) => {
											if (!confirm(`Tolak pendaftaran ${a.nama}?`)) e.preventDefault();
										}}
									>
										<button class="btn btn-danger btn-sm" type="submit">
											<UserX class="h-3.5 w-3.5" /> Tolak
										</button>
									</form>
								{:else if a.status === 'aktif'}
									<a
										href="/kartu/{encodeURIComponent(a.no_reg ?? '')}"
										class="btn btn-outline btn-sm"
										target="_blank"
										rel="noopener"
									>
										<IdCard class="h-3.5 w-3.5" /> Kartu
									</a>
									<form
										method="POST"
										action="?/alumni&id={a.id}"
										onsubmit={(e) => {
											if (!confirm(`Jadikan ${a.nama} sebagai alumni?`)) e.preventDefault();
										}}
									>
										<button class="btn btn-outline btn-sm" type="submit">
											<GraduationCap class="h-3.5 w-3.5" /> Alumni
										</button>
									</form>
								{:else if a.status === 'alumni'}
									<form method="POST" action="?/aktifkan&id={a.id}">
										<button class="btn btn-outline btn-sm" type="submit">
											<UserCheck class="h-3.5 w-3.5" /> Aktifkan
										</button>
									</form>
								{/if}
								<form
									method="POST"
									action="?/hapus&id={a.id}"
									onsubmit={(e) => {
										if (!confirm(`Hapus data ${a.nama} secara permanen?`)) e.preventDefault();
									}}
								>
									<button class="btn btn-danger btn-sm" aria-label="Hapus {a.nama}">
										<Trash2 class="h-3.5 w-3.5" />
									</button>
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
