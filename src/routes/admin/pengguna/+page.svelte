<script lang="ts">
	import { KeyRound, Plus, Power, Trash2, UserCog } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import { fmtWaktu, inisial } from '#lib/utils.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Bentuk galat dari semua action diseragamkan agar aman diakses per field di template.
	const galat = $derived((form?.galat ?? null) as Record<string, string> | null);

	// --- Modal tambah pengguna ---
	let bukaModalBaru = $state(false);
	let memproses = $state(false);

	let namaBaru = $state('');
	let usernameBaru = $state('');
	let passwordBaru = $state('');
	let roleBaru = $state('pengurus');

	function bukaFormBaru() {
		namaBaru = '';
		usernameBaru = '';
		passwordBaru = '';
		roleBaru = 'pengurus';
		memproses = false;
		bukaModalBaru = true;
	}

	// --- Modal reset password ---
	let resetId = $state<number | null>(null);
	let resetNama = $state('');
	let resetPassword = $state('');

	function bukaReset(id: number, nama: string) {
		resetId = id;
		resetNama = nama;
		resetPassword = '';
		memproses = false;
	}

	// Sinkron hasil aksi server: sukses → tutup modal; gagal validasi → buka ulang modal terkait.
	$effect(() => {
		if (!form) return;
		memproses = false;
		if (form.sukses) {
			bukaModalBaru = false;
			resetId = null;
		} else if (form.modal === 'baru') {
			namaBaru = form.nilai?.nama ?? '';
			usernameBaru = form.nilai?.username ?? '';
			passwordBaru = '';
			roleBaru = form.nilai?.role === 'admin' ? 'admin' : 'pengurus';
			bukaModalBaru = true;
		} else if (form.modal === 'reset' && form.userId != null) {
			resetId = form.userId;
			resetNama = form.userNama ?? '';
			resetPassword = '';
		}
	});
</script>

<svelte:head><title>Kelola Pengguna — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Pengguna</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.users.length} akun admin &amp; pengurus komisariat terdaftar.
		</p>
	</div>
	<button class="btn btn-primary" onclick={bukaFormBaru}
		><Plus class="h-4 w-4" /> Tambah Pengguna</button
	>
</div>

{#if form?.pesan}
	<div
		class="mb-5 rounded-xl border px-4 py-3 text-sm font-medium {form.sukses
			? 'border-primary-200 bg-primary-50 text-primary-800'
			: 'border-accent-200 bg-accent-50 text-accent-700'}"
		role="status"
	>
		{form.pesan}
	</div>
{/if}

{#if data.users.length === 0}
	<EmptyState
		icon={UserCog}
		title="Belum ada pengguna"
		desc="Belum ada akun pengurus yang terdaftar. Tambahkan akun untuk membantu mengelola konten komisariat."
	/>
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[820px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">Nama</th>
					<th class="th">Username</th>
					<th class="th">Role</th>
					<th class="th">Status</th>
					<th class="th">Dibuat</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.users as u (u.id)}
					<tr class="hover:bg-stone-50">
						<td class="td">
							<div class="flex items-center gap-3">
								<span
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-xs font-extrabold text-primary-800"
								>
									{inisial(u.nama)}
								</span>
								<div class="min-w-0">
									<p class="truncate font-semibold text-stone-900">{u.nama}</p>
									{#if u.id === data.user.id}<p class="text-xs text-stone-400 italic">
											akun Anda
										</p>{/if}
								</div>
							</div>
						</td>
						<td class="td font-mono text-xs">{u.username}</td>
						<td class="td">
							<span class="badge {u.role === 'admin' ? 'badge-green' : 'badge-blue'}">
								{u.role === 'admin' ? 'Admin' : 'Pengurus'}
							</span>
						</td>
						<td class="td">
							<span class="badge {u.aktif ? 'badge-green' : 'badge-gray'}"
								>{u.aktif ? 'Aktif' : 'Nonaktif'}</span
							>
						</td>
						<td class="td text-xs whitespace-nowrap">{fmtWaktu(u.created_at)}</td>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								<button
									class="btn btn-outline btn-sm"
									type="button"
									onclick={() => bukaReset(u.id, u.nama)}
								>
									<KeyRound class="h-3.5 w-3.5" /> Reset Password
								</button>
								{#if u.id !== data.user.id}
									<form
										method="POST"
										action="?/toggle&id={u.id}"
										onsubmit={(e) => {
											if (
												u.aktif &&
												!confirm(
													`Nonaktifkan akun "${u.nama}"? Pengguna tidak bisa masuk sampai diaktifkan kembali.`
												)
											)
												e.preventDefault();
										}}
									>
										<button class="btn btn-outline btn-sm" type="submit">
											<Power class="h-3.5 w-3.5" />
											{u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
										</button>
									</form>
									<form
										method="POST"
										action="?/hapus&id={u.id}"
										onsubmit={(e) => {
											if (!confirm(`Hapus akun "${u.nama}" secara permanen?`)) e.preventDefault();
										}}
									>
										<button class="btn btn-danger btn-sm" aria-label="Hapus {u.nama}"
											><Trash2 class="h-3.5 w-3.5" /></button
										>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Modal tambah pengguna -->
<Modal open={bukaModalBaru} title="Tambah Pengguna" onclose={() => (bukaModalBaru = false)}>
	<form method="POST" action="?/buat" class="space-y-4" onsubmit={() => (memproses = true)}>
		<div>
			<label class="label" for="u-nama">Nama lengkap <span class="text-accent-600">*</span></label>
			<input
				id="u-nama"
				name="nama"
				required
				maxlength="80"
				bind:value={namaBaru}
				class="input {galat?.nama ? 'input-error' : ''}"
				placeholder="mis. Ahmad Fauzi"
			/>
			{#if galat?.nama}<p class="error-text">{galat.nama}</p>{/if}
		</div>

		<div>
			<label class="label" for="u-username">Username <span class="text-accent-600">*</span></label>
			<input
				id="u-username"
				name="username"
				required
				bind:value={usernameBaru}
				class="input {galat?.username ? 'input-error' : ''}"
				placeholder="mis. ahmad.fauzi"
			/>
			<p class="hint">3–20 karakter: huruf kecil, angka, titik, dan garis bawah.</p>
			{#if galat?.username}<p class="error-text">{galat.username}</p>{/if}
		</div>

		<div>
			<label class="label" for="u-password">Password <span class="text-accent-600">*</span></label>
			<input
				id="u-password"
				name="password"
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				bind:value={passwordBaru}
				class="input {galat?.password ? 'input-error' : ''}"
				placeholder="Minimal 6 karakter"
			/>
			{#if galat?.password}<p class="error-text">{galat.password}</p>{/if}
		</div>

		<div>
			<label class="label" for="u-role">Role</label>
			<select id="u-role" name="role" class="input" bind:value={roleBaru}>
				<option value="pengurus">Pengurus</option>
				<option value="admin">Admin</option>
			</select>
			<p class="hint">Admin dapat mengelola akun pengguna; pengurus mengelola konten.</p>
			{#if galat?.role}<p class="error-text">{galat.role}</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-3 pt-1">
			<button type="button" class="btn btn-ghost" onclick={() => (bukaModalBaru = false)}
				>Batal</button
			>
			<button class="btn btn-primary" type="submit" disabled={memproses}
				>{memproses ? 'Menyimpan…' : 'Tambah Pengguna'}</button
			>
		</div>
	</form>
</Modal>

<!-- Modal reset password -->
<Modal
	open={resetId !== null}
	title={resetNama ? `Reset Password — ${resetNama}` : 'Reset Password'}
	onclose={() => (resetId = null)}
>
	<form
		method="POST"
		action={resetId !== null ? `?/resetPassword&id=${resetId}` : '?/resetPassword'}
		class="space-y-4"
		onsubmit={() => (memproses = true)}
	>
		<p class="text-sm text-stone-500">
			Tentukan password baru untuk <b>{resetNama || 'pengguna ini'}</b>. Beritahu pengguna tersebut
			setelah password diganti.
		</p>
		<div>
			<label class="label" for="r-password"
				>Password baru <span class="text-accent-600">*</span></label
			>
			<input
				id="r-password"
				name="password"
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				bind:value={resetPassword}
				class="input {galat?.password ? 'input-error' : ''}"
				placeholder="Minimal 6 karakter"
			/>
			{#if galat?.password}<p class="error-text">{galat.password}</p>{/if}
		</div>
		<div class="flex items-center justify-end gap-3 pt-1">
			<button type="button" class="btn btn-ghost" onclick={() => (resetId = null)}>Batal</button>
			<button class="btn btn-primary" type="submit" disabled={memproses}
				>{memproses ? 'Menyimpan…' : 'Simpan Password Baru'}</button
			>
		</div>
	</form>
</Modal>
