<script lang="ts">
	import { Save } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Nilai awal dari aksi yang gagal (biar ketikan tidak hilang); kalau tidak,
	// dari database. svelte-ignore: state lokal hanya dibaca saat inisialisasi.
	// svelte-ignore state_referenced_locally
	let noHp = $state(form?.nilai?.no_hp ?? data.profil.no_hp ?? '');
	// svelte-ignore state_referenced_locally
	let alamat = $state(form?.nilai?.alamat ?? data.profil.alamat ?? '');

	// Isian password tidak pernah dikembalikan server (tidak di-echo ke HTML) —
	// kosongkan sendiri setelah berhasil diganti.
	let lama = $state('');
	let baru = $state('');
	let konfirmasi = $state('');
	$effect(() => {
		if (form?.sukses === 'password') {
			lama = '';
			baru = '';
			konfirmasi = '';
		}
	});
</script>

<svelte:head>
	<title>Profil Saya — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<h1 class="font-display text-2xl font-extrabold tracking-tight text-stone-900">Profil Saya</h1>
<p class="mt-1 text-sm text-stone-500">
	Perbarui kontak yang bisa dihubungi, dan jaga passwordmu tetap rahasia.
</p>

<div class="mt-6 grid gap-6 lg:grid-cols-12">
	<!-- Kontak & alamat -->
	<section class="card p-6 lg:col-span-7" aria-label="Ubah kontak">
		<h2 class="font-display text-lg font-bold text-stone-900">Kontak &amp; Alamat</h2>

		{#if form?.sukses === 'kontak'}
			<div
				class="aksen-ipnu mt-4 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700"
				role="status"
			>
				Kontak berhasil disimpan.
			</div>
		{/if}

		<form method="POST" action="?/kontak" class="mt-5 space-y-4">
			<div>
				<label class="label" for="no_hp">No. HP</label>
				<input
					id="no_hp"
					name="no_hp"
					type="tel"
					inputmode="tel"
					maxlength="30"
					class="input {form?.galat?.no_hp ? 'input-error' : ''}"
					placeholder="mis. 0812-3456-7890"
					bind:value={noHp}
				/>
				{#if form?.galat?.no_hp}
					<p class="error-text">{form.galat.no_hp}</p>
				{:else}
					<p class="hint">Kosongkan bila tidak ingin mencantumkannya.</p>
				{/if}
			</div>

			<div>
				<label class="label" for="alamat">Alamat</label>
				<textarea
					id="alamat"
					name="alamat"
					rows="3"
					maxlength="200"
					class="input {form?.galat?.alamat ? 'input-error' : ''}"
					placeholder="Dusun/Kelurahan, Kedungreja"
					bind:value={alamat}></textarea>
				{#if form?.galat?.alamat}
					<p class="error-text">{form.galat.alamat}</p>
				{:else}
					<p class="hint">Maksimal 200 karakter.</p>
				{/if}
			</div>

			<button class="btn btn-primary" type="submit">
				<Save class="h-4 w-4" />
				Simpan Kontak
			</button>
			<p class="hint">Nama, NIS, kelas, dan status keanggotaan hanya dapat diubah pengurus.</p>
		</form>
	</section>

	<!-- Ganti password -->
	<section class="card p-6 lg:col-span-5" aria-label="Ganti password">
		<h2 class="font-display text-lg font-bold text-stone-900">Ganti Password</h2>

		{#if form?.sukses === 'password'}
			<div
				class="aksen-ipnu mt-4 border-y border-r border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700"
				role="status"
			>
				Password berhasil diganti. Sesi di perangkat lain telah dikeluarkan.
			</div>
		{/if}

		<form method="POST" action="?/password" class="mt-5 space-y-4">
			<div>
				<label class="label" for="password_lama">Password Lama</label>
				<input
					id="password_lama"
					name="password_lama"
					type="password"
					required
					autocomplete="current-password"
					class="input {form?.galat?.password_lama ? 'input-error' : ''}"
					bind:value={lama}
				/>
				{#if form?.galat?.password_lama}
					<p class="error-text">{form.galat.password_lama}</p>
				{/if}
			</div>

			<div>
				<label class="label" for="password_baru">Password Baru</label>
				<input
					id="password_baru"
					name="password_baru"
					type="password"
					required
					minlength="6"
					autocomplete="new-password"
					class="input {form?.galat?.password_baru ? 'input-error' : ''}"
					bind:value={baru}
				/>
				{#if form?.galat?.password_baru}
					<p class="error-text">{form.galat.password_baru}</p>
				{:else}
					<p class="hint">Minimal 6 karakter.</p>
				{/if}
			</div>

			<div>
				<label class="label" for="konfirmasi">Konfirmasi Password Baru</label>
				<input
					id="konfirmasi"
					name="konfirmasi"
					type="password"
					required
					autocomplete="new-password"
					class="input {form?.galat?.konfirmasi ? 'input-error' : ''}"
					bind:value={konfirmasi}
				/>
				{#if form?.galat?.konfirmasi}
					<p class="error-text">{form.galat.konfirmasi}</p>
				{/if}
			</div>

			<button class="btn btn-primary" type="submit">Ganti Password</button>
		</form>
	</section>
</div>
