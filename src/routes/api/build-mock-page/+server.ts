import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines, generatedSlides } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { buildMockPage, type Vibe, type BrandSessionData } from '../mock-page-builder';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { guidelineId, brandGuidelinesId, vibe: requestedVibe } = await request.json();

		// Support both guidelineId and brandGuidelinesId for compatibility
		const id = guidelineId || brandGuidelinesId;
		
		if (!id) {
			return json({ error: 'Brand Guidelines ID is required (guidelineId or brandGuidelinesId)' }, { status: 400 });
		}

		// Step 1: Extract session data directly from the database
		console.log('[build-mock-page] Extracting session data...');
		await sleep(3000);
		
		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(and(
				eq(brandGuidelines.id, id),
				eq(brandGuidelines.userId, session.user.id)
			))
			.limit(1);

		if (guideline.length === 0) {
			return json({ error: 'Brand guideline not found' }, { status: 404 });
		}

		const guidelineData = guideline[0];
		
		// Strategy 1: Extract from slides (svelteContent or slideData)
		console.log('[build-mock-page] Querying slides for color data...');
		const slides = await db
			.select()
			.from(generatedSlides)
			.where(and(
				eq(generatedSlides.brandGuidelinesId, id),
				eq(generatedSlides.userId, session.user.id)
			))
			.orderBy(generatedSlides.slideNumber);
		
		console.log(`[build-mock-page] Found ${slides.length} slides`);
		
		// Extract colors from slides
		let colorsData: any = null;
		let colorsSource = 'none';
		let brandNameFromSlides = '';
		let industryFromSlides = '';
		let vibeFromSlides = '';
		
		// Try to extract from slides' svelteContent or slideData
		for (const slide of slides) {
			// Try svelteContent first (SlideData structure)
			if (slide.svelteContent) {
				try {
					const svelteData = typeof slide.svelteContent === 'string'
						? JSON.parse(slide.svelteContent)
						: slide.svelteContent;
					
					// Check if this slide has color elements
					if (svelteData?.elements && Array.isArray(svelteData.elements)) {
						for (const element of svelteData.elements) {
							if (element.type === 'color-swatch' && element.color) {
								if (!colorsData) colorsData = {};
								// Extract color from swatch
								const hex = element.color.hex || element.color;
								if (hex && typeof hex === 'string' && hex.startsWith('#')) {
									if (!colorsData.primary) colorsData.primary = { hex };
									else if (!colorsData.secondary) colorsData.secondary = { hex };
									else if (!colorsData.accent) colorsData.accent = { hex };
								}
							}
						}
					}
				} catch (e) {
					// Ignore parse errors
				}
			}
			
			// Try slideData (step content structure)
			if (slide.slideData && !colorsData) {
				try {
					const slideData = typeof slide.slideData === 'string'
						? JSON.parse(slide.slideData)
						: slide.slideData;
					
					// Check for colors in slideData
					if (slideData?.colors && typeof slideData.colors === 'object') {
						colorsData = slideData.colors;
						colorsSource = `slide ${slide.slideNumber} slideData`;
						break;
					}
				} catch (e) {
					// Ignore parse errors
				}
			}
		}
		
		// Strategy 2: Try structuredData.stepHistory (where step content is stored)
		if (!colorsData || Object.keys(colorsData).length === 0) {
			if (guidelineData.structuredData) {
				try {
					const structuredData = typeof guidelineData.structuredData === 'string'
						? JSON.parse(guidelineData.structuredData)
						: guidelineData.structuredData;
					
					// Check stepHistory for color step
					if (structuredData?.stepHistory && Array.isArray(structuredData.stepHistory)) {
						for (const step of structuredData.stepHistory) {
							// Check for color-palette step
							if ((step.step === 'color-palette' || step.stepType === 'color-palette' || step.stepType === 'colors') && step.content) {
								let content = step.content;
								
								// Try to parse if it's a string
								if (typeof content === 'string') {
									try {
										content = JSON.parse(content);
									} catch (e) {
										// Not JSON, continue
									}
								}
								
								// Extract colors from content
								if (content?.colors && typeof content.colors === 'object') {
									colorsData = content.colors;
									colorsSource = 'structuredData.stepHistory[color-palette]';
									break;
								}
							}
						}
					}
					
					// Also check direct colors
					if ((!colorsData || Object.keys(colorsData).length === 0) && structuredData?.colors && !Array.isArray(structuredData.colors) && typeof structuredData.colors === 'object') {
						colorsData = structuredData.colors;
						colorsSource = 'structuredData.colors';
					}
					
					// Extract brand info from structuredData
					if (structuredData?.brand?.name) brandNameFromSlides = structuredData.brand.name;
					if (structuredData?.brand?.industry) industryFromSlides = structuredData.brand.industry;
				} catch (e) {
					console.warn('[build-mock-page] Failed to parse structuredData:', e);
				}
			}
		}
		
		// Strategy 3: Try the colors field directly (fallback)
		if (!colorsData || Object.keys(colorsData).length === 0) {
			if (guidelineData.colors) {
				try {
					const parsed = typeof guidelineData.colors === 'string' 
						? JSON.parse(guidelineData.colors) 
						: guidelineData.colors;
					
					if (!Array.isArray(parsed) && parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
						colorsData = parsed;
						colorsSource = 'colors field';
					}
				} catch (e) {
					console.warn('[build-mock-page] Failed to parse colors field:', e);
				}
			}
		}
		
		// Log what we found
		console.log(`[build-mock-page] Colors source: ${colorsSource}`);
		if (colorsData) {
			console.log('[build-mock-page] Colors data keys:', Object.keys(colorsData));
			console.log('[build-mock-page] Colors data structure (first 1000 chars):', JSON.stringify(colorsData, null, 2).substring(0, 1000));
		} else {
			console.warn('[build-mock-page] No colors data found in any location!');
		}

		// Extract color values - handle different possible structures
		let primaryColor = '';
		let secondaryColor = '';
		let accentColor = '';

		// If no colors data found, throw error with helpful message
		if (!colorsData || Object.keys(colorsData).length === 0) {
			throw new Error(`No color data found in brand guidelines. Checked: colors field, structuredData.colors, content.colors`);
		}

		// Extract primary color - try multiple structures
		// New structure: primary, secondary, accent1, accent2 as objects
		if (colorsData?.primary?.hex) {
			primaryColor = colorsData.primary.hex;
		} else if (colorsData?.primary?.value) {
			primaryColor = colorsData.primary.value;
		} else if (typeof colorsData?.primary === 'string') {
			primaryColor = colorsData.primary;
		} else if (Array.isArray(colorsData?.primary) && colorsData.primary[0]?.hex) {
			primaryColor = colorsData.primary[0].hex;
		} else if (Array.isArray(colorsData?.primary) && colorsData.primary[0]?.value) {
			primaryColor = colorsData.primary[0].value;
		} else if (colorsData?.semantic?.primary?.hex) {
			primaryColor = colorsData.semantic.primary.hex;
		} else if (colorsData?.palette && Array.isArray(colorsData.palette) && colorsData.palette[0]?.hex) {
			primaryColor = colorsData.palette[0].hex;
		} else if (colorsData?.core_palette && Array.isArray(colorsData.core_palette) && colorsData.core_palette[0]?.hex) {
			primaryColor = colorsData.core_palette[0].hex;
		} else if (colorsData?.primary_palette && Array.isArray(colorsData.primary_palette) && colorsData.primary_palette[0]?.hex) {
			primaryColor = colorsData.primary_palette[0].hex;
		} else if (Array.isArray(colorsData?.colors) && colorsData.colors[0]?.hex) {
			primaryColor = colorsData.colors[0].hex;
		} else if (Array.isArray(colorsData?.allColors) && colorsData.allColors[0]?.hex) {
			primaryColor = colorsData.allColors[0].hex;
		}

		// Extract secondary color
		if (colorsData?.secondary?.hex) {
			secondaryColor = colorsData.secondary.hex;
		} else if (colorsData?.secondary?.value) {
			secondaryColor = colorsData.secondary.value;
		} else if (typeof colorsData?.secondary === 'string') {
			secondaryColor = colorsData.secondary;
		} else if (Array.isArray(colorsData?.secondary) && colorsData.secondary[0]?.hex) {
			secondaryColor = colorsData.secondary[0].hex;
		} else if (Array.isArray(colorsData?.secondary) && colorsData.secondary[0]?.value) {
			secondaryColor = colorsData.secondary[0].value;
		} else if (colorsData?.semantic?.secondary?.hex) {
			secondaryColor = colorsData.semantic.secondary.hex;
		} else if (colorsData?.palette && Array.isArray(colorsData.palette) && colorsData.palette[1]?.hex) {
			secondaryColor = colorsData.palette[1].hex;
		} else if (colorsData?.core_palette && Array.isArray(colorsData.core_palette) && colorsData.core_palette[1]?.hex) {
			secondaryColor = colorsData.core_palette[1].hex;
		} else if (colorsData?.primary_palette && Array.isArray(colorsData.primary_palette) && colorsData.primary_palette[1]?.hex) {
			secondaryColor = colorsData.primary_palette[1].hex;
		} else if (colorsData?.secondary_palette && Array.isArray(colorsData.secondary_palette) && colorsData.secondary_palette[0]?.hex) {
			secondaryColor = colorsData.secondary_palette[0].hex;
		} else if (Array.isArray(colorsData?.colors) && colorsData.colors[1]?.hex) {
			secondaryColor = colorsData.colors[1].hex;
		} else if (Array.isArray(colorsData?.allColors) && colorsData.allColors[1]?.hex) {
			secondaryColor = colorsData.allColors[1].hex;
		}

		// Extract accent color - try accent1, accent, or use third palette color
		if (colorsData?.accent1?.hex) {
			accentColor = colorsData.accent1.hex;
		} else if (colorsData?.accent?.hex) {
			accentColor = colorsData.accent.hex;
		} else if (colorsData?.accent?.value) {
			accentColor = colorsData.accent.value;
		} else if (typeof colorsData?.accent === 'string') {
			accentColor = colorsData.accent;
		} else if (Array.isArray(colorsData?.accent) && colorsData.accent[0]?.hex) {
			accentColor = colorsData.accent[0].hex;
		} else if (Array.isArray(colorsData?.accent) && colorsData.accent[0]?.value) {
			accentColor = colorsData.accent[0].value;
		} else if (colorsData?.semantic?.accent?.hex) {
			accentColor = colorsData.semantic.accent.hex;
		} else if (colorsData?.semantic?.success?.hex) {
			accentColor = colorsData.semantic.success.hex;
		} else if (colorsData?.palette && Array.isArray(colorsData.palette) && colorsData.palette[2]?.hex) {
			accentColor = colorsData.palette[2].hex;
		} else if (colorsData?.core_palette && Array.isArray(colorsData.core_palette) && colorsData.core_palette[2]?.hex) {
			accentColor = colorsData.core_palette[2].hex;
		} else if (colorsData?.primary_palette && Array.isArray(colorsData.primary_palette) && colorsData.primary_palette[2]?.hex) {
			accentColor = colorsData.primary_palette[2].hex;
		} else if (colorsData?.secondary_palette && Array.isArray(colorsData.secondary_palette) && colorsData.secondary_palette[0]?.hex) {
			accentColor = colorsData.secondary_palette[0].hex;
		} else if (Array.isArray(colorsData?.colors) && colorsData.colors[2]?.hex) {
			accentColor = colorsData.colors[2].hex;
		} else if (Array.isArray(colorsData?.allColors) && colorsData.allColors[2]?.hex) {
			accentColor = colorsData.allColors[2].hex;
		}

		console.log('[build-mock-page] Extracted colors:', { primaryColor, secondaryColor, accentColor });
		
		// Validate that we have colors
		if (!primaryColor || !secondaryColor || !accentColor) {
			console.error('[build-mock-page] WARNING: Colors are missing!', {
				hasColorsData: !!colorsData,
				colorsDataKeys: colorsData ? Object.keys(colorsData) : [],
				colorsDataStructure: colorsData ? JSON.stringify(colorsData, null, 2).substring(0, 500) : 'null'
			});
			throw new Error(`Missing required colors from brand guidelines. Primary: ${primaryColor || 'MISSING'}, Secondary: ${secondaryColor || 'MISSING'}, Accent: ${accentColor || 'MISSING'}`);
		}

		// Build the session data object - use data from slides if available
		const sessionData: BrandSessionData = {
			brand_name: brandNameFromSlides || guidelineData.brandName || slides[0]?.brandName || '',
			brand_industry: industryFromSlides || guidelineData.industry || guidelineData.brandDomain || '',
			vibe: vibeFromSlides || guidelineData.mood || '',
			colors: {
				primary: primaryColor,
				secondary: secondaryColor,
				accent: accentColor
			}
		};

		if (!sessionData.vibe) {
			throw new Error('Could not determine brand vibe from session data.');
		}

		// Use requested vibe if provided, otherwise use vibe from session data
		const vibe: Vibe = (requestedVibe || sessionData.vibe) as Vibe;

		// Validate vibe
		if (!['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'].includes(vibe)) {
			throw new Error(`Invalid vibe: ${vibe}. Must be one of: Minimalistic, Maximalistic, Funky, Futuristic`);
		}

		console.log(`[build-mock-page] Building mock page for vibe: ${vibe}`);
		await sleep(3000);

		// Step 2: Build the mock page using the new mock-page-builder system
		// This includes Gemini content generation, dark/light detection, gradients, etc.
		const htmlContent = await buildMockPage(sessionData, vibe);

		return json({
			success: true,
			html: htmlContent,
			sessionData,
			vibe
		});
	} catch (error) {
		console.error('Error building mock page:', error);
		return json({ 
			error: 'Failed to build mock page',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

