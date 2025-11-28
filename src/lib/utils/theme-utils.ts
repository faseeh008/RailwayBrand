export const PREVIEW_THEMES = ['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'] as const;
export type PreviewTheme = (typeof PREVIEW_THEMES)[number];

const KEYWORD_THEME_MAP: Array<{ theme: PreviewTheme; patterns: RegExp[] }> = [
	{
		theme: 'Minimalistic',
		patterns: [
			/minimal/i,
			/clean/i,
			/simple/i,
			/modern/i,
			/sleek/i,
			/elegant/i,
			/calm/i,
			/refined/i,
			/classic/i
		]
	},
	{
		theme: 'Maximalistic',
		patterns: [
			/maximal/i,
			/bold/i,
			/vibrant/i,
			/expressive/i,
			/lux/i,
			/glam/i,
			/artsy/i,
			/opulent/i
		]
	},
	{
		theme: 'Funky',
		patterns: [
			/funk/i,
			/playful/i,
			/retro/i,
			/groovy/i,
			/whims/i,
			/quirky/i,
			/pop/i
		]
	},
	{
		theme: 'Futuristic',
		patterns: [
			/future/i,
			/futur/i,
			/tech/i,
			/neon/i,
			/digital/i,
			/cyber/i,
			/innov/i,
			/sci[-\s]?fi/i
		]
	}
];

function matchThemeValue(value: string | null | undefined): PreviewTheme | null {
	if (!value) return null;
	const normalized = value.trim().toLowerCase();
	const direct = PREVIEW_THEMES.find((theme) => theme.toLowerCase() === normalized);
	return direct ?? null;
}

function matchThemeByKeywords(value: string | null | undefined): PreviewTheme | null {
	if (!value) return null;
	const normalized = value.toLowerCase();
	for (const entry of KEYWORD_THEME_MAP) {
		if (entry.patterns.some((pattern) => pattern.test(normalized))) {
			return entry.theme;
		}
	}
	return null;
}

export function normalizePreviewTheme(
	value: string | null | undefined,
	fallback: PreviewTheme = 'Minimalistic'
): PreviewTheme {
	return matchThemeValue(value) ?? fallback;
}

export function inferThemeFromMood(
	mood: string | null | undefined,
	fallback: PreviewTheme = 'Minimalistic'
): PreviewTheme {
	return matchThemeValue(mood) ?? matchThemeByKeywords(mood) ?? fallback;
}

export function inferThemeFromBrandData(
	brandData: any,
	fallback: PreviewTheme = 'Minimalistic'
): PreviewTheme {
	const candidates = [
		brandData?.selectedTheme,
		brandData?.selectedMood,
		brandData?.style,
		brandData?.theme,
		brandData?.brand_style,
		brandData?.mood,
		brandData?.brandInput?.selectedTheme,
		brandData?.brandInput?.selectedMood,
		brandData?.brand_input?.selectedTheme,
		brandData?.brand_input?.selectedMood
	];

	for (const candidate of candidates) {
		const theme = matchThemeValue(candidate) ?? matchThemeByKeywords(candidate);
		if (theme) {
			return theme;
		}
	}

	return fallback;
}

/**
 * Maps PreviewTheme to SlideVibe for use with SlideManager
 */
export type SlideVibe = 'default' | 'minimalist' | 'funky' | 'maximalist';

export function previewThemeToSlideVibe(theme: PreviewTheme): SlideVibe {
	switch (theme) {
		case 'Minimalistic':
			return 'minimalist';
		case 'Maximalistic':
			return 'maximalist';
		case 'Funky':
			return 'funky';
		case 'Futuristic':
		default:
			return 'default';
	}
}


