import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		fs: {
			allow: ['..']
		},
		hmr: {
			overlay: false
		}
	},
	optimizeDeps: {
		exclude: ['@auth/sveltekit', 'playwright', 'canvas'],
		include: ['lucide-svelte']
	},
	ssr: {
		noExternal: ['lucide-svelte']
	}
});
