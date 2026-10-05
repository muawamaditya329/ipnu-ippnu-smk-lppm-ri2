<script lang="ts">
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { hariIni, JURUSAN_SMK, TINGKAT_KELAS } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const galat = $derived(form?.galat ?? null);

	// Isian formulir disimpan sebagai state lokal yang di-bind:value — BUKAN
	// value={nilai.x} dari hasil server. Dgn atribut value={expr}, setiap
	// pembaruan state saat submit (tombol "Mengirim…") menimpa ulang ketikan
	// pengguna dgn nilai lama sehingga kolom terkirim kosong (pola sama yg
	// didokumentasikan di halaman Masuk). Password sengaja tidak punya state:
	// tidak pernah dikirim balik server saat galat.
	// svelte-ignore state_referenced_locally
	let nilai = $state(
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

<PageHeader
	kicker="Pendaftaran Anggota"
	title="Formulir Pendaftaran Anggota"
	desc="Dibuka untuk seluruh pelajar SMK LPPM RI 2 Kedungreja — putra mendaftar ke IPNU, putri ke IPPNU. Tanpa biaya apa pun; verifikasi dilakukan pengurus."
/>

<section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	<div class="grid gap-10 lg:grid-cols-12">
		<!-- Panel syarat: catatan kaki bernomor, bukan panel hijau -->
		<aside class="lg:col-span-4">
			<p class="kicker">Syarat Pendaftaran</p>
			<ol class="mt-3 divide-y divide-stone-200 border-y border-stone-200">
				{#each syarat as s, i (s)}
					<li class="flex items-start gap-3 py-3.5 text-sm leading-relaxed text-stone-700">
						<span class="rule-num shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
						<span>{s}</span>
					</li>
				{/each}
			</ol>

			<p class="kicker mt-9">Pilihan Organisasi</p>
			<div class="mt-3 space-y-2.5">
				<div class="aksen-ipnu border border-stone-200 bg-white px-4 py-3">
					<p class="font-display text-base font-bold text-stone-900">Putra &mdash; IPNU</p>
					<p class="mt-0.5 text-xs text-stone-500">Ikatan Pelajar Nahdlatul Ulama</p>
				</div>
				<div class="aksen-ippnu border border-stone-200 bg-white px-4 py-3">
					<p class="font-display text-base font-bold text-stone-900">Putri &mdash; IPPNU</p>
					<p class="mt-0.5 text-xs text-stone-500">Ikatan Pelajar Putri Nahdlatul Ulama</p>
				</div>
			</div>

			<p class="mt-9 border-l-2 border-stone-300 pl-3 text-xs leading-relaxed text-stone-500">
				Data yang kamu isikan hanya digunakan untuk keperluan keanggotaan komisariat dan disimpan
				secara aman. Pembinaan dipisah antara putra dan putri.
			</p>
		</aside>

		<!-- Formulir -->
		<div class="lg:col-span-8">
			<div class="card p-6 sm:p-8">
				{#if form?.sukses}
					<p class="kicker">Pendaftaran Terkirim</p>
					<h2 class="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
						Terima kasih, {form.nama}.
					</h2>
					<p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
						Data pendaftaranmu sudah kami terima dengan status
						<b class="text-stone-900">menunggu verifikasi</b>.
					</p>

					<!-- Lembar NIS: gaya arsip bergaris emas -->
					<div class="aksen-kas card mt-6 max-w-xl p-5">
						<p class="text-[11px] font-bold tracking-[0.08em] text-stone-400 uppercase">
							Nomor Induk Siswa (NIS) kamu
						</p>
						<p class="mt-1 font-mono text-2xl font-bold tracking-wide text-stone-900">
							{form.nis}
						</p>
						<p class="mt-2 text-xs leading-relaxed text-stone-500">
							Catat dan simpan angka ini — dibutuhkan untuk mengecek status pendaftaran dan menjadi
							nama akunmu saat masuk sebagai anggota. Jangan lupakan juga password yang barusan kamu
							buat.
						</p>
					</div>

					<p class="kicker mt-8">Langkah Selanjutnya</p>
					<ol class="mt-2 divide-y divide-stone-200 border-y border-stone-200">
						<li class="flex items-start gap-3 py-3.5 text-sm leading-relaxed text-stone-700">
							<span class="rule-num shrink-0 pt-0.5">01</span>
							<span>Pengurus memverifikasi pendaftaranmu, paling lama 3 hari kerja.</span>
						</li>
						<li class="flex items-start gap-3 py-3.5 text-sm leading-relaxed text-stone-700">
							<span class="rule-num shrink-0 pt-0.5">02</span>
							<span>
								Pantau status lewat halaman <b>Cek Status</b> menggunakan NIS
								<b class="font-mono">{form.nis}</b>.
							</span>
						</li>
						<li class="flex items-start gap-3 py-3.5 text-sm leading-relaxed text-stone-700">
							<span class="rule-num shrink-0 pt-0.5">03</span>
							<span>
								Bila disetujui, masuk sebagai anggota dengan <b>NIS</b> dan <b>password</b> yang kamu
								buat tadi — lewat tab <b>Anggota</b> di halaman <b>Masuk</b>. Kartu anggota digitalmu
								bisa dilihat dan dicetak dari dalam maupun halaman cek status.
							</span>
						</li>
					</ol>

					<div class="mt-6 flex flex-wrap gap-3">
						<a
							href="/daftar/status?nis={encodeURIComponent(form.nis)}"
							class="btn btn-primary btn-lg"
						>
							Cek Status Pendaftaran
						</a>
						<a href="/masuk?tab=anggota" class="btn btn-outline btn-lg">Halaman Masuk</a>
					</div>
				{:else}
					{#if form?.pesan}
						<div
							class="mb-5 border-l-2 border-gold-500 border-y border-r border-y-stone-200 border-r-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700"
							role="alert"
						>
							{form.pesan}
						</div>
					{/if}

					<h2 class="font-display text-xl font-bold tracking-tight text-stone-900">
						Formulir Pendaftaran
					</h2>
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
								bind:value={nilai.nama}
							/>
							{#if galat?.nama}<p class="error-text">{galat.nama}</p>{/if}
						</div>

						<fieldset>
							<legend class="label"
								>Jenis kelamin / organisasi <span class="text-accent-600">*</span></legend
							>
							<div class="grid gap-3 sm:grid-cols-2">
								<label
									class="flex cursor-pointer items-start gap-3 border bg-white p-3.5 transition {nilai
										.jenis_kelamin === 'L'
										? 'aksen-ipnu border-primary-800'
										: 'border-stone-200 hover:border-stone-400'}"
								>
									<input
										type="radio"
										name="jenis_kelamin"
										value="L"
										class="mt-1 accent-primary-700"
										bind:group={nilai.jenis_kelamin}
										required
									/>
									<span>
										<span class="block text-sm font-bold text-stone-800">Putra — IPNU</span>
										<span class="block text-xs text-stone-500">Ikatan Pelajar Nahdlatul Ulama</span>
									</span>
								</label>
								<label
									class="flex cursor-pointer items-start gap-3 border bg-white p-3.5 transition {nilai
										.jenis_kelamin === 'P'
										? 'aksen-ippnu border-accent-700'
										: 'border-stone-200 hover:border-stone-400'}"
								>
									<input
										type="radio"
										name="jenis_kelamin"
										value="P"
										class="mt-1 accent-accent-700"
										bind:group={nilai.jenis_kelamin}
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
									bind:value={nilai.nis}
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
									min="1990-01-01"
									max={hariIni()}
									bind:value={nilai.tanggal_lahir}
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
									bind:value={nilai.kelas}
								>
									{#each TINGKAT_KELAS as k (k)}
										<option value={k}>{k}</option>
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
									bind:value={nilai.jurusan}
								>
									{#each JURUSAN_SMK as j (j)}
										<option value={j}>{j}</option>
									{/each}
								</select>
								{#if galat?.jurusan}<p class="error-text">{galat.jurusan}</p>{/if}
							</div>
						</div>

						<!-- Akun masuk anggota: dipakai setelah pendaftaran disetujui pengurus -->
						<div class="border border-stone-200 bg-stone-50 p-4">
							<p class="text-[11px] font-bold tracking-[0.08em] text-stone-500 uppercase">
								Akun Masuk Anggota
							</p>
							<div class="mt-3 grid gap-5 sm:grid-cols-2">
								<div>
									<label class="label" for="password"
										>Password <span class="text-accent-600">*</span></label
									>
									<input
										id="password"
										name="password"
										type="password"
										class="input {galat?.password ? 'input-error' : ''}"
										required
										minlength="6"
										maxlength="128"
										autocomplete="new-password"
										placeholder="Minimal 6 karakter"
									/>
									{#if galat?.password}<p class="error-text">{galat.password}</p>{/if}
								</div>
								<div>
									<label class="label" for="password_konfirmasi"
										>Konfirmasi Password <span class="text-accent-600">*</span></label
									>
									<input
										id="password_konfirmasi"
										name="password_konfirmasi"
										type="password"
										class="input {galat?.password_konfirmasi ? 'input-error' : ''}"
										required
										minlength="6"
										maxlength="128"
										autocomplete="new-password"
										placeholder="Ulangi password yang sama"
									/>
									{#if galat?.password_konfirmasi}
										<p class="error-text">{galat.password_konfirmasi}</p>
									{/if}
								</div>
							</div>
							<p class="hint mt-3">
								Dipakai untuk masuk sebagai anggota setelah pendaftaranmu disetujui pengurus — lewat
								tab <b>Anggota</b> di halaman Masuk, dengan NIS sebagai nama akunmu.
							</p>
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
									bind:value={nilai.no_hp}
								/>
								{#if galat?.no_hp}<p class="error-text">{galat.no_hp}</p>{/if}
							</div>
							<div>
								<label class="label" for="nama_ortu">Nama orang tua / wali</label>
								<input
									id="nama_ortu"
									name="nama_ortu"
									class="input {galat?.nama_ortu ? 'input-error' : ''}"
									maxlength="100"
									placeholder="Opsional"
									bind:value={nilai.nama_ortu}
								/>
								{#if galat?.nama_ortu}<p class="error-text">{galat.nama_ortu}</p>{/if}
							</div>
						</div>

						<div>
							<label class="label" for="alamat">Alamat domisili</label>
							<textarea
								id="alamat"
								name="alamat"
								rows="2"
								class="input {galat?.alamat ? 'input-error' : ''}"
								maxlength="200"
								placeholder="Opsional — mis. Dusun Krajan, Kedungreja"
								bind:value={nilai.alamat}></textarea>
							{#if galat?.alamat}<p class="error-text">{galat.alamat}</p>{/if}
						</div>

						<div>
							<label class="label" for="motivasi">Alasan / motivasi bergabung</label>
							<textarea
								id="motivasi"
								name="motivasi"
								rows="3"
								class="input {galat?.motivasi ? 'input-error' : ''}"
								maxlength="500"
								placeholder="Opsional — ceritakan singkat mengapa kamu ingin bergabung"
								bind:value={nilai.motivasi}></textarea>
							{#if galat?.motivasi}<p class="error-text">{galat.motivasi}</p>{/if}
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
