<script lang="ts">
	import { Menu } from '@lucide/svelte';
	import AdminSidebar from '#lib/components/layout/AdminSidebar.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let sidebarTerbuka = $state(false);
</script>

<div class="min-h-screen bg-stone-100">
	<AdminSidebar user={data.user} bind:open={sidebarTerbuka} />

	<div class="lg:pl-72">
		<!-- Bilah atas (seluler) -->
		<header
			class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur lg:hidden"
		>
			<button
				class="rounded-lg p-2 text-stone-700 hover:bg-stone-100"
				onclick={() => (sidebarTerbuka = true)}
				aria-label="Buka menu"
			>
				<Menu class="h-6 w-6" />
			</button>
			<span class="font-display text-sm font-bold text-stone-800">Dasbor Pengurus</span>
		</header>

		<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			{@render children()}
		</main>
	</div>

	<!-- Dialog konfirmasi in-app (dipakai semua halaman admin) -->
	<ConfirmDialog />
</div>
