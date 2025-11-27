import type { RequestHandler } from './$types';
import { getLogoAssetById } from '$lib/server/logo-storage';

export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;
	if (!id) {
		return new Response('Logo ID is required', { status: 400 });
	}

	const asset = await getLogoAssetById(id);
	if (!asset) {
		return new Response('Logo not found', { status: 404 });
	}

	return new Response(asset.data, {
		headers: {
			'Content-Type': asset.mimeType,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Content-Disposition': `inline; filename="${encodeURIComponent(asset.filename)}"`
		}
	});
};

