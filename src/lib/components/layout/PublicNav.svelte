<script lang="ts">
	import { page } from '$app/state';
	import { Menu, X } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';

	let {
		user = null,
		anggota = null
	}: { user?: { nama: string } | null; anggota?: { nama: string } | null } = $props();

	const tautan = [
		{ href: '/', label: 'Beranda' },
		{ href: '/berita', label: 'Berita' },
		{ href: '/agenda', label: 'Agenda' },
		{ href: '/galeri', label: 'Galeri' },
		{ href: '/dokumen', label: 'Dokumen' },
		{ href: '/tentang', label: 'Tentang' }
	];

	let terbuka = $state(false);

	const aktif = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<!-- Bilah atas tegas: kertas putih, garis bawah 2px hijau tinta — seperti kop dokumen resmi. -->
<header class="sticky top-0 z-40 border-b-2 border-primary-800 bg-white">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
		<Logo size={38} />

		<nav class="hidden items-center gap-7 whitespace-nowrap lg:flex" aria-label="Navigasi utama">
			{#each tautan as t (t.href)}
				<a
					href={t.href}
					class="text-sm font-semibold transition {aktif(t.href)
						? 'text-primary-900 underline decoration-primary-800 decoration-2 underline-offset-8'
						: 'text-stone-600 hover:text-stone-900'}"
					aria-current={aktif(t.href) ? 'page' : undefined}
				>
					{t.label}
				</a>
			{/each}
		</nav>

		<div class="hidden items-center gap-2 whitespace-nowrap lg:flex">
			{#if user}
				<span class="max-w-[12rem] truncate text-sm font-semibold text-stone-700" title={user.nama}>
					{user.nama}
				</span>
				<a href="/admin" class="btn btn-ghost">Dasbor</a>
				<form method="POST" action="/keluar">
					<button class="btn btn-outline btn-sm" type="submit">Keluar</button>
				</form>
			{:else if anggota}
				<span
					class="max-w-[12rem] truncate text-sm font-semibold text-stone-700"
					title={anggota.nama}
				>
					{anggota.nama}
				</span>
				<a href="/anggota" class="btn btn-ghost">Area Anggota</a>
				<form method="POST" action="/keluar">
					<button class="btn btn-outline btn-sm" type="submit">Keluar</button>
				</form>
			{:else}
				<a href="/masuk?tab=anggota" class="btn btn-ghost hidden xl:inline-flex">Masuk Anggota</a>
				<a href="/masuk" class="btn btn-outline">Masuk Pengurus</a>
				<a href="/daftar" class="btn btn-gold">Daftar Anggota</a>
			{/if}
		</div>

		<button
			class="rounded-md p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
			onclick={() => (terbuka = !terbuka)}
			aria-label={terbuka ? 'Tutup menu' : 'Buka menu'}
			aria-expanded={terbuka}
		>
			{#if terbuka}<X class="h-6 w-6" />{:else}<Menu class="h-6 w-6" />{/if}
		</button>
	</div>

	{#if terbuka}
		<nav
			class="border-t border-stone-200 bg-white px-4 pt-2 pb-4 lg:hidden"
			aria-label="Navigasi seluler"
		>
			{#each tautan as t (t.href)}
				<a
					href={t.href}
					onclick={() => (terbuka = false)}
					class="block border-l-2 px-3 py-2.5 text-sm font-semibold {aktif(t.href)
						? 'border-primary-800 bg-stone-50 text-primary-900'
						: 'border-transparent text-stone-700 hover:bg-stone-50'}"
				>
					{t.label}
				</a>
			{/each}
			<div class="mt-3 flex gap-2">
				{#if user}
					<a href="/admin" class="btn btn-outline flex-1" onclick={() => (terbuka = false)}>
						Dasbor
					</a>
					<form method="POST" action="/keluar" class="flex-1">
						<button class="btn btn-primary w-full" type="submit">Keluar</button>
					</form>
				{:else if anggota}
					<a href="/anggota" class="btn btn-outline flex-1" onclick={() => (terbuka = false)}>
						Area Anggota
					</a>
					<form method="POST" action="/keluar" class="flex-1">
						<button class="btn btn-primary w-full" type="submit">Keluar</button>
					</form>
				{:else}
					<a
						href="/masuk?tab=anggota"
						class="btn btn-outline flex-1"
						onclick={() => (terbuka = false)}
					>
						Masuk
					</a>
					<a href="/daftar" class="btn btn-gold flex-1" onclick={() => (terbuka = false)}>
						Daftar
					</a>
				{/if}
			</div>
		</nav>
	{/if}
</header>
