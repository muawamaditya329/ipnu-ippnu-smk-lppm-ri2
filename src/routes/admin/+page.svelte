<script lang="ts">
	import {
		CalendarDays,
		CalendarPlus,
		Newspaper,
		Plus,
		TrendingUp,
		UserPlus,
		Users,
		UsersRound,
		Wallet
	} from '@lucide/svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import {
		fmtRp,
		fmtTanggal,
		fmtTanggalPendek,
		fmtWaktu,
		hariIni,
		pecahTanggal
	} from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Dasbor — Admin</title></svelte:head>

<!-- Sapaan -->
<div class="mb-8">
	<h1 class="font-display text-2xl font-extrabold text-stone-900">
		Assalamu'alaikum, {data.user.nama.split(' ')[0]}
	</h1>
	<p class="mt-1 text-sm text-stone-500">
		{data.namaOrganisasi} &middot; {fmtTanggalPendek(hariIni())}
	</p>
</div>

<!-- Ringkasan -->
<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<StatCard
		label="Anggota Aktif"
		value={data.anggotaAktif}
		icon={Users}
		tone="green"
		href="/admin/anggota"
	/>
	<StatCard
		label="Menunggu Verifikasi"
		value={data.menunggu}
		icon={UserPlus}
		tone="amber"
		hint={data.menunggu > 0 ? 'Perlu ditindak' : ''}
		href="/admin/anggota?status=pending"
	/>
	<StatCard
		label="Saldo Kas"
		value={fmtRp(data.saldo)}
		icon={Wallet}
		tone="amber"
		href="/admin/kas"
	/>
	<StatCard
		label="Berita Terbit"
		value={data.beritaTerbit}
		icon={Newspaper}
		tone="blue"
		href="/admin/berita"
	/>
</div>

<!-- CTA cepat -->
<div class="mb-8 flex flex-wrap gap-3">
	<a href="/admin/berita/baru" class="btn btn-primary"><Plus class="h-4 w-4" /> Tulis Berita</a>
	<a href="/admin/agenda" class="btn btn-outline"><CalendarPlus class="h-4 w-4" /> Tambah Agenda</a>
	<a href="/admin/kas" class="btn btn-outline"><TrendingUp class="h-4 w-4" /> Catat Kas</a>
</div>

<!-- Panel ringkasan -->
<div class="grid gap-6 lg:grid-cols-2">
	<!-- Pendaftar Terbaru -->
	<section class="card p-5">
		<div class="mb-4 flex items-center justify-between gap-3">
			<h2 class="font-display text-base font-bold text-stone-900">Pendaftar Terbaru</h2>
			<a
				href="/admin/anggota?status=pending"
				class="text-sm font-semibold text-primary-700 hover:text-primary-800">Kelola &rarr;</a
			>
		</div>
		{#if data.pendaftar.length === 0}
			<div
				class="flex flex-col items-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center"
			>
				<UsersRound class="h-6 w-6 text-stone-300" />
				<p class="mt-2 text-sm font-medium text-stone-500">
					Belum ada pendaftar yang menunggu verifikasi.
				</p>
			</div>
		{:else}
			<ul class="divide-y divide-stone-100">
				{#each data.pendaftar as p (p.id)}
					<li class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-stone-900">{p.nama}</p>
							<p class="text-xs text-stone-500">
								{p.kelas ?? '—'}
								{p.jurusan ?? '—'} &middot; {fmtWaktu(p.created_at)}
							</p>
						</div>
						<span class="badge shrink-0 {p.jenis_kelamin === 'L' ? 'badge-green' : 'badge-red'}">
							{p.jenis_kelamin === 'L' ? 'IPNU' : 'IPPNU'}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Agenda Terdekat -->
	<section class="card p-5">
		<div class="mb-4 flex items-center justify-between gap-3">
			<h2 class="font-display text-base font-bold text-stone-900">Agenda Terdekat</h2>
			<a href="/admin/agenda" class="text-sm font-semibold text-primary-700 hover:text-primary-800"
				>Kelola &rarr;</a
			>
		</div>
		{#if data.agenda.length === 0}
			<div
				class="flex flex-col items-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center"
			>
				<CalendarDays class="h-6 w-6 text-stone-300" />
				<p class="mt-2 text-sm font-medium text-stone-500">Belum ada agenda terjadwal ke depan.</p>
			</div>
		{:else}
			<ul class="space-y-3">
				{#each data.agenda as a (a.id)}
					{@const t = pecahTanggal(a.tanggal)}
					<li class="flex items-center gap-3">
						<div
							class="aksen-ipnu flex w-11 shrink-0 flex-col items-center justify-center border border-stone-200 py-1.5 leading-none"
						>
							<span class="font-display text-base font-bold text-stone-900">{t.d}</span>
							<span class="mt-0.5 text-[9px] font-semibold tracking-wide text-stone-500 uppercase"
								>{t.m}</span
							>
						</div>
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-stone-900">{a.judul}</p>
							<p class="flex items-center gap-1 text-xs text-stone-500">
								{fmtTanggal(a.tanggal)} &middot; {a.lokasi ?? 'Lokasi belum ditentukan'}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Kas Terbaru -->
	<section class="card p-5">
		<div class="mb-4 flex items-center justify-between gap-3">
			<h2 class="font-display text-base font-bold text-stone-900">Kas Terbaru</h2>
			<a href="/admin/kas" class="text-sm font-semibold text-primary-700 hover:text-primary-800"
				>Kelola &rarr;</a
			>
		</div>
		{#if data.kas.length === 0}
			<div
				class="flex flex-col items-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center"
			>
				<Wallet class="h-6 w-6 text-stone-300" />
				<p class="mt-2 text-sm font-medium text-stone-500">Belum ada transaksi kas tercatat.</p>
			</div>
		{:else}
			<ul class="divide-y divide-stone-100">
				{#each data.kas as k (k.id)}
					<li class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-stone-900">{k.keterangan}</p>
							<p class="text-xs text-stone-500">{fmtTanggal(k.tanggal)}</p>
						</div>
						<span
							class="shrink-0 text-sm font-bold {k.jenis === 'masuk'
								? 'text-primary-700'
								: 'text-accent-700'}"
						>
							{k.jenis === 'masuk' ? '+' : '-'}{fmtRp(k.jumlah)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
