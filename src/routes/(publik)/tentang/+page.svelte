<script lang="ts">
	import {
		BookOpenText,
		Camera,
		Clock,
		Flag,
		HandHeart,
		HeartHandshake,
		ListChecks,
		Mail,
		MapPin,
		Phone,
		Target,
		Trophy,
		Users,
		UsersRound
	} from '@lucide/svelte';
	import Button from '#lib/components/ui/Button.svelte';
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

	const program: { ikon: typeof BookOpenText; judul: string; desc: string; tone: string }[] = [
		{
			ikon: BookOpenText,
			judul: 'Kajian Keagamaan',
			desc: 'Kajian kitab, pengajian rutin, dan peringatan hari besar Islam untuk membekali pelajar dengan ilmu agama.',
			tone: 'bg-primary-100 text-primary-700'
		},
		{
			ikon: HandHeart,
			judul: 'Sosial & Santunan',
			desc: 'Bakti sosial, santunan yatim dan dhuafa, serta aksi kemanusiaan sesuai jiwa Nahdlatul Ulama.',
			tone: 'bg-accent-100 text-accent-700'
		},
		{
			ikon: Flag,
			judul: 'Kaderisasi & Kepemimpinan',
			desc: 'Latihan Dasar Kepemimpinan, musyawarah, dan regenerasi kader organisasi yang berkualitas.',
			tone: 'bg-gold-100 text-gold-700'
		},
		{
			ikon: Trophy,
			judul: 'Lomba & Prestasi',
			desc: 'Pembinaan dan pencapaian prestasi di berbagai lomba, dari tingkat sekolah hingga nasional.',
			tone: 'bg-primary-100 text-primary-700'
		},
		{
			ikon: Camera,
			judul: 'Dokumentasi',
			desc: 'Mendokumentasikan setiap kegiatan sebagai arsip perjalanan dan bahan publikasi organisasi.',
			tone: 'bg-accent-100 text-accent-700'
		},
		{
			ikon: HeartHandshake,
			judul: 'Silaturahmi',
			desc: 'Menjaga silaturahmi antaranggota, sesama komisariat, serta keluarga besar sekolah.',
			tone: 'bg-gold-100 text-gold-700'
		}
	];

	const jamSekretariat = [
		{ hari: 'Senin – Jumat', jam: '07.00 – 15.00 WIB' },
		{ hari: 'Sabtu', jam: '08.00 – 12.00 WIB' },
		{ hari: 'Minggu & Hari Libur', jam: 'Tutup' }
	];
</script>

<svelte:head>
	<title>Tentang Komisariat — IPNU & IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta name="description" content={settings.deskripsi} />
</svelte:head>

<!-- Hero -->
<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading
			center
			eyebrow="Profil Organisasi"
			title="Tentang Komisariat"
			desc={settings.deskripsi}
		/>
	</div>
</section>

<!-- Perjalanan kami -->
<section class="mx-auto max-w-4xl px-4 py-14 sm:px-6">
	<SectionHeading
		eyebrow="Sejarah"
		title="Perjalanan Kami"
		desc="Bagaimana komisariat ini hadir dan tumbuh di tengah keluarga SMK LPPM RI 2 Kedungreja."
	/>
	<div class="card mt-6 p-7 sm:p-9">
		<div class="prose prose-stone prose-headings:font-display max-w-none">
			{@html renderKonten(settings.tentang_panjang ?? '')}
		</div>
	</div>
</section>

<!-- Visi & misi -->
<section class="pattern-islamic-dark bg-primary-50 py-16">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<SectionHeading center eyebrow="Arah Organisasi" title="Visi & Misi" />

		<div class="mt-10 grid gap-6 lg:grid-cols-2">
			<div class="card p-7">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
					>
						<Target class="h-5 w-5" />
					</div>
					<h3 class="font-display text-lg font-extrabold text-stone-900">Visi</h3>
				</div>
				<blockquote
					class="mt-4 border-l-4 border-gold-400 pl-4 font-display leading-relaxed text-stone-700 italic"
				>
					“{visi}”
				</blockquote>
			</div>

			<div class="card p-7">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700"
					>
						<ListChecks class="h-5 w-5" />
					</div>
					<h3 class="font-display text-lg font-extrabold text-stone-900">Misi</h3>
				</div>
				<ol class="mt-4 space-y-2.5">
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

<!-- Yang kami lakukan -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
	<SectionHeading
		center
		eyebrow="Program Kerja"
		title="Yang Kami Lakukan"
		desc="Enam pilar kegiatan yang menjadi denyut organisasi komisariat."
	/>

	<div class="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
		{#each program as p (p.judul)}
			{@const Ikon = p.ikon}
			<div class="card p-5 sm:p-6">
				<div class="flex h-11 w-11 items-center justify-center rounded-xl {p.tone}">
					<Ikon class="h-5 w-5" />
				</div>
				<h3 class="mt-4 font-display text-base font-bold text-stone-900">{p.judul}</h3>
				<p class="mt-2 text-sm leading-relaxed text-stone-500">{p.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Kontak -->
<section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
	<SectionHeading
		eyebrow="Hubungi Kami"
		title="Kontak & Sekretariat"
		desc="Sampaikan pertanyaan, saran, atau ajakan kerja sama kepada pengurus komisariat."
	/>

	<div class="card mt-6 grid gap-10 p-7 sm:p-9 lg:grid-cols-2">
		<!-- Kiri: alamat & sosmed -->
		<div>
			<ul class="space-y-4 text-sm text-stone-700">
				<li class="flex gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
					>
						<MapPin class="h-5 w-5" />
					</div>
					<div>
						<p class="font-bold text-stone-900">Alamat Sekretariat</p>
						<p class="mt-0.5 leading-relaxed">{settings.alamat}</p>
					</div>
				</li>
				<li class="flex gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
					>
						<Phone class="h-5 w-5" />
					</div>
					<div>
						<p class="font-bold text-stone-900">Telepon / WhatsApp</p>
						<p class="mt-0.5">{settings.no_telp}</p>
					</div>
				</li>
				<li class="flex gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"
					>
						<Mail class="h-5 w-5" />
					</div>
					<div>
						<p class="font-bold text-stone-900">Email Resmi</p>
						<p class="mt-0.5">{settings.email}</p>
					</div>
				</li>
			</ul>

			{#if settings.instagram || settings.youtube || settings.tiktok}
				<div class="mt-7 border-t border-stone-200 pt-6">
					<p class="text-xs font-bold tracking-widest text-stone-400 uppercase">Media Sosial</p>
					<div class="mt-3 flex flex-wrap gap-2">
						{#if settings.instagram}
							<a
								href="https://instagram.com/{settings.instagram}"
								target="_blank"
								rel="noopener"
								class="btn btn-outline btn-sm"
							>
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
									<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
									<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
								</svg>
								Instagram — @{settings.instagram}
							</a>
						{/if}
						{#if settings.youtube}
							<a
								href="https://youtube.com/@{settings.youtube}"
								target="_blank"
								rel="noopener"
								class="btn btn-outline btn-sm"
							>
								YouTube — @{settings.youtube}
							</a>
						{/if}
						{#if settings.tiktok}
							<a
								href="https://tiktok.com/@{settings.tiktok}"
								target="_blank"
								rel="noopener"
								class="btn btn-outline btn-sm"
							>
								TikTok — @{settings.tiktok}
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Kanan: jam sekretariat -->
		<div class="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-200">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700"
				>
					<Clock class="h-5 w-5" />
				</div>
				<div>
					<h3 class="font-display text-base font-bold text-stone-900">Jam Sekretariat</h3>
					<p class="text-xs text-stone-500">Waktu pelayanan anggota & kunjungan</p>
				</div>
			</div>
			<ul class="mt-5 divide-y divide-stone-200">
				{#each jamSekretariat as j (j.hari)}
					<li class="flex items-center justify-between gap-3 py-3 text-sm">
						<span class="font-medium text-stone-700">{j.hari}</span>
						<span class="font-semibold {j.jam === 'Tutup' ? 'text-accent-600' : 'text-stone-900'}">
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
</section>

<!-- CTA daftar -->
<section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
	<div class="pattern-islamic rounded-3xl bg-primary-950 p-10 text-center text-white">
		<h2 class="font-display text-3xl font-extrabold sm:text-4xl">Ingin Menjadi Bagian dari Kami?</h2>
		<p class="mx-auto mt-3 max-w-2xl leading-relaxed text-primary-100">
			Bagi pelajar putra dan putri SMK LPPM RI 2 Kedungreja, bergabunglah bersama IPNU & IPPNU
			periode {settings.periode} — mari tumbuh dan berkontribusi bersama.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<Button variant="gold" size="lg" href="/daftar">Daftar Anggota Sekarang</Button>
			<a
				href="/berita"
				class="btn btn-lg border border-white/40 bg-white/10 text-white hover:bg-white/20"
			>
				Baca Kabar Kami
			</a>
		</div>
		<p class="mt-5 inline-flex items-center gap-1.5 text-sm text-primary-200">
			<Users class="h-4 w-4" /> Terbuka untuk seluruh pelajar ·
			<UsersRound class="h-4 w-4" /> Putra & putri dipisah pembinaan
		</p>
	</div>
</section>
