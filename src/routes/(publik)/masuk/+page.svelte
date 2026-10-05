<script lang="ts">
	import PageHeader from '#lib/components/layout/PageHeader.svelte';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let memproses = $state(false);
	// Tab aktif mengikuti ?tab= (tanpa JS — pindah tab = tautan biasa). Aksi yang
	// gagal mengembalikan `tab` miliknya supaya pesan galat tampil di tab yang tepat.
	let tab = $derived(
		form?.tab === 'anggota' || form?.tab === 'pengurus'
			? form.tab
			: page.url.searchParams.get('tab') === 'anggota'
				? 'anggota'
				: 'pengurus'
	);

	// Nilai awal dari aksi yang gagal (username/NIS diisi ulang); bind:value supaya
	// ketikan pengguna tidak tertimpa ulang saat state berubah saat submit.
	// svelte-ignore state_referenced_locally
	let namaPengguna = $state(form?.username ?? '');
	// svelte-ignore state_referenced_locally
	let nisAnggota = $state(form?.nis ?? '');

	// Param URL saat ini (mis. ?lanjut=/admin/berita) dibawa ke aksi pengurus
	// supaya setelah login tetap diteruskan ke halaman semula.
	const paramUrl = page.url.searchParams.toString();
	const aksiPengurus = `?/pengurus${paramUrl ? `&${paramUrl}` : ''}`;
</script>

<svelte:head>
	<title>Masuk — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<PageHeader
	kicker="Akun"
	title="Masuk"
	desc="Pengurus memasuki dasbor administrasi; anggota membuka kartu dan data keanggotaan dengan NIS."
/>

<section class="mx-auto max-w-md px-4 py-10 sm:px-6">
	<div class="card p-7 sm:p-8">
		<!-- Dua tab tanpa JS: pindah tab = tautan ?tab=, bukan JavaScript. -->
		<div class="grid grid-cols-2 border-b border-stone-200" role="tablist" aria-label="Jenis akun">
			<a
				href="/masuk"
				class="-mb-px border-b-2 px-3 py-2.5 text-center text-sm font-semibold transition {tab ===
				'pengurus'
					? 'border-primary-800 text-primary-800'
					: 'border-transparent text-stone-500 hover:text-stone-900'}"
				role="tab"
				aria-selected={tab === 'pengurus'}
				aria-current={tab === 'pengurus' ? 'page' : undefined}
			>
				Pengurus
			</a>
			<a
				href="/masuk?tab=anggota"
				class="-mb-px border-b-2 px-3 py-2.5 text-center text-sm font-semibold transition {tab ===
				'anggota'
					? 'border-primary-800 text-primary-800'
					: 'border-transparent text-stone-500 hover:text-stone-900'}"
				role="tab"
				aria-selected={tab === 'anggota'}
				aria-current={tab === 'anggota' ? 'page' : undefined}
			>
				Anggota
			</a>
		</div>

		{#if form?.pesan}
			<div
				class="mt-5 border-l-2 border-accent-700 border-y border-r border-y-stone-200 border-r-stone-200 bg-white px-4 py-3 text-sm font-medium text-accent-700"
				role="alert"
			>
				{form.pesan}
			</div>
		{/if}

		{#if tab === 'anggota'}
			<!-- Param tab=anggota dipertahankan pada URL aksi supaya tab tetap aktif bila login gagal. -->
			<form
				method="POST"
				action="?/anggota&tab=anggota"
				class="mt-6 space-y-4"
				onsubmit={() => (memproses = true)}
			>
				<div>
					<label class="label" for="nis">NIS</label>
					<input
						id="nis"
						name="nis"
						type="text"
						required
						inputmode="numeric"
						autocomplete="username"
						class="input"
						placeholder="Nomor Induk Siswa"
						bind:value={nisAnggota}
					/>
				</div>
				<div>
					<label class="label" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
						class="input"
						placeholder="••••••••"
					/>
				</div>
				<button class="btn btn-primary btn-lg w-full" type="submit" disabled={memproses}>
					{memproses ? 'Memeriksa…' : 'Masuk'}
				</button>
			</form>
		{:else}
			<form
				method="POST"
				action={aksiPengurus}
				class="mt-6 space-y-4"
				onsubmit={() => (memproses = true)}
			>
				<div>
					<label class="label" for="username">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						autocomplete="username"
						class="input"
						placeholder="mis. admin"
						bind:value={namaPengguna}
					/>
				</div>
				<div>
					<label class="label" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
						class="input"
						placeholder="••••••••"
					/>
				</div>
				<button class="btn btn-primary btn-lg w-full" type="submit" disabled={memproses}>
					{memproses ? 'Memeriksa…' : 'Masuk ke Dasbor'}
				</button>
			</form>
		{/if}
	</div>

	<p class="mt-6 border-l-2 border-stone-300 pl-3 text-xs leading-relaxed text-stone-500">
		Belum terdaftar sebagai anggota? Isi formulir di halaman
		<a href="/daftar" class="font-semibold text-primary-700 hover:underline">Pendaftaran Anggota</a>.
		Lupa akses? Hubungi admin komisariat atau pembina.
	</p>
</section>
