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
	hero: {
		eyebrow: string;
		primaryCta: string;
		secondaryCta: string;
		scrollHint: string;
	};
	featuresContent: {
		heading: string;
		subheading: string;
		cards: Array<{ title: string; description: string }>;
	};
	technologyContent: {
		heading: string;
		description: string;
		metrics: Array<{ label: string; value: number }>;
		ctaLabel: string;
	};
	innovationContent: {
		heading: string;
		description: string;
		ctaLabel: string;
	};
	ctaContent: {
		heading: string;
		description: string;
		primaryCta: string;
		secondaryCta: string;
		trustMessage: string;
	};
	footerContent: {
		description: string;
		columns: Array<{ title: string; links: string[] }>;
		copyright: string;
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
			console.warn('[buildFuturistic] Gemini API key not found, using default content');
			return getDefaultContent(brandName, industry);
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `You are a professional brand copywriter specializing in futuristic, tech-forward design. Generate compelling, industry-specific content for a ${industry} brand called "${brandName}".

Brand Colors:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

Generate futuristic, tech-forward content that:
1. Reflects the ${industry} industry with cutting-edge technology focus
2. Is specific to "${brandName}" brand
3. Uses a futuristic, high-tech aesthetic with innovative language
4. Emphasizes technology, innovation, and the future
5. Is compelling and conversion-focused
6. Avoids generic placeholder text

Return ONLY a valid JSON object with this exact structure:
{
  "brandDescription": "A futuristic, tech-forward one-sentence brand description",
  "hero": {
    "eyebrow": "A short tech-focused eyebrow text (3-5 words)",
    "primaryCta": "Primary CTA button text (2-4 words)",
    "secondaryCta": "Secondary CTA button text (2-4 words)",
    "scrollHint": "Scroll hint text (3-6 words)"
  },
  "featuresContent": {
    "heading": "Features section heading",
    "subheading": "Features section subheading",
    "cards": [
      {
        "title": "Feature 1 name",
        "description": "Tech-forward feature description (12-18 words)"
      },
      {
        "title": "Feature 2 name",
        "description": "Tech-forward feature description (12-18 words)"
      },
      {
        "title": "Feature 3 name",
        "description": "Tech-forward feature description (12-18 words)"
      },
      {
        "title": "Feature 4 name",
        "description": "Tech-forward feature description (12-18 words)"
      }
    ]
  },
  "technologyContent": {
    "heading": "Technology section heading",
    "description": "Technology description paragraph (2-3 sentences)",
    "metrics": [
      {
        "label": "Tech metric 1",
        "value": 99.9
      },
      {
        "label": "Tech metric 2",
        "value": 10000000
      },
      {
        "label": "Tech metric 3",
        "value": 500
      }
    ],
    "ctaLabel": "Technology CTA button text"
  },
  "innovationContent": {
    "heading": "Innovation section heading",
    "description": "Innovation description paragraph (2-3 sentences)",
    "ctaLabel": "Innovation CTA button text"
  },
  "ctaContent": {
    "heading": "Final CTA section heading",
    "description": "CTA description paragraph (2-3 sentences)",
    "primaryCta": "Primary CTA button text",
    "secondaryCta": "Secondary CTA button text",
    "trustMessage": "Trust message or social proof (10-15 words)"
  },
  "footerContent": {
    "description": "Footer description (1 sentence)",
    "columns": [
      {
        "title": "Column 1 title",
        "links": ["Link 1", "Link 2", "Link 3"]
      },
      {
        "title": "Column 2 title",
        "links": ["Link 1", "Link 2", "Link 3"]
      },
      {
        "title": "Column 3 title",
        "links": ["Link 1", "Link 2", "Link 3"]
      }
    ],
    "copyright": "Copyright text"
  },
  "stats": [
    {
      "value": "99.9%",
      "label": "Relevant tech metric for ${industry}"
    },
    {
      "value": "10M+",
      "label": "Another relevant metric"
    },
    {
      "value": "500+",
      "label": "A benefit or feature"
    }
  ]
}

Make all content futuristic, tech-forward, and specific to ${brandName} in the ${industry} industry. Use cutting-edge, innovative language.`;

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
		console.error('[buildFuturistic] Failed to generate content with Gemini:', error);
		return getDefaultContent(brandName, industry);
	}
}

/**
 * Default fallback content
 */
function getDefaultContent(brandName: string, industry: string) {
	return {
		brandDescription: `The Future of ${industry}`,
		hero: {
			eyebrow: 'Next Generation',
			primaryCta: 'Get Started',
			secondaryCta: 'Learn More',
			scrollHint: 'Scroll to explore'
		},
		featuresContent: {
			heading: 'Cutting-Edge Features',
			subheading: 'Experience the future of technology',
			cards: [
				{ title: 'AI-Powered', description: 'Advanced artificial intelligence for intelligent solutions' },
				{ title: 'Cloud Native', description: 'Scalable cloud infrastructure for modern needs' },
				{ title: 'Real-Time', description: 'Instant updates and real-time synchronization' },
				{ title: 'Secure', description: 'Enterprise-grade security and data protection' }
			]
		},
		technologyContent: {
			heading: 'Advanced Technology',
			description: 'Built with cutting-edge technology to deliver exceptional performance and reliability.',
			metrics: [
				{ label: 'Uptime', value: 99.9 },
				{ label: 'Users', value: 10000000 },
				{ label: 'Countries', value: 500 }
			],
			ctaLabel: 'Explore Technology'
		},
		innovationContent: {
			heading: 'Innovation First',
			description: 'Pushing the boundaries of what\'s possible with innovative solutions.',
			ctaLabel: 'See Innovation'
		},
		ctaContent: {
			heading: 'Ready for the Future?',
			description: 'Join thousands of companies already using our platform.',
			primaryCta: 'Start Free Trial',
			secondaryCta: 'Contact Sales',
			trustMessage: 'Trusted by leading companies worldwide'
		},
		footerContent: {
			description: `The future of ${industry} is here.`,
			columns: [
				{ title: 'Product', links: ['Features', 'Pricing', 'Security'] },
				{ title: 'Company', links: ['About', 'Careers', 'Press'] },
				{ title: 'Resources', links: ['Blog', 'Docs', 'Support'] }
			],
			copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`
		},
		stats: [
			{ value: '99.9%', label: 'Uptime' },
			{ value: '10M+', label: 'Users' },
			{ value: '500+', label: 'Countries' }
		]
	};
}

/**
 * Find template path by checking multiple possible locations
 * Handles different deployment scenarios (Docker, Render, local dev)
 */
function findTemplatePath(templateName: string): { htmlPath: string; buildDir: string; isBuild: boolean } {
	const cwd = process.cwd();
	
	// Comprehensive list of possible base paths for different deployment scenarios
	const possibleBasePaths = [
		cwd, // Current working directory
		join(cwd, '..'), // One level up
		join(cwd, '..', '..'), // Two levels up
		join(cwd, '..', '..', '..'), // Three levels up
		'/app', // Docker default
		'/opt/render/project', // Render base directory
		'/opt/render/project/src', // Render src directory
		'/opt/render/project/app', // Render app directory (if extracted)
		join('/opt/render/project', 'src'), // Render src (explicit)
		join('/opt/render/project', 'app'), // Render app (explicit)
	];

	console.log(`[findTemplatePath] Searching for ${templateName} template...`);
	console.log(`[findTemplatePath] Current working directory: ${cwd}`);
	console.log(`[findTemplatePath] Checking ${possibleBasePaths.length} possible base paths`);

	// First, try to find build directory
	for (const basePath of possibleBasePaths) {
		const buildPath = join(basePath, 'react-templates', templateName, 'build', 'index.html');
		const buildPathExists = existsSync(buildPath);
		console.log(`[findTemplatePath] Checking build: ${buildPath} (exists: ${buildPathExists})`);
		
		if (buildPathExists) {
			console.log(`[findTemplatePath] ✅ Found build directory at: ${buildPath}`);
			return {
				htmlPath: buildPath,
				buildDir: join(basePath, 'react-templates', templateName, 'build'),
				isBuild: true
			};
		}
	}

	// Fallback to source (with warnings)
	for (const basePath of possibleBasePaths) {
		const sourcePath = join(basePath, 'react-templates', templateName, 'index.html');
		if (existsSync(sourcePath)) {
			console.log(`[findTemplatePath] ⚠️ Found source directory at: ${sourcePath} (build not found)`);
			console.log(`[findTemplatePath] ⚠️ WARNING: Using source files may result in blank pages in blob URLs`);
			console.log(`[findTemplatePath] ⚠️ Source files reference /src/main.tsx which cannot be loaded without a dev server`);
			
			return {
				htmlPath: sourcePath,
				buildDir: join(basePath, 'react-templates', templateName),
				isBuild: false
			};
		}
	}

	// If nothing found, throw error with diagnostic info
	const triedPaths = possibleBasePaths.flatMap(base => [
		join(base, 'react-templates', templateName, 'build', 'index.html'),
		join(base, 'react-templates', templateName, 'index.html')
	]);
	
	console.error(`[findTemplatePath] ❌ Template not found for ${templateName}`);
	console.error(`[findTemplatePath] Tried paths:`, triedPaths);
	
	throw new Error(
		`Template not found for ${templateName}. Tried paths:\n${triedPaths.join('\n')}\n` +
		`Current working directory: ${cwd}`
	);
}

export async function buildFuturistic(sessionData: BrandSessionData): Promise<string> {
	console.log('[buildFuturistic] Starting build with data:', sessionData);
	
	// Step 1: Fetch images based on industry (priority 1) and brand name (priority 2)
	console.log('[buildFuturistic] Fetching images for industry:', sessionData.brand_industry, 'brand:', sessionData.brand_name);
	await sleep(3000);
	const images = await fetchIndustryImages(sessionData.brand_industry, sessionData.brand_name);
	console.log('[buildFuturistic] Images fetched:', {
		hero: images.hero ? `data URL (${images.hero.substring(0, 50)}...)` : 'MISSING',
		gallery: images.gallery ? `${images.gallery.length} images` : 'MISSING',
		galleryDetails: images.gallery?.map((img, i) => `Image ${i + 1}: ${img ? img.substring(0, 50) + '...' : 'MISSING'}`)
	});
	
	// Step 2: Use colors directly from session data (no fallbacks)
	const primaryColor = sessionData.colors.primary || '';
	const secondaryColor = sessionData.colors.secondary || '';
	const accentColor = sessionData.colors.accent || '';
	
	if (!primaryColor || !secondaryColor || !accentColor) {
		throw new Error(`[buildFuturistic] Missing required colors. Primary: ${primaryColor}, Secondary: ${secondaryColor}, Accent: ${accentColor}`);
	}
	
	console.log('[buildFuturistic] Using colors from brand guidelines:', { primaryColor, secondaryColor, accentColor });
	
	const isPrimaryLight = isLightColor(primaryColor);
	
	// Futuristic theme prefers dark backgrounds with tech aesthetic
	// But we'll still check and set appropriate text colors
	const background = '#0f172a'; // Always dark tech background for futuristic
	const text = '#ffffff'; // Always white text for dark backgrounds
	const muted = 'rgba(255,255,255,0.75)';
	const border = 'rgba(255,255,255,0.25)';
	const surface = 'rgba(15,23,42,0.8)';
	const white = '#ffffff';
	const black = '#000000';
	
	// Step 3: Generate brand-specific content with Gemini
	console.log('[buildFuturistic] Generating brand content with Gemini...');
	await sleep(3000);
	const generatedContent = await generateBrandContent(
		sessionData.brand_name,
		sessionData.brand_industry,
		{ primary: primaryColor, secondary: secondaryColor, accent: accentColor }
	);
	
	// Step 4: Prepare brand config with generated content and proper colors
	// Note: FuturisticCube 3D element is already included in the template
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
			black: black,
			muted: muted,
			border: border,
			surface: surface
		},
		images: {
			hero: images.hero,
			gallery: images.gallery,
			technology: images.hero, // Futuristic theme uses technology image
			innovation: images.gallery[0] || images.hero // Innovation image
		},
		// Include generated content
		brandDescription: generatedContent.brandDescription,
		stats: generatedContent.stats,
		footerContent: generatedContent.footerContent,
		// Navigation
		navigation: {
			links: [
				{ label: 'Features', href: '#features' },
				{ label: 'Technology', href: '#technology' },
				{ label: 'Innovation', href: '#innovation' },
				{ label: 'Contact', href: '#contact' }
			],
			ctaLabel: 'Get Started',
			ctaIcon: 'Rocket'
		},
		// Hero with icons
		hero: {
			...generatedContent.hero,
			primaryCtaIcon: 'ArrowRight',
			secondaryCtaIcon: 'ChevronRight'
		},
		// Add icons to features
		featuresContent: {
			...generatedContent.featuresContent,
			cards: generatedContent.featuresContent.cards.map((card, index) => ({
				...card,
				icon: ['Zap', 'Cpu', 'Rocket', 'Sparkles'][index % 4] || 'Zap'
			}))
		},
		// Add icons to technology and innovation
		technologyContent: {
			...generatedContent.technologyContent,
			ctaIcon: 'ArrowRight'
		},
		innovationContent: {
			...generatedContent.innovationContent,
			ctaIcon: 'Sparkles'
		},
		// Add icons to CTA section
		ctaContent: {
			...generatedContent.ctaContent,
			primaryCtaIcon: 'Rocket',
			secondaryCtaIcon: 'ArrowRight'
		}
	};
	
	console.log('[buildFuturistic] Brand config prepared with generated content and 3D elements');
	console.log('[buildFuturistic] Images in brand config:', {
		hero: brandConfig.images.hero ? `data URL (${brandConfig.images.hero.substring(0, 50)}...)` : 'MISSING',
		galleryCount: brandConfig.images.gallery?.length || 0,
		technology: brandConfig.images.technology ? `data URL (${brandConfig.images.technology.substring(0, 50)}...)` : 'MISSING',
		innovation: brandConfig.images.innovation ? `data URL (${brandConfig.images.innovation.substring(0, 50)}...)` : 'MISSING',
		gallery: brandConfig.images.gallery?.map((img, i) => `[${i}]: ${img ? img.substring(0, 30) + '...' : 'MISSING'}`)
	});
	await sleep(3000);
	
	// Step 5: Read the template index.html
	let templateInfo;
	try {
		templateInfo = findTemplatePath('Futuristic');
	} catch (error) {
		console.error('[buildFuturistic] ❌ Failed to find template:', error);
		throw error;
	}

	let html: string;
	try {
		html = readFileSync(templateInfo.htmlPath, 'utf-8');
		console.log(`[buildFuturistic] ✅ Successfully read template from ${templateInfo.isBuild ? 'build' : 'source'} directory`);
	} catch (e) {
		console.error('[buildFuturistic] ❌ Failed to read template file:', e);
		throw new Error(`Failed to read template file: ${templateInfo.htmlPath}. Error: ${e instanceof Error ? e.message : String(e)}`);
	}

	const buildDir = templateInfo.buildDir;
	
	// Step 5.5: Inline CSS and JS assets for blob URL compatibility
	// Extract CSS file path and inline it
	const cssMatch = html.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/);
	if (cssMatch) {
		const cssPath = cssMatch[1].replace(/^\.\//, '');
		const fullCssPath = join(buildDir, cssPath);
		console.log('[buildFuturistic] Attempting to inline CSS from:', fullCssPath);
		
		if (existsSync(fullCssPath)) {
			try {
				const cssContent = readFileSync(fullCssPath, 'utf-8');
				html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
				console.log('[buildFuturistic] ✅ CSS inlined successfully');
			} catch (e) {
				console.error('[buildFuturistic] ❌ Failed to inline CSS:', e);
				console.error('[buildFuturistic] CSS path:', fullCssPath);
			}
		} else {
			console.warn('[buildFuturistic] ⚠️ CSS file not found:', fullCssPath);
			if (!templateInfo.isBuild) {
				console.warn('[buildFuturistic] ⚠️ Using source template - CSS may not be available');
			}
		}
	} else {
		if (!templateInfo.isBuild) {
			console.warn('[buildFuturistic] ⚠️ No CSS link found in source template - page may appear unstyled');
		}
	}
	
	// Extract JS file path and inline it using data URL approach
	const jsMatch = html.match(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*><\/script>/);
	if (jsMatch) {
		const jsPath = jsMatch[1].replace(/^\.\//, '');
		const fullJsPath = join(buildDir, jsPath);
		console.log('[buildFuturistic] Attempting to inline JS from:', fullJsPath);
		
		if (existsSync(fullJsPath)) {
			try {
				const jsContent = readFileSync(fullJsPath, 'utf-8');
				// Use data URL for ES modules - this works better than inlining
				const base64Js = Buffer.from(jsContent, 'utf-8').toString('base64');
				html = html.replace(jsMatch[0], `<script type="module" src="data:text/javascript;base64,${base64Js}"></script>`);
				console.log('[buildFuturistic] ✅ JS inlined successfully');
			} catch (e) {
				console.error('[buildFuturistic] ❌ Failed to inline JS:', e);
				console.error('[buildFuturistic] JS path:', fullJsPath);
			}
		} else {
			console.warn('[buildFuturistic] ⚠️ JS file not found:', fullJsPath);
		}
	} else {
		// Check if source file has /src/main.tsx reference (won't work in blob URLs)
		const sourceJsMatch = html.match(/<script[^>]+src=["']([^"']*\/src\/main\.tsx[^"']*)["'][^>]*><\/script>/);
		if (sourceJsMatch && !templateInfo.isBuild) {
			console.error('[buildFuturistic] ❌ Source template uses /src/main.tsx which cannot be loaded in blob URLs');
			console.error('[buildFuturistic] ❌ This will result in a blank page. Build directories must be available.');
			console.error('[buildFuturistic] ❌ The React app will not load because /src/main.tsx requires a dev server');
		}
	}
	
	// Step 6: Update the page title dynamically
	const pageTitle = `${sessionData.brand_name} - Futuristic Homepage`;
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
	// The FuturisticCube 3D element is already built into the template and will be rendered automatically
	const configScript = `
  <script>
    // Inject brand config BEFORE React app loads
    // Note: FuturisticCube 3D element is already included in the template
    window.__BRAND_CONFIG__ = ${JSON.stringify(brandConfig, null, 2)};
  </script>`;
	
	// Insert before closing </head> tag
	if (html.includes('</head>')) {
		html = html.replace('</head>', `${configScript}\n  </head>`);
	} else {
		// If no </head> tag, insert before <body>
		html = html.replace('<body>', `${configScript}\n  <body>`);
	}
	
	console.log('[buildFuturistic] HTML generated with brand config, generated content, and 3D elements');
	
	// Validate HTML before returning
	if (!html || html.trim().length < 100) {
		console.error('[buildFuturistic] ❌ Generated HTML is too short or empty');
		console.error('[buildFuturistic] HTML length:', html?.length || 0);
		throw new Error('Generated HTML is empty or invalid. Template processing may have failed.');
	}
	
	// Log HTML info for debugging
	console.log(`[buildFuturistic] Generated HTML length: ${html.length} characters`);
	console.log(`[buildFuturistic] HTML contains __BRAND_CONFIG__: ${html.includes('__BRAND_CONFIG__')}`);
	console.log(`[buildFuturistic] HTML contains root div: ${html.includes('<div id="root">')}`);
	
	if (!templateInfo.isBuild) {
		console.warn('[buildFuturistic] ⚠️ Using source template - page may be blank in blob URLs');
		console.warn('[buildFuturistic] ⚠️ Build directories should be available for production use');
	}
	
	await sleep(3000);
	
	return html;
}

