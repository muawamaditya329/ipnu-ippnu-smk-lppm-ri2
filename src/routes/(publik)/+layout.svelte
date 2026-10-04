<script lang="ts">
	import PublicNav from '#lib/components/layout/PublicNav.svelte';
	import PublicFooter from '#lib/components/layout/PublicFooter.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<div class="flex min-h-screen flex-col">
	<PublicNav />
	<main class="flex-1">
		{@render children()}
	</main>
	<PublicFooter settings={data.settings} />
</div>
