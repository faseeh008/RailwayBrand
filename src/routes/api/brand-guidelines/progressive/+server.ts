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
import { svgToPngNode } from '$lib/utils/svg-to-png';
import { loadLogoBuffer } from '$lib/server/logo-file-utils';

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

		const { step, previousSteps, userApproval, feedback, stepHistory, extractedColors: bodyExtractedColors, extractedTypography: bodyExtractedTypography } =
			body as ProgressiveGenerationRequest & {
				stepHistory?: Array<{ step: string; content: string; approved: boolean }>;
				extractedColors?: any;
				extractedTypography?: any;
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

		// Extract colors and typography from user prompt if provided in body
		// Otherwise, extract from logo if available
		let extractedColors = '';
		let extractedTypography = '';
		let rawExtractedColorSystem: any = null; // Store raw color system object for color generation
		
		// First, check if colors/typography were extracted from user prompt
		// (bodyExtractedColors and bodyExtractedTypography are already declared in destructuring above)
		if (bodyExtractedColors) {
			extractedColors = typeof bodyExtractedColors === 'string' ? bodyExtractedColors : JSON.stringify(bodyExtractedColors);
			console.log('[progressive API] Using colors extracted from user prompt:', extractedColors.substring(0, 100));
		}
		if (bodyExtractedTypography) {
			extractedTypography = typeof bodyExtractedTypography === 'string' ? bodyExtractedTypography : JSON.stringify(bodyExtractedTypography);
			console.log('[progressive API] Using typography extracted from user prompt:', extractedTypography.substring(0, 100));
		}
		
		// Second, check if we have generatedColors from AI-generated logo (stored in logo_files)
		// This takes priority over extracting from logo file because these are the exact colors used in logo
		if (!extractedColors && previousSteps?.logo_files && previousSteps.logo_files.length > 0) {
			const logoFile = previousSteps.logo_files[0];
			if ((logoFile as any).generatedColors) {
				const generatedColors = (logoFile as any).generatedColors;
				extractedColors = typeof generatedColors === 'string' ? generatedColors : JSON.stringify(generatedColors);
				console.log('[progressive API] Using stored generatedColors from AI-generated logo:', extractedColors.substring(0, 100));
			}
		}
		
		// Third, if not provided in body or from generatedColors, try to extract from uploaded logo file
		if (!extractedColors && !extractedTypography && previousSteps?.logo_files && previousSteps.logo_files.length > 0) {
			const logoFile = previousSteps.logo_files[0];
			console.log('Processing logo file:', { filename: logoFile.filename, hasFileData: !!logoFile.fileData, hasFilePath: !!logoFile.filePath });
			
			try {
				// For color-palette step, extract colors from logo using microservice ONLY
				if (step === 'color-palette') {
					console.log('Attempting color extraction for step:', step);
					
					let logoFileObj: File;
					let savedFilePath: string | null = null;

					const loadedLogo = await loadLogoBuffer(logoFile);
					if (loadedLogo) {
						// Convert Buffer to Uint8Array for File constructor compatibility
						const uint8Array = new Uint8Array(loadedLogo.buffer);
						logoFileObj = new File([uint8Array], logoFile.filename, {
							type: loadedLogo.mimeType || 'image/png'
						});
					} else if (logoFile.filePath) {
						console.log('Using existing file path for color extraction (legacy support)');
						// Legacy support: only fetch from URL, do not read/write local files
						const url = logoFile.filePath.startsWith('http')
							? logoFile.filePath
							: `http://localhost:5173${logoFile.filePath}`;
						const response = await fetch(url);
						if (response.ok) {
							const logoBlob = await response.blob();
							logoFileObj = new File([logoBlob], logoFile.filename, {
								type: logoBlob.type
							});
						} else {
							throw new Error('Logo file not found at path: ' + logoFile.filePath);
						}
					} else {
						throw new Error('No logo file data available for color extraction');
					}
					
					// Check if file is SVG - if so, convert to PNG first (color extraction service requires raster images)
					let fileToExtract = logoFileObj;
					const isSvg = logoFileObj.type === 'image/svg+xml' || logoFileObj.name.endsWith('.svg');
					
					if (isSvg) {
						console.log('Logo is SVG, converting to PNG for color extraction...');
						try {
							// Read SVG content
							const svgContent = await logoFileObj.text();
							
							// Convert SVG to PNG (use 800x800 as default size for good quality)
							const pngDataUrl = await svgToPngNode(svgContent, 800, 800);
							
							// Extract base64 data from data URL
							const base64Data = pngDataUrl.split(',')[1];
							const pngBuffer = Buffer.from(base64Data, 'base64');
							
							// Create new File object with PNG data
							const pngFilename = logoFileObj.name.replace(/\.svg$/i, '.png');
							fileToExtract = new File([pngBuffer], pngFilename, { type: 'image/png' });
							
							console.log('SVG converted to PNG successfully:', { filename: pngFilename, size: pngBuffer.length });
						} catch (svgConversionError) {
							console.error('Failed to convert SVG to PNG:', svgConversionError);
							// Continue with original file - the service might handle it, or we'll get a better error
							console.warn('Proceeding with SVG file - color extraction may fail');
						}
					}
					
					// Now extract colors using the File object (PNG if converted, or original if not SVG)
					console.log('Extracting colors from logo file:', { 
						filename: fileToExtract.name, 
						type: fileToExtract.type, 
						size: fileToExtract.size 
					});
					
					try {
						// Use color extraction service directly
						const colorResult = await extractColorsFromLogo(fileToExtract, 7);
						
						console.log('Color extraction result:', { 
							success: colorResult.success, 
							hasBrandColorSystem: !!colorResult.brand_color_system,
							hasPrimary: !!colorResult.brand_color_system?.primary?.length,
							hasSecondary: !!colorResult.brand_color_system?.secondary?.length,
							primaryCount: colorResult.brand_color_system?.primary?.length || 0,
							secondaryCount: colorResult.brand_color_system?.secondary?.length || 0
						});
						
						if (colorResult.success && colorResult.brand_color_system) {
							extractedColors = convertExtractedColorsToProgressiveFormat(colorResult.brand_color_system);
							rawExtractedColorSystem = colorResult.brand_color_system; // Store raw object for color generation
							console.log('Extracted colors formatted for progressive generation, length:', extractedColors.length);
						} else {
							throw new Error('Color extraction returned success=false or missing brand_color_system');
						}
					} catch (extractionError: any) {
						console.error('Color extraction error details:', {
							message: extractionError.message,
							stack: extractionError.stack,
							fileName: fileToExtract.name,
							fileType: fileToExtract.type,
							fileSize: fileToExtract.size
						});
						
						// Check if it's a service availability issue
						if (extractionError.message.includes('not available') || 
						    extractionError.message.includes('ECONNREFUSED') ||
						    extractionError.message.includes('fetch failed')) {
							console.error('Color extraction service is not accessible. Please ensure the service is running.');
							// Don't fail completely - let the AI generate colors based on industry/vibe
							extractedColors = '';
						} else {
							// For other errors, log but continue
							console.warn('Continuing without extracted colors - AI will generate colors based on industry and vibe');
							extractedColors = '';
						}
						
						console.log('Note: Color extraction from logo failed, but color palette will be generated based on industry and brand style instead.');
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
				// Don't fail the request - continue without extracted colors/typography
				// The AI will generate colors/typography based on industry and vibe
				console.warn('Continuing without extracted colors/typography - AI will generate based on industry and brand style');
				extractedColors = '';
				extractedTypography = '';
			}
		} else {
			console.log('No logo files found in previousSteps:', previousSteps?.logo_files);
			// Don't throw error - AI will generate colors based on industry/vibe if no colors available
			if (step === 'color-palette' && !extractedColors) {
				console.log('[progressive API] No logo file or generatedColors found. AI will generate colors based on industry and brand style.');
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
		const canUseEnhanced = Boolean(brandName && industry && style);

		// For color-palette step, generate colors using the same logic as logo generation to ensure they match
		let logoColors: { primary: string; secondary: string; accent1: string; accent2?: string } | undefined = undefined;
		if (step === 'color-palette' && brandName && industry && style) {
			try {
				// Import the shared color generation function (same as logo generation uses)
				const { generateColorsForLogo } = await import('$lib/services/color-generation');
				// Get API key
				const { env } = await import('$lib/env');
				let apiKey = env?.GOOGLE_GEMINI_API || '';
				if (!apiKey || apiKey.trim() === '') {
					if (typeof process !== 'undefined' && process.env) {
						apiKey = process.env.Google_Gemini_Api || 
						         process.env.GOOGLE_GEMINI_API || 
						         process.env.GOOGLE_AI_API_KEY || '';
						if (apiKey) {
							apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
						}
					}
				}
				if (apiKey) {
					// Check if logo file has stored generatedColors from logo generation
					if (previousSteps?.logo_files && previousSteps.logo_files.length > 0) {
						const logoFile = previousSteps.logo_files[0];
						if ((logoFile as any).generatedColors) {
							logoColors = (logoFile as any).generatedColors;
							console.log('[progressive API] Using stored colors from logo generation:', logoColors);
						}
					}
					
					// Only generate new colors if not already stored
					if (!logoColors) {
						// Get extracted colors from uploaded logo if available
						let extractedColorsFromLogo: any = undefined;

						// Priority 1: Use raw extracted color system from this request's color extraction
						if (rawExtractedColorSystem) {
							extractedColorsFromLogo = rawExtractedColorSystem;
							console.log('[progressive API] Using raw extracted color system from logo:', {
								primaryCount: extractedColorsFromLogo.primary?.length || 0,
								secondaryCount: extractedColorsFromLogo.secondary?.length || 0
							});
						}
						// Priority 2: Use extractedColors from logo file (if previously stored)
						else if (previousSteps?.logo_files && previousSteps.logo_files.length > 0) {
							const logoFile = previousSteps.logo_files[0];
							if ((logoFile as any).extractedColors) {
								extractedColorsFromLogo = (logoFile as any).extractedColors;
								console.log('[progressive API] Using stored extracted colors from logo file:', extractedColorsFromLogo);
							}
						}

						const generatedColors = await generateColorsForLogo(apiKey, brandName, industry, style, extractedColorsFromLogo);
						if (generatedColors) {
							logoColors = generatedColors;
							console.log('[progressive API] Generated colors based on extracted logo colors:', logoColors);
						}
					}
				}
			} catch (error) {
				console.warn('[progressive API] Failed to generate logo colors, will generate colors in color palette step:', error);
			}
		}

		if (canUseEnhanced) {
			console.log('Using enhanced progressive generator with:', {
				brandName,
				industry,
				style,
				audience,
				hasIndustrySpecificInfo: Object.keys(industrySpecificInfo).length > 0,
				hasGroundingData: !!groundingData,
				hasLogoColors: !!logoColors
			});
			
			// Include stepHistory in previousSteps so industry-specific steps can reference previous common steps
			const previousStepsWithHistory = {
				...(previousSteps || {}),
				stepHistory: stepHistory || []
			};

			try {
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
					logoColors: logoColors,
					groundingData: groundingData
				});
			} catch (enhancedError) {
				console.warn('[progressive API] Enhanced generator failed, falling back to legacy:', enhancedError);
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

		let normalizedContent = normalizeStepContent(step, stepResult.content);
		
		if (step === 'iconography') {
			try {
				normalizedContent = await enhanceIconographyContent(normalizedContent);
			} catch (error) {
				console.error('Failed to enhance iconography content:', error);
			}
		}

		stepResult.content = normalizedContent;

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

	const iconEntries = extractIconEntries(content).slice(0, 24);
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

function normalizeStepContent(step: string, content: any) {
	if (!content) return content;
	if (typeof content === 'object' && !Array.isArray(content)) {
		return content;
	}

	if (typeof content !== 'string') {
		return content;
	}

	const parsed = tryParseJson(content);
	if (parsed) {
		(parsed as any).step = (parsed as any).step || step;
		return parsed;
	}

	return content;
}

function tryParseJson(raw: string) {
	if (!raw) return null;
	const trimmed = raw.trim();
	const attempts = [
		trimmed,
		trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
	];

	for (const candidate of attempts) {
		try {
			if (!candidate) continue;
			return JSON.parse(candidate);
		} catch {
			continue;
		}
	}

	const firstBrace = trimmed.indexOf('{');
	const lastBrace = trimmed.lastIndexOf('}');
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		const block = trimmed.slice(firstBrace, lastBrace + 1);
		try {
			return JSON.parse(block);
		} catch {
			return null;
		}
	}

	return null;
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
