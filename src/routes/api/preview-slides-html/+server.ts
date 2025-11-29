import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildFilledHtmlSlides } from '$lib/services/html-slide-generator';
import { adaptBrandDataForSlides } from '$lib/services/brand-data-adapter';
import { db, generatedSlides, brandGuidelines } from '$lib/db';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Get the current session
        const session = await locals.auth();
        const userId = session?.user?.id || 'anonymous';
        
        const body = await request.json();
        
        console.log('🔍 Preview API received:', {
            hasStepHistory: !!body.stepHistory,
            stepHistoryLength: body.stepHistory?.length || 0,
            stepHistoryPreview: body.stepHistory?.slice(0, 2) || [],
            hasLogoFiles: !!body.logoFiles,
            logoFilesCount: body.logoFiles?.length || 0,
            firstLogoFile: body.logoFiles?.[0],
            allBodyKeys: Object.keys(body)
        });

        // Debug: Log the actual stepHistory structure
        if (body.stepHistory && body.stepHistory.length > 0) {
            const firstContent = body.stepHistory[0].content;
            const preview =
                typeof firstContent === 'string'
                    ? firstContent.substring(0, 200)
                    : JSON.stringify(firstContent).substring(0, 200);
            console.log('🔍 First step details:', {
                step: body.stepHistory[0].step,
                title: body.stepHistory[0].title,
                contentType: typeof firstContent,
                contentPreview: preview
            });
        }

        // Expect either stepHistory-based data or direct brand fields
        const brandInput = adaptBrandDataForSlides({
            ...body,
            generatedSteps: body.stepHistory || body.generatedSteps || []
        });

        const missionPreview =
            typeof brandInput.mission === 'string'
                ? brandInput.mission.substring(0, 50)
                : JSON.stringify(brandInput.mission || '').substring(0, 50);
        const visionPreview =
            typeof brandInput.vision === 'string'
                ? brandInput.vision.substring(0, 50)
                : JSON.stringify(brandInput.vision || '').substring(0, 50);
        console.log('🔍 Adapted brand input:', {
            brandName: brandInput.brandName,
            mission: missionPreview,
            vision: visionPreview,
            valuesCount: Array.isArray(brandInput.values) ? brandInput.values.length : 0
        });

        // Extract FULL logo data and ensure it's set in brandInput before generating slides
        const brandName = body.brandName || brandInput.brandName || 'Unknown Brand';
        const brandGuidelinesId = await findBrandGuidelinesId(userId, brandName);
        const extractedLogo = await extractLogoFromBrandData(brandInput, brandGuidelinesId || body.guidelineId);
        
        if (extractedLogo) {
            // Ensure the logo is a valid base64 data URL - NO TRUNCATION!
            let fullLogoData = extractedLogo.trim();
            
            if (!fullLogoData.startsWith('data:')) {
                // If it's just base64, add the data URL prefix
                if (fullLogoData.startsWith('<svg') || fullLogoData.startsWith('<?xml')) {
                    // SVG XML - encode as data URL (preserve full content)
                    fullLogoData = `data:image/svg+xml;base64,${Buffer.from(fullLogoData).toString('base64')}`;
                } else if (fullLogoData.startsWith('/9j/') || fullLogoData.match(/^[A-Za-z0-9+/=]+$/)) {
                    // JPEG or PNG base64
                    const isJpeg = fullLogoData.startsWith('/9j/');
                    fullLogoData = `data:image/${isJpeg ? 'jpeg' : 'png'};base64,${fullLogoData}`;
                } else {
                    // Unknown format, assume PNG
                    fullLogoData = `data:image/png;base64,${fullLogoData}`;
                }
            }
            
            // Set the FULL logo in brandInput to ensure it's used in slides (NO TRUNCATION!)
            if (!brandInput.logo) {
                brandInput.logo = {};
            }
            brandInput.logo.primaryLogoUrl = fullLogoData; // Full base64, no truncation
            
            console.log('✅ Extracted and set FULL logo data for preview (no truncation):', {
                logoLength: fullLogoData.length,
                logoPrefix: fullLogoData.substring(0, 50),
                isDataUrl: fullLogoData.startsWith('data:'),
                sizeInKB: (fullLogoData.length / 1024).toFixed(2)
            });
        } else {
            console.warn('⚠️ No logo found in brand data for preview');
        }

        // Get template set from request (if provided)
        const templateSet = body.templateSet || undefined;
        console.log('🎨 Using template set:', templateSet || 'default (root)');

        const slides = buildFilledHtmlSlides(brandInput, templateSet);
        
        // Save slides to stepHistory for persistence
        const updatedStepHistory = [...(body.stepHistory || [])];
        const slidesStep = {
            step: 'generated-slides',
            stepTitle: 'Generated Slides',
            content: JSON.stringify(slides),
            approved: true,
            timestamp: new Date().toISOString()
        };
        
        // Remove existing slides step if it exists
        const existingSlidesIndex = updatedStepHistory.findIndex(s => s.step === 'generated-slides');
        if (existingSlidesIndex !== -1) {
            updatedStepHistory[existingSlidesIndex] = slidesStep;
        } else {
            updatedStepHistory.push(slidesStep);
        }
        
        console.log('💾 Saved slides to stepHistory:', {
            slidesCount: slides.length,
            stepHistoryLength: updatedStepHistory.length
        });

        // Save HTML content to generatedSlides table (brandGuidelinesId already fetched above)
        await saveSlidesToDatabase(slides, userId, brandGuidelinesId || undefined, brandName, brandInput);
        
        // Also save Svelte slide data automatically (same way as HTML)
        try {
            const { buildFilledSvelteSlides } = await import('$lib/services/svelte-slide-generator');
            const svelteSlides = await buildFilledSvelteSlides(brandInput);
            await saveSvelteSlidesToDatabase(svelteSlides, userId, brandGuidelinesId || undefined, brandName, brandInput);
            console.log('✅ Svelte slides saved successfully');
        } catch (error) {
            console.error('❌ Error saving Svelte slides:', error);
            // Don't fail the request if Svelte slide save fails
        }
        
        // Update the database with the new stepHistory that includes slides
        if (body.guidelineId) {
            try {
                const { db, brandGuidelines } = await import('$lib/db');
                const { eq } = await import('drizzle-orm');
                
                // Get the current structuredData
                const currentRecord = await db
                    .select({ structuredData: brandGuidelines.structuredData })
                    .from(brandGuidelines)
                    .where(eq(brandGuidelines.id, body.guidelineId))
                    .limit(1);
                
                if (currentRecord.length > 0) {
                    const currentStructuredData = JSON.parse(currentRecord[0].structuredData || '{}');
                    
                    // Update the stepHistory in structuredData
                    const updatedStructuredData = {
                        ...currentStructuredData,
                        stepHistory: updatedStepHistory
                    };
                    
                    // Save back to database
                    await db
                        .update(brandGuidelines)
                        .set({
                            structuredData: JSON.stringify(updatedStructuredData),
                            updatedAt: new Date()
                        })
                        .where(eq(brandGuidelines.id, body.guidelineId));
                    
                    console.log('💾 Updated database with slides in stepHistory');
                }
            } catch (dbError) {
                console.warn('⚠️ Failed to update database with slides:', dbError);
                // Don't fail the request if database update fails
            }
        }
        
        return json({ 
            success: true, 
            slides,
            updatedStepHistory 
        });
    } catch (err: any) {
        console.error('❌ Preview API error:', err);
        return json({ success: false, error: err?.message || 'Failed to build slides' }, { status: 400 });
    }
};

/**
 * Extract logo from brand data or fetch from brandGuidelines table
 */
async function extractLogoFromBrandData(brandInput: any, brandGuidelinesId?: string): Promise<string | null> {
	if (!brandInput) {
		// If no brandInput but we have brandGuidelinesId, try to fetch from brandGuidelines table
		if (brandGuidelinesId) {
			try {
				const guideline = await db
					.select({ logoData: brandGuidelines.logoData, logoFiles: brandGuidelines.logoFiles })
					.from(brandGuidelines)
					.where(eq(brandGuidelines.id, brandGuidelinesId))
					.limit(1);
				
				if (guideline.length > 0) {
					// Try logoData first
					if (guideline[0].logoData) {
						return guideline[0].logoData;
					}
					// Try logoFiles
					if (guideline[0].logoFiles) {
						try {
							const logoFiles = typeof guideline[0].logoFiles === 'string' 
								? JSON.parse(guideline[0].logoFiles) 
								: guideline[0].logoFiles;
							if (Array.isArray(logoFiles) && logoFiles.length > 0) {
								return logoFiles[0].fileData || logoFiles[0].file_data;
							}
						} catch (error) {
							console.warn('Failed to parse logoFiles:', error);
						}
					}
				}
			} catch (error) {
				console.warn('Failed to fetch logo from brandGuidelines table:', error);
			}
		}
		return null;
	}
	
	// Try logoFiles array first (new format)
	if (Array.isArray(brandInput.logoFiles) && brandInput.logoFiles.length > 0) {
		const firstLogo = brandInput.logoFiles[0];
		if (firstLogo?.fileData) return firstLogo.fileData;
		if (firstLogo?.data) return firstLogo.data;
	}
	
	// Try logo object
	if (brandInput.logo?.primaryLogoUrl) return brandInput.logo.primaryLogoUrl;
	if (brandInput.logo?.primary) return brandInput.logo.primary;
	
	// Try direct logoData
	if (brandInput.logoData) return brandInput.logoData;
	
	// Fallback: try to fetch from brandGuidelines table if brandGuidelinesId is available
	if (brandGuidelinesId) {
		try {
			const guideline = await db
				.select({ logoData: brandGuidelines.logoData, logoFiles: brandGuidelines.logoFiles })
				.from(brandGuidelines)
				.where(eq(brandGuidelines.id, brandGuidelinesId))
				.limit(1);
			
			if (guideline.length > 0) {
				if (guideline[0].logoData) {
					return guideline[0].logoData;
				}
				if (guideline[0].logoFiles) {
					try {
						const logoFiles = typeof guideline[0].logoFiles === 'string' 
							? JSON.parse(guideline[0].logoFiles) 
							: guideline[0].logoFiles;
						if (Array.isArray(logoFiles) && logoFiles.length > 0) {
							return logoFiles[0].fileData || logoFiles[0].file_data;
						}
					} catch (error) {
						console.warn('Failed to parse logoFiles:', error);
					}
				}
			}
		} catch (error) {
			console.warn('Failed to fetch logo from brandGuidelines table:', error);
		}
	}
	
	return null;
}

/**
 * Save HTML slides to database
 */
async function saveSlidesToDatabase(
	slides: Array<{ name: string; html: string }>, 
	userId: string, 
	brandGuidelinesId?: string,
	brandName?: string,
	brandInput?: any
): Promise<void> {
	try {
		console.log(`💾 Saving ${slides.length} HTML slides to generatedSlides table...`);
		
		// Extract logo from brand data or fetch from brandGuidelines table
		const logoData = await extractLogoFromBrandData(brandInput, brandGuidelinesId);
		
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
			return null; // Don't save unknown slides
		};
		
		// Save each slide (update if exists, insert if not)
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			const slideInfo = getSlideInfo(slide.name);
			
			// Skip unknown slides
			if (!slideInfo) {
				console.warn(`⚠️ Skipping unknown slide: ${slide.name}`);
				continue;
			}
			
			// Check if slide already exists
			const whereConditions: any[] = [
				eq(generatedSlides.slideType, slideInfo.type),
				eq(generatedSlides.slideNumber, slideInfo.order)
			];
			
			if (brandGuidelinesId) {
				whereConditions.push(eq(generatedSlides.brandGuidelinesId, brandGuidelinesId));
			} else {
				whereConditions.push(eq(generatedSlides.userId, userId));
				whereConditions.push(eq(generatedSlides.brandName, brandName || 'Unknown Brand'));
			}
			
			const existingSlide = await db
				.select({ id: generatedSlides.id })
				.from(generatedSlides)
				.where(and(...whereConditions))
				.limit(1);
			
			if (existingSlide && existingSlide.length > 0) {
				// Update existing slide with HTML content and logo
				await db
					.update(generatedSlides)
					.set({
						htmlContent: slide.html,
						logo: logoData, // Update logo with each slide
						updatedAt: new Date()
					})
					.where(eq(generatedSlides.id, existingSlide[0].id));
				
				console.log(`✓ Updated HTML slide: ${slideInfo.title}${logoData ? ' (with logo)' : ''}`);
			} else {
				// Insert new slide
				await db.insert(generatedSlides).values({
					userId,
					brandGuidelinesId: brandGuidelinesId || null,
					brandName: brandName || 'Unknown Brand',
					slideTitle: slideInfo.title,
					slideNumber: slideInfo.order,
					htmlContent: slide.html,
					svelteContent: '', // Will be filled when Svelte slides are generated
					slideType: slideInfo.type,
					logo: logoData, // Save logo with each slide
					slideData: JSON.stringify({
						filename: slide.name,
						contentLength: slide.html.length,
						generatedAt: new Date().toISOString()
					}),
					status: 'completed'
				});
				
				console.log(`✓ Inserted HTML slide: ${slideInfo.title}${logoData ? ' (with logo)' : ''}`);
			}
		}
		
		console.log(`✅ Successfully saved ${slides.length} HTML slides to generatedSlides table`);
		
	} catch (error) {
		console.error('❌ Error saving HTML slides to generatedSlides table:', error);
		// Don't throw error to avoid breaking the preview
	}
}

/**
 * Save Svelte slides to database (same structure as HTML slides)
 */
async function saveSvelteSlidesToDatabase(
	slides: Array<{ id: string; type: string; layout: any; elements: any[] }>, 
	userId: string, 
	brandGuidelinesId?: string,
	brandName?: string,
	brandInput?: any
): Promise<void> {
	try {
		console.log(`💾 Saving ${slides.length} Svelte slides to generatedSlides table...`);
		
		// Extract logo from brand data or fetch from brandGuidelines table
		const logoData = await extractLogoFromBrandData(brandInput, brandGuidelinesId);
		
		// Map slide types to titles and orders (same as HTML slides)
		// Handle both the 'type' field and map 'content'/'closing' to their actual types
		const slideTypeMap: Record<string, { title: string; order: number }> = {
			'cover': { title: 'Cover Slide', order: 1 },
			'brand-introduction': { title: 'Brand Introduction', order: 2 },
			'brand-positioning': { title: 'Brand Positioning', order: 3 },
			'logo-guidelines': { title: 'Logo Guidelines', order: 4 },
			'logo-dos': { title: 'Logo Do\'s', order: 5 },
			'logo-donts': { title: 'Logo Don\'ts', order: 6 },
			'color-palette': { title: 'Color Palette', order: 7 },
			'color': { title: 'Color Palette', order: 7 }, // Alias for color-palette
			'typography': { title: 'Typography', order: 8 },
			'iconography': { title: 'Iconography', order: 9 },
			'photography': { title: 'Photography', order: 10 },
			'applications': { title: 'Brand Applications', order: 11 },
			'thank-you': { title: 'Thank You', order: 12 },
			'closing': { title: 'Thank You', order: 12 } // Alias for thank-you
		};
		
		// Save each slide
		for (const slideData of slides) {
			// Determine the actual slide type from the type field or id
			let actualType = slideData.type;
			
			// Map 'content' type based on slide id
			if (actualType === 'content') {
				if (slideData.id === 'brand-introduction') actualType = 'brand-introduction';
				else if (slideData.id === 'brand-positioning') actualType = 'brand-positioning';
				else {
					console.warn(`⚠️ Unknown content slide with id: ${slideData.id}, skipping`);
					continue;
				}
			}
			
			// Map 'closing' to 'thank-you'
			if (actualType === 'closing') {
				actualType = 'thank-you';
			}
			
			const slideInfo = slideTypeMap[actualType];
			
			// Skip if slide type is not recognized
			if (!slideInfo) {
				console.warn(`⚠️ Skipping unknown slide type: ${slideData.type} (id: ${slideData.id})`);
				continue;
			}
			
			// Serialize the SlideData object to JSON
			const svelteContent = JSON.stringify(slideData);
			
			// Check if slide already exists (update if exists, insert if not)
			// Use the actual type for matching, not the original type
			const whereConditions: any[] = [
				eq(generatedSlides.slideType, actualType),
				eq(generatedSlides.slideNumber, slideInfo.order)
			];
			
			if (brandGuidelinesId) {
				whereConditions.push(eq(generatedSlides.brandGuidelinesId, brandGuidelinesId));
			} else {
				whereConditions.push(eq(generatedSlides.userId, userId));
				whereConditions.push(eq(generatedSlides.brandName, brandName || 'Unknown Brand'));
			}
			
			const existingSlide = await db
				.select({ id: generatedSlides.id })
				.from(generatedSlides)
				.where(and(...whereConditions))
				.limit(1);
			
			if (existingSlide && existingSlide.length > 0) {
				// Update existing slide with Svelte content and logo
				await db
					.update(generatedSlides)
					.set({
						svelteContent,
						logo: logoData, // Update logo with each slide
						updatedAt: new Date()
					})
					.where(eq(generatedSlides.id, existingSlide[0].id));
				
				console.log(`✓ Updated Svelte slide: ${slideInfo.title}${logoData ? ' (with logo)' : ''}`);
			} else {
				// Insert new slide (htmlContent will be empty initially if HTML slides haven't been generated yet)
				await db.insert(generatedSlides).values({
					userId,
					brandGuidelinesId: brandGuidelinesId || null,
					brandName: brandName || 'Unknown Brand',
					slideTitle: slideInfo.title,
					slideNumber: slideInfo.order,
					htmlContent: '', // Will be filled when HTML slides are generated
					svelteContent,
					slideType: actualType, // Use the mapped type, not the original
					logo: logoData, // Save logo with each slide
					slideData: JSON.stringify({
						slideId: slideData.id,
						elementCount: slideData.elements?.length || 0,
						generatedAt: new Date().toISOString()
					}),
					status: 'completed'
				});
				
				console.log(`✓ Inserted new Svelte slide: ${slideInfo.title}${logoData ? ' (with logo)' : ''}`);
			}
		}
		
		console.log(`✅ Successfully saved ${slides.length} Svelte slides to generatedSlides table`);
		
	} catch (error) {
		console.error('❌ Error saving Svelte slides to generatedSlides table:', error);
		// Don't throw error to avoid breaking the preview
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





