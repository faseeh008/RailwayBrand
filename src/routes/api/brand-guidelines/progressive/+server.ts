import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { generateProgressiveBrandGuidelines } from '$lib/services/gemini';
import { 
	extractColorsFromLogo, 
	convertExtractedColorsToProgressiveFormat
} from '$lib/services/color-extraction';
import {
	GENERATION_STEPS,
	type GenerationStep,
	type ProgressiveGenerationRequest,
	getNextStep,
	getProgress
} from '$lib/utils/progressive-generation';
import type { RequestHandler } from './$types';
import type { BrandGuidelinesInput } from '$lib/types/brand-guidelines';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			console.error('Authentication failed: No session or user ID');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		console.log('Progressive API called by user:', session.user.id);

		const body = await request.json();
		console.log('Request body received:', {
			step: body.step,
			userApproval: body.userApproval,
			hasStepHistory: !!body.stepHistory,
			stepHistoryLength: body.stepHistory?.length || 0
		});

		const { step, previousSteps, userApproval, feedback, stepHistory } =
			body as ProgressiveGenerationRequest & {
				stepHistory?: Array<{ step: string; content: string; approved: boolean }>;
			};

		// Validate step
		const validSteps = [...GENERATION_STEPS, 'final-review'] as const;
		if (!validSteps.includes(step as any)) {
			console.error('Invalid step provided:', step);
			return json(
				{
					error: 'Invalid generation step'
				},
				{ status: 400 }
			);
		}

		// For final review with step history, build complete guidelines from accumulated content
		if (step === 'final-review' && userApproval && stepHistory) {
			console.log(
				'Processing final review with step history, steps:',
				stepHistory.map((s) => s.step)
			);
			// Build complete brand guidelines from step history
			const completeGuidelines = {
				brand_name: previousSteps.brand_name || 'Your Brand',
				brand_domain: previousSteps.brand_domain || 'General Business',
				short_description: previousSteps.short_description || '',
				positioning_statement: '',
				vision: '',
				mission: '',
				values: [],
				target_audience: '',
				differentiation: '',
				voice_and_tone: {
					adjectives: [],
					guidelines: '',
					sample_lines: []
				},
				brand_personality: {
					identity: '',
					language: '',
					voice: '',
					characteristics: [],
					motivation: '',
					fear: ''
				},
				logo: {
					primary: '',
					variants: [],
					color_versions: [],
					clear_space_method: '',
					minimum_sizes: [],
					correct_usage: [],
					incorrect_usage: []
				},
				colors: {
					core_palette: [],
					secondary_palette: []
				},
				typography: {
					primary: {
						name: '',
						weights: [],
						usage: '',
						fallback_suggestions: [],
						web_link: ''
					},
					supporting: {
						name: '',
						weights: [],
						usage: '',
						fallback_suggestions: [],
						web_link: ''
					},
					secondary: []
				},
				iconography: {
					style: '',
					grid: '',
					stroke: '',
					color_usage: '',
					specific_icons: [],
					notes: ''
				},
				patterns_gradients: [],
				photography: {
					mood: [],
					guidelines: '',
					examples: []
				},
				applications: [],
				dos_and_donts: [],
				legal_contact: {
					contact_name: '',
					title: '',
					email: '',
					company: '',
					address: '',
					website: ''
				},
				export_files: {
					pptx: '',
					assets_zip: '',
					json: ''
				},
				created_at: new Date().toISOString(),
				version: '1.0'
			};

			console.log('Saving guidelines to database...');
			const savedGuidelines = await db
				.insert(brandGuidelines)
				.values({
					userId: session.user.id,
					brandName: completeGuidelines.brand_name,
					content: JSON.stringify(completeGuidelines),
					structuredData: JSON.stringify(completeGuidelines),
					brandDomain: completeGuidelines.brand_domain,
					shortDescription: completeGuidelines.short_description
					// Add other fields as needed
				})
				.returning();

			console.log('Guidelines saved successfully:', savedGuidelines[0]?.id);

			const response = {
				success: true,
				step: 'completed',
				brandGuidelines: completeGuidelines,
				savedGuidelines: savedGuidelines[0],
				message: 'Brand guidelines generated and saved successfully!'
			};

			console.log('Returning response:', {
				success: response.success,
				hasGuidelines: !!response.brandGuidelines
			});
			return json(response);
		}

		// Extract colors and typography from logo if available and needed
		let extractedColors = '';
		let extractedTypography = '';
		
		if (previousSteps?.logo_files && previousSteps.logo_files.length > 0) {
			const logoFile = previousSteps.logo_files[0];
			console.log('Processing logo file:', { filename: logoFile.filename, hasFileData: !!logoFile.fileData, hasFilePath: !!logoFile.filePath });
			
			try {
				// For color-palette step, extract colors from logo using microservice ONLY
				if (step === 'color-palette') {
					console.log('Attempting color extraction for step:', step);
					
					// Check if we have base64 data or file path
					if (logoFile.fileData) {
						console.log('Using base64 data for color extraction');
						// Convert base64 data URL to File object
						const base64Data = logoFile.fileData.split(',')[1];
						const binaryData = Buffer.from(base64Data, 'base64');
						const logoFileObj = new File([binaryData], logoFile.filename, { type: 'image/png' });
						
						const colorResult = await extractColorsFromLogo(logoFileObj);
						console.log('Color extraction result:', { success: colorResult.success, hasColors: !!colorResult.brand_color_system });
						
						if (colorResult.success) {
							extractedColors = convertExtractedColorsToProgressiveFormat(colorResult.brand_color_system);
							console.log('Extracted colors formatted for progressive generation');
						} else {
							console.error('Color extraction failed - no fallback available');
							return json({
								error: 'Color extraction failed. Please ensure your logo file is valid and try again.',
								details: 'The color extraction microservice could not process your logo file.'
							}, { status: 400 });
						}
					} else if (logoFile.filePath) {
						console.log('Using file path for color extraction');
						// Try to fetch from file path
						const logoPath = `uploads/logos/${logoFile.filename}`;
						const response = await fetch(`http://localhost:5173/${logoPath}`);
						if (response.ok) {
							const logoBlob = await response.blob();
							const logoFileObj = new File([logoBlob], logoFile.filename, { type: logoBlob.type });
							
							const colorResult = await extractColorsFromLogo(logoFileObj);
							if (colorResult.success) {
								extractedColors = convertExtractedColorsToProgressiveFormat(colorResult.brand_color_system);
							} else {
								console.error('Color extraction failed - no fallback available');
								return json({
									error: 'Color extraction failed. Please ensure your logo file is valid and try again.',
									details: 'The color extraction microservice could not process your logo file.'
								}, { status: 400 });
							}
						} else {
							console.error('Could not fetch logo file from path');
							return json({
								error: 'Logo file not found. Please upload your logo again.',
								details: 'The logo file could not be located for color extraction.'
							}, { status: 400 });
						}
					} else {
						console.error('No logo file data available for color extraction');
						return json({
							error: 'No logo file available for color extraction. Please upload your logo first.',
							details: 'Logo file data is required for color palette generation.'
						}, { status: 400 });
					}
				}
				
				// Typography step: AI will generate fonts based on user requirements (brand domain, mood, description, audience)
				// We do NOT extract fonts from logo - let AI generate appropriate fonts using Gemini API
				if (step === 'typography') {
					console.log('Typography step: AI will generate fonts based on user requirements, not from logo');
					// Intentionally skip typography extraction from logo
					// extractedTypography will remain empty, allowing AI to generate fonts freely
				}
			} catch (error) {
				console.error('Failed to extract colors/typography from logo:', error);
				if (step === 'color-palette') {
					return json({
						error: 'Color extraction failed due to a technical error. Please try again.',
						details: error instanceof Error ? error.message : 'Unknown error'
					}, { status: 500 });
				}
				// For typography, continue without extracted data if extraction fails
			}
		} else {
			console.log('No logo files found in previousSteps:', previousSteps?.logo_files);
			if (step === 'color-palette') {
				return json({
					error: 'No logo file available for color extraction. Please upload your logo first.',
					details: 'Logo file is required for color palette generation.'
				}, { status: 400 });
			}
		}

		// Generate content for the current step (non-final-review steps)
		const stepResult = await generateProgressiveBrandGuidelines({
			step,
			previousSteps: previousSteps || {},
			userApproval,
			feedback,
			extractedColors,
			extractedTypography
		});

		console.log('Step result from generateProgressiveBrandGuidelines:', {
			step,
			hasContent: !!stepResult.content,
			contentType: typeof stepResult.content,
			contentPreview: typeof stepResult.content === 'string' ? stepResult.content.substring(0, 200) : stepResult.content,
			hasExtractedColors: !!extractedColors,
			hasExtractedTypography: !!extractedTypography
		});

		const response = {
			success: true,
			step,
			content: stepResult.content,
			nextStep: step !== 'final-review' ? getNextStep(step as GenerationStep) : null,
			progress: step !== 'final-review' ? getProgress(step as GenerationStep) : 100,
			requiresApproval: true,
			message: stepResult.message
		};

		console.log('Returning response for step:', step, {
			success: response.success,
			hasContent: !!response.content,
			contentType: typeof response.content,
			contentLength: typeof response.content === 'string' ? response.content.length : 'N/A'
		});

		return json(response);
	} catch (error) {
		console.error('Error in progressive generation:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;
		const errorName = error instanceof Error ? error.name : 'Unknown';
		
		console.error('Error details:', {
			message: errorMessage,
			stack: errorStack,
			name: errorName
		});
		return json(
			{
				error: `Failed to generate brand guidelines step: ${errorMessage}`,
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};
