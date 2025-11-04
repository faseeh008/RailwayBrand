import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { brandGuidelines, generatedSlides } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { slides, stepHistory } = await request.json();

		console.log('🔄 Sync slides API called:', {
			guidelineId: id,
			slidesCount: slides?.length || 0,
			hasStepHistory: !!stepHistory
		});

		if (!id) {
			return json({ success: false, error: 'Guideline ID is required' }, { status: 400 });
		}

		if (!slides || !Array.isArray(slides)) {
			return json({ success: false, error: 'Slides data is required' }, { status: 400 });
		}

		// Get the current guideline
		const currentGuideline = await db
			.select()
			.from(brandGuidelines)
			.where(eq(brandGuidelines.id, id))
			.limit(1);

		if (currentGuideline.length === 0) {
			return json({ success: false, error: 'Guideline not found' }, { status: 404 });
		}

		const guideline = currentGuideline[0];
		let structuredData = guideline.structuredData;

		// Parse structuredData if it's a string
		if (typeof structuredData === 'string') {
			try {
				structuredData = JSON.parse(structuredData);
			} catch (error) {
				console.error('Error parsing structuredData:', error);
				return json({ success: false, error: 'Invalid structured data format' }, { status: 400 });
			}
		}

		// Update the structuredData with new slides and stepHistory
		if (!structuredData) {
			structuredData = {};
		}

		// Update stepHistory
		if (stepHistory) {
			structuredData.stepHistory = stepHistory;
		}

		// Update the guideline in the database
		const updatedGuideline = await db
			.update(brandGuidelines)
			.set({
				structuredData: JSON.stringify(structuredData),
				updatedAt: new Date()
			})
			.where(eq(brandGuidelines.id, id))
			.returning();

		if (updatedGuideline.length === 0) {
			return json({ success: false, error: 'Failed to update guideline' }, { status: 500 });
		}

		// Also update the generatedSlides table so history page can see changes
		if (slides && slides.length > 0) {
			const guideline = updatedGuideline[0];
			
			console.log('🔄 Updating generatedSlides table:', {
				guidelineId: id,
				userId: guideline.userId,
				brandName: guideline.brandName,
				slidesToUpdate: slides.length
			});
			
			// Delete existing slides for this guideline
			const deleteResult = await db
				.delete(generatedSlides)
				.where(and(
					eq(generatedSlides.brandGuidelinesId, id),
					eq(generatedSlides.userId, guideline.userId)
				));
			
			console.log('🗑️ Deleted existing slides:', deleteResult);

			// Insert updated slides
			const slidesToInsert = slides.map((slide: any, index: number) => ({
				brandGuidelinesId: id,
				userId: guideline.userId,
				brandName: guideline.brandName,
				slideTitle: slide.slideTitle || `Slide ${index + 1}`,
				slideNumber: index + 1,
				slideType: slide.slideType || 'content',
				htmlContent: slide.html || slide.htmlContent || '',
				slideData: JSON.stringify(slide.slideData || {}),
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date()
			}));

			const insertResult = await db.insert(generatedSlides).values(slidesToInsert);
			
			console.log(`✅ Updated ${slidesToInsert.length} slides in generatedSlides table:`, insertResult);
		}

		return json({
			success: true,
			message: 'Slides synced successfully',
			guideline: updatedGuideline[0]
		});

	} catch (error) {
		console.error('Error syncing slides:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
