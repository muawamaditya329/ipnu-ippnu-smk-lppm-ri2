<script lang="ts">
	import { CalendarDays, Clock, MapPin, Newspaper, Camera, Eye } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import {
		LABEL_CAKUPAN,
		LABEL_JENIS_AGENDA,
		LABEL_KATEGORI_BERITA,
		fmtTanggalPendek,
		pecahTanggal
	} from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const settings = $derived(data.settings);
	const misiPoin = $derived(
		(settings.misi ?? '')
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean)
	);

	// Berita: 1 unggulan (kolom 8) + daftar pendamping (kolom 4).
	const beritaUnggulan = $derived(data.beritaTerbaru[0] ?? null);
	const beritaLainnya = $derived(data.beritaTerbaru.slice(1));

	// Strip galeri: foto pertama tampil besar, sisanya pendamping.
	const fotoUtama = $derived(data.fotoGaleri[0] ?? null);
	const fotoLainnya = $derived(data.fotoGaleri.slice(1));

	// Warna badge per jenis agenda (sama dengan halaman /agenda).
	const badgeJenis: Record<string, string> = {
		rutin: 'badge-green',
		kajian: 'badge-green',
		rapat: 'badge-blue',
		lomba: 'badge-amber',
		kegiatan: 'badge-gray'
	};

	// Garis atas blok tanggal mengikuti cakupan kegiatan — IPNU hijau, IPPNU merah.
	const garisCakupan: Record<string, string> = {
		ipnu: 'border-t-primary-800',
		ippnu: 'border-t-accent-700',
		umum: 'border-t-stone-400'
	};

	const badgeCakupan: Record<string, string> = { ipnu: 'badge-green', ippnu: 'badge-red' };

	// Strip statistik: angka besar + label uppercase, pemisah garis 1px (tanpa kartu).
	const stripStatistik = $derived([
		{ n: data.statistik.aktif, label: 'Anggota Aktif', tick: 'bg-stone-900' },
		{ n: data.statistik.putra, label: 'Putra IPNU', tick: 'bg-primary-800' },
		{ n: data.statistik.putri, label: 'Putri IPPNU', tick: 'bg-accent-700' },
		{ n: data.statistik.kegiatan, label: 'Kegiatan Tahun Ini', tick: 'bg-gold-500' }
	]);
</script>

<svelte:head>
	<title>Beranda — IPNU &amp; IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={settings.deskripsi} />
</svelte:head>

<!-- 1. Hero: satu-satunya blok hijau tinta penuh di halaman ini, pola islami + garis emas.
	Komposisi asimetris rata kiri — bukan teks terpusat di atas pola. -->
<section class="pattern-islamic border-b-2 border-gold-500 bg-primary-950">
	<div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-20">
		<div class="lg:col-span-8">
			<p class="text-[11px] font-semibold tracking-[0.14em] text-gold-300 uppercase">
				Pimpinan Komisariat · Periode {settings.periode}
			</p>
			<h1
				class="mt-5 font-display text-[2.9rem] leading-[1.02] font-bold tracking-tight text-white sm:text-6xl lg:text-[4.6rem]"
			>
				IPNU <span class="text-gold-300">&amp;</span> IPPNU
				<span
					class="mt-3 block font-display text-[1.65rem] leading-[1.1] font-semibold text-primary-100 sm:text-3xl lg:text-4xl"
				>
					SMK LPPM RI 2 Kedungreja
				</span>
			</h1>
			<p class="mt-6 max-w-xl text-base leading-relaxed text-primary-100 sm:text-lg">
				Organisasi pelajar Nahdlatul Ulama di lingkungan SMK LPPM RI 2 Kedungreja, Kecamatan
				Kedungreja, Kabupaten Cilacap. Kegiatan berjalan tiap pekan — kajian kitab di masjid
				sekolah, Jumat Berbagi, lomba Muharraman antar kelas, LDK, hingga santunan anak yatim
				keliling dusun.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<a href="/daftar" class="btn btn-gold btn-lg">Daftar Anggota</a>
				<a
					href="/agenda"
					class="btn btn-lg border border-white/30 text-white hover:border-white hover:bg-white/10"
				>
					Lihat Agenda Kegiatan
				</a>
			</div>
		</div>

		<!-- Lembar identitas komisariat: data arsip bergaris emas kiri -->
		<aside class="border-l-2 border-gold-500 bg-white/5 p-6 lg:col-span-4 lg:self-center">
			<p class="text-[11px] font-semibold tracking-[0.14em] text-gold-300 uppercase">
				Data Komisariat
			</p>
			<dl class="mt-4 divide-y divide-white/10 text-sm">
				<div class="flex items-baseline justify-between gap-4 py-2.5">
					<dt class="shrink-0 text-primary-300">Sekolah</dt>
					<dd class="text-right font-medium text-white">SMK LPPM RI 2 Kedungreja</dd>
				</div>
				<div class="flex items-baseline justify-between gap-4 py-2.5">
					<dt class="shrink-0 text-primary-300">Wilayah</dt>
					<dd class="text-right font-medium text-white">Kedungreja, Kab. Cilacap</dd>
				</div>
				<div class="flex items-baseline justify-between gap-4 py-2.5">
					<dt class="shrink-0 text-primary-300">Periode</dt>
					<dd class="text-right font-medium text-white">{settings.periode}</dd>
				</div>
				<div class="flex items-baseline justify-between gap-4 py-2.5">
					<dt class="shrink-0 text-primary-300">Sekretariat</dt>
					<dd class="text-right font-medium text-white">{settings.alamat}</dd>
				</div>
			</dl>
			<a
				href="/laporan-kas"
				class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 hover:text-gold-200"
			>
				Laporan kas terbuka <span aria-hidden="true">→</span>
			</a>
		</aside>
	</div>
</section>

<!-- 2. Strip statistik: baris horizontal bergaris 1px, angka Fraunces besar + label uppercase. -->
<section class="border-b border-stone-200 bg-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<dl
			class="grid grid-cols-2 gap-y-10 py-10 sm:py-12 lg:grid-cols-4 lg:divide-x lg:divide-stone-200"
		>
			{#each stripStatistik as s (s.label)}
				<div class="lg:px-8 lg:first:pl-0">
					<dd class="font-display text-4xl leading-none font-bold text-stone-900 sm:text-5xl">
						{s.n}
					</dd>
					<dt
						class="mt-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-stone-500 uppercase"
					>
						<span class="h-0.5 w-4 {s.tick}" aria-hidden="true"></span>
						{s.label}
					</dt>
				</div>
			{/each}
		</dl>
	</div>
</section>

<!-- 3. Dua organisasi: dua kartu TIDAK identik — lebar 7/5, isi & ritme beda. -->
<section class="bg-stone-50">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
		<SectionHeading
			nomor="01"
			title="Dua Organisasi, Satu Komisariat"
			desc="Dua organisasi pelajar Nahdlatul Ulama berjalan paralel di SMK LPPM RI 2 — putra bernaung di IPNU, putri di IPPNU — dengan jadwal dan program masing-masing."
		/>

		<div class="mt-8 grid gap-5 lg:grid-cols-12 lg:gap-6">
			<!-- IPNU: putra, garis hijau — daftar bergaris emas -->
			<article class="card aksen-ipnu flex flex-col p-6 sm:p-7 lg:col-span-7">
				<div class="flex items-baseline justify-between gap-3">
					<h3 class="font-display text-2xl font-bold text-stone-900">IPNU</h3>
					<span class="badge badge-green shrink-0">Pelajar Putra</span>
				</div>
				<p class="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-primary-800 uppercase">
					Ikatan Pelajar Nahdlatul Ulama
				</p>
				<p class="mt-4 text-sm leading-relaxed text-stone-600">
					Menaungi {data.statistik.putra} pelajar putra aktif. Latihan rutin berupa kajian kitab bab akhlak
					tiap Jumat pekan kedua di masjid sekolah, regu kepramukaan, serta Jumat Berbagi di gerbang sekolah.
				</p>
				<ul class="mt-5 space-y-2.5 border-t border-stone-100 pt-4 text-sm text-stone-700">
					<li class="flex gap-2">
						<span class="text-gold-600" aria-hidden="true">—</span> Kajian Kitab Rutin — masjid sekolah,
						Jumat pekan kedua
					</li>
					<li class="flex gap-2">
						<span class="text-gold-600" aria-hidden="true">—</span> Kepramukaan &amp; olahraga — regu
						putra, lapangan sekolah
					</li>
					<li class="flex gap-2">
						<span class="text-gold-600" aria-hidden="true">—</span> Kaderisasi — LDK tahunan &amp; bincang
						vokasi bersama alumni
					</li>
				</ul>
				<a
					href="/tentang"
					class="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-800 hover:text-primary-950"
				>
					Profil IPNU <span aria-hidden="true">→</span>
				</a>
			</article>

			<!-- IPPNU: putri, garis merah — daftar bernomor + catatan prestasi -->
			<article class="card aksen-ippnu flex flex-col p-6 sm:p-7 lg:col-span-5">
				<div class="flex items-baseline justify-between gap-3">
					<h3 class="font-display text-2xl font-bold text-stone-900">IPPNU</h3>
					<span class="badge badge-red shrink-0">Pelajar Putri</span>
				</div>
				<p class="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-accent-800 uppercase">
					Ikatan Pelajar Putri Nahdlatul Ulama
				</p>
				<p class="mt-4 text-sm leading-relaxed text-stone-600">
					Menaungi {data.statistik.putri} pelajar putri aktif. Kajian fikih praktis bersama ustadzah pembina
					di aula sekolah, dilanjutkan pembinaan keterampilan dan kegiatan lomba.
				</p>
				<ol class="mt-5 space-y-2.5 border-t border-stone-100 pt-4 text-sm text-stone-700">
					<li class="flex items-start gap-3">
						<span class="rule-num shrink-0 pt-0.5">01</span>
						<span>Kajian Rutin IPPNU: Fikih Praktis — aula sekolah</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="rule-num shrink-0 pt-0.5">02</span>
						<span>Tim 4H &amp; cerdas cermat antar pelajar</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="rule-num shrink-0 pt-0.5">03</span>
						<span>Keterampilan &amp; kemandirian putri pelajar</span>
					</li>
				</ol>
				<p
					class="mt-5 border-l-2 border-gold-500 bg-stone-50 p-3 text-xs leading-relaxed text-stone-600"
				>
					Tim 4H dan cerdas cermat IPPNU membawa pulang juara umum Anoling tingkat Kabupaten
					Cilacap.
				</p>
				<a
					href="/tentang"
					class="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent-800 hover:text-accent-950"
				>
					Profil IPPNU <span aria-hidden="true">→</span>
				</a>
			</article>
		</div>
	</div>
</section>

<!-- 4. Visi & misi: lembar dokumen resmi komisariat -->
<section class="border-t border-stone-200 bg-white">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
		<SectionHeading
			nomor="02"
			title="Visi & Misi"
			desc="Dirumuskan pengurus periode {settings.periode} dan menjadi pegangan seluruh program kerja komisariat."
		/>

		<div class="mt-8 grid gap-5 lg:grid-cols-12 lg:gap-6">
			<div class="card aksen-kas p-6 sm:p-7 lg:col-span-5">
				<p class="kicker">Visi</p>
				<blockquote
					class="mt-4 font-display text-lg leading-relaxed text-stone-800 italic sm:text-xl"
				>
					“{settings.visi}”
				</blockquote>
			</div>

			<div class="card p-6 sm:p-7 lg:col-span-7">
				<p class="kicker">Misi</p>
				<ol class="mt-4 space-y-3">
					{#each misiPoin as m, i (i)}
						<li class="flex items-start gap-3 text-sm leading-relaxed text-stone-700">
							<span class="rule-num shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
							<span>{m}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</section>

<!-- 5. Agenda terdekat: daftar baris dengan blok tanggal kotak, urut tanggal -->
<section class="border-t border-stone-200 bg-stone-50">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<SectionHeading
				nomor="03"
				title="Agenda Terdekat"
				desc="Jadwal terdekat dari {data.statistik
					.kegiatan} kegiatan yang direncanakan komisariat tahun ini."
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
			<div class="mt-8 border-t border-stone-200">
				{#each data.agendaMendatang as item (item.id)}
					{@const tg = pecahTanggal(item.tanggal)}
					<article class="flex items-center gap-4 border-b border-stone-200 py-4 sm:gap-6">
						<!-- Blok tanggal kotak: garis atas mengikuti cakupan (IPNU/IPPNU/umum) -->
						<div
							class="w-14 shrink-0 border border-t-2 border-stone-300 bg-white py-2 text-center sm:w-16 {garisCakupan[
								item.cakupan
							] ?? 'border-t-stone-400'}"
						>
							<span class="block font-display text-2xl leading-none font-bold text-stone-900">
								{tg.d}
							</span>
							<span
								class="mt-1 block text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase"
							>
								{tg.m}
							</span>
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="font-display text-base leading-snug font-bold text-stone-900 sm:text-lg">
								{item.judul}
							</h3>
							<div
								class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-stone-500"
							>
								{#if item.jam}
									<span class="inline-flex items-center gap-1">
										<Clock class="h-3.5 w-3.5" />
										{item.jam} WIB
									</span>
								{/if}
								{#if item.lokasi}
									<span class="inline-flex items-center gap-1">
										<MapPin class="h-3.5 w-3.5" />
										{item.lokasi}
									</span>
								{/if}
							</div>
						</div>
						<span
							class="badge hidden shrink-0 {badgeJenis[item.jenis] ?? 'badge-gray'} sm:inline-flex"
						>
							{LABEL_JENIS_AGENDA[item.jenis] ?? item.jenis}
						</span>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- 6. Berita: 1 unggulan besar (8 kolom) + daftar pendamping (4 kolom) -->
<section class="border-t border-stone-200 bg-white">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<SectionHeading
				nomor="04"
				title="Berita Terbaru"
				desc="Kabar dan pengumuman resmi komisariat — {data.statistik.berita} tulisan telah terbit."
			/>
			<a href="/berita" class="btn btn-outline shrink-0 self-start sm:self-auto">Semua berita</a>
		</div>

		{#if !beritaUnggulan}
			<div class="mt-8">
				<EmptyState
					icon={Newspaper}
					title="Belum ada berita"
					desc="Berita dan pengumuman akan tayang di sini setelah diterbitkan oleh pengurus."
				/>
			</div>
		{:else}
			<div class="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-6">
				<!-- Unggulan: teks editorial besar -->
				<article class="lg:col-span-8">
					<a href="/berita/{beritaUnggulan.slug}" class="group block">
						{#if beritaUnggulan.cover}
							<div class="aspect-video overflow-hidden rounded-xl bg-stone-200">
								<img
									src="/uploads/{beritaUnggulan.cover}"
									alt={beritaUnggulan.judul}
									loading="lazy"
									class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
								/>
							</div>
						{/if}
						<div class="flex flex-wrap items-center gap-2 text-xs text-stone-500">
							<span class="badge">
								{LABEL_KATEGORI_BERITA[beritaUnggulan.kategori] ?? beritaUnggulan.kategori}
							</span>
							{#if beritaUnggulan.cakupan !== 'umum'}
								<span class="badge {badgeCakupan[beritaUnggulan.cakupan] ?? 'badge-gray'}">
									{LABEL_CAKUPAN[beritaUnggulan.cakupan] ?? beritaUnggulan.cakupan}
								</span>
							{/if}
							<span
								>{fmtTanggalPendek(beritaUnggulan.published_at ?? beritaUnggulan.created_at)}</span
							>
							<span aria-hidden="true">·</span>
							<span class="inline-flex items-center gap-1">
								<Eye class="h-3.5 w-3.5" />
								{beritaUnggulan.views} dibaca
							</span>
						</div>
						<h3
							class="mt-3 font-display text-2xl leading-tight font-bold tracking-tight text-stone-900 transition group-hover:text-primary-800 sm:text-3xl"
						>
							{beritaUnggulan.judul}
						</h3>
						{#if beritaUnggulan.ringkasan}
							<p class="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
								{beritaUnggulan.ringkasan}
							</p>
						{/if}
						<span
							class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-800 group-hover:text-primary-950"
						>
							Baca selengkapnya <span aria-hidden="true">→</span>
						</span>
					</a>
				</article>

				<!-- Daftar pendamping: papan pengumuman ringkas -->
				<div class="lg:col-span-4 lg:border-l lg:border-stone-200 lg:pl-8">
					<p class="kicker">Kabar lainnya</p>
					{#if beritaLainnya.length === 0}
						<p class="mt-4 text-sm text-stone-500">Belum ada tulisan lain.</p>
					{:else}
						<div class="mt-2 divide-y divide-stone-200 border-t border-stone-200">
							{#each beritaLainnya as post (post.id)}
								<a href="/berita/{post.slug}" class="group block py-4">
									<p class="text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase">
										{fmtTanggalPendek(post.published_at ?? post.created_at)}
										<span aria-hidden="true">·</span>
										{LABEL_KATEGORI_BERITA[post.kategori] ?? post.kategori}
									</p>
									<h4
										class="mt-1.5 font-display text-base leading-snug font-bold text-stone-900 transition group-hover:text-primary-800"
									>
										{post.judul}
									</h4>
								</a>
							{/each}
						</div>
					{/if}
					<a
						href="/berita"
						class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-800 hover:text-primary-950"
					>
						Arsip berita <span aria-hidden="true">→</span>
					</a>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- 7. Galeri: strip 5 foto — 1 besar + 4 pendamping -->
<section class="border-t border-stone-200 bg-stone-50">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<SectionHeading
				nomor="05"
				title="Galeri Kegiatan"
				desc="Dokumentasi kegiatan terbaru komisariat; album lengkap tersedia di halaman galeri."
			/>
			<a href="/galeri" class="btn btn-outline shrink-0 self-start sm:self-auto">Lihat galeri</a>
		</div>

		{#if !fotoUtama}
			<div class="mt-8">
				<EmptyState
					icon={Camera}
					title="Belum ada foto"
					desc="Foto kegiatan akan tampil di sini setelah album dokumentasi diisi pengurus."
				/>
			</div>
		{:else}
			<div class="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12">
				<!-- Foto utama: separuh lebar, tinggi dua baris -->
				<a
					href="/galeri/{fotoUtama.album_id}"
					class="group relative col-span-2 overflow-hidden rounded-xl bg-stone-200 lg:col-span-6 lg:row-span-2 lg:h-full"
					aria-label={fotoUtama.caption ?? `Album ${fotoUtama.album_judul}`}
				>
					<img
						src="/uploads/{fotoUtama.file}"
						alt={fotoUtama.caption ?? fotoUtama.album_judul}
						loading="lazy"
						class="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
					/>
					<span
						class="absolute inset-x-0 bottom-0 bg-stone-950/70 px-3 py-2 text-xs font-medium text-white"
					>
						{fotoUtama.caption ?? fotoUtama.album_judul}
					</span>
				</a>
				{#each fotoLainnya as foto (foto.id)}
					<a
						href="/galeri/{foto.album_id}"
						class="group relative aspect-square overflow-hidden rounded-xl bg-stone-200 lg:col-span-3"
						aria-label={foto.caption ?? `Album ${foto.album_judul}`}
					>
						<img
							src="/uploads/{foto.file}"
							alt={foto.caption ?? foto.album_judul}
							loading="lazy"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
						/>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- 8. CTA akhir: baris kertas dengan garis emas — bukan panel hijau kedua -->
<section class="bg-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div
			class="flex flex-col gap-6 border-t-2 border-gold-500 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12"
		>
			<div>
				<p class="kicker">Pendaftaran Anggota {settings.periode}</p>
				<h2
					class="mt-1.5 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
				>
					Pendaftaran Anggota Baru Dibuka
				</h2>
				<p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
					Dibuka untuk seluruh pelajar SMK LPPM RI 2 Kedungreja — putra mendaftar ke IPNU, putri ke
					IPPNU. Formulir online tanpa biaya; kartu anggota terbit setelah diverifikasi pengurus.
				</p>
			</div>
			<div class="flex shrink-0 flex-col items-start gap-2 sm:items-end">
				<a href="/daftar" class="btn btn-gold btn-lg w-full sm:w-auto">Daftar Sekarang</a>
				<a href="/daftar/status" class="text-xs font-semibold text-stone-500 hover:text-stone-800">
					Sudah mendaftar? Cek status →
				</a>
			</div>
		</div>
	</div>
</section>
