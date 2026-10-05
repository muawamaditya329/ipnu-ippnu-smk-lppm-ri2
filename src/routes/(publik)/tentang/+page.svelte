<script lang="ts">
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
	import { renderKonten } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const settings = $derived(data.settings);
	const visi = $derived(settings.visi ?? '');
	const misiPoin = $derived(
		(settings.misi ?? '')
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean)
	);

	// Program kerja faktual — daftar bernomor dengan contoh kegiatan nyata
	// yang tercatat di agenda, galeri, dan berita komisariat.
	const program: { judul: string; desc: string }[] = [
		{
			judul: 'Kajian Keagamaan',
			desc: 'Kajian Kitab Rutin tiap Jumat pekan kedua di masjid sekolah dan Kajian Rutin IPPNU: Fikih Praktis di aula — dilanjutkan peringatan hari besar Islam seperti Muharraman.'
		},
		{
			judul: 'Kaderisasi & Kepemimpinan',
			desc: 'Latihan Dasar Kepemimpinan (LDK) tahunan di lapangan sekolah dan masjid, serta rapat rutin pengurus tiap pekan di Ruang OSIS.'
		},
		{
			judul: 'Sosial & Santunan',
			desc: 'Santunan Anak Yatim keliling dusun Kedungreja dan Jumat Berbagi di gerbang sekolah — danai dari iuran anggota dan donasi warga.'
		},
		{
			judul: 'Lomba & Prestasi',
			desc: 'Lomba Antar Kelas Muharraman (azan, tartil, cerdas cermat) serta pembinaan tim 4H dan Anoling IPPNU — juara umum tingkat Kabupaten Cilacap.'
		},
		{
			judul: 'Dokumentasi',
			desc: 'Setiap kegiatan tercatat dalam album galeri — Kajian Kitab Bulanan, Santunan Anak Yatim, hingga Muharraman 1448 H — sebagai arsip perjalanan organisasi.'
		},
		{
			judul: 'Silaturahmi',
			desc: 'Bincang vokasi bersama alumni ("Vokasi Itu Keren"), silaturahmi antarkomisariat, serta koordinasi dengan pembina dan sekolah.'
		}
	];

	const jamSekretariat = [
		{ hari: 'Senin – Jumat', jam: '07.00 – 15.00 WIB' },
		{ hari: 'Sabtu', jam: '08.00 – 12.00 WIB' },
		{ hari: 'Minggu & Hari Libur', jam: 'Tutup' }
	];

	// Kontak sebagai baris berkas (label — nilai), tanpa ikon.
	const kontak = $derived.by(() => {
		const baris: { label: string; nilai: string; href?: string }[] = [
			{ label: 'Alamat Sekretariat', nilai: settings.alamat },
			{ label: 'Telepon / WhatsApp', nilai: settings.no_telp },
			{ label: 'Email Resmi', nilai: settings.email }
		];
		if (settings.instagram)
			baris.push({
				label: 'Instagram',
				nilai: '@' + settings.instagram,
				href: `https://instagram.com/${settings.instagram}`
			});
		if (settings.youtube)
			baris.push({
				label: 'YouTube',
				nilai: '@' + settings.youtube,
				href: `https://youtube.com/@${settings.youtube}`
			});
		if (settings.tiktok)
			baris.push({
				label: 'TikTok',
				nilai: '@' + settings.tiktok,
				href: `https://tiktok.com/@${settings.tiktok}`
			});
		return baris;
	});
</script>

<svelte:head>
	<title>Tentang Komisariat — IPNU & IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={settings.deskripsi} />
</svelte:head>

<PageHeader
	kicker="Profil Komisariat"
	title="Tentang Komisariat"
	desc={settings.deskripsi}
/>

<!-- Perjalanan kami -->
<section class="mx-auto max-w-4xl px-4 py-14 sm:px-6">
	<SectionHeading
		nomor="01"
		title="Perjalanan Kami"
		desc="Bagaimana komisariat ini hadir dan tumbuh di tengah keluarga SMK LPPM RI 2 Kedungreja."
	/>
	{#if settings.tentang_panjang}
		<article class="card aksen-kas mt-6 p-7 sm:p-9">
			<div class="prose max-w-none prose-stone prose-headings:font-display">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderKonten meng-escape HTML sebelum menambah markup tebal/miring -->
				{@html renderKonten(settings.tentang_panjang)}
			</div>
		</article>
	{:else}
		<!-- Cadangan bila pengaturan belum diisi: ringkasan faktual dari identitas komisariat -->
		<article class="card aksen-kas mt-6 p-7 sm:p-9">
			<p class="text-sm leading-relaxed text-stone-700">
				Pimpinan Komisariat IPNU &amp; IPPNU SMK LPPM RI 2 Kedungreja menaungi pelajar putra dan
				putri di lingkungan SMK LPPM RI 2 Kedungreja, Kecamatan Kedungreja, Kabupaten Cilacap, untuk
				periode {settings.periode}. Kegiatan berjalan melalui kajian keagamaan, sosial, dan
				kepemimpinan dengan landasan ahlussunnah wal jamaah ala nahdliyah, sebagaimana termuat dalam
				visi dan misi komisariat di bawah ini.
			</p>
		</article>
	{/if}
</section>

<!-- Visi & misi -->
<section class="border-t border-stone-200 bg-white">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
		<SectionHeading nomor="02" title="Visi & Misi" />

		<div class="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
			<div class="card aksen-kas p-6 sm:p-7">
				<p class="kicker">Visi</p>
				<blockquote
					class="mt-4 font-display text-lg leading-relaxed text-stone-800 italic sm:text-xl"
				>
					&ldquo;{visi}&rdquo;
				</blockquote>
			</div>

			<div class="card p-6 sm:p-7">
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

<!-- Program kerja: daftar bernomor dua kolom, bukan kartu identik -->
<section class="border-t border-stone-200">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
		<SectionHeading
			nomor="03"
			title="Yang Kami Lakukan"
			desc="Enam pilar kegiatan komisariat — seluruhnya tercatat pada agenda, galeri, dan berita situs ini."
		/>

		<div class="mt-8 grid border-t border-stone-200 sm:grid-cols-2 sm:gap-x-12">
			{#each program as p, i (p.judul)}
				<div class="flex gap-4 border-b border-stone-200 py-5">
					<span class="rule-num shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
					<div>
						<h3 class="font-display text-base font-bold text-stone-900">{p.judul}</h3>
						<p class="mt-1 text-sm leading-relaxed text-stone-600">{p.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Kontak: baris berkas label — nilai -->
<section class="border-t border-stone-200 bg-white">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
		<SectionHeading
			nomor="04"
			title="Kontak & Sekretariat"
			desc="Sampaikan pertanyaan, saran, atau ajakan kerja sama kepada pengurus komisariat."
		/>

		<div class="mt-8 grid gap-10 lg:grid-cols-2">
			<!-- Kiri: daftar kontak -->
			<div>
				<dl class="divide-y divide-stone-200 border-y border-stone-200">
					{#each kontak as k (k.label)}
						<div class="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
							<dt
								class="w-44 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase"
							>
								{k.label}
							</dt>
							<dd class="text-sm leading-relaxed text-stone-800">
								{#if k.href}
									<a
										href={k.href}
										target="_blank"
										rel="noopener"
										class="font-semibold text-primary-800 underline decoration-primary-300 underline-offset-2 hover:text-primary-950"
									>
										{k.nilai}
									</a>
								{:else}
									{k.nilai}
								{/if}
							</dd>
						</div>
					{/each}
				</dl>
			</div>

			<!-- Kanan: jam sekretariat -->
			<div class="aksen-kas border border-stone-200 bg-stone-50 p-6">
				<p class="kicker">Jam Sekretariat</p>
				<p class="mt-1 text-xs text-stone-500">Waktu pelayanan anggota &amp; kunjungan</p>
				<ul class="mt-4 divide-y divide-stone-200">
					{#each jamSekretariat as j (j.hari)}
						<li class="flex items-center justify-between gap-3 py-3 text-sm">
							<span class="text-stone-700">{j.hari}</span>
							<span
								class="font-semibold {j.jam === 'Tutup' ? 'text-accent-700' : 'text-stone-900'}"
							>
								{j.jam}
							</span>
						</li>
					{/each}
				</ul>
				<p class="mt-4 text-xs leading-relaxed text-stone-500">
					Sekretariat berada di lingkungan SMK LPPM RI 2 Kedungreja. Kunjungan di luar jam tersebut
					sebaiknya disepakati lebih dulu melalui kontak di samping.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA daftar: kartu datar bergaris emas -->
<section class="border-t border-stone-200">
	<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
		<div
			class="card aksen-kas flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9"
		>
			<div>
				<p class="kicker">Pendaftaran Anggota {settings.periode}</p>
				<h2
					class="mt-1.5 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
				>
					Ingin Menjadi Bagian dari Kami?
				</h2>
				<p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
					Bagi pelajar putra dan putri SMK LPPM RI 2 Kedungreja — putra mendaftar ke IPNU, putri ke
					IPPNU. Terbuka untuk seluruh pelajar, pembinaan dipisah antara putra dan putri.
				</p>
			</div>
			<a href="/daftar" class="btn btn-gold btn-lg shrink-0 self-start sm:self-auto"
				>Daftar Anggota Sekarang</a
			>
		</div>
	</div>
</section>
