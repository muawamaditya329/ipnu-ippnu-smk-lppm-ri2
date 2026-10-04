<script lang="ts">
	import { BadgeCheck, Ban, Clock, GraduationCap, IdCard, Search } from '@lucide/svelte';
	import SectionHeading from '#lib/components/ui/SectionHeading.svelte';
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

<!-- Override warna teks SectionHeading agar terbaca di atas latar hijau tua -->
<section class="pattern-islamic bg-primary-900 py-14 text-white">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 [&_h2]:text-white [&_p]:text-primary-200">
		<SectionHeading
			eyebrow="Pendaftaran"
			title="Cek Status Pendaftaran"
			desc="Masukkan NIS yang kamu gunakan saat mendaftar untuk melihat perkembangan verifikasi oleh pengurus."
		/>
	</div>
</section>

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
			<!-- Kartu hasil -->
			<div class="card overflow-hidden">
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-6 py-4"
				>
					<div>
						<p class="text-xs font-bold tracking-wide text-stone-400 uppercase">NIS {data.nis}</p>
						<h2 class="mt-0.5 font-display text-xl font-extrabold text-stone-900">{member.nama}</h2>
					</div>
					<span class="badge badge-{toneStatusMember(member.status)}">
						{LABEL_STATUS_MEMBER[member.status] ?? member.status}
					</span>
				</div>

				<dl class="grid gap-x-6 gap-y-4 px-6 py-5 sm:grid-cols-2">
					<div>
						<dt class="text-xs font-bold tracking-wide text-stone-400 uppercase">
							Kelas &amp; Jurusan
						</dt>
						<dd class="mt-0.5 text-sm text-stone-700">
							{member.kelas ?? '-'} · {member.jurusan ?? '-'}
						</dd>
					</div>
					<div>
						<dt class="text-xs font-bold tracking-wide text-stone-400 uppercase">Tanggal Daftar</dt>
						<dd class="mt-0.5 text-sm text-stone-700">{fmtTanggal(member.created_at)}</dd>
					</div>
					{#if member.no_reg}
						<div>
							<dt class="text-xs font-bold tracking-wide text-stone-400 uppercase">
								Nomor Registrasi
							</dt>
							<dd class="mt-0.5 font-mono text-sm font-bold text-stone-800">{member.no_reg}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-xs font-bold tracking-wide text-stone-400 uppercase">Organisasi</dt>
						<dd class="mt-0.5 text-sm text-stone-700">
							{member.jenis_kelamin === 'L' ? 'IPNU (Putra)' : 'IPPNU (Putri)'}
						</dd>
					</div>
				</dl>

				{#if member.catatan}
					<p
						class="mx-6 mb-5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600"
					>
						<b class="text-stone-800">Catatan pengurus:</b>
						{member.catatan}
					</p>
				{/if}

				<div class="border-t border-stone-100 px-6 py-5">
					{#if member.status === 'pending'}
						<div
							class="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800"
						>
							<Clock class="mt-0.5 h-4 w-4 shrink-0" />
							<span
								>Pendaftaranmu sedang diverifikasi pengurus. Mohon tunggu maksimal 3 hari kerja —
								status di halaman ini akan berubah setelah diverifikasi.</span
							>
						</div>
					{:else if member.status === 'ditolak'}
						<div
							class="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700"
						>
							<Ban class="mt-0.5 h-4 w-4 shrink-0" />
							<span
								>Maaf, pendaftaranmu belum dapat disetujui. Silakan hubungi pengurus komisariat
								untuk informasi lebih lanjut.</span
							>
						</div>
					{:else if member.status === 'aktif'}
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div
								class="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800"
							>
								<BadgeCheck class="mt-0.5 h-4 w-4 shrink-0" />
								<span
									>Selamat! Kamu tercatat sebagai anggota aktif. Kartu anggotamu sudah dapat dilihat
									dan dicetak.</span
								>
							</div>
							<a
								href="/kartu/{encodeURIComponent(member.no_reg ?? '')}"
								class="btn btn-primary shrink-0"
							>
								<IdCard class="h-4 w-4" /> Lihat Kartu Anggota
							</a>
						</div>
					{:else}
						<div
							class="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600"
						>
							<GraduationCap class="mt-0.5 h-4 w-4 shrink-0" />
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
				class="rounded-xl border border-gold-300 bg-gold-50 px-4 py-4 text-sm text-gold-800"
				role="alert"
			>
				<p class="font-bold">NIS tidak ditemukan.</p>
				<p class="mt-1">
					Tidak ada pendaftaran dengan NIS <b class="font-mono">{data.nis}</b>. Periksa kembali
					angkanya, atau daftar terlebih dahulu lewat halaman
					<a href="/daftar" class="font-semibold underline">Pendaftaran Anggota</a>.
				</p>
			</div>
		{:else}
			<div
				class="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center"
			>
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
