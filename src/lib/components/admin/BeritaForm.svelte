<script lang="ts">
	import { ImagePlus, Info } from '@lucide/svelte';
	import type { Post } from '#lib/server/db.ts';
	import { LABEL_CAKUPAN, LABEL_KATEGORI_BERITA } from '#lib/utils.ts';

	type Props = {
		post?: Post | null;
		galat?: Record<string, string> | null;
		/** action form: '' utk default, atau '?/simpan' */
		action?: string;
	};

	let { post = null, galat = null, action = '' }: Props = $props();

	let memproses = $state(false);
</script>

<form method="POST" {action} enctype="multipart/form-data" class="space-y-6" onsubmit={() => (memproses = true)}>
	<div class="card p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-stone-900">Isi Utama</h2>
		<div class="space-y-4">
			<div>
				<label class="label" for="judul">Judul berita <span class="text-accent-600">*</span></label>
				<input id="judul" name="judul" class="input {galat?.judul ? 'input-error' : ''}" required maxlength="180" placeholder="mis. Komisariat Gelar Kajian Rutin Bulanan" value={post?.judul ?? ''} />
				{#if galat?.judul}<p class="error-text">{galat.judul}</p>{/if}
			</div>

			<div>
				<label class="label" for="ringkasan">Ringkasan singkat</label>
				<textarea id="ringkasan" name="ringkasan" rows="2" maxlength="300" class="input" placeholder="Tampil di kartu berita & hasil pencarian (maks. 300 karakter)">{post?.ringkasan ?? ''}</textarea>
			</div>

			<div>
				<label class="label" for="konten">Isi berita <span class="text-accent-600">*</span></label>
				<textarea id="konten" name="konten" rows="12" required class="input {galat?.konten ? 'input-error' : ''} font-mono text-[13px] leading-relaxed" placeholder="Tulis isi berita di sini…&#10;&#10;Baris kosong memisahkan paragraf. Gunakan **teks** untuk tebal dan *teks* untuk miring.">{post?.konten ?? ''}</textarea>
				<p class="hint flex items-center gap-1.5"><Info class="h-3.5 w-3.5" /> Baris kosong = paragraf baru. <b>**tebal**</b>, <i>*miring*</i>. HTML tidak diizinkan demi keamanan.</p>
				{#if galat?.konten}<p class="error-text">{galat.konten}</p>{/if}
			</div>
		</div>
	</div>

	<div class="card p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-stone-900">Pengaturan & Lampiran</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label class="label" for="kategori">Kategori</label>
				<select id="kategori" name="kategori" class="input">
					{#each Object.entries(LABEL_KATEGORI_BERITA) as [nilai, label] (nilai)}
						<option value={nilai} selected={post?.kategori === nilai || (!post && nilai === 'kabar')}>{label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="cakupan">Cakupan</label>
				<select id="cakupan" name="cakupan" class="input">
					{#each Object.entries(LABEL_CAKUPAN) as [nilai, label] (nilai)}
						<option value={nilai} selected={post?.cakupan === nilai}>{label}</option>
					{/each}
				</select>
				<p class="hint">IPNU = kegiatan putra, IPPNU = kegiatan putri.</p>
			</div>
			<div>
				<label class="label" for="status">Status</label>
				<select id="status" name="status" class="input">
					<option value="draft" selected={post?.status === 'draft'}>Draf (belum tayang)</option>
					<option value="terbit" selected={post?.status === 'terbit' || !post}>Terbit</option>
				</select>
			</div>
		</div>

		<div class="mt-4">
			<label class="label" for="cover">Foto sampul</label>
			<div class="flex items-center gap-4">
				<div class="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
					{#if post?.cover}
						<img src="/uploads/{post.cover}" alt="Sampul saat ini" class="h-full w-full object-cover" />
					{:else}
						<ImagePlus class="h-6 w-6 text-stone-300" />
					{/if}
				</div>
				<div class="flex-1">
					<input id="cover" name="cover" type="file" accept="image/*" class="input file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-700" />
					<p class="hint">JPG/PNG/WebP maks. 5 MB. {post?.cover ? 'Biarkan kosong untuk mempertahankan sampul saat ini.' : 'Opsional — tanpa sampul akan memakai gradasi hijau.'}</p>
				</div>
			</div>
			{#if galat?.cover}<p class="error-text">{galat.cover}</p>{/if}
		</div>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href="/admin/berita" class="btn btn-ghost">Batal</a>
		<button class="btn btn-primary btn-lg" type="submit" disabled={memproses}>
			{memproses ? 'Menyimpan…' : post ? 'Simpan Perubahan' : 'Terbitkan Berita'}
		</button>
	</div>
</form>
