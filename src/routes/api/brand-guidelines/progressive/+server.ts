import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { generateProgressiveBrandGuidelines } from '$lib/services/gemini';
import { generateEnhancedProgressiveStep } from '$lib/services/enhanced-progressive-generator';
import { 
	extractColorsFromLogo, 
	convertExtractedColorsToProgressiveFormat
} from '$lib/services/color-extraction';
import { generateProfessionalIcon } from '$lib/services/icon-generator-service';
import { performGroundingSearch } from '$lib/services/grounding-search';
import {
	COMMON_GENERATION_STEPS,
	type GenerationStep,
	type ProgressiveGenerationRequest,
	getNextStep,
	getProgress,
	getAllStepsForIndustry
} from '$lib/utils/progressive-generation';
import type { RequestHandler } from './$types';
import type { BrandGuidelinesInput } from '$lib/types/brand-guidelines';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
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

		// Extract industry for dynamic step validation
		const industry = previousSteps?.brand_domain || previousSteps?.industry || '';
		const industrySpecificInfo: Record<string, any> = {};
		if (previousSteps) {
			const standardFields = ['brand_name', 'brandName', 'brand_domain', 'industry', 'short_description', 'description', 'selectedMood', 'style', 'selectedAudience', 'audience', 'brandValues', 'values', 'customPrompt', 'logo_files', 'contact'];
			Object.keys(previousSteps).forEach(key => {
				if (!standardFields.includes(key) && previousSteps[key] !== undefined && previousSteps[key] !== null) {
					industrySpecificInfo[key] = previousSteps[key];
				}
			});
		}

		// Validate step - be lenient for industry-specific steps
		// Since Gemini is non-deterministic, the client and server might generate different step IDs
		// So we accept any step that is either:
		// 1. One of the common 5 steps, OR
		// 2. An industry-specific step (not in common steps)
		const isCommonStep = COMMON_GENERATION_STEPS.includes(step as any);
		const isValidStep = isCommonStep || (industry && step && typeof step === 'string' && step.trim() !== '');
		
		if (!isValidStep) {
			console.error('[progressive API] Invalid step provided:', step);
			console.error('[progressive API] Industry:', industry);
			return json(
				{
					error: 'Invalid generation step',
					details: `Step "${step}" is not valid. Must be one of the common steps or a valid industry-specific step.`,
				},
				{ status: 400 }
			);
		}
		
		// Log validation (but don't reject industry-specific steps)
		if (!isCommonStep) {
			console.log('[progressive API] Accepting industry-specific step:', step, 'for industry:', industry);
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
					
					let logoFileObj: File;
					let savedFilePath: string | null = null;
					
					// If we have base64 data but no file path, save it to filesystem first
					if (logoFile.fileData && !logoFile.filePath) {
						console.log('Saving logo to filesystem first for color extraction');
						
						try {
							// Create uploads directory if it doesn't exist
							const uploadsDir = join(process.cwd(), 'static', 'uploads', 'logos');
							if (!existsSync(uploadsDir)) {
								await mkdir(uploadsDir, { recursive: true });
							}
							
							// Determine file extension and MIME type
							const isSvg = logoFile.fileData.includes('data:image/svg+xml') || logoFile.filename.endsWith('.svg');
							const mimeType = isSvg ? 'image/svg+xml' : (logoFile.fileData.match(/data:([^;]+)/)?.[1] || 'image/png');
							const extension = isSvg ? '.svg' : (logoFile.filename.match(/\.\w+$/) || ['.png'])[0];
							
							// Generate unique filename
							const timestamp = Date.now();
							const sanitizedName = logoFile.filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '');
							const filename = `${timestamp}-${sanitizedName}${extension}`;
							savedFilePath = join(uploadsDir, filename);
							
							// Extract base64 data
							const base64Data = logoFile.fileData.includes(',') 
								? logoFile.fileData.split(',')[1] 
								: logoFile.fileData;
							
							// Decode and save to file
							const binaryData = Buffer.from(base64Data, 'base64');
							await writeFile(savedFilePath, binaryData);
							
							console.log('Logo saved to:', savedFilePath);
							
							// Read the saved file and create File object
							const fileBuffer = readFileSync(savedFilePath);
							logoFileObj = new File([fileBuffer], filename, { type: mimeType });
							
							// Update logoFile to include the saved path
							logoFile.filePath = `/uploads/logos/${filename}`;
						} catch (saveError) {
							console.error('Failed to save logo to filesystem:', saveError);
							// Fall back to creating File from base64
							const base64Data = logoFile.fileData.includes(',') 
								? logoFile.fileData.split(',')[1] 
								: logoFile.fileData;
							const binaryData = Buffer.from(base64Data, 'base64');
							const mimeType = logoFile.fileData.match(/data:([^;]+)/)?.[1] || 'image/png';
							logoFileObj = new File([binaryData], logoFile.filename, { type: mimeType });
						}
					} else if (logoFile.filePath) {
						console.log('Using existing file path for color extraction');
						// Read from filesystem
						const logoPath = join(process.cwd(), 'static', logoFile.filePath);
						
						if (existsSync(logoPath)) {
							const fileBuffer = readFileSync(logoPath);
							const mimeType = logoFile.filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
							logoFileObj = new File([fileBuffer], logoFile.filename, { type: mimeType });
						} else {
							// Try to fetch from URL
							const response = await fetch(`http://localhost:5173${logoFile.filePath}`);
							if (response.ok) {
								const logoBlob = await response.blob();
								logoFileObj = new File([logoBlob], logoFile.filename, { type: logoBlob.type });
							} else {
								throw new Error('Logo file not found at path: ' + logoFile.filePath);
							}
						}
					} else {
						throw new Error('No logo file data available for color extraction');
					}
					
					// Now extract colors using the File object
					console.log('Extracting colors from logo file:', { filename: logoFileObj.name, type: logoFileObj.type, size: logoFileObj.size });
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

		// Extract fields from previousSteps for enhanced generation
		// Map brand_domain to industry, selectedMood to style, etc.
		// Note: industry and industrySpecificInfo already extracted above for step validation
		const brandName = previousSteps?.brand_name || previousSteps?.brandName || '';
		const style = previousSteps?.selectedMood || previousSteps?.style || '';
		const audience = previousSteps?.selectedAudience || previousSteps?.audience || '';
		const description = previousSteps?.short_description || previousSteps?.description || '';
		const values = previousSteps?.brandValues || previousSteps?.values || '';
		
		// Perform grounding search if this is the first step (brand-positioning) and we have industry
		// Also check if grounding data already exists in previousSteps (cached)
		let groundingData = (previousSteps as any)?.groundingData;
		
		if (step === 'brand-positioning' && industry && !groundingData) {
			console.log('🔍 Starting grounding search for industry:', industry);
			try {
				const groundingResult = await performGroundingSearch(industry);
				groundingData = {
					summary: groundingResult.summary,
					keyFindings: groundingResult.keyFindings,
					websites: groundingResult.websites.map(w => ({
						url: w.url,
						title: w.title,
						extractedFacts: w.extractedFacts
					}))
				};
				console.log('✅ Grounding search completed:', {
					websitesAnalyzed: groundingData.websites.length,
					keyFindings: groundingData.keyFindings.length
				});
			} catch (error) {
				console.error('⚠️ Grounding search failed, continuing without it:', error);
				// Continue without grounding data if search fails
				groundingData = undefined;
			}
		}
		
		// Use enhanced progressive generator if we have the required fields
		let stepResult;
		if (brandName && industry && style) {
			console.log('Using enhanced progressive generator with:', {
				brandName,
				industry,
				style,
				audience,
				hasIndustrySpecificInfo: Object.keys(industrySpecificInfo).length > 0,
				hasGroundingData: !!groundingData
			});
			
			// Include stepHistory in previousSteps so industry-specific steps can reference previous common steps
			const previousStepsWithHistory = {
				...(previousSteps || {}),
				stepHistory: stepHistory || []
			};
			
			stepResult = await generateEnhancedProgressiveStep({
				step,
				brandName,
				industry,
				style,
				audience: audience || undefined,
				description: description || undefined,
				values: values || undefined,
				industrySpecificInfo: Object.keys(industrySpecificInfo).length > 0 ? industrySpecificInfo : undefined,
				previousSteps: previousStepsWithHistory,
				feedback: feedback || undefined,
				extractedColors: extractedColors || undefined,
				extractedTypography: extractedTypography || undefined,
				groundingData: groundingData
			});
		} else {
			// Fallback to old generator if required fields are missing
			console.log('Using legacy progressive generator (missing required fields)');
			stepResult = await generateProgressiveBrandGuidelines({
				step,
				previousSteps: previousSteps || {},
				userApproval,
				feedback,
				extractedColors,
				extractedTypography,
				groundingData: groundingData
			});
		}

		if (step === 'iconography') {
			try {
				stepResult.content = await enhanceIconographyContent(stepResult.content);
			} catch (error) {
				console.error('Failed to enhance iconography content:', error);
			}
		}

		console.log('Step result:', {
			step,
			hasContent: !!stepResult.content,
			contentType: typeof stepResult.content,
			contentPreview: typeof stepResult.content === 'string' ? stepResult.content.substring(0, 200) : stepResult.content,
			hasExtractedColors: !!extractedColors,
			hasExtractedTypography: !!extractedTypography
		});

		// Get next step and progress dynamically based on industry
		// Note: For industry-specific steps, we don't need to regenerate steps
		// The client has already determined the steps, so we just calculate next/progress
		// If it's a common step, we can use the utility functions
		// If it's an industry-specific step, we return null for nextStep (client will handle progression)
		let nextStep: string | null = null;
		let progress = 0;
		
		if (COMMON_GENERATION_STEPS.includes(step as any)) {
			// For common steps, use the utility functions
			nextStep = await getNextStep(step, industry, Object.keys(industrySpecificInfo).length > 0 ? industrySpecificInfo : undefined, fetch);
			progress = await getProgress(step, industry, Object.keys(industrySpecificInfo).length > 0 ? industrySpecificInfo : undefined, fetch);
		} else {
			// For industry-specific steps, we can't reliably determine the next step
			// because Gemini is non-deterministic. The client will handle progression.
			// Just return a progress estimate (assuming we're past the common 5 steps)
			const commonStepsCount = COMMON_GENERATION_STEPS.length;
			// Estimate: if this is an industry step, we're at least past the common steps
			// Use a conservative estimate (e.g., 60% if we're on first industry step)
			progress = Math.min(95, Math.round(((commonStepsCount + 1) / (commonStepsCount + 3)) * 100));
			console.log('[progressive API] Industry-specific step, using estimated progress:', progress);
		}

async function enhanceIconographyContent(content: any) {
	if (!content) return content;

	// If already structured with icons, enrich SVGs if missing
	if (typeof content === 'object' && Array.isArray(content.icons)) {
		const enrichedIcons = await Promise.all(
			content.icons.map(async (icon: any) => {
				if (icon?.svg) return icon;
				if (!icon?.name) return icon;
				try {
					const svg = await generateProfessionalIcon(icon.name, 96, '#111827', 2, 'outline');
					return { ...icon, svg };
				} catch {
					return icon;
				}
			})
		);
		return { ...content, icons: enrichedIcons };
	}

	if (typeof content !== 'string') return content;

	const iconEntries = extractIconEntries(content).slice(0, 6);
	if (iconEntries.length === 0) return content;

	const iconsWithSvg = await Promise.all(
		iconEntries.map(async (icon) => {
			try {
				const svg = await generateProfessionalIcon(icon.name, 96, '#111827', 2, 'outline');
				return { ...icon, svg };
			} catch (error) {
				console.warn('Icon SVG generation failed for', icon.name, error);
				return icon;
			}
		})
	);

	return {
		rawText: content,
		icons: iconsWithSvg
	};
}

function extractIconEntries(text: string): Array<{ name: string; description?: string }> {
	if (!text) return [];
	const lines = text.split('\n');
	const separators = [' — ', ' – ', ' - ', ': ', ' | '];
	const seen = new Set<string>();
	const icons: Array<{ name: string; description?: string }> = [];

	for (const rawLine of lines) {
		let line = rawLine.trim();
		if (!line) continue;
		line = line.replace(/^[\s\-\•\*]+/, '').replace(/^[^A-Za-z0-9]+/, '').trim();
		if (!line) continue;

		let name = line;
		let description: string | undefined;

		for (const sep of separators) {
			const idx = line.indexOf(sep);
			if (idx > 0) {
				name = line.substring(0, idx).trim();
				description = line.substring(idx + sep.length).trim();
				break;
			}
		}

		name = name.replace(/^[^A-Za-z0-9]+/, '').trim();
		if (!name || name.length < 2) continue;
		if (seen.has(name.toLowerCase())) continue;
		seen.add(name.toLowerCase());

		icons.push({
			name,
			description: description && description.length > 2 ? description : undefined
		});
	}

	return icons;
}

		const response = {
			success: true,
			step,
			content: stepResult.content,
			nextStep,
			progress,
			requiresApproval: true,
			message: stepResult.message,
			// Include grounding data in response so client can cache it for subsequent steps
			groundingData: groundingData
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
