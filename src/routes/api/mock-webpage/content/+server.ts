import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface ContentRequest {
	brandData: {
		brand_name?: string;
		brandName?: string;
		industry?: string;
		short_description?: string;
		description?: string;
		colorPalette?: string[];
		brandColors?: string[];
	};
	theme: string;
	sectionType?: string;
}

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string;
			}>;
		};
	}>;
}

interface GeneratedContent {
	title?: string;
	description?: string;
	cta?: string;
	features?: string[];
	stats?: Array<{ value: string; label: string }>;
	heroTitle?: string;
	heroDescription?: string;
	heroBadge?: string;
	ctaPrimary?: string;
	ctaSecondary?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ContentRequest = await request.json();
		const { brandData, theme, sectionType = 'hero' } = body;

		if (!brandData || !theme) {
			return json({ success: false, error: 'Brand data and theme are required' }, { status: 400 });
		}

		const geminiKey = env.GOOGLE_GEMINI_API || env.Google_Gemini_Api || env.GOOGLE_AI_API_KEY;
		if (!geminiKey) {
			return json({ success: false, error: 'Gemini API key not configured' }, { status: 500 });
		}

		const brandName = brandData.brand_name || brandData.brandName || 'Brand';
		const industry = brandData.industry || 'General';
		const description = brandData.short_description || brandData.description || '';
		const colors = brandData.colorPalette || brandData.brandColors || [];

		const prompt = `Generate comprehensive website content for a ${theme} themed website.

Brand Information:
- Name: ${brandName}
- Industry: ${industry}
- Description: ${description}
- Colors: ${colors.join(', ')}

Theme: ${theme}

Generate complete website content as JSON with the following structure:
{
  "heroTitle": "Main headline for hero section",
  "heroDescription": "Engaging description (1-2 sentences)",
  "heroBadge": "Badge text (e.g., 'New Collection 2024')",
  "ctaPrimary": "Primary call-to-action button text",
  "ctaSecondary": "Secondary button text",
  "stats": [{"value": "99.9%", "label": "Uptime"}, ...],
  "features": [{"title": "Feature name", "description": "Feature description"}, ...],
  "products": [{"name": "Product name", "description": "Product description", "price": "$19.99", "badge": "🔥 BESTSELLER", "rating": 4.9}, ...],
  "testimonials": [{"name": "Customer name", "role": "Role", "text": "Testimonial text", "rating": 5}, ...],
  "testimonialStats": [{"value": "500+", "label": "Happy Customers", "color": "#f59e0b"}, ...],
  "collections": [{"title": "Collection name", "description": "Collection description", "color": "#3b82f6"}, ...],
  "categories": [{"title": "Category name", "count": "150+ Styles", "color": "#9333ea"}, ...],
  "techStats": [{"label": "Processing Speed", "value": 98}, ...],
  "aboutTitle": "About section title",
  "aboutSubtitle1": "Subtitle part 1",
  "aboutSubtitle2": "Subtitle part 2",
  "aboutDescription1": "First description paragraph",
  "aboutDescription2": "Second description paragraph",
  "footerDescription": "Footer description text",
  "contactAddress": "Contact address",
  "contactPhone": "Contact phone",
  "contactEmail": "Contact email"
}

Make it authentic, engaging, and perfectly aligned with the ${theme} aesthetic. Include 3-6 items for arrays. Use brand colors where specified.`;

		// Use the correct Gemini API endpoint
		const model = 'gemini-1.5-flash'; // Using stable model name
		const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`;

		let response: Response;
		try {
			response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt
								}
							]
						}
					]
				})
			});
		} catch (fetchError: any) {
			console.error('Failed to fetch from Gemini API:', fetchError);
			// Return fallback content instead of throwing
			return json({
				success: true,
				content: {
					heroTitle: `${brandName} - ${theme}`,
					heroDescription: description || `Experience the future of ${industry}.`,
					heroBadge: 'Featured',
					ctaPrimary: 'Get Started',
					ctaSecondary: 'Learn More',
					features: [],
					stats: []
				}
			});
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Gemini API error:', errorText);
			// Return fallback content instead of throwing
			return json({
				success: true,
				content: {
					heroTitle: `${brandName} - ${theme}`,
					heroDescription: description || `Experience the future of ${industry}.`,
					heroBadge: 'Featured',
					ctaPrimary: 'Get Started',
					ctaSecondary: 'Learn More',
					features: [],
					stats: []
				}
			});
		}

		const data: GeminiResponse = await response.json();
		const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

		// Try to parse JSON from the response
		let content: GeneratedContent;
		try {
			// Extract JSON from markdown code blocks if present
			const jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
			const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
			content = JSON.parse(jsonText) as GeneratedContent;

			// Normalize content structure
			if (content.title && !content.heroTitle) {
				content.heroTitle = content.title;
			}
			if (content.description && !content.heroDescription) {
				content.heroDescription = content.description;
			}
			if (content.cta && !content.ctaPrimary) {
				content.ctaPrimary = content.cta;
			}
		} catch (parseError) {
			// Fallback: create structured content from text
			const lines = generatedText.split('\n').filter((l: string) => l.trim());
			content = {
				heroTitle: lines[0] || `${brandName} - ${theme}`,
				heroDescription: lines.slice(1, 3).join(' ') || description,
				ctaPrimary: 'Get Started',
				ctaSecondary: 'Learn More',
				features: [],
				stats: []
			};
		}

		return json({
			success: true,
			content
		});
	} catch (error: any) {
		console.error('Content generation error:', error);
		return json(
			{ success: false, error: error.message || 'Failed to generate content' },
			{ status: 500 }
		);
	}
};
