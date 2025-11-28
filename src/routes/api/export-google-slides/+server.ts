import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateGoogleSlidesPresentation, exportGoogleSlidesToPptx } from '$lib/services/google-slides-generator';
import type { BrandData, StepData } from '$lib/types/presentation-agent';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const body = await request.json();
		const {
			brandData,
			allSteps,
			vibe = 'default',
			exportAsPptx = false
		}: {
			brandData: BrandData;
			allSteps: StepData[];
			vibe?: 'minimalist' | 'funky' | 'maximalist' | 'default';
			exportAsPptx?: boolean;
		} = body;

		if (!brandData || !allSteps || allSteps.length === 0) {
			return json({ error: 'Missing required data: brandData and allSteps' }, { status: 400 });
		}

		console.log('📊 Generating Google Slides presentation...', {
			brandName: brandData.brandName,
			vibe,
			totalSteps: allSteps.length,
			fixedSteps: allSteps.slice(0, 5).length,
			dynamicSteps: allSteps.slice(-3).length
		});

		// Generate presentation
		const result = await generateGoogleSlidesPresentation(brandData, allSteps, vibe);

		// If export as PPTX requested, return file
		if (exportAsPptx) {
			const pptxBuffer = await exportGoogleSlidesToPptx(result.presentationId);

			return new Response(pptxBuffer, {
				headers: {
					'Content-Type':
						'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'Content-Disposition': `attachment; filename="${brandData.brandName || 'Brand'}-Guidelines.pptx"`
				}
			});
		}

		// Return presentation link
		return json({
			success: true,
			presentationId: result.presentationId,
			url: result.url,
			message: 'Google Slides presentation created successfully'
		});
	} catch (error: any) {
		console.error('Error in Google Slides export:', error);
		return json(
			{
				error: 'Failed to generate Google Slides presentation',
				details: error.message
			},
			{ status: 500 }
		);
	}
};

