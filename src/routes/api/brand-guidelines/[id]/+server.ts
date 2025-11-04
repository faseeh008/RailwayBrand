import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(and(eq(brandGuidelines.id, params.id), eq(brandGuidelines.userId, session.user.id)))
			.limit(1);

		if (guideline.length === 0) {
			return json({ error: 'Brand guideline not found' }, { status: 404 });
		}

		return json({
			success: true,
			guideline: guideline[0]
		});
	} catch (error) {
		console.error('Error fetching brand guideline:', error);
		return json(
			{
				error: 'Failed to fetch brand guideline'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { content, brandName, structuredData } = await request.json();

		if (!content || !brandName) {
			return json({ error: 'Content and brand name are required' }, { status: 400 });
		}

		const updateData: any = {
			content: content.trim(),
			brandName: brandName.trim(),
			updatedAt: new Date()
		};

		// Include structuredData if provided
		if (structuredData) {
			updateData.structuredData = structuredData.trim();
		}

		const updatedGuideline = await db
			.update(brandGuidelines)
			.set(updateData)
			.where(and(eq(brandGuidelines.id, params.id), eq(brandGuidelines.userId, session.user.id)))
			.returning();

		if (updatedGuideline.length === 0) {
			return json({ error: 'Brand guideline not found' }, { status: 404 });
		}

		return json({
			success: true,
			guideline: updatedGuideline[0]
		});
	} catch (error) {
		console.error('Error updating brand guideline:', error);
		return json(
			{
				error: 'Failed to update brand guideline'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const deletedGuideline = await db
			.delete(brandGuidelines)
			.where(and(eq(brandGuidelines.id, params.id), eq(brandGuidelines.userId, session.user.id)))
			.returning();

		if (deletedGuideline.length === 0) {
			return json({ error: 'Brand guideline not found' }, { status: 404 });
		}

		return json({
			success: true,
			message: 'Brand guideline deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting brand guideline:', error);
		return json(
			{
				error: 'Failed to delete brand guideline'
			},
			{ status: 500 }
		);
	}
};
