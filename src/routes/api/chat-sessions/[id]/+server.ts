import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { brandBuilderChats } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const chatId = params.id;

	const [chat] = await db
		.update(brandBuilderChats)
		.set({
			title: body.brandName?.trim() || body.title?.trim() || 'Untitled Chat',
			brandName: body.brandName?.trim() || null,
			messages: body.messages ? JSON.stringify(body.messages) : null,
			state: body.state ? JSON.stringify(body.state) : null,
			messageHistory: body.messageHistory || undefined,
			logoHistory: body.logoHistory || undefined,
			updatedAt: new Date()
		})
		.where(and(eq(brandBuilderChats.id, chatId), eq(brandBuilderChats.userId, session.user.id)))
		.returning();

	if (!chat) {
		return json({ success: false, error: 'Chat not found' }, { status: 404 });
	}

	return json({ success: true, chat });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const chatId = params.id;

	const deleted = await db
		.delete(brandBuilderChats)
		.where(and(eq(brandBuilderChats.id, chatId), eq(brandBuilderChats.userId, session.user.id)))
		.returning();

	if (deleted.length === 0) {
		return json({ success: false, error: 'Chat not found' }, { status: 404 });
	}

	return json({ success: true });
};

