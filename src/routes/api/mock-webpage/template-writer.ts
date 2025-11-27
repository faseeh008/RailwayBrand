import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { ThemeContentConfig } from '$lib/types/theme-content';
import { env } from '$env/dynamic/private';

export interface BuildResult {
	theme: string;
	html: string;
	content: Record<string, any>;
	images: {
		hero: string | null;
		gallery: string[];
	};
	colors: Record<string, string>;
	fontFamily: string;
}

async function fetchImagesForConfig(
	config: ThemeContentConfig,
	count = 4
): Promise<{ hero: string | null; gallery: string[] }> {
	const results: string[] = [];

	const queryParts = [config.brandType, config.vibe, config.brandName]
		.filter(Boolean)
		.join(' ');
	const query = queryParts || 'brand';

	// Try Unsplash first
	if (env.UNSPLASH_ACCESS_KEY) {
		try {
			const res = await fetch(
				`https://api.unsplash.com/search/photos?per_page=${count}&orientation=landscape&query=${encodeURIComponent(
					query
				)}`,
				{
					headers: {
						Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`
					}
				}
			);
			if (res.ok) {
				const data = await res.json();
				for (const photo of data.results ?? []) {
					if (photo?.urls?.regular) {
						results.push(photo.urls.regular);
						if (results.length === count) break;
					}
				}
			}
		} catch (err) {
			console.warn('Unsplash image fetch failed', err);
		}
	}

	// Fallback to Pexels
	if (results.length < count && env.PEXELS_API_KEY) {
		try {
			const res = await fetch(
				`https://api.pexels.com/v1/search?per_page=${count}&orientation=landscape&query=${encodeURIComponent(
					query
				)}`,
				{
					headers: {
						Authorization: env.PEXELS_API_KEY
					}
				}
			);
			if (res.ok) {
				const data = await res.json();
				for (const photo of data.photos ?? []) {
					if (photo?.src?.large) {
						results.push(photo.src.large);
						if (results.length === count) break;
					}
				}
			}
		} catch (err) {
			console.warn('Pexels image fetch failed', err);
		}
	}

	if (!results.length) {
		return { hero: null, gallery: [] };
	}

	return {
		hero: results[0],
		gallery: results.slice(1)
	};
}

export async function buildMockWebpageHtml(
	config: ThemeContentConfig
): Promise<BuildResult> {
	// Fetch images based on brand type + theme
	const images = await fetchImagesForConfig(config, 4);

	const themeDir =
		config.theme.charAt(0).toUpperCase() + config.theme.slice(1).toLowerCase();
	const buildDir = join(process.cwd(), 'react-templates', themeDir, 'build');
	const indexPath = join(buildDir, 'index.html');

	if (!existsSync(indexPath)) {
		throw new Error(
			`Build not found for theme "${config.theme}". Please run: cd react-templates/${themeDir} && npm run build`
		);
	}

	let html = readFileSync(indexPath, 'utf-8');

	// Inline CSS assets for blob compatibility
	html = html.replace(/<link[^>]+href=\"\.\/assets\/([^\"']+\.css)\"[^>]*>/g, (match, file) => {
		const cssPath = join(buildDir, 'assets', file);
		if (existsSync(cssPath)) {
			const css = readFileSync(cssPath, 'utf-8');
			return `<style>${css}</style>`;
		}
		return match;
	});

	// Inline JS assets
	html = html.replace(
		/<script[^>]+src=\"\.\/assets\/([^\"']+\.js)\"[^>]*><\/script>/g,
		(match, file) => {
			const jsPath = join(buildDir, 'assets', file);
			if (existsSync(jsPath)) {
				const js = readFileSync(jsPath, 'utf-8');
				return `<script type="module">${js}</script>`;
			}
			return match;
		}
	);

	// Build BrandConfig-like object for React templates
	const brandConfig =
		config.brandConfigOverrides ||
		{
			brandName: config.brandName,
			brandDescription: config.description,
			logoUrl: config.logoUrl,
			colorPalette: {
				primary: config.primary,
				secondary: config.secondary,
				accent: config.accent,
				background: config.background,
				text: config.text
			},
			fonts: {
				heading: config.headingFont,
				body: config.bodyFont
			},
			images: {
				hero: images.hero || config.heroImage || '',
				gallery: images.gallery.length ? images.gallery : config.galleryImages
			},
			industry: config.brandType,
			stats: config.stats || [],
			features: config.features || [],
			contact: {}
		};

	const styleVars = `
    <style>
      :root {
        --brand-primary: ${config.primary};
        --brand-secondary: ${config.secondary};
        --brand-accent: ${config.accent};
        --brand-bg: ${config.background};
        --brand-text: ${config.text};
        --font-heading: ${config.headingFont};
        --font-body: ${config.bodyFont};
      }
      body {
        font-family: var(--font-body);
        background-color: var(--brand-bg);
        color: var(--brand-text);
      }
    </style>
  `;

	const fontLinks =
		config.googleFontImports && config.googleFontImports.length
			? config.googleFontImports
					.map((url) => `<link rel="stylesheet" href="${url}" />`)
					.join('\n')
			: '';

	const injection = `
    ${fontLinks}
    <script>
      window.__BRAND_CONFIG__ = ${JSON.stringify(brandConfig)};
    </script>
    ${styleVars}
  `;

	if (html.includes('</head>')) {
		html = html.replace('</head>', `${injection}</head>`);
	} else {
		// Fallback: prepend to HTML
		html = `${injection}${html}`;
	}

	return {
		theme: config.theme,
		html,
		content: {},
		images: {
			hero: brandConfig.images.hero || null,
			gallery: brandConfig.images.gallery
		},
		colors: {
			primary: config.primary,
			secondary: config.secondary,
			accent: config.accent,
			background: config.background,
			text: config.text
		},
		fontFamily: config.bodyFont
	};
}


