<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'gold';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		loading?: boolean;
		children: Snippet;
	} & HTMLButtonAttributes &
		Partial<HTMLAnchorAttributes>;

	let {
		variant = 'primary',
		size = 'md',
		href,
		loading = false,
		disabled = false,
		class: cls = '',
		children,
		...rest
	}: Props = $props();

	const kelas = $derived(
		`btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${cls}`
	);
</script>

{#if href}
	<a {href} class={kelas}>{@render children()}</a>
{:else}
	<button class={kelas} disabled={disabled || loading} {...rest}>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
			</svg>
		{/if}
		{@render children()}
	</button>
{/if}
