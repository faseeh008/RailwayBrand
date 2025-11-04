import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		return {
			userGuidelines: []
		};
	}

	try {
		const userGuidelines = await db
			.select()
			.from(brandGuidelines)
			.where(eq(brandGuidelines.userId, session.user.id))
			.orderBy(desc(brandGuidelines.createdAt));

		return {
			userGuidelines
		};
	} catch (error) {
		console.error('Error loading user guidelines:', error);
		return {
			userGuidelines: []
		};
	}
};
