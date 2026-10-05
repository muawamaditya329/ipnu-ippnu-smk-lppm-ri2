<script lang="ts">
	import Modal from './Modal.svelte';
	import { TriangleAlert } from '@lucide/svelte';
	import { dialog, jawabKonfirmasi } from '#lib/konfirmasi.svelte.ts';

	let tombolBatal: HTMLButtonElement | undefined = $state();

	// fokus ke tombol paling aman saat dialog terbuka
	$effect(() => {
		if (dialog.terbuka) tombolBatal?.focus();
	});
</script>

<Modal
	open={dialog.terbuka}
	title={dialog.opsi?.judul ?? 'Konfirmasi'}
	onclose={() => jawabKonfirmasi(false)}
>
	<div class="flex gap-3">
		{#if dialog.opsi?.bahaya !== false}
			<TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-accent-700" aria-hidden="true" />
		{/if}
		<div class="min-w-0">
			<p class="text-sm leading-relaxed text-stone-600">{dialog.opsi?.pesan}</p>
			{#if dialog.opsi?.bahaya !== false}
				<p class="mt-2 text-xs font-medium text-stone-400">Tindakan ini tidak dapat dibatalkan.</p>
			{/if}
		</div>
	</div>
	<div class="mt-6 flex justify-end gap-2">
		<button bind:this={tombolBatal} class="btn btn-ghost" onclick={() => jawabKonfirmasi(false)}
			>Batal</button
		>
		<button
			class="btn {dialog.opsi?.bahaya === false ? 'btn-primary' : 'btn-danger'}"
			onclick={() => jawabKonfirmasi(true)}
		>
			{dialog.opsi?.tombol ?? 'Ya, Lanjutkan'}
		</button>
	</div>
</Modal>
