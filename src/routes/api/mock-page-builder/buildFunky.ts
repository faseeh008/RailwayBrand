import { fetchIndustryImages } from '$lib/services/image-fetcher';
import { readFileSync, existsSync, readdirSync } from 'fs';
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
	collectionContent: {
		title: string;
		subtitle: string;
		items: Array<{ title: string; description: string; price: string }>;
	};
	categoryContent: {
		title: string;
		categories: Array<{ name: string; description: string }>;
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
			console.warn('[buildFunky] Gemini API key not found, using default content');
			return getDefaultContent(brandName, industry);
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `You are a professional brand copywriter specializing in funky, vibrant, creative design. Generate compelling, industry-specific content for a ${industry} brand called "${brandName}".

Brand Colors:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

Generate funky, vibrant, creative content that:
1. Reflects the ${industry} industry with energy and creativity
2. Is specific to "${brandName}" brand
3. Uses a funky, playful aesthetic with bold, creative language
4. Is compelling and conversion-focused
5. Avoids generic placeholder text
6. Emphasizes creativity, fun, and vibrant energy

Return ONLY a valid JSON object with this exact structure:
{
  "brandDescription": "A funky, vibrant one-sentence brand description",
  "heroContent": {
    "headline": "A bold, funky headline (6-10 words)",
    "subheadline": "An energetic, creative subheadline (12-18 words)",
    "ctaText": "Call-to-action button text (2-4 words)"
  },
  "collectionContent": {
    "title": "Collection section title",
    "subtitle": "Collection subtitle",
    "items": [
      {
        "title": "Collection/Product 1 name",
        "description": "Funky description (10-15 words)",
        "price": "$XX or appropriate pricing"
      },
      {
        "title": "Collection/Product 2 name",
        "description": "Funky description (10-15 words)",
        "price": "$XX or appropriate pricing"
      },
      {
        "title": "Collection/Product 3 name",
        "description": "Funky description (10-15 words)",
        "price": "$XX or appropriate pricing"
      },
      {
        "title": "Collection/Product 4 name",
        "description": "Funky description (10-15 words)",
        "price": "$XX or appropriate pricing"
      }
    ]
  },
  "categoryContent": {
    "title": "Categories section title",
    "categories": [
      {
        "name": "Category 1 name",
        "description": "Category description (8-12 words)"
      },
      {
        "name": "Category 2 name",
        "description": "Category description (8-12 words)"
      },
      {
        "name": "Category 3 name",
        "description": "Category description (8-12 words)"
      },
      {
        "name": "Category 4 name",
        "description": "Category description (8-12 words)"
      }
    ]
  },
  "stats": [
    {
      "value": "24/7",
      "label": "Relevant metric for ${industry}"
    },
    {
      "value": "120+",
      "label": "Another relevant metric"
    },
    {
      "value": "12",
      "label": "A benefit or feature"
    }
  ]
}

Make all content funky, vibrant, and specific to ${brandName} in the ${industry} industry. Use creative, playful language.`;

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
		console.error('[buildFunky] Failed to generate content with Gemini:', error);
		return getDefaultContent(brandName, industry);
	}
}

/**
 * Default fallback content
 */
function getDefaultContent(brandName: string, industry: string) {
	return {
		brandDescription: `Discover ${brandName} - Premium ${industry} collection.`,
		heroContent: {
			headline: 'Bold. Creative. Funky.',
			subheadline: 'Experience vibrant designs that make a statement and spark creativity.',
			ctaText: 'Explore Now'
		},
		collectionContent: {
			title: 'Featured Collections',
			subtitle: 'Discover our vibrant selection',
			items: [
				{ title: 'Creative Collection', description: 'Bold designs with maximum impact', price: '$99' },
				{ title: 'Vibrant Series', description: 'Eye-catching and playful designs', price: '$149' },
				{ title: 'Funky Line', description: 'Unique and creative solutions', price: '$199' },
				{ title: 'Bold Collection', description: 'Maximum visual appeal and energy', price: '$249' }
			]
		},
		categoryContent: {
			title: 'Shop by Category',
			categories: [
				{ name: 'Creative', description: 'Bold and vibrant creative solutions' },
				{ name: 'Vibrant', description: 'Eye-catching and playful designs' },
				{ name: 'Funky', description: 'Unique and creative collections' },
				{ name: 'Bold', description: 'Maximum impact designs' }
			]
		},
		stats: [
			{ value: '24/7', label: 'Creative Flow' },
			{ value: '120+', label: 'Happy Clients' },
			{ value: '12', label: 'Brand Touchpoints' }
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

export async function buildFunky(sessionData: BrandSessionData): Promise<string> {
	console.log('[buildFunky] Starting build with data:', sessionData);
	
	// Step 1: Fetch images based on industry (priority 1) and brand name (priority 2)
	console.log('[buildFunky] Fetching images for industry:', sessionData.brand_industry, 'brand:', sessionData.brand_name);
	await sleep(3000);
	const images = await fetchIndustryImages(sessionData.brand_industry, sessionData.brand_name);
	console.log('[buildFunky] Images fetched:', {
		hero: images.hero ? `data URL (${images.hero.substring(0, 50)}...)` : 'MISSING',
		gallery: images.gallery ? `${images.gallery.length} images` : 'MISSING',
		galleryDetails: images.gallery?.map((img, i) => `Image ${i + 1}: ${img ? img.substring(0, 50) + '...' : 'MISSING'}`)
	});
	
	// Step 2: Use colors directly from session data (no fallbacks)
	const primaryColor = sessionData.colors.primary || '';
	const secondaryColor = sessionData.colors.secondary || '';
	const accentColor = sessionData.colors.accent || '';
	
	if (!primaryColor || !secondaryColor || !accentColor) {
		throw new Error(`[buildFunky] Missing required colors. Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`);
	}
	
	console.log('[buildFunky] Using colors from brand guidelines:', { primaryColor, secondaryColor, accentColor });
	
	const isPrimaryLight = isLightColor(primaryColor);
	const isSecondaryLight = isLightColor(secondaryColor);
	
	// Determine background and text colors based on primary color
	// Funky theme: Light threshold: RGB sum > 382
	const background = isPrimaryLight ? '#F5F5F2' : '#1f2937';
	const text = isPrimaryLight ? '#1f2937' : '#ffffff';
	const white = '#ffffff';
	const black = '#000000';
	
	// Create gradients using primary and secondary colors
	const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
	const secondaryGradient = `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${accentColor} 100%)`;
	const accentGradient = `linear-gradient(90deg, ${accentColor} 0%, ${primaryColor} 100%)`;
	
	// Step 3: Generate brand-specific content with Gemini
	console.log('[buildFunky] Generating brand content with Gemini...');
	await sleep(3000);
	const generatedContent = await generateBrandContent(
		sessionData.brand_name,
		sessionData.brand_industry,
		{ primary: primaryColor, secondary: secondaryColor, accent: accentColor }
	);
	
	// Step 4: Prepare brand config with generated content, proper colors, and gradients
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
		gradients: {
			primary: primaryGradient,
			secondary: secondaryGradient,
			accent: accentGradient
		},
		images: {
			hero: images.hero,
			gallery: images.gallery
		},
		// Include generated content
		brandDescription: generatedContent.brandDescription,
		heroContent: generatedContent.heroContent,
		collectionContent: generatedContent.collectionContent,
		categoryContent: generatedContent.categoryContent,
		stats: generatedContent.stats,
		// Add icons
		logoIcon: 'Sparkles',
		heroCtaIcon: 'ArrowRight',
		categoryIcons: ['Shirt', 'Package', 'Sparkles', 'Star'],
		socialIcons: ['Instagram', 'Facebook', 'Twitter', 'Youtube']
	};
	
	console.log('[buildFunky] Brand config prepared with generated content and gradients');
	console.log('[buildFunky] Images in brand config:', {
		hero: brandConfig.images.hero ? `data URL (${brandConfig.images.hero.substring(0, 50)}...)` : 'MISSING',
		galleryCount: brandConfig.images.gallery?.length || 0,
		gallery: brandConfig.images.gallery?.map((img, i) => `[${i}]: ${img ? img.substring(0, 30) + '...' : 'MISSING'}`)
	});
	await sleep(3000);
	
	// Step 5: Read the template index.html
	let templateInfo;
	try {
		templateInfo = findTemplatePath('Funky');
	} catch (error) {
		console.error('[buildFunky] ❌ Failed to find template:', error);
		throw error;
	}

	let html: string;
	try {
		html = readFileSync(templateInfo.htmlPath, 'utf-8');
		console.log(`[buildFunky] ✅ Successfully read template from ${templateInfo.isBuild ? 'build' : 'source'} directory`);
	} catch (e) {
		console.error('[buildFunky] ❌ Failed to read template file:', e);
		throw new Error(`Failed to read template file: ${templateInfo.htmlPath}. Error: ${e instanceof Error ? e.message : String(e)}`);
	}

	const buildDir = templateInfo.buildDir;
	
	// Step 5.5: Inline CSS and JS assets for blob URL compatibility
	// Extract CSS file path and inline it
	const cssMatch = html.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/);
	if (cssMatch) {
		const cssPath = cssMatch[1].replace(/^\.\//, '');
		const fullCssPath = join(buildDir, cssPath);
		console.log('[buildFunky] Attempting to inline CSS from:', fullCssPath);
		
		if (existsSync(fullCssPath)) {
			try {
				const cssContent = readFileSync(fullCssPath, 'utf-8');
				html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
				console.log('[buildFunky] ✅ CSS inlined successfully');
			} catch (e) {
				console.error('[buildFunky] ❌ Failed to inline CSS:', e);
				console.error('[buildFunky] CSS path:', fullCssPath);
			}
		} else {
			console.warn('[buildFunky] ⚠️ CSS file not found:', fullCssPath);
			if (!templateInfo.isBuild) {
				console.warn('[buildFunky] ⚠️ Using source template - CSS may not be available');
			}
		}
	} else {
		if (!templateInfo.isBuild) {
			console.warn('[buildFunky] ⚠️ No CSS link found in source template - page may appear unstyled');
		}
	}
	
	// Extract JS file path and inline it using data URL approach
	const jsMatch = html.match(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*><\/script>/);
	if (jsMatch) {
		const jsPath = jsMatch[1].replace(/^\.\//, '');
		const fullJsPath = join(buildDir, jsPath);
		console.log('[buildFunky] Attempting to inline JS from:', fullJsPath);
		
		if (existsSync(fullJsPath)) {
			try {
				const jsContent = readFileSync(fullJsPath, 'utf-8');
				// Use data URL for ES modules - this works better than inlining
				const base64Js = Buffer.from(jsContent, 'utf-8').toString('base64');
				html = html.replace(jsMatch[0], `<script type="module" src="data:text/javascript;base64,${base64Js}"></script>`);
				console.log('[buildFunky] ✅ JS inlined successfully');
			} catch (e) {
				console.error('[buildFunky] ❌ Failed to inline JS:', e);
				console.error('[buildFunky] JS path:', fullJsPath);
			}
		} else {
			console.warn('[buildFunky] ⚠️ JS file not found:', fullJsPath);
		}
	} else {
		// Check if source file has /src/main.tsx reference (won't work in blob URLs)
		const sourceJsMatch = html.match(/<script[^>]+src=["']([^"']*\/src\/main\.tsx[^"']*)["'][^>]*><\/script>/);
		if (sourceJsMatch && !templateInfo.isBuild) {
			console.error('[buildFunky] ❌ Source template uses /src/main.tsx which cannot be loaded in blob URLs');
			console.error('[buildFunky] ❌ This will result in a blank page. Build directories must be available.');
			console.error('[buildFunky] ❌ The React app will not load because /src/main.tsx requires a dev server');
		}
	}
	
	// Step 6: Update the page title dynamically
	const pageTitle = `${sessionData.brand_name} - Funky Homepage`;
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
    // Includes gradients of primary and secondary colors with accent color
    window.__BRAND_CONFIG__ = ${JSON.stringify(brandConfig, null, 2)};
  </script>`;
	
	// Insert before closing </head> tag
	if (html.includes('</head>')) {
		html = html.replace('</head>', `${configScript}\n  </head>`);
	} else {
		// If no </head> tag, insert before <body>
		html = html.replace('<body>', `${configScript}\n  <body>`);
	}
	
	console.log('[buildFunky] HTML generated with brand config, generated content, and gradients');
	
	// Validate HTML before returning
	if (!html || html.trim().length < 100) {
		console.error('[buildFunky] ❌ Generated HTML is too short or empty');
		console.error('[buildFunky] HTML length:', html?.length || 0);
		throw new Error('Generated HTML is empty or invalid. Template processing may have failed.');
	}
	
	// Log HTML info for debugging
	console.log(`[buildFunky] Generated HTML length: ${html.length} characters`);
	console.log(`[buildFunky] HTML contains __BRAND_CONFIG__: ${html.includes('__BRAND_CONFIG__')}`);
	console.log(`[buildFunky] HTML contains root div: ${html.includes('<div id="root">')}`);
	
	if (!templateInfo.isBuild) {
		console.warn('[buildFunky] ⚠️ Using source template - page may be blank in blob URLs');
		console.warn('[buildFunky] ⚠️ Build directories should be available for production use');
	}
	
	await sleep(3000);
	
	return html;
}

