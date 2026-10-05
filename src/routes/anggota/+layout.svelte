<script lang="ts">
	import { LogOut } from '@lucide/svelte';
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import { LABEL_STATUS_MEMBER, toneStatusMember } from '#lib/utils.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Navigasi ringkas khas area anggota — bukan AdminSidebar.
	const menu = [
		{ href: '/anggota', label: 'Dasbor' },
		{ href: '/anggota/profil', label: 'Profil Saya' }
	];
</script>

<svelte:head>
	<title>Area Anggota — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-stone-50">
	<header class="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
			<div class="flex min-w-0 items-center gap-3">
				<Logo size={34} teks={false} />
				<div class="min-w-0">
					<p class="truncate text-sm font-bold text-stone-900" title={data.anggota.nama}>
						{data.anggota.nama}
					</p>
					<p class="text-[11px] font-medium text-stone-500">Area Anggota</p>
				</div>
				<Badge tone={toneStatusMember(data.anggota.status)}>
					{LABEL_STATUS_MEMBER[data.anggota.status] ?? data.anggota.status}
				</Badge>
			</div>

			<!-- Keluar memakai endpoint bersama /keluar: menghapus sesi anggota maupun pengurus. -->
			<form method="POST" action="/keluar" class="shrink-0">
				<button class="btn btn-outline btn-sm" type="submit">
					<LogOut class="h-4 w-4" />
					<span class="hidden sm:inline">Keluar</span>
				</button>
			</form>
		</div>

		<nav class="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6" aria-label="Menu anggota">
			{#each menu as m (m.href)}
				<a
					href={m.href}
					aria-current={page.url.pathname === m.href ? 'page' : undefined}
					class="-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition {page.url
						.pathname === m.href
						? 'border-primary-700 text-primary-800'
						: 'border-transparent text-stone-500 hover:text-stone-900'}"
				>
					{m.label}
				</a>
			{/each}
		</nav>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>

	<footer class="border-t border-stone-200 py-5">
		<p class="mx-auto max-w-5xl px-4 text-xs text-stone-400 sm:px-6">
			Komisariat IPNU &amp; IPPNU SMK LPPM RI 2 Kedungreja — area privat anggota.
		</p>
	</footer>
</div>
