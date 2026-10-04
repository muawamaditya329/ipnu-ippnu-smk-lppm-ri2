<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';

	type Props = {
		open: boolean;
		title: string;
		wide?: boolean;
		onclose?: () => void;
		children: Snippet;
	};

	let { open, title, wide = false, onclose, children }: Props = $props();

	function tutup() {
		onclose?.();
	}

	function keydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') tutup();
	}
</script>

<svelte:window onkeydown={keydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={title}>
		<!-- backdrop -->
		<button class="absolute inset-0 h-full w-full cursor-default" aria-label="Tutup" onclick={tutup}></button>

		<div class="relative my-8 w-full {wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl bg-white shadow-lift">
			<div class="flex items-center justify-between border-b border-stone-200 px-6 py-4">
				<h3 class="font-display text-lg font-bold text-stone-900">{title}</h3>
				<button class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" onclick={tutup} aria-label="Tutup dialog">
					<X class="h-5 w-5" />
				</button>
			</div>
			<div class="px-6 py-5">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
