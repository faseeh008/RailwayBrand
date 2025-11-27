export type ThemeKey = 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic';

export interface ThemeContentConfig {
	theme: ThemeKey;

	// Brand basics
	brandName: string;
	brandType: string; // e.g. Fashion, SaaS, Food
	description: string;

	// Visuals
	logoUrl: string;
	heroImage: string;
	galleryImages: string[];

	// Colors
	palette: string[]; // raw colors from slides / builder
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	text: string;

	// Typography
	headingFont: string;
	bodyFont: string;
	googleFontImports: string[]; // full CSS URLs for <link> or @import

	// Icons / visual style
	iconStyle: 'line' | 'filled' | 'duotone';

	// Theme-specific flags
	vibe: ThemeKey;
	isMinimalistic: boolean;
	isMaximalistic: boolean;
	isFunky: boolean;
	isFuturistic: boolean;

	// Optional extra data for sections
	stats?: Array<{ value: string; label: string }>;
	features?: Array<{ title: string; description: string }>;
	/**
	 * Optional brand-config overrides for React templates (e.g. Futuristic UI)
	 */
	brandConfigOverrides?: Record<string, any>;
}


