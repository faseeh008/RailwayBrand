import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { brandBuilderChats } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const chats = await db
		.select()
		.from(brandBuilderChats)
		.where(eq(brandBuilderChats.userId, session.user.id))
		.orderBy(desc(brandBuilderChats.updatedAt));

	return json({ success: true, chats });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const now = new Date();

	const [chat] = await db
		.insert(brandBuilderChats)
		.values({
			userId: session.user.id,
			title: body.title?.trim() || 'Untitled Chat',
			brandName: body.brandName?.trim() || null,
			messages: body.messages ? JSON.stringify(body.messages) : null,
			state: body.state ? JSON.stringify(body.state) : null,
			messageHistory: body.messageHistory || null,
			logoHistory: body.logoHistory || null,
			createdAt: now,
			updatedAt: now
		})
		.returning();

	return json({ success: true, chat });
};

