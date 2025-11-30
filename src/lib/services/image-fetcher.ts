/**
 * Convert image URL to base64 data URL for blob URL compatibility
 */
async function imageUrlToDataUrl(url: string): Promise<string> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
			}
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64 = buffer.toString('base64');
		const contentType = response.headers.get('content-type') || 'image/jpeg';
		return `data:${contentType};base64,${base64}`;
	} catch (error) {
		console.warn(`[image-fetcher] Failed to convert image to data URL: ${url}`, error);
		// Return a placeholder data URL instead of the original URL
		// This ensures blob URLs work even when external images fail
		const placeholderSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="Arial" font-size="24">Image unavailable</text></svg>`;
		const placeholderBase64 = Buffer.from(placeholderSvg).toString('base64');
		return `data:image/svg+xml;base64,${placeholderBase64}`;
	}
}

/**
 * Fetch images based on industry for mock webpage
 * Returns data URLs for blob URL compatibility
 */
export async function fetchIndustryImages(industry: string): Promise<{
	hero: string;
	gallery: string[];
}> {
	// Map industries to Unsplash search terms
	const industryMap: Record<string, string> = {
		'Fashion': 'fashion',
		'Technology': 'technology',
		'Furniture': 'furniture',
		'Food': 'food',
		'Healthcare': 'healthcare',
		'Finance': 'finance',
		'Education': 'education',
		'Retail': 'retail',
		'Real Estate': 'real-estate',
		'Travel': 'travel',
		'Beauty': 'beauty',
		'Fitness': 'fitness',
		'Automotive': 'automotive',
		'Entertainment': 'entertainment',
		'Legal': 'legal',
		'Consulting': 'consulting',
		'Manufacturing': 'manufacturing',
		'Energy': 'energy',
		'Agriculture': 'agriculture',
		'Construction': 'construction'
	};

	const searchTerm = industryMap[industry] || industry.toLowerCase().replace(/\s+/g, '-');

	// Use Unsplash Source API for free images
	const heroImageUrl = `https://source.unsplash.com/1600x900/?${searchTerm}`;
	const galleryImageUrls = [
		`https://source.unsplash.com/800x600/?${searchTerm}`,
		`https://source.unsplash.com/800x600/?${searchTerm},business`,
		`https://source.unsplash.com/800x600/?${searchTerm},modern`,
		`https://source.unsplash.com/800x600/?${searchTerm},professional`
	];

	// Convert all images to data URLs for blob URL compatibility
	const hero = await imageUrlToDataUrl(heroImageUrl);
	const gallery = await Promise.all(galleryImageUrls.map(url => imageUrlToDataUrl(url)));

	return {
		hero,
		gallery
	};
}

