import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import { saveLogoAsset } from '$lib/server/logo-storage';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

/**
 * API endpoint for generating professional, accurate logos (SVG or PNG) using Gemini with automatic fallback
 */

// Fallback chain for SVG logo generation (text models)
const SVG_MODEL_FALLBACK_CHAIN = [
	'gemini-2.0-flash',           // Primary: Fast, reliable, high limits
	'gemini-2.5-flash',           // Fallback 1: Newer model, good quality
	'gemini-2.5-pro',             // Fallback 2: Higher quality, slower
	'gemini-2.0-flash-exp',       // Fallback 3: Experimental
	'gemini-3-pro'                // Fallback 4: Latest, very low limits
];

// Fallback chain for PNG image generation (Imagen + multi-modal models)
// Ordered by quality first, then fallback to alternatives
// Note: Imagen models require version suffix (-001) for Vertex AI
const PNG_MODEL_FALLBACK_CHAIN = [
	'imagen-4.0-ultra-generate-001',      // Best quality (5 RPM, 30/day)
	'imagen-4.0-generate-001',            // High quality (10 RPM, 70/day)
	'gemini-2.5-flash-preview-image',     // High volume (500 RPM, 2K/day)
	'imagen-4.0-fast-generate-001',       // Fast generation (10 RPM, 70/day)
	'gemini-3-pro-image'                  // Latest tech (20 RPM, 250/day)
];

// Helper function to check if error is retryable (rate limit, quota, etc.)
function isRetryableError(error: any): boolean {
	const errorMessage = error?.message || error?.toString() || '';
	return (
		errorMessage.includes('429') || // Rate limit
		errorMessage.includes('quota') ||
		errorMessage.includes('rate limit') ||
		errorMessage.includes('RPM') ||
		errorMessage.includes('TPM') ||
		errorMessage.includes('RPD') ||
		errorMessage.includes('503') || // Service unavailable
		errorMessage.includes('overloaded') ||
		errorMessage.includes('temporarily unavailable')
	);
}

// Helper function to check if error is model-specific (404, not found)
function isModelNotFoundError(error: any): boolean {
	const errorMessage = error?.message || error?.toString() || '';
	return (
		errorMessage.includes('404') ||
		errorMessage.includes('not found') ||
		errorMessage.includes('not supported') ||
		errorMessage.includes('is not found for API version')
	);
}

// Import shared color generation functions
import { generateColorsForLogo, getVibeColorGuidelines } from '$lib/services/color-generation';
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const {
			brandName,
			industry,
			style,
			description,
			values,
			logoStyle,
			logoColors,
			logoSymbols,
			logoTagline,
			logoUsage,
			audience,
			previousLogoData,
			previousLogoFilename,
			extractedColors // Extracted colors from uploaded logo
		} = body;

		if (!brandName) {
			return json({ error: 'Brand name is required' }, { status: 400 });
		}

		// Get API key
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

		if (!apiKey || apiKey.trim() === '') {
			return json({ error: 'Google Gemini API key is not configured' }, { status: 500 });
		}

		// Check if user wants PNG or SVG (default to PNG for Imagen models)
		const outputFormat = body.outputFormat || body.format || 'png'; // 'png' or 'svg'

		// Initialize Gemini
		const genAI = new GoogleGenerativeAI(apiKey);
		
		// Initialize Vertex AI client for Imagen models
		let vertexClient: PredictionServiceClient | null = null;
		let projectId: string | null = null;
		let location: string = 'us-central1';
		let credentialsPath: string | null = null;
		
		try {
			// Get project ID and location from environment
			projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID || '';
			location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
			credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
			
			// Resolve relative path to absolute path if needed
			if (credentialsPath) {
				const path = await import('path');
				const fs = await import('fs');
				const projectRoot = process.cwd();
				
				// Resolve path (handles both relative and absolute paths)
				const resolvedPath = path.isAbsolute(credentialsPath) 
					? credentialsPath 
					: path.resolve(projectRoot, credentialsPath);
				
				// Check if file exists
				if (fs.existsSync(resolvedPath)) {
					credentialsPath = resolvedPath;
					console.log(`[generate-logo] ✅ Credentials file found: ${credentialsPath}`);
				} else {
					console.error(`[generate-logo] ❌ Credentials file NOT FOUND at: ${resolvedPath}`);
					console.error(`[generate-logo] Project root: ${projectRoot}`);
					console.error(`[generate-logo] Raw path from env: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
					console.error(`[generate-logo] Please ensure the file exists at the specified path in GOOGLE_APPLICATION_CREDENTIALS`);
					credentialsPath = null;
				}
			}
			
			// Initialize Vertex AI client if we have project ID
			if (projectId) {
				const clientOptions: any = {
					apiEndpoint: `${location}-aiplatform.googleapis.com`,
				};
				
				// Use service account credentials if provided
				if (credentialsPath) {
					clientOptions.keyFilename = credentialsPath;
					console.log(`[generate-logo] Vertex AI client initialized with service account: ${credentialsPath}`);
				} else {
					// Will use default credentials or environment variable
					console.log('[generate-logo] Vertex AI client initialized with default credentials');
				}
				
				vertexClient = new PredictionServiceClient(clientOptions);
				console.log(`[generate-logo] Vertex AI client ready for project: ${projectId}, location: ${location}`);
			} else {
				console.log('[generate-logo] No GOOGLE_CLOUD_PROJECT_ID found - Vertex AI models will be skipped');
			}
		} catch (vertexError: any) {
			console.warn('[generate-logo] Failed to initialize Vertex AI client:', vertexError.message);
			// Continue without Vertex AI - will fallback to Gemini models
		}

		// Build comprehensive prompt for logo generation
		let brandContext = `Brand: "${brandName}"`;
		
		if (industry) {
			brandContext += `\nIndustry: ${industry}`;
		}
		
		if (description) {
			brandContext += `\nDescription: ${description}`;
		}
		
		if (style) {
			brandContext += `\nStyle: ${style}`;
		}
		
		if (values) {
			brandContext += `\nBrand Values: ${values}`;
		}
		
		if (audience) {
			brandContext += `\nTarget Audience: ${audience}`;
		}

		// Check if user provided enhancement feedback
		const rawFeedback = body.enhancementPrompt || body.feedback || '';
		
		// Get previous logo description if this is a modification request
		const previousLogoDescription = body.previousLogoDescription || body.logoDescription || '';
		
		// Process and enhance feedback based on format and user intent
		function processFeedback(feedback: string, format: 'png' | 'svg'): string {
			if (!feedback || feedback.trim() === '') {
				return '';
			}
			
			const feedbackLower = feedback.toLowerCase();
			let processedFeedback = feedback;
			let formatSpecificInstructions = '';
			
			// Analyze feedback patterns and extract specific requests
			const feedbackAnalysis: {
				colors?: string[];
				size?: string;
				style?: string;
				layout?: string;
				typography?: string;
				icon?: string;
				background?: string;
				spacing?: string;
				other?: string[];
			} = {};
			
			// Extract color-related feedback (improved pattern matching)
			const colorKeywords = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'navy', 'teal', 'cyan', 'magenta', 'brown', 'beige', 'gold', 'silver', 'maroon', 'crimson', 'emerald', 'turquoise', 'indigo', 'violet', 'amber', 'copper', 'bronze'];
			const colorKeywordsPattern = colorKeywords.join('|');
			const colorPatterns = [
				/(?:change|make|use|switch|update|adjust|replace|set).*?(?:color|colour|palette|hue|tint|shade|scheme)/gi,
				/(?:more|less|brighter|darker|lighter|softer|bolder|saturated|vibrant|muted).*?(?:color|colour)/gi,
				// Simple patterns like "make it blue", "change to red"
				new RegExp(`(?:make|change|switch|use|set).*?(?:it|logo|to|in|with)\\s+(?:a\\s+)?(?:${colorKeywordsPattern})`, 'gi'),
				new RegExp(`(?:${colorKeywordsPattern})`, 'gi')
			];
			
			if (colorPatterns.some(pattern => pattern.test(feedback))) {
				// Extract specific color mentions
				const colorMentions: string[] = [];
				colorKeywords.forEach(color => {
					const regex = new RegExp(`\\b${color}\\b`, 'gi');
					if (regex.test(feedback)) {
						colorMentions.push(color);
					}
				});
				
				// Extract color change phrases (improved)
				const simpleColorPattern = new RegExp(`(?:make|change|switch|use|set|to|in|with)\\s+(?:it|logo|the|a)?\\s*(?:to|in|with)?\\s*(${colorKeywords.join('|')})`, 'gi');
				const simpleMatches = feedback.match(simpleColorPattern);
				
				// Extract color change phrases with "color" keyword
				const colorChangePhrases = feedback.match(new RegExp(`(?:use|make|change|switch|to|with|in|replace|set).*?(?:color|colour|palette|to|with)\\s+([a-z\\s]+(?:${colorKeywordsPattern})[a-z\\s]*)`, 'gi'));
				
				if (colorMentions.length > 0) {
					feedbackAnalysis.colors = colorMentions;
				} else if (simpleMatches && simpleMatches.length > 0) {
					// Extract colors from simple matches like "make it blue"
					const extractedColors = simpleMatches.map(m => {
						const colorMatch = m.match(new RegExp(`(${colorKeywords.join('|')})`, 'gi'));
						return colorMatch ? colorMatch[0] : null;
					}).filter(c => c !== null) as string[];
					if (extractedColors.length > 0) {
						feedbackAnalysis.colors = extractedColors;
					}
				} else if (colorChangePhrases) {
					feedbackAnalysis.colors = colorChangePhrases.map(m => m.replace(/(?:use|make|change|switch|to|with|in|replace|set).*?(?:color|colour|palette|to|with)\s+/gi, '').trim());
				}
			}
			
			// Extract size-related feedback (more precise detection - prioritize size-only requests)
			const sizeOnlyPatterns = [
				/^(?:make|increase|decrease|scale|resize|adjust).*?(?:bigger|smaller|larger|size|scale|big|small)/gi,
				/^(?:bigger|smaller|larger|increase|decrease|scale up|scale down)/gi,
				/(?:logo|icon|symbol|text|wordmark|it).*?(?:bigger|smaller|larger|increase|decrease|too small|too big|very small|very large)/gi,
				/(?:increase|decrease).*?(?:size|scale|proportion)/gi
			];
			
			// Check if this is a pure size request (no other changes mentioned)
			const isSizeOnlyRequest = sizeOnlyPatterns.some(pattern => pattern.test(feedback)) && 
				!/(?:change|redesign|different|new|modify|update).*?(?:design|icon|symbol|shape|color|layout|style)/gi.test(feedback);
			
			if (isSizeOnlyRequest || sizeOnlyPatterns.some(pattern => pattern.test(feedback))) {
				const sizeMatch = feedback.match(/(?:make|change|adjust|increase|decrease|scale|resize|bigger|smaller|larger).*?(?:smaller|larger|bigger|small|large|big|size|scale|proportion|icon|symbol|logo|text|wordmark)/gi);
				if (sizeMatch) {
					feedbackAnalysis.size = sizeMatch[0];
				} else {
					// Fallback: check for simple size keywords
					if (/(?:bigger|smaller|larger|increase|decrease|too small|very small|very large)/gi.test(feedback)) {
						feedbackAnalysis.size = feedback.match(/(?:bigger|smaller|larger|increase|decrease|too small|very small|very large)/gi)?.[0] || 'size adjustment';
					}
				}
			}
			
			// Extract style-related feedback
			if (/(?:more|less|make|change|adjust).*?(?:minimal|simple|complex|bold|elegant|modern|classic|playful|serious|professional)/gi.test(feedback)) {
				const styleMatch = feedback.match(/(?:more|less|make|change|adjust).*?(?:minimal|simple|complex|bold|elegant|modern|classic|playful|serious|professional|futuristic|vintage)/gi);
				if (styleMatch) {
					feedbackAnalysis.style = styleMatch[0];
				}
			}
			
			// Extract layout-related feedback
			if (/(?:move|change|adjust|position|layout|arrange|align|center|left|right|top|bottom|stack|horizontal|vertical)/gi.test(feedback)) {
				const layoutMatch = feedback.match(/(?:move|change|adjust|position|layout|arrange|align|center|left|right|top|bottom|stack|horizontal|vertical|side|above|below|beside)/gi);
				if (layoutMatch) {
					feedbackAnalysis.layout = layoutMatch.join(' ');
				}
			}
			
			// Extract typography-related feedback
			if (/(?:font|text|typography|letter|word|name|brand).*?(?:change|make|adjust|bigger|smaller|bold|thin|thick|spacing|kerning)/gi.test(feedback)) {
				const typoMatch = feedback.match(/(?:font|text|typography|letter|word|name|brand).*?(?:change|make|adjust|bigger|smaller|bold|thin|thick|spacing|kerning|serif|sans-serif|italic|uppercase|lowercase)/gi);
				if (typoMatch) {
					feedbackAnalysis.typography = typoMatch.join(' ');
				}
			}
			
			// Extract icon/symbol-related feedback
			if (/(?:icon|symbol|mark|logo|emblem|badge).*?(?:change|make|adjust|simplify|complex|add|remove|modify)/gi.test(feedback)) {
				const iconMatch = feedback.match(/(?:icon|symbol|mark|logo|emblem|badge).*?(?:change|make|adjust|simplify|complex|add|remove|modify|redesign|update)/gi);
				if (iconMatch) {
					feedbackAnalysis.icon = iconMatch.join(' ');
				}
			}
			
			// Extract background-related feedback
			if (/(?:background|bg|backdrop).*?(?:change|make|adjust|transparent|white|black|color|remove|add)/gi.test(feedback)) {
				const bgMatch = feedback.match(/(?:background|bg|backdrop).*?(?:change|make|adjust|transparent|white|black|color|remove|add|solid|gradient)/gi);
				if (bgMatch) {
					feedbackAnalysis.background = bgMatch.join(' ');
				}
			}
			
			// Extract spacing-related feedback
			if (/(?:spacing|padding|margin|gap|space|distance|closer|farther|tight|loose)/gi.test(feedback)) {
				const spacingMatch = feedback.match(/(?:spacing|padding|margin|gap|space|distance|closer|farther|tight|loose|more|less).*?(?:space|gap|distance)/gi);
				if (spacingMatch) {
					feedbackAnalysis.spacing = spacingMatch.join(' ');
				}
			}
			
			// Determine if this is a targeted change or full redesign
			const detectedChanges = Object.keys(feedbackAnalysis).filter(key => feedbackAnalysis[key as keyof typeof feedbackAnalysis] !== undefined);
			const isTargetedChange = detectedChanges.length <= 2 && !feedbackAnalysis.style && !feedbackAnalysis.icon;
			
			// Check for general redesign keywords (indicates full redesign needed)
			const redesignKeywords = [
				/redesign|completely|entirely|totally|whole|full|new design|start over|from scratch|completely different|totally different|entirely new/gi,
				/make it more|make it less|more modern|more professional|more elegant|more playful|more minimal/gi
			];
			const isFullRedesign = redesignKeywords.some(pattern => pattern.test(feedback)) || detectedChanges.length > 3;
			
			// Check if user explicitly mentions format-specific requirements
			const mentionsSvg = /svg|vector|code|xml|path|element|attribute/gi.test(feedback);
			const mentionsPng = /png|image|pixel|raster|bitmap/gi.test(feedback);
			
			// Build format-specific instructions with strict preservation for targeted changes
			if (format === 'svg') {
				if (isTargetedChange && !isFullRedesign) {
					// TARGETED CHANGE MODE - Only change specific aspect, preserve everything else
					formatSpecificInstructions = `
				
SVG-SPECIFIC FEEDBACK PROCESSING - TARGETED CHANGE MODE (CRITICAL - MUST FOLLOW):
⚠️ THIS IS A TARGETED CHANGE - ONLY MODIFY THE SPECIFIC REQUESTED ASPECT ⚠️

STRICT PRESERVATION RULES:
- You are generating SVG CODE, not an image
- PRESERVE the existing logo design structure, layout, and all elements EXACTLY as they are
- ONLY modify the specific aspect(s) mentioned in the user feedback
- DO NOT change: shapes, icon design, typography style, layout arrangement, spacing (unless specifically requested)
- DO NOT redesign, restructure, or add/remove elements
- Maintain valid SVG syntax and structure (proper XML format)
- Output ONLY valid SVG markup starting with <svg> and ending with </svg>

TARGETED CHANGES TO APPLY:
${feedbackAnalysis.colors ? `✓ COLOR ONLY: Update ONLY the fill and stroke color attributes with hex values (e.g., fill="#1A73E8"). Keep all shapes, sizes, positions, and structure identical.` : ''}
${feedbackAnalysis.size ? `✓ SIZE ONLY: Adjust ONLY the viewBox and element dimensions (width, height, r, cx, cy, etc.) proportionally. Keep all colors, shapes, positions, and structure identical.` : ''}
${feedbackAnalysis.typography ? `✓ TYPOGRAPHY ONLY: Update ONLY the font-family, font-size, font-weight, or letter-spacing attributes. Keep all colors, shapes, sizes, positions, and structure identical.` : ''}
${feedbackAnalysis.spacing ? `✓ SPACING ONLY: Adjust ONLY the x, y, transform, or spacing attributes. Keep all colors, shapes, sizes, and structure identical.` : ''}
${feedbackAnalysis.layout ? `✓ LAYOUT ONLY: Adjust ONLY element positions using x, y, transform, or grouping. Keep all colors, shapes, sizes, and structure identical.` : ''}
${feedbackAnalysis.background ? `✓ BACKGROUND ONLY: Change ONLY the background color or transparency. Keep all logo elements identical.` : ''}

CRITICAL: If the user only requested ${detectedChanges.join(' or ')}, then ONLY change that. Everything else must remain EXACTLY the same.
- Ensure all changes maintain SVG validity, proper nesting, and optimization
- No markdown, no explanations, only SVG code`;
				} else {
					// FULL REDESIGN MODE - Can change multiple aspects
					formatSpecificInstructions = `
				
SVG-SPECIFIC FEEDBACK PROCESSING (CRITICAL - MUST FOLLOW):
- You are generating SVG CODE, not an image
- Apply all requested changes using clean SVG vector elements only: <path>, <circle>, <rect>, <polygon>, <line>, <text>
- Maintain valid SVG syntax and structure (proper XML format)
- Output ONLY valid SVG markup starting with <svg> and ending with </svg>
${feedbackAnalysis.colors ? `- COLOR CHANGES: Update fill and stroke attributes with hex color values (e.g., fill="#1A73E8", stroke="#EA4335")` : ''}
${feedbackAnalysis.size ? `- SIZE CHANGES: Adjust viewBox attribute and element dimensions (width, height, r, cx, cy, etc.) proportionally` : ''}
${feedbackAnalysis.typography ? `- TYPOGRAPHY CHANGES: Update <text> elements with appropriate font-family, font-size, font-weight, letter-spacing attributes` : ''}
${feedbackAnalysis.spacing ? `- SPACING CHANGES: Adjust x, y, transform, or spacing attributes to modify element positioning` : ''}
${feedbackAnalysis.layout ? `- LAYOUT CHANGES: Adjust element positions using x, y, transform, or grouping (<g>) elements` : ''}
- Ensure all changes maintain SVG validity, proper nesting, and optimization
- No markdown, no explanations, only SVG code`;
				}
			} else {
				if (isTargetedChange && !isFullRedesign) {
					// TARGETED CHANGE MODE - Only change specific aspect, preserve everything else
					const isSizeOnly = feedbackAnalysis.size && detectedChanges.length === 1;
					
					formatSpecificInstructions = `
				
PNG-SPECIFIC FEEDBACK PROCESSING - TARGETED CHANGE MODE (CRITICAL - MUST FOLLOW):
⚠️⚠️⚠️ THIS IS A TARGETED CHANGE - ONLY MODIFY THE SPECIFIC REQUESTED ASPECT ⚠️⚠️⚠️

${isSizeOnly ? `🚨 SIZE-ONLY REQUEST DETECTED - EXTREME PRESERVATION REQUIRED 🚨
The user ONLY wants the size changed. The logo design must remain IDENTICAL.
- The icon/shape must be EXACTLY the same (same geometric form, same segments, same interlocking pattern)
- The colors must be EXACTLY the same (same color palette, same color positions)
- The typography must be EXACTLY the same (same font, same weight, same style)
- The layout must be EXACTLY the same (icon position relative to text, spacing between elements)
- ONLY increase/decrease the overall scale/size proportionally
- DO NOT create a new icon design
- DO NOT change colors
- DO NOT change the shape or form
- DO NOT redesign anything
` : ''}

STRICT PRESERVATION RULES:
- You are generating a PNG IMAGE, not code
- PRESERVE the existing logo design EXACTLY as it is - pixel-perfect preservation
- The logo should look IDENTICAL to the previous version except for the requested change
- ONLY modify the specific aspect(s) mentioned in the user feedback
- DO NOT change: icon design, icon shape, icon form, icon structure, typography style, layout arrangement, overall composition (unless specifically requested)
- DO NOT redesign, restructure, or add/remove elements
- DO NOT create a new icon or symbol
- DO NOT change the geometric form or interlocking patterns
- Maintain flat vector graphic aesthetic (NO photorealism, NO 3D effects, NO shadows, NO gradients)
- Keep the "app icon" or "screen-printable graphic" style

TARGETED CHANGES TO APPLY:
${feedbackAnalysis.colors ? `✓ COLOR ONLY: Update ONLY the color palette to use: ${feedbackAnalysis.colors.join(', ')}. Keep all shapes, sizes, positions, typography, and layout IDENTICAL. The icon form must remain EXACTLY the same.` : ''}
${feedbackAnalysis.size ? `✓ SIZE ONLY: Adjust ONLY the overall scale/proportions. Scale everything proportionally (icon and text together). Keep all colors, shapes, icon design, typography style, and layout arrangement IDENTICAL. The icon must be the EXACT same geometric form, just larger/smaller. DO NOT redesign the icon.` : ''}
${feedbackAnalysis.typography ? `✓ TYPOGRAPHY ONLY: Update ONLY the text style, size, or weight. Keep all colors, shapes, sizes, icon design, and layout IDENTICAL.` : ''}
${feedbackAnalysis.spacing ? `✓ SPACING ONLY: Adjust ONLY element positioning/spacing. Keep all colors, shapes, sizes, typography, icon design, and layout IDENTICAL.` : ''}
${feedbackAnalysis.layout ? `✓ LAYOUT ONLY: Reposition ONLY elements according to request. Keep all colors, shapes, sizes, typography, and icon design IDENTICAL.` : ''}
${feedbackAnalysis.background ? `✓ BACKGROUND ONLY: Change ONLY the background. Keep all logo elements IDENTICAL.` : ''}

CRITICAL PRESERVATION CHECKLIST:
✓ Icon shape/form: MUST remain EXACTLY the same
✓ Icon colors: MUST remain EXACTLY the same (unless color change requested)
✓ Icon structure: MUST remain EXACTLY the same (same segments, same interlocking pattern)
✓ Typography: MUST remain EXACTLY the same (unless typography change requested)
✓ Layout: MUST remain EXACTLY the same (unless layout change requested)
✓ Overall design: MUST remain EXACTLY the same

CRITICAL: If the user only requested ${detectedChanges.join(' or ')}, then ONLY change that. Everything else must remain EXACTLY the same.
- Background must remain plain white or transparent
- NO decorative elements, NO environmental context, NO depth
- The logo should be recognizable as the SAME logo, just with the requested modification`;
				} else {
					// FULL REDESIGN MODE - Can change multiple aspects
					formatSpecificInstructions = `
				
PNG-SPECIFIC FEEDBACK PROCESSING (CRITICAL - MUST FOLLOW):
- You are generating a PNG IMAGE, not code
- Apply all changes while maintaining flat vector graphic aesthetic
- Keep the logo as a clean, flat design (NO photorealism, NO 3D effects, NO shadows, NO gradients)
- Maintain the "app icon" or "screen-printable graphic" style
${feedbackAnalysis.colors ? `- COLOR CHANGES: Update the color palette while keeping it strictly limited to 2-3 colors. Use the requested colors: ${feedbackAnalysis.colors.join(', ')}` : ''}
${feedbackAnalysis.size ? `- SIZE CHANGES: Adjust proportions but maintain scalability and visual balance` : ''}
${feedbackAnalysis.typography ? `- TYPOGRAPHY CHANGES: Ensure text remains legible, professional, and matches the requested style` : ''}
${feedbackAnalysis.spacing ? `- SPACING CHANGES: Adjust element positioning while maintaining visual balance and harmony` : ''}
${feedbackAnalysis.layout ? `- LAYOUT CHANGES: Reposition elements according to the requested layout while maintaining professional composition` : ''}
- All changes must preserve the minimalist, vector-based style
- Background must remain plain white or transparent
- NO decorative elements, NO environmental context, NO depth`;
				}
			}
			
			// Build structured feedback with format context
			const changeType = isTargetedChange && !isFullRedesign ? 'TARGETED CHANGE' : 'FULL REDESIGN';
			let structuredFeedback = `═══════════════════════════════════════════════════════════════════════════════
USER FEEDBACK/ENHANCEMENT REQUEST (${format.toUpperCase()} FORMAT)
CHANGE TYPE: ${changeType}
═══════════════════════════════════════════════════════════════════════════════

${processedFeedback}`;
			
			// Add specific analysis if available
			if (Object.keys(feedbackAnalysis).length > 0) {
				structuredFeedback += `\n\n═══════════════════════════════════════════════════════════════════════════════
DETECTED CHANGES REQUESTED (ANALYSIS):
═══════════════════════════════════════════════════════════════════════════════`;
				
				if (feedbackAnalysis.colors && feedbackAnalysis.colors.length > 0) {
					structuredFeedback += `\n✓ COLOR CHANGES: ${feedbackAnalysis.colors.join(', ')}`;
				}
				if (feedbackAnalysis.size) {
					structuredFeedback += `\n✓ SIZE/SCALE: ${feedbackAnalysis.size}`;
				}
				if (feedbackAnalysis.style) {
					structuredFeedback += `\n✓ STYLE: ${feedbackAnalysis.style}`;
				}
				if (feedbackAnalysis.layout) {
					structuredFeedback += `\n✓ LAYOUT/POSITION: ${feedbackAnalysis.layout}`;
				}
				if (feedbackAnalysis.typography) {
					structuredFeedback += `\n✓ TYPOGRAPHY: ${feedbackAnalysis.typography}`;
				}
				if (feedbackAnalysis.icon) {
					structuredFeedback += `\n✓ ICON/SYMBOL: ${feedbackAnalysis.icon}`;
				}
				if (feedbackAnalysis.background) {
					structuredFeedback += `\n✓ BACKGROUND: ${feedbackAnalysis.background}`;
				}
				if (feedbackAnalysis.spacing) {
					structuredFeedback += `\n✓ SPACING: ${feedbackAnalysis.spacing}`;
				}
			}
			
			// Add strict preservation instructions for targeted changes
			if (isTargetedChange && !isFullRedesign) {
				const isSizeOnly = feedbackAnalysis.size && detectedChanges.length === 1;
				
				structuredFeedback += `\n\n═══════════════════════════════════════════════════════════════════════════════
⚠️⚠️⚠️ TARGETED CHANGE MODE - STRICT PRESERVATION REQUIRED ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════

${isSizeOnly ? `🚨🚨🚨 SIZE-ONLY REQUEST DETECTED 🚨🚨🚨
The user ONLY wants the size changed. This is the MOST CRITICAL preservation scenario.

YOU MUST:
- Keep the EXACT same icon design (same geometric form, same segments, same interlocking pattern)
- Keep the EXACT same colors (same color palette, same color positions)
- Keep the EXACT same typography (same font, same weight, same style)
- Keep the EXACT same layout (icon position, text position, spacing)
- ONLY scale everything proportionally larger or smaller
- The logo must look IDENTICAL to the previous version, just bigger or smaller

YOU MUST NOT:
- Create a new icon design
- Change the icon shape or form
- Change colors
- Change typography
- Change layout
- Redesign anything
- The icon geometric structure must remain EXACTLY the same

Example: If the previous logo had an interlocking geometric icon with orange, teal, and blue segments, 
the new logo must have the EXACT same interlocking geometric icon with the EXACT same orange, teal, 
and blue segments in the EXACT same positions, just scaled larger.

` : `This is a TARGETED CHANGE request. The user only wants to modify specific aspect(s).

CRITICAL PRESERVATION RULES:
1. ONLY modify the specific aspect(s) detected above (${detectedChanges.join(', ')})
2. PRESERVE everything else EXACTLY as it is:
   - Keep the EXACT same icon/symbol design (same geometric form, same structure, same segments)
   - Keep the EXACT same colors (same color palette, same color positions)
   - Keep the EXACT same typography style (unless typography was requested)
   - Keep the EXACT same layout arrangement (unless layout was requested)
   - Keep the EXACT same spacing and proportions (unless size/spacing was requested)
   - Keep the EXACT same overall composition and structure
3. DO NOT redesign, restructure, or add/remove elements
4. DO NOT change aspects that were NOT mentioned in the feedback
5. DO NOT create a new icon or symbol design
6. The logo should look IDENTICAL except for the specific requested change(s)

Example: If user says "make it blue", ONLY change colors to blue. Everything else stays the same.
Example: If user says "make it bigger", ONLY scale it larger. The icon design must remain EXACTLY the same.`}
`;
			}
			
			structuredFeedback += formatSpecificInstructions;
			
			// Add extra emphasis for size-only requests
			const isSizeOnly = feedbackAnalysis.size && detectedChanges.length === 1 && isTargetedChange && !isFullRedesign;
			
			structuredFeedback += `\n\n═══════════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS:
═══════════════════════════════════════════════════════════════════════════════

${isSizeOnly 
	? `🚨🚨🚨 SIZE-ONLY REQUEST - ULTRA-STRICT PRESERVATION 🚨🚨🚨
The user ONLY requested a size change. This means:
- The logo design MUST be IDENTICAL to the previous version
- The icon geometric form MUST be EXACTLY the same
- The colors MUST be EXACTLY the same
- The typography MUST be EXACTLY the same
- The layout MUST be EXACTLY the same
- ONLY the scale/size should change (everything proportionally larger or smaller)
- DO NOT create a new design
- DO NOT change the icon shape
- DO NOT change colors
- The previous logo had a specific icon design - you MUST replicate that EXACT design, just scaled differently
- If the previous logo had interlocking segments, keep the EXACT same interlocking pattern
- If the previous logo had specific colors in specific positions, keep them EXACTLY the same
`
	: isTargetedChange && !isFullRedesign 
		? `⚠️ TARGETED CHANGE MODE: Apply ONLY the specific requested change(s). Preserve everything else EXACTLY as it is. The logo should be nearly identical except for the requested modification(s). The icon design, colors, typography, and layout must remain EXACTLY the same unless specifically requested to change.`
		: `Apply ALL requested changes accurately and precisely. Address EVERY aspect mentioned in the user feedback.`}
- Maintain professional quality, brand consistency, and design excellence
- Ensure the output format is ${format.toUpperCase()} and follows ${format.toUpperCase()}-specific requirements
- Do not ignore or skip any requested modifications
- If a change seems contradictory, prioritize the most specific request
${isSizeOnly ? `\n🚨 REMEMBER: For size-only requests, the logo must be RECOGNIZABLE as the SAME logo, just bigger or smaller. The icon design cannot change.` : ''}`;
			
			return structuredFeedback;
		}
		
		// Process feedback based on format
		const enhancementPrompt = processFeedback(rawFeedback, outputFormat);
		
		// Generate colors dynamically using AI (same approach as color palette step)
		let generatedColors: { primary: string; secondary: string; accent1: string; accent2?: string } | null = null;
		if (industry && style) {
			// Check if feedback specifically requests color changes
			const feedbackRequestsColorChange = rawFeedback && (
				/change.*color|color.*change|different.*color|new.*color|update.*color|switch.*color|replace.*color/i.test(rawFeedback) ||
				/use.*color|make.*color|set.*color/i.test(rawFeedback)
			);
			
			// Generate colors unless feedback specifically requests color changes (then we'll use those)
			// ALWAYS generate colors for first-time generation to ensure brand consistency
			if (!feedbackRequestsColorChange) {
				try {
					// Use extracted colors from uploaded logo if available
					generatedColors = await generateColorsForLogo(apiKey, brandName, industry, style, extractedColors);
					console.log('[generate-logo] Generated colors:', generatedColors, extractedColors ? '(using extracted colors from uploaded logo)' : '');
					if (generatedColors) {
						console.log('[generate-logo] Colors will be enforced in logo generation:', {
							primary: generatedColors.primary,
							secondary: generatedColors.secondary,
							accent1: generatedColors.accent1,
							accent2: generatedColors.accent2
						});
					}
				} catch (error) {
					console.error('[generate-logo] Failed to generate colors, using generic guidance:', error);
				}
			}
		}
		
		// Build color guidance based on AI-generated colors or fallback to style-based guidance
		let colorGuidance = '';
		if (industry && style) {
			if (generatedColors) {
				// Use AI-generated colors (these will match the color palette step)
				// CRITICAL: Include the actual hex codes so the AI knows exactly which colors to use
				colorGuidance = `\n\nCOLOR REQUIREMENTS (CRITICAL - MUST FOLLOW EXACTLY):\n`;
				colorGuidance += `- Industry: ${industry} - Colors generated based on industry analysis\n`;
				colorGuidance += `- Style/Vibe: ${style} - Colors match this aesthetic\n`;
				colorGuidance += `- Use these EXACT colors (generated dynamically to match color palette step):\n`;
				colorGuidance += `  * Primary Color: ${generatedColors.primary} - Use this EXACT color for main logo elements (icon, primary text)\n`;
				colorGuidance += `  * Secondary Color: ${generatedColors.secondary} - Use this EXACT color for supporting elements (secondary text, accents)\n`;
				colorGuidance += `  * Accent Color: ${generatedColors.accent1} - Use this EXACT color for highlights or accents\n`;
				if (generatedColors.accent2) {
					colorGuidance += `  * Accent 2: ${generatedColors.accent2} - Use this EXACT color sparingly (optional)\n`;
				}
				colorGuidance += `- CRITICAL: You MUST use these EXACT hex codes: Primary=${generatedColors.primary}, Secondary=${generatedColors.secondary}, Accent=${generatedColors.accent1}${generatedColors.accent2 ? `, Accent2=${generatedColors.accent2}` : ''}\n`;
				colorGuidance += `- Use ONLY these specific colors - they match the ${style} style and will be used in the color palette step\n`;
				colorGuidance += `- Colors must work on both light and dark backgrounds\n`;
				colorGuidance += `- CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself\n`;
				colorGuidance += `- CRITICAL: The logo should be a clean graphic with NO text labels, NO hex codes, NO color names visible\n`;
			} else {
				// Fallback to style-based guidance (if color generation failed)
			colorGuidance = `\n\nCOLOR REQUIREMENTS (CRITICAL - MUST FOLLOW EXACTLY):\n`;
			colorGuidance += `- Industry: ${industry} - Use colors appropriate for this industry (e.g., healthcare: blues/teals for trust; tech: modern blues/purples; finance: deep blues/greens; fashion: bold/vibrant colors; food: warm/orange tones)\n`;
			colorGuidance += `- Style/Vibe: ${style} - Colors must match this aesthetic:\n`;
			
			if (style.toLowerCase().includes('minimalistic') || style.toLowerCase().includes('minimal')) {
				colorGuidance += `  * Use 1-2 colors maximum, clean and simple palette (e.g., single brand color + neutral gray/black)\n`;
			} else if (style.toLowerCase().includes('maximalistic') || style.toLowerCase().includes('bold')) {
				colorGuidance += `  * Use 2-3 vibrant, high-contrast colors that pop (e.g., bright primary + complementary accent + neutral)\n`;
			} else if (style.toLowerCase().includes('professional') || style.toLowerCase().includes('corporate')) {
				colorGuidance += `  * Use professional, trustworthy colors (e.g., deep blue/navy + accent color + neutral gray)\n`;
			} else if (style.toLowerCase().includes('playful') || style.toLowerCase().includes('funky')) {
				colorGuidance += `  * Use energetic, fun colors (e.g., bright primary + secondary + accent)\n`;
			} else if (style.toLowerCase().includes('elegant') || style.toLowerCase().includes('luxury')) {
				colorGuidance += `  * Use sophisticated, refined colors (e.g., deep rich color + gold/metallic accent + neutral)\n`;
			} else if (style.toLowerCase().includes('futuristic') || style.toLowerCase().includes('modern')) {
				colorGuidance += `  * Use contemporary, tech-forward colors (e.g., electric blue/purple + cyan + dark neutral)\n`;
			} else {
				colorGuidance += `  * Use 2-3 harmonious colors that reflect the ${style} aesthetic\n`;
			}
			
			colorGuidance += `- Ensure colors are industry-appropriate and style-appropriate\n`;
			colorGuidance += `- Colors must work on both light and dark backgrounds\n`;
			}
		}

		// Build next-level, production-grade prompt for accurate SVG logo generation
		const prompt = `You are the Creative Director of a world-renowned brand identity studio (think Pentagram, Landor, or Interbrand level). 

You have 20+ years of experience designing logos for Fortune 500 companies, startups, and iconic brands. 

Your work has won D&AD Pencils, Cannes Lions, and AIGA awards. 

You understand that a logo is not just a visual mark—it's a strategic tool that communicates brand essence, builds emotional connection, and drives recognition.

═══════════════════════════════════════════════════════════════════════════════
PHASE 1: STRATEGIC BRAND ANALYSIS (MENTAL PROCESSING - DO NOT OUTPUT)
═══════════════════════════════════════════════════════════════════════════════

Before designing, analyze these dimensions:

1. COMPETITIVE LANDSCAPE ANALYSIS:

   - Research visual patterns in the ${industry || 'target'} industry

   - Identify overused clichés and generic symbols to AVOID

   - Find white space opportunities for differentiation

   - Understand what successful competitors are doing (then do something different)

2. BRAND PSYCHOLOGY MAPPING:

   - Brand Personality: ${style || 'professional'} → Translate to visual language

   - Emotional Resonance: What feeling should the logo evoke? (trust, innovation, luxury, approachability, etc.)

   - Target Audience: ${audience || 'general consumers'} → Design for their visual literacy and preferences

   - Brand Values: ${values || 'not specified'} → Embed values into visual form

3. COLOR PSYCHOLOGY STRATEGY:

   - Industry Context: ${industry || 'brand'} industry color conventions

   - Emotional Mapping: 

     * Trust & Stability → Deep blues, navy, forest green

     * Innovation & Tech → Electric blue, purple, cyan, neon accents

     * Luxury & Premium → Gold, black, deep burgundy, platinum

     * Eco & Sustainability → Earth greens, natural browns, sky blue

     * Healthcare & Wellness → Soft blues, teal, white, calming greens

     * Finance & Banking → Navy, gold, charcoal, conservative palette

     * Fashion & Creative → Bold, vibrant, trend-forward colors

     * Food & Beverage → Warm oranges, reds, appetizing colors

   - Accessibility: Ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for graphics)

   - Versatility: Colors must work on white, black, and colored backgrounds

4. TYPOGRAPHY PSYCHOLOGY:

   - Brand Name: "${brandName}"

   - Font Selection Based on Personality:

     * Minimalistic/Modern → Geometric sans-serif (clean, precise)

     * Professional/Corporate → Humanist sans-serif (approachable, trustworthy)

     * Luxury/Elegant → High-contrast serif or refined sans-serif

     * Playful/Creative → Rounded sans-serif or custom letterforms

     * Tech/Futuristic → Monospace or geometric sans-serif with tech aesthetic

     * Fashion/Lifestyle → High-contrast serif or stylized sans-serif

   - Kerning & Spacing: Perfect letter-spacing for brand name readability

   - Weight & Hierarchy: Establish visual weight that matches brand personality

5. SYMBOL DESIGN STRATEGY:

   - Abstract vs. Literal: Prefer abstract, conceptual marks over literal illustrations

   - Negative Space: Use negative space creatively (FedEx arrow, Amazon smile)

   - Geometric Construction: Build on grid systems, golden ratio, or mathematical precision

   - Scalability Test: Must be recognizable at 16×16 pixels (favicon size)

   - Uniqueness: Avoid generic shapes (circles, triangles alone) unless transformed uniquely

═══════════════════════════════════════════════════════════════════════════════
PHASE 2: DESIGN EXECUTION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

DESIGN PRINCIPLES (MANDATORY):

1. VISUAL HIERARCHY:

   - Primary element (symbol or wordmark) must command attention

   - Secondary elements support without competing

   - Clear focal point that guides the eye

2. BALANCE & SYMMETRY:

   - Achieve visual equilibrium (symmetrical or asymmetrical balance)

   - Use golden ratio (1.618) or rule of thirds for proportions

   - Ensure no visual "heaviness" on one side

3. NEGATIVE SPACE MASTERY:

   - Use negative space as an active design element

   - Create hidden meanings or secondary imagery through negative space

   - Ensure breathing room around all elements

4. GEOMETRIC PRECISION:

   - All shapes must be mathematically precise

   - Use clean curves (Bezier paths) not jagged lines

   - Align to pixel grid for crisp rendering at all sizes

5. SCALABILITY EXCELLENCE:

   - Test mentally at these sizes: 16px, 32px, 64px, 128px, 512px, 2000px

   - Simplify details that disappear at small sizes

   - Ensure brand name "${brandName}" is legible at 24px minimum

   - Icon/symbol must be recognizable at 16px

6. CONTEXT VERSATILITY:

   - Design must work in these contexts:

     * Full color on white background

     * Full color on black background

     * Monochrome (black on white)

     * Monochrome (white on black)

     * Single color on colored backgrounds

     * Reversed/knockout versions

   - Test contrast ratios for each context

7. TIMELESSNESS:

   - Avoid trendy design elements that will date quickly

   - Focus on classic, enduring design principles

   - Create something that will look good in 10+ years

8. MEMORABILITY:

   - Design must be distinctive and memorable

   - Should be recognizable even when partially obscured

   - Unique enough to stand out in a crowded marketplace

═══════════════════════════════════════════════════════════════════════════════
PHASE 3: TECHNICAL SVG REQUIREMENTS (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

1. OUTPUT FORMAT:

   - Output **ONLY** valid, standalone SVG markup

   - Start with "<svg" and end with "</svg>"

   - No markdown, no code fences, no explanations, no extra text

   - Exactly one complete <svg>...</svg> element

2. SVG STRUCTURE:

   - Include proper XML namespace: xmlns="http://www.w3.org/2000/svg"

   - Set appropriate viewBox (e.g., "0 0 400 200" for horizontal logo)

   - Include width and height attributes for proper aspect ratio

   - Transparent background (no fill on root <svg> element)

3. VECTOR EXCELLENCE:

   - Use only vector shapes: <path>, <circle>, <rect>, <polygon>, <line>, <text>

   - No raster elements (no <image> with PNG/JPEG)

   - No embedded base64 bitmaps

   - All paths must be clean and optimized (minimal nodes)

4. TYPOGRAPHY HANDLING:

   - Brand name "${brandName}" must use <text> elements with proper font-family

   - Include font-family stack: [Primary Font], -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

   - Use appropriate font-weight (400, 500, 600, 700)

   - Perfect kerning using letter-spacing adjustments

   - If custom letterforms needed, convert to <path> but keep semantic structure

5. COLOR IMPLEMENTATION:

   ${colorGuidance || `- Use industry-appropriate colors for ${industry || 'brand'} industry

   - Style-appropriate for ${style || 'professional'} aesthetic

   - 2-3 harmonious colors maximum

   - Use hex values in SVG attributes (e.g., fill="#1A73E8", stroke="#EA4335")

   - Define colors in <defs> section for reusability

   - Ensure WCAG AA contrast (4.5:1 minimum)

   - CRITICAL: Hex codes should ONLY be in SVG code attributes, NEVER as visible text in the logo

   - CRITICAL: DO NOT include hex codes, color names, or any text labels as visible elements in the logo`}

6. SEMANTIC STRUCTURE:

   - Group related elements: <g id="logo-mark">, <g id="wordmark">, <g id="symbol">

   - Use descriptive IDs: id="brand-name", id="icon", id="accent"

   - Logical nesting hierarchy

7. ACCESSIBILITY:

   - Include <title> element: <title>${brandName} Logo</title>

   - Include <desc> element: <desc>Logo for ${brandName}, ${industry || 'brand'} company</desc>

   - Use aria-label if needed for screen readers

8. OPTIMIZATION:

   - Remove unnecessary nodes and points

   - Use <defs> and <use> for repeated elements

   - Minimize file size while maintaining quality

   - No comments, no editor metadata, no Inkscape/Illustrator cruft

9. SAFETY & SECURITY:

   - No <script> elements

   - No <foreignObject>

   - No event handlers (onclick, onload, etc.)

   - No external links or references

   - No data URIs for external resources

10. CODE QUALITY:

    - Well-formatted, readable code structure

    - Consistent indentation

    - Logical attribute ordering

    - No duplicate IDs

    - Valid XML/SVG syntax

═══════════════════════════════════════════════════════════════════════════════
PHASE 4: QUALITY VALIDATION CHECKLIST (MENTAL VERIFICATION)
═══════════════════════════════════════════════════════════════════════════════

Before finalizing, verify:

✓ Logo is unique and not derivative of common templates

✓ Avoids industry clichés (e.g., no generic lightbulbs for innovation, no generic globes for global)

✓ Brand name "${brandName}" is clearly legible and prominent

✓ Works at 16px favicon size (symbol recognizable)

✓ Works at 32px minimum (text readable)

✓ Maintains impact at large sizes (2000px+)

✓ Colors are industry-appropriate and style-appropriate

✓ Typography matches brand personality

✓ Negative space is used effectively

✓ Geometric construction is precise

✓ Visual balance is achieved

✓ Memorable and distinctive

✓ Timeless design (won't look dated in 5-10 years)

✓ Versatile across all required contexts

✓ Accessible (proper contrast ratios)

✓ Technically sound SVG code

═══════════════════════════════════════════════════════════════════════════════
BRAND CONTEXT
═══════════════════════════════════════════════════════════════════════════════

${brandContext}
${colorGuidance ? `\n\n${colorGuidance}` : ''}
${enhancementPrompt ? `\n\n${enhancementPrompt}` : ''}

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTION
═══════════════════════════════════════════════════════════════════════════════

Generate a world-class, award-winning logo that would make the Creative Director of Pentagram or Landor proud. 

This logo must be:

- Strategically aligned with brand identity

- Visually distinctive and memorable

- Technically perfect and scalable

- Emotionally resonant with target audience

- Timeless and enduring

- Production-ready for immediate use

Return ONLY the complete SVG code. No explanations, no markdown, no additional text. 

CRITICAL: The SVG code should use hex values in attributes (like fill="#1A73E8"), but DO NOT include hex codes, color names, or any text labels as visible elements in the logo itself. The logo must be a clean graphic with NO visible text labels, hex codes, or color names.

The SVG must be valid, optimized, and ready for production use.`;

		// Try PNG generation first if requested, then fallback to SVG
		let result: { data: Buffer; format: string; model: string; mimeType: string; svgCode?: string } | null = null;
		let lastError: Error | null = null;
		let currentFormat = outputFormat;
		
		// Attempt PNG generation if requested
		if (currentFormat === 'png') {
			console.log('[generate-logo] Attempting PNG generation with Imagen models...');
			
			// Determine layout type based on style and industry
			let layoutType = 'Icon to the left of text';
			if (style?.toLowerCase().includes('emblem') || style?.toLowerCase().includes('badge')) {
				layoutType = 'Emblem/Badge style';
			} else if (style?.toLowerCase().includes('stacked') || style?.toLowerCase().includes('vertical')) {
				layoutType = 'Icon stacked above text';
			} else if (industry?.toLowerCase().includes('luxury') || industry?.toLowerCase().includes('fashion')) {
				layoutType = 'Icon stacked above text';
			}

			// Determine emotional vibe from style
			let emotionalVibe = 'professional and trustworthy';
			if (style?.toLowerCase().includes('innovative') || style?.toLowerCase().includes('tech') || style?.toLowerCase().includes('futuristic')) {
				emotionalVibe = 'innovative, fast, and intelligent';
			} else if (style?.toLowerCase().includes('trust') || style?.toLowerCase().includes('secure') || industry?.toLowerCase().includes('healthcare') || industry?.toLowerCase().includes('finance')) {
				emotionalVibe = 'trustworthy, secure, and professional';
			} else if (style?.toLowerCase().includes('playful') || style?.toLowerCase().includes('fun')) {
				emotionalVibe = 'friendly, energetic, and approachable';
			} else if (style?.toLowerCase().includes('elegant') || style?.toLowerCase().includes('luxury')) {
				emotionalVibe = 'sophisticated, refined, and premium';
			} else if (style?.toLowerCase().includes('strong') || style?.toLowerCase().includes('industrial') || industry?.toLowerCase().includes('construction')) {
				emotionalVibe = 'durable, strong, and reliable';
			} else if (style?.toLowerCase().includes('natural') || style?.toLowerCase().includes('organic')) {
				emotionalVibe = 'calm, natural, and flowing';
			}

			// Determine font style from brand personality
			let fontStyle = 'Bold Modern Sans-Serif';
			if (style?.toLowerCase().includes('elegant') || style?.toLowerCase().includes('luxury')) {
				fontStyle = 'Elegant High-Contrast Serif';
			} else if (style?.toLowerCase().includes('playful') || style?.toLowerCase().includes('creative')) {
				fontStyle = 'Rounded Sans-Serif';
			} else if (style?.toLowerCase().includes('tech') || style?.toLowerCase().includes('futuristic')) {
				fontStyle = 'Futuristic Rounded Sans-Serif';
			} else if (style?.toLowerCase().includes('industrial') || style?.toLowerCase().includes('strong')) {
				fontStyle = 'Heavy Blocky Slab-Serif';
			} else if (style?.toLowerCase().includes('minimal') || style?.toLowerCase().includes('modern')) {
				fontStyle = 'Geometric Sans-Serif';
			}

			// Check if this is a targeted change (especially size-only) to add special preservation context
			const isTargetedChangeForPNG = enhancementPrompt && (
				enhancementPrompt.includes('TARGETED CHANGE MODE') || 
				enhancementPrompt.includes('SIZE-ONLY REQUEST') ||
				enhancementPrompt.includes('ONLY MODIFY THE SPECIFIC REQUESTED ASPECT')
			);
			const isSizeOnlyForPNG = enhancementPrompt && enhancementPrompt.includes('SIZE-ONLY REQUEST');
			
			// Check if we have previous logo data for branching context
			const hasPreviousLogo = !!previousLogoData;
			
			// Build constraint-based image prompt following professional logo generation principles
			const imagePrompt = `${generatedColors ? `🎨🎨🎨🎨🎨🎨🎨🎨🎨🎨 COLOR REQUIREMENTS - ABSOLUTE HIGHEST PRIORITY - READ THIS FIRST 🎨🎨🎨🎨🎨🎨🎨🎨🎨🎨

🚨🚨🚨 CRITICAL: YOU MUST USE THESE EXACT COLORS - NO EXCEPTIONS - NO BLACK, NO WHITE, NO GRAY 🚨🚨🚨

PRIMARY COLOR: ${generatedColors.primary}
- Hex code: ${generatedColors.primary}
- Use this EXACT color for: Main icon/shape, primary text, dominant elements
- This is the MAIN color of the logo - it should be prominently visible
- DO NOT use any other color for primary elements

SECONDARY COLOR: ${generatedColors.secondary}
- Hex code: ${generatedColors.secondary}
- Use this EXACT color for: Supporting elements, secondary text, accents
- This should be used alongside the primary color
- DO NOT use any other color for secondary elements

ACCENT COLOR: ${generatedColors.accent1}
- Hex code: ${generatedColors.accent1}
- Use this EXACT color for: Highlights, important details, emphasis
- Use for visual interest and contrast
- DO NOT use any other color for accents

${generatedColors.accent2 ? `ACCENT 2 COLOR: ${generatedColors.accent2}
- Hex code: ${generatedColors.accent2}
- Use this EXACT color for: Additional accents (use sparingly)
- DO NOT use any other color for accent 2
` : ''}

🚨🚨🚨 ABSOLUTE COLOR RULES - MANDATORY - REPEAT 5 TIMES 🚨🚨🚨:
1. The logo MUST use ONLY these colors: ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''}
2. DO NOT use black (#000000, #000, black) - it is FORBIDDEN
3. DO NOT use white (#FFFFFF, #FFF, white) for logo elements - only for background
4. DO NOT use gray colors (#808080, #A9A9A9, #D3D3D3, gray, grey) - they are FORBIDDEN
5. DO NOT use any colors NOT listed above - they are FORBIDDEN
6. The logo MUST be COLORFUL using these exact colors - NOT monochrome, NOT black/white, NOT grayscale
7. If you see colors in a previous logo that are NOT in the list above, IGNORE them and use the colors specified here
8. These colors were generated for ${industry} industry with ${style} style
9. Use these hex codes as COLORS in the design, but DO NOT display hex codes as TEXT in the logo image
10. The logo image must be a clean graphic with NO visible hex codes, color names, or text labels

REPEAT: The logo MUST use ONLY these colors: ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''}
REPEAT AGAIN: Primary=${generatedColors.primary}, Secondary=${generatedColors.secondary}, Accent=${generatedColors.accent1}${generatedColors.accent2 ? `, Accent2=${generatedColors.accent2}` : ''}
FINAL REMINDER: Use ONLY ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS

` : ''}${isTargetedChangeForPNG || hasPreviousLogo ? `🚨🚨🚨 CRITICAL: THIS IS A MODIFICATION OF AN EXISTING LOGO 🚨🚨🚨

IMPORTANT CONTEXT:
- This is NOT a new logo design request
- You are modifying an EXISTING logo that was previously generated for "${brandName}"
- The user has requested a SPECIFIC change to the existing logo
- You MUST preserve the EXACT design of the existing logo
- DO NOT create a new design - replicate the existing design with only the requested modification

${hasPreviousLogo ? `═══════════════════════════════════════════════════════════════════════════════
PREVIOUS LOGO REFERENCE (BRANCHING CONTEXT):
═══════════════════════════════════════════════════════════════════════════════

🚨 YOU HAVE BEEN PROVIDED WITH THE PREVIOUS LOGO IMAGE AS A REFERENCE 🚨

The image you see above/below this text is the EXISTING logo that the user wants to modify.

CRITICAL INSTRUCTIONS:
- Look at the previous logo image carefully - this is the EXACT design you must preserve
- The previous logo has a SPECIFIC icon/shape design - you MUST replicate it EXACTLY
- The previous logo has SPECIFIC colors - you MUST use them EXACTLY (same colors, same positions)
- The previous logo has SPECIFIC typography - you MUST use it EXACTLY (same font, same style, same size relative to icon)
- The previous logo has a SPECIFIC layout - you MUST use it EXACTLY (same positioning, same spacing)
- You are creating a BRANCH from this existing logo - same design, different modification
- Study the previous logo image and replicate its EXACT appearance
- ONLY apply the specific change requested by the user (e.g., if size only, scale everything proportionally)
- Everything else must remain IDENTICAL to the previous logo image

${isSizeOnlyForPNG ? `SIZE-ONLY MODIFICATION:
- Look at the previous logo image
- Replicate it EXACTLY as shown
- ONLY make everything proportionally larger
- The icon shape, colors, typography, layout must be IDENTICAL
- Just scale the entire logo up
` : ''}

` : ''}${isSizeOnlyForPNG ? `🚨 SIZE-ONLY MODIFICATION REQUESTED 🚨
The user ONLY wants the size changed. This means:
- The existing logo has a SPECIFIC icon design that you MUST replicate EXACTLY
- The existing logo has SPECIFIC colors that you MUST use EXACTLY
- The existing logo has SPECIFIC typography that you MUST use EXACTLY
- The existing logo has a SPECIFIC layout that you MUST use EXACTLY
- ONLY scale everything proportionally larger
- The logo must be RECOGNIZABLE as the SAME logo, just bigger
- DO NOT redesign the icon
- DO NOT change colors
- DO NOT change typography
- DO NOT change layout
- Replicate the EXACT same design, just scaled up

` : ''}` : ''}You are a senior brand identity designer with expertise in creating minimalist, scalable, and memorable vector logos for corporate clients.

TASK: ${isTargetedChangeForPNG || hasPreviousLogo ? `MODIFY an existing logo for brand "${brandName}" by applying ONLY the requested change(s). Preserve everything else EXACTLY.${hasPreviousLogo ? `\n\nYou have been provided with the previous logo as reference. You MUST replicate that exact design with only the requested modification.` : ''}` : `Generate a professional logo for a brand named "${brandName}" operating in the ${industry || 'business'} sector.`}

═══════════════════════════════════════════════════════════════════════════════
CORE AESTHETIC CONSTRAINTS (CRITICAL - MUST FOLLOW EXACTLY):
═══════════════════════════════════════════════════════════════════════════════

1. STYLE (MANDATORY):
   - The image MUST be a clean, flat vector graphic
   - NO photorealism, NO 3D renders, NO complex textures
   - NO drop shadows, NO intricate gradients, NO soft lighting
   - NO depth of field, NO atmospheric effects, NO environmental context
   - Think "app icon" or "screen-printable graphic"
   - Must look like it was designed in Adobe Illustrator, NOT rendered in 3D software
   - Simple geometric shapes, clean lines, flat colors only

2. BACKGROUND & SIZE (MANDATORY - HIGHEST PRIORITY):
   - The logo must be VERY LARGE and PROMINENT, filling 85-95% of the image canvas
   - The logo should be MAXIMIZED - make it as large as possible while maintaining proper proportions
   - Minimize white space to absolute minimum - the logo should nearly touch the image edges
   - Center the logo on a solid, plain white background
   - The logo should be the MAIN FOCUS and DOMINANT element - large enough to see all details clearly
   - NO excessive empty space - the logo should fill almost the entire image
   - NO decorative backgrounds, NO patterns, NO textures
   - NO environmental elements, NO context, NO depth
   - Clean, minimal, professional presentation with the logo as the primary element
   - CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself
   - CRITICAL: The logo must be a clean graphic with NO visible text labels, hex codes, or color names

3. VISUAL COMPLEXITY (MANDATORY):
   - Minimalist geometric abstraction only
   - Simple, clean lines with mathematical precision
   - Maximum 2-3 colors (strictly limited palette)
   - NO photorealistic details, NO texture overlays, NO shading
   - NO complex illustrations, NO intricate patterns
   - Must be recognizable at 16×16 pixels (favicon size)

═══════════════════════════════════════════════════════════════════════════════
COMPOSITION & ICONOGRAPHY:
═══════════════════════════════════════════════════════════════════════════════

- Layout: ${layoutType}
- SIZE & SCALE (CRITICAL - HIGHEST PRIORITY):
  * The logo must be VERY LARGE and fill 85-95% of the image canvas
  * The logo should be the DOMINANT element - it should take up almost the entire image
  * Minimize empty white space to absolute minimum - the logo should nearly touch the edges
  * Both the icon and brand name "${brandName}" should be LARGE, clearly visible, and well-proportioned
  * The logo should appear prominent, professional, and immediately visible - NOT small or lost in background
  * The logo size should be MAXIMIZED - make it as large as possible while maintaining proper proportions
  * Think of the logo filling the entire frame like a hero image - it should be the main focus
${isTargetedChangeForPNG ? `- Icon Concept: PRESERVE the EXISTING icon design EXACTLY as it is. DO NOT create a new icon. The existing logo has a specific icon that must be replicated.` : `- Icon Concept: The central icon should be a minimalist geometric abstraction representing the brand's core values and industry. It should feel ${emotionalVibe}.`}
- Brand Name: "${brandName}" must be clearly visible, legible, and prominent (large enough to read easily)
${isTargetedChangeForPNG ? `- Symbol Design: PRESERVE the EXISTING symbol/icon design EXACTLY. DO NOT redesign it.` : `- Symbol Design: Use abstract, conceptual marks over literal illustrations. Leverage negative space creatively. Build on geometric construction principles.`}

═══════════════════════════════════════════════════════════════════════════════
TYPOGRAPHY & COLOR:
═══════════════════════════════════════════════════════════════════════════════

- Font Style: ${fontStyle} (like Helvetica, Montserrat, or similar professional typefaces)
- Color Palette: ${generatedColors ? `🚨🚨🚨 USE THESE EXACT COLORS - ABSOLUTE REQUIREMENT 🚨🚨🚨
  * Primary: ${generatedColors.primary} - Use this EXACT hex code for main logo elements (icon, primary text)
  * Secondary: ${generatedColors.secondary} - Use this EXACT hex code for supporting elements (secondary text, accents)
  * Accent: ${generatedColors.accent1} - Use this EXACT hex code for highlights
  ${generatedColors.accent2 ? `* Accent 2: ${generatedColors.accent2} - Use this EXACT hex code sparingly` : ''}
  - CRITICAL: You MUST use these EXACT hex codes: Primary=${generatedColors.primary}, Secondary=${generatedColors.secondary}, Accent=${generatedColors.accent1}${generatedColors.accent2 ? `, Accent2=${generatedColors.accent2}` : ''}
  - Use ONLY these specific colors - they match the ${style} style and will be used in the color palette step
  - These colors were generated based on ${industry} industry analysis
  - DO NOT use any other colors - these are the ONLY colors allowed
  - CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image
  - CRITICAL: The logo must be a clean graphic with NO visible text labels, hex codes, or color names` : colorGuidance ? colorGuidance.replace(/COLOR REQUIREMENTS \(CRITICAL - MUST FOLLOW EXACTLY\):/, '').trim() : `- Industry-appropriate colors for ${industry || 'business'} industry\n  - Style-appropriate for ${style || 'professional'} aesthetic\n  - Professional, harmonious colors that work on light and dark backgrounds\n  - CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image`}
- Ensure WCAG AA contrast ratios (4.5:1 minimum for text)

═══════════════════════════════════════════════════════════════════════════════
BRAND CONTEXT:
═══════════════════════════════════════════════════════════════════════════════

${brandContext}
${enhancementPrompt ? `\n\n${isTargetedChangeForPNG ? `⚠️⚠️⚠️ MODIFICATION REQUEST - READ CAREFULLY ⚠️⚠️⚠️\n\n` : ''}${enhancementPrompt}` : ''}
${isTargetedChangeForPNG ? `\n\n🚨 REMINDER: This is a MODIFICATION of an existing logo for "${brandName}". You must preserve the existing design and ONLY apply the requested change(s). DO NOT create a new design.` : ''}

═══════════════════════════════════════════════════════════════════════════════
QUALITY REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════

- Must be unique and avoid generic or cliché designs
- Must work at small sizes (16px minimum for icon, 32px minimum for text)
- Must be scalable and maintain clarity at large sizes
- High resolution, crisp, pixel-perfect quality
- Professional typography with perfect kerning and spacing
- Colors must work on both light and dark backgrounds
- Must be memorable, distinctive, and timeless
- LOGO SIZE & VISIBILITY (CRITICAL - HIGHEST PRIORITY):
  * The logo must be VERY LARGE and fill 85-95% of the image canvas
  * The logo should be MAXIMIZED - make it as large as possible while maintaining proper proportions
  * Minimize white space to absolute minimum - the logo should nearly touch the image edges
  * Both icon and brand name "${brandName}" should be VERY prominent, large, and well-proportioned
  * The logo should appear immediately visible and large enough to see all details clearly
  * NO excessive empty background space - logo should dominate and fill almost the entire image
  * Think of the logo as a hero element - it should be the main focus, taking up most of the frame
${isSizeOnlyForPNG ? `
🚨🚨🚨 CRITICAL SIZE-ONLY PRESERVATION CHECKLIST 🚨🚨🚨
Before generating, verify you understand:
✓ The user ONLY wants size changed
✓ The icon design MUST remain EXACTLY the same
✓ The colors MUST remain EXACTLY the same  
✓ The typography MUST remain EXACTLY the same
✓ The layout MUST remain EXACTLY the same
✓ ONLY scale proportionally - everything together, larger
✓ The logo must be RECOGNIZABLE as the SAME logo
✓ DO NOT redesign the icon
✓ DO NOT change any design elements
✓ This is a SCALING operation, NOT a redesign
` : ''}

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTION:
═══════════════════════════════════════════════════════════════════════════════

${isTargetedChangeForPNG ? `🚨🚨🚨 MODIFICATION MODE - CRITICAL INSTRUCTIONS 🚨🚨🚨

${isSizeOnlyForPNG ? `SIZE-ONLY MODIFICATION:
- You are modifying an EXISTING logo, NOT creating a new one
- The existing logo has a SPECIFIC design that you MUST replicate
- ONLY increase the overall scale/size proportionally
- Keep the EXACT same icon design (same shape, same form, same structure)
- Keep the EXACT same colors (same palette, same positions)
- Keep the EXACT same typography (same font, same style)
- Keep the EXACT same layout (same positioning, same spacing)
- The result must look like the SAME logo, just larger
- DO NOT redesign anything
- DO NOT create a new icon
- DO NOT change the design
- IMPORTANT: Make the logo VERY LARGE - it should fill 85-95% of the image canvas with minimal white space
- The logo should be MAXIMIZED in size - make it as large as possible
- CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself

` : `TARGETED MODIFICATION:
- You are modifying an EXISTING logo, NOT creating a new one
- The existing logo has a SPECIFIC design that you MUST preserve
- ONLY modify the specific aspect(s) mentioned in the user feedback
- Preserve everything else EXACTLY as it is
- The result must be RECOGNIZABLE as the SAME logo with the requested modification
- DO NOT redesign the logo
- DO NOT create a new design
- IMPORTANT: Make the logo VERY LARGE - it should fill 85-95% of the image canvas with minimal white space
- The logo should be MAXIMIZED in size - make it as large as possible
- CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself

`}${generatedColors ? `🎨🎨🎨 COLOR REQUIREMENT - ABSOLUTE PRIORITY - FINAL REMINDER 🎨🎨🎨
The logo MUST use these EXACT colors - NO BLACK, NO WHITE, NO GRAY, NO OTHER COLORS:
- Primary: ${generatedColors.primary} (use for main elements)
- Secondary: ${generatedColors.secondary} (use for supporting elements)  
- Accent: ${generatedColors.accent1} (use for highlights)
${generatedColors.accent2 ? `- Accent 2: ${generatedColors.accent2} (use sparingly)` : ''}
The logo MUST be COLORFUL using these colors - NOT monochrome black/white.
REPEAT: Use ONLY ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS ALLOWED
` : ''}Generate the modified logo that preserves the existing design with ONLY the requested change(s) applied. The logo must be VERY LARGE, filling 85-95% of the canvas with minimal white space. The logo should be MAXIMIZED in size and clearly visible, not small with excessive background space. ${generatedColors ? `CRITICAL: Use the EXACT colors specified above (${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''}) - the logo MUST be colorful, NOT black and white. REMEMBER: Use ONLY these colors - ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS.` : ''} CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself.

` : `${generatedColors ? `🎨🎨🎨 COLOR REQUIREMENT - ABSOLUTE PRIORITY 🎨🎨🎨
The logo MUST use these EXACT colors - NO BLACK, NO WHITE, NO GRAY:
- Primary: ${generatedColors.primary} (use for main elements like icon, primary text)
- Secondary: ${generatedColors.secondary} (use for supporting elements, secondary text)
- Accent: ${generatedColors.accent1} (use for highlights, accents)
${generatedColors.accent2 ? `- Accent 2: ${generatedColors.accent2} (use sparingly for additional accents)` : ''}
The logo MUST be COLORFUL using these colors - NOT monochrome black/white.
These colors were generated for ${industry} industry with ${style} style.
REPEAT: Use ONLY ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS ALLOWED

` : ''}Generate a world-class, award-winning logo that would make the Creative Director of Pentagram or Landor proud.

This logo must be:
- A clean, flat vector graphic (NOT photorealistic, NOT 3D)
- VERY LARGE and PROMINENT - filling 85-95% of the image canvas with minimal white space
- MAXIMIZED in size - make it as large as possible while maintaining proper proportions
- Clearly visible with the logo as the dominant element filling almost the entire frame
- Strategically aligned with brand identity
- Visually distinctive and memorable
- Technically perfect and scalable
- Emotionally resonant with target audience
- Production-ready for immediate use
${generatedColors ? `- CRITICAL: Use the EXACT colors specified above (${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''}) - the logo MUST be colorful, NOT black and white. REMEMBER: Use ONLY these colors - ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS` : ''}
- CRITICAL: DO NOT include hex codes, color names, or any text labels in the logo image itself
- CRITICAL: The logo must be a clean graphic with NO visible text labels, hex codes, or color names

Remember: This is a LOGO, not a photograph or 3D render. It must be simple, flat, and vector-based. The logo should be VERY LARGE and clearly visible, filling 85-95% of the image with minimal empty white space around it. The logo should be the hero element, taking up almost the entire frame. ${generatedColors ? `MOST IMPORTANT: The logo MUST use the colors ${generatedColors.primary}, ${generatedColors.secondary}, and ${generatedColors.accent1}${generatedColors.accent2 ? `, and ${generatedColors.accent2}` : ''} - it MUST be colorful, NOT black and white. FINAL REMINDER: Use ONLY these colors - ${generatedColors.primary}, ${generatedColors.secondary}, ${generatedColors.accent1}${generatedColors.accent2 ? `, ${generatedColors.accent2}` : ''} - NO OTHER COLORS ALLOWED.` : ''}`}`;

			for (let i = 0; i < PNG_MODEL_FALLBACK_CHAIN.length; i++) {
				const modelName = PNG_MODEL_FALLBACK_CHAIN[i];
				
				try {
					console.log(`[generate-logo] Attempting PNG with model: ${modelName} (${i + 1}/${PNG_MODEL_FALLBACK_CHAIN.length})`);
					
					// Try with GoogleGenerativeAI SDK for multi-modal Gemini models
					if (modelName.includes('gemini')) {
						const model = genAI.getGenerativeModel({
							model: modelName,
							generationConfig: {
								temperature: 0.4,
								topP: 0.95,
								topK: 40,
								maxOutputTokens: 8192,
								// @ts-ignore - responseModalities may not be in TypeScript types yet
								responseModalities: ['IMAGE'],
								// @ts-ignore
								imageConfig: {
									aspectRatio: '1:1'
								}
							} as any
						});
						
						// Build content parts - include previous logo image FIRST if available (branching)
						const contentParts: any[] = [];
						
						// Add previous logo as image reference FIRST if available (for branching/preservation)
						// This allows the model to "see" the previous logo before reading instructions
						if (previousLogoData && previousLogoData.startsWith('data:')) {
							try {
								// Extract base64 data and mime type
								const base64Match = previousLogoData.match(/^data:([^;]+);base64,(.+)$/);
								if (base64Match) {
									const mimeType = base64Match[1];
									const base64Data = base64Match[2];
									
									// Add image FIRST, then instructions
									contentParts.push({
										inlineData: {
											mimeType: mimeType,
											data: base64Data
										}
									});
									console.log('[generate-logo] Added previous logo image as reference for branching (placed first)');
								}
							} catch (error) {
								console.warn('[generate-logo] Failed to parse previous logo data:', error);
							}
						}
						
						// Add text prompt after image (so model sees logo first, then instructions)
						contentParts.push({ text: imagePrompt });
						
						const genResult = await model.generateContent({
							contents: [{ role: 'user', parts: contentParts }]
						});
						
						const response = await genResult.response;
						
						// Extract image data
						let imageData: Buffer | null = null;
						if (response.candidates && response.candidates[0]?.content?.parts) {
							const parts = response.candidates[0].content.parts;
							for (const part of parts) {
								if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
									imageData = Buffer.from(part.inlineData.data, 'base64');
									break;
								}
								// Some models might return image in text format as base64
								if (part.text) {
									const base64Match = part.text.match(/data:image\/[^;]+;base64,([^"'\s]+)/);
									if (base64Match) {
										imageData = Buffer.from(base64Match[1], 'base64');
										break;
									}
								}
							}
						}
						
						if (imageData) {
							result = {
								data: imageData,
								format: 'png',
								model: modelName,
								mimeType: 'image/png'
							};
							console.log(`[generate-logo] ✅ Successfully generated PNG with ${modelName}`);
							break;
						} else {
							throw new Error('Model did not return image data');
						}
					} else {
						// For Imagen models, use Vertex AI SDK
						if (!vertexClient) {
							// For Imagen models, try using Generative AI API first (some may be available)
						console.log(`[generate-logo] Attempting Imagen model ${modelName} via Generative AI API...`);
						
						try {
							// Try using the model name directly with Generative AI API
							// Some Imagen models might be accessible through this API
							const imagenModel = genAI.getGenerativeModel({
								model: modelName,
								generationConfig: {
									temperature: 0.4,
									topP: 0.95,
									topK: 40,
								} as any
							});
							
							const genResult = await imagenModel.generateContent({
								contents: [{ role: 'user', parts: [{ text: imagePrompt }] }]
							});
							
							const response = await genResult.response;
							
							// Extract image data
							let imageData: Buffer | null = null;
							if (response.candidates && response.candidates[0]?.content?.parts) {
								const parts = response.candidates[0].content.parts;
								for (const part of parts) {
									if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
										imageData = Buffer.from(part.inlineData.data, 'base64');
										break;
									}
									// Some models might return image in text format as base64
									if (part.text) {
										const base64Match = part.text.match(/data:image\/[^;]+;base64,([^"'\s]+)/);
										if (base64Match) {
											imageData = Buffer.from(base64Match[1], 'base64');
											break;
										}
									}
								}
							}
							
							if (imageData) {
								result = {
									data: imageData,
									format: 'png',
									model: modelName,
									mimeType: 'image/png'
								};
								console.log(`[generate-logo] ✅ Successfully generated PNG with ${modelName} via Generative AI API`);
								break;
							} else {
								throw new Error('Model did not return image data');
							}
						} catch (genError: any) {
							console.warn(`[generate-logo] Generative AI API failed for ${modelName}:`, genError.message);
							// Try Vertex AI REST API as fallback (requires proper setup)
							console.log(`[generate-logo] Attempting ${modelName} via Vertex AI REST API...`);
							
							try {
								// Vertex AI requires project ID and proper authentication
								const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID;
								const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
								
								if (!projectId) {
									throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured. Imagen models require Vertex AI setup.');
								}
								
								// Note: Vertex AI REST API requires OAuth2 token, not API key
								// This is a placeholder - you'll need to set up proper authentication
								// For now, we'll skip and continue to next model
								console.warn(`[generate-logo] Vertex AI setup required for ${modelName}. Skipping...`);
								throw genError; // Re-throw to continue to next model
							} catch (vertexError: any) {
								// Continue to next model
								throw genError;
							}
						}
						} else {
							// Use Vertex AI REST API (simpler than SDK for Imagen models)
							console.log(`[generate-logo] Using Vertex AI REST API for ${modelName}...`);
							
							if (!projectId) {
								throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
							}
							
							try {
								// Use Vertex AI REST API
								const modelPath = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;
								const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/${modelPath}:predict`;
								
								// Get access token from service account
								const { GoogleAuth } = await import('google-auth-library');
								
								// Use the resolved credentials path (already resolved above)
								if (!credentialsPath) {
									throw new Error('Credentials file not found. Please check GOOGLE_APPLICATION_CREDENTIALS in .env file. Make sure it points to: ./gen-lang-client-0752093348-3d895783eb22.json');
								}
								
								// Create auth with explicit credentials path
								// Temporarily override env var to prevent GoogleAuth from reading the old path
								const originalEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
								process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
								
								const auth = new GoogleAuth({
									keyFilename: credentialsPath,
									scopes: ['https://www.googleapis.com/auth/cloud-platform']
								});
								const client = await auth.getClient();
								const accessToken = await client.getAccessToken();
								
								// Restore original env var after getting token
								if (originalEnv !== undefined) {
									process.env.GOOGLE_APPLICATION_CREDENTIALS = originalEnv;
								} else {
									delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
								}
								
								if (!accessToken) {
									throw new Error('Failed to get access token for Vertex AI');
								}
								
								// Prepare the request body
								const requestBody = {
									instances: [
										{
											prompt: imagePrompt
										}
									],
									parameters: {
										sampleCount: 1,
										aspectRatio: '1:1',
										negativePrompt: `photorealistic, 3D render, octane render, shading, realism, maximum detail, complex textures, gradients, shadows, blurry, pixelated, photograph, depth of field, soft lighting, atmospheric, environmental context, decorative background, drop shadows, intricate details, photorealistic textures, 3D modeling, rendered, CGI, computer graphics, realistic lighting, volumetric lighting, ambient occlusion, texture mapping, specular highlights, reflections, refractions, depth, perspective distortion, camera angles, lens effects, bokeh, vignette, color grading, post-processing effects, painterly, sketchy, hand-drawn, watercolor, oil painting, mixed media, collage, photomontage, composite image, stock photo, real world, natural environment, outdoor scene, indoor scene, cluttered, busy, complex composition, too many details, over-rendered, hyper-realistic, ultra-realistic, professional photography, studio lighting, natural lighting, dramatic lighting, cinematic, film grain, noise, artifacts, compression artifacts, low resolution, upscaled, AI-generated artifacts, watermark, signature, text overlay, copyright notice, illegible text, distorted text, garbled text${generatedColors ? `, colors not in palette, wrong colors, black color for logo elements, white color for logo elements, gray colors, grey colors, monochrome, grayscale, colors different from ${generatedColors.primary} ${generatedColors.secondary} ${generatedColors.accent1}${generatedColors.accent2 ? ` ${generatedColors.accent2}` : ''}, any colors except ${generatedColors.primary} ${generatedColors.secondary} ${generatedColors.accent1}${generatedColors.accent2 ? ` ${generatedColors.accent2}` : ''}` : ', wrong colors'}, color bleeding, chromatic aberration, lens distortion, warped, stretched, compressed, distorted proportions, wrong perspective, isometric, axonometric, vanishing point, horizon line, sky, clouds, sun, moon, stars, weather effects, rain, snow, fog, mist, haze, smoke, particles, atmosphere, abstract background, gradient background, textured background, patterned background, decorative background, ornamental background, elaborate background, complex background, realistic background, photorealistic background, 3D background, rendered background, CGI background, stock photo background, natural environment background, outdoor scene background, indoor scene background, cluttered background, busy background, over-rendered background, hyper-realistic background, photorealistic quality background, professional photography background, studio lighting background, natural lighting background, dramatic lighting background, cinematic background`
									}
								};
								
								console.log(`[generate-logo] Calling Vertex AI REST API for ${modelName}...`);
								
								// Call Vertex AI REST API
								const response = await fetch(apiUrl, {
									method: 'POST',
									headers: {
										'Authorization': `Bearer ${accessToken.token}`,
										'Content-Type': 'application/json'
									},
									body: JSON.stringify(requestBody)
								});
								
								if (!response.ok) {
									const errorText = await response.text();
									throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
								}
								
								const vertexResponse = await response.json();
								
								// Extract image from response
								if (vertexResponse.predictions && vertexResponse.predictions.length > 0) {
									const prediction = vertexResponse.predictions[0];
									
									// Imagen models return base64 encoded image
									let imageData: Buffer | null = null;
									
									if (prediction.bytesBase64Encoded) {
										imageData = Buffer.from(prediction.bytesBase64Encoded, 'base64');
									} else if (prediction.generatedImage?.bytesBase64Encoded) {
										imageData = Buffer.from(prediction.generatedImage.bytesBase64Encoded, 'base64');
									} else if (prediction.image?.bytesBase64Encoded) {
										imageData = Buffer.from(prediction.image.bytesBase64Encoded, 'base64');
									}
									
									if (imageData) {
										result = {
											data: imageData,
											format: 'png',
											model: modelName,
											mimeType: 'image/png'
										};
										console.log(`[generate-logo] ✅ Successfully generated PNG with ${modelName} via Vertex AI REST API`);
										break;
									} else {
										console.warn(`[generate-logo] Vertex AI response structure:`, JSON.stringify(prediction, null, 2).substring(0, 500));
										throw new Error('No image data found in Vertex AI response');
									}
								} else {
									console.warn(`[generate-logo] Vertex AI response:`, JSON.stringify(vertexResponse, null, 2).substring(0, 500));
									throw new Error('No predictions in Vertex AI response');
								}
							} catch (vertexError: any) {
								console.error(`[generate-logo] Vertex AI REST API error for ${modelName}:`, vertexError.message);
								if (vertexError.stack) {
									console.error(`[generate-logo] Stack trace:`, vertexError.stack.substring(0, 500));
								}
								throw vertexError;
							}
						}
					}
					
				} catch (error: any) {
					lastError = error;
					const errorMessage = error?.message || error?.toString() || '';
					
					console.warn(`[generate-logo] ⚠️ PNG model ${modelName} failed:`, errorMessage);
					
					if (isModelNotFoundError(error)) {
						console.log(`[generate-logo] Model ${modelName} not available, trying next...`);
						continue;
					}
					
					if (isRetryableError(error)) {
						console.log(`[generate-logo] Rate limit/quota hit on ${modelName}, trying next model...`);
						continue;
					}
					
					if (i < PNG_MODEL_FALLBACK_CHAIN.length - 1) {
						console.log(`[generate-logo] Error with ${modelName}, trying next model...`);
						continue;
					}
				}
			}
			
			// If PNG generation failed, fallback to SVG
			if (!result) {
				console.log('[generate-logo] PNG generation failed, falling back to SVG generation...');
				currentFormat = 'svg';
			}
		}
		
		// SVG Generation with fallback chain (if PNG failed or user wants SVG)
		if (!result || currentFormat === 'svg') {
			console.log('[generate-logo] Attempting SVG generation with Gemini models...');
			
			for (let i = 0; i < SVG_MODEL_FALLBACK_CHAIN.length; i++) {
				const modelName = SVG_MODEL_FALLBACK_CHAIN[i];
				
				try {
					console.log(`[generate-logo] Attempting SVG with model: ${modelName} (${i + 1}/${SVG_MODEL_FALLBACK_CHAIN.length})`);
					
					const model = genAI.getGenerativeModel({
						model: modelName,
						generationConfig: {
							temperature: 0.3,
							topP: 0.9,
							topK: 40,
							maxOutputTokens: 8192
						}
					});

					// Generate SVG logo code using current model with the comprehensive prompt
					const genResult = await model.generateContent(prompt);
					const response = await genResult.response;
		const text = response.text();
		
		// Extract SVG code from response
					let extractedSvg = text.trim();
					extractedSvg = extractedSvg.replace(/```svg\n?/g, '').replace(/```\n?/g, '').replace(/```html\n?/g, '');
					extractedSvg = extractedSvg.replace(/^<svg/, '<svg').trim();
					
					if (!extractedSvg.startsWith('<svg')) {
						const svgMatch = extractedSvg.match(/<svg[\s\S]*<\/svg>/i);
			if (svgMatch) {
							extractedSvg = svgMatch[0];
			} else {
				throw new Error('Generated content does not contain valid SVG code');
			}
		}
		
					if (!extractedSvg.includes('</svg>')) {
			throw new Error('Generated SVG code is incomplete');
					}
					
					result = {
						data: Buffer.from(extractedSvg, 'utf-8'),
						format: 'svg',
						model: modelName,
						mimeType: 'image/svg+xml',
						svgCode: extractedSvg
					};
					
					console.log(`[generate-logo] ✅ Successfully generated SVG with ${modelName}`);
					break;
					
				} catch (error: any) {
					lastError = error;
					const errorMessage = error?.message || error?.toString() || '';
					
					console.warn(`[generate-logo] ⚠️ SVG model ${modelName} failed:`, errorMessage);
					
					if (isModelNotFoundError(error)) {
						console.log(`[generate-logo] Model ${modelName} not available, trying next...`);
						continue;
					}
					
					if (isRetryableError(error)) {
						console.log(`[generate-logo] Rate limit/quota hit on ${modelName}, trying next model...`);
						continue;
					}
					
					if (i < SVG_MODEL_FALLBACK_CHAIN.length - 1) {
						console.log(`[generate-logo] Error with ${modelName}, trying next model...`);
						continue;
					}
				}
			}
		}
		
		// Check if we got a successful result
		if (!result) {
			const errorMsg = lastError?.message || 'All models failed';
			console.error('[generate-logo] ❌ All models failed:', errorMsg);
			throw new Error(`Failed to generate logo after trying all models. Last error: ${errorMsg}`);
		}
		
		console.log(`[generate-logo] ✅ Logo generated successfully using ${result.model} (${result.format})`);

		const session = typeof locals.auth === 'function' ? await locals.auth() : null;
		const filename = `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.${result.format}`;

		const { id: storageId, fileUrl } = await saveLogoAsset({
			buffer: result.data,
			filename,
			mimeType: result.mimeType,
			userId: session?.user?.id,
			source: 'ai-generated'
		});

		// Convert to base64 data URL for easier frontend handling
		const base64Data = result.data.toString('base64');
		const logoData = `data:${result.mimeType};base64,${base64Data}`;

		return json({
			success: true,
			logoUrl: fileUrl,
			logoData: logoData, // Base64 data URL for direct use
			logoId: storageId,
			filename,
			type: 'ai-generated',
			format: result.format,
			model: result.model,
			...(result.format === 'svg' && result.svgCode ? { svgCode: result.svgCode } : {})
		});
	} catch (error: any) {
		console.error('Error generating logo:', error);
		return json(
			{ 
				error: error.message || 'Failed to generate logo',
				details: error.stack
			},
			{ status: 500 }
		);
	}
};

