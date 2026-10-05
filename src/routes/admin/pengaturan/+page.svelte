<script lang="ts">
	import { CheckCircle2, Save } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let memproses = $state(false);

	// Nilai form disimpan di state dan di-bind ke tiap kolom (bind:value) — bukan
	// sekadar atribut value statis — supaya ketikan pengurus tidak ter-reset saat
	// tombol submit berubah "disabled" (onsubmit memicu render ulang sebelum form
	// dikirim). Nilai awal dan nilai setelah simpan/validasi gagal datang dari server.
	// Sengaja ambil nilai awal; sinkronisasi
	// setelah simpan/validasi gagal ditangani $effect di bawah.
	// svelte-ignore state_referenced_locally
	let v = $state({ ...data.setelan });
	$effect(() => {
		Object.assign(v, form?.nilai ?? data.setelan);
	});
</script>

<svelte:head><title>Pengaturan Organisasi — Dasbor</title></svelte:head>

<div class="mb-6">
	<h1 class="font-display text-2xl font-extrabold text-stone-900">Pengaturan Organisasi</h1>
	<p class="mt-1 text-sm text-stone-500">
		Identitas, profil, dan kontak organisasi yang tampil di halaman publik website.
	</p>
</div>

{#if form?.sukses}
	<div
		class="mb-5 flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
		role="status"
	>
		<CheckCircle2 class="h-4 w-4 shrink-0" /> Pengaturan tersimpan.
	</div>
{/if}

<form method="POST" action="?/simpan" class="space-y-6" onsubmit={() => (memproses = true)}>
	<!-- Identitas -->
	<div class="card p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-stone-900">Identitas</h2>
		<div class="space-y-4">
			<div>
				<label class="label" for="s-nama"
					>Nama organisasi <span class="text-accent-600">*</span></label
				>
				<input
					id="s-nama"
					name="nama_organisasi"
					required
					maxlength="150"
					bind:value={v.nama_organisasi}
					class="input {form?.galat?.nama_organisasi ? 'input-error' : ''}"
				/>
				{#if form?.galat?.nama_organisasi}<p class="error-text">
						{form.galat.nama_organisasi}
					</p>{/if}
			</div>

			<div>
				<label class="label" for="s-periode">Periode kepengurusan</label>
				<input
					id="s-periode"
					name="periode"
					maxlength="40"
					bind:value={v.periode}
					class="input {form?.galat?.periode ? 'input-error' : ''}"
				/>
				<p class="hint">contoh: 2025 / 2026</p>
				{#if form?.galat?.periode}<p class="error-text">{form.galat.periode}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-deskripsi">Deskripsi singkat</label>
				<textarea
					id="s-deskripsi"
					name="deskripsi"
					rows="3"
					maxlength="300"
					class="input {form?.galat?.deskripsi ? 'input-error' : ''}"
					placeholder="Tampil di halaman depan &amp; hasil pencarian"
					bind:value={v.deskripsi}></textarea>
				{#if form?.galat?.deskripsi}<p class="error-text">{form.galat.deskripsi}</p>{/if}
			</div>
		</div>
	</div>

	<!-- Profil & Konten -->
	<div class="card p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-stone-900">Profil &amp; Konten</h2>
		<div class="space-y-4">
			<div>
				<label class="label" for="s-visi">Visi</label>
				<textarea
					id="s-visi"
					name="visi"
					rows="3"
					class="input {form?.galat?.visi ? 'input-error' : ''}"
					bind:value={v.visi}></textarea>
				{#if form?.galat?.visi}<p class="error-text">{form.galat.visi}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-misi">Misi</label>
				<textarea
					id="s-misi"
					name="misi"
					rows="6"
					class="input {form?.galat?.misi ? 'input-error' : ''}"
					bind:value={v.misi}></textarea>
				<p class="hint">Satu baris = satu poin misi.</p>
				{#if form?.galat?.misi}<p class="error-text">{form.galat.misi}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-tentang">Tentang (versi panjang)</label>
				<textarea
					id="s-tentang"
					name="tentang_panjang"
					rows="10"
					class="input {form?.galat?.tentang_panjang ? 'input-error' : ''}"
					placeholder="Profil lengkap organisasi, tampil di halaman Tentang"
					bind:value={v.tentang_panjang}></textarea>
				<p class="hint">Baris kosong memisahkan paragraf pada halaman Tentang.</p>
				{#if form?.galat?.tentang_panjang}<p class="error-text">
						{form.galat.tentang_panjang}
					</p>{/if}
			</div>
		</div>
	</div>

	<!-- Kontak & Sosial -->
	<div class="card p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-stone-900">Kontak &amp; Sosial</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label class="label" for="s-alamat">Alamat</label>
				<input
					id="s-alamat"
					name="alamat"
					maxlength="200"
					bind:value={v.alamat}
					class="input {form?.galat?.alamat ? 'input-error' : ''}"
				/>
				{#if form?.galat?.alamat}<p class="error-text">{form.galat.alamat}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-telp">No. telepon</label>
				<input
					id="s-telp"
					name="no_telp"
					maxlength="30"
					bind:value={v.no_telp}
					class="input {form?.galat?.no_telp ? 'input-error' : ''}"
				/>
				{#if form?.galat?.no_telp}<p class="error-text">{form.galat.no_telp}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-email">Email</label>
				<input
					id="s-email"
					name="email"
					type="email"
					maxlength="100"
					bind:value={v.email}
					class="input {form?.galat?.email ? 'input-error' : ''}"
				/>
				{#if form?.galat?.email}<p class="error-text">{form.galat.email}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-instagram">Instagram</label>
				<input
					id="s-instagram"
					name="instagram"
					maxlength="60"
					bind:value={v.instagram}
					class="input {form?.galat?.instagram ? 'input-error' : ''}"
					placeholder="mis. ipnuippnu_lppm2"
				/>
				<p class="hint">username tanpa @</p>
				{#if form?.galat?.instagram}<p class="error-text">{form.galat.instagram}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-youtube">YouTube</label>
				<input
					id="s-youtube"
					name="youtube"
					maxlength="100"
					bind:value={v.youtube}
					class="input {form?.galat?.youtube ? 'input-error' : ''}"
					placeholder="mis. ipnuippnulppm2"
				/>
				<p class="hint">nama channel tanpa @</p>
				{#if form?.galat?.youtube}<p class="error-text">{form.galat.youtube}</p>{/if}
			</div>

			<div>
				<label class="label" for="s-tiktok">TikTok</label>
				<input
					id="s-tiktok"
					name="tiktok"
					maxlength="60"
					bind:value={v.tiktok}
					class="input {form?.galat?.tiktok ? 'input-error' : ''}"
					placeholder="mis. ipnuippnu.lppm2"
				/>
				<p class="hint">username tanpa @</p>
				{#if form?.galat?.tiktok}<p class="error-text">{form.galat.tiktok}</p>{/if}
			</div>
		</div>
		<p class="hint mt-4">Kolom sosial media boleh dikosongkan bila belum dimiliki.</p>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href="/admin" class="btn btn-ghost">Kembali ke Dasbor</a>
		<button class="btn btn-primary btn-lg" type="submit" disabled={memproses}>
			<Save class="h-4 w-4" />
			{memproses ? 'Menyimpan…' : 'Simpan Pengaturan'}
		</button>
	</div>
</form>
