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
		ArrowLeft,
		X
	} from '@lucide/svelte';
	import type { User } from '#lib/server/db.ts';

	let { user, open = $bindable(false) }: { user: User; open?: boolean } = $props();

	const menu = [
		{ href: '/admin', label: 'Dasbor', icon: LayoutDashboard },
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
		class="fixed inset-0 z-40 bg-stone-900/50 lg:hidden"
		onclick={() => (open = false)}
		aria-label="Tutup menu"
	></button>
{/if}

<!-- Panel samping kertas: putih + garis 1px; item aktif = garis kiri 2px hijau tinta + latar stone-100. -->
<aside
	class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200 bg-white transition-transform duration-200 lg:translate-x-0 {open
		? 'translate-x-0'
		: '-translate-x-full'}"
	aria-label="Menu admin"
>
	<div class="flex items-center justify-between border-b border-stone-200 px-5 py-4">
		<a href="/admin" class="flex items-center gap-2.5">
			<svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
				<rect x="1" y="1" width="46" height="46" rx="10" fill="#065f46" />
				<rect
					x="1.5"
					y="1.5"
					width="45"
					height="45"
					rx="9.5"
					fill="none"
					stroke="#022c22"
					stroke-width="1"
				/>
				<path d="M24 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#ffffff" fill-opacity="0.97" />
				<circle cx="24" cy="24" r="4.5" fill="#b91c1c" />
			</svg>
			<div class="leading-tight">
				<p class="text-sm font-bold text-stone-900">Dasbor Pengurus</p>
				<p class="text-[10px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
					IPNU &middot; IPPNU LPPM 2
				</p>
			</div>
		</a>
		<button
			class="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 lg:hidden"
			onclick={() => (open = false)}
			aria-label="Tutup menu"
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 py-4">
		<ul class="space-y-0.5">
			{#each menu as m (m.href)}
				{#if !m.hanyaAdmin || user.role === 'admin'}
					<li>
						<a
							href={m.href}
							onclick={() => (open = false)}
							class="flex items-center gap-3 border-l-2 px-3.5 py-2.5 text-sm font-semibold transition {aktif(
								m.href
							)
								? 'border-primary-800 bg-stone-100 text-primary-900'
								: 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'}"
							aria-current={aktif(m.href) ? 'page' : undefined}
						>
							<m.icon class="h-[18px] w-[18px]" />
							{m.label}
						</a>
					</li>
				{/if}
			{/each}
		</ul>
	</nav>

	<div class="border-t border-stone-200 p-4">
		<div class="mb-3 flex items-center gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-800 text-sm font-bold text-white"
			>
				{user.nama
					.trim()
					.split(/\s+/)
					.slice(0, 2)
					.map((k) => k[0]?.toUpperCase())
					.join('')}
			</div>
			<div class="min-w-0 leading-tight">
				<p class="truncate text-sm font-bold text-stone-900">{user.nama}</p>
				<p class="text-xs text-stone-500">{user.role === 'admin' ? 'Admin' : 'Pengurus'}</p>
			</div>
		</div>
		<a
			href="/"
			class="mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
		>
			<ArrowLeft class="h-3.5 w-3.5" /> Lihat website publik
		</a>
		<form method="POST" action="/keluar">
			<button
				class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold text-accent-700 transition hover:bg-accent-50 hover:text-accent-800"
			>
				<LogOut class="h-4 w-4" /> Keluar
			</button>
		</form>
	</div>
</aside>
