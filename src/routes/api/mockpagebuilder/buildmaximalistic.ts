import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { ThemeKey } from '$lib/types/theme-content';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lightweight representation of the React template BrandConfig so we can
 * hydrate the Maximalistic UI without importing from the React bundle.
 */
export interface BrandConfig {
	brandName: string;
	brandDescription: string;
	logoUrl: string;
	colorPalette: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		text: string;
	};
	fonts: {
		heading: string;
		body: string;
	};
	images: {
		hero: string;
		gallery: string[];
	};
	industry: string;
	stats: Array<{ value: string; label: string }>;
	features: Array<{ title: string; description: string }>;
	contact: {
		email?: string;
		phone?: string;
		address?: string;
	};
}

export interface TemplateContent {
	hero: {
		badgeLabel: string;
		highlights: string[];
		description: string;
		primaryCta: string;
		secondaryCta: string;
		metrics: Array<{ value: string; label: string }>;
		collageLabels: string[];
	};
	about: {
		badges: string[];
		titleLines: string[];
		paragraphs: string[];
		pillars: Array<{ title: string; description: string }>;
	};
	products: {
		badgeLabel: string;
		headingLines: string[];
		description: string;
		ctaLabel: string;
		items: Array<{
			name: string;
			description: string;
			price: string;
			badge: string;
			rating: number;
			imageIndex?: number;
			variant: 'primary' | 'secondary' | 'accent';
		}>;
	};
	testimonials: {
		badgeLabel: string;
		headingLines: string[];
		entries: Array<{
			name: string;
			role: string;
			quote: string;
			rating: number;
			imageIndex?: number;
		}>;
		stats: Array<{ value: string; label: string }>;
	};
	gallery: {
		badgeLabel: string;
		headingLines: string[];
		description: string;
		ctaLabel: string;
		tiles: Array<{ likes: number; comments: number; imageIndex?: number }>;
		videoTitle: string;
		videoSubtitle: string;
		videoCta: string;
	};
	footer: {
		brandLines: string[];
		tagline: string;
		socialLinks: Array<{ label: string; url: string }>;
		quickLinks: Array<{ label: string; url: string }>;
		contact: {
			address: string;
			phone: string;
			email: string;
		};
		newsletter: {
			placeholder: string;
			intro: string;
			ctaLabel: string;
		};
		hours: {
			heading: string;
			details: string;
		};
		bottomNote: string;
		copyright: string;
		legalLinks: Array<{ label: string; url: string }>;
	};
}


export interface SlideData {
	name: string;
	html: string;
}

interface BrandExtraction {
	name: string;
	description: string;
	vibe: ThemeKey;
	industry: string;
	fonts: {
		heading: string;
		body: string;
		imports: string[];
	};
	palette: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		text: string;
	};
	logoUrl: string;
	summary: string;
	stats: Array<{ value: string; label: string }>;
	features: Array<{ title: string; description: string }>;
}

export interface MaximalisticBuildResult {
	brand: BrandConfig;
	content: TemplateContent;
	fontImports: string[];
	theme: ThemeKey;
	rawSlides: SlideData[];
}

const UNSPLASH_ACCESS_KEY = resolveEnv(['UNSPLASH_ACCESS_KEY', 'UNSPLASH_KEY']);
const PEXELS_API_KEY = resolveEnv(['PEXELS_API_KEY', 'PEXELS_KEY']);

function resolveEnv(keys: string[]): string | undefined {
	if (typeof process === 'undefined' || !process.env) return undefined;
	for (const key of keys) {
		const value = process.env[key];
		if (value) {
			return value.trim().replace(/^["']|["']$/g, '');
		}
	}
	return undefined;
}

/**
 * Entry point to orchestrate the Maximalistic build pipeline.
 */
export async function buildMaximalisticPage(
	context: {
		slides?: SlideData[];
		brandData?: any;
		theme?: ThemeKey;
	}
): Promise<MaximalisticBuildResult> {
	const slides = context.slides ?? [];
	const brandData = context.brandData ?? {};
	const theme: ThemeKey = context.theme || brandData?.selectedTheme || 'Maximalistic';

	await delay(3000);

	const extracted = extractBrandInfo(slides, brandData, theme);
	const images = await fetchBrandImages(extracted);
	const narrative = await generateMaximalisticCopy(extracted, slides);
	const brand = buildBrandConfig(extracted, images, narrative);
	const content = mapNarrativeToTemplate(extracted.name, narrative);

	return {
		brand,
		content,
		fontImports: extracted.fonts.imports,
		theme,
		rawSlides: slides
	};
}

function extractBrandInfo(slides: SlideData[], brandData: any, theme: ThemeKey): BrandExtraction {
	const slideText = slides.map((slide) => stripHtml(slide.html)).join('\n');
	const colors = extractColors(slides, brandData);
	const fonts = extractFonts(slides, brandData);
	const stats = brandData?.stats || [];
	const features = brandData?.features || [];
	const industry =
		brandData?.industry ||
		brandData?.brand_domain ||
		brandData?.brandType ||
		inferIndustryFromSlides(slideText) ||
		'Creative Studio';

	return {
		name: brandData?.brand_name || brandData?.brandName || slides[0]?.name || 'Untitled Brand',
		description:
			brandData?.short_description ||
			brandData?.description ||
			generateFallbackDescription(industry),
		vibe: theme || 'Maximalistic',
		industry,
		fonts,
		palette: colors,
		logoUrl: brandData?.logo_url || brandData?.logoUrl || '',
		summary: slideText.slice(0, 2000),
		stats,
		features
	};
}

function extractColors(slides: SlideData[], brandData: any) {
	const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
	const slideColors = new Set<string>();

	slides.forEach((slide) => {
		const matches = slide.html.match(colorRegex);
		matches?.forEach((color) => slideColors.add(color));
	});

	const dataColors = [
		...(brandData?.color_palette || []),
		...(brandData?.palette || []),
		...(brandData?.brandColors || []),
		...(brandData?.colors || [])
	]
		.filter((value: string) => typeof value === 'string' && colorRegex.test(value))
		.map((value: string) => value.match(colorRegex)?.[0] || value);

	const palette = [...slideColors, ...dataColors].filter((color, index, arr) => arr.indexOf(color) === index);

	const [primary, secondary, accent, background, text] = [
		palette[0] || '#f97316',
		palette[1] || '#ec4899',
		palette[2] || '#fde047',
		palette[3] || '#ffffff',
		palette[4] || '#0a0a0a'
	];

	return { primary, secondary, accent, background, text };
}

function extractFonts(slides: SlideData[], brandData: any) {
	const fontRegex = /font-family\s*:\s*([^;"}]+)/gi;
	const fontSet = new Set<string>();

	const pushFont = (value?: string) => {
		if (!value) return;
		const cleaned = value
			.replace(/['"]/g, '')
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean)[0];
		if (cleaned) {
			fontSet.add(cleaned);
		}
	};

	pushFont(brandData?.fonts?.heading);
	pushFont(brandData?.fonts?.body);
	pushFont(brandData?.font_family);

	slides.forEach((slide) => {
		let match: RegExpExecArray | null;
		while ((match = fontRegex.exec(slide.html)) !== null) {
			pushFont(match[1]);
		}
	});

	const fonts = Array.from(fontSet);
	const heading = fonts[0] || 'Space Grotesk';
	const body = fonts[1] || fonts[0] || 'Inter';

	return {
		heading: `${heading}, sans-serif`,
		body: `${body}, sans-serif`,
		imports: buildGoogleFontImports([heading, body])
	};
}

function buildGoogleFontImports(fonts: string[]) {
	return fonts
		.filter(Boolean)
		.map((font) =>
			`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.replace(/['"]/g, ''))}:wght@400;600;700&display=swap`
		);
}

async function fetchBrandImages(extracted: BrandExtraction) {
	const query = [extracted.industry, extracted.vibe, extracted.name]
		.filter(Boolean)
		.join(' ');

	const urls: string[] = [];

	if (UNSPLASH_ACCESS_KEY) {
		try {
			const res = await fetch(
				`https://api.unsplash.com/search/photos?per_page=5&orientation=landscape&query=${encodeURIComponent(
					query
				)}`,
				{
					headers: {
						Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
					}
				}
			);
			if (res.ok) {
				const data = await res.json();
				for (const photo of data.results ?? []) {
					if (photo?.urls?.regular) {
						urls.push(photo.urls.regular);
						if (urls.length === 5) break;
					}
				}
			}
		} catch (err) {
			console.warn('[buildmaximalistic] Unsplash fetch failed', err);
		}
	}

	if (urls.length < 5 && PEXELS_API_KEY) {
		try {
			const res = await fetch(
				`https://api.pexels.com/v1/search?per_page=5&orientation=landscape&query=${encodeURIComponent(
					query
				)}`,
				{
					headers: {
						Authorization: PEXELS_API_KEY
					}
				}
			);
			if (res.ok) {
				const data = await res.json();
				for (const photo of data.photos ?? []) {
					if (photo?.src?.large) {
						urls.push(photo.src.large);
						if (urls.length === 5) break;
					}
				}
			}
		} catch (err) {
			console.warn('[buildmaximalistic] Pexels fetch failed', err);
		}
	}

	if (!urls.length) {
		urls.push(
			'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80'
		);
	}

	return {
		hero: urls[0],
		gallery: urls.slice(1)
	};
}

async function generateMaximalisticCopy(extracted: BrandExtraction, slides: SlideData[]) {
	if (!env.GOOGLE_GEMINI_API) {
		return buildDefaultNarrative(extracted.name);
	}

	try {
		const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API);
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
		const prompt = buildNarrativePrompt(extracted, slides);
		const result = await model.generateContent(prompt);
		const text = result.response.text();
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return buildDefaultNarrative(extracted.name);
		}
		return JSON.parse(jsonMatch[0]);
	} catch (err) {
		console.warn('[buildmaximalistic] Gemini narrative failed', err);
		return buildDefaultNarrative(extracted.name);
	}
}

function buildNarrativePrompt(extracted: BrandExtraction, slides: SlideData[]) {
	const slideSummary = slides
		.map((slide) => `${slide.name}:\n${stripHtml(slide.html)}`)
		.slice(0, 6)
		.join('\n\n');

	return `
You are a maximalist brand storyteller. Craft energetic, high-impact marketing copy for a web template.
Brand: ${extracted.name}
Vibe: ${extracted.vibe}
Industry: ${extracted.industry}
Voice: vibrant, confident, celebratory.

Slides provided by the user:
${slideSummary}

Return STRICT JSON (no markdown) matching this shape:
{
  "hero": {
    "badgeLabel": "...",
    "highlights": ["WORD", "WORD", "WORD"],
    "description": "...",
    "primaryCta": "...",
    "secondaryCta": "...",
    "metrics": [{"value":"500+", "label":"Projects"}],
    "collageLabels": ["Seasonal", "Limited", "Iconic"]
  },
  "about": {
    "badges": ["..."],
    "titleLines": ["...", "..."],
    "paragraphs": ["...", "..."],
    "pillars": [{"title":"", "description":""}]
  },
  "products": {
    "badgeLabel": "...",
    "headingLines": ["...", "..."],
    "description": "...",
    "ctaLabel": "...",
    "items": [{
      "name": "...",
      "description": "...",
      "price": "$24",
      "badge": "...",
      "rating": 4.8,
      "variant": "primary"
    }]
  },
  "testimonials": {
    "badgeLabel": "...",
    "headingLines": ["...", "..."],
    "entries": [{"name":"", "role":"", "quote":"", "rating":5}],
    "stats": [{"value":"", "label":""}]
  },
  "gallery": {
    "badgeLabel": "...",
    "headingLines": ["...", "..."],
    "description": "...",
    "ctaLabel": "...",
    "tiles": [{"likes":1200, "comments":58}],
    "videoTitle": "...",
    "videoSubtitle": "...",
    "videoCta": "..."
  },
  "footer": {
    "brandLines": ["${extracted.name}", "${extracted.vibe}"],
    "tagline": "...",
    "socialLinks": [{"label":"Instagram", "url":"https://instagram.com"}],
    "quickLinks": [{"label":"About", "url":"#"}],
    "contact": {
      "address": "Street, City",
      "phone": "+1 (555) 123-4567",
      "email": "hello@example.com"
    },
    "newsletter": {
      "placeholder": "Email",
      "intro": "...",
      "ctaLabel": "Join"
    },
    "hours": {
      "heading": "Studio hours",
      "details": "Mon–Fri • 9a–8p"
    },
    "bottomNote": "...",
    "copyright": "© ${new Date().getFullYear()} ${extracted.name}",
    "legalLinks": [{"label":"Privacy", "url":"#"}]
  }
}
`;
}

function buildBrandConfig(
	extracted: BrandExtraction,
	images: { hero: string; gallery: string[] },
	narrative: any
): BrandConfig {
	return {
		brandName: extracted.name,
		brandDescription: extracted.description,
		logoUrl: extracted.logoUrl,
		colorPalette: extracted.palette,
		fonts: {
			heading: extracted.fonts.heading,
			body: extracted.fonts.body
		},
		images: {
			hero: images.hero,
			gallery: images.gallery
		},
		industry: extracted.industry,
		stats: narrative?.hero?.metrics || extracted.stats || [],
		features: narrative?.about?.pillars || extracted.features || [],
		contact: narrative?.footer?.contact || {}
	};
}

function mapNarrativeToTemplate(brandName: string, narrative: any): TemplateContent {
	const defaults = buildDefaultNarrative(brandName);
	const safe = (key: keyof typeof defaults, section?: any) => section || defaults[key];
	return {
		hero: safe('hero', narrative?.hero),
		about: safe('about', narrative?.about),
		products: safe('products', narrative?.products),
		testimonials: safe('testimonials', narrative?.testimonials),
		gallery: safe('gallery', narrative?.gallery),
		footer: safe('footer', narrative?.footer)
	};
}

function stripHtml(html: string) {
	return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateFallbackDescription(industry: string) {
	return `A bold ${industry.toLowerCase()} collective crafting unforgettable experiences.`;
}

function inferIndustryFromSlides(text: string): string | null {
	if (/culinary|menu|chef|restaurant/i.test(text)) return 'Culinary Studio';
	if (/fashion|runway|collection|atelier/i.test(text)) return 'Fashion House';
	if (/tech|saas|platform|product/i.test(text)) return 'Tech Platform';
	if (/beauty|skincare|cosmetic/i.test(text)) return 'Beauty Brand';
	return null;
}

function buildDefaultNarrative(brandName: string) {
	return {
		hero: {
			badgeLabel: 'Established Visionaries',
			highlights: [brandName, 'Bold Impact', 'Every Moment'],
			description: 'We craft loud, unforgettable experiences for brave brands.',
			primaryCta: 'Book A Call',
			secondaryCta: 'See Work',
			metrics: [
				{ value: '250+', label: 'Launches' },
				{ value: '4.9⭐', label: 'Client Score' },
				{ value: '40', label: 'Cities' }
			],
			collageLabels: ['Seasonal', 'Limited', 'Iconic']
		},
		about: {
			badges: ['Awarded', 'Globally Sourced', 'Artist Led'],
			titleLines: ['Maximalist storytelling', 'designed for modern launches'],
			paragraphs: [
				`${brandName} curates immersive creative programs fueled by color, energy, and high-touch service.`,
				'Every activation is layered with texture, sound, and bold culinary choices for contagious energy.'
			],
			pillars: [
				{ title: 'Creative Labs', description: 'Immersive strategy sprints blending data + instinct.' },
				{ title: 'Daily Harvest', description: 'Producers and florals sourced from independent makers.' }
			]
		},
		products: {
			badgeLabel: 'Signature Capsules',
			headingLines: ['Hero Concepts', 'engineered for spectacle'],
			description: 'Modular experience kits for pop-ups, press drops, and cultural premieres.',
			ctaLabel: 'View Playbook',
			items: []
		},
		testimonials: {
			badgeLabel: 'Hear the buzz',
			headingLines: ['Why visionary teams', 'choose us on repeat'],
			entries: [],
			stats: [
				{ value: '92%', label: 'Repeat partners' },
				{ value: '48h', label: 'Average response' }
			]
		},
		gallery: {
			badgeLabel: 'Studio feed',
			headingLines: ['Live drops', 'happening now'],
			description: 'A rolling capture of our most recent installs, tastings, and scenography tests.',
			ctaLabel: 'Follow live',
			tiles: [],
			videoTitle: 'Inside the studio',
			videoSubtitle: 'Watch the process unfold.',
			videoCta: 'Play film'
		},
		footer: {
			brandLines: [brandName, 'Studios'],
			tagline: 'Maximalist direction for ambitious launches.',
			socialLinks: [
				{ label: 'Instagram', url: '#' },
				{ label: 'Pinterest', url: '#' },
				{ label: 'Behance', url: '#' }
			],
			quickLinks: [
				{ label: 'About', url: '#' },
				{ label: 'Capabilities', url: '#' },
				{ label: 'Studios', url: '#' },
				{ label: 'Press', url: '#' }
			],
			contact: {
				address: '129 Spring Street, New York',
				phone: '+1 (212) 555-0198',
				email: 'hello@example.com'
			},
			newsletter: {
				placeholder: 'Email address',
				intro: 'Monthly recaps of launches, residencies, and drops.',
				ctaLabel: 'Join'
			},
			hours: {
				heading: 'Studio availability',
				details: 'Mon–Fri • 9a–8p  |  Sat • 10a–4p'
			},
			bottomNote: 'Crafted alongside our culinary + scenography partners.',
			copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
			legalLinks: [
				{ label: 'Privacy', url: '#' },
				{ label: 'Terms', url: '#' }
			]
		}
	};
}


