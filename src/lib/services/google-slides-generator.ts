/**
 * Google Slides API Integration
 * Generates presentations from templates with minimal code styling
 */

import { google } from 'googleapis';
import { env } from '$lib/env';
import type { BrandData, StepData } from '$lib/types/presentation-agent';

export type Vibe = 'minimalist' | 'funky' | 'maximalist' | 'default';

interface GoogleSlidesConfig {
	clientId: string;
	clientSecret: string;
	refreshToken?: string;
}

interface TemplateConfig {
	minimalist: string;
	funky: string;
	maximalist: string;
	default: string;
	genericDynamic: string; // Generic template for dynamic slides
}

/**
 * Get Google OAuth2 client for Slides API
 */
async function getGoogleAuth(): Promise<any> {
	const clientId = env?.AUTH_GOOGLE_ID || '';
	const clientSecret = env?.AUTH_GOOGLE_SECRET || '';

	if (!clientId || !clientSecret) {
		throw new Error(
			'Google OAuth credentials not configured. Please set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in your .env file. See GOOGLE_SLIDES_SETUP.md for setup instructions.'
		);
	}

	const oauth2Client = new google.auth.OAuth2(
		clientId,
		clientSecret,
		process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback/google'
	);
	
	// Use refresh token if available (for server-side access)
	const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
	if (refreshToken) {
		oauth2Client.setCredentials({ refresh_token: refreshToken });
	} else {
		// If no refresh token, user needs to complete OAuth flow
		// For now, throw helpful error
		throw new Error(
			'Google refresh token not configured. Please set GOOGLE_REFRESH_TOKEN in your .env file. See GOOGLE_SLIDES_SETUP.md for instructions on how to get a refresh token.'
		);
	}

	return oauth2Client;
}

/**
 * Get template IDs from environment variables
 */
function getTemplateIds(): TemplateConfig {
	return {
		minimalist: process.env.GOOGLE_SLIDES_TEMPLATE_MINIMALIST || '',
		funky: process.env.GOOGLE_SLIDES_TEMPLATE_FUNKY || '',
		maximalist: process.env.GOOGLE_SLIDES_TEMPLATE_MAXIMALIST || '',
		default: process.env.GOOGLE_SLIDES_TEMPLATE_DEFAULT || '',
		genericDynamic: process.env.GOOGLE_SLIDES_TEMPLATE_GENERIC_DYNAMIC || ''
	};
}

/**
 * Copy a Google Slides template
 */
async function copyTemplate(templateId: string, newTitle: string): Promise<string> {
	const auth = await getGoogleAuth();
	const drive = google.drive({ version: 'v3', auth });

	try {
		const response = await drive.files.copy({
			fileId: templateId,
			requestBody: {
				name: newTitle
			}
		});

		return response.data.id || '';
	} catch (error: any) {
		console.error('Error copying template:', error);
		throw new Error(`Failed to copy template: ${error.message}`);
	}
}

/**
 * Get all text elements in a slide for placeholder replacement
 */
async function getSlideTextElements(
	slidesAPI: any,
	presentationId: string,
	slideId: string
): Promise<Array<{ objectId: string; text: string }>> {
	try {
		const presentation = await slidesAPI.presentations.get({
			presentationId,
			fields: 'slides'
		});

		const slide = presentation.data.slides?.find((s: any) => s.objectId === slideId);
		if (!slide) return [];

		const textElements: Array<{ objectId: string; text: string }> = [];

		// Recursively find all text elements
		function findTextElements(elements: any[]) {
			for (const element of elements) {
				if (element.shape?.text?.textElements) {
					const fullText = element.shape.text.textElements
						.map((te: any) => te.textRun?.content || '')
						.join('');
					if (fullText.trim()) {
						textElements.push({
							objectId: element.objectId,
							text: fullText
						});
					}
				}
				if (element.elementGroup?.children) {
					findTextElements(element.elementGroup.children);
				}
			}
		}

		if (slide.pageElements) {
			findTextElements(slide.pageElements);
		}

		return textElements;
	} catch (error: any) {
		console.error('Error getting slide text elements:', error);
		return [];
	}
}

/**
 * Replace placeholders in a slide
 */
async function replacePlaceholders(
	slidesAPI: any,
	presentationId: string,
	slideId: string,
	replacements: Record<string, string>
): Promise<void> {
	try {
		// Use simple replaceAllText for each placeholder
		// This is more reliable than trying to find specific text elements
		const requests: any[] = [];
		
		for (const [placeholder, value] of Object.entries(replacements)) {
			if (!value) continue; // Skip empty values
			
			requests.push({
				replaceAllText: {
					containsText: {
						text: placeholder,
						matchCase: false
					},
					replaceText: value || ''
				}
			});
		}

		if (requests.length > 0) {
			await slidesAPI.presentations.batchUpdate({
				presentationId,
				requestBody: {
					requests
				}
			});
		}
	} catch (error: any) {
		console.error('Error replacing placeholders:', error);
		throw error; // Re-throw to handle in calling function
	}
}

/**
 * Duplicate a slide in a presentation
 */
async function duplicateSlide(
	slidesAPI: any,
	presentationId: string,
	slideId: string
): Promise<string> {
	try {
		const response = await slidesAPI.presentations.pages.duplicate({
			presentationId,
			pageObjectId: slideId
		});

		return response.data.objectId || '';
	} catch (error: any) {
		console.error('Error duplicating slide:', error);
		throw new Error(`Failed to duplicate slide: ${error.message}`);
	}
}

/**
 * Format step content for display
 */
function formatStepContent(content: any): string {
	if (typeof content === 'string') {
		return content;
	}

	if (typeof content === 'object') {
		// Handle structured content
		if (content.sections) {
			return content.sections
				.map((section: any) => {
					let text = section.heading ? `**${section.heading}**\n\n` : '';
					if (section.content) {
						text += Array.isArray(section.content)
							? section.content.map((item: string) => `• ${item}`).join('\n')
							: section.content;
					}
					return text;
				})
				.join('\n\n');
		}

		if (content.bulletPoints) {
			return content.bulletPoints.map((point: string) => `• ${point}`).join('\n');
		}

		// Fallback: stringify
		return JSON.stringify(content, null, 2);
	}

	return String(content);
}

/**
 * Extract colors from brand data
 */
function extractColors(brandData: BrandData): {
	color1: string;
	color2: string;
	color3: string;
	primary: string;
	secondary: string;
	accent: string;
} {
	// Try to get from step history
	const colorStep = brandData.stepHistory?.find((s) => s.step === 'color-palette');
	
	if (colorStep?.content) {
		const content = typeof colorStep.content === 'string' 
			? JSON.parse(colorStep.content || '{}')
			: colorStep.content;

		if (content.colors && Array.isArray(content.colors)) {
			return {
				color1: content.colors[0]?.hex || '#000000',
				color2: content.colors[1]?.hex || '#666666',
				color3: content.colors[2]?.hex || '#999999',
				primary: content.colors[0]?.hex || '#000000',
				secondary: content.colors[1]?.hex || '#666666',
				accent: content.colors[2]?.hex || '#999999'
			};
		}
	}

	// Fallback to default colors
	return {
		color1: '#000000',
		color2: '#666666',
		color3: '#999999',
		primary: '#000000',
		secondary: '#666666',
		accent: '#999999'
	};
}

/**
 * Generate Google Slides presentation from brand data
 */
export async function generateGoogleSlidesPresentation(
	brandData: BrandData,
	allSteps: StepData[],
	vibe: Vibe = 'default'
): Promise<{ presentationId: string; url: string }> {
	try {
		const auth = await getGoogleAuth();
		const slidesAPI = google.slides({ version: 'v1', auth });
		const drive = google.drive({ version: 'v3', auth });

		const templateIds = getTemplateIds();
		const templateId = templateIds[vibe] || templateIds.default;

		if (!templateId) {
			throw new Error(
				`Template ID for vibe "${vibe}" not configured. Please set GOOGLE_SLIDES_TEMPLATE_${vibe.toUpperCase()} in your .env file.`
			);
		}

		// 1. Copy base template
		const presentationTitle = `${brandData.brandName || 'Brand'} Guidelines`;
		const presentationId = await copyTemplate(templateId, presentationTitle);

		console.log(`✅ Copied template, presentation ID: ${presentationId}`);

		// 2. Get presentation to find slides
		const presentation = await slidesAPI.presentations.get({
			presentationId,
			fields: 'slides'
		});

		const slides = presentation.data.slides || [];
		if (slides.length === 0) {
			throw new Error('Template has no slides');
		}

		// 3. Extract brand data
		const colors = extractColors(brandData);
		const brandName = brandData.brandName || 'Brand';
		const tagline = brandData.stepHistory?.find((s) => s.step === 'brand-positioning')?.content || '';

		// 4. Process fixed slides (first 5 common steps)
		const fixedSteps = allSteps.slice(0, 5);
		const fixedSlideIndex = 0; // Start from first slide after cover

		for (let i = 0; i < fixedSteps.length && fixedSlideIndex + i < slides.length; i++) {
			const step = fixedSteps[i];
			const slideId = slides[fixedSlideIndex + i].objectId || '';

			// Build replacements based on step type
			const replacements: Record<string, string> = {
				'{{BRAND_NAME}}': brandName,
				'{{COLOR_1}}': colors.color1,
				'{{COLOR_2}}': colors.color2,
				'{{COLOR_3}}': colors.color3,
				'{{PRIMARY_COLOR}}': colors.primary,
				'{{SECONDARY_COLOR}}': colors.secondary,
				'{{ACCENT_COLOR}}': colors.accent
			};

			// Step-specific replacements
			if (step.step === 'brand-positioning') {
				const content = typeof step.content === 'string' 
					? JSON.parse(step.content || '{}')
					: step.content;
				
				replacements['{{MISSION}}'] = content.mission || '';
				replacements['{{VISION}}'] = content.vision || '';
				replacements['{{VALUES}}'] = Array.isArray(content.values)
					? content.values.map((v: string) => `• ${v}`).join('\n')
					: content.values || '';
				replacements['{{TARGET_AUDIENCE}}'] = content.targetAudience || '';
			}

			await replacePlaceholders(slidesAPI, presentationId, slideId, replacements);
		}

		// 5. Process dynamic slides (last 3 industry-specific steps)
		const dynamicSteps = allSteps.slice(-3);
		const genericTemplateId = templateIds.genericDynamic;

		if (genericTemplateId && dynamicSteps.length > 0) {
			// Get or create generic template slide
			// For now, we'll duplicate the last slide as a template
			const lastSlideId = slides[slides.length - 1].objectId || '';

			for (const step of dynamicSteps) {
				// Duplicate generic template slide
				const newSlideId = await duplicateSlide(slidesAPI, presentationId, lastSlideId);

				// Replace placeholders
				const replacements: Record<string, string> = {
					'{{SLIDE_TITLE}}': step.title || 'Content',
					'{{SLIDE_CONTENT}}': formatStepContent(step.content),
					'{{BRAND_NAME}}': brandName
				};

				await replacePlaceholders(slidesAPI, presentationId, newSlideId, replacements);
			}
		} else {
			// Create new slides programmatically if no template
			for (const step of dynamicSteps) {
				await createDynamicSlide(slidesAPI, presentationId, step, brandData, vibe);
			}
		}

		// 6. Get presentation URL
		const url = `https://docs.google.com/presentation/d/${presentationId}/edit`;

		return { presentationId, url };
	} catch (error: any) {
		console.error('Error generating Google Slides:', error);
		throw new Error(`Failed to generate Google Slides: ${error.message}`);
	}
}

/**
 * Create a dynamic slide programmatically
 */
async function createDynamicSlide(
	slidesAPI: any,
	presentationId: string,
	step: StepData,
	brandData: BrandData,
	vibe: Vibe
): Promise<void> {
	try {
		// Create new slide
		const createResponse = await slidesAPI.presentations.pages.create({
			presentationId,
			requestBody: {
				pageElements: []
			}
		});

		const slideId = createResponse.data.objectId || '';

		// Add title
		await slidesAPI.presentations.batchUpdate({
			presentationId,
			requestBody: {
				requests: [
					{
						createShape: {
							objectId: 'title_' + Date.now(),
							shapeType: 'TEXT_BOX',
							elementProperties: {
								pageObjectId: slideId,
								size: {
									width: { magnitude: 9, unit: 'PT' },
									height: { magnitude: 1, unit: 'PT' }
								},
								transform: {
									scaleX: 1,
									scaleY: 1,
									translateX: 36,
									translateY: 36,
									unit: 'PT'
								}
							}
						}
					},
					{
						insertText: {
							objectId: 'title_' + Date.now(),
							text: step.title || 'Content'
						}
					}
				]
			}
		});

		// Add content
		const content = formatStepContent(step.content);
		await slidesAPI.presentations.batchUpdate({
			presentationId,
			requestBody: {
				requests: [
					{
						createShape: {
							objectId: 'content_' + Date.now(),
							shapeType: 'TEXT_BOX',
							elementProperties: {
								pageObjectId: slideId,
								size: {
									width: { magnitude: 9, unit: 'PT' },
									height: { magnitude: 4, unit: 'PT' }
								},
								transform: {
									scaleX: 1,
									scaleY: 1,
									translateX: 36,
									translateY: 108,
									unit: 'PT'
								}
							}
						}
					},
					{
						insertText: {
							objectId: 'content_' + Date.now(),
							text: content
						}
					}
				]
			}
		});
	} catch (error: any) {
		console.error('Error creating dynamic slide:', error);
		// Don't throw - continue with other slides
	}
}

/**
 * Export Google Slides presentation as PPTX
 */
export async function exportGoogleSlidesToPptx(presentationId: string): Promise<Buffer> {
	try {
		const auth = await getGoogleAuth();
		const drive = google.drive({ version: 'v3', auth });

		const response = await drive.files.export(
			{
				fileId: presentationId,
				mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
			},
			{ responseType: 'arraybuffer' }
		);

		return Buffer.from(response.data as ArrayBuffer);
	} catch (error: any) {
		console.error('Error exporting to PPTX:', error);
		throw new Error(`Failed to export to PPTX: ${error.message}`);
	}
}

