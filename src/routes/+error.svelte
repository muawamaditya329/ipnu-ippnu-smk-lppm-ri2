<script lang="ts">
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
	<Logo size={52} teks={false} />
	<p class="mt-6 font-display text-7xl font-bold text-primary-900">{page.status}</p>
	<h1 class="mt-2 font-display text-xl font-bold text-stone-800">
		{page.status === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kendala'}
	</h1>
	<p class="mt-2 max-w-md text-sm text-stone-500">
		{page.status === 404
			? 'Halaman yang Anda cari mungkin sudah dipindahkan atau dihapus.'
			: (page.error?.message ?? 'Silakan coba beberapa saat lagi.')}
	</p>
	<a href="/" class="btn btn-primary mt-6">Kembali ke Beranda</a>
</div>
