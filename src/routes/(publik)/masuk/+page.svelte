<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';
	import { Lock, User as UserIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let memproses = $state(false);
</script>

<svelte:head>
	<title>Masuk Pengurus — IPNU IPPNU SMK LPPM RI 2 Kedungreja</title>
</svelte:head>

<div class="pattern-islamic-dark flex min-h-[calc(100vh-4rem)] items-center justify-center bg-primary-50/50 px-4 py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 flex justify-center">
			<Logo size={56} />
		</div>

		<div class="card p-8">
			<h1 class="font-display text-2xl font-extrabold text-stone-900">Masuk Pengurus</h1>
			<p class="mt-1.5 text-sm text-stone-500">
				Khusus kepengurusan Komisariat IPNU & IPPNU. Calon anggota cukup mendaftar lewat formulir pendaftaran.
			</p>

			{#if form?.pesan}
				<div class="mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700" role="alert">
					{form.pesan}
				</div>
			{/if}

			<form method="POST" class="mt-6 space-y-4" onsubmit={() => (memproses = true)}>
				<div>
					<label class="label" for="username">Username</label>
					<div class="relative">
						<UserIcon class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
						<input id="username" name="username" type="text" required autocomplete="username" class="input pl-10" placeholder="mis. admin" value={form?.username ?? ''} />
					</div>
				</div>
				<div>
					<label class="label" for="password">Password</label>
					<div class="relative">
						<Lock class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
						<input id="password" name="password" type="password" required autocomplete="current-password" class="input pl-10" placeholder="••••••••" />
					</div>
				</div>
				<button class="btn btn-primary btn-lg w-full" type="submit" disabled={memproses}>
					{memproses ? 'Memeriksa…' : 'Masuk ke Dasbor'}
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-stone-400">
			Lupa akses? Hubungi admin komisariat atau pembina.
		</p>
	</div>
</div>
