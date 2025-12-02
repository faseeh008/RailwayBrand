import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Vercel adapter for optimized deployment
		// See https://kit.svelte.dev/docs/adapter-vercel for more information
		adapter: adapter({
			runtime: 'nodejs20.x',
			// Exclude large dependencies from serverless function bundle
			outputFileTracingExcludes: {
				'*': [
					'node_modules/puppeteer/**',
					'node_modules/playwright/**',
					'node_modules/sharp/**',
					'node_modules/canvas/**',
					'node_modules/puppeteer-core/**',
					'node_modules/playwright-core/**'
				]
			}
		})
	}
};

export default config;
