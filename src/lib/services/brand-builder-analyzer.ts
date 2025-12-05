import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';

// Initialize Gemini AI (lazy initialization)
// Note: This function is kept for backward compatibility but may not be used
function getGenAI(): GoogleGenerativeAI {
	const apiKey = env?.GOOGLE_GEMINI_API || '';
	if (!apiKey) {
		throw new Error('GOOGLE_GEMINI_API is not configured. Please set it in your .env file.');
	}
	return new GoogleGenerativeAI(apiKey);
}

export interface PromptAnalysisResult {
	brandName?: string;
	industry?: string;
	style?: string; // minimalistic, funky, futuristic, maximalistic, etc.
	audience?: string;
	description?: string;
	values?: string;
	hasCompleteInfo: boolean;
	missingFields: string[];
	extractedInfo: Record<string, any>;
}

/**
 * Analyze user's initial prompt to extract brand information
 * Uses 3-shot prompt approach with examples
 */
export async function analyzeBrandPrompt(userPrompt: string): Promise<PromptAnalysisResult> {
	try {
		// Get API key - check env object first, then process.env directly as fallback
		let apiKey = env?.GOOGLE_GEMINI_API || '';
		
		// If not found in env object, try process.env directly (in case .env wasn't loaded yet)
		if (!apiKey || apiKey.trim() === '') {
			if (typeof process !== 'undefined' && process.env) {
				// Try Google_Gemini_Api first (user's variable name)
				apiKey = process.env.Google_Gemini_Api || 
				         process.env.GOOGLE_GEMINI_API || 
				         process.env.GOOGLE_AI_API_KEY || '';
				
				if (apiKey) {
					// Clean the value (remove quotes and trim)
					apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
					console.log('[brand-builder-analyzer] ✓ Found API key in process.env directly');
				}
			}
		}
		
		// Final check
		if (!apiKey || apiKey.trim() === '') {
			// Debug: log what we found
			if (typeof process !== 'undefined' && process.env) {
				const foundKeys = Object.keys(process.env).filter(k => 
					k.toUpperCase().includes('GEMINI') || k.toUpperCase().includes('GOOGLE_AI')
				);
				console.error('[brand-builder-analyzer] API key not found. Searched keys:', foundKeys);
				console.error('[brand-builder-analyzer] env.GOOGLE_GEMINI_API value:', env?.GOOGLE_GEMINI_API || 'undefined/empty');
				console.error('[brand-builder-analyzer] process.env.Google_Gemini_Api:', process.env.Google_Gemini_Api || 'NOT FOUND');
			}
			throw new Error('Google Gemini API key is not configured. Please check your .env file and ensure Google_Gemini_Api is set correctly, then restart the dev server.');
		}
		
		// Use the API key directly instead of env object
		// Use gemini-2.0-flash
		const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = createAnalysisPrompt(userPrompt);

		let result;
		let response;
		let text;
		
		try {
			result = await model.generateContent(prompt);
			response = await result.response;
			text = response.text();
		} catch (apiError: any) {
			console.error('[brand-builder-analyzer] Gemini API error:', apiError);
			const errorMessage = apiError?.message || 'Unknown API error';
			
			// Provide more specific error messages
			if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key')) {
				throw new Error('Google Gemini API key is invalid. Please check your .env file and ensure Google_Gemini_Api is set correctly, then restart the dev server.');
			} else if (errorMessage.includes('QUOTA') || errorMessage.includes('quota')) {
				throw new Error('Google Gemini API quota exceeded. Please check your API usage limits.');
			} else if (errorMessage.includes('SAFETY') || errorMessage.includes('safety')) {
				throw new Error('Content was blocked by safety filters. Please try rephrasing your prompt.');
			} else {
				throw new Error(`Failed to analyze prompt: ${errorMessage}`);
			}
		}

		// Parse JSON response
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No valid JSON found in response');
			}

			const analysis: PromptAnalysisResult = JSON.parse(jsonMatch[0]);

			// Validate and determine missing fields
			const criticalFields = ['brandName', 'industry', 'style'];
			analysis.missingFields = criticalFields.filter(field => {
				const value = analysis[field as keyof PromptAnalysisResult];
				return !value || (typeof value === 'string' && value.trim() === '');
			});

			analysis.hasCompleteInfo = analysis.missingFields.length === 0;

			if (!analysis.extractedInfo) {
				analysis.extractedInfo = {};
			}

			// Fallback: Extract hex codes directly from user prompt if AI missed them
			// This ensures user-specified colors like #007BFF are always captured
			if (!analysis.extractedInfo.colors || analysis.extractedInfo.colors.length === 0) {
				const hexPattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
				const foundHexCodes = userPrompt.match(hexPattern);
				if (foundHexCodes && foundHexCodes.length > 0) {
					// Remove duplicates and map to color objects
					const uniqueHexCodes = [...new Set(foundHexCodes.map(h => h.toUpperCase()))];
					analysis.extractedInfo.colors = uniqueHexCodes.map((hex, index) => ({
						hex: hex,
						role: index === 0 ? 'primary' : index === 1 ? 'secondary' : index === 2 ? 'accent' : 'accent',
						context: 'extracted from user prompt',
						name: getColorNameFromHex(hex)
					}));
					console.log('[brand-builder-analyzer] Fallback: Extracted hex codes from prompt:', analysis.extractedInfo.colors);
				}
			}

			return analysis;
		} catch (parseError) {
			console.error('Failed to parse prompt analysis:', parseError);
			console.error('Raw response:', text);
			
			// Fallback
			return {
				hasCompleteInfo: false,
				missingFields: ['brandName', 'industry', 'style'],
				extractedInfo: {}
			};
		}
	} catch (error) {
		console.error('Error analyzing brand prompt:', error);
		throw new Error('Failed to analyze brand prompt. Please try again.');
	}
}

function createAnalysisPrompt(userPrompt: string): string {
	const promptLength = userPrompt.length;
	const isLongPrompt = promptLength > 200;
	const isShortPrompt = promptLength < 50;
	
	return `You are an expert brand analyst with deep understanding of brand guidelines creation. Your task is to perform a COMPREHENSIVE and DEEP analysis of the user's prompt, whether it's short or long.

ANALYSIS APPROACH:
${isLongPrompt ? `
This is a LONG prompt (${promptLength} characters). Perform DEEP analysis:
- Extract ALL mentioned information, even if subtle or implied
- Look for context clues and related information
- Identify patterns and connections between mentioned elements
- Extract industry-specific details, use cases, and requirements
- Note any brand values, mission, or vision statements
- Identify target demographics, psychographics, and user personas
- Extract style preferences, design directions, and aesthetic choices
- Look for technical requirements, platforms, or applications
- Extract ALL color mentions (hex codes, color names, RGB values)
- Extract ALL typography mentions (font names, font families, font weights)
- Extract logo preferences, iconography, imagery style
- Extract spacing, layout, or design system preferences
` : isShortPrompt ? `
This is a SHORT prompt (${promptLength} characters). Perform FOCUSED analysis:
- Extract every piece of information, no matter how small
- Look for implicit meanings and context
- Identify what can be inferred from the brand name itself
- Note any style keywords or industry hints
- Extract any audience indicators
- Look for color mentions (even single words like "blue", "red", hex codes)
- Look for font mentions (even generic terms like "sans-serif", "serif", specific font names)
` : `
This is a MEDIUM prompt (${promptLength} characters). Perform BALANCED analysis:
- Extract all explicit information
- Look for implicit context and connections
- Identify missing critical information
- Extract colors, typefaces, and design preferences mentioned
`}

CRITICAL EXTRACTION RULES:
1. Extract information that is EXPLICITLY mentioned
2. Also extract information that is CLEARLY IMPLIED from context
3. For brand names, analyze if they suggest industry or style (e.g., "TechFlow" suggests tech/SaaS)
4. Look for synonyms and related terms (e.g., "startup" = tech/SaaS, "app" = mobile/software)
5. For style, recognize: minimalistic, maximalistic, funky, futuristic, retro, vintage, playful, professional, bold, modern, classic, elegant, clean, vibrant, sophisticated, edgy, warm, cool, corporate, creative
6. Extract partial information even if incomplete (e.g., "tech company" even if specific industry unclear)
7. Identify use cases: website, mobile app, packaging, print, social media, etc.
8. Extract brand personality traits mentioned or implied

COLOR EXTRACTION (CRITICAL - MUST EXTRACT ALL):
- Extract ALL hex codes in format #RRGGBB or #RGB (e.g., #FF0000, #F00, #2E86AB, #264653)
- Extract RGB values in format rgb(255,0,0) or RGB(255,0,0) - convert to hex format
- Extract color names mentioned (blue, red, green, orange, yellow, purple, pink, black, white, gray, etc.)
- Extract color descriptions (bright blue, muted green, vibrant red, deep navy, etc.)
- Look for color combinations mentioned (e.g., "blue and yellow", "red, white, blue")
- Extract color preferences (monochrome, colorful, pastel, bold, vibrant, muted, etc.)
- Identify color roles if mentioned (primary, secondary, accent, neutral, background)
- Store in extractedInfo.colors as array: [{"hex": "#FF0000", "name": "red", "role": "primary", "context": "mentioned as primary color"}, ...]
- If only color names mentioned without hex, still extract: [{"name": "blue", "role": "primary", "context": "user wants blue"}]

TYPOGRAPHY EXTRACTION (CRITICAL - MUST EXTRACT ALL):
- Extract specific font names (Helvetica, Arial, Roboto, Inter, Montserrat, Open Sans, Lato, Poppins, etc.)
- Extract font families (sans-serif, serif, monospace, display, script, handwritten)
- Extract font weights mentioned (bold, light, regular, medium, thin, heavy, semibold, extrabold)
- Extract font styles (italic, oblique, normal)
- Extract font size mentions (12px, 14pt, large, small, etc.)
- Extract typography style preferences (modern, classic, playful, professional, elegant, etc.)
- Identify font usage if mentioned (headings, body, UI, display)
- Store in extractedInfo.typography as: {"primary": "Helvetica", "secondary": "Arial", "weights": ["bold", "regular"], "style": "modern", "usage": {"headings": "Helvetica", "body": "Arial"}}
- If only generic terms mentioned (sans-serif, serif), still extract: {"family": "sans-serif", "style": "modern"}

DESIGN ELEMENT EXTRACTION:
- Extract logo style preferences (icon, wordmark, combination, abstract, geometric, letterform, etc.)
- Extract iconography style (minimal, detailed, flat, 3D, outlined, filled, etc.)
- Extract imagery style (photography, illustration, abstract, geometric, etc.)
- Extract spacing/layout preferences (tight, spacious, grid-based, etc.)
- Extract any specific design requirements or constraints

FIELD-SPECIFIC EXTRACTION GUIDELINES:

brandName: Extract any company name, brand name, product name, or project name mentioned. If multiple, prioritize the main brand.

industry: Extract industry, sector, domain, or business type. Look for:
- Direct mentions: "SaaS", "healthcare", "fintech", "e-commerce"
- Indirect mentions: "startup" (often tech/SaaS), "app" (software/mobile), "retail" (e-commerce)
- Context clues: product type, service type, target market type

style: Extract aesthetic, design direction, or visual style. Look for:
- Direct style words: minimalistic, modern, bold, etc.
- Mood words: professional, playful, serious, friendly
- Design direction: clean, vibrant, sophisticated, edgy
- Color preferences: bright, muted, monochrome, colorful

audience: Extract target audience, customer base, or user personas. Look for:
- Demographics: age ranges, professions, locations
- Psychographics: lifestyles, interests, behaviors
- User types: professionals, students, consumers, businesses
- Market segments: B2B, B2C, enterprise, SMB

description: Extract brand description, mission, product description, or what the brand does.

values: Extract brand values, mission statement, vision, principles, or core beliefs.

EXAMPLES:

Example 1 - Long Detailed Prompt with Colors and Typography:
User: "I'm launching a fintech startup called 'WealthBridge'. I want a modern brand with primary color #2E86AB (blue), secondary color #F2C94C (yellow), and accent color #E76F51 (coral). Use Helvetica for headings and Arial for body text. Target audience is young professionals ages 25-40."
Analysis:
{
  "brandName": "WealthBridge",
  "industry": "Fintech",
  "style": "Modern / Professional",
  "audience": "Young professionals ages 25-40",
  "description": "Fintech startup",
  "values": null,
  "hasCompleteInfo": true,
  "missingFields": [],
  "extractedInfo": {
    "colors": [
      {"hex": "#2E86AB", "name": "blue", "role": "primary", "context": "primary color"},
      {"hex": "#F2C94C", "name": "yellow", "role": "secondary", "context": "secondary color"},
      {"hex": "#E76F51", "name": "coral", "role": "accent", "context": "accent color"}
    ],
    "typography": {
      "primary": "Helvetica",
      "secondary": "Arial",
      "usage": {"headings": "Helvetica", "body": "Arial"},
      "style": "modern"
    },
    "use_cases": ["fintech", "startup"],
    "platform": "digital"
  }
}

Example 2 - Short Prompt with Color Mention:
User: "Brand for PixelFarm, use blue and red colors"
Analysis:
{
  "brandName": "PixelFarm",
  "industry": null,
  "style": null,
  "audience": null,
  "description": null,
  "values": null,
  "hasCompleteInfo": false,
  "missingFields": ["industry", "style"],
  "extractedInfo": {
    "colors": [
      {"name": "blue", "role": "primary", "context": "user wants blue"},
      {"name": "red", "role": "secondary", "context": "user wants red"}
    ],
    "name_suggests": "design/creative/tech related (pixel suggests digital/design)"
  }
}

Example 3 - Medium Prompt with Typography:
User: "Create guidelines for 'GreenLeaf', an eco-friendly skincare brand. Use modern sans-serif fonts, preferably Inter or Roboto."
Analysis:
{
  "brandName": "GreenLeaf",
  "industry": "Skincare / Beauty / E-commerce",
  "style": "Natural / Organic / Modern",
  "audience": null,
  "description": "Eco-friendly skincare brand",
  "values": "Sustainability, eco-friendly",
  "hasCompleteInfo": true,
  "missingFields": [],
  "extractedInfo": {
    "typography": {
      "primary": "Inter",
      "secondary": "Roboto",
      "family": "sans-serif",
      "style": "modern",
      "preferences": ["Inter", "Roboto"]
    },
    "niche": "eco-friendly skincare",
    "brand_focus": "sustainability"
  }
}

Example 4 - Prompt with RGB Colors:
User: "Brand for TechFlow, colors: rgb(46, 134, 171) as primary, #F2C94C as secondary"
Analysis:
{
  "brandName": "TechFlow",
  "industry": "Tech / SaaS",
  "style": null,
  "audience": null,
  "description": null,
  "values": null,
  "hasCompleteInfo": false,
  "missingFields": ["style"],
  "extractedInfo": {
    "colors": [
      {"hex": "#2E86AB", "name": "blue", "role": "primary", "context": "rgb(46, 134, 171) converted to hex"},
      {"hex": "#F2C94C", "name": "yellow", "role": "secondary", "context": "secondary color"}
    ],
    "name_suggests": "tech/software related"
  }
}

NOW PERFORM DEEP ANALYSIS OF THIS PROMPT:
"${userPrompt}"

OUTPUT FORMAT (return ONLY valid JSON, no markdown, no code blocks):
{
  "brandName": "extracted brand name or null",
  "industry": "extracted industry or null",
  "style": "extracted style or null",
  "audience": "extracted target audience or null",
  "description": "extracted description or null",
  "values": "extracted values/mission or null",
  "hasCompleteInfo": true/false,
  "missingFields": ["array of missing critical field names"],
  "extractedInfo": {
    "colors": [{"hex": "#HEXCODE", "name": "color name", "role": "primary/secondary/accent/neutral", "context": "where mentioned"}, ...],
    "typography": {"primary": "font name", "secondary": "font name", "weights": ["bold", "regular"], "style": "description", "usage": {"headings": "font", "body": "font"}},
    "logo_style": "extracted logo style preferences",
    "iconography": "extracted iconography style",
    "imagery": "extracted imagery style",
    "any additional extracted information as key-value pairs"
  }
}

CRITICAL: Extract colors and typography even if mentioned briefly. If user says "use blue" or "Helvetica font", extract it. Return ONLY the JSON object, no additional text.`;
}

/**
 * Helper function to get a color name from a hex code using HSL analysis
 * Used as fallback when extracting colors directly from prompt
 * Purely algorithmic - no hardcoded color mappings
 */
function getColorNameFromHex(hex: string): string {
	// Remove # if present and convert to lowercase
	const cleanHex = hex.replace('#', '').toLowerCase();

	// Parse RGB values
	let r: number, g: number, b: number;
	if (cleanHex.length === 3) {
		r = parseInt(cleanHex[0] + cleanHex[0], 16);
		g = parseInt(cleanHex[1] + cleanHex[1], 16);
		b = parseInt(cleanHex[2] + cleanHex[2], 16);
	} else {
		r = parseInt(cleanHex.substring(0, 2), 16);
		g = parseInt(cleanHex.substring(2, 4), 16);
		b = parseInt(cleanHex.substring(4, 6), 16);
	}

	// Convert RGB to HSL
	const rNorm = r / 255;
	const gNorm = g / 255;
	const bNorm = b / 255;

	const max = Math.max(rNorm, gNorm, bNorm);
	const min = Math.min(rNorm, gNorm, bNorm);
	const lightness = (max + min) / 2;
	const delta = max - min;

	// Check for grayscale (very low saturation)
	if (delta < 0.08) {
		if (lightness > 0.95) return 'White';
		if (lightness < 0.08) return 'Black';
		if (lightness > 0.7) return 'Light Gray';
		if (lightness < 0.3) return 'Dark Gray';
		return 'Gray';
	}

	// Calculate hue (0-360 degrees)
	let hue = 0;
	if (max === rNorm) {
		hue = 60 * (((gNorm - bNorm) / delta) % 6);
	} else if (max === gNorm) {
		hue = 60 * (((bNorm - rNorm) / delta) + 2);
	} else {
		hue = 60 * (((rNorm - gNorm) / delta) + 4);
	}
	if (hue < 0) hue += 360;

	// Calculate saturation
	const saturation = delta / (1 - Math.abs(2 * lightness - 1));

	// Determine lightness prefix
	let lightnessPrefix = '';
	if (lightness > 0.75) lightnessPrefix = 'Light ';
	else if (lightness < 0.25) lightnessPrefix = 'Dark ';

	// Determine saturation prefix (for muted colors)
	let saturationPrefix = '';
	if (saturation < 0.3 && saturation >= 0.08) saturationPrefix = 'Muted ';

	// Determine base color name from hue angle
	let colorName: string;
	if (hue >= 0 && hue < 15) colorName = 'Red';
	else if (hue >= 15 && hue < 45) colorName = 'Orange';
	else if (hue >= 45 && hue < 70) colorName = 'Yellow';
	else if (hue >= 70 && hue < 150) colorName = 'Green';
	else if (hue >= 150 && hue < 180) colorName = 'Teal';
	else if (hue >= 180 && hue < 200) colorName = 'Cyan';
	else if (hue >= 200 && hue < 260) colorName = 'Blue';
	else if (hue >= 260 && hue < 290) colorName = 'Purple';
	else if (hue >= 290 && hue < 330) colorName = 'Magenta';
	else colorName = 'Red'; // 330-360

	return `${lightnessPrefix}${saturationPrefix}${colorName}`.trim();
}

