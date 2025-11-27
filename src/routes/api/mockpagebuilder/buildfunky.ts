import { JSDOM } from 'jsdom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { BrandConfig } from '../../../../react-templates/Funky/src/shared-brand-config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FunkySlide {
	name: string;
	html: string;
}

export interface FunkyBuildOptions {
	slides: FunkySlide[];
	brandData?: Record<string, any>;
}

export interface FunkyBuildResult {
	brandConfig: BrandConfig;
	googleFontImports: string[];
	uiTokens: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		text: string;
		vibe: string;
	};
	summary: {
		title: string;
		vibe: string;
		keywords: string[];
		description: string;
	};
	slideSample: string[];
}

interface BrandInsights {
	brandName: string;
	description: string;
	industry: string;
	vibe: string;
	palette: string[];
	fonts: {
		heading: string;
		body: string;
		imports: string[];
	};
	keywords: string[];
}

interface GeminiCopy {
	heroHeadline: string;
	heroDescription: string;
	stats: Array<{ value: string; label: string }>;
	features: Array<{ title: string; description: string }>;
	keywords: string[];
}

const DEFAULT_COLORS = ['#facc15', '#0ea5e9', '#f472b6', '#ffffff', '#0f172a'];
const DEFAULT_FONT = 'Inter, sans-serif';
const SYSTEM_FONTS = new Set([
	'inter',
	'system-ui',
	'arial',
	'helvetica',
	'georgia',
	'verdana',
	'tahoma',
	'times new roman',
	'serif',
	'sans-serif',
	'monospace'
]);

let geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

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

export async function buildFunkyFromSlides(options: FunkyBuildOptions): Promise<FunkyBuildResult> {
	if (!options.slides?.length) {
		throw new Error('buildFunkyFromSlides requires at least one slide');
	}

	await delay(3000);

	const slideSample = options.slides
		.slice(0, 5)
		.map((slide) => `${slide.name}: ${stripHtml(slide.html).slice(0, 280)}`);
	const insights = extractBrandInsights(options.slides, options.brandData);
	const geminiCopy = await generateFunkyCopy(insights, slideSample);
	const images = await fetchBrandImages(insights, 4);

	const palette = fillPalette(insights.palette);
	const [primary, secondary, accent, background, text] = palette;

	const brandConfig: BrandConfig = {
		brandName: insights.brandName,
		brandDescription: geminiCopy.heroDescription || insights.description,
		logoUrl: options.brandData?.logo_url || options.brandData?.logoUrl || '',
		colorPalette: {
			primary,
			secondary,
			accent,
			background,
			text
		},
		fonts: {
			heading: insights.fonts.heading,
			body: insights.fonts.body
		},
		images: {
			hero: images.hero || '',
			gallery: images.gallery
		},
		industry: insights.industry,
		stats: geminiCopy.stats,
		features: geminiCopy.features,
		contact: options.brandData?.contact || {}
	};

	return {
		brandConfig,
		googleFontImports: insights.fonts.imports,
		uiTokens: {
			primary,
			secondary,
			accent,
			background,
			text,
			vibe: insights.vibe
		},
		summary: {
			title: insights.brandName,
			vibe: insights.vibe,
			keywords: geminiCopy.keywords.length ? geminiCopy.keywords : insights.keywords,
			description: geminiCopy.heroHeadline || insights.description
		},
		slideSample
	};
}

function extractBrandInsights(
	slides: FunkySlide[],
	brandData?: Record<string, any>
): BrandInsights {
	const combinedMarkup = slides.map((slide) => slide.html).join('\n');
	const { headings, paragraphs, keywords } = parseSlides(slides);

	const brandName =
		brandData?.brand_name ||
		brandData?.brandName ||
		headings.find((text) => text.length <= 42 && /\b[A-Z]/.test(text)) ||
		'Brand Name';

	const description =
		brandData?.description ||
		brandData?.short_description ||
		paragraphs.find((text) => text.length > 60) ||
		paragraphs[0] ||
		'A bold brand built for expressive storytelling.';

	const industry =
		brandData?.industry ||
		brandData?.brand_type ||
		keywords.find((word) => /fashion|tech|music|beauty|agency|studio|retail/i.test(word)) ||
		'Creative Studio';

	const vibe =
		brandData?.mood ||
		brandData?.vibe ||
		(slides.find((slide) => /vibe|mood/i.test(slide.name))?.name ?? 'Funky');

	const fonts = resolveFonts(slides, brandData);
	const palette = extractColors(combinedMarkup, brandData);

	return {
		brandName,
		description,
		industry,
		vibe,
		palette,
		fonts,
		keywords
	};
}

function parseSlides(slides: FunkySlide[]) {
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

	return {
		headings,
		paragraphs,
		keywords: Array.from(new Set(keywords.map((word) => word.toLowerCase())))
	};
}

function cleanupText(value: string | null | undefined) {
	return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function resolveFonts(slides: FunkySlide[], brandData?: Record<string, any>) {
	const candidates = new Set<string>();
	const candidateList = [
		brandData?.fonts?.heading,
		brandData?.fonts?.body,
		brandData?.heading_font,
		brandData?.font_family,
		brandData?.fontFamily
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

function extractColors(markup: string, brandData?: Record<string, any>) {
	const regex = /#(?:[0-9a-fA-F]{3,8})\b/g;
	const slideMatches = Array.from(new Set(markup.match(regex) || []));

	const dataColors =
		brandData?.color_palette ||
		brandData?.colorPalette ||
		brandData?.brandColors ||
		brandData?.slides?.brand_colors ||
		[];

	const palette = [...slideMatches, ...dataColors].filter((color, index, arr) => arr.indexOf(color) === index);

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

async function generateFunkyCopy(
	insights: BrandInsights,
	slideSample: string[]
): Promise<GeminiCopy> {
	const defaultCopy: GeminiCopy = {
		heroHeadline: `${insights.brandName}: ${insights.vibe} energy`,
		heroDescription: insights.description,
		stats: [
			{ value: '24/7', label: 'Creative Flow' },
			{ value: '120+', label: 'Happy Clients' },
			{ value: '12', label: 'Brand Touchpoints' }
		],
		features: [
			{ title: 'Joyful Expressions', description: 'Turn every interaction into a playful moment.' },
			{ title: 'Bold Voice', description: 'A brand story that never whispers.' },
			{ title: 'Culture Ready', description: 'Made for social, retail, and experiential drops.' }
		],
		keywords: insights.keywords.slice(0, 5)
	};

	const model = getGeminiModel();
	if (!model) {
		return defaultCopy;
	}

	try {
		const prompt = `
You are an energetic brand copywriter. Using the brand inputs below, return JSON only with upbeat copy for a Funky web template.

Brand Name: ${insights.brandName}
Industry: ${insights.industry}
Vibe: ${insights.vibe}
Fonts: ${insights.fonts.heading} / ${insights.fonts.body}
Palette: ${insights.palette.join(', ')}
Slide Highlights: ${slideSample.join(' | ')}

Return a JSON object with:
{
  "heroHeadline": "max 12 words",
  "heroDescription": "max 35 words",
  "stats": [
    {"value": "short", "label": "short"},
    {"value": "short", "label": "short"},
    {"value": "short", "label": "short"}
  ],
  "features": [
    {"title": "max 4 words", "description": "max 18 words"},
    {"title": "max 4 words", "description": "max 18 words"},
    {"title": "max 4 words", "description": "max 18 words"}
  ],
  "keywords": ["word", "word", "word"]
}
`;
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text().trim();
		const jsonPayload = extractJson(text);
		const parsed = JSON.parse(jsonPayload) as GeminiCopy;

		return {
			heroHeadline: parsed.heroHeadline || defaultCopy.heroHeadline,
			heroDescription: parsed.heroDescription || defaultCopy.heroDescription,
			stats: parsed.stats?.length ? parsed.stats.slice(0, 3) : defaultCopy.stats,
			features: parsed.features?.length ? parsed.features.slice(0, 3) : defaultCopy.features,
			keywords: parsed.keywords?.length ? parsed.keywords : defaultCopy.keywords
		};
	} catch (error) {
		console.warn('[buildFunkyFromSlides] Gemini content generation failed', error);
		return defaultCopy;
	}
}

function extractJson(text: string) {
	const match = text.match(/\{[\s\S]*\}/);
	return match ? match[0] : text;
}

async function fetchBrandImages(insights: BrandInsights, count: number) {
	const results: string[] = [];
	const query = [insights.industry, insights.vibe, insights.brandName].filter(Boolean).join(' ');

	if (env.UNSPLASH_ACCESS_KEY) {
		try {
			const res = await fetch(
				`https://api.unsplash.com/search/photos?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`,
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
		} catch (error) {
			console.warn('[buildFunkyFromSlides] Unsplash fetch failed', error);
		}
	}

	if (results.length < count && env.PEXELS_API_KEY) {
		try {
			const res = await fetch(
				`https://api.pexels.com/v1/search?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`,
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
		} catch (error) {
			console.warn('[buildFunkyFromSlides] Pexels fetch failed', error);
		}
	}

	return {
		hero: results[0] ?? '',
		gallery: results.slice(1)
	};
}

function stripHtml(markup: string) {
	return markup
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
