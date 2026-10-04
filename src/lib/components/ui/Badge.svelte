<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		tone?: 'green' | 'red' | 'amber' | 'gray' | 'blue';
		children: Snippet;
	};

	let { tone = 'gray', children }: Props = $props();
</script>

<span class="badge badge-{tone}">{@render children()}</span>
