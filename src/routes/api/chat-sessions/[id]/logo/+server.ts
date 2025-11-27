import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { brandBuilderChats } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { saveLogoAsset, getLogoAssetById } from '$lib/server/logo-storage';

type LogoSnapshot = {
	brandName: string | null;
	source: 'ai-generated' | 'upload' | 'unknown';
	filename: string | null;
	mimeType: string | null;
	userId: string;
	userName: string | null | undefined;
	acceptedAt: string;
	assetId: string;
	fileUrl: string;
};

function inferMimeType(dataUrl?: string): string | null {
	if (!dataUrl || typeof dataUrl !== 'string') return null;
	const match = dataUrl.match(/^data:([^;]+);base64,/i);
	return match ? match[1] : null;
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const chatId = params.id;
	if (!chatId) {
		return json({ success: false, error: 'Chat ID is required' }, { status: 400 });
	}

	let body: any;
	try {
		body = await request.json();
	} catch (error) {
		return json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
	}

	const providedLogoData: string | undefined = body?.logoData || body?.fileData;
	let storageId: string | undefined = body?.storageId || body?.logoId;
	let fileUrl: string | undefined = body?.fileUrl;
	const filename: string | null = body?.filename || null;
	let mimeType: string | null = body?.mimeType || null;

	if (!storageId && fileUrl && typeof fileUrl === 'string') {
		const match = fileUrl.match(/\/api\/logos\/([a-f0-9-]+)/i);
		if (match) {
			storageId = match[1];
		}
	}

	if (!storageId && providedLogoData && providedLogoData.startsWith('data:')) {
		const parsed = providedLogoData.match(/^data:([^;]+);base64,(.+)$/);
		if (!parsed) {
			return json({ success: false, error: 'Invalid logo data provided' }, { status: 400 });
		}
		const [, parsedMime, base64] = parsed;
		mimeType = parsedMime;
		const buffer = Buffer.from(base64, 'base64');
		const saved = await saveLogoAsset({
			buffer,
			filename: filename || 'logo.svg',
			mimeType: mimeType || 'image/png',
			userId: session.user.id,
			source: body?.source || 'unknown'
		});
		storageId = saved.id;
		fileUrl = saved.fileUrl;
	} else if (!storageId && !fileUrl) {
		return json(
			{ success: false, error: 'A stored logo reference is required' },
			{ status: 400 }
		);
	}

	if (!fileUrl && storageId) {
		fileUrl = `/api/logos/${storageId}`;
	}

	if (!mimeType && storageId) {
		const asset = await getLogoAssetById(storageId);
		mimeType = asset?.mimeType || null;
	}

	const brandName: string | null =
		body?.brandName || body?.brand_name || body?.brand || null;

	const snapshot: LogoSnapshot = {
		brandName,
		source: (body?.source as LogoSnapshot['source']) || 'unknown',
		filename,
		mimeType: mimeType || inferMimeType(providedLogoData),
		userId: session.user.id,
		userName: session.user.name || session.user.email,
		acceptedAt: new Date().toISOString(),
		assetId: storageId!,
		fileUrl: fileUrl!
	};

	const updatePayload: { latestLogoSnapshot: string; updatedAt: Date; brandName?: string | null } =
	{
		latestLogoSnapshot: JSON.stringify(snapshot),
		updatedAt: new Date()
	};

	if (brandName) {
		updatePayload.brandName = brandName;
	}

	const [updated] = await db
		.update(brandBuilderChats)
		.set(updatePayload)
		.where(and(eq(brandBuilderChats.id, chatId), eq(brandBuilderChats.userId, session.user.id)))
		.returning({ id: brandBuilderChats.id });

	if (!updated) {
		return json({ success: false, error: 'Chat not found' }, { status: 404 });
	}

	return json({ success: true, snapshot });
};

