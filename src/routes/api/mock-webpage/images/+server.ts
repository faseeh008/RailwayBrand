import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface ImageRequest {
	brandName: string;
	theme: string;
	imageType?: string;
	count?: number;
}

interface UnsplashPhoto {
	urls?: {
		regular?: string;
		large?: string;
	};
}

interface PexelsPhoto {
	src?: {
		large?: string;
		original?: string;
	};
}

interface PexelsResponse {
	photos?: PexelsPhoto[];
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ImageRequest = await request.json();
		const { brandName, theme, imageType = 'lifestyle', count = 1 } = body;

		if (!brandName || !theme) {
			return json({ success: false, error: 'Brand name and theme are required' }, { status: 400 });
		}

		const images: string[] = [];
		const query = `${brandName} ${theme} ${imageType || 'lifestyle'} brand`;

		// Try Unsplash first
		const unsplashKey = env.UNSPLASH_ACCESS_KEY;
		if (unsplashKey) {
			try {
				for (let i = 0; i < count; i++) {
					const response = await fetch(
						`https://api.unsplash.com/photos/random?orientation=landscape&query=${encodeURIComponent(query)}&count=1`,
						{
							headers: {
								Authorization: `Client-ID ${unsplashKey}`
							}
						}
					);

					if (response.ok) {
						const data: UnsplashPhoto | UnsplashPhoto[] = await response.json();
						const photo: UnsplashPhoto = Array.isArray(data) ? data[0] : data;
						if (photo?.urls?.regular) {
							images.push(photo.urls.regular);
						}
					}
				}
			} catch (err) {
				console.warn('Unsplash fetch failed:', err);
			}
		}

		// Try Pexels if we don't have enough images
		if (images.length < count) {
			const pexelsKey = env.PEXELS_API_KEY;
			if (pexelsKey) {
				try {
					const response = await fetch(
						`https://api.pexels.com/v1/search?per_page=${count}&orientation=landscape&query=${encodeURIComponent(query)}`,
						{
							headers: {
								Authorization: pexelsKey
							}
						}
					);

					if (response.ok) {
						const data: PexelsResponse = await response.json();
						if (data.photos && Array.isArray(data.photos)) {
							for (const photo of data.photos.slice(0, count - images.length)) {
								if (photo.src?.large) {
									images.push(photo.src.large);
								}
							}
						}
					}
				} catch (err) {
					console.warn('Pexels fetch failed:', err);
				}
			}
		}

		// Fallback to theme-specific defaults if no images found
		if (images.length === 0) {
			const fallbacks: Record<string, string[]> = {
				minimalistic: [
					'https://images.unsplash.com/photo-1708758487256-8a3a73565dc2?auto=format&fit=crop&w=1200&q=80',
					'https://images.unsplash.com/photo-1721146378270-1b93839f7ae7?auto=format&fit=crop&w=1200&q=80'
				],
				maximalistic: [
					'https://images.unsplash.com/photo-1663072302693-d92701c4ef42?auto=format&fit=crop&w=1200&q=80',
					'https://images.unsplash.com/photo-1722938687754-d77c159da3c8?auto=format&fit=crop&w=1200&q=80'
				],
				funky: [
					'https://images.unsplash.com/photo-1685432531593-1afc8a152e5f?auto=format&fit=crop&w=1200&q=80',
					'https://images.unsplash.com/photo-1663082076137-486bc3ff6fd7?auto=format&fit=crop&w=1200&q=80'
				],
				futuristic: [
					'https://images.unsplash.com/photo-1613500429601-62a596776da7?auto=format&fit=crop&w=1200&q=80',
					'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1200&q=80'
				]
			};

			const themeKey = theme.toLowerCase();
			const fallbackImages = fallbacks[themeKey] || fallbacks.minimalistic;
			images.push(...fallbackImages.slice(0, count));
		}

		return json({
			success: true,
			images: images.slice(0, count)
		});
	} catch (error: any) {
		console.error('Image fetch error:', error);
		return json(
			{ success: false, error: error.message || 'Failed to fetch images' },
			{ status: 500 }
		);
	}
};
