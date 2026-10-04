<script lang="ts">
	import { page } from '$app/state';
	import { Menu, X } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';

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

<header class="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
		<Logo size={38} />

		<nav class="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
			{#each tautan as t (t.href)}
				<a
					href={t.href}
					class="rounded-lg px-3 py-2 text-sm font-semibold transition {aktif(t.href)
						? 'bg-primary-50 text-primary-700'
						: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}"
					aria-current={aktif(t.href) ? 'page' : undefined}
				>
					{t.label}
				</a>
			{/each}
		</nav>

		<div class="hidden items-center gap-2 lg:flex">
			<a href="/masuk" class="btn btn-ghost">Masuk Pengurus</a>
			<a href="/daftar" class="btn btn-primary">Daftar Anggota</a>
		</div>

		<button
			class="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
			onclick={() => (terbuka = !terbuka)}
			aria-label={terbuka ? 'Tutup menu' : 'Buka menu'}
			aria-expanded={terbuka}
		>
			{#if terbuka}<X class="h-6 w-6" />{:else}<Menu class="h-6 w-6" />{/if}
		</button>
	</div>

	{#if terbuka}
		<nav class="border-t border-stone-200 bg-white px-4 pt-2 pb-4 lg:hidden" aria-label="Navigasi seluler">
			{#each tautan as t (t.href)}
				<a
					href={t.href}
					onclick={() => (terbuka = false)}
					class="block rounded-lg px-3 py-2.5 text-sm font-semibold {aktif(t.href)
						? 'bg-primary-50 text-primary-700'
						: 'text-stone-700 hover:bg-stone-100'}"
				>
					{t.label}
				</a>
			{/each}
			<div class="mt-3 flex gap-2">
				<a href="/masuk" class="btn btn-outline flex-1" onclick={() => (terbuka = false)}>Masuk</a>
				<a href="/daftar" class="btn btn-primary flex-1" onclick={() => (terbuka = false)}>Daftar</a>
			</div>
		</nav>
	{/if}
</header>
