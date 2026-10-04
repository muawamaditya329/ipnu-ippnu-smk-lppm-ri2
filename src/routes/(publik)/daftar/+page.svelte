<script lang="ts">
	import { CheckCircle2, ShieldCheck, UserRound, UsersRound } from '@lucide/svelte';
	import { hariIni, JURUSAN_SMK, TINGKAT_KELAS } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const galat = $derived(form?.galat ?? null);
	const nilai = $derived(
		form?.nilai ?? {
			nama: '',
			jenis_kelamin: '',
			nis: '',
			kelas: TINGKAT_KELAS[0] ?? 'X',
			jurusan: JURUSAN_SMK[0] ?? '',
			tanggal_lahir: '',
			alamat: '',
			no_hp: '',
			nama_ortu: '',
			motivasi: ''
		}
	);

	let memproses = $state(false);

	const syarat = [
		'Siswa/i aktif SMK LPPM RI 2 Kedungreja.',
		'Mengisi data dengan benar dan dapat dipertanggungjawabkan.',
		'Menunggu verifikasi pengurus paling lama 3 hari kerja.',
		'Memantau status pendaftaran lewat menu Cek Status.'
	];
</script>

<svelte:head>
	<title>Pendaftaran Anggota — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
	<meta
		name="description"
		content="Formulir pendaftaran anggota Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja. Putra bergabung dengan IPNU, putri bergabung dengan IPPNU."
	/>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Panel informasi -->
		<aside class="lg:col-span-2">
			<div class="pattern-islamic rounded-2xl bg-primary-900 p-7 text-white sm:p-8">
				<p class="text-xs font-bold tracking-widest text-primary-200 uppercase">
					Pendaftaran Anggota
				</p>
				<h1 class="mt-2 font-display text-2xl font-extrabold">Bergabung Bersama Kami</h1>
				<p class="mt-3 text-sm leading-relaxed text-primary-100">
					Isi formulir di samping untuk mendaftar sebagai anggota komisariat. Verifikasi dilakukan
					oleh pengurus, tanpa biaya apa pun.
				</p>

				<h2 class="mt-7 font-display text-sm font-bold tracking-wide text-primary-200 uppercase">
					Syarat Pendaftaran
				</h2>
				<ul class="mt-3 space-y-3">
					{#each syarat as s (s)}
						<li class="flex items-start gap-2.5 text-sm text-primary-50">
							<CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
							<span>{s}</span>
						</li>
					{/each}
				</ul>

				<h2 class="mt-7 font-display text-sm font-bold tracking-wide text-primary-200 uppercase">
					Pilihan Organisasi
				</h2>
				<div class="mt-3 space-y-3">
					<div class="flex items-start gap-3 rounded-xl bg-white/10 p-3.5">
						<div
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white"
						>
							<UserRound class="h-5 w-5" />
						</div>
						<div>
							<p class="text-sm font-bold">Putra → IPNU</p>
							<p class="text-xs text-primary-100">Ikatan Pelajar Nahdlatul Ulama</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-xl bg-white/10 p-3.5">
						<div
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-600 text-white"
						>
							<UsersRound class="h-5 w-5" />
						</div>
						<div>
							<p class="text-sm font-bold">Putri → IPPNU</p>
							<p class="text-xs text-primary-100">Ikatan Pelajar Putri Nahdlatul Ulama</p>
						</div>
					</div>
				</div>

				<p
					class="mt-7 flex items-start gap-2 border-t border-white/15 pt-5 text-xs text-primary-100"
				>
					<ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
					Data kamu hanya digunakan untuk keperluan keanggotaan dan disimpan secara aman.
				</p>
			</div>
		</aside>

		<!-- Formulir -->
		<div class="lg:col-span-3">
			<div class="card p-6 sm:p-8">
				{#if form?.sukses}
					<div class="py-4 text-center">
						<div
							class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700"
						>
							<CheckCircle2 class="h-9 w-9" />
						</div>
						<h2 class="font-display text-2xl font-extrabold text-stone-900">
							Pendaftaran Terkirim!
						</h2>
						<p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
							Terima kasih, <b class="text-stone-900">{form.nama}</b>. Data pendaftaranmu sudah kami
							terima dan akan diverifikasi pengurus paling lama 3 hari kerja.
						</p>
						<div
							class="mx-auto mt-5 max-w-md rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900"
						>
							Catat NIS-mu: <b class="font-mono text-base">{form.nis}</b> — dibutuhkan untuk mengecek
							status pendaftaran.
						</div>
						<div class="mt-6">
							<a
								href="/daftar/status?nis={encodeURIComponent(form.nis)}"
								class="btn btn-primary btn-lg"
							>
								Cek Status Pendaftaran
							</a>
						</div>
					</div>
				{:else}
					<h2 class="font-display text-xl font-extrabold text-stone-900">Formulir Pendaftaran</h2>
					<p class="mt-1 text-sm text-stone-500">
						Kolom bertanda <span class="text-accent-600">*</span> wajib diisi.
					</p>

					<form
						method="POST"
						class="mt-6 space-y-5"
						onsubmit={() => (memproses = true)}
						aria-busy={memproses}
					>
						<div>
							<label class="label" for="nama"
								>Nama lengkap <span class="text-accent-600">*</span></label
							>
							<input
								id="nama"
								name="nama"
								class="input {galat?.nama ? 'input-error' : ''}"
								required
								minlength="3"
								maxlength="100"
								placeholder="mis. Ahmad Fauzi"
								value={nilai.nama}
							/>
							{#if galat?.nama}<p class="error-text">{galat.nama}</p>{/if}
						</div>

						<fieldset>
							<legend class="label"
								>Jenis kelamin / organisasi <span class="text-accent-600">*</span></legend
							>
							<div class="grid gap-3 sm:grid-cols-2">
								<label
									class="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition {nilai.jenis_kelamin ===
									'L'
										? 'border-primary-600 bg-primary-50'
										: 'border-stone-200 hover:border-primary-300'}"
								>
									<input
										type="radio"
										name="jenis_kelamin"
										value="L"
										class="mt-1 accent-primary-700"
										checked={nilai.jenis_kelamin === 'L'}
										required
									/>
									<span>
										<span class="block text-sm font-bold text-stone-800">Putra — IPNU</span>
										<span class="block text-xs text-stone-500">Ikatan Pelajar Nahdlatul Ulama</span>
									</span>
								</label>
								<label
									class="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition {nilai.jenis_kelamin ===
									'P'
										? 'border-accent-600 bg-accent-50'
										: 'border-stone-200 hover:border-accent-300'}"
								>
									<input
										type="radio"
										name="jenis_kelamin"
										value="P"
										class="mt-1 accent-accent-700"
										checked={nilai.jenis_kelamin === 'P'}
										required
									/>
									<span>
										<span class="block text-sm font-bold text-stone-800">Putri — IPPNU</span>
										<span class="block text-xs text-stone-500"
											>Ikatan Pelajar Putri Nahdlatul Ulama</span
										>
									</span>
								</label>
							</div>
							{#if galat?.jenis_kelamin}<p class="error-text">{galat.jenis_kelamin}</p>{/if}
						</fieldset>

						<div class="grid gap-5 sm:grid-cols-2">
							<div>
								<label class="label" for="nis">NIS <span class="text-accent-600">*</span></label>
								<input
									id="nis"
									name="nis"
									class="input {galat?.nis ? 'input-error' : ''}"
									required
									minlength="4"
									maxlength="15"
									inputmode="numeric"
									pattern="[0-9]+"
									placeholder="mis. 2025001"
									value={nilai.nis}
								/>
								{#if galat?.nis}<p class="error-text">{galat.nis}</p>{/if}
							</div>
							<div>
								<label class="label" for="tanggal_lahir"
									>Tanggal lahir <span class="text-accent-600">*</span></label
								>
								<input
									id="tanggal_lahir"
									name="tanggal_lahir"
									type="date"
									class="input {galat?.tanggal_lahir ? 'input-error' : ''}"
									required
									max={hariIni()}
									value={nilai.tanggal_lahir}
								/>
								{#if galat?.tanggal_lahir}<p class="error-text">{galat.tanggal_lahir}</p>{/if}
							</div>
						</div>

						<div class="grid gap-5 sm:grid-cols-2">
							<div>
								<label class="label" for="kelas"
									>Tingkat kelas <span class="text-accent-600">*</span></label
								>
								<select
									id="kelas"
									name="kelas"
									class="input {galat?.kelas ? 'input-error' : ''}"
									required
								>
									{#each TINGKAT_KELAS as k (k)}
										<option value={k} selected={nilai.kelas === k}>{k}</option>
									{/each}
								</select>
								{#if galat?.kelas}<p class="error-text">{galat.kelas}</p>{/if}
							</div>
							<div>
								<label class="label" for="jurusan"
									>Jurusan <span class="text-accent-600">*</span></label
								>
								<select
									id="jurusan"
									name="jurusan"
									class="input {galat?.jurusan ? 'input-error' : ''}"
									required
								>
									{#each JURUSAN_SMK as j (j)}
										<option value={j} selected={nilai.jurusan === j}>{j}</option>
									{/each}
								</select>
								{#if galat?.jurusan}<p class="error-text">{galat.jurusan}</p>{/if}
							</div>
						</div>

						<div class="grid gap-5 sm:grid-cols-2">
							<div>
								<label class="label" for="no_hp"
									>Nomor HP / WhatsApp <span class="text-accent-600">*</span></label
								>
								<input
									id="no_hp"
									name="no_hp"
									class="input {galat?.no_hp ? 'input-error' : ''}"
									required
									inputmode="tel"
									placeholder="mis. 0812-3456-7890"
									value={nilai.no_hp}
								/>
								{#if galat?.no_hp}<p class="error-text">{galat.no_hp}</p>{/if}
							</div>
							<div>
								<label class="label" for="nama_ortu">Nama orang tua / wali</label>
								<input
									id="nama_ortu"
									name="nama_ortu"
									class="input"
									maxlength="100"
									placeholder="Opsional"
									value={nilai.nama_ortu}
								/>
							</div>
						</div>

						<div>
							<label class="label" for="alamat">Alamat domisili</label>
							<textarea
								id="alamat"
								name="alamat"
								rows="2"
								class="input"
								maxlength="200"
								placeholder="Opsional — mis. Dusun Krajan, Kedungreja">{nilai.alamat}</textarea
							>
						</div>

						<div>
							<label class="label" for="motivasi">Alasan / motivasi bergabung</label>
							<textarea
								id="motivasi"
								name="motivasi"
								rows="3"
								class="input"
								maxlength="500"
								placeholder="Opsional — ceritakan singkat mengapa kamu ingin bergabung"
								>{nilai.motivasi}</textarea
							>
						</div>

						<button class="btn btn-primary btn-lg w-full" type="submit" disabled={memproses}>
							{memproses ? 'Mengirim…' : 'Kirim Pendaftaran'}
						</button>
						<p class="text-center text-xs text-stone-400">
							Sudah pernah mendaftar? Cek perkembangannya di halaman
							<a href="/daftar/status" class="font-semibold text-primary-700 hover:underline"
								>Cek Status</a
							>.
						</p>
					</form>
				{/if}
			</div>
		</div>
	</div>
</section>
