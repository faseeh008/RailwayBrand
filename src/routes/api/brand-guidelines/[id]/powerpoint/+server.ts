import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const guidelineId = params.id;

		if (!guidelineId) {
			return json({ error: 'Guideline ID is required' }, { status: 400 });
		}

		// Fetch the brand guidelines from database
		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(eq(brandGuidelines.id, guidelineId))
			.limit(1);

		if (guideline.length === 0) {
			return json({ error: 'Brand guidelines not found' }, { status: 404 });
		}

		// Check if user owns this guideline
		if (guideline[0].userId !== session.user.id) {
			return json({ error: 'Unauthorized access' }, { status: 403 });
		}

		// Check if PowerPoint content exists
		if (!guideline[0].powerpointContent) {
			return json({ error: 'PowerPoint content not found' }, { status: 404 });
		}

		// Convert base64 back to buffer
		const pptxBuffer = Buffer.from(guideline[0].powerpointContent, 'base64');

		// Return the PowerPoint file
		return new Response(pptxBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'Content-Disposition': `attachment; filename="${guideline[0].brandName}_Brand_Guidelines.pptx"`,
				'Content-Length': pptxBuffer.length.toString()
			}
		});
	} catch (error) {
		console.error('Error retrieving PowerPoint:', error);
		return json(
			{
				error: 'Failed to retrieve PowerPoint presentation'
			},
			{ status: 500 }
		);
	}
};
