import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFromNewTemplate } from '$lib/services/pptx-new-template';
import { generateProgressivePptx } from '$lib/services/pptx-generator';
import fs from 'fs/promises';
import path from 'path';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { brandData, useTemplate = true } = body;

		// console.log('PPTX Export request received:', {
		// 	brandName: brandData.brandName,
		// 	useTemplate,
		// 	hasStepHistory: !!brandData.stepHistory,
		// 	stepCount: brandData.stepHistory?.length || 0
		// });

		let pptxBuffer: Buffer;

		// Load the NEW layout template with proper content bindings
		const templatePath = path.join(process.cwd(), 'beige-template-layout.json');
		
		try {
			const templateContent = await fs.readFile(templatePath, 'utf-8');
			const template = JSON.parse(templateContent);
			
			// console.log('✓ Template loaded:', template.slide_templates?.length, 'slide templates');
			// console.log('✓ Brand data:', {
			// 	name: brandData.brandName,
			// 	steps: brandData.stepHistory?.length,
			// 	logos: brandData.logoFiles?.length
			// });

			// Generate PPTX using NEW template structure
			pptxBuffer = await generateFromNewTemplate(brandData, template);
			
			// console.log('✓ PPTX generated:', (pptxBuffer.length / 1024).toFixed(2), 'KB');
		} catch (templateError: any) {
			// console.error('✗ Template error:', templateError.message);
			// console.error(templateError.stack);
			
			// Fallback to simple generation
			// console.log('→ Using fallback generator...');
			pptxBuffer = await generateProgressivePptx(brandData);
		}

		// Return PPTX file
		return new Response(pptxBuffer as any, {
			status: 200,
			headers: {
				'Content-Type':
					'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'Content-Disposition': `attachment; filename="${brandData.brandName || 'brand'}-guidelines.pptx"`,
				'Content-Length': pptxBuffer.length.toString()
			}
		});
	} catch (error: any) {
		console.error('Error generating PPTX:', error);
		return json(
			{
				error: 'Failed to generate PowerPoint presentation',
				details: error.message,
				stack: error.stack
			},
			{ status: 500 }
		);
	}
};

