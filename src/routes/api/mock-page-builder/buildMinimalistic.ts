import { fetchIndustryImages } from '$lib/services/image-fetcher';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';

export interface BrandSessionData {
	brand_name: string;
	brand_industry: string;
	vibe: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
	};
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determine if a hex color is light or dark
 */
function isLightColor(hex: string): boolean {
	// Remove # if present
	const cleanHex = hex.replace('#', '');
	
	// Convert to RGB
	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);
	
	// Calculate luminance using relative luminance formula
	// Threshold: RGB sum > 382 = Light color
	const luminance = (r + g + b) / 3;
	return luminance > 127; // Using 127 as threshold (middle of 0-255)
}

/**
 * Generate brand and industry-specific content using Gemini
 */
async function generateBrandContent(
	brandName: string,
	industry: string,
	colors: { primary: string; secondary: string; accent: string }
): Promise<{
	brandDescription: string;
	heroContent: {
		eyebrow: string;
		headline: string;
		subheadline: string;
	};
	aboutContent: {
		title: string;
		description: string;
		highlights: string[];
	};
	servicesContent: {
		title: string;
		subtitle: string;
		items: Array<{ title: string; description: string }>;
	};
	stats: Array<{ value: string; label: string }>;
}> {
		try {
			// Get API key - check env object first, then process.env directly as fallback
			let apiKey = env?.GOOGLE_GEMINI_API || '';
			
			// If not found in env object, try process.env directly
			if (!apiKey || apiKey.trim() === '') {
				if (typeof process !== 'undefined' && process.env) {
					apiKey = process.env.Google_Gemini_Api || 
					         process.env.GOOGLE_GEMINI_API || 
					         process.env.GOOGLE_AI_API_KEY || '';
					
					if (apiKey) {
						// Clean the value (remove quotes and trim)
						apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
					}
				}
			}
			
			if (!apiKey || apiKey.trim() === '') {
				// Fallback to default content
				console.warn('[buildMinimalistic] Gemini API key not found, using default content');
				return getDefaultContent(brandName, industry);
			}

			const genAI = new GoogleGenerativeAI(apiKey);
			const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `You are a professional brand copywriter. Generate compelling, industry-specific content for a ${industry} brand called "${brandName}".

Brand Colors:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

Generate authentic, professional content that:
1. Reflects the ${industry} industry
2. Is specific to "${brandName}" brand
3. Uses a minimalistic, clean aesthetic
4. Is compelling and conversion-focused
5. Avoids generic placeholder text

Return ONLY a valid JSON object with this exact structure:
{
  "brandDescription": "A compelling one-sentence brand description",
  "heroContent": {
    "eyebrow": "A short eyebrow text (3-5 words)",
    "headline": "A powerful, concise headline (5-8 words)",
    "subheadline": "A descriptive subheadline (10-15 words)"
  },
  "aboutContent": {
    "title": "About section title",
    "description": "A compelling description paragraph (2-3 sentences)",
    "highlights": [
      "Highlight 1 (6-8 words)",
      "Highlight 2 (6-8 words)",
      "Highlight 3 (6-8 words)",
      "Highlight 4 (6-8 words)",
      "Highlight 5 (6-8 words)",
      "Highlight 6 (6-8 words)"
    ]
  },
  "servicesContent": {
    "title": "Services section title",
    "subtitle": "Services subtitle",
    "items": [
      {
        "title": "Service 1 name",
        "description": "Service 1 description (8-12 words)"
      },
      {
        "title": "Service 2 name",
        "description": "Service 2 description (8-12 words)"
      },
      {
        "title": "Service 3 name",
        "description": "Service 3 description (8-12 words)"
      },
      {
        "title": "Service 4 name",
        "description": "Service 4 description (8-12 words)"
      },
      {
        "title": "Service 5 name",
        "description": "Service 5 description (8-12 words)"
      },
      {
        "title": "Service 6 name",
        "description": "Service 6 description (8-12 words)"
      }
    ]
  },
  "stats": [
    {
      "value": "500+",
      "label": "Relevant metric for ${industry}"
    },
    {
      "value": "50k+",
      "label": "Another relevant metric"
    },
    {
      "value": "Free",
      "label": "A benefit or feature"
    }
  ]
}

Make all content specific to ${brandName} in the ${industry} industry. Be creative but professional.`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const content = JSON.parse(jsonMatch[0]);
			return content;
		}

		// Fallback if parsing fails
		return getDefaultContent(brandName, industry);
	} catch (error) {
		console.error('[buildMinimalistic] Failed to generate content with Gemini:', error);
		return getDefaultContent(brandName, industry);
	}
}

/**
 * Default fallback content
 */
function getDefaultContent(brandName: string, industry: string) {
	return {
		brandDescription: `Pure Design, Timeless Comfort - ${industry}`,
		heroContent: {
			eyebrow: `${industry} Excellence`,
			headline: 'Pure design. Timeless comfort.',
			subheadline: 'Each collection is crafted to bring balance and warmth into modern spaces.'
		},
		aboutContent: {
			title: `Why Choose ${brandName}`,
			description: 'We combine natural materials with modern silhouettes to create adaptable, lasting pieces.',
			highlights: [
				'Premium quality and service',
				'Expert team and support',
				'Trusted by thousands',
				'Innovative solutions',
				'Customer satisfaction guaranteed',
				'Professional consultation'
			]
		},
		servicesContent: {
			title: 'Our Services',
			subtitle: 'Discover what makes us unique',
			items: [
				{ title: 'Custom Solutions', description: 'Tailored designs built for your space' },
				{ title: 'Quality Products', description: 'Refined details with premium materials' },
				{ title: 'Expert Service', description: 'Professional consultation and support' },
				{ title: 'Fast Delivery', description: 'Quick and reliable shipping' },
				{ title: 'Warranty', description: 'Comprehensive coverage for peace of mind' },
				{ title: 'Support', description: 'Dedicated customer service team' }
			]
		},
		stats: [
			{ value: '500+', label: 'Products' },
			{ value: '50k+', label: 'Happy Homes' },
			{ value: 'Free', label: 'Delivery' }
		]
	};
}

export async function buildMinimalistic(sessionData: BrandSessionData): Promise<string> {
	console.log('[buildMinimalistic] Starting build with data:', sessionData);
	
	// Step 1: Fetch images based on industry (priority 1) and brand name (priority 2)
	console.log('[buildMinimalistic] Fetching images for industry:', sessionData.brand_industry, 'brand:', sessionData.brand_name);
	await sleep(3000);
	const images = await fetchIndustryImages(sessionData.brand_industry, sessionData.brand_name);
	console.log('[buildMinimalistic] Images fetched:', {
		hero: images.hero ? `data URL (${images.hero.substring(0, 50)}...)` : 'MISSING',
		gallery: images.gallery ? `${images.gallery.length} images` : 'MISSING',
		galleryDetails: images.gallery?.map((img, i) => `Image ${i + 1}: ${img ? img.substring(0, 50) + '...' : 'MISSING'}`)
	});
	
	// Step 2: Use colors directly from session data (no fallbacks)
	const primaryColor = sessionData.colors.primary || '';
	const secondaryColor = sessionData.colors.secondary || '';
	const accentColor = sessionData.colors.accent || '';
	
	if (!primaryColor || !secondaryColor || !accentColor) {
		throw new Error(`[buildMinimalistic] Missing required colors. Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`);
	}
	
	console.log('[buildMinimalistic] Using colors from brand guidelines:', { primaryColor, secondaryColor, accentColor });
	
	const isPrimaryLight = isLightColor(primaryColor);
	const isSecondaryLight = isLightColor(secondaryColor);
	
	// Determine background and text colors based on primary color
	const background = isPrimaryLight ? '#ffffff' : '#0a0a0a';
	const text = isPrimaryLight ? '#0a0a0a' : '#ffffff';
	const surface = isPrimaryLight ? '#f7f7f7' : '#171717';
	const border = isPrimaryLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
	const mutedText = isPrimaryLight ? 'rgba(10,10,10,0.7)' : 'rgba(255,255,255,0.7)';
	
	// Step 3: Generate brand-specific content with Gemini
	console.log('[buildMinimalistic] Generating brand content with Gemini...');
	await sleep(3000);
	const generatedContent = await generateBrandContent(
		sessionData.brand_name,
		sessionData.brand_industry,
		{ primary: primaryColor, secondary: secondaryColor, accent: accentColor }
	);
	
	// Step 4: Prepare brand config with generated content and proper colors
	const brandConfig = {
		brandName: sessionData.brand_name,
		industry: sessionData.brand_industry,
		colors: {
			primary: primaryColor,
			secondary: secondaryColor,
			accent: accentColor,
			background: background,
			text: text,
			white: '#ffffff',
			black: '#000000',
			surface: surface,
			border: border,
			mutedText: mutedText
		},
		images: {
			hero: images.hero,
			gallery: images.gallery
		},
		// Include generated content
		brandDescription: generatedContent.brandDescription,
		heroContent: {
			eyebrow: generatedContent.heroContent.eyebrow,
			headline: generatedContent.heroContent.headline,
			subheadline: generatedContent.heroContent.subheadline,
			primaryCta: {
				label: 'Get Started',
				icon: 'ArrowRight'
			},
			secondaryCta: {
				label: 'Learn More'
			}
		},
		aboutContent: {
			...generatedContent.aboutContent,
			highlightIcon: 'Check'
		},
		servicesContent: {
			...generatedContent.servicesContent,
			items: generatedContent.servicesContent.items.map((item, index) => ({
				...item,
				icon: ['Sparkles', 'Zap', 'Star', 'Heart', 'TrendingUp', 'Award'][index] || 'Sparkles'
			}))
		},
		stats: generatedContent.stats,
		navigation: {
			links: [
				{ label: 'Home', href: '#home' },
				{ label: 'About', href: '#about' },
				{ label: 'Services', href: '#services' },
				{ label: 'Contact', href: '#contact' }
			],
			cartLabel: 'Cart',
			primaryCtaLabel: 'Get Started',
			mobileCtaLabel: 'Get Started',
			menuIcon: 'Menu',
			closeIcon: 'X'
		},
		footerContent: {
			columns: [
				{ title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Support', href: '#support' }] },
				{ title: 'Company', links: [{ label: 'About', href: '#about' }, { label: 'Blog', href: '#blog' }, { label: 'Careers', href: '#careers' }] },
				{ title: 'Resources', links: [{ label: 'Documentation', href: '#docs' }, { label: 'Help Center', href: '#help' }, { label: 'Contact', href: '#contact' }] }
			],
			social: [
				{ icon: 'Facebook', href: '#', label: 'Facebook' },
				{ icon: 'Twitter', href: '#', label: 'Twitter' },
				{ icon: 'Instagram', href: '#', label: 'Instagram' },
				{ icon: 'Linkedin', href: '#', label: 'LinkedIn' }
			],
			legalText: `© ${new Date().getFullYear()} ${sessionData.brand_name}. All rights reserved.`
		},
		contact: {
			title: 'Contact',
			email: `contact@${sessionData.brand_name.toLowerCase().replace(/\s+/g, '')}.com`,
			phone: '+1 (555) 123-4567',
			address: '123 Business St, City, State 12345'
		}
	};
	
	console.log('[buildMinimalistic] Brand config prepared with generated content');
	console.log('[buildMinimalistic] Images in brand config:', {
		hero: brandConfig.images.hero ? `data URL (${brandConfig.images.hero.substring(0, 50)}...)` : 'MISSING',
		galleryCount: brandConfig.images.gallery?.length || 0,
		gallery: brandConfig.images.gallery?.map((img, i) => `[${i}]: ${img ? img.substring(0, 30) + '...' : 'MISSING'}`)
	});
	await sleep(3000);
	
	// Step 5: Read the template index.html
	const cwd = process.cwd();
	console.log('[buildMinimalistic] Current working directory:', cwd);

	let templatePath = join(cwd, 'react-templates', 'Minimalistic', 'build', 'index.html');
	let html: string;
	let buildDir: string;

	console.log('[buildMinimalistic] Attempting to read template from:', templatePath);

	if (existsSync(templatePath)) {
		try {
			html = readFileSync(templatePath, 'utf-8');
			buildDir = join(cwd, 'react-templates', 'Minimalistic', 'build');
			console.log('[buildMinimalistic] ✅ Successfully read template from build directory');
		} catch (e) {
			console.error('[buildMinimalistic] ❌ Failed to read build template:', e);
			throw new Error(`Failed to read template file: ${templatePath}. Error: ${e instanceof Error ? e.message : String(e)}`);
		}
	} else {
		// Fallback to source index.html if build doesn't exist
		templatePath = join(cwd, 'react-templates', 'Minimalistic', 'index.html');
		console.log('[buildMinimalistic] ⚠️ Build directory not found, trying fallback:', templatePath);
		
		if (!existsSync(templatePath)) {
			console.error('[buildMinimalistic] ❌ Template file not found at:', templatePath);
			console.error('[buildMinimalistic] Diagnostic info:', {
				cwd,
				buildPath: join(cwd, 'react-templates', 'Minimalistic', 'build'),
				sourcePath: join(cwd, 'react-templates', 'Minimalistic'),
				buildExists: existsSync(join(cwd, 'react-templates', 'Minimalistic', 'build')),
				sourceExists: existsSync(join(cwd, 'react-templates', 'Minimalistic'))
			});
			throw new Error(`Template file not found. Tried: ${join(cwd, 'react-templates', 'Minimalistic', 'build', 'index.html')} and ${templatePath}`);
		}
		
		try {
			html = readFileSync(templatePath, 'utf-8');
			buildDir = join(cwd, 'react-templates', 'Minimalistic');
			console.log('[buildMinimalistic] ✅ Successfully read template from source directory');
		} catch (e) {
			console.error('[buildMinimalistic] ❌ Failed to read fallback template:', e);
			throw new Error(`Failed to read fallback template file: ${templatePath}. Error: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	
	// Step 5.5: Inline CSS and JS assets for blob URL compatibility
	// Extract CSS file path and inline it
	const cssMatch = html.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/);
	if (cssMatch) {
		const cssPath = cssMatch[1].replace(/^\.\//, '');
		const fullCssPath = join(buildDir, cssPath);
		console.log('[buildMinimalistic] Attempting to inline CSS from:', fullCssPath);
		
		if (existsSync(fullCssPath)) {
			try {
				const cssContent = readFileSync(fullCssPath, 'utf-8');
				html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
				console.log('[buildMinimalistic] ✅ CSS inlined successfully');
			} catch (e) {
				console.error('[buildMinimalistic] ❌ Failed to inline CSS:', e);
				console.error('[buildMinimalistic] CSS path:', fullCssPath);
			}
		} else {
			console.warn('[buildMinimalistic] ⚠️ CSS file not found:', fullCssPath);
		}
	}
	
	// Extract JS file path and inline it using data URL approach
	const jsMatch = html.match(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*><\/script>/);
	if (jsMatch) {
		const jsPath = jsMatch[1].replace(/^\.\//, '');
		const fullJsPath = join(buildDir, jsPath);
		console.log('[buildMinimalistic] Attempting to inline JS from:', fullJsPath);
		
		if (existsSync(fullJsPath)) {
			try {
				const jsContent = readFileSync(fullJsPath, 'utf-8');
				// Use data URL for ES modules - this works better than inlining
				const base64Js = Buffer.from(jsContent, 'utf-8').toString('base64');
				html = html.replace(jsMatch[0], `<script type="module" src="data:text/javascript;base64,${base64Js}"></script>`);
				console.log('[buildMinimalistic] ✅ JS inlined successfully');
			} catch (e) {
				console.error('[buildMinimalistic] ❌ Failed to inline JS:', e);
				console.error('[buildMinimalistic] JS path:', fullJsPath);
			}
		} else {
			console.warn('[buildMinimalistic] ⚠️ JS file not found:', fullJsPath);
		}
	}
	
	// Step 6: Update the page title dynamically
	const pageTitle = `${sessionData.brand_name} - Minimalistic Homepage`;
	if (html.includes('<title>')) {
		html = html.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`);
	} else {
		// If no title tag, add one in the head
		if (html.includes('</head>')) {
			html = html.replace('</head>', `  <title>${pageTitle}</title>\n  </head>`);
		} else if (html.includes('<head>')) {
			html = html.replace('<head>', `<head>\n  <title>${pageTitle}</title>`);
		}
	}
	
	// Step 7: Inject brand config into HTML before React app loads
	const configScript = `
  <script>
    // Inject brand config BEFORE React app loads
    window.__BRAND_CONFIG__ = ${JSON.stringify(brandConfig, null, 2)};
  </script>`;
	
	// Insert before closing </head> tag
	if (html.includes('</head>')) {
		html = html.replace('</head>', `${configScript}\n  </head>`);
	} else {
		// If no </head> tag, insert before <body>
		html = html.replace('<body>', `${configScript}\n  <body>`);
	}
	
	console.log('[buildMinimalistic] HTML generated with brand config and generated content');
	await sleep(3000);
	
	return html;
}

