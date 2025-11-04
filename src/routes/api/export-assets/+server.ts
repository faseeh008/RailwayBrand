import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { AssetsGenerator } from '$lib/services/assets-generator';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const formData = await request.formData();
		const guidelineId = formData.get('guidelineId') as string;

		if (!guidelineId) {
			return json({ error: 'Guideline ID is required' }, { status: 400 });
		}

		// Fetch the brand guidelines from database
		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(eq(brandGuidelines.id, guidelineId))
			.limit(1);

		if (guideline.length === 0) {
			return json({ error: 'Brand guidelines not found' }, { status: 404 });
		}

		// Check if user owns this guideline
		if (guideline[0].userId !== session.user.id) {
			return json({ error: 'Unauthorized access' }, { status: 403 });
		}

		// Parse structured data
		let brandGuidelinesSpec;
		try {
			brandGuidelinesSpec = JSON.parse(guideline[0].structuredData || '{}');
		} catch (error) {
			return json({ error: 'Invalid brand guidelines data' }, { status: 400 });
		}

		// Parse logo files
		let logoFiles: Array<{ filename: string; fileData: string; usageTag: string }> = [];
		try {
			if (guideline[0].logoFiles) {
				const parsedLogoFiles = JSON.parse(guideline[0].logoFiles);
				logoFiles = parsedLogoFiles.map((logo: any) => ({
					filename: logo.filename,
					fileData: logo.fileData || logo.filePath, // Support both new (fileData) and old (filePath) formats
					usageTag: logo.usageTag
				}));
			}
		} catch (error) {
			console.warn('Failed to parse logo files:', error);
		}

		// Generate assets ZIP
		const assetsGenerator = new AssetsGenerator({
			brandGuidelines: brandGuidelinesSpec,
			logoFiles: logoFiles
		});

		const zipBuffer = await assetsGenerator.generateAssetsZip();

		// Return the ZIP file
		return new Response(zipBuffer, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${brandGuidelinesSpec.brand_name}_assets.zip"`,
				'Content-Length': zipBuffer.length.toString()
			}
		});
	} catch (error) {
		console.error('Error generating assets ZIP:', error);
		return json(
			{
				error: 'Failed to generate assets ZIP'
			},
			{ status: 500 }
		);
	}
};
