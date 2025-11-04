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

		// Parse structured data
		let brandGuidelinesSpec;
		try {
			brandGuidelinesSpec = JSON.parse(guideline[0].structuredData || '{}');
		} catch (error) {
			return json({ error: 'Invalid brand guidelines data' }, { status: 400 });
		}

		// Return the structured brand guidelines
		return json({
			success: true,
			brandGuidelines: brandGuidelinesSpec
		});
	} catch (error) {
		console.error('Error fetching structured brand guidelines:', error);
		return json(
			{
				error: 'Failed to fetch brand guidelines'
			},
			{ status: 500 }
		);
	}
};
