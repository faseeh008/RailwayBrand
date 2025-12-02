import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';

/**
 * Get vibe-specific color guidelines (shared between logo and color palette generation)
 */
export function getVibeColorGuidelines(style: string): string {
	const lowerStyle = style.toLowerCase();
	
	if (lowerStyle.includes('minimalistic') || lowerStyle.includes('minimal')) {
		return `MINIMALISTIC VIBE COLOR GUIDELINES (STRICT):
- Color Palette: Neutral, soft colors (white, black, greys, muted pastels). Very few colors to keep focus.
- Primary Colors: Muted, neutral tones. Soft blues, greys, or single accent color.
- Secondary Colors: Muted pastels, very subtle.
- Accent: Single, minimal accent color used sparingly.
- Neutrals: White, black, greys dominate the palette.
- Usage: Minimal color usage, focus on negative space and simplicity.`;
	}
	
	if (lowerStyle.includes('futuristic') || lowerStyle.includes('futur')) {
		return `FUTURISTIC VIBE COLOR GUIDELINES (STRICT):
- Color Palette: Bold neons, gradients, metallics, dark backgrounds with glowing accents (cyberpunk vibes).
- Primary Colors: Bold neons (cyan, electric blue, neon green), metallic sheens.
- Secondary Colors: Holographic purples, gradient combinations, tech-inspired colors.
- Accent: Neon green, cyberpunk colors, glowing accents on dark backgrounds.
- Neutrals: Deep space black, dark grays for backgrounds. Light gray for text on dark.
- Usage: Dark backgrounds with glowing neon accents. Tech-forward, cutting-edge feel.`;
	}
	
	if (lowerStyle.includes('funky') || lowerStyle.includes('playful') || lowerStyle.includes('fun')) {
		return `FUNKY VIBE COLOR GUIDELINES (STRICT):
- Color Palette: Bright, bold, contrasting colors. Often playful combinations that stand out.
- Primary Colors: Bright, bold colors (vibrant pinks, electric blues, bold yellows).
- Secondary Colors: Contrasting, playful combinations. Energetic and eye-catching.
- Accent: Standout colors that pop. High energy combinations.
- Neutrals: Used sparingly. Black and white for contrast and structure.
- Usage: Bold, contrasting combinations. Playful, energetic, memorable.`;
	}
	
	if (lowerStyle.includes('maximalistic') || lowerStyle.includes('maximal')) {
		return `MAXIMALISTIC VIBE COLOR GUIDELINES (STRICT):
- Color Palette: Rich, saturated, and sometimes clashing colors. Layered gradients, textures, and patterns.
- Primary Colors: Rich, saturated colors. Electric purples, vibrant pinks, bold statement colors.
- Secondary Colors: Layered with gradients and textures. Sometimes clashing for impact.
- Accent: Bold, saturated accent colors. Visually intense.
- Neutrals: Deep black, pure white. Used for text and structure.
- Usage: Rich, saturated colors with layered gradients and textures. Embrace color clashes. Visually intense.`;
	}
	
	// Default/Professional
	return `PROFESSIONAL VIBE COLOR GUIDELINES (STRICT):
- Color Palette: Balanced, trustworthy colors appropriate for the industry.
- Primary Colors: Industry-appropriate, professional tones.
- Secondary Colors: Complementary, supportive colors.
- Accent: Subtle accent for important elements.
- Neutrals: Professional grays, whites, blacks.
- Usage: Balanced, professional color application.`;
}

/**
 * Generate colors dynamically using AI based on industry, style, and extracted colors from uploaded logo
 * This ensures colors match between logo generation and color palette step
 */
export async function generateColorsForLogo(
	apiKey: string,
	brandName: string,
	industry: string,
	style: string,
	extractedColors?: any // BrandColorSystem from color extraction service
): Promise<{ primary: string; secondary: string; accent1: string; accent2?: string } | null> {
	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({
			model: 'gemini-2.0-flash',
			generationConfig: {
				temperature: 0.8,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 1000
			}
		});

		// Get vibe-specific color guidelines
		const vibeColorGuidelines = getVibeColorGuidelines(style);

		// Build extracted colors context if available
		let extractedColorsContext = '';
		if (extractedColors) {
			const primaryColors = extractedColors.primary || [];
			const secondaryColors = extractedColors.secondary || [];
			const accentColors = [...(extractedColors.neutrals || []), ...(extractedColors.background || [])];
			
			const allExtractedHex = [
				...primaryColors.map((c: any) => c.hex),
				...secondaryColors.map((c: any) => c.hex),
				...accentColors.map((c: any) => c.hex)
			].filter((hex, index, arr) => arr.indexOf(hex) === index); // Remove duplicates

			if (allExtractedHex.length > 0) {
				extractedColorsContext = `\n\n🎨 EXTRACTED COLORS FROM UPLOADED LOGO:
The user has uploaded a logo with these colors:
${allExtractedHex.map((hex, i) => `- Color ${i + 1}: ${hex}`).join('\n')}

CRITICAL: You MUST use these extracted colors as the foundation for your color palette. 
- Analyze these colors to understand the brand's existing color identity
- Use these colors as PRIMARY reference - they represent the actual brand colors from the uploaded logo
- Combine these extracted colors with ${industry} industry best practices and ${style} style guidelines
- If extracted colors don't align perfectly with industry standards, create a harmonious palette that bridges the extracted colors with industry-appropriate colors
- Generate colors that respect both the uploaded logo colors AND the ${industry} industry context`;
			}
		}

		const prompt = `You are a color design expert. Generate a color palette for "${brandName}" in the ${industry} industry with a ${style} aesthetic.${extractedColorsContext}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
${extractedColors ? `- CRITICAL: Use the extracted colors from the uploaded logo as the PRIMARY foundation for your color palette
- Analyze the extracted colors to understand the brand's existing color identity
- Combine extracted colors with ${industry} industry best practices and ${style} style guidelines
- Create a harmonious palette that respects both the uploaded logo colors AND industry context` : `- Colors MUST be generated COMPLETELY DYNAMICALLY based on ${industry} industry analysis FIRST
- Analyze the industry context to determine appropriate colors`}
- Style (${style}) should influence the color selection approach (e.g., minimalistic = more muted, maximalistic = more vibrant) but industry research is PRIMARY
- DO NOT use any hardcoded or predefined colors - generate colors based on real industry analysis
- Generate exactly 4 MANDATORY colors: Primary, Secondary, Accent 1, Accent 2
- All colors must include hex codes
- Return structured JSON only; no markdown

${vibeColorGuidelines}

CRITICAL GENERATION PROCESS:
${extractedColors ? `1. FIRST: Analyze the extracted colors from the uploaded logo to understand the brand's existing color identity
2. SECOND: Consider the industry context (${industry}) to determine appropriate colors that complement the extracted colors
3. THIRD: Let the ${style} style influence your color selection approach (minimalistic = muted, maximalistic = vibrant, etc.)
4. FOURTH: Generate colors that harmoniously combine the extracted logo colors with industry-appropriate colors
5. FIFTH: Ensure all colors are appropriate for the ${industry} industry while respecting the uploaded logo's color identity` : `1. FIRST: Consider the industry context (${industry}) to determine appropriate colors
2. SECOND: Let the ${style} style influence your color selection approach (minimalistic = muted, maximalistic = vibrant, etc.)
3. THIRD: Generate colors dynamically based on your analysis - DO NOT use predefined color palettes
4. FOURTH: Ensure all colors are appropriate for the ${industry} industry`}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "primary": "#HEXCODE",
  "secondary": "#HEXCODE",
  "accent1": "#HEXCODE",
  "accent2": "#HEXCODE"
}

Return ONLY this JSON object.`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text().trim();

		// Parse JSON from response
		let jsonText = text;
		// Remove markdown code blocks if present
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (jsonMatch) {
			jsonText = jsonMatch[1].trim();
		} else {
			// Try to extract JSON object
			const start = text.indexOf('{');
			const end = text.lastIndexOf('}');
			if (start !== -1 && end !== -1 && end > start) {
				jsonText = text.substring(start, end + 1);
			}
		}

		const colors = JSON.parse(jsonText);
		return {
			primary: colors.primary || '#000000',
			secondary: colors.secondary || '#666666',
			accent1: colors.accent1 || '#999999',
			accent2: colors.accent2
		};
	} catch (error) {
		console.error('[color-generation] Error generating colors:', error);
		// Return null to fall back to generic color guidance
		return null;
	}
}

