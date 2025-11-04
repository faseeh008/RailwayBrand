import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { BrandGuidelinesSpec } from '$lib/types/brand-guidelines';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const body = await request.json();
		const { brandGuidelines: updatedGuidelines } = body as { brandGuidelines: BrandGuidelinesSpec };

		if (!updatedGuidelines) {
			return json({ error: 'Brand guidelines data is required' }, { status: 400 });
		}

		// Update the brand guidelines in the database
		const result = await db
			.update(brandGuidelines)
			.set({
				content: JSON.stringify(updatedGuidelines),
				structuredData: JSON.stringify(updatedGuidelines),
				updatedAt: new Date()
			})
			.where(eq(brandGuidelines.userId, session.user.id))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Brand guidelines not found' }, { status: 404 });
		}

		return json({
			success: true,
			message: 'Brand guidelines updated successfully',
			updatedGuidelines: result[0]
		});
	} catch (error) {
		console.error('Error updating brand guidelines:', error);
		return json(
			{
				error: 'Failed to update brand guidelines',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
