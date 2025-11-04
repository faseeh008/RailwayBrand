import { fail } from '@sveltejs/kit';
import { generateBrandGuidelines, type BrandGuidelineRequest } from '$lib/services/gemini';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { handle } from '$lib/auth';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	generate: async ({ request, locals }) => {
		try {
			// Get the current session
			const session = await locals.auth();
			if (!session?.user?.id) {
				return fail(401, {
					error: 'Authentication required',
					success: false
				});
			}

			const formData = await request.formData();

			const brandName = formData.get('brandName') as string;
			const brandValues = formData.get('brandValues') as string;
			const industry = formData.get('industry') as string; // This will be brandDomain from frontend
			const mood = formData.get('mood') as string;
			const audience = formData.get('audience') as string;
			const customPrompt = formData.get('customPrompt') as string;
			const logoPath = formData.get('logoPath') as string;

			// Validate required fields
			if (!brandName || brandName.trim() === '') {
				return fail(400, {
					error: 'Brand name is required',
					success: false
				});
			}

			if (!industry || industry.trim() === '') {
				return fail(400, {
					error: 'Brand domain selection is required for comprehensive guidelines',
					success: false
				});
			}

			// Prepare request for Gemini API
			const brandRequest: BrandGuidelineRequest = {
				brandName: brandName.trim(),
				brandValues: brandValues?.trim() || undefined,
				industry: industry?.trim() || undefined,
				mood: mood?.trim() || undefined,
				audience: audience?.trim() || undefined,
				customPrompt: customPrompt?.trim() || undefined,
				logoPath: logoPath?.trim() || undefined
			};

			// Debug: Log logo path
			console.log('Logo path being sent to AI:', logoPath);

			// Generate brand guidelines using Gemini AI
			const generatedGuidelines = await generateBrandGuidelines(brandRequest);

			// Save to database
			const savedGuidelines = await db
				.insert(brandGuidelines)
				.values({
					userId: session.user.id,
					brandName: generatedGuidelines.brandName,
					content: generatedGuidelines.content,
					brandValues: brandValues?.trim() || null,
					industry: industry?.trim() || null,
					mood: mood?.trim() || null,
					audience: audience?.trim() || null,
					customPrompt: customPrompt?.trim() || null,
					logoPath: logoPath
				})
				.returning();

			return {
				success: true,
				brandGuidelines: generatedGuidelines,
				savedGuidelines: savedGuidelines[0],
				message: 'Brand guidelines generated and saved successfully!'
			};
		} catch (error) {
			console.error('Error generating brand guidelines:', error);

			// More detailed error handling
			let errorMessage = 'Failed to generate brand guidelines';
			if (error instanceof Error) {
				errorMessage = error.message;
				// Check for specific API errors
				if (error.message.includes('API key')) {
					errorMessage =
						'Google Gemini API key is not configured properly. Please check your environment variables.';
				} else if (error.message.includes('quota')) {
					errorMessage = 'API quota exceeded. Please try again later.';
				} else if (error.message.includes('network')) {
					errorMessage = 'Network error. Please check your internet connection and try again.';
				}
			}

			return fail(500, {
				error: errorMessage,
				success: false
			});
		}
	}
};
