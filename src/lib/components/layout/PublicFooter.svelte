<script lang="ts">
	import { MapPin, Phone, Mail, Heart } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { SEKOLAH } from '#lib/config.ts';
	import type { Settings } from '#lib/server/db.ts';

	let { settings }: { settings: Settings } = $props();

	const tahun = new Date().getFullYear();

	const tautan = [
		{ href: '/berita', label: 'Berita' },
		{ href: '/agenda', label: 'Agenda Kegiatan' },
		{ href: '/galeri', label: 'Galeri' },
		{ href: '/dokumen', label: 'Dokumen' },
		{ href: '/daftar', label: 'Pendaftaran Anggota' },
		{ href: '/laporan-kas', label: 'Laporan Kas' }
	];
</script>

<footer class="pattern-islamic bg-primary-950 text-primary-100">
	<div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
		<div>
			<Logo size={44} terang />
			<p class="mt-4 text-sm leading-relaxed text-primary-200">{settings.deskripsi}</p>
			<div class="mt-4 flex gap-2">
				{#if settings.instagram}
					<a href="https://instagram.com/{settings.instagram}" target="_blank" rel="noopener" class="rounded-lg bg-white/10 p-2 transition hover:bg-white/20" aria-label="Instagram">
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
							<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
							<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
						</svg>
					</a>
				{/if}
				{#if settings.youtube}
					<a href="https://youtube.com/@{settings.youtube}" target="_blank" rel="noopener" class="rounded-lg bg-white/10 p-2 transition hover:bg-white/20" aria-label="YouTube">
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
							<path d="m10 15 5-3-5-3z" />
						</svg>
					</a>
				{/if}
			</div>
		</div>

		<div>
			<h3 class="font-display text-sm font-bold tracking-wider text-white uppercase">Tautan</h3>
			<ul class="mt-4 space-y-2.5">
				{#each tautan as t (t.href)}
					<li><a class="text-sm text-primary-200 transition hover:text-white" href={t.href}>{t.label}</a></li>
				{/each}
			</ul>
		</div>

		<div>
			<h3 class="font-display text-sm font-bold tracking-wider text-white uppercase">Kontak</h3>
			<ul class="mt-4 space-y-3 text-sm text-primary-200">
				<li class="flex gap-2.5"><MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /><span>{settings.alamat}</span></li>
				<li class="flex gap-2.5"><Phone class="h-4 w-4 shrink-0 text-gold-300" /><span>{settings.no_telp}</span></li>
				<li class="flex gap-2.5"><Mail class="h-4 w-4 shrink-0 text-gold-300" /><span>{settings.email}</span></li>
			</ul>
			<p class="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs text-primary-100">
				Periode kepengurusan {settings.periode}
			</p>
		</div>
	</div>

	<div class="border-t border-white/10">
		<div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-300 sm:flex-row sm:px-6">
			<p>© {tahun} Pimpinan Komisariat IPNU & IPPNU {SEKOLAH}</p>
			<p class="flex items-center gap-1.5">
				Dibangun dengan <Heart class="h-3 w-3 text-accent-400" fill="currentColor" /> untuk pelajar Nahdlatul Ulama
			</p>
		</div>
	</div>
</footer>
