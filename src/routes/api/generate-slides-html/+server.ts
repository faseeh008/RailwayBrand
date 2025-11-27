/**
 * API Endpoint: Generate Brand Guideline Slides (HTML-based)
 * 
 * This endpoint accepts brand data from the frontend and generates
 * a PowerPoint presentation using the fixed HTML template system.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { convertHtmlToPptx, convertHtmlToPptxFromSlides, buildFilledHtmlSlides } from '$lib/services/html-slide-generator.js';
import { adaptBrandDataForSlides, validateAdaptedData } from '$lib/services/brand-data-adapter.js';
import { db, generatedSlides, brandGuidelines, brandBuilderChats } from '$lib/db';
import { eq, and, desc } from 'drizzle-orm';
import fs from 'fs';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get the current session
		const session = await locals.auth();
		
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse request body
		const requestData = await request.json();
		await hydrateLogoFilesFromSnapshots(session.user.id, requestData);
		
		console.log('📥 Received brand data for slide generation', {
			brandName: requestData.brandName,
			hasGeneratedSteps: !!requestData.generatedSteps,
			stepsCount: requestData.generatedSteps?.length || 0,
			hasLogoFiles: !!requestData.logoFiles,
			logoFilesCount: requestData.logoFiles?.length || 0,
			firstLogoFile: requestData.logoFiles?.[0],
			hasSavedSlides: !!requestData.savedSlides,
			savedSlidesCount: requestData.savedSlides?.length || 0,
			allRequestKeys: Object.keys(requestData)
		});
		
		// Check if we have saved slides to use instead of regenerating
		if (requestData.savedSlides && requestData.savedSlides.length > 0) {
			console.log('📋 Using saved slides from stepHistory for PPTX generation (download scenario)');
			
			// Don't save to database again - slides are already saved from preview page
			// Just use saved slides directly for PPTX generation
			const pptxPath = await convertHtmlToPptxFromSlides(requestData.savedSlides);
			
			// Read the generated file
			const pptxBuffer = fs.readFileSync(pptxPath);
			
			// Clean up the temporary file
			fs.unlinkSync(pptxPath);
			
			console.log(`✅ PPTX generated from saved slides (${(pptxBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
			
			// Return the PPTX file
			return new Response(pptxBuffer, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'Content-Disposition': `attachment; filename="${requestData.brandName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Brand'}-Brand-Guidelines.pptx`,
					'Content-Length': pptxBuffer.length.toString()
				}
			});
		}
		
        // Transform frontend data using the adapter (support stepHistory)
        const brandInput = adaptBrandDataForSlides({
            ...requestData,
            generatedSteps: requestData.stepHistory || requestData.generatedSteps || []
        });
		
		// Validate adapted data
		const validation = validateAdaptedData(brandInput);
		if (!validation.valid) {
			console.error('❌ Validation failed:', validation.errors);
			return json({ 
				error: 'Validation failed', 
				details: validation.errors 
			}, { status: 400 });
		}
		
		console.log('✅ Brand data adapted and validated successfully');
		console.log(`📊 Generating slides for: ${brandInput.brandName}`);
		
		// Get template set from request (if provided)
		const templateSet = requestData.templateSet || undefined;
		console.log('🎨 Using template set:', templateSet || 'default (root)');
		
		// Generate HTML slides first
		const htmlSlides = buildFilledHtmlSlides(brandInput, templateSet);
		console.log(`📄 Generated ${htmlSlides.length} HTML slides`);
		
		// Save HTML content to database
		const brandName = requestData.brandName || brandInput.brandName || 'Unknown Brand';
		const brandGuidelinesId = await findBrandGuidelinesId(session.user.id, brandName);
		await saveSlidesToDatabase(htmlSlides, session.user.id, brandGuidelinesId, brandName);
		
		// Generate PPTX
		const pptxPath = await convertHtmlToPptx(brandInput, templateSet);
		
		// Read the generated file
		const pptxBuffer = fs.readFileSync(pptxPath);
		
		// Clean up the temporary file
		fs.unlinkSync(pptxPath);
		
		console.log(`✅ PPTX generated successfully (${(pptxBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
		
		// Return the PPTX file
		return new Response(pptxBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'Content-Disposition': `attachment; filename="${brandInput.brandName.replace(/[^a-zA-Z0-9]/g, '-')}-Brand-Guidelines.pptx"`,
				'Content-Length': pptxBuffer.length.toString()
			}
		});
		
	} catch (error) {
		console.error('❌ Error generating slides:', error);
		
		return json({
			error: 'Failed to generate slides',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

/**
 * Legacy transformation function - Now handled by brand-data-adapter
 * Keeping for reference only
 */
function transformToBrandInput_OLD(data: any): any {
	// Extract data from the request
	const {
		brandName,
		brandDomain,
		shortDescription,
		brandValues,
		selectedMood,
		selectedAudience,
		contactName,
		contactEmail,
		contactRole,
		contactCompany,
		logoFiles,
		structuredData,
		generatedSteps
	} = data;
	
	// Parse structured data if available
	let brandSpec: any = null;
	if (structuredData) {
		try {
			brandSpec = typeof structuredData === 'string' 
				? JSON.parse(structuredData) 
				: structuredData;
		} catch (error) {
			console.warn('Failed to parse structured data:', error);
		}
	}
	
	// Build brand input object
	const brandInput: any = {
		// Slide 1: Cover
		brandName: brandName || brandSpec?.brand_name || 'Your Brand',
		tagline: 'Brand Identity Guidelines 2025',
		
		// Slide 2: Brand Positioning
		mission: brandSpec?.mission || extractFromSteps(generatedSteps, 'brand-positioning', 'mission') || 
			'Our mission statement',
		vision: brandSpec?.vision || extractFromSteps(generatedSteps, 'brand-positioning', 'vision') || 
			'Our vision statement',
		values: brandSpec?.values || parseValues(brandValues) || 
			extractFromSteps(generatedSteps, 'brand-positioning', 'values') || 
			['Innovation', 'Excellence', 'Integrity'],
		personality: brandSpec?.brand_personality?.identity || 
			extractFromSteps(generatedSteps, 'brand-positioning', 'personality') ||
			shortDescription || 
			'Our brand personality',
		
		// Slide 3: Logo Guidelines
		logo: {
			primaryLogoUrl: logoFiles?.[0]?.fileData || null,
			minimumSize: brandSpec?.logo?.minimum_sizes?.[0] || '32px',
			clearSpace: brandSpec?.logo?.clear_space_method || '10% padding'
		},
		
		// Slide 4: Color Palette
		colors: extractColors(brandSpec, generatedSteps),
		
		// Slide 5: Typography
		typography: extractTypography(brandSpec, generatedSteps),
		
		// Slide 6: Iconography
		iconography: extractIconography(brandSpec, generatedSteps),
		
		// Slide 7: Photography
		photography: extractPhotography(brandSpec, generatedSteps),
		
		// Slide 8: Applications
		applications: extractApplications(brandSpec, generatedSteps),
		
		// Slide 9: Contact
		contact: {
			website: brandDomain || brandSpec?.legal_contact?.website || 'www.yourbrand.com',
			email: contactEmail || brandSpec?.legal_contact?.email || 'hello@yourbrand.com',
			phone: brandSpec?.legal_contact?.phone || null
		}
	};
	
	return brandInput;
}

async function hydrateLogoFilesFromSnapshots(userId: string, requestData: any): Promise<void> {
	if (requestData.logoFiles && requestData.logoFiles.length > 0) return;

	const logoFiles = await loadLogoFilesFromChatSnapshot(
		userId,
		requestData.chatId,
		requestData.brandName
	);

	if (logoFiles) {
		requestData.logoFiles = logoFiles;
	}
}

async function loadLogoFilesFromChatSnapshot(
	userId: string,
	chatId?: string,
	brandName?: string
): Promise<Array<{ filename: string; usageTag: string; fileData: string }> | null> {
	let query = db
		.select({
			snapshot: brandBuilderChats.latestLogoSnapshot
		})
		.from(brandBuilderChats)
		.where(eq(brandBuilderChats.userId, userId))
		.limit(1);

	if (chatId) {
		query = db
			.select({ snapshot: brandBuilderChats.latestLogoSnapshot })
			.from(brandBuilderChats)
			.where(and(eq(brandBuilderChats.id, chatId), eq(brandBuilderChats.userId, userId)))
			.limit(1);
	} else if (brandName) {
		query = db
			.select({ snapshot: brandBuilderChats.latestLogoSnapshot })
			.from(brandBuilderChats)
			.where(and(eq(brandBuilderChats.userId, userId), eq(brandBuilderChats.brandName, brandName)))
			.orderBy(desc(brandBuilderChats.updatedAt))
			.limit(1);
	}

	const rows = await query;
	const snapshotRaw = rows?.[0]?.snapshot;
	if (!snapshotRaw) return null;

	try {
		const parsed = JSON.parse(snapshotRaw);
		const fileUrl = parsed.fileUrl || parsed.data || null;
		if (!fileUrl) return null;
		return [
			{
				filename: parsed.filename || 'logo.svg',
				usageTag: 'primary',
				fileData: fileUrl,
				fileUrl,
				storageId: parsed.assetId || parsed.storageId
			}
		];
	} catch (error) {
		console.warn('Failed to parse logo snapshot', error);
		return null;
	}
}

/**
 * Extract data from generated steps
 */
function extractFromSteps(steps: any[], stepId: string, field: string): any {
	if (!steps || !Array.isArray(steps)) return null;
	
	const step = steps.find(s => s.stepId === stepId);
	if (!step?.content) return null;
	
	// Try to parse content if it's a string
	let content = step.content;
	if (typeof content === 'string') {
		try {
			content = JSON.parse(content);
		} catch {
			return null;
		}
	}
	
	return content[field] || null;
}

/**
 * Parse comma-separated values string
 */
function parseValues(valuesString: string | null | undefined): string[] | null {
	if (!valuesString) return null;
	return valuesString.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Extract color palette from brand spec or generated steps
 */
function extractColors(brandSpec: any, generatedSteps: any[]): any {
	const colorStep = generatedSteps?.find(s => s.stepId === 'color-palette');
	const colorContent = colorStep?.content;
	
	// Try from structured data first
	if (brandSpec?.colors?.core_palette && brandSpec.colors.core_palette.length > 0) {
		const palette = brandSpec.colors.core_palette;
		return {
			primary: palette[0] ? {
				name: palette[0].name || 'Primary',
				hex: palette[0].hex || '#2563EB',
				rgb: palette[0].rgb || 'RGB(37, 99, 235)',
				usage: palette[0].usage || 'Main brand color'
			} : undefined,
			secondary: palette[1] ? {
				name: palette[1].name || 'Secondary',
				hex: palette[1].hex || '#7C3AED',
				rgb: palette[1].rgb || 'RGB(124, 58, 237)',
				usage: palette[1].usage || 'Accent color'
			} : undefined,
			accent: palette[2] ? {
				name: palette[2].name || 'Accent',
				hex: palette[2].hex || '#10B981',
				rgb: palette[2].rgb || 'RGB(16, 185, 129)',
				usage: palette[2].usage || 'Highlights'
			} : undefined,
			neutral: palette[3] ? {
				name: palette[3].name || 'Neutral',
				hex: palette[3].hex || '#6B7280',
				rgb: palette[3].rgb || 'RGB(107, 114, 128)',
				usage: palette[3].usage || 'Text and borders'
			} : undefined
		};
	}
	
	// Try from generated steps
	if (colorContent) {
		const colors = typeof colorContent === 'string' ? JSON.parse(colorContent) : colorContent;
		if (colors.core_palette) {
			return extractColors({ colors }, []);
		}
	}
	
	// Return defaults
	return {
		primary: {
			name: 'Brand Blue',
			hex: '#2563EB',
			rgb: 'RGB(37, 99, 235)',
			usage: 'Primary brand color'
		},
		secondary: {
			name: 'Brand Purple',
			hex: '#7C3AED',
			rgb: 'RGB(124, 58, 237)',
			usage: 'Secondary accents'
		}
	};
}

/**
 * Extract typography from brand spec or generated steps
 */
function extractTypography(brandSpec: any, generatedSteps: any[]): any {
	const typoStep = generatedSteps?.find(s => s.stepId === 'typography');
	
	// Try from structured data first
	if (brandSpec?.typography?.primary) {
		return {
			primaryFont: {
				name: brandSpec.typography.primary.name || 'Inter',
				weights: brandSpec.typography.primary.weights || ['Regular (400)', 'Bold (700)'],
				usage: brandSpec.typography.primary.usage || 'Headlines and UI'
			},
			secondaryFont: {
				name: brandSpec.typography.supporting?.name || 'Arial',
				weights: brandSpec.typography.supporting?.weights || ['Regular (400)'],
				usage: brandSpec.typography.supporting?.usage || 'Body text'
			}
		};
	}
	
	// Try from generated steps
	if (typoStep?.content) {
		const typo = typeof typoStep.content === 'string' 
			? JSON.parse(typoStep.content) 
			: typoStep.content;
		
		if (typo.primary) {
			return extractTypography({ typography: typo }, []);
		}
	}
	
	// Return defaults
	return {
		primaryFont: {
			name: 'Inter',
			weights: ['Regular (400)', 'Medium (500)', 'Bold (700)'],
			usage: 'Headlines, buttons, UI elements'
		},
		secondaryFont: {
			name: 'Source Sans Pro',
			weights: ['Regular (400)', 'SemiBold (600)'],
			usage: 'Body text, captions'
		}
	};
}

/**
 * Extract iconography guidelines
 */
function extractIconography(brandSpec: any, generatedSteps: any[]): any {
	const iconStep = generatedSteps?.find(s => s.stepId === 'iconography');
	
	if (brandSpec?.iconography) {
		return {
			style: brandSpec.iconography.style || 'Rounded, friendly icons',
			strokeWeight: brandSpec.iconography.stroke || '2px',
			sizeRange: '24px–48px'
		};
	}
	
	if (iconStep?.content) {
		const icon = typeof iconStep.content === 'string' 
			? JSON.parse(iconStep.content) 
			: iconStep.content;
		
		return {
			style: icon.style || 'Rounded, friendly icons',
			strokeWeight: icon.stroke || '2px',
			sizeRange: '24px–48px'
		};
	}
	
	return {
		style: 'Rounded, friendly icons',
		strokeWeight: '2px',
		sizeRange: '24px–48px'
	};
}

/**
 * Extract photography guidelines
 */
function extractPhotography(brandSpec: any, generatedSteps: any[]): any {
	const photoStep = generatedSteps?.find(s => s.stepId === 'photography');
	
	if (brandSpec?.photography) {
		return {
			style: brandSpec.photography.mood || ['Natural', 'Authentic', 'Professional'],
			dos: 'Use natural lighting and authentic scenes',
			donts: 'Avoid heavy filters and staged poses'
		};
	}
	
	if (photoStep?.content) {
		const photo = typeof photoStep.content === 'string' 
			? JSON.parse(photoStep.content) 
			: photoStep.content;
		
		return {
			style: photo.mood || ['Natural', 'Authentic'],
			dos: photo.dos || 'Use natural lighting',
			donts: photo.donts || 'Avoid heavy filters'
		};
	}
	
	return {
		style: ['Natural', 'Authentic', 'Professional'],
		dos: 'Use natural lighting and authentic scenes',
		donts: 'Avoid heavy filters and staged poses'
	};
}

/**
 * Extract applications
 */
function extractApplications(brandSpec: any, generatedSteps: any[]): any[] {
	const appStep = generatedSteps?.find(s => s.stepId === 'applications');
	
	if (brandSpec?.applications && brandSpec.applications.length > 0) {
		return brandSpec.applications.map((app: any) => ({
			name: app.name || app,
			icon: getIconForApplication(app.name || app),
			description: app.description || `${app.name || app} branded materials`
		}));
	}
	
	if (appStep?.content) {
		const apps = typeof appStep.content === 'string' 
			? JSON.parse(appStep.content) 
			: appStep.content;
		
		if (Array.isArray(apps)) {
			return apps.map(app => ({
				name: app.name || app,
				icon: getIconForApplication(app.name || app),
				description: app.description || `${app.name || app} materials`
			}));
		}
	}
	
	// Return defaults
	return [
		{ name: 'Business Cards', icon: '📄', description: 'Professional cards with logo and colors' },
		{ name: 'Website', icon: '🌐', description: 'Digital presence with consistent identity' },
		{ name: 'Social Media', icon: '📱', description: 'Posts, stories, and graphics' },
		{ name: 'Email Templates', icon: '📧', description: 'Branded email communications' },
		{ name: 'Presentations', icon: '📊', description: 'Pitch decks and slides' },
		{ name: 'Packaging', icon: '📦', description: 'Product packaging and labels' }
	];
}

/**
 * Get appropriate icon for application type
 */
function getIconForApplication(name: string): string {
	const lowerName = name.toLowerCase();
	
	if (lowerName.includes('card')) return '📄';
	if (lowerName.includes('web') || lowerName.includes('site')) return '🌐';
	if (lowerName.includes('social') || lowerName.includes('media')) return '📱';
	if (lowerName.includes('email') || lowerName.includes('mail')) return '📧';
	if (lowerName.includes('present') || lowerName.includes('deck')) return '📊';
	if (lowerName.includes('pack')) return '📦';
	if (lowerName.includes('merch') || lowerName.includes('swag')) return '👕';
	if (lowerName.includes('office')) return '🏢';
	if (lowerName.includes('sign')) return '🪧';
	
	return '✨';
}

// Validation now handled by brand-data-adapter.ts

/**
 * Save HTML slides to database
 */
async function saveSlidesToDatabase(
	slides: Array<{ name: string; html: string }>, 
	userId: string, 
	brandGuidelinesId?: string,
	brandName?: string
): Promise<void> {
	try {
		console.log(`💾 Saving ${slides.length} slides to database...`);
		
		// Determine slide type and title from filename
		const getSlideInfo = (filename: string) => {
			if (filename.includes('slide-01')) return { type: 'cover', title: 'Cover Slide', order: 1 };
			if (filename.includes('slide-02')) return { type: 'brand-introduction', title: 'Brand Introduction', order: 2 };
			if (filename.includes('slide-03')) return { type: 'brand-positioning', title: 'Brand Positioning', order: 3 };
			if (filename.includes('slide-04')) return { type: 'logo-guidelines', title: 'Logo Guidelines', order: 4 };
			if (filename.includes('slide-10')) return { type: 'logo-dos', title: 'Logo Do\'s', order: 5 };
			if (filename.includes('slide-11')) return { type: 'logo-donts', title: 'Logo Don\'ts', order: 6 };
			if (filename.includes('slide-05')) return { type: 'color-palette', title: 'Color Palette', order: 7 };
			if (filename.includes('slide-06')) return { type: 'typography', title: 'Typography', order: 8 };
			if (filename.includes('slide-07')) return { type: 'iconography', title: 'Iconography', order: 9 };
			if (filename.includes('slide-08')) return { type: 'photography', title: 'Photography', order: 10 };
			if (filename.includes('slide-09')) return { type: 'applications', title: 'Brand Applications', order: 11 };
			if (filename.includes('slide-12')) return { type: 'thank-you', title: 'Thank You', order: 12 };
			return { type: 'content', title: 'Content Slide', order: 999 };
		};
		
		// Insert each slide into the database
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			const slideInfo = getSlideInfo(slide.name);
			
			await db.insert(generatedSlides).values({
				userId,
				brandGuidelinesId: brandGuidelinesId || null,
				brandName: brandName || 'Unknown Brand',
				slideTitle: slideInfo.title,
				slideNumber: slideInfo.order,
				htmlContent: slide.html,
				slideType: slideInfo.type,
				slideData: JSON.stringify({
					filename: slide.name,
					contentLength: slide.html.length,
					generatedAt: new Date().toISOString()
				}),
				status: 'completed'
			});
			
			console.log(`✓ Saved slide ${i + 1}: ${slideInfo.title}`);
		}
		
		console.log(`✅ Successfully saved ${slides.length} slides to database`);
		
	} catch (error) {
		console.error('❌ Error saving slides to database:', error);
		throw error;
	}
}

/**
 * Find brand guidelines ID by user and brand name
 */
async function findBrandGuidelinesId(userId: string, brandName: string): Promise<string | null> {
	try {
		console.log(`🔍 Looking for brand guidelines: userId=${userId}, brandName="${brandName}"`);
		
		// Find the most recent brand guidelines for this user and brand name
		const result = await db
			.select({ id: brandGuidelines.id })
			.from(brandGuidelines)
			.where(and(
				eq(brandGuidelines.userId, userId),
				eq(brandGuidelines.brandName, brandName)
			))
			.orderBy(brandGuidelines.createdAt)
			.limit(1);
		
		if (result.length > 0) {
			console.log(`✅ Found brand guidelines ID: ${result[0].id}`);
			return result[0].id;
		} else {
			console.log(`❌ No brand guidelines found for user ${userId} and brand "${brandName}"`);
			return null;
		}
	} catch (error) {
		console.error('❌ Error finding brand guidelines ID:', error);
		return null;
	}
}

