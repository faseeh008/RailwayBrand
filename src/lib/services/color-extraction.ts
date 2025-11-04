import { env } from '$lib/env';

// Color extraction service configuration
const COLOR_SERVICE_URL = process.env.COLOR_SERVICE_URL || 'http://localhost:8001';

export interface ExtractedColor {
	name: string;
	hex: string;
	rgb: [number, number, number];
	cmyk: [number, number, number, number];
}

export interface BrandColorSystem {
	primary: ExtractedColor[];
	secondary: ExtractedColor[];
	neutrals: ExtractedColor[];
	background: ExtractedColor[];
}

export interface ExtractedPalette {
	colors: ExtractedColor[];
}

export interface ColorExtractionResponse {
	success: boolean;
	extracted_palette: ExtractedPalette;
	brand_color_system: BrandColorSystem;
}

export interface TypographyRecommendation {
	name: string;
	reasoning: string;
	usage: string;
}

export interface TypographyHierarchy {
	headings: string;
	body: string;
	captions: string;
}

export interface TypographyResponse {
	primary_font: TypographyRecommendation;
	supporting_font: TypographyRecommendation;
	hierarchy: TypographyHierarchy;
	guidelines: string[];
}

export interface TypographyExtractionResponse {
	success: boolean;
	typography: TypographyResponse;
}

/**
 * Extract colors from logo using Python microservice
 */
export async function extractColorsFromLogo(
	logoFile: File,
	colorCount: number = 5
): Promise<ColorExtractionResponse> {
	try {
		const formData = new FormData();
		formData.append('file', logoFile);
		formData.append('color_count', colorCount.toString());
		formData.append('api_key', env.GOOGLE_GEMINI_API);

		const response = await fetch(`${COLOR_SERVICE_URL}/extract-colors`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || 'Color extraction failed');
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error('Color extraction error:', error);
		throw new Error(`Failed to extract colors: ${error.message}`);
	}
}

/**
 * Detect font from logo using Python microservice
 */
export async function detectFontFromLogo(logoFile: File): Promise<{ detected_font: string | null; has_text: boolean }> {
	try {
		const formData = new FormData();
		formData.append('file', logoFile);
		formData.append('api_key', env.GOOGLE_GEMINI_API);

		const response = await fetch(`${COLOR_SERVICE_URL}/detect-font`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || 'Font detection failed');
		}

		const result = await response.json();
		return {
			detected_font: result.detected_font,
			has_text: result.has_text
		};
	} catch (error) {
		console.error('Font detection error:', error);
		return { detected_font: null, has_text: false };
	}
}

/**
 * Extract typography recommendations from logo using Python microservice
 */
export async function extractTypographyFromLogo(
	logoFile: File,
	brandInfo: {
		brandName: string;
		brandDomain: string;
		shortDescription?: string;
		mood?: string;
		audience?: string;
	}
): Promise<TypographyExtractionResponse> {
	try {
		// First, try to detect the exact font
		const fontDetection = await detectFontFromLogo(logoFile);
		
		const formData = new FormData();
		formData.append('file', logoFile);
		formData.append('brand_name', brandInfo.brandName);
		formData.append('brand_domain', brandInfo.brandDomain);
		formData.append('short_description', brandInfo.shortDescription || '');
		formData.append('mood', brandInfo.mood || 'Professional');
		formData.append('audience', brandInfo.audience || 'General audience');
		formData.append('api_key', env.GOOGLE_GEMINI_API);
		
		// Pass detected font to typography analysis
		if (fontDetection.detected_font) {
			formData.append('detected_font', fontDetection.detected_font);
		}

		const response = await fetch(`${COLOR_SERVICE_URL}/extract-typography`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || 'Typography extraction failed');
		}

		const result = await response.json();
		
		// Add detected font info to the result
		return {
			...result,
			detected_font: fontDetection.detected_font,
			has_text_in_logo: fontDetection.has_text
		};
	} catch (error) {
		console.error('Typography extraction error:', error);
		throw new Error(`Failed to extract typography: ${error.message}`);
	}
}

/**
 * Check if color extraction service is healthy
 */
export async function checkColorServiceHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${COLOR_SERVICE_URL}/health`);
		return response.ok;
	} catch (error) {
		console.error('Color service health check failed:', error);
		return false;
	}
}

/**
 * Convert extracted colors to format expected by the progressive generation system
 */
export function convertExtractedColorsToProgressiveFormat(
	brandColorSystem: BrandColorSystem
): string {
	let content = `## Extracted Color Palette from Logo\n\n`;

	// Primary colors
	if (brandColorSystem.primary.length > 0) {
		content += `**Primary Colors**:\n`;
		brandColorSystem.primary.forEach((color) => {
			content += `- **${color.name}**: ${color.hex} - Primary brand color from logo\n`;
		});
		content += `\n`;
	}

	// Secondary colors
	if (brandColorSystem.secondary.length > 0) {
		content += `**Secondary Colors**:\n`;
		brandColorSystem.secondary.forEach((color) => {
			content += `- **${color.name}**: ${color.hex} - Supporting accent color\n`;
		});
		content += `\n`;
	}

	// Neutral colors
	if (brandColorSystem.neutrals.length > 0) {
		content += `**Neutral Colors**:\n`;
		brandColorSystem.neutrals.forEach((color) => {
			content += `- **${color.name}**: ${color.hex} - Text and UI elements\n`;
		});
		content += `\n`;
	}

	// Background colors
	if (brandColorSystem.background.length > 0) {
		content += `**Background Colors**:\n`;
		brandColorSystem.background.forEach((color) => {
			content += `- **${color.name}**: ${color.hex} - Background and layout\n`;
		});
		content += `\n`;
	}

	content += `**Usage Guidelines**:\n`;
	content += `- Primary colors should be used for main brand elements and key messaging\n`;
	content += `- Secondary colors provide visual variety and support primary colors\n`;
	content += `- Neutral colors ensure readability and professional appearance\n`;
	content += `- Background colors create contrast and visual hierarchy\n`;

	return content;
}

/**
 * Convert extracted typography to format expected by the progressive generation system
 */
export function convertExtractedTypographyToProgressiveFormat(
	typography: TypographyResponse
): string {
	let content = `## Typography Recommendations from Logo Analysis\n\n`;

	// Primary font
	content += `**Primary Font**: ${typography.primary_font.name} - ${typography.primary_font.reasoning}\n\n`;

	// Supporting font
	content += `**Supporting Font**: ${typography.supporting_font.name} - ${typography.supporting_font.reasoning}\n\n`;

	// Hierarchy
	content += `**Font Hierarchy**:\n`;
	content += `- **Headings**: ${typography.hierarchy.headings}\n`;
	content += `- **Body Text**: ${typography.hierarchy.body}\n`;
	content += `- **Captions**: ${typography.hierarchy.captions}\n\n`;

	// Guidelines
	content += `**Typography Guidelines**:\n`;
	typography.guidelines.forEach((guideline, index) => {
		content += `${index + 1}. ${guideline}\n`;
	});

	return content;
}
