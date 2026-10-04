<script lang="ts">
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		Users,
		Newspaper,
		CalendarDays,
		Wallet,
		Images,
		FileText,
		Settings2,
		UserCog,
		LogOut,
		X
	} from '@lucide/svelte';
	import type { User } from '#lib/server/db.ts';

	let { user, open = $bindable(false) }: { user: User; open?: boolean } = $props();

	const menu = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/anggota', label: 'Anggota', icon: Users },
		{ href: '/admin/berita', label: 'Berita', icon: Newspaper },
		{ href: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
		{ href: '/admin/kas', label: 'Kas & Iuran', icon: Wallet },
		{ href: '/admin/galeri', label: 'Galeri', icon: Images },
		{ href: '/admin/dokumen', label: 'Dokumen', icon: FileText },
		{ href: '/admin/pengguna', label: 'Pengguna', icon: UserCog, hanyaAdmin: true },
		{ href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings2 }
	];

	const aktif = (href: string) =>
		href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
</script>

{#if open}
	<button
		class="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm lg:hidden"
		onclick={() => (open = false)}
		aria-label="Tutup menu"
	></button>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary-950 text-primary-100 transition-transform duration-200 lg:translate-x-0 {open
		? 'translate-x-0'
		: '-translate-x-full'}"
	aria-label="Menu admin"
>
	<div class="flex items-center justify-between px-5 py-5">
		<a href="/admin" class="flex items-center gap-2.5">
			<svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
				<rect x="1" y="1" width="46" height="46" rx="12" fill="#ffffff" fill-opacity="0.12" />
				<path d="M24 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#ffffff" />
				<circle cx="24" cy="24" r="4.5" fill="#f59e0b" />
			</svg>
			<div class="leading-tight">
				<p class="font-display text-sm font-extrabold text-white">Dasbor Pengurus</p>
				<p class="text-[11px] text-primary-300">IPNU · IPPNU LPPM 2</p>
			</div>
		</a>
		<button class="rounded-lg p-1.5 text-primary-300 hover:bg-white/10 lg:hidden" onclick={() => (open = false)} aria-label="Tutup menu">
			<X class="h-5 w-5" />
		</button>
	</div>

	<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2">
		{#each menu as m (m.href)}
			{#if !m.hanyaAdmin || user.role === 'admin'}
				<a
					href={m.href}
					onclick={() => (open = false)}
					class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition {aktif(m.href)
						? 'bg-white text-primary-900 shadow-sm'
						: 'text-primary-200 hover:bg-white/10 hover:text-white'}"
					aria-current={aktif(m.href) ? 'page' : undefined}
				>
					<m.icon class="h-[18px] w-[18px]" />
					{m.label}
				</a>
			{/if}
		{/each}
	</nav>

	<div class="border-t border-white/10 p-4">
		<div class="mb-3 flex items-center gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 font-display text-sm font-extrabold text-primary-950">
				{user.nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]?.toUpperCase()).join('')}
			</div>
			<div class="min-w-0 leading-tight">
				<p class="truncate text-sm font-bold text-white">{user.nama}</p>
				<p class="text-xs text-primary-300 capitalize">{user.role === 'admin' ? 'Admin' : 'Pengurus'}</p>
			</div>
		</div>
		<a href="/" class="mb-1.5 block rounded-lg px-3 py-2 text-xs font-semibold text-primary-200 transition hover:bg-white/10 hover:text-white">
			← Lihat website publik
		</a>
		<form method="POST" action="/keluar">
			<button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-accent-300 transition hover:bg-white/10">
				<LogOut class="h-4 w-4" /> Keluar
			</button>
		</form>
	</div>
</aside>
