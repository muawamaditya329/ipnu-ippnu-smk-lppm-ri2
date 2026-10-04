<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	type Props = {
		page: number;
		totalPages: number;
		href: (p: number) => string;
	};

	let { page, totalPages, href }: Props = $props();

	const halaman = $derived.by(() => {
		const arr: number[] = [];
		const mulai = Math.max(1, page - 2);
		const akhir = Math.min(totalPages, mulai + 4);
		for (let i = mulai; i <= akhir; i++) arr.push(i);
		return arr;
	});
</script>

{#if totalPages > 1}
	<nav class="mt-8 flex items-center justify-center gap-1.5" aria-label="Navigasi halaman">
		{#if page > 1}
			<a class="btn btn-outline btn-sm" href={href(page - 1)} aria-label="Halaman sebelumnya">
				<ChevronLeft class="h-4 w-4" />
			</a>
		{/if}
		{#each halaman as p (p)}
			<a
				class="btn btn-sm {p === page ? 'btn-primary' : 'btn-outline'}"
				href={href(p)}
				aria-current={p === page ? 'page' : undefined}
			>
				{p}
			</a>
		{/each}
		{#if page < totalPages}
			<a class="btn btn-outline btn-sm" href={href(page + 1)} aria-label="Halaman berikutnya">
				<ChevronRight class="h-4 w-4" />
			</a>
		{/if}
	</nav>
{/if}
