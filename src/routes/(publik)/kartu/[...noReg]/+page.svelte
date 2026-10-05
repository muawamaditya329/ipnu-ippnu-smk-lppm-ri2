<script lang="ts">
	import { Info, Printer } from '@lucide/svelte';
	import { inisial } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const member = $derived(data.member);
	const ipnu = $derived(member.jenis_kelamin === 'L');
</script>

<svelte:head>
	<title>Kartu Anggota — {member.nama}</title>
	<meta
		name="description"
		content="Kartu anggota digital {ipnu
			? 'IPNU'
			: 'IPPNU'} a.n. {member.nama}, Komisariat SMK LPPM RI 2 Kedungreja."
	/>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
	<!-- Instruksi (tidak ikut tercetak) -->
	<div class="no-print mb-8">
		<p class="kicker">Kartu Anggota Digital</p>
		<h1 class="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
			Kartu Anggota {ipnu ? 'IPNU' : 'IPPNU'}
		</h1>
		<p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
			Perlihatkan kartu ini saat kegiatan komisariat, atau cetak untuk disimpan. Kartu memakai blok
			hijau penuh sebagai pengecualian resmi sistem desain.
		</p>
	</div>

	<!-- Kartu anggota -->
	<div class="print-area flex justify-center bg-white">
		<div class="w-full max-w-lg overflow-hidden rounded-lg border border-stone-200 bg-white">
			<!-- Kepala kartu (gradasi warna + pola islami sebagai lapisan terpisah) -->
			<header
				class="relative bg-gradient-to-br p-5 text-white {ipnu
					? 'from-primary-700 to-primary-900'
					: 'from-accent-700 to-accent-900'}"
			>
				<div class="pattern-islamic pointer-events-none absolute inset-0" aria-hidden="true"></div>
				<div class="relative flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
							<svg
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-6 w-6 text-white"
								aria-hidden="true"
							>
								<polygon
									points="12,3 14.47,9.6 21.51,9.91 15.99,14.3 17.88,21.09 12,17.2 6.12,21.09 8.01,14.3 2.49,9.91 9.53,9.6"
								/>
							</svg>
						</div>
						<div>
							<p class="font-display text-lg font-extrabold tracking-wide">KARTU ANGGOTA</p>
							<p class="text-[11px] text-white/80">
								Pimpinan Komisariat {ipnu ? 'IPNU' : 'IPPNU'} SMK LPPM RI 2 Kedungreja
							</p>
						</div>
					</div>
					{#if data.settings.periode}
						<span class="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
							Periode {data.settings.periode}
						</span>
					{/if}
				</div>
			</header>

			<!-- Isi kartu -->
			<div class="flex items-center gap-5 p-5">
				<div class="min-w-0 flex-1">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full font-display text-xl font-extrabold {ipnu
							? 'bg-primary-100 text-primary-800'
							: 'bg-accent-100 text-accent-800'}"
					>
						{inisial(member.nama)}
					</div>
					<p class="mt-3 truncate font-display text-xl font-extrabold text-stone-900">
						{member.nama}
					</p>
					<p class="font-mono text-sm font-bold text-stone-600">{member.no_reg}</p>
					<dl class="mt-3 space-y-1 text-xs text-stone-500">
						<div class="flex gap-1.5">
							<dt class="w-12 shrink-0 font-semibold">NIS</dt>
							<dd class="truncate text-stone-700">{member.nis ?? '-'}</dd>
						</div>
						<div class="flex gap-1.5">
							<dt class="w-12 shrink-0 font-semibold">Kelas</dt>
							<dd class="truncate text-stone-700">
								{member.kelas ?? '-'} · {member.jurusan ?? '-'}
							</dd>
						</div>
						<div class="flex gap-1.5">
							<dt class="w-12 shrink-0 font-semibold">Sekolah</dt>
							<dd class="text-stone-700">SMK LPPM RI 2 Kedungreja</dd>
						</div>
					</dl>
				</div>
				<div class="shrink-0 text-center">
					<img
						src={data.qr}
						alt="Kode QR verifikasi untuk {member.no_reg}"
						width="100"
						height="100"
						class="rounded-xl border border-stone-200"
					/>
					<p class="mt-2 text-[10px] font-semibold text-stone-400">Pindai untuk verifikasi</p>
				</div>
			</div>

			<!-- Kaki kartu -->
			<footer>
				<div class="h-1.5 w-full {ipnu ? 'bg-primary-600' : 'bg-accent-600'}"></div>
				<p class="bg-stone-50 px-5 py-3 text-center text-[11px] text-stone-500">
					Berlaku selama menjadi anggota aktif
				</p>
			</footer>
		</div>
	</div>

	<!-- Aksi (tidak ikut tercetak) -->
	<div class="no-print mt-8">
		<button class="btn btn-primary" onclick={() => window.print()}>
			<Printer class="h-4 w-4" aria-hidden="true" /> Cetak Kartu
		</button>
		<p class="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400">
			<Info class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
			Saat mencetak, aktifkan opsi "Background graphics" agar warna kartu ikut tercetak.
		</p>
	</div>
</section>
