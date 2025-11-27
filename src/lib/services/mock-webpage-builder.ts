/**
 * Mock Webpage Builder Service
 *
 * Orchestrates the building of mock webpages by:
 * 1. Fetching images from Pexels/Unsplash
 * 2. Generating custom content using Gemini API
 * 3. Applying brand colors and data
 * 4. Returning structured data for template rendering
 */

export interface BuildResult {
	theme: string;
	html: string;
	content?: Record<string, any>;
	images?: {
		hero: string | null;
		gallery: string[];
	};
	colors?: Record<string, string>;
	fontFamily?: string;
	brandConfig?: Record<string, any>;
}

export async function buildMockWebpage(
	brandData: any,
	theme: 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic',
	slides: Array<{ name: string; html: string }> = []
): Promise<BuildResult> {
	const response = await fetch('/api/mockpagebuilder', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			brandData,
			theme,
			slides
		})
	});

	if (!response.ok) {
		throw new Error('Failed to build mock webpage');
	}

	const data = await response.json();
	if (!data.success) {
		throw new Error(data.error || 'Failed to build mock webpage');
	}

	return data;
}
