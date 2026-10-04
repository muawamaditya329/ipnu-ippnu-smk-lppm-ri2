<script lang="ts">
	import {
		CalendarDays,
		Camera,
		Check,
		Clock,
		ListChecks,
		MapPin,
		Newspaper,
		Target,
		Users,
		UsersRound
	} from '@lucide/svelte';
	import BeritaCard from '#lib/components/BeritaCard.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { LABEL_JENIS_AGENDA, pecahTanggal } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const settings = $derived(data.settings);
	const misiPoin = $derived(
		(settings.misi ?? '')
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean)
	);

	// Warna badge per jenis agenda (sama dengan halaman /agenda).
	const badgeJenis: Record<string, string> = {
		rutin: 'badge-green',
		kajian: 'badge-green',
		rapat: 'badge-blue',
		lomba: 'badge-amber',
		kegiatan: 'badge-gray'
	};
</script>

<svelte:head>
	<title>Beranda — IPNU & IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={settings.deskripsi} />
</svelte:head>

<!-- 1. Hero -->
<section
	class="pattern-islamic bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 py-20 text-white lg:py-28"
>
	<div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
		<p
			class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-100"
		>
			Pimpinan Komisariat · {settings.periode}
		</p>
		<h1 class="mt-6 font-display text-4xl leading-tight font-extrabold sm:text-5xl lg:text-6xl">
			IPNU & IPPNU
			<span class="block text-gold-300">SMK LPPM RI 2 Kedungreja</span>
		</h1>
		<p class="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">
			{settings.deskripsi}
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a href="/daftar" class="btn btn-gold btn-lg">Daftar Anggota</a>
			<a
				href="/agenda"
				class="btn btn-lg border border-white/40 bg-white/10 text-white hover:bg-white/20"
			>
				Lihat Agenda Kegiatan
			</a>
		</div>
	</div>
</section>

<!-- 2. Statistik -->
<section class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
	{#snippet kartuStat(Ikon: typeof Users, label: string, nilai: number, tone: string)}
		<div class="card flex flex-col items-center p-6 text-center">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl {tone}">
				<Ikon class="h-5 w-5" />
			</div>
			<p class="mt-3 font-display text-3xl font-extrabold text-primary-700">{nilai}</p>
			<p class="mt-1 text-sm font-medium text-stone-500">{label}</p>
		</div>
	{/snippet}

	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
		{@render kartuStat(Users, 'Anggota Aktif', data.statistik.aktif, 'bg-primary-100 text-primary-700')}
		{@render kartuStat(Users, 'Putra IPNU', data.statistik.putra, 'bg-primary-100 text-primary-700')}
		{@render kartuStat(UsersRound, 'Putri IPPNU', data.statistik.putri, 'bg-accent-100 text-accent-700')}
		{@render kartuStat(CalendarDays, 'Kegiatan Tahun Ini', data.statistik.kegiatan, 'bg-gold-100 text-gold-700')}
	</div>
</section>

<!-- 3. Dua organisasi -->
<section class="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
	<SectionHeading
		center
		eyebrow="Profil"
		title="Dua Organisasi, Satu Semangat"
		desc="Satu komisariat menaungi dua organisasi pelajar Nahdlatul Ulama — IPNU untuk pelajar putra dan IPPNU untuk pelajar putri, berjalan bersama dalam satu ikatan."
	/>

	<div class="mt-10 grid gap-6 lg:grid-cols-2">
		<!-- IPNU -->
		<article class="card flex flex-col border-t-4 border-primary-600 p-7">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
				>
					<Users class="h-6 w-6" />
				</div>
				<div>
					<h3 class="font-display text-xl font-extrabold text-stone-900">IPNU</h3>
					<p class="text-xs font-bold tracking-wide text-primary-700 uppercase">
						Ikatan Pelajar Nahdlatul Ulama
					</p>
				</div>
			</div>
			<p class="mt-4 text-sm leading-relaxed text-stone-600">
				Wadah pembinaan pelajar putra SMK LPPM RI 2 Kedungreja — menumbuhkan semangat keagamaan,
				kedisiplinan, dan kepedulian sosial berlandaskan ahlussunnah wal jamaah.
			</p>
			<ul class="mt-5 space-y-2.5 text-sm text-stone-700">
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-primary-600" /> Kajian kitab & keagamaan rutin
				</li>
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-primary-600" /> Olahraga & kepramukaan
				</li>
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-primary-600" /> Kaderisasi & kepemimpinan
				</li>
			</ul>
			<a
				href="/tentang"
				class="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary-700 transition hover:text-primary-800"
			>
				Selengkapnya <span aria-hidden="true">→</span>
			</a>
		</article>

		<!-- IPPNU -->
		<article class="card flex flex-col border-t-4 border-accent-600 p-7">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700"
				>
					<UsersRound class="h-6 w-6" />
				</div>
				<div>
					<h3 class="font-display text-xl font-extrabold text-stone-900">IPPNU</h3>
					<p class="text-xs font-bold tracking-wide text-accent-700 uppercase">
						Ikatan Pelajar Putri Nahdlatul Ulama
					</p>
				</div>
			</div>
			<p class="mt-4 text-sm leading-relaxed text-stone-600">
				Wadah pembinaan pelajar putri SMK LPPM RI 2 Kedungreja — mengembangkan potensi putri pelajar
				melalui kegiatan keagamaan, keterampilan, dan kemandirian yang berwawasan NU.
			</p>
			<ul class="mt-5 space-y-2.5 text-sm text-stone-700">
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-accent-600" /> Kajian kitab & keagamaan rutin
				</li>
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-accent-600" /> Olahraga & kepramukaan
				</li>
				<li class="flex items-center gap-2">
					<Check class="h-4 w-4 shrink-0 text-accent-600" /> Kaderisasi & kepemimpinan
				</li>
			</ul>
			<a
				href="/tentang"
				class="mt-6 inline-flex items-center gap-1 text-sm font-bold text-accent-700 transition hover:text-accent-800"
			>
				Selengkapnya <span aria-hidden="true">→</span>
			</a>
		</article>
	</div>
</section>

<!-- 4. Visi & misi -->
<section class="pattern-islamic-dark bg-primary-50 py-16">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			center
			eyebrow="Arah Organisasi"
			title="Visi & Misi"
			desc="Bekal iman, ilmu, dan akhlakul karimah bagi seluruh pelajar komisariat."
		/>

		<div class="mt-10 grid gap-6 lg:grid-cols-2">
			<div class="card p-7 sm:p-8">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
					>
						<Target class="h-5 w-5" />
					</div>
					<h3 class="font-display text-xl font-extrabold text-stone-900">Visi</h3>
				</div>
				<blockquote
					class="mt-5 border-l-4 border-gold-400 pl-4 font-display text-lg leading-relaxed text-stone-700 italic"
				>
					“{settings.visi}”
				</blockquote>
			</div>

			<div class="card p-7 sm:p-8">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700"
					>
						<ListChecks class="h-5 w-5" />
					</div>
					<h3 class="font-display text-xl font-extrabold text-stone-900">Misi</h3>
				</div>
				<ol class="mt-5 space-y-3">
					{#each misiPoin as m, i (i)}
						<li class="flex items-start gap-3 text-sm leading-relaxed text-stone-700">
							<span class="badge mt-0.5 shrink-0 bg-primary-100 text-primary-800">{i + 1}</span>
							<span>{m}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</section>

<!-- 5. Agenda terdekat -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<SectionHeading
			eyebrow="Jadwal"
			title="Agenda Terdekat"
			desc="Kegiatan komisariat yang akan berlangsung dalam waktu dekat."
		/>
		<a href="/agenda" class="btn btn-outline shrink-0 self-start sm:self-auto">Lihat semua</a>
	</div>

	{#if data.agendaMendatang.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={CalendarDays}
				title="Belum ada agenda terdekat"
				desc="Jadwal kegiatan yang akan datang akan tampil di sini begitu pengurus menerbitkannya."
			/>
		</div>
	{:else}
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.agendaMendatang as item (item.id)}
				{@const tg = pecahTanggal(item.tanggal)}
				<article class="card flex flex-col p-5">
					<div class="flex items-start justify-between gap-2">
						<div class="rounded-xl bg-primary-50 px-3 py-2 text-center">
							<span class="font-display block text-2xl leading-none font-extrabold text-primary-800">
								{tg.d}
							</span>
							<span
								class="mt-1 block text-[11px] font-bold tracking-widest text-primary-700 uppercase"
							>
								{tg.m}
							</span>
						</div>
						<span class="badge {badgeJenis[item.jenis] ?? 'badge-gray'}">
							{LABEL_JENIS_AGENDA[item.jenis] ?? item.jenis}
						</span>
					</div>
					<h3 class="mt-3 font-display text-base leading-snug font-bold text-stone-900">
						{item.judul}
					</h3>
					<div class="mt-auto space-y-1.5 pt-3 text-xs text-stone-500">
						{#if item.jam}
							<p class="flex items-center gap-1.5">
								<Clock class="h-3.5 w-3.5 text-stone-400" /> {item.jam} WIB
							</p>
						{/if}
						{#if item.lokasi}
							<p class="flex items-center gap-1.5">
								<MapPin class="h-3.5 w-3.5 text-stone-400" /> {item.lokasi}
							</p>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<!-- 6. Berita terbaru -->
<section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<SectionHeading
			eyebrow="Informasi"
			title="Berita Terbaru"
			desc="Kabar, pengumuman, dan tulisan terbaru dari komisariat."
		/>
		<a href="/berita" class="btn btn-outline shrink-0 self-start sm:self-auto">Semua berita</a>
	</div>

	{#if data.beritaTerbaru.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Newspaper}
				title="Belum ada berita"
				desc="Berita dan pengumuman akan tayang di sini setelah diterbitkan oleh pengurus."
			/>
		</div>
	{:else}
		<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.beritaTerbaru as post (post.id)}
				<BeritaCard {post} />
			{/each}
		</div>
	{/if}
</section>

<!-- 7. Galeri teaser -->
<section class="pattern-islamic-dark bg-primary-50 py-16">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<SectionHeading
				eyebrow="Dokumentasi"
				title="Galeri Kegiatan"
				desc="Jejak langkah organisasi yang terekam dalam gambar."
			/>
			<a href="/galeri" class="btn btn-outline shrink-0 self-start sm:self-auto">Lihat galeri</a>
		</div>

		{#if data.fotoGaleri.length === 0}
			<div class="mt-8">
				<EmptyState
					icon={Camera}
					title="Belum ada foto"
					desc="Foto kegiatan akan tampil di sini setelah album dokumentasi diisi pengurus."
				/>
			</div>
		{:else}
			<div class="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
				{#each data.fotoGaleri as foto (foto.id)}
					<a
						href="/galeri/{foto.album_id}"
						class="group block aspect-square overflow-hidden rounded-xl bg-stone-200"
						aria-label={foto.caption ?? `Album ${foto.album_judul}`}
					>
						<img
							src="/uploads/{foto.file}"
							alt={foto.caption ?? foto.album_judul}
							loading="lazy"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-110"
						/>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- 8. CTA -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
	<div class="pattern-islamic rounded-3xl bg-primary-950 p-10 text-center text-white">
		<h2 class="font-display text-3xl font-extrabold sm:text-4xl">Siap Bergabung?</h2>
		<p class="mx-auto mt-3 max-w-2xl leading-relaxed text-primary-100">
			Buktikan dirimu menjadi pelajar yang beriman, berilmu, berakhlakul karimah, dan berprestasi
			bersama IPNU & IPPNU SMK LPPM RI 2 Kedungreja.
		</p>
		<a href="/daftar" class="btn btn-gold btn-lg mt-8">Daftar Sekarang</a>
		<p class="mt-4 text-sm text-primary-200">Gratis untuk seluruh pelajar SMK LPPM RI 2.</p>
	</div>
</section>
