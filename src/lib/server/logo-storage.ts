import { db, logoAssets } from '$lib/db';
import { eq } from 'drizzle-orm';

type SaveLogoAssetParams = {
	buffer: Buffer;
	filename: string;
	mimeType: string;
	userId?: string | null;
	source?: string | null;
};

const buildLogoUrl = (id: string) => `/api/logos/${id}`;

export async function saveLogoAsset({
	buffer,
	filename,
	mimeType,
	userId,
	source
}: SaveLogoAssetParams): Promise<{ id: string; fileUrl: string }> {
	const [inserted] = await db
		.insert(logoAssets)
		.values({
			filename,
			mimeType,
			data: buffer,
			userId: userId || null,
			source: source || null
		})
		.returning({ id: logoAssets.id });

	const id = inserted?.id;
	if (!id) {
		throw new Error('Failed to persist logo asset');
	}

	return {
		id,
		fileUrl: buildLogoUrl(id)
	};
}

export async function getLogoAssetById(
	id: string
): Promise<{ id: string; filename: string; mimeType: string; data: Buffer } | null> {
	if (!id) return null;
	const rows = await db
		.select({
			id: logoAssets.id,
			filename: logoAssets.filename,
			mimeType: logoAssets.mimeType,
			data: logoAssets.data
		})
		.from(logoAssets)
		.where(eq(logoAssets.id, id))
		.limit(1);

	return rows?.[0] || null;
}

export function getLogoUrlFromId(id?: string | null): string | null {
	if (!id) return null;
	return buildLogoUrl(id);
}

