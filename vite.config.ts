import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Untuk produksi: ORIGIN=https://domain-anda npm run build
			// (adapter-node memakai nilai ini utk validasi CSRF form POST)
			paths: process.env.ORIGIN ? { origin: process.env.ORIGIN } : undefined
		})
	]
});
