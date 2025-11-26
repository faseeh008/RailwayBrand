<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { loadTempBrandData } from '$lib/services/temp-brand-storage';

	// Import theme templates
	import MinimalisticApp from '$lib/templates_mock_webpage/minimalistic/App.svelte';
	import MaximalisticApp from '$lib/templates_mock_webpage/maximalistic/App.svelte';
	import FunkyApp from '$lib/templates_mock_webpage/funky/App.svelte';
	import FuturisticApp from '$lib/templates_mock_webpage/futuristic/App.svelte';

	type ThemeKey = 'minimalistic' | 'maximalistic' | 'funky' | 'futuristic';

	const THEME_PRESETS: Record<
		ThemeKey,
		{
			bg: string;
			surface: string;
			accent: string;
			accentSoft: string;
			text: string;
			gradient: string;
		}
	> = {
		minimalistic: {
			bg: '#f8fafc',
			surface: '#ffffff',
			accent: '#0f172a',
			accentSoft: '#cbd5f5',
			text: '#1f2937',
			gradient: 'linear-gradient(135deg, #eef2ff, #f8fafc)'
		},
		maximalistic: {
			bg: '#170f1e',
			surface: '#231526',
			accent: '#ff7d92',
			accentSoft: '#ffd3dd',
			text: '#fef3f9',
			gradient: 'linear-gradient(135deg, #ff7a18, #af002d 85%)'
		},
		funky: {
			bg: '#0c1224',
			surface: '#121a33',
			accent: '#ffd447',
			accentSoft: '#ff9b9b',
			text: '#f8fbff',
			gradient: 'linear-gradient(120deg, #ff9b9b, #ffd447)'
		},
		futuristic: {
			bg: '#020617',
			surface: '#050b26',
			accent: '#5cf4ff',
			accentSoft: '#7c3aed',
			text: '#e0f2fe',
			gradient: 'linear-gradient(130deg, #5cf4ff, #7c3aed)'
		}
	};

	const FALLBACK_GALLERIES: Record<ThemeKey, string[]> = {
		minimalistic: [
			'https://images.unsplash.com/photo-1708758487256-8a3a73565dc2?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1721146378270-1b93839f7ae7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80'
		],
		maximalistic: [
			'https://images.unsplash.com/photo-1663072302693-d92701c4ef42?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1722938687754-d77c159da3c8?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?auto=format&fit=crop&w=1200&q=80'
		],
		funky: [
			'https://images.unsplash.com/photo-1685432531593-1afc8a152e5f?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1663082076137-486bc3ff6fd7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1573136810265-a584af43f98f?auto=format&fit=crop&w=1200&q=80'
		],
		futuristic: [
			'https://images.unsplash.com/photo-1613500429601-62a596776da7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80'
		]
	};

	let brandData: any = null;
	let loading = true;
	let error: string | null = null;
	let theme: ThemeKey = 'minimalistic';
	let images: { hero: string | null; gallery: string[] } = { hero: null, gallery: [] };
	let content: Record<string, any> = {};

	onMount(() => {
		if (!browser) return;
		(async () => {
			try {
				await hydrate();
			} catch (err: any) {
				console.error('Mock web page hydrate error:', err);
				error = err?.message || 'Failed to build mock preview';
			} finally {
				loading = false;
			}
		})();
	});

	async function hydrate() {
		// Load from temp brand storage (includes build data)
		const tempData = loadTempBrandData();

		if (!tempData) {
			// Fallback to sessionStorage for backward compatibility
			const raw = sessionStorage.getItem('preview_brand_data');
			if (!raw) {
				error = 'No brand data available. Please build a mock webpage first from the preview page.';
				return;
			}
			brandData = JSON.parse(raw);
			// Use default theme
			theme = 'minimalistic';
		} else {
			brandData = tempData.brandData;
			theme = tempData.selectedTheme.toLowerCase() as ThemeKey;

			// Use build data if available
			if (tempData.buildData) {
				images = tempData.buildData.images || { hero: null, gallery: [] };
				content = tempData.buildData.content || {};
			}
		}

		// Ensure we have images and content
		if (!images || !images.hero) {
			await loadThemeImagery();
		}

		if (!content || Object.keys(content).length === 0) {
			content = buildDefaultContent();
		}
	}

	function buildDefaultContent() {
		const brandName = brandData?.brand_name || brandData?.brandName || 'Brand';
		return {
			heroTitle: `Welcome to ${brandName}`,
			heroDescription: `Experience the future of ${brandData?.industry || 'innovation'}.`,
			heroBadge: 'Featured',
			ctaPrimary: 'Get Started',
			ctaSecondary: 'Learn More',
			features: [],
			stats: []
		};
	}

	async function loadThemeImagery() {
		const brandName = brandData?.brand_name || brandData?.brandName || 'brand';
		const query = `${brandName} ${theme} lifestyle`;

		try {
			const response = await fetch('/api/mock-webpage/images', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName,
					theme,
					imageType: 'lifestyle',
					count: 4
				})
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.images) {
					images = {
						hero: data.images[0] || null,
						gallery: data.images.slice(1)
					};
					return;
				}
			}
		} catch (err) {
			console.warn('Image fetch failed:', err);
		}

		// Fallback
		images = {
			hero: FALLBACK_GALLERIES[theme][0] || null,
			gallery: FALLBACK_GALLERIES[theme].slice(1)
		};
	}

	function navigateBack() {
		goto('/dashboard/preview-html');
	}
</script>

{#if loading}
	<div class="mock-shell loading-state">
		<div class="loader">
			<div class="spinner"></div>
			<p>Generating mock experience…</p>
		</div>
	</div>
{:else if error}
	<div class="mock-shell error-state">
		<div class="error-card">
			<div class="emoji">⚠️</div>
			<h2>Unable to render mock web page</h2>
			<p>{error}</p>
			<button class="primary" on:click={navigateBack}>← Back to presentation</button>
		</div>
	</div>
{:else if brandData}
	{#if theme === 'minimalistic'}
		<MinimalisticApp {brandData} {images} {content} />
	{:else if theme === 'maximalistic'}
		<MaximalisticApp {brandData} {images} {content} />
	{:else if theme === 'funky'}
		<FunkyApp {brandData} {images} {content} />
	{:else if theme === 'futuristic'}
		<FuturisticApp {brandData} {images} {content} />
	{:else}
		<MinimalisticApp {brandData} {images} {content} />
	{/if}
{/if}

<style>
	:global(body) {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.mock-shell {
		min-height: 100vh;
		padding: clamp(1.5rem, 5vw, 3rem);
		background: var(--bg, #f5f5f5);
		color: var(--text, #111);
	}

	.mock-shell.loading-state,
	.mock-shell.error-state {
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle at top, #1f2937, #0f172a 70%);
		color: #fff;
	}

	.loader {
		text-align: center;
	}

	.loader .spinner {
		width: 48px;
		height: 48px;
		border: 5px solid rgba(255, 255, 255, 0.2);
		border-top-color: #fff;
		border-radius: 50%;
		margin: 0 auto 1rem;
		animation: spin 1.2s linear infinite;
	}

	.error-card {
		background: rgba(0, 0, 0, 0.4);
		padding: 2rem;
		border-radius: 1.5rem;
		text-align: center;
		max-width: 420px;
	}

	.error-card h2 {
		margin-bottom: 0.5rem;
	}

	.error-card p {
		margin-bottom: 1rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.error-card .emoji {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.error-card .primary {
		background: #fff;
		color: #111;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.hero {
		display: grid;
		gap: clamp(1rem, 4vw, 3rem);
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		background: var(--surface);
		border-radius: 28px;
		padding: clamp(1.5rem, 4vw, 3rem);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 30px 60px rgba(15, 23, 42, 0.35);
	}

	.hero h1 {
		font-size: clamp(2.5rem, 4vw, 3.5rem);
		line-height: 1.1;
		margin-bottom: 1rem;
	}

	.hero p {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.85);
	}

	.hero-copy .eyebrow {
		font-size: 0.85rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.6);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.hero-actions .primary {
		background: var(--gradient);
		border: none;
		color: #fff;
		padding: 0.85rem 1.8rem;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	.hero-actions .secondary {
		border: 1px solid rgba(255, 255, 255, 0.4);
		background: transparent;
		color: #fff;
		padding: 0.85rem 1.8rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.vibe-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}

	.chip {
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		font-size: 0.85rem;
		text-transform: capitalize;
	}

	.hero-visual {
		position: relative;
	}

	.hero-visual img,
	.hero-placeholder {
		width: 100%;
		border-radius: 24px;
		height: 360px;
		object-fit: cover;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.hero-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
		padding: 1rem;
		text-align: center;
	}

	.cube-wrapper {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.futuristic-cube {
		width: 140px;
		height: 140px;
		border-radius: 24px;
		background: var(--gradient);
		filter: drop-shadow(0 20px 40px rgba(92, 244, 255, 0.35));
		mix-blend-mode: screen;
	}

	.section-heading {
		margin-bottom: 1rem;
	}

	.section-heading h2 {
		margin: 0;
	}

	.palette,
	.feature-grid,
	.gallery,
	.typography {
		margin-top: 3rem;
	}

	.palette,
	.gallery,
	.typography {
		background: var(--surface);
		padding: clamp(1.25rem, 3vw, 2rem);
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.swatch {
		border-radius: 18px;
		padding: 1.25rem;
		background: var(--swatch, #444);
		color: #fff;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.85rem;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.gallery-grid figure {
		margin: 0;
	}

	.gallery-grid img {
		width: 100%;
		border-radius: 18px;
		height: 240px;
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.typography {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
		align-items: center;
	}

	.cta-card {
		background: var(--gradient);
		padding: 1.5rem;
		border-radius: 20px;
		color: #fff;
	}

	.cta-card .primary {
		margin-top: 1rem;
		border: none;
		background: rgba(0, 0, 0, 0.25);
		padding: 0.85rem 1.5rem;
		border-radius: 999px;
		color: #fff;
		cursor: pointer;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.futuristic-cube {
			animation: none !important;
		}
	}
</style>
