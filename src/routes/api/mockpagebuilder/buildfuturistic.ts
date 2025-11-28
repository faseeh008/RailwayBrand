import { env } from '$env/dynamic/private';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ThemeContentConfig } from '$lib/types/theme-content';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Slide = { name: string; html: string };

interface FuturisticCopy {
	heroEyebrow: string;
	heroHeadline: string;
	heroDescription: string;
	heroPrimaryCta: string;
	heroSecondaryCta: string;
	heroScrollHint: string;
	featuresHeading: string;
	featuresSubheading: string;
	features: Array<{ title: string; description: string }>;
	stats: Array<{ value: string; label: string }>;
	technologyHeading: string;
	technologyDescription: string;
	technologyMetrics: Array<{ label: string; value: number }>;
	technologyCta: string;
	innovationHeading: string;
	innovationDescription: string;
	innovationCta: string;
	ctaHeading: string;
	ctaDescription: string;
	ctaPrimary: string;
	ctaSecondary: string;
	trustMessage: string;
	footerDescription: string;
	footerColumns: Array<{ title: string; links: string[] }>;
	navLinks: Array<{ label: string; href: string }>;
}

interface FuturisticBrandConfig {
	brandName: string;
	brandDescription: string;
	logoUrl: string;
	colorPalette: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		text: string;
		muted?: string;
		border?: string;
		surface?: string;
	};
	fonts: {
		heading: string;
		body: string;
	};
	images: {
		hero: string;
		technology?: string;
		innovation?: string;
		gallery: string[];
	};
	industry: string;
	stats: Array<{ value: string; label: string }>;
	features: Array<{ title: string; description: string }>;
	contact: Record<string, any>;
	navigation?: {
		links: Array<{ label: string; href: string }>;
		ctaLabel: string;
	};
	hero?: {
		eyebrow: string;
		primaryCta: string;
		secondaryCta: string;
		scrollHint: string;
	};
	featuresContent?: {
		heading: string;
		subheading: string;
		cards: Array<{ title: string; description: string }>;
	};
	technologyContent?: {
		heading: string;
		description: string;
		metrics: Array<{ label: string; value: number }>;
		ctaLabel: string;
	};
	innovationContent?: {
		heading: string;
		description: string;
		ctaLabel: string;
	};
	ctaContent?: {
		heading: string;
		description: string;
		primaryCta: string;
		secondaryCta: string;
		trustMessage: string;
	};
	footerContent?: {
		description: string;
		columns: Array<{ title: string; links: string[] }>;
		copyright: string;
	};
}

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;"']+)/gi;
const TEXT_REGEX = />\s*([^<>]+?)\s*</g;

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

const SYSTEM_FONTS = [
	'Arial',
	'Helvetica',
	'Inter',
	'Verdana',
	'Segoe UI',
	'sans-serif',
	'Roboto',
	'System-ui'
];

export async function buildFuturisticThemeConfig(
	brandData: any,
	slides: Slide[] = []
): Promise<ThemeContentConfig> {
	await delay(3000);

	const brandName = brandData?.brand_name || brandData?.brandName || 'Brand';
	const brandIndustry =
		brandData?.industry ||
		brandData?.selectedIndustry ||
		brandData?.brand_type ||
		brandData?.brandDomain ||
		'Technology';
	const vibe = brandData?.mood || brandData?.selectedMood || 'Futuristic';

	const palette = derivePalette(brandData, slides);
	const fonts = deriveFonts(brandData, slides);
	const slidesSummary = summarizeSlides(slides);

	const [images, copy] = await Promise.all([
		fetchIndustryImages(brandIndustry, brandName, vibe),
		generateFuturisticCopy({
			brandName,
			industry: brandIndustry,
			vibe,
			slidesSummary
		})
	]);

	const brandConfig: FuturisticBrandConfig = {
		brandName,
		brandDescription: copy.heroDescription,
		logoUrl: extractLogoUrl(brandData),
		colorPalette: {
			primary: palette.primary,
			secondary: palette.secondary,
			accent: palette.accent,
			background: palette.background,
			text: palette.text,
			muted: palette.muted,
			border: palette.border,
			surface: palette.surface
		},
		fonts: {
			heading: fonts.headingFont,
			body: fonts.bodyFont
		},
		images: {
			hero: images.hero,
			technology: images.technology,
			innovation: images.innovation,
			gallery: images.gallery
		},
		industry: brandIndustry,
		stats: copy.stats,
		features: copy.features,
		contact: brandData?.contactInfo || brandData?.contact || {},
		navigation: {
			links: copy.navLinks,
			ctaLabel: copy.heroPrimaryCta
		},
		hero: {
			eyebrow: copy.heroEyebrow || vibe,
			primaryCta: copy.heroPrimaryCta,
			secondaryCta: copy.heroSecondaryCta,
			scrollHint: copy.heroScrollHint
		},
		featuresContent: {
			heading: copy.featuresHeading,
			subheading: copy.featuresSubheading,
			cards: copy.features
		},
		technologyContent: {
			heading: copy.technologyHeading,
			description: copy.technologyDescription,
			metrics: copy.technologyMetrics,
			ctaLabel: copy.technologyCta
		},
		innovationContent: {
			heading: copy.innovationHeading,
			description: copy.innovationDescription,
			ctaLabel: copy.innovationCta
		},
		ctaContent: {
			heading: copy.ctaHeading,
			description: copy.ctaDescription,
			primaryCta: copy.ctaPrimary,
			secondaryCta: copy.ctaSecondary,
			trustMessage: copy.trustMessage
		},
		footerContent: {
			description: copy.footerDescription,
			columns: copy.footerColumns,
			copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`
		}
	};

	return {
		theme: 'Futuristic',
		brandName,
		brandType: brandIndustry,
		description: copy.heroDescription,
		logoUrl: brandConfig.logoUrl,
		heroImage: images.hero,
		galleryImages: images.gallery,
		palette: palette.palette,
		primary: palette.primary,
		secondary: palette.secondary,
		accent: palette.accent,
		background: palette.background,
		text: palette.text,
		headingFont: fonts.headingFont,
		bodyFont: fonts.bodyFont,
		googleFontImports: fonts.googleFontImports,
		iconStyle: 'line',
		vibe: 'Futuristic',
		isMinimalistic: false,
		isMaximalistic: false,
		isFunky: false,
		isFuturistic: true,
		stats: copy.stats,
		features: copy.features,
		brandConfigOverrides: brandConfig
	};
}

function derivePalette(brandData: any, slides: Slide[]) {
	const brandPalette = collectBrandPalette(brandData);

	const candidateColors = new Set<string>();
	slides.forEach((slide) => {
		const matches = slide.html.match(HEX_COLOR_REGEX);
		if (matches) {
			matches.forEach((value) => {
				const normalized = normalizeHex(value);
				if (normalized) {
					candidateColors.add(normalized);
				}
			});
		}
	});

	const defaults = ['#3b82f6', '#8b5cf6', '#06b6d4', '#030617', '#f8fafc'];
	const palette = Array.from(new Set([...brandPalette, ...candidateColors, ...defaults])).slice(0, 6);

	const [primary, secondary, accent, background, text, muted] = [
		palette[0] || defaults[0],
		palette[1] || defaults[1],
		palette[2] || defaults[2],
		palette[3] || defaults[3],
		palette[4] || defaults[4],
		palette[5] || '#94a3b8'
	];

	return {
		palette,
		primary,
		secondary,
		accent,
		background,
		text,
		muted,
		border: `${accent}33`,
		surface: `${background}f2`
	};
}

function deriveFonts(brandData: any, slides: Slide[]) {
	const fontCandidates: string[] = [];

	const pushFont = (value?: string) => {
		if (value && typeof value === 'string') {
			const cleaned = value.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
			if (cleaned) {
				fontCandidates.push(cleaned);
			}
		}
	};

	pushFont(brandData?.typography?.headingFont);
	pushFont(brandData?.typography?.bodyFont);
	pushFont(brandData?.fonts?.heading);
	pushFont(brandData?.fonts?.body);
	pushFont(brandData?.headingFont);
	pushFont(brandData?.bodyFont);

	slides.forEach((slide) => {
		let match: RegExpExecArray | null;
		while ((match = FONT_FAMILY_REGEX.exec(slide.html))) {
			pushFont(match[1]);
		}
	});

	const defaultHeading = 'Space Grotesk';
	const defaultBody = 'Inter';
	const headingFont = fontCandidates[0] || defaultHeading;
	const bodyFont = fontCandidates[1] || fontCandidates[0] || defaultBody;

	const googleFontImports = Array.from(
		new Set(
			[headingFont, bodyFont]
				.filter((font) => !isSystemFont(font))
				.map((font) => toGoogleImport(font))
		)
	);

	return { headingFont, bodyFont, googleFontImports };
}

function summarizeSlides(slides: Slide[]): string {
	return slides
		.map((slide) => {
			const text = stripHtml(slide.html).slice(0, 500);
			return `${slide.name}: ${text}`;
		})
		.join('\n')
		.slice(0, 4000);
}

function stripHtml(html: string): string {
	return html
		.replace(TEXT_REGEX, (_, text) => `${text} `)
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeHex(value?: string): string | null {
	if (!value || typeof value !== 'string') return null;
	const match = value.match(HEX_COLOR_REGEX);
	return match ? match[0].toLowerCase() : null;
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
		brandData?.colors?.primary?.hex,
		brandData?.colors?.secondary?.hex,
		brandData?.colors?.accent?.hex,
		brandData?.colors?.text?.hex,
		brandData?.colors?.background?.hex,
		...(Array.isArray(brandData?.palette) ? brandData.palette : []),
		...(Array.isArray(brandData?.colorPalette) ? brandData.colorPalette : []),
		...(Array.isArray(brandData?.brandColors) ? brandData.brandColors : [])
	].forEach(pushColor);

	return Array.from(new Set(collected));
}

function isSystemFont(font: string): boolean {
	const normalized = font.toLowerCase();
	return SYSTEM_FONTS.some((systemFont) => normalized.includes(systemFont.toLowerCase()));
}

function toGoogleImport(font: string): string {
	const family = font.replace(/\s+/g, '+');
	return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
}

async function fetchIndustryImages(industry: string, brandName: string, vibe: string) {
	const query = [brandName, industry, vibe, 'futuristic'].filter(Boolean).join(' ');
	const count = 5;
	const gallery: string[] = [];

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
						gallery.push(photo.urls.regular);
						if (gallery.length === count) break;
					}
				}
			}
		} catch (err) {
			console.warn('[buildFuturistic] Unsplash fetch failed', err);
		}
	}

	if (gallery.length < count && env.PEXELS_API_KEY) {
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
						gallery.push(photo.src.large);
						if (gallery.length === count) break;
					}
				}
			}
		} catch (err) {
			console.warn('[buildFuturistic] Pexels fetch failed', err);
		}
	}

	const hero = gallery[0] || '';
	return {
		hero,
		technology: gallery[1] || hero,
		innovation: gallery[2] || hero,
		gallery
	};
}

async function generateFuturisticCopy(input: {
	brandName: string;
	industry: string;
	vibe: string;
	slidesSummary: string;
}): Promise<FuturisticCopy> {
	if (!env?.GOOGLE_GEMINI_API) {
		return buildFallbackCopy(input.brandName, input.industry, input.vibe);
	}

	try {
		const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
		const prompt = `
You are designing website copy for a futuristic technology brand.
Brand Name: ${input.brandName}
Industry: ${input.industry}
Vibe: ${input.vibe}

Slides Summary:
${input.slidesSummary}

Return ONLY valid JSON matching this TypeScript interface:
{
  "heroEyebrow": string,
  "heroHeadline": string,
  "heroDescription": string,
  "heroPrimaryCta": string,
  "heroSecondaryCta": string,
  "heroScrollHint": string,
  "featuresHeading": string,
  "featuresSubheading": string,
  "features": Array<{ "title": string, "description": string }>,
  "stats": Array<{ "value": string, "label": string }>,
  "technologyHeading": string,
  "technologyDescription": string,
  "technologyMetrics": Array<{ "label": string, "value": number }>,
  "technologyCta": string,
  "innovationHeading": string,
  "innovationDescription": string,
  "innovationCta": string,
  "ctaHeading": string,
  "ctaDescription": string,
  "ctaPrimary": string,
  "ctaSecondary": string,
  "trustMessage": string,
  "footerDescription": string,
  "footerColumns": Array<{ "title": string, "links": string[] }>,
  "navLinks": Array<{ "label": string, "href": string }>
}
Ensure all strings are concise, inspirational, and futuristic. Stats values can be percentages or short metrics.
`;
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const rawText = response.text().trim();
		const parsed = safeJsonParse(rawText);
		return normalizeCopy(parsed, input.brandName, input.industry, input.vibe);
	} catch (error) {
		console.warn('[buildFuturistic] Gemini copy generation failed', error);
		return buildFallbackCopy(input.brandName, input.industry, input.vibe);
	}
}

function safeJsonParse(text: string): Partial<FuturisticCopy> {
	const clean = text
		.replace(/```json/gi, '')
		.replace(/```/g, '')
		.trim();
	const match = clean.match(/\{[\s\S]*\}/);
	return match ? JSON.parse(match[0]) : JSON.parse(clean);
}

function normalizeCopy(
	copy: Partial<FuturisticCopy>,
	brandName: string,
	industry: string,
	vibe: string
): FuturisticCopy {
	const fallback = buildFallbackCopy(brandName, industry, vibe);
	return {
		...fallback,
		...copy,
		features: copy.features?.length ? copy.features : fallback.features,
		stats: copy.stats?.length ? copy.stats : fallback.stats,
		technologyMetrics: copy.technologyMetrics?.length
			? copy.technologyMetrics
			: fallback.technologyMetrics,
		footerColumns: copy.footerColumns?.length ? copy.footerColumns : fallback.footerColumns,
		navLinks: copy.navLinks?.length ? copy.navLinks : fallback.navLinks
	};
}

function buildFallbackCopy(brandName: string, industry: string, vibe: string): FuturisticCopy {
	return {
		heroEyebrow: `${vibe} ${industry}`,
		heroHeadline: `${brandName} shapes tomorrow's experiences`,
		heroDescription:
			`We fuse intelligent design with ${industry.toLowerCase()} insight to launch future-ready products that people love.`,
		heroPrimaryCta: 'Start Your Journey',
		heroSecondaryCta: 'Watch Demo',
		heroScrollHint: 'Scroll to explore the future',
		featuresHeading: 'Powerful Features',
		featuresSubheading: 'Built for tomorrow, deployed today',
		features: [
			{ title: 'Adaptive Intelligence', description: 'Continuously learns from every interaction.' },
			{ title: 'Immersive Experiences', description: 'Beautiful, responsive touch-points across devices.' },
			{ title: 'Secure by Design', description: 'Enterprise-grade protection with human simplicity.' },
			{ title: 'Modular Platform', description: 'Compose new journeys without rewriting the stack.' }
		],
		stats: [
			{ value: '99.9%', label: 'Platform uptime' },
			{ value: '12M+', label: 'Active users' },
			{ value: '45%', label: 'Faster launches' }
		],
		technologyHeading: 'Cutting-Edge Technology',
		technologyDescription:
			`Quantum-inspired architectures, realtime AI copilots, and privacy-safe data fabrics engineered for ${industry.toLowerCase()} leaders.`,
		technologyMetrics: [
			{ label: 'Processing Speed', value: 98 },
			{ label: 'Accuracy Rate', value: 99 },
			{ label: 'Efficiency', value: 96 }
		],
		technologyCta: 'Explore Technology',
		innovationHeading: 'Innovation That Matters',
		innovationDescription:
			`Guiding visionary teams from prototype to planetary scale with collaborative playbooks and immersive workshops.`,
		innovationCta: 'Schedule a Demo',
		ctaHeading: 'Ready to Transform?',
		ctaDescription:
			`Partner with ${brandName} to launch bold, measurable outcomes across every ${industry.toLowerCase()} touchpoint.`,
		ctaPrimary: 'Get Started Free',
		ctaSecondary: 'Contact Sales',
		trustMessage: 'Trusted by category-defining teams worldwide',
		footerDescription: `Building the future of ${industry.toLowerCase()} with ${vibe.toLowerCase()} precision.`,
		footerColumns: [
			{ title: 'Product', links: ['Features', 'Pricing', 'Security', 'Enterprise'] },
			{ title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
			{ title: 'Connect', links: ['LinkedIn', 'Twitter', 'GitHub', 'Discord'] }
		],
		navLinks: [
			{ label: 'Features', href: '#features' },
			{ label: 'Technology', href: '#technology' },
			{ label: 'About', href: '#about' }
		]
	};
}