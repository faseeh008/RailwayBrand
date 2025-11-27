import type { ThemeContentConfig, ThemeKey } from '$lib/types/theme-content';
import { buildFuturisticThemeConfig } from '../mockpagebuilder/buildfuturistic';

export function normalizeTheme(raw: string | undefined): ThemeKey {
	const value = (raw || 'Minimalistic') as ThemeKey;
	if (['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'].includes(value)) {
		return value;
	}
	return 'Minimalistic';
}

export async function buildThemeConfig(
	brandData: any,
	theme: ThemeKey,
	slides: Array<{ name: string; html: string }> = []
): Promise<ThemeContentConfig> {
	if (theme === 'Futuristic') {
		return buildFuturisticThemeConfig(brandData, slides);
	}
	return buildDefaultThemeConfig(brandData, theme);
}

function buildDefaultThemeConfig(
	brandData: any,
	theme: ThemeKey
): ThemeContentConfig {
	const brandName = brandData?.brand_name || brandData?.brandName || 'Brand';
	const brandType =
		brandData?.industry ||
		brandData?.selectedIndustry ||
		brandData?.brand_type ||
		'Brand';
	const description =
		brandData?.description ||
		brandData?.short_description ||
		brandData?.elevatorPitch ||
		'Welcome to our brand.';

	const palette: string[] =
		brandData?.color_palette ||
		brandData?.colorPalette ||
		brandData?.brandColors ||
		brandData?.slides?.brand_colors ||
		[];

	const [primary, secondary = primary || '#3b82f6', accent = secondary] = palette;
	const background =
		theme === 'Futuristic'
			? palette[3] || '#020617'
			: palette[3] || '#ffffff';
	const text = palette[4] || (theme === 'Futuristic' ? '#e5e7eb' : '#020617');

	const headingFont =
		brandData?.fonts?.primary ||
		brandData?.heading_font ||
		brandData?.font_family ||
		'Inter, sans-serif';
	const bodyFont = brandData?.font_family || headingFont;

	const googleFontImports: string[] = [];

	const iconStyle: ThemeContentConfig['iconStyle'] =
		brandData?.iconStyle || 'line';

	return {
		theme,
		brandName,
		brandType,
		description,
		logoUrl: brandData?.logo_url || brandData?.logoUrl || '',
		heroImage: '',
		galleryImages: [],
		palette,
		primary: primary || '#3b82f6',
		secondary,
		accent,
		background,
		text,
		headingFont,
		bodyFont,
		googleFontImports,
		iconStyle,
		vibe: theme,
		isMinimalistic: theme === 'Minimalistic',
		isMaximalistic: theme === 'Maximalistic',
		isFunky: theme === 'Funky',
		isFuturistic: theme === 'Futuristic',
		stats: brandData?.stats || [],
		features: brandData?.features || [],
		brandConfigOverrides: undefined
	};
}
