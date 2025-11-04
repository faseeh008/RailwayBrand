import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const brandName = url.searchParams.get('brandName');

		if (!brandName) {
			return json({ error: 'Brand name is required' }, { status: 400 });
		}

		// Get the most recent guideline for this brand name and user
		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(
				and(
					eq(brandGuidelines.brandName, brandName),
					eq(brandGuidelines.userId, session.user.id)
				)
			)
			.orderBy(desc(brandGuidelines.createdAt))
			.limit(1);

		if (guideline.length === 0) {
			return json({ 
				success: false, 
				error: 'No guideline found for this brand name' 
			}, { status: 404 });
		}

		return json({
			success: true,
			guideline: guideline[0]
		});

	} catch (error) {
		console.error('Error fetching guideline by name:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
