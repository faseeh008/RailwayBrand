import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const userGuidelines = await db
			.select()
			.from(brandGuidelines)
			.where(eq(brandGuidelines.userId, session.user.id))
			.orderBy(desc(brandGuidelines.createdAt));

		return json({
			success: true,
			guidelines: userGuidelines
		});
	} catch (error) {
		console.error('Error fetching brand guidelines:', error);
		return json(
			{
				error: 'Failed to fetch brand guidelines'
			},
			{ status: 500 }
		);
	}
};
