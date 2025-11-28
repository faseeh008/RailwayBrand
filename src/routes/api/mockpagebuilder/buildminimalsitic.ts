import { JSDOM } from 'jsdom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { BrandConfig } from '../../../../react-templates/Minimalistic/src/shared-brand-config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract logo URL from brandData, checking multiple possible locations
 */
function extractLogoUrl(brandData?: any): string {
	if (!brandData) return '';
	
	// Direct logoUrl fields
	if (brandData.logoUrl) return brandData.logoUrl;
	if (brandData.logo_url) return brandData.logo_url;
	
	// From logo object
	if (brandData.logo?.primaryLogoUrl) return brandData.logo.primaryLogoUrl;
	if (brandData.logo?.primary) return brandData.logo.primary;
	
	// From logoFiles array (new format)
	if (Array.isArray(brandData.logoFiles) && brandData.logoFiles.length > 0) {
		const firstLogo = brandData.logoFiles[0];
		if (firstLogo?.fileData) return firstLogo.fileData;
		if (firstLogo?.data) return firstLogo.data;
		if (firstLogo?.fileUrl) return firstLogo.fileUrl;
		if (firstLogo?.filePath) return firstLogo.filePath;
	}
	
	// From logoData (base64)
	if (brandData.logoData) return brandData.logoData;
	
	return '';
}

export interface MinimalisticSlide {
	name: string;
	html: string;
}

export interface MinimalisticBuildOptions {
	slides: MinimalisticSlide[];
	brandData?: Record<string, any>;
}

export interface MinimalisticBuildResult {
	brandConfig: BrandConfig;
	googleFontImports: string[];
	images: {
		hero: string | null;
		gallery: string[];
	};
	summary: {
		title: string;
		industry: string;
		vibe: string;
		description: string;
		keywords: string[];
	};
	slideSample: string[];
}

interface BrandInsights {
	brandName: string;
	description: string;
	industry: string;
	vibe: string;
	fonts: {
		heading: string;
		body: string;
		imports: string[];
	};
	palette: string[];
	contact: {
		title?: string;
		email?: string;
		phone?: string;
		address?: string;
	};
	keywords: string[];
}

interface MinimalisticCopy {
	heroEyebrow: string;
	heroHeadline: string;
	heroDescription: string;
	heroPrimaryCta: string;
	heroSecondaryCta: string;
	stats: Array<{ value: string; label: string }>;
	aboutTitle: string;
	aboutDescription: string;
	aboutHighlights: string[];
	servicesTitle: string;
	servicesSubtitle: string;
	services: Array<{ title: string; description: string }>;
	navigationLinks: string[];
	navigationCtas: {
		cart: string;
		primary: string;
		mobile: string;
	};
	footerColumns: Array<{ title: string; links: string[] }>;
	keywords: string[];
}

const DEFAULT_COLORS = ['#0a0a0a', '#404040', '#e5e5e5', '#ffffff', '#0f172a'];
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,8})\b/g;
const DEFAULT_FONT = 'Inter, sans-serif';
const SYSTEM_FONTS = new Set(['inter', 'system-ui', 'arial', 'helvetica', 'georgia', 'verdana', 'tahoma', 'times new roman', 'serif', 'sans-serif', 'monospace']);

let geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
const envRecord = env as unknown as Record<string, string | undefined>;

export async function buildMinimalisticFromSlides(options: MinimalisticBuildOptions): Promise<MinimalisticBuildResult> {
	if (!options.slides?.length) {
		throw new Error('buildMinimalisticFromSlides requires at least one slide');
	}

	await delay(3000);

	const slideSample = options.slides.slice(0, 5).map((slide) => `${slide.name}: ${stripHtml(slide.html).slice(0, 240)}`);
	const insights = extractBrandInsights(options.slides, options.brandData);
	const copy = await generateMinimalisticCopy(insights, slideSample);
	const palette = fillPalette(insights.palette);
	const [primary, secondary, accent, background, text] = palette;
	const imagery = await fetchBrandImages(insights, 5);

	const brandConfig: BrandConfig = {
		brandName: insights.brandName,
		brandDescription: copy.heroDescription || insights.description,
		logoUrl: extractLogoUrl(options.brandData),
		colorPalette: buildColorPalette(primary, secondary, accent, background, text),
		fonts: {
			heading: insights.fonts.heading,
			body: insights.fonts.body
		},
		images: {
			hero: imagery.hero,
			gallery: imagery.gallery
		},
		industry: insights.industry,
		stats: copy.stats,
		navigation: buildNavigation(copy),
		heroContent: {
			eyebrow: copy.heroEyebrow,
			headline: copy.heroHeadline || insights.brandName,
			subheadline: copy.heroDescription,
			primaryCta: { label: copy.heroPrimaryCta || 'Explore Collection', icon: 'ArrowRight' },
			secondaryCta: { label: copy.heroSecondaryCta || 'Learn More' }
		},
		aboutContent: {
			title: copy.aboutTitle || `Why Choose ${insights.brandName}`,
			description: copy.aboutDescription || insights.description,
			highlights: copy.aboutHighlights?.length ? copy.aboutHighlights : ['Tailored experiences', 'Premium materials', 'Customer-first service'],
			highlightIcon: 'CheckCircle2'
		},
		servicesContent: buildServices(copy),
		footerContent: buildFooter(copy),
		contact: insights.contact
	};

	return {
		brandConfig,
		googleFontImports: insights.fonts.imports,
		images: imagery,
		summary: {
			title: insights.brandName,
			industry: insights.industry,
			vibe: insights.vibe,
			description: copy.heroHeadline || insights.description,
			keywords: copy.keywords.length ? copy.keywords : insights.keywords.slice(0, 5)
		},
		slideSample
	};
}

function extractBrandInsights(slides: MinimalisticSlide[], brandData?: Record<string, any>): BrandInsights {
	const { headings, paragraphs, keywords } = parseSlides(slides);

	const brandName =
		brandData?.brandName ||
		brandData?.brand_name ||
		headings.find((text) => text.length <= 40 && /^[A-Z][\w\s'&-]+$/.test(text)) ||
		'Modern Brand';

	const description =
		brandData?.shortDescription ||
		brandData?.short_description ||
		paragraphs.find((text) => text.length > 60) ||
		paragraphs[0] ||
		'A calm, detail-driven brand with an emphasis on timeless craft.';

	const industry =
		brandData?.industry ||
		brandData?.sector ||
		keywords.find((word) => /furniture|tech|wellness|fashion|studio|design|software|finance/i.test(word)) ||
		'Design Studio';

	const vibe =
		brandData?.selectedMood ||
		brandData?.vibe ||
		slides.find((slide) => /mood|vibe|tone/i.test(slide.name))?.name ||
		'Minimalistic';

	const fonts = resolveFonts(slides, brandData);
	const palette = extractColors(slides.map((s) => s.html).join('\n'), brandData);

	const contact =
		brandData?.contact || brandData?.contact_info || {
			title: 'Contact',
			email: brandData?.contactEmail,
			phone: brandData?.contactPhone,
			address: brandData?.contactAddress
		};

	return {
		brandName,
		description,
		industry,
		vibe,
		fonts,
		palette,
		contact,
		keywords
	};
}

function parseSlides(slides: MinimalisticSlide[]) {
	const headings: string[] = [];
	const paragraphs: string[] = [];
	const keywords: string[] = [];

	for (const slide of slides) {
		const dom = new JSDOM(slide.html);
		const doc = dom.window.document;

		for (const node of Array.from(doc.querySelectorAll('h1,h2,h3,h4'))) {
			const text = cleanupText(node.textContent);
			if (text) headings.push(text);
		}

		for (const node of Array.from(doc.querySelectorAll('p,li,blockquote'))) {
			const text = cleanupText(node.textContent);
			if (text) {
				paragraphs.push(text);
				keywords.push(...text.split(/[\s,]+/).filter((word) => word.length > 4));
			}
		}
	}

	return { headings, paragraphs, keywords: Array.from(new Set(keywords.map((word) => word.toLowerCase()))) };
}

function cleanupText(value: string | null | undefined) {
	return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function resolveFonts(slides: MinimalisticSlide[], brandData?: Record<string, any>) {
	const candidates = new Set<string>();
	const candidateList = [
		brandData?.fonts?.heading,
		brandData?.fonts?.body,
		brandData?.typography?.heading,
		brandData?.typography?.body,
		brandData?.fontFamily,
		brandData?.headingFont
	];

	candidateList.forEach((font) => {
		const normalized = normalizeFont(font);
		if (normalized) candidates.add(normalized);
	});

	for (const slide of slides) {
		const matches = slide.html.match(/font-family\s*:\s*([^;"'}]+)/gi);
		if (matches) {
			for (const match of matches) {
				const [, fontRaw] = match.split(':');
				const normalized = normalizeFont(fontRaw);
				if (normalized) candidates.add(normalized);
			}
		}
	}

	const [first = DEFAULT_FONT, second = first] = Array.from(candidates);

	const imports = Array.from(candidates)
		.filter((font) => !SYSTEM_FONTS.has(font.toLowerCase()))
		.map((font) => buildGoogleFontImport(font));

	return {
		heading: first,
		body: second,
		imports
	};
}

function normalizeFont(value?: string | null) {
	if (!value) return '';
	const primary = value.split(',')[0]?.replace(/['"]/g, '').trim();
	return primary || '';
}

function buildGoogleFontImport(fontName: string) {
	const encoded = fontName.trim().replace(/\s+/g, '+');
	return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
}

function extractColors(markup: string, brandData?: Record<string, any>): string[] {
	const brandPalette = collectBrandPalette(brandData);
	const slideMatches = Array.from(new Set(markup.match(HEX_COLOR_REGEX) || []))
		.map((value) => normalizeHex(value))
		.filter((color): color is string => color !== null);

	const palette = [...brandPalette, ...slideMatches]
		.filter((color, index, arr) => arr.indexOf(color) === index);

	return palette.length ? palette : DEFAULT_COLORS;
}

function fillPalette(palette: string[]) {
	const merged = [...palette];
	for (const color of DEFAULT_COLORS) {
		if (merged.length >= 5) break;
		if (!merged.includes(color)) merged.push(color);
	}

	return merged.slice(0, 5);
}

function buildColorPalette(primary: string, secondary: string, accent: string, background: string, text: string): BrandConfig['colorPalette'] {
	return {
		primary,
		primaryForeground: getContrast(primary),
		secondary,
		secondaryForeground: getContrast(secondary),
		accent,
		accentForeground: getContrast(accent),
		background,
		surface: lighten(background, 6),
		border: withAlpha(text, 0.08),
		text,
		mutedText: withAlpha(text, 0.72)
	};
}

function getContrast(hex: string) {
	const { r, g, b } = hexToRgb(hex);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.55 ? '#0a0a0a' : '#ffffff';
}

function lighten(hex: string, amount: number) {
	const { r, g, b } = hexToRgb(hex);
	const clamp = (value: number) => Math.max(0, Math.min(255, value));
	const factor = amount / 100;
	const nr = clamp(Math.round(r + (255 - r) * factor));
	const ng = clamp(Math.round(g + (255 - g) * factor));
	const nb = clamp(Math.round(b + (255 - b) * factor));
	return rgbToHex(nr, ng, nb);
}

function withAlpha(hex: string, alpha: number) {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function hexToRgb(hex: string) {
	const normalized = hex.replace('#', '');
	const bigint = parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16);
	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255
	};
}

function rgbToHex(r: number, g: number, b: number) {
	return `#${[r, g, b]
		.map((value) => {
			const clamped = Math.max(0, Math.min(255, value));
			return clamped.toString(16).padStart(2, '0');
		})
		.join('')}`;
}

function buildNavigation(copy: MinimalisticCopy): BrandConfig['navigation'] {
	const links = copy.navigationLinks?.length
		? copy.navigationLinks.map((label) => ({ label, href: `#${label.toLowerCase().replace(/\s+/g, '-')}` }))
		: [
				{ label: 'Products', href: '#products' },
				{ label: 'About', href: '#about' },
				{ label: 'Care', href: '#care' },
				{ label: 'Contact', href: '#contact' }
		  ];

	return {
		links,
		cartLabel: copy.navigationCtas?.cart || 'Cart',
		primaryCtaLabel: copy.navigationCtas?.primary || 'Shop Now',
		mobileCtaLabel: copy.navigationCtas?.mobile || 'Get Started',
		menuIcon: 'Menu',
		closeIcon: 'X'
	};
}

function buildServices(copy: MinimalisticCopy): BrandConfig['servicesContent'] {
	const iconOptions = ['Sofa', 'Armchair', 'Table2', 'Lamp', 'Bed', 'ShoppingBag'] as const;
	const items = copy.services?.length
		? copy.services.slice(0, 6).map((service, index) => ({
				title: service.title,
				description: service.description,
				icon: iconOptions[index % 6] as BrandConfig['servicesContent']['items'][0]['icon']
		  }))
		: [
				{ title: 'Service One', description: 'Measured, detail-driven offering.', icon: 'Lamp' as BrandConfig['servicesContent']['items'][0]['icon'] },
				{ title: 'Service Two', description: 'Partnerships rooted in craft.', icon: 'Table2' as BrandConfig['servicesContent']['items'][0]['icon'] },
				{ title: 'Service Three', description: 'Support that stays with you.', icon: 'ShoppingBag' as BrandConfig['servicesContent']['items'][0]['icon'] }
		  ];

	return {
		title: copy.servicesTitle || 'Our Services',
		subtitle: copy.servicesSubtitle || 'Intentional experiences across every touchpoint',
		items
	};
}

function buildFooter(copy: MinimalisticCopy): BrandConfig['footerContent'] {
	const columns =
		copy.footerColumns?.length > 0
			? copy.footerColumns.map((column) => ({
					title: column.title,
					links: column.links.map((label) => ({ label, href: '#' }))
			  }))
			: [
					{
						title: 'Products',
						links: [
							{ label: 'Living', href: '#' },
							{ label: 'Workspace', href: '#' },
							{ label: 'Objects', href: '#' }
						]
					},
					{
						title: 'Company',
						links: [
							{ label: 'About', href: '#' },
							{ label: 'Careers', href: '#' },
							{ label: 'Journal', href: '#' }
						]
					},
					{
						title: 'Resources',
						links: [
							{ label: 'Guides', href: '#' },
							{ label: 'FAQs', href: '#' },
							{ label: 'Support', href: '#' }
						]
					}
			  ];

	return {
		columns,
		social: [
			{ icon: 'Twitter', href: '#', label: 'Twitter' },
			{ icon: 'Github', href: '#', label: 'Github' },
			{ icon: 'Linkedin', href: '#', label: 'LinkedIn' },
			{ icon: 'Mail', href: 'mailto:hello@example.com', label: 'Email' }
		],
		legalText: '© {year} {brand}. All rights reserved.'
	};
}

async function generateMinimalisticCopy(insights: BrandInsights, slideSample: string[]): Promise<MinimalisticCopy> {
	const defaultCopy: MinimalisticCopy = {
		heroEyebrow: `${insights.industry} Excellence`,
		heroHeadline: `${insights.brandName} · Refined & Intentional`,
		heroDescription: insights.description,
		heroPrimaryCta: 'Explore Collection',
		heroSecondaryCta: 'Learn More',
		stats: [
			{ value: '120+', label: 'Client Spaces' },
			{ value: '24h', label: 'Response' },
			{ value: 'Global', label: 'Reach' }
		],
		aboutTitle: `Why ${insights.brandName}`,
		aboutDescription: insights.description,
		aboutHighlights: ['Measured, detail-driven craft', 'Dedicated experience team', 'Focused on long-term value'],
		servicesTitle: 'Our Services',
		servicesSubtitle: 'Solutions tailored for thoughtful brands',
		services: [
			{ title: 'Strategy', description: 'Research-backed frameworks for consistent growth.' },
			{ title: 'Experience', description: 'Omnichannel experiences built with intention.' },
			{ title: 'Care', description: 'Long-term partnerships that scale with you.' }
		],
		navigationLinks: ['Products', 'About', 'Journal', 'Contact'],
		navigationCtas: {
			cart: 'Cart',
			primary: 'Book Consultation',
			mobile: 'Start Project'
		},
		footerColumns: [],
		keywords: insights.keywords.slice(0, 5)
	};

	const model = getGeminiModel();
	if (!model) {
		return defaultCopy;
	}

	try {
		const prompt = `
You are a calm, detail-obsessed brand storyteller. Using the brand context below, return JSON only with concise copy for a Minimalistic React template.

Brand:
- Name: ${insights.brandName}
- Industry: ${insights.industry}
- Vibe: ${insights.vibe}
- Fonts: ${insights.fonts.heading} / ${insights.fonts.body}
- Palette: ${insights.palette.join(', ')}
- Slide clues: ${slideSample.join(' | ')}

Return JSON:
{
  "heroEyebrow": "max 4 words",
  "heroHeadline": "max 10 words",
  "heroDescription": "max 28 words",
  "heroPrimaryCta": "short CTA",
  "heroSecondaryCta": "short CTA",
  "stats": [
    {"value": "short", "label": "short"},
    {"value": "short", "label": "short"},
    {"value": "short", "label": "short"}
  ],
  "aboutTitle": "title",
  "aboutDescription": "max 40 words",
  "aboutHighlights": ["bullet", "bullet", "bullet"],
  "servicesTitle": "title",
  "servicesSubtitle": "max 20 words",
  "services": [
    {"title": "2-3 words", "description": "max 18 words"},
    {"title": "2-3 words", "description": "max 18 words"},
    {"title": "2-3 words", "description": "max 18 words"}
  ],
  "navigationLinks": ["word", "word", "word"],
  "navigationCtas": {
    "cart": "Cart label",
    "primary": "Desktop CTA",
    "mobile": "Mobile CTA"
  },
  "footerColumns": [
    {"title": "column", "links": ["item","item","item"]},
    {"title": "column", "links": ["item","item"]}
  ],
  "keywords": ["word","word","word"]
}
`;
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text().trim();
		const jsonPayload = extractJson(text);
		const parsed = JSON.parse(jsonPayload) as MinimalisticCopy;

		return {
			heroEyebrow: parsed.heroEyebrow || defaultCopy.heroEyebrow,
			heroHeadline: parsed.heroHeadline || defaultCopy.heroHeadline,
			heroDescription: parsed.heroDescription || defaultCopy.heroDescription,
			heroPrimaryCta: parsed.heroPrimaryCta || defaultCopy.heroPrimaryCta,
			heroSecondaryCta: parsed.heroSecondaryCta || defaultCopy.heroSecondaryCta,
			stats: parsed.stats?.length ? parsed.stats.slice(0, 3) : defaultCopy.stats,
			aboutTitle: parsed.aboutTitle || defaultCopy.aboutTitle,
			aboutDescription: parsed.aboutDescription || defaultCopy.aboutDescription,
			aboutHighlights: parsed.aboutHighlights?.length ? parsed.aboutHighlights : defaultCopy.aboutHighlights,
			servicesTitle: parsed.servicesTitle || defaultCopy.servicesTitle,
			servicesSubtitle: parsed.servicesSubtitle || defaultCopy.servicesSubtitle,
			services: parsed.services?.length ? parsed.services.slice(0, 6) : defaultCopy.services,
			navigationLinks: parsed.navigationLinks?.length ? parsed.navigationLinks : defaultCopy.navigationLinks,
			navigationCtas: parsed.navigationCtas || defaultCopy.navigationCtas,
			footerColumns: parsed.footerColumns?.length ? parsed.footerColumns : defaultCopy.footerColumns,
			keywords: parsed.keywords?.length ? parsed.keywords : defaultCopy.keywords
		};
	} catch (error) {
		console.warn('[buildMinimalisticFromSlides] Gemini copy generation failed', error);
		return defaultCopy;
	}
}

function extractJson(text: string) {
	const match = text.match(/\{[\s\S]*\}/);
	return match ? match[0] : text;
}

function collectBrandPalette(brandData?: Record<string, any>): string[] {
	const collected: string[] = [];
	const pushColor = (value?: string) => {
		const hex = normalizeHex(value);
		if (hex) collected.push(hex);
	};

	if (!brandData) return collected;

	const rawColors = brandData.colors;
	let parsedColors = rawColors;
	if (typeof rawColors === 'string') {
		try {
			parsedColors = JSON.parse(rawColors);
		} catch {
			parsedColors = rawColors;
		}
	}

	const semantic = parsedColors?.semantic;
	if (semantic) {
		Object.values(semantic).forEach((entry: any) => pushColor(entry?.hex || entry));
	}
	const neutral = parsedColors?.neutral;
	if (neutral) {
		Object.values(neutral).forEach((entry: any) => pushColor(entry?.hex || entry));
	}
	if (Array.isArray(parsedColors?.palette)) {
		parsedColors.palette.forEach((color: string) => pushColor(color));
	}

	[
		brandData?.primaryColor,
		brandData?.secondaryColor,
		brandData?.accentColor,
		brandData?.textColor,
		brandData?.backgroundColor,
		...(Array.isArray(brandData?.colorPalette) ? brandData.colorPalette : []),
		...(Array.isArray(brandData?.color_palette) ? brandData.color_palette : []),
		...(Array.isArray(brandData?.brandColors) ? brandData.brandColors : []),
		...(Array.isArray(brandData?.palette) ? brandData.palette : [])
	].forEach(pushColor);

	return Array.from(new Set(collected));
}

function normalizeHex(value?: string | null) {
	if (!value || typeof value !== 'string') return null;
	const match = value.match(HEX_COLOR_REGEX);
	return match ? match[0].toLowerCase() : null;
}

async function fetchBrandImages(insights: BrandInsights, count: number) {
	const results: string[] = [];
	const query = [insights.industry, insights.vibe, insights.brandName].filter(Boolean).join(' ');
	const unsplashKey = getEnvFallback('UNSPLASH_ACCESS_KEY') || getEnvFallback('UNSPLASH_APPLICATION_ID');
	const pexelsKey = getEnvFallback('PEXELS_API_KEY');

	if (unsplashKey) {
		try {
			const res = await fetch(
				`https://api.unsplash.com/search/photos?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`,
				{
					headers: {
						Authorization: `Client-ID ${unsplashKey}`
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
		} catch (error) {
			console.warn('[buildMinimalisticFromSlides] Unsplash fetch failed', error);
		}
	}

	if (results.length < count && pexelsKey) {
		try {
			const res = await fetch(
				`https://api.pexels.com/v1/search?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`,
				{
					headers: {
						Authorization: pexelsKey
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
		} catch (error) {
			console.warn('[buildMinimalisticFromSlides] Pexels fetch failed', error);
		}
	}

	return {
		hero: results[0] ?? null,
		gallery: results.slice(1)
	};
}

function stripHtml(markup: string) {
	return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getGeminiModel() {
	if (!env.GOOGLE_GEMINI_API) {
		return null;
	}
	if (!geminiModel) {
		const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API);
		geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
	}
	return geminiModel;
}

function getEnvFallback(key: string) {
	if (typeof process !== 'undefined' && process.env && process.env[key]) {
		return process.env[key];
	}
	return envRecord?.[key];
}