import { json, type RequestHandler } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ThemeKey } from '$lib/types/theme-content';
import { buildMinimalisticFromSlides } from './buildminimalsitic';
import { buildMaximalisticPage } from './buildmaximalistic';
import { buildFunkyFromSlides } from './buildfunky';
import { buildFuturisticThemeConfig } from './buildfuturistic';

interface BuildRequestBody {
	brandData: any;
	slides: Array<{ name: string; html: string }>;
	theme?: ThemeKey;
}

const THEME_DIR_MAP: Record<ThemeKey, string> = {
	Minimalistic: 'Minimalistic',
	Maximalistic: 'Maximalistic',
	Funky: 'Funky',
	Futuristic: 'Futuristic'
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { brandData = {}, slides = [], theme }: BuildRequestBody = await request.json();
		const normalizedTheme = normalizeTheme(theme || brandData?.selectedTheme);

		const build = await buildThemePage(normalizedTheme, brandData, slides);

		return json({
			success: true,
			theme: normalizedTheme,
			...build
		});
	} catch (error: any) {
		console.error('[mockpagebuilder] build failed', error);
		return json(
			{
				success: false,
				error: error?.message || 'Failed to build mock webpage'
			},
			{ status: 500 }
		);
	}
};

function normalizeTheme(raw?: string): ThemeKey {
	if (!raw) return 'Minimalistic';
	const match = ['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'].find(
		(candidate) => candidate.toLowerCase() === String(raw).toLowerCase()
	);
	return (match as ThemeKey) || 'Minimalistic';
}

async function buildThemePage(
	theme: ThemeKey,
	brandData: any,
	slides: Array<{ name: string; html: string }>
) {
	const safeSlides = ensureSlides(slides, brandData);

	switch (theme) {
		case 'Minimalistic': {
			const result = await buildMinimalisticFromSlides({ slides: safeSlides, brandData });
			const html = await renderReactTemplate('Minimalistic', {
				title: `${result.brandConfig.brandName} – Minimalistic`,
				brandConfig: result.brandConfig,
				fontImports: result.googleFontImports
			});
			return { html, brandConfig: result.brandConfig };
		}
		case 'Maximalistic': {
			const result = await buildMaximalisticPage({ slides: safeSlides, brandData, theme: 'Maximalistic' });
			const html = await renderReactTemplate('Maximalistic', {
				title: `${result.brand.brandName} – Maximalistic`,
				brandConfig: result.brand,
				templateContent: result.content,
				fontImports: result.fontImports
			});
			return { html, brandConfig: result.brand };
		}
		case 'Funky': {
			const result = await buildFunkyFromSlides({ slides: safeSlides, brandData });
			const html = await renderReactTemplate('Funky', {
				title: `${result.brandConfig.brandName} – Funky`,
				brandConfig: result.brandConfig,
				fontImports: result.googleFontImports
			});
			return { html, brandConfig: result.brandConfig };
		}
		case 'Futuristic':
		default: {
			const result = await buildFuturisticThemeConfig(brandData, safeSlides);
			const brandConfig = result.brandConfigOverrides;
			if (!brandConfig) {
				throw new Error('Futuristic builder did not return brand config');
			}
			const html = await renderReactTemplate('Futuristic', {
				title: `${brandConfig.brandName} – Futuristic`,
				brandConfig,
				fontImports: result.googleFontImports
			});
			return { html, brandConfig };
		}
	}
}

function ensureSlides(
	slides: Array<{ name: string; html: string }> = [],
	brandData: any
): Array<{ name: string; html: string }> {
	if (slides.length) {
		return slides;
	}

	const brandName = brandData?.brand_name || brandData?.brandName || 'Brand Overview';
	const industry =
		brandData?.industry ||
		brandData?.brand_domain ||
		brandData?.brandType ||
		brandData?.selectedIndustry ||
		'Industry';
	const description =
		brandData?.short_description ||
		brandData?.shortDescription ||
		brandData?.description ||
		'A modern brand ready to launch its digital presence.';
	const values = brandData?.brandValues || brandData?.values || '';

	const html = `
		<section style="padding:64px;font-family:Inter, sans-serif;background:#f8fafc;color:#0f172a;">
			<h1 style="font-size:40px;margin-bottom:16px;">${brandName}</h1>
			<p style="font-size:18px;margin-bottom:12px;">${description}</p>
			<p style="font-size:16px;margin-bottom:8px;"><strong>Industry:</strong> ${industry}</p>
			${values ? `<p style="font-size:16px;"><strong>Values:</strong> ${values}</p>` : ''}
		</section>
	`;

	return [
		{
			name: brandName,
			html
		}
	];
}

async function renderReactTemplate(
	themeDir: string,
	options: {
		title?: string;
		brandConfig?: Record<string, any>;
		templateContent?: Record<string, any>;
		fontImports?: string[];
	}
) {
	const buildDir = join(process.cwd(), 'react-templates', themeDir, 'build');
	const indexPath = join(buildDir, 'index.html');

	if (!existsSync(indexPath)) {
		throw new Error(
			`Build output missing for ${themeDir}. Run "cd react-templates/${themeDir} && npm run build" first.`
		);
	}

	let html = readFileSync(indexPath, 'utf-8');
	html = inlineCss(html, buildDir);
	html = inlineJs(html, buildDir);

	const fontLinks =
		options.fontImports?.length
			? options.fontImports
					.filter(Boolean)
					.map((href) => `<link rel="stylesheet" href="${href}" />`)
					.join('\n')
			: '';

	const globalsScript = `
			<script>
				${options.brandConfig ? `window.__BRAND_CONFIG__ = ${JSON.stringify(options.brandConfig)};` : ''}
				${
					options.templateContent
						? `window.__TEMPLATE_CONTENT__ = ${JSON.stringify(options.templateContent)};`
						: ''
				}
			</script>
	`;

	const injection = `${fontLinks}\n${globalsScript}`;

	if (html.includes('</head>')) {
		html = html.replace('</head>', `${injection}</head>`);
	} else {
		html = `${injection}${html}`;
	}

	const title = options.title || `${options.brandConfig?.brandName || 'Brand'} – ${themeDir}`;
	html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

	return html;
}

function inlineCss(html: string, buildDir: string) {
	return html.replace(/<link[^>]+href=\"\.\/assets\/([^\"']+\.css)\"[^>]*>/g, (match, file) => {
		const cssPath = join(buildDir, 'assets', file);
		if (existsSync(cssPath)) {
			const css = readFileSync(cssPath, 'utf-8');
			return `<style>${css}</style>`;
		}
		return match;
	});
}

function inlineJs(html: string, buildDir: string) {
	return html.replace(/<script[^>]+src=\"\.\/assets\/([^\"']+\.js)\"[^>]*><\/script>/g, (match, file) => {
		const jsPath = join(buildDir, 'assets', file);
		if (existsSync(jsPath)) {
			const js = readFileSync(jsPath, 'utf-8');
			return `<script type="module">${js}</script>`;
		}
		return match;
	});
}

