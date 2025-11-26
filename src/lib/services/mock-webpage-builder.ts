/**
 * Mock Webpage Builder Service
 *
 * Orchestrates the building of mock webpages by:
 * 1. Fetching images from Pexels/Unsplash
 * 2. Generating custom content using Gemini API
 * 3. Applying brand colors and data
 * 4. Returning structured data for template rendering
 */

import type { TempBrandData } from './temp-brand-storage';

export interface BuildResult {
	images: {
		hero: string | null;
		gallery: string[];
	};
	content: Record<string, any>;
	theme: string;
}

/**
 * Build a mock webpage for the given brand data
 */
export async function buildMockWebpage(
	brandData: any,
	theme: 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic'
): Promise<BuildResult> {
	const themeLower = theme.toLowerCase();
	const brandName = brandData?.brand_name || brandData?.brandName || 'Brand';

	// Step 1: Fetch images
	const images = await fetchBrandImages(brandName, themeLower, 4);

	// Step 2: Generate content for different sections
	const content = await generateContent(brandData, themeLower);

	// Step 3: Apply brand colors
	const colorPalette = brandData?.colorPalette || brandData?.brandColors || [];
	if (colorPalette.length > 0) {
		content.primaryColor = colorPalette[0];
		content.secondaryColor = colorPalette[1] || colorPalette[0];
	}

	return {
		images: {
			hero: images[0] || null,
			gallery: images.slice(1)
		},
		content,
		theme: themeLower
	};
}

/**
 * Fetch brand-specific images from APIs
 * Uses Pexels and Unsplash APIs to get brand-related images
 */
async function fetchBrandImages(
	brandName: string,
	theme: string,
	count: number
): Promise<string[]> {
	try {
		const response = await fetch('/api/mock-webpage/images', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				brandName,
				theme,
				imageType: 'lifestyle',
				count
			})
		});

		if (response.ok) {
			const data = await response.json();
			if (data.success && data.images) {
				return data.images;
			}
		}
	} catch (error) {
		console.error('Failed to fetch images:', error);
	}

	// Fallback images
	const fallbacks: Record<string, string[]> = {
		minimalistic: [
			'https://images.unsplash.com/photo-1708758487256-8a3a73565dc2?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1721146378270-1b93839f7ae7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80'
		],
		maximalistic: [
			'https://images.unsplash.com/photo-1663072302693-d92701c4ef42?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1722938687754-d77c159da3c8?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?auto=format&fit=crop&w=1200&q=80'
		],
		funky: [
			'https://images.unsplash.com/photo-1685432531593-1afc8a152e5f?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1663082076137-486bc3ff6fd7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1573136810265-a584af43f98f?auto=format&fit=crop&w=1200&q=80'
		],
		futuristic: [
			'https://images.unsplash.com/photo-1613500429601-62a596776da7?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1200&q=80',
			'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80'
		]
	};

	return fallbacks[theme] || fallbacks.minimalistic;
}

/**
 * Generate custom content using Gemini API
 */
async function generateContent(brandData: any, theme: string): Promise<Record<string, any>> {
	try {
		const response = await fetch('/api/mock-webpage/content', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				brandData,
				theme,
				sectionType: 'hero'
			})
		});

		if (response.ok) {
			const data = await response.json();
			if (data.success && data.content) {
				return data.content;
			}
		}
	} catch (error) {
		console.error('Failed to generate content:', error);
	}

	// Fallback content
	const brandName = brandData?.brand_name || brandData?.brandName || 'Brand';
	return {
		heroTitle: `Welcome to ${brandName}`,
		heroDescription: `Experience the future of ${brandData?.industry || 'innovation'}.`,
		heroBadge: 'Featured',
		ctaPrimary: 'Get Started',
		ctaSecondary: 'Learn More',
		features: [],
		stats: []
	};
}
