/**
 * API Endpoint: Get Slides for History Page
 * 
 * This endpoint retrieves slides for a specific brand guideline to display in history.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db, generatedSlides } from '$lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Get the current session
		const session = await locals.auth();
		
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get query parameters
		const brandGuidelinesId = url.searchParams.get('brandGuidelinesId');
		const brandName = url.searchParams.get('brandName');

		if (!brandGuidelinesId && !brandName) {
			return json({ error: 'brandGuidelinesId or brandName is required' }, { status: 400 });
		}

		// Build query - get slides for specific brand only, sorted by brandName then slideNumber
		let query = db.select().from(generatedSlides)
			.where(eq(generatedSlides.userId, session.user.id))
			.orderBy(generatedSlides.brandName, generatedSlides.slideNumber);

		// Filter by brand guidelines ID if provided
		if (brandGuidelinesId) {
			query = query.where(eq(generatedSlides.brandGuidelinesId, brandGuidelinesId));
		} else if (brandName) {
			query = query.where(eq(generatedSlides.brandName, brandName));
		}

		// Get all slides for this brand
		const allSlides = await query;

		console.log(`📄 Retrieved ${allSlides.length} slides for history page`, {
			brandName,
			brandGuidelinesId,
			userId: session.user.id,
			slidesFound: allSlides.length
		});

		// Group slides by brand name to find the most recent set
		const slidesByBrand = allSlides.reduce((acc, slide) => {
			if (!acc[slide.brandName]) {
				acc[slide.brandName] = [];
			}
			acc[slide.brandName].push(slide);
			return acc;
		}, {} as Record<string, typeof allSlides>);

		// Get the most recent slides for the requested brand
		const brandSlides = brandName ? slidesByBrand[brandName] || [] : Object.values(slidesByBrand).flat();
		
		// Find the most recent generation (by createdAt) and get those slides
		const mostRecentGeneration = brandSlides
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 12); // Get the most recent 12 slides

		// Sort by slide number to ensure correct order (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
		const sortedSlides = mostRecentGeneration.sort((a, b) => a.slideNumber - b.slideNumber);

		return json({
			success: true,
			slides: sortedSlides.map(slide => ({
				id: slide.id,
				brandName: slide.brandName,
				slideTitle: slide.slideTitle,
				slideNumber: slide.slideNumber,
				slideType: slide.slideType,
				htmlContent: slide.htmlContent,
				slideData: slide.slideData ? JSON.parse(slide.slideData) : null,
				status: slide.status,
				createdAt: slide.createdAt,
				updatedAt: slide.updatedAt
			})),
			total: sortedSlides.length
		});

	} catch (error) {
		console.error('❌ Error retrieving slides for history:', error);
		
		return json({
			error: 'Failed to retrieve slides for history',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
