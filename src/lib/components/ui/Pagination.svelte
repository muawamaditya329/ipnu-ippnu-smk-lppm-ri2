<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	type Props = {
		page: number;
		totalPages: number;
		href: (p: number) => string;
	};

	let { page, totalPages, href }: Props = $props();

	// Jepit ke [1, totalPages] agar komponen tetap benar walau pemanggil mengirim
	// nomor di luar rentang (?halaman=9999 yang tidak dijepit di load, dsb.).
	const kini = $derived(Math.min(Math.max(1, page), Math.max(1, totalPages)));

	const halaman = $derived.by(() => {
		const arr: number[] = [];
		const mulai = Math.max(1, kini - 2);
		const akhir = Math.min(totalPages, mulai + 4);
		for (let i = mulai; i <= akhir; i++) arr.push(i);
		return arr;
	});

	// Kotak angka: border 1px tegas, bukan tombol pill; halaman aktif tinta hijau.
	const kotak =
		'flex h-9 min-w-9 items-center justify-center rounded-md border bg-white px-2 text-sm font-semibold transition';
</script>

{#if totalPages > 1}
	<nav class="mt-8 flex items-center justify-center gap-1.5" aria-label="Navigasi halaman">
		{#if kini > 1}
			<a
				class="{kotak} border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900"
				href={href(kini - 1)}
				aria-label="Halaman sebelumnya"
			>
				<ChevronLeft class="h-4 w-4" />
			</a>
		{/if}
		{#each halaman as p (p)}
			<a
				class="{kotak} {p === kini
					? 'border-primary-800 font-bold text-primary-800'
					: 'border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900'}"
				href={href(p)}
				aria-current={p === kini ? 'page' : undefined}
			>
				{p}
			</a>
		{/each}
		{#if kini < totalPages}
			<a
				class="{kotak} border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900"
				href={href(kini + 1)}
				aria-label="Halaman berikutnya"
			>
				<ChevronRight class="h-4 w-4" />
			</a>
		{/if}
	</nav>
{/if}
