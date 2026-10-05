<script lang="ts">
	import { Mail, MapPin, Phone, Music2 } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { SEKOLAH } from '#lib/config.ts';
	import { hariIni } from '#lib/utils.ts';
	import type { Settings } from '#lib/server/db.ts';

	let { settings }: { settings: Settings } = $props();

	// Tahun kalender WIB — bukan tahun versi zona waktu mesin/server.
	const tahun = Number(hariIni().slice(0, 4));

	const tautan = [
		{ href: '/berita', label: 'Berita' },
		{ href: '/agenda', label: 'Agenda Kegiatan' },
		{ href: '/galeri', label: 'Galeri' },
		{ href: '/dokumen', label: 'Dokumen' },
		{ href: '/daftar', label: 'Pendaftaran Anggota' },
		{ href: '/laporan-kas', label: 'Laporan Kas' }
	];

	// Footer memakai kertas (kolofon terang) di seluruh halaman publik: blok hijau
	// penuh sudah dipakai kop kategori di kepala halaman — aturan maksimal satu
	// blok hijau per halaman (DESIGN.md §3.2).
</script>

<!-- Kolom tegas berpemisah garis, seperti lembar identitas resmi di kaki situs. -->
<footer class="border-t border-stone-200 bg-stone-50">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="grid gap-10 py-14 md:grid-cols-12 md:gap-0">
			<!-- Identitas -->
			<div class="md:col-span-5 md:pr-10">
				<Logo size={44} />
				<p class="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
					{settings.deskripsi}
				</p>
				<div class="mt-5 flex gap-2">
					{#if settings.instagram}
						<a
							href="https://instagram.com/{settings.instagram}"
							target="_blank"
							rel="noopener"
							class="rounded-md border border-stone-300 p-2 text-stone-500 transition hover:border-stone-500 hover:text-stone-900"
							aria-label="Instagram"
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
						</a>
					{/if}
					{#if settings.youtube}
						<a
							href="https://youtube.com/@{settings.youtube}"
							target="_blank"
							rel="noopener"
							class="rounded-md border border-stone-300 p-2 text-stone-500 transition hover:border-stone-500 hover:text-stone-900"
							aria-label="YouTube"
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
								<path
									d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"
								/>
								<path d="m10 15 5-3-5-3z" />
							</svg>
						</a>
					{/if}
					{#if settings.tiktok}
						<a
							href="https://tiktok.com/@{settings.tiktok}"
							target="_blank"
							rel="noopener"
							class="rounded-md border border-stone-300 p-2 text-stone-500 transition hover:border-stone-500 hover:text-stone-900"
							aria-label="TikTok"
						>
							<Music2 class="h-4 w-4" />
						</a>
					{/if}
				</div>
			</div>

			<!-- Tautan -->
			<div class="md:col-span-3 md:border-l md:border-stone-200 md:pl-8">
				<h3
					class="border-b border-gold-500 pb-2.5 text-[11px] font-semibold tracking-[0.14em] text-primary-800 uppercase"
				>
					Tautan
				</h3>
				<ul class="mt-4 space-y-2.5">
					{#each tautan as t (t.href)}
						<li>
							<a class="text-sm text-stone-600 transition hover:text-primary-900" href={t.href}
								>{t.label}</a
							>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Kontak -->
			<div class="md:col-span-4 md:border-l md:border-stone-200 md:pl-8">
				<h3
					class="border-b border-gold-500 pb-2.5 text-[11px] font-semibold tracking-[0.14em] text-primary-800 uppercase"
				>
					Kontak
				</h3>
				<ul class="mt-4 space-y-3 text-sm text-stone-600">
					<li class="flex gap-2.5">
						<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gold-700" /><span>{settings.alamat}</span>
					</li>
					<li class="flex gap-2.5">
						<Phone class="h-4 w-4 shrink-0 text-gold-700" /><span>{settings.no_telp}</span>
					</li>
					<li class="flex gap-2.5">
						<Mail class="h-4 w-4 shrink-0 text-gold-700" /><span>{settings.email}</span>
					</li>
				</ul>
				<p class="mt-5 border-l-2 border-gold-500 pl-3 text-xs text-stone-500">
					Periode kepengurusan {settings.periode}
				</p>
			</div>
		</div>
	</div>

	<!-- Baris hak cipta -->
	<div class="border-t border-stone-200">
		<div
			class="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:px-6"
		>
			<p>&copy; {tahun} Pimpinan Komisariat IPNU &amp; IPPNU {SEKOLAH}</p>
			<p>Situs resmi komisariat &mdash; dikelola pengurus periode {settings.periode}</p>
		</div>
	</div>
</footer>
