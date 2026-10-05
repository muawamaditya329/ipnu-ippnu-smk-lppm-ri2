<script lang="ts">
	import { CalendarDays, ChevronRight, Clock, IdCard, MapPin, Newspaper } from '@lucide/svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import {
		inisial,
		fmtTanggal,
		fmtTanggalPendek,
		pecahTanggal,
		LABEL_JENIS_AGENDA,
		LABEL_KATEGORI_BERITA,
		LABEL_CAKUPAN,
		LABEL_STATUS_MEMBER,
		toneStatusMember
	} from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const organisasi = $derived(data.profil.jenis_kelamin === 'P' ? 'IPPNU' : 'IPNU');
	const inisialNama = $derived(inisial(data.profil.nama));
</script>

<svelte:head>
	<title>Dasbor Anggota — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<p class="kicker">Area Anggota</p>
<h1 class="mt-1.5 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
	Assalamu'alaikum, {data.profil.nama.split(' ')[0]}
</h1>
<p class="mt-1 text-sm text-stone-500">
	Ringkasan keanggotaan dan kegiatan {organisasi} komisariat untukmu.
</p>

<!-- Kartu profil besar -->
<section class="card mt-6" aria-label="Profil keanggotaan">
	<div class="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
		<!-- Avatar: foto bila ada, selain itu inisial nama -->
		{#if data.profil.foto}
			<img
				src="/uploads/{data.profil.foto}"
				alt="Foto {data.profil.nama}"
				class="h-20 w-20 shrink-0 rounded-full border border-stone-200 object-cover"
			/>
		{:else}
			<div
				class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full {data.profil
					.jenis_kelamin === 'P'
					? 'bg-accent-800'
					: 'bg-primary-800'} ring-2 ring-gold-400/70 ring-offset-2 ring-offset-white"
				aria-hidden="true"
			>
				<span class="font-display text-2xl font-bold text-white">{inisialNama}</span>
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
				<h2 class="font-display text-xl font-bold text-stone-900 sm:text-2xl">
					{data.profil.nama}
				</h2>
				<Badge tone={toneStatusMember(data.profil.status)}>
					{LABEL_STATUS_MEMBER[data.profil.status] ?? data.profil.status}
				</Badge>
			</div>
			{#if data.profil.no_reg}
				<p class="mt-1 font-mono text-sm font-semibold text-stone-600">{data.profil.no_reg}</p>
			{/if}

			<dl class="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">NIS</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">{data.profil.nis ?? '-'}</dd>
				</div>
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">
						Kelas / Jurusan
					</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">
						{data.profil.kelas ?? '-'}{data.profil.jurusan ? ` — ${data.profil.jurusan}` : ''}
					</dd>
				</div>
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">
						Tanggal Lahir
					</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">
						{fmtTanggal(data.profil.tanggal_lahir)}
					</dd>
				</div>
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">Keanggotaan</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">
						{organisasi} · Komisariat SMK LPPM RI 2
					</dd>
				</div>
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">No. HP</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">{data.profil.no_hp || '-'}</dd>
				</div>
				<div>
					<dt class="text-xs font-semibold tracking-wide text-stone-500 uppercase">Alamat</dt>
					<dd class="mt-0.5 font-semibold text-stone-800">{data.profil.alamat || '-'}</dd>
				</div>
			</dl>

			<p class="mt-4 text-xs text-stone-400">
				No. HP dan alamat bisa diperbarui sendiri di
				<a href="/anggota/profil" class="font-semibold text-primary-700 hover:underline"
					>Profil Saya</a
				>.
			</p>
		</div>

		<!-- Aksi kartu anggota -->
		<div class="w-full shrink-0 sm:w-56">
			{#if data.tautanKartu}
				<a href={data.tautanKartu} class="btn btn-primary btn-lg w-full">
					<IdCard class="h-5 w-5" />
					Kartu Anggota
				</a>
				<p class="mt-2 text-center text-xs text-stone-500">
					Kartu digital ber-QR — tampilkan saat kegiatan.
				</p>
			{:else}
				<p
					class="rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500"
				>
					Kartu tersedia bagi anggota aktif yang sudah diberi nomor registrasi.
				</p>
			{/if}
		</div>
	</div>
</section>

<!-- Agenda & kabar: dua kolom tak sama, bukan grid kartu identik -->
<div class="mt-8 grid gap-6 lg:grid-cols-12">
	<!-- Agenda untukmu -->
	<section class="card p-6 lg:col-span-7" aria-label="Agenda untukmu">
		<div class="flex items-center justify-between gap-3">
			<h2 class="font-display text-lg font-bold text-stone-900">Agenda Untukmu</h2>
			<a
				href="/agenda"
				class="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-700 hover:underline"
			>
				Semua agenda <ChevronRight class="h-3.5 w-3.5" />
			</a>
		</div>

		{#if data.agenda.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={CalendarDays}
					title="Belum ada agenda mendatang"
					desc="Jadwal kegiatan berikutnya akan muncul di sini begitu pengurus memuatnya."
				/>
			</div>
		{:else}
			<ul class="mt-4 divide-y divide-stone-100">
				{#each data.agenda as a (a.id)}
					<li class="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
						<!-- Penanda tanggal: blok kotak bergaris atas sesuai cakupan -->
						<div
							class="flex w-12 shrink-0 flex-col items-center border border-t-2 border-stone-200 bg-white py-1.5 {a
								.cakupan === 'ippnu'
								? 'border-t-accent-700'
								: a.cakupan === 'ipnu'
									? 'border-t-primary-800'
									: 'border-t-stone-400'}"
							aria-hidden="true"
						>
							<span class="font-display text-lg leading-none font-bold text-stone-900">
								{pecahTanggal(a.tanggal).d}
							</span>
							<span class="mt-0.5 text-[10px] font-bold tracking-wide text-primary-700 uppercase">
								{pecahTanggal(a.tanggal).m}
							</span>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate font-semibold text-stone-900" title={a.judul}>{a.judul}</p>
							<p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
								<span class="inline-flex items-center gap-1">
									<Clock class="h-3.5 w-3.5" />
									{fmtTanggalPendek(a.tanggal)}{a.jam ? `, ${a.jam.slice(0, 5)}` : ''}
								</span>
								{#if a.lokasi}
									<span class="inline-flex items-center gap-1">
										<MapPin class="h-3.5 w-3.5" />
										{a.lokasi}
									</span>
								{/if}
							</p>
						</div>
						<div class="flex shrink-0 flex-col items-end gap-1.5">
							<Badge tone="gray">{LABEL_JENIS_AGENDA[a.jenis] ?? a.jenis}</Badge>
							<span
								class="text-[10px] font-bold tracking-wide uppercase {a.cakupan === 'ippnu'
									? 'text-accent-700'
									: a.cakupan === 'ipnu'
										? 'text-primary-700'
										: 'text-stone-400'}"
							>
								{LABEL_CAKUPAN[a.cakupan] ?? a.cakupan}
							</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Kabar terbaru -->
	<section class="card p-6 lg:col-span-5" aria-label="Kabar terbaru">
		<div class="flex items-center justify-between gap-3">
			<h2 class="font-display text-lg font-bold text-stone-900">Kabar Terbaru</h2>
			<a
				href="/berita"
				class="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-700 hover:underline"
			>
				Semua kabar <ChevronRight class="h-3.5 w-3.5" />
			</a>
		</div>

		{#if data.berita.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Newspaper}
					title="Belum ada kabar"
					desc="Berita terbit untuk cakupanmu akan tampil di sini."
				/>
			</div>
		{:else}
			<ul class="mt-4 divide-y divide-stone-100">
				{#each data.berita as b (b.id)}
					<li class="py-3.5 first:pt-0 last:pb-0">
						<a
							href="/berita/{b.slug}"
							class="group block font-semibold text-stone-900 hover:text-primary-800"
						>
							{b.judul}
						</a>
						<p class="mt-1 text-xs text-stone-500">
							{LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori} ·
							{fmtTanggalPendek(b.published_at ?? b.created_at)}
							{#if b.cakupan !== 'umum'}
								· <span
									class="font-bold uppercase {b.cakupan === 'ippnu'
										? 'text-accent-700'
										: 'text-primary-700'}">{LABEL_CAKUPAN[b.cakupan] ?? b.cakupan}</span
								>
							{/if}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
