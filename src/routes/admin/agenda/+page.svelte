<script lang="ts">
	import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import type { EventItem } from '#lib/server/db.ts';
	import { fmtTanggalPendek, hariIni, LABEL_CAKUPAN, LABEL_JENIS_AGENDA } from '#lib/utils.ts';
	import { kirimJikaSetuju } from '#lib/konfirmasi.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const OPSI_JENIS = Object.entries(LABEL_JENIS_AGENDA);
	const OPSI_CAKUPAN = Object.entries(LABEL_CAKUPAN);
	const LABEL_STATUS_AGENDA: Record<string, string> = {
		terjadwal: 'Terjadwal',
		selesai: 'Selesai',
		dibatalkan: 'Dibatalkan'
	};
	const OPSI_STATUS = Object.entries(LABEL_STATUS_AGENDA);
	const badgeStatus: Record<string, string> = {
		terjadwal: 'badge-green',
		selesai: 'badge-gray',
		dibatalkan: 'badge-red'
	};
	// Tone jenis sama dengan halaman publik /agenda: rutin & kajian hijau, rapat biru, lomba amber.
	const badgeJenis: Record<string, string> = {
		rutin: 'badge-green',
		kajian: 'badge-green',
		rapat: 'badge-blue',
		lomba: 'badge-amber',
		kegiatan: 'badge-gray'
	};
	const badgeCakupan: Record<string, string> = {
		umum: 'badge-blue',
		ipnu: 'badge-green',
		ippnu: 'badge-red'
	};

	// Nilai awal form (modal "Tambah Agenda")
	const kosong = () => ({
		judul: '',
		jenis: 'kegiatan',
		cakupan: 'umum',
		lokasi: '',
		tanggal: hariIni(),
		jam: '',
		tanggal_selesai: '',
		status: 'terjadwal',
		deskripsi: ''
	});

	/** Susun ulang isian modal dari `nilai` yang dikirim server saat validasi gagal. */
	const isiDariServer = (n: Record<string, string> | null) => ({
		judul: n?.judul ?? '',
		jenis: n?.jenis ?? 'kegiatan',
		cakupan: n?.cakupan ?? 'umum',
		lokasi: n?.lokasi ?? '',
		tanggal: n?.tanggal || hariIni(),
		jam: n?.jam ?? '',
		tanggal_selesai: n?.tanggal_selesai ?? '',
		status: n?.status ?? 'terjadwal',
		deskripsi: n?.deskripsi ?? ''
	});

	let buka = $state(false);
	let editId = $state<number | null>(null);
	let nilai = $state(kosong());
	let galat: Record<string, string> | null = $state(null);
	let menyimpan = $state(false);

	const bukaTambah = () => {
		editId = null;
		nilai = kosong();
		galat = null;
		menyimpan = false;
		buka = true;
	};

	const bukaUbah = (item: EventItem) => {
		editId = item.id;
		nilai = {
			judul: item.judul,
			jenis: item.jenis,
			cakupan: item.cakupan,
			lokasi: item.lokasi ?? '',
			tanggal: item.tanggal,
			jam: item.jam ?? '',
			tanggal_selesai: item.tanggal_selesai ?? '',
			status: item.status,
			deskripsi: item.deskripsi ?? ''
		};
		galat = null;
		menyimpan = false;
		buka = true;
	};

	const tutupModal = () => {
		buka = false;
	};

	// Reaksi terhadap hasil form action. Submit native memuat ulang halaman sehingga
	// seluruh state reset: sukses → biarkan modal tertutup; gagal validasi → buka ulang
	// modal yang bersangkutan dan isi ulang isian dari data server.
	$effect(() => {
		if (!form) return;
		menyimpan = false;
		if (form.sukses) {
			buka = false;
			galat = null;
		} else if (form.modal === 'buat') {
			editId = null;
			nilai = isiDariServer(form.nilai);
			galat = form.galat;
			buka = true;
		} else if (form.modal === 'ubah' && form.id != null) {
			editId = form.id;
			nilai = isiDariServer(form.nilai);
			galat = form.galat;
			buka = true;
		} else if (form.galat) {
			// Galat tanpa modal (mis. hapus gagal) — tampil sebagai banner di luar modal.
			galat = form.galat;
		}
	});
</script>

<svelte:head><title>Kelola Agenda — Dasbor</title></svelte:head>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h1 class="font-display text-2xl font-extrabold text-stone-900">Kelola Agenda</h1>
		<p class="mt-1 text-sm text-stone-500">
			{data.total} agenda terdaftar — tampil di halaman publik /agenda.
		</p>
	</div>
	<button class="btn btn-primary" onclick={bukaTambah}
		><Plus class="h-4 w-4" /> Tambah Agenda</button
	>
</div>

{#if form?.sukses}
	<div
		class="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
	>
		{form.pesan ?? 'Perubahan berhasil disimpan.'}
	</div>
{:else if form?.galat?.umum && !buka}
	<!-- Galat yang tidak bisa tampil di dalam modal (mis. hapus gagal) -->
	<div
		class="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
	>
		{form.galat.umum}
	</div>
{/if}

<!-- Filter jenis & status -->
<div class="card mb-6 p-4">
	<form method="GET" action="/admin/agenda" class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="sm:w-48">
			<label class="label" for="f-jenis">Jenis</label>
			<select id="f-jenis" name="jenis" class="input">
				<option value="">Semua Jenis</option>
				{#each OPSI_JENIS as [v, l] (v)}<option value={v} selected={data.jenis === v}>{l}</option
					>{/each}
			</select>
		</div>
		<div class="sm:w-48">
			<label class="label" for="f-status">Status</label>
			<select id="f-status" name="status" class="input">
				<option value="">Semua Status</option>
				{#each OPSI_STATUS as [v, l] (v)}<option value={v} selected={data.status === v}>{l}</option
					>{/each}
			</select>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline" type="submit">Terapkan</button>
			{#if data.jenis || data.status}
				<a href="/admin/agenda" class="btn btn-ghost">Reset</a>
			{/if}
		</div>
	</form>
</div>

{#if data.events.length === 0}
	<EmptyState
		icon={CalendarDays}
		title="Belum ada agenda"
		desc="Tambahkan jadwal kegiatan, rapat, atau kajian agar tampil di halaman publik."
	>
		<button class="btn btn-primary" onclick={bukaTambah}
			><Plus class="h-4 w-4" /> Tambah agenda pertama</button
		>
	</EmptyState>
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full min-w-[860px]">
			<thead class="border-b border-stone-200 bg-stone-50">
				<tr>
					<th class="th">Judul</th>
					<th class="th">Jenis</th>
					<th class="th">Tanggal</th>
					<th class="th">Lokasi</th>
					<th class="th">Cakupan</th>
					<th class="th">Status</th>
					<th class="th text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-stone-100">
				{#each data.events as item (item.id)}
					<tr class="hover:bg-stone-50">
						<td class="td max-w-xs">
							<span class="font-semibold text-stone-900">{item.judul}</span>
							{#if item.deskripsi}<p class="mt-0.5 line-clamp-1 text-xs text-stone-400">
									{item.deskripsi}
								</p>{/if}
						</td>
						<td class="td"
							><span class="badge {badgeJenis[item.jenis] ?? 'badge-gray'}"
								>{LABEL_JENIS_AGENDA[item.jenis] ?? item.jenis}</span
							></td
						>
						<td class="td">
							<span class="font-medium text-stone-900">{fmtTanggalPendek(item.tanggal)}</span>
							{#if item.jam}
								<span class="mt-0.5 flex items-center gap-1 text-xs text-stone-500"
									><Clock class="h-3 w-3" /> {item.jam} WIB</span
								>
							{/if}
							{#if item.tanggal_selesai && item.tanggal_selesai !== item.tanggal}
								<span class="block text-xs text-stone-500"
									>s.d. {fmtTanggalPendek(item.tanggal_selesai)}</span
								>
							{/if}
						</td>
						<td class="td">
							{#if item.lokasi}
								<span class="flex items-center gap-1 text-stone-600"
									><MapPin class="h-3.5 w-3.5 shrink-0 text-stone-400" /> {item.lokasi}</span
								>
							{:else}
								<span class="text-stone-300">—</span>
							{/if}
						</td>
						<td class="td"
							><span class="badge {badgeCakupan[item.cakupan] ?? 'badge-gray'}"
								>{LABEL_CAKUPAN[item.cakupan] ?? item.cakupan}</span
							></td
						>
						<td class="td"
							><span class="badge {badgeStatus[item.status] ?? 'badge-gray'}"
								>{LABEL_STATUS_AGENDA[item.status] ?? item.status}</span
							></td
						>
						<td class="td">
							<div class="flex justify-end gap-1.5">
								<button
									class="btn btn-outline btn-sm"
									onclick={() => bukaUbah(item)}
									aria-label="Ubah {item.judul}"
								>
									<Pencil class="h-3.5 w-3.5" /> Ubah
								</button>
								<form
									method="POST"
									action="?/hapus&id={item.id}"
									onsubmit={(e) =>
										kirimJikaSetuju(e, {
											judul: 'Hapus Agenda',
											pesan: `Hapus agenda "${item.judul}"?`,
											tombol: 'Hapus'
										})}
								>
									<button class="btn btn-danger btn-sm" aria-label="Hapus {item.judul}"
										><Trash2 class="h-3.5 w-3.5" /></button
									>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Modal open={buka} title={editId ? 'Ubah Agenda' : 'Tambah Agenda'} onclose={tutupModal} wide>
	<form
		method="POST"
		action={editId ? `?/ubah&id=${editId}` : '?/buat'}
		class="space-y-4"
		onsubmit={() => (menyimpan = true)}
	>
		{#if galat?.umum}
			<div
				class="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700"
			>
				{galat.umum}
			</div>
		{/if}

		<div>
			<label class="label" for="a-judul">Judul agenda <span class="text-accent-600">*</span></label>
			<input
				id="a-judul"
				name="judul"
				type="text"
				class="input {galat?.judul ? 'input-error' : ''}"
				bind:value={nilai.judul}
				required
				maxlength="180"
				placeholder="mis. Kajian Rutin & Rabu'an"
			/>
			{#if galat?.judul}<p class="error-text">{galat.judul}</p>{/if}
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="a-jenis">Jenis</label>
				<select
					id="a-jenis"
					name="jenis"
					class="input {galat?.jenis ? 'input-error' : ''}"
					bind:value={nilai.jenis}
				>
					{#each OPSI_JENIS as [v, l] (v)}<option value={v}>{l}</option>{/each}
				</select>
				{#if galat?.jenis}<p class="error-text">{galat.jenis}</p>{/if}
			</div>
			<div>
				<label class="label" for="a-cakupan">Cakupan</label>
				<select
					id="a-cakupan"
					name="cakupan"
					class="input {galat?.cakupan ? 'input-error' : ''}"
					bind:value={nilai.cakupan}
				>
					{#each OPSI_CAKUPAN as [v, l] (v)}<option value={v}>{l}</option>{/each}
				</select>
				<p class="hint">IPNU = kegiatan putra, IPPNU = kegiatan putri.</p>
				{#if galat?.cakupan}<p class="error-text">{galat.cakupan}</p>{/if}
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="a-tanggal">Tanggal <span class="text-accent-600">*</span></label>
				<input
					id="a-tanggal"
					name="tanggal"
					type="date"
					class="input {galat?.tanggal ? 'input-error' : ''}"
					bind:value={nilai.tanggal}
					required
				/>
				{#if galat?.tanggal}<p class="error-text">{galat.tanggal}</p>{/if}
			</div>
			<div>
				<label class="label" for="a-jam">Jam</label>
				<input
					id="a-jam"
					name="jam"
					type="time"
					class="input {galat?.jam ? 'input-error' : ''}"
					bind:value={nilai.jam}
				/>
				{#if galat?.jam}<p class="error-text">{galat.jam}</p>{/if}
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="a-selesai">Tanggal selesai</label>
				<input
					id="a-selesai"
					name="tanggal_selesai"
					type="date"
					class="input {galat?.tanggal_selesai ? 'input-error' : ''}"
					bind:value={nilai.tanggal_selesai}
					min={nilai.tanggal}
				/>
				<p class="hint">Opsional — isi bila kegiatan berlangsung lebih dari satu hari.</p>
				{#if galat?.tanggal_selesai}<p class="error-text">{galat.tanggal_selesai}</p>{/if}
			</div>
			<div>
				<label class="label" for="a-status">Status</label>
				<select
					id="a-status"
					name="status"
					class="input {galat?.status ? 'input-error' : ''}"
					bind:value={nilai.status}
				>
					{#each OPSI_STATUS as [v, l] (v)}<option value={v}>{l}</option>{/each}
				</select>
				{#if galat?.status}<p class="error-text">{galat.status}</p>{/if}
			</div>
		</div>

		<div>
			<label class="label" for="a-lokasi">Lokasi</label>
			<input
				id="a-lokasi"
				name="lokasi"
				type="text"
				class="input {galat?.lokasi ? 'input-error' : ''}"
				bind:value={nilai.lokasi}
				maxlength="160"
				placeholder="mis. Aula SMK LPPM RI 2 Kedungreja"
			/>
			{#if galat?.lokasi}<p class="error-text">{galat.lokasi}</p>{/if}
		</div>

		<div>
			<label class="label" for="a-deskripsi">Deskripsi</label>
			<textarea
				id="a-deskripsi"
				name="deskripsi"
				rows="4"
				class="input {galat?.deskripsi ? 'input-error' : ''}"
				bind:value={nilai.deskripsi}
				placeholder="Rincian kegiatan, pakaian, perlengkapan yang perlu dibawa, dsb."></textarea>
			{#if galat?.deskripsi}<p class="error-text">{galat.deskripsi}</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-2 border-t border-stone-200 pt-4">
			<button type="button" class="btn btn-ghost" onclick={tutupModal}>Batal</button>
			<button type="submit" class="btn btn-primary" disabled={menyimpan}>
				{menyimpan ? 'Menyimpan…' : editId ? 'Simpan Perubahan' : 'Tambah Agenda'}
			</button>
		</div>
	</form>
</Modal>
