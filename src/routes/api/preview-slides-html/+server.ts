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
            console.log('🔍 First step details:', {
                step: body.stepHistory[0].step,
                title: body.stepHistory[0].title,
                contentLength: body.stepHistory[0].content?.length,
                contentPreview: body.stepHistory[0].content?.substring(0, 200)
            });
        }

        // Expect either stepHistory-based data or direct brand fields
        const brandInput = adaptBrandDataForSlides({
            ...body,
            generatedSteps: body.stepHistory || body.generatedSteps || []
        });

        console.log('🔍 Adapted brand input:', {
            brandName: brandInput.brandName,
            mission: brandInput.mission?.substring(0, 50),
            vision: brandInput.vision?.substring(0, 50),
            valuesCount: brandInput.values?.length
        });

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

        // Save HTML content to generatedSlides table
        const brandName = body.brandName || brandInput.brandName || 'Unknown Brand';
        const brandGuidelinesId = await findBrandGuidelinesId(userId, brandName);
        await saveSlidesToDatabase(slides, userId, brandGuidelinesId, brandName);
        
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
 * Save HTML slides to database
 */
async function saveSlidesToDatabase(
	slides: Array<{ name: string; html: string }>, 
	userId: string, 
	brandGuidelinesId?: string,
	brandName?: string
): Promise<void> {
	try {
		console.log(`💾 Saving ${slides.length} slides to generatedSlides table...`);
		
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
		
		console.log(`✅ Successfully saved ${slides.length} slides to generatedSlides table`);
		
	} catch (error) {
		console.error('❌ Error saving slides to generatedSlides table:', error);
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


