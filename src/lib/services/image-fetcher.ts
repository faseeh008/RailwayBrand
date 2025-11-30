/**
 * Convert image URL to base64 data URL for blob URL compatibility
 */
async function imageUrlToDataUrl(url: string): Promise<string> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText} (${response.status})`);
		}
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64 = buffer.toString('base64');
		const contentType = response.headers.get('content-type') || 'image/jpeg';
		console.log(`[image-fetcher] Successfully converted image to data URL: ${url.substring(0, 50)}...`);
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
 * Check if brand name is relevant to the industry
 */
function isBrandNameRelevantToIndustry(brandName: string, industry: string): boolean {
	if (!brandName || brandName.length < 2) return false;
	
	const brandLower = brandName.toLowerCase();
	const industryLower = industry.toLowerCase();
	
	// Industry keywords that should match brand names
	const industryKeywords: Record<string, string[]> = {
		'Fashion': ['fashion', 'style', 'clothing', 'apparel', 'wear', 'boutique', 'designer', 'couture', 'garment', 'textile', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'jewelry', 'bag', 'watch'],
		'Technology': ['tech', 'software', 'digital', 'computer', 'system', 'data', 'cloud', 'ai', 'app', 'code', 'dev', 'tech', 'innovation', 'solutions', 'platform', 'network', 'cyber', 'web', 'internet'],
		'Furniture': ['furniture', 'furnish', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'bed', 'home', 'interior', 'decor', 'wood', 'design'],
		'Food': ['food', 'restaurant', 'cafe', 'bistro', 'kitchen', 'chef', 'cooking', 'cuisine', 'dining', 'meal', 'burger', 'pizza', 'bakery', 'coffee', 'bar', 'grill', 'deli', 'eatery'],
		'Healthcare': ['health', 'medical', 'care', 'hospital', 'clinic', 'doctor', 'wellness', 'therapy', 'pharmacy', 'dental', 'nurse', 'patient'],
		'Finance': ['finance', 'bank', 'money', 'capital', 'investment', 'wealth', 'financial', 'trading', 'accounting', 'credit', 'loan', 'asset'],
		'Education': ['education', 'school', 'university', 'college', 'learn', 'teach', 'academy', 'student', 'course', 'study', 'knowledge'],
		'Retail': ['retail', 'shop', 'store', 'market', 'mall', 'boutique', 'outlet', 'merchandise', 'sale', 'buy', 'purchase'],
		'Real Estate': ['real estate', 'property', 'home', 'house', 'estate', 'realty', 'realtor', 'land', 'building', 'construction', 'development'],
		'Travel': ['travel', 'trip', 'tour', 'journey', 'vacation', 'hotel', 'resort', 'flight', 'cruise', 'adventure', 'explore'],
		'Beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'salon', 'spa', 'beauty', 'glamour', 'aesthetic', 'treatment'],
		'Fitness': ['fitness', 'gym', 'workout', 'exercise', 'health', 'training', 'sport', 'athletic', 'strength', 'yoga', 'wellness'],
		'Automotive': ['auto', 'car', 'vehicle', 'motor', 'automotive', 'drive', 'truck', 'suv', 'dealership', 'garage', 'mechanic'],
		'Entertainment': ['entertainment', 'media', 'film', 'movie', 'music', 'show', 'theater', 'concert', 'event', 'production'],
		'Legal': ['legal', 'law', 'attorney', 'lawyer', 'justice', 'court', 'litigation', 'legal', 'firm', 'advocate'],
		'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'business', 'management', 'expert', 'professional'],
		'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial', 'manufacture', 'assembly', 'plant'],
		'Energy': ['energy', 'power', 'electric', 'solar', 'wind', 'renewable', 'oil', 'gas', 'utility'],
		'Agriculture': ['agriculture', 'farm', 'crop', 'agricultural', 'farming', 'harvest', 'livestock', 'organic'],
		'Construction': ['construction', 'build', 'contractor', 'construction', 'builder', 'architect', 'engineering']
	};
	
	const keywords = industryKeywords[industry] || [];
	
	// Check if brand name contains any industry-related keywords
	for (const keyword of keywords) {
		if (brandLower.includes(keyword)) {
			console.log(`[image-fetcher] Brand name "${brandName}" is relevant to industry "${industry}" (contains "${keyword}")`);
			return true;
		}
	}
	
	// Also check if industry name is in brand name
	if (brandLower.includes(industryLower) || industryLower.includes(brandLower)) {
		console.log(`[image-fetcher] Brand name "${brandName}" is relevant to industry "${industry}" (name overlap)`);
		return true;
	}
	
	console.log(`[image-fetcher] Brand name "${brandName}" is NOT relevant to industry "${industry}" - will use industry search only`);
	return false;
}

/**
 * Fetch images based on industry (priority 1) and brand name (priority 2) for mock webpage
 * Returns data URLs for blob URL compatibility
 */
export async function fetchIndustryImages(industry: string, brandName?: string): Promise<{
	hero: string;
	gallery: string[];
}> {
	console.log(`[image-fetcher] Fetching images for industry: ${industry}${brandName ? `, brand: ${brandName}` : ''}`);
	
	// Map industries to search terms for Unsplash API
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

	// Priority 1: Industry-related search term
	const industrySearchTerm = industryMap[industry] || industry.toLowerCase().replace(/\s+/g, '-');
	
	// Check if brand name is relevant to industry
	const isBrandRelevant = brandName ? isBrandNameRelevantToIndustry(brandName, industry) : false;
	
	// Extract relevant keywords from brand name if it's relevant
	let brandSearchTerm: string | null = null;
	if (brandName && isBrandRelevant) {
		const brandLower = brandName.toLowerCase();
		const industryKeywords: Record<string, string[]> = {
			'Fashion': ['fashion', 'style', 'clothing', 'apparel', 'wear', 'boutique', 'designer', 'couture', 'garment', 'textile', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'jewelry', 'bag', 'watch'],
			'Technology': ['tech', 'software', 'digital', 'computer', 'system', 'data', 'cloud', 'ai', 'app', 'code', 'dev', 'tech', 'innovation', 'solutions', 'platform', 'network', 'cyber', 'web', 'internet'],
			'Furniture': ['furniture', 'furnish', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'bed', 'home', 'interior', 'decor', 'wood', 'design'],
			'Food': ['food', 'restaurant', 'cafe', 'bistro', 'kitchen', 'chef', 'cooking', 'cuisine', 'dining', 'meal', 'burger', 'pizza', 'bakery', 'coffee', 'bar', 'grill', 'deli', 'eatery'],
			'Healthcare': ['health', 'medical', 'care', 'hospital', 'clinic', 'doctor', 'wellness', 'therapy', 'pharmacy', 'dental', 'nurse', 'patient'],
			'Finance': ['finance', 'bank', 'money', 'capital', 'investment', 'wealth', 'financial', 'trading', 'accounting', 'credit', 'loan', 'asset'],
			'Education': ['education', 'school', 'university', 'college', 'learn', 'teach', 'academy', 'student', 'course', 'study', 'knowledge'],
			'Retail': ['retail', 'shop', 'store', 'market', 'mall', 'boutique', 'outlet', 'merchandise', 'sale', 'buy', 'purchase'],
			'Real Estate': ['real estate', 'property', 'home', 'house', 'estate', 'realty', 'realtor', 'land', 'building', 'construction', 'development'],
			'Travel': ['travel', 'trip', 'tour', 'journey', 'vacation', 'hotel', 'resort', 'flight', 'cruise', 'adventure', 'explore'],
			'Beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'salon', 'spa', 'beauty', 'glamour', 'aesthetic', 'treatment'],
			'Fitness': ['fitness', 'gym', 'workout', 'exercise', 'health', 'training', 'sport', 'athletic', 'strength', 'yoga', 'wellness'],
			'Automotive': ['auto', 'car', 'vehicle', 'motor', 'automotive', 'drive', 'truck', 'suv', 'dealership', 'garage', 'mechanic'],
			'Entertainment': ['entertainment', 'media', 'film', 'movie', 'music', 'show', 'theater', 'concert', 'event', 'production'],
			'Legal': ['legal', 'law', 'attorney', 'lawyer', 'justice', 'court', 'litigation', 'legal', 'firm', 'advocate'],
			'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'business', 'management', 'expert', 'professional'],
			'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial', 'manufacture', 'assembly', 'plant'],
			'Energy': ['energy', 'power', 'electric', 'solar', 'wind', 'renewable', 'oil', 'gas', 'utility'],
			'Agriculture': ['agriculture', 'farm', 'crop', 'agricultural', 'farming', 'harvest', 'livestock', 'organic'],
			'Construction': ['construction', 'build', 'contractor', 'construction', 'builder', 'architect', 'engineering']
		};
		
		const keywords = industryKeywords[industry] || [];
		// Find the first matching keyword in brand name
		for (const keyword of keywords) {
			if (brandLower.includes(keyword)) {
				brandSearchTerm = keyword;
				break;
			}
		}
		// If no keyword found but brand contains industry name, use industry term
		if (!brandSearchTerm && brandLower.includes(industry.toLowerCase())) {
			brandSearchTerm = industrySearchTerm;
		}
	}
	
	console.log(`[image-fetcher] Search strategy: Industry="${industrySearchTerm}"${brandSearchTerm ? `, Brand keyword="${brandSearchTerm}" (relevant)` : ' (brand not relevant, using industry only)'}`);

	// Use Unsplash API
	const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '';
	
	let heroImageUrl: string;
	let galleryImageUrls: string[];

	if (unsplashApiKey) {
		// Use Unsplash API with authentication
		try {
			console.log(`[image-fetcher] Using Unsplash API with authentication`);
			
			// Strategy: Always prioritize industry-specific searches
			// Build search queries - industry is ALWAYS primary, brand is secondary if relevant
			let searchQueries: string[] = [];
			
			// PRIMARY: Always start with industry search (most reliable for relevance)
			searchQueries.push(industrySearchTerm);
			
			// SECONDARY: If brand keyword is relevant, add brand-specific searches
			if (brandSearchTerm && brandSearchTerm.length > 2) {
				// Try combined search: "brand industry" for more specific results
				searchQueries.push(`${brandSearchTerm} ${industrySearchTerm}`);
				// Then try brand keyword alone (less specific but might have good results)
				searchQueries.push(brandSearchTerm);
			}
			
			let photos: any[] = [];
			let bestQuery = '';
			
			// Try each search query and collect results
			for (const query of searchQueries) {
				try {
					console.log(`[image-fetcher] Searching Unsplash for: "${query}"`);
					const searchResponse = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`, {
						headers: {
							'Authorization': `Client-ID ${unsplashApiKey}`
						}
					});
					
					if (searchResponse.ok) {
						const data = await searchResponse.json();
						if (data.results && data.results.length > 0) {
							// Use the first successful search (industry is first, so it takes priority)
							if (photos.length === 0) {
								photos = data.results;
								bestQuery = query;
								console.log(`[image-fetcher] Found ${photos.length} images for "${query}" - using these results`);
								break; // Use first successful search (industry-first priority)
							}
						}
					} else {
						const errorText = await searchResponse.text();
						console.warn(`[image-fetcher] Unsplash API error for "${query}": ${searchResponse.status} - ${errorText}`);
					}
				} catch (err) {
					console.warn(`[image-fetcher] Search failed for "${query}":`, err);
					continue; // Try next query
				}
			}
			
			if (photos.length > 0) {
				console.log(`[image-fetcher] Using images from search: "${bestQuery}"`);
			}
			
			if (photos.length > 0) {
				// Use first photo as hero, rest for gallery
				heroImageUrl = photos[0].urls.regular || photos[0].urls.full || photos[0].urls.small;
				galleryImageUrls = photos.slice(1, 5).map((photo: any) => photo.urls.regular || photo.urls.full || photo.urls.small);
				// Fill remaining slots if needed by cycling through available photos
				while (galleryImageUrls.length < 4 && photos.length > 1) {
					const index = galleryImageUrls.length % (photos.length - 1) + 1;
					galleryImageUrls.push(photos[index].urls.regular || photos[index].urls.full || photos[index].urls.small);
				}
				// If still not enough, use hero image
				while (galleryImageUrls.length < 4) {
					galleryImageUrls.push(heroImageUrl);
				}
				console.log(`[image-fetcher] Successfully fetched ${1 + galleryImageUrls.length} industry-related images from Unsplash API`);
			} else {
				throw new Error('No photos found in Unsplash response for any search query');
			}
		} catch (error) {
			console.warn(`[image-fetcher] Unsplash API failed, falling back to industry-specific placeholder:`, error);
			// Fallback: Use industry-specific seed for consistent but industry-related placeholders
			const industrySeed = industrySearchTerm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
			heroImageUrl = `https://picsum.photos/1600/900?random=${industrySeed}`;
			galleryImageUrls = [
				`https://picsum.photos/800/600?random=${industrySeed + 1}`,
				`https://picsum.photos/800/600?random=${industrySeed + 2}`,
				`https://picsum.photos/800/600?random=${industrySeed + 3}`,
				`https://picsum.photos/800/600?random=${industrySeed + 4}`
			];
		}
	} else {
		// Use industry-specific seed for consistent but industry-related placeholders
		console.log(`[image-fetcher] Using industry-seeded placeholders (no Unsplash API key found)`);
		const industrySeed = industrySearchTerm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		heroImageUrl = `https://picsum.photos/1600/900?random=${industrySeed}`;
		galleryImageUrls = [
			`https://picsum.photos/800/600?random=${industrySeed + 1}`,
			`https://picsum.photos/800/600?random=${industrySeed + 2}`,
			`https://picsum.photos/800/600?random=${industrySeed + 3}`,
			`https://picsum.photos/800/600?random=${industrySeed + 4}`
		];
	}

	console.log(`[image-fetcher] Converting images to data URLs...`);
	// Convert all images to data URLs for blob URL compatibility
	const hero = await imageUrlToDataUrl(heroImageUrl);
	const gallery = await Promise.all(galleryImageUrls.map((url, index) => {
		console.log(`[image-fetcher] Converting gallery image ${index + 1}/4...`);
		return imageUrlToDataUrl(url);
	}));

	console.log(`[image-fetcher] Successfully fetched and converted ${1 + gallery.length} images`);
	return {
		hero,
		gallery
	};
}

