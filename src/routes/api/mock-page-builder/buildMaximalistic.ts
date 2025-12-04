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
		headline: string;
		subheadline: string;
		ctaText: string;
	};
	aboutContent: {
		title: string;
		description: string;
		highlights: string[];
	};
	productsContent: {
		title: string;
		subtitle: string;
		items: Array<{ title: string; description: string; price: string }>;
	};
	testimonialsContent: {
		title: string;
		items: Array<{ name: string; role: string; text: string; rating: number }>;
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
			console.warn('[buildMaximalistic] Gemini API key not found, using default content');
			return getDefaultContent(brandName, industry);
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `You are a professional brand copywriter specializing in bold, maximalistic design. Generate compelling, industry-specific content for a ${industry} brand called "${brandName}".

Brand Colors:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

Generate bold, vibrant, maximalistic content that:
1. Reflects the ${industry} industry with energy and excitement
2. Is specific to "${brandName}" brand
3. Uses a bold, maximalistic aesthetic with vibrant language
4. Is compelling and conversion-focused
5. Avoids generic placeholder text
6. Emphasizes boldness, impact, and maximum visual appeal

Return ONLY a valid JSON object with this exact structure:
{
  "brandDescription": "A bold, compelling one-sentence brand description",
  "heroContent": {
    "headline": "A powerful, bold headline (6-10 words)",
    "subheadline": "An energetic subheadline (12-18 words)",
    "ctaText": "Call-to-action button text (2-4 words)"
  },
  "aboutContent": {
    "title": "About section title",
    "description": "A bold, compelling description paragraph (2-3 sentences)",
    "highlights": [
      "Bold highlight 1 (6-8 words)",
      "Bold highlight 2 (6-8 words)",
      "Bold highlight 3 (6-8 words)"
    ]
  },
  "productsContent": {
    "title": "Products/Services section title",
    "subtitle": "Products subtitle",
    "items": [
      {
        "title": "Product/Service 1 name",
        "description": "Bold description (10-15 words)",
        "price": "$XX or appropriate pricing"
      },
      {
        "title": "Product/Service 2 name",
        "description": "Bold description (10-15 words)",
        "price": "$XX or appropriate pricing"
      },
      {
        "title": "Product/Service 3 name",
        "description": "Bold description (10-15 words)",
        "price": "$XX or appropriate pricing"
      }
    ]
  },
  "testimonialsContent": {
    "title": "Testimonials section title",
    "items": [
      {
        "name": "Customer Name",
        "role": "Customer role or title",
        "text": "A compelling testimonial (15-25 words)",
        "rating": 5
      },
      {
        "name": "Customer Name",
        "role": "Customer role or title",
        "text": "A compelling testimonial (15-25 words)",
        "rating": 5
      },
      {
        "name": "Customer Name",
        "role": "Customer role or title",
        "text": "A compelling testimonial (15-25 words)",
        "rating": 5
      }
    ]
  },
  "stats": [
    {
      "value": "1000+",
      "label": "Relevant metric for ${industry}"
    },
    {
      "value": "100k+",
      "label": "Another relevant metric"
    },
    {
      "value": "24/7",
      "label": "A benefit or feature"
    }
  ]
}

Make all content bold, vibrant, and specific to ${brandName} in the ${industry} industry. Use energetic, impactful language.`;

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
		console.error('[buildMaximalistic] Failed to generate content with Gemini:', error);
		return getDefaultContent(brandName, industry);
	}
}

/**
 * Default fallback content
 */
function getDefaultContent(brandName: string, industry: string) {
	return {
		brandDescription: `Bold Design, Maximum Impact - ${industry}`,
		heroContent: {
			headline: 'Bold Design. Maximum Impact.',
			subheadline: 'Experience the power of vibrant design that makes a statement.',
			ctaText: 'Get Started'
		},
		aboutContent: {
			title: `Why Choose ${brandName}`,
			description: 'We create bold, impactful designs that demand attention and deliver results.',
			highlights: [
				'Bold visual identity',
				'Maximum brand impact',
				'Vibrant design solutions'
			]
		},
		productsContent: {
			title: 'Our Products',
			subtitle: 'Discover our bold collection',
			items: [
				{ title: 'Premium Product', description: 'Bold design with maximum impact', price: '$99' },
				{ title: 'Creative Solution', description: 'Vibrant and eye-catching design', price: '$149' },
				{ title: 'Impact Package', description: 'Maximum visual appeal and results', price: '$199' }
			]
		},
		testimonialsContent: {
			title: 'What Our Clients Say',
			items: [
				{ name: 'John Doe', role: 'CEO', text: 'Amazing bold design that truly stands out!', rating: 5 },
				{ name: 'Jane Smith', role: 'Creative Director', text: 'Maximum impact with vibrant visuals.', rating: 5 },
				{ name: 'Mike Johnson', role: 'Marketing Lead', text: 'Bold and impactful design solutions.', rating: 5 }
			]
		},
		stats: [
			{ value: '1000+', label: 'Projects' },
			{ value: '100k+', label: 'Customers' },
			{ value: '24/7', label: 'Support' }
		]
	};
}

/**
 * Find template path by checking multiple possible locations
 * Handles different deployment scenarios (Docker, Render, local dev)
 * Updated to check paths relative to where the app actually runs
 */
function findTemplatePath(templateName: string): { htmlPath: string; buildDir: string; isBuild: boolean } {
	const cwd = process.cwd();
	const { readdirSync } = require('fs');
	
	// Try to find where the built app is located to infer base path
	let inferredBasePath = cwd;
	try {
		// Check if build directory exists relative to current location
		const buildPaths = [
			join(cwd, 'build'),
			join(cwd, '..', 'build'),
			join(cwd, '..', '..', 'build'),
		];
		
		for (const buildPath of buildPaths) {
			if (existsSync(buildPath) && existsSync(join(buildPath, 'index.js'))) {
				// Found the built app, use parent directory as base
				inferredBasePath = join(buildPath, '..');
				console.log(`[findTemplatePath] Found built app at ${buildPath}, using base: ${inferredBasePath}`);
				break;
			}
		}
	} catch (e) {
		// Ignore errors in inference
	}
	
	// Comprehensive list of possible base paths - prioritize inferred path and cwd
	const possibleBasePaths = [
		inferredBasePath, // Inferred from built app location
		cwd, // Current working directory (most common)
		join(cwd, '..'), // One level up from cwd
		join(cwd, '..', '..'), // Two levels up
		join(cwd, '..', '..', '..'), // Three levels up
		'/app', // Docker default WORKDIR
		'/opt/render/project', // Render base directory
		'/opt/render/project/src', // Render src directory (where app runs from)
		'/opt/render/project/app', // Render app directory (if extracted)
	];

	console.log(`[findTemplatePath] Searching for ${templateName} template...`);
	console.log(`[findTemplatePath] Current working directory: ${cwd}`);
	console.log(`[findTemplatePath] Inferred base path: ${inferredBasePath}`);
	console.log(`[findTemplatePath] Checking ${possibleBasePaths.length} possible base paths`);

	// First, try to find build directory (prioritize this)
	for (const basePath of possibleBasePaths) {
		const buildPath = join(basePath, 'react-templates', templateName, 'build', 'index.html');
		const buildPathExists = existsSync(buildPath);
		console.log(`[findTemplatePath] Checking build: ${buildPath} (exists: ${buildPathExists})`);
		
		if (buildPathExists) {
			console.log(`[findTemplatePath] ✅ Found build directory at: ${buildPath}`);
			const buildDir = join(basePath, 'react-templates', templateName, 'build');
			// Verify assets directory exists
			const assetsDir = join(buildDir, 'assets');
			if (existsSync(assetsDir)) {
				const assetFiles = readdirSync(assetsDir);
				console.log(`[findTemplatePath] Assets directory found with ${assetFiles.length} files`);
			} else {
				console.log(`[findTemplatePath] ⚠️ Assets directory not found, but build/index.html exists`);
			}
			return {
				htmlPath: buildPath,
				buildDir: buildDir,
				isBuild: true
			};
		}
	}

	// Fallback to source (with warnings) - only if build not found
	console.log(`[findTemplatePath] Build directory not found, checking source files...`);
	for (const basePath of possibleBasePaths) {
		const sourcePath = join(basePath, 'react-templates', templateName, 'index.html');
		if (existsSync(sourcePath)) {
			console.log(`[findTemplatePath] ⚠️ Found source directory at: ${sourcePath} (build not found)`);
			console.log(`[findTemplatePath] ⚠️ WARNING: Using source files will result in blank pages in blob URLs`);
			console.log(`[findTemplatePath] ⚠️ Source files reference /src/main.tsx which cannot be loaded without a dev server`);
			console.log(`[findTemplatePath] ⚠️ This indicates build directories were not copied correctly in Dockerfile`);
			
			return {
				htmlPath: sourcePath,
				buildDir: join(basePath, 'react-templates', templateName),
				isBuild: false
			};
		}
	}

	// If nothing found, provide detailed diagnostic info
	const triedPaths = possibleBasePaths.flatMap(base => [
		join(base, 'react-templates', templateName, 'build', 'index.html'),
		join(base, 'react-templates', templateName, 'index.html')
	]);
	
	console.error(`[findTemplatePath] ❌ Template not found for ${templateName}`);
	console.error(`[findTemplatePath] Current working directory: ${cwd}`);
	console.error(`[findTemplatePath] Tried ${triedPaths.length} paths`);
	
	// Try to list directory contents for diagnostics
	try {
		if (existsSync(cwd)) {
			const cwdContents = readdirSync(cwd).slice(0, 10);
			console.error(`[findTemplatePath] Contents of ${cwd}:`, cwdContents);
		}
		if (existsSync('/app')) {
			const appContents = readdirSync('/app').slice(0, 10);
			console.error(`[findTemplatePath] Contents of /app:`, appContents);
		}
	} catch (e) {
		// Ignore listing errors
	}
	
	throw new Error(
		`Template not found for ${templateName}. Tried paths:\n${triedPaths.slice(0, 10).join('\n')}\n` +
		`Current working directory: ${cwd}\n` +
		`Please ensure React templates are built and copied in Dockerfile.`
	);
}

export async function buildMaximalistic(sessionData: BrandSessionData): Promise<string> {
	console.log('[buildMaximalistic] Starting build with data:', sessionData);
	
	// Step 1: Fetch images based on industry (priority 1) and brand name (priority 2)
	console.log('[buildMaximalistic] Fetching images for industry:', sessionData.brand_industry, 'brand:', sessionData.brand_name);
	await sleep(3000);
	const images = await fetchIndustryImages(sessionData.brand_industry, sessionData.brand_name);
	console.log('[buildMaximalistic] Images fetched:', {
		hero: images.hero ? `data URL (${images.hero.substring(0, 50)}...)` : 'MISSING',
		gallery: images.gallery ? `${images.gallery.length} images` : 'MISSING',
		galleryDetails: images.gallery?.map((img, i) => `Image ${i + 1}: ${img ? img.substring(0, 50) + '...' : 'MISSING'}`)
	});
	
	// Step 2: Use colors directly from session data (no fallbacks)
	const primaryColor = sessionData.colors.primary || '';
	const secondaryColor = sessionData.colors.secondary || '';
	const accentColor = sessionData.colors.accent || '';
	
	if (!primaryColor || !secondaryColor || !accentColor) {
		throw new Error(`[buildMaximalistic] Missing required colors. Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`);
	}
	
	console.log('[buildMaximalistic] Using colors from brand guidelines:', { primaryColor, secondaryColor, accentColor });
	
	const isPrimaryLight = isLightColor(primaryColor);
	const isSecondaryLight = isLightColor(secondaryColor);
	
	// Determine background and text colors based on primary color
	// Maximalistic prefers light backgrounds with vibrant colors
	const background = isPrimaryLight ? '#ffffff' : '#0a0a0a';
	const text = isPrimaryLight ? '#0a0a0a' : '#ffffff';
	const white = '#ffffff';
	const black = '#000000';
	
	// Step 3: Generate brand-specific content with Gemini
	console.log('[buildMaximalistic] Generating brand content with Gemini...');
	await sleep(3000);
	const generatedContent = await generateBrandContent(
		sessionData.brand_name,
		sessionData.brand_industry,
		{ primary: primaryColor, secondary: secondaryColor, accent: accentColor }
	);
	
	// Step 4: Prepare brand config with generated content and proper colors
	// Convert generatedContent to templateContent structure
	const templateContent = {
		hero: {
			badgeLabel: `${sessionData.brand_industry} Excellence`,
			highlights: [
				generatedContent.heroContent.headline.split(' ').slice(0, 3).join(' '),
				generatedContent.heroContent.headline.split(' ').slice(3, 6).join(' ') || generatedContent.heroContent.headline,
				generatedContent.heroContent.subheadline.split(' ').slice(0, 4).join(' ')
			] as [string, string, string],
			description: generatedContent.heroContent.subheadline,
			primaryCta: generatedContent.heroContent.ctaText,
			primaryCtaIcon: 'ArrowRight',
			secondaryCta: 'Learn More',
			secondaryCtaIcon: 'ChevronRight',
			metrics: generatedContent.stats,
			collageLabels: ['New', 'Trending', 'Popular'] as [string, string, string]
		},
		about: {
			badges: generatedContent.aboutContent.highlights.slice(0, 3),
			titleLines: generatedContent.aboutContent.title.split(' ').reduce((acc: string[][], word, i) => {
				if (i % 3 === 0) acc.push([]);
				acc[acc.length - 1].push(word);
				return acc;
			}, []).map(line => line.join(' ')),
			paragraphs: [generatedContent.aboutContent.description],
			pillars: generatedContent.aboutContent.highlights.slice(0, 3).map((highlight, i) => ({
				title: highlight.split(':')[0] || highlight,
				description: highlight.split(':')[1] || highlight
			}))
		},
		products: {
			badgeLabel: 'Featured Collection',
			headingLines: generatedContent.productsContent.title.split(' ').reduce((acc: string[][], word, i) => {
				if (i % 4 === 0) acc.push([]);
				acc[acc.length - 1].push(word);
				return acc;
			}, []).map(line => line.join(' ')),
			description: generatedContent.productsContent.subtitle,
			items: generatedContent.productsContent.items.map((item, index) => ({
				name: item.title,
				description: item.description,
				price: item.price,
				badge: 'New',
				variant: (['primary', 'secondary', 'accent'] as const)[index % 3],
				rating: 4.5 + (index % 2) * 0.5,
				icon: ['ShoppingBag', 'Heart', 'Star'][index % 3]
			})),
			ctaLabel: 'View All Products',
			ctaIcon: 'ArrowRight'
		},
		testimonials: {
			badgeLabel: 'What People Say',
			headingLines: generatedContent.testimonialsContent.title.split(' ').reduce((acc: string[][], word, i) => {
				if (i % 4 === 0) acc.push([]);
				acc[acc.length - 1].push(word);
				return acc;
			}, []).map(line => line.join(' ')),
			entries: generatedContent.testimonialsContent.items.map((item, index) => ({
				name: item.name,
				role: item.role,
				quote: item.text,
				rating: item.rating,
				imageIndex: index
			})),
			stats: generatedContent.stats
		},
		gallery: {
			badgeLabel: 'Gallery',
			headingLines: ['Our', 'Gallery'],
			description: 'Explore our visual journey',
			tiles: Array(6).fill(null).map(() => ({
				likes: Math.floor(Math.random() * 1000) + 100,
				comments: Math.floor(Math.random() * 100) + 10
			})),
			ctaLabel: 'See More',
			videoTitle: 'Watch Our Story',
			videoSubtitle: 'Experience the journey',
			videoCta: 'Play Video'
		},
		footer: {
			brandLines: [sessionData.brand_name.split(' ')[0] || sessionData.brand_name, sessionData.brand_name.split(' ').slice(1).join(' ') || ''] as [string, string],
			tagline: generatedContent.brandDescription,
			socialLinks: [
				{ label: 'Facebook', url: '#', icon: 'Facebook' },
				{ label: 'Twitter', url: '#', icon: 'Twitter' },
				{ label: 'Instagram', url: '#', icon: 'Instagram' },
				{ label: 'LinkedIn', url: '#', icon: 'Linkedin' }
			],
			quickLinks: [
				{ label: 'About', url: '#about' },
				{ label: 'Products', url: '#products' },
				{ label: 'Contact', url: '#contact' }
			],
			contact: {
				address: '123 Business St, City, State 12345',
				phone: '+1 (555) 123-4567',
				email: `contact@${sessionData.brand_name.toLowerCase().replace(/\s+/g, '')}.com`
			},
			newsletter: {
				intro: 'Stay updated with our latest news',
				placeholder: 'Enter your email',
				ctaLabel: 'Subscribe'
			},
			hours: {
				heading: 'Business Hours',
				details: 'Mon-Fri: 9AM-6PM | Sat: 10AM-4PM | Sun: Closed'
			},
			bottomNote: `© ${new Date().getFullYear()} ${sessionData.brand_name}. All rights reserved.`,
			copyright: `© ${new Date().getFullYear()} ${sessionData.brand_name}`,
			legalLinks: [
				{ label: 'Privacy', url: '#privacy' },
				{ label: 'Terms', url: '#terms' }
			]
		}
	};
	
	const brandConfig = {
		brandName: sessionData.brand_name,
		industry: sessionData.brand_industry,
		colors: {
			primary: primaryColor,
			secondary: secondaryColor,
			accent: accentColor,
			background: background,
			text: text,
			white: white,
			black: black
		},
		images: {
			hero: images.hero,
			gallery: images.gallery
		},
		brandDescription: generatedContent.brandDescription,
		stats: generatedContent.stats,
		templateContent: templateContent
	};
	
	console.log('[buildMaximalistic] Brand config prepared with generated content');
	console.log('[buildMaximalistic] Images in brand config:', {
		hero: brandConfig.images.hero ? `data URL (${brandConfig.images.hero.substring(0, 50)}...)` : 'MISSING',
		galleryCount: brandConfig.images.gallery?.length || 0,
		gallery: brandConfig.images.gallery?.map((img, i) => `[${i}]: ${img ? img.substring(0, 30) + '...' : 'MISSING'}`)
	});
	await sleep(3000);
	
	// Step 5: Read the template index.html
	let templateInfo;
	try {
		templateInfo = findTemplatePath('Maximalistic');
	} catch (error) {
		console.error('[buildMaximalistic] ❌ Failed to find template:', error);
		throw error;
	}

	let html: string;
	try {
		html = readFileSync(templateInfo.htmlPath, 'utf-8');
		console.log(`[buildMaximalistic] ✅ Successfully read template from ${templateInfo.isBuild ? 'build' : 'source'} directory`);
	} catch (e) {
		console.error('[buildMaximalistic] ❌ Failed to read template file:', e);
		throw new Error(`Failed to read template file: ${templateInfo.htmlPath}. Error: ${e instanceof Error ? e.message : String(e)}`);
	}

	const buildDir = templateInfo.buildDir;
	
	// Step 5.5: Inline CSS and JS assets for blob URL compatibility
	// Extract CSS file path and inline it
	const cssMatch = html.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/);
	if (cssMatch) {
		const cssPath = cssMatch[1].replace(/^\.\//, '');
		const fullCssPath = join(buildDir, cssPath);
		console.log('[buildMaximalistic] Attempting to inline CSS from:', fullCssPath);
		
		if (existsSync(fullCssPath)) {
			try {
				const cssContent = readFileSync(fullCssPath, 'utf-8');
				html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
				console.log('[buildMaximalistic] ✅ CSS inlined successfully');
			} catch (e) {
				console.error('[buildMaximalistic] ❌ Failed to inline CSS:', e);
				console.error('[buildMaximalistic] CSS path:', fullCssPath);
			}
		} else {
			console.warn('[buildMaximalistic] ⚠️ CSS file not found:', fullCssPath);
			if (!templateInfo.isBuild) {
				console.warn('[buildMaximalistic] ⚠️ Using source template - CSS may not be available');
			}
		}
	} else {
		if (!templateInfo.isBuild) {
			console.warn('[buildMaximalistic] ⚠️ No CSS link found in source template - page may appear unstyled');
		}
	}
	
	// Extract JS file path and inline it using data URL approach
	const jsMatch = html.match(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*><\/script>/);
	if (jsMatch) {
		const jsPath = jsMatch[1].replace(/^\.\//, '');
		const fullJsPath = join(buildDir, jsPath);
		console.log('[buildMaximalistic] Attempting to inline JS from:', fullJsPath);
		
		if (existsSync(fullJsPath)) {
			try {
				const jsContent = readFileSync(fullJsPath, 'utf-8');
				// Use data URL for ES modules - this works better than inlining
				const base64Js = Buffer.from(jsContent, 'utf-8').toString('base64');
				html = html.replace(jsMatch[0], `<script type="module" src="data:text/javascript;base64,${base64Js}"></script>`);
				console.log('[buildMaximalistic] ✅ JS inlined successfully');
			} catch (e) {
				console.error('[buildMaximalistic] ❌ Failed to inline JS:', e);
				console.error('[buildMaximalistic] JS path:', fullJsPath);
			}
		} else {
			console.warn('[buildMaximalistic] ⚠️ JS file not found:', fullJsPath);
		}
	} else {
		// Check if source file has /src/main.tsx reference (won't work in blob URLs)
		const sourceJsMatch = html.match(/<script[^>]+src=["']([^"']*\/src\/main\.tsx[^"']*)["'][^>]*><\/script>/);
		if (sourceJsMatch && !templateInfo.isBuild) {
			console.error('[buildMaximalistic] ❌ Source template uses /src/main.tsx which cannot be loaded in blob URLs');
			console.error('[buildMaximalistic] ❌ This will result in a blank page. Build directories must be available.');
			console.error('[buildMaximalistic] ❌ The React app will not load because /src/main.tsx requires a dev server');
		}
	}
	
	// Step 6: Update the page title dynamically
	const pageTitle = `${sessionData.brand_name} - Maximalistic Homepage`;
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
	
	console.log('[buildMaximalistic] HTML generated with brand config and generated content');
	
	// Validate HTML before returning
	if (!html || html.trim().length < 100) {
		console.error('[buildMaximalistic] ❌ Generated HTML is too short or empty');
		console.error('[buildMaximalistic] HTML length:', html?.length || 0);
		throw new Error('Generated HTML is empty or invalid. Template processing may have failed.');
	}
	
	// Log HTML info for debugging
	console.log(`[buildMaximalistic] Generated HTML length: ${html.length} characters`);
	console.log(`[buildMaximalistic] HTML contains __BRAND_CONFIG__: ${html.includes('__BRAND_CONFIG__')}`);
	console.log(`[buildMaximalistic] HTML contains root div: ${html.includes('<div id="root">')}`);
	
	if (!templateInfo.isBuild) {
		console.warn('[buildMaximalistic] ⚠️ Using source template - page may be blank in blob URLs');
		console.warn('[buildMaximalistic] ⚠️ Build directories should be available for production use');
	}
	
	await sleep(3000);
	
	return html;
}

