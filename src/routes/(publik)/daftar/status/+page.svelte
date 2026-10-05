<script lang="ts">
	import { BadgeCheck, Ban, Clock, GraduationCap, IdCard, Search } from '@lucide/svelte';
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { fmtTanggal, LABEL_STATUS_MEMBER, toneStatusMember } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const member = $derived(data.member);
</script>

<svelte:head>
	<title>Cek Status Pendaftaran — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Cek status pendaftaran anggota Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja dengan memasukkan NIS."
	/>
</svelte:head>

<PageHeader
	kicker="Pendaftaran Anggota"
	title="Cek Status Pendaftaran"
	desc="Masukkan NIS yang kamu gunakan saat mendaftar untuk melihat perkembangan verifikasi oleh pengurus."
/>

<section class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
	<form
		method="GET"
		action="/daftar/status"
		class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
	>
		<div class="flex-1">
			<label class="label" for="nis">NIS <span class="text-accent-600">*</span></label>
			<div class="relative">
				<Search class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
				<input
					id="nis"
					name="nis"
					class="input pl-10"
					required
					inputmode="numeric"
					placeholder="mis. 2025001"
					value={data.nis}
				/>
			</div>
		</div>
		<button class="btn btn-primary" type="submit">Cek Status</button>
	</form>

	<div class="mt-6">
		{#if member}
			<!-- Lembar hasil: gaya arsip keanggotaan -->
			<div class="card overflow-hidden">
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-6 py-4"
				>
					<div>
						<p class="text-[11px] font-bold tracking-[0.08em] text-stone-400 uppercase">
							NIS <span class="font-mono">{data.nis}</span>
						</p>
						<h2 class="mt-0.5 font-display text-xl font-bold tracking-tight text-stone-900">
							{member.nama}
						</h2>
					</div>
					<span class="badge badge-{toneStatusMember(member.status)}">
						{LABEL_STATUS_MEMBER[member.status] ?? member.status}
					</span>
				</div>

				<dl class="divide-y divide-stone-100 px-6">
					<div class="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
						<dt class="w-44 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase">
							Organisasi
						</dt>
						<dd class="text-sm font-semibold text-stone-800">
							{member.jenis_kelamin === 'L' ? 'IPNU (Putra)' : 'IPPNU (Putri)'}
						</dd>
					</div>
					<div class="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
						<dt class="w-44 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase">
							Kelas &amp; Jurusan
						</dt>
						<dd class="text-sm text-stone-700">{member.kelas ?? '-'} · {member.jurusan ?? '-'}</dd>
					</div>
					<div class="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
						<dt class="w-44 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase">
							Tanggal Daftar
						</dt>
						<dd class="text-sm tabular-nums text-stone-700">{fmtTanggal(member.created_at)}</dd>
					</div>
					{#if member.no_reg}
						<div class="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
							<dt
								class="w-44 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase"
							>
								Nomor Registrasi
							</dt>
							<dd class="font-mono text-sm font-bold text-stone-800">{member.no_reg}</dd>
						</div>
					{/if}
				</dl>

				{#if member.catatan}
					<p class="aksen-kas mx-6 mb-5 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
						<b class="text-stone-800">Catatan pengurus:</b>
						{member.catatan}
					</p>
				{/if}

				<div class="border-t border-stone-100 px-6 py-5">
					{#if member.status === 'pending'}
						<div
							class="aksen-kas flex items-start gap-3 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
						>
							<Clock class="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
							<span
								>Pendaftaranmu sedang diverifikasi pengurus. Mohon tunggu maksimal 3 hari kerja —
								status di halaman ini akan berubah setelah diverifikasi.</span
							>
						</div>
					{:else if member.status === 'ditolak'}
						<div
							class="aksen-ippnu flex items-start gap-3 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
						>
							<Ban class="mt-0.5 h-4 w-4 shrink-0 text-accent-700" aria-hidden="true" />
							<span
								>Maaf, pendaftaranmu belum dapat disetujui. Silakan hubungi pengurus komisariat
								untuk informasi lebih lanjut.</span
							>
						</div>
					{:else if member.status === 'aktif'}
						<div
							class="aksen-ipnu flex items-start gap-3 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
						>
							<BadgeCheck class="mt-0.5 h-4 w-4 shrink-0 text-primary-800" aria-hidden="true" />
							<span
								>Selamat! Kamu tercatat sebagai anggota aktif. Kartu anggotamu sudah dapat dilihat
								dan dicetak.</span
							>
						</div>
						<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
							{#if member.no_reg && member.token_kartu}
								<a
									href="/kartu/{encodeURIComponent(member.no_reg)}?token={member.token_kartu}"
									class="btn btn-primary shrink-0"
								>
									<IdCard class="h-4 w-4" aria-hidden="true" /> Lihat Kartu Anggota
								</a>
							{/if}
							<p class="text-xs leading-relaxed text-stone-500">
								Tautan kartu memuat kode pribadi milikmu — bagikan hanya kepada pengurus yang perlu
								memverifikasi keanggotaanmu.
							</p>
						</div>
						<!-- Arahkan ke dashboard anggota: NIS + password yang dibuat saat mendaftar -->
						<p class="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
							Sudah punya akun?
							<a
								href="/masuk?tab=anggota"
								class="font-semibold text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800"
								>Masuk di sini</a
							>
							untuk membuka dashboard keanggotaanmu.
						</p>
					{:else}
						<div
							class="aksen-kas flex items-start gap-3 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
						>
							<GraduationCap class="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
							<span
								>Kamu tercatat sebagai alumni komisariat. Terima kasih atas kontribusimu selama
								menjadi anggota.</span
							>
						</div>
					{/if}
				</div>
			</div>
		{:else if data.nis}
			<!-- Tidak ditemukan -->
			<div
				class="aksen-kas border-y border-r border-stone-200 bg-white px-4 py-4 text-sm text-stone-700"
				role="alert"
			>
				<p class="font-bold">NIS tidak ditemukan.</p>
				<p class="mt-1">
					Tidak ada pendaftaran dengan NIS <b class="font-mono">{data.nis}</b>. Periksa kembali
					angkanya, atau daftar terlebih dahulu lewat halaman
					<a href="/daftar" class="font-semibold text-primary-700 underline">Pendaftaran Anggota</a>.
				</p>
			</div>
		{:else}
			<div class="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
				<h3 class="font-display text-base font-bold text-stone-800">
					Masukkan NIS untuk mulai mengecek
				</h3>
				<p class="mx-auto mt-1 max-w-md text-sm text-stone-500">
					NIS adalah nomor induk siswa yang kamu tuliskan pada formulir pendaftaran. Simpan angka
					tersebut agar mudah menghubungkannya kembali.
				</p>
			</div>
		{/if}
	</div>
</section>
