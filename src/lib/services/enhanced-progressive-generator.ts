import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { BrandGuidelinesInput } from '$lib/types/brand-guidelines';

// Initialize Gemini AI (lazy initialization)
function getGenAI(): GoogleGenerativeAI {
	const apiKey = env?.GOOGLE_GEMINI_API || '';
	if (!apiKey) {
		throw new Error('GOOGLE_GEMINI_API is not configured. Please set it in your .env file.');
	}
	return new GoogleGenerativeAI(apiKey);
}

export interface EnhancedGenerationRequest {
	step: string;
	brandName: string;
	industry: string;
	style: string; // minimalistic, funky, futuristic, etc.
	audience?: string;
	description?: string;
	values?: string;
	industrySpecificInfo?: Record<string, any>; // Additional info from industry questions
	previousSteps?: Partial<BrandGuidelinesInput>;
	feedback?: string;
	extractedColors?: string;
	extractedTypography?: string;
	logoColors?: { primary: string; secondary: string; accent1: string; accent2?: string }; // Colors from logo generation - MUST match
	groundingData?: {
		summary: string;
		keyFindings: string[];
		websites: Array<{ url: string; title: string; extractedFacts: string[] }>;
	};
}

/**
 * Generate enhanced progressive brand guidelines with industry + vibe awareness
 * Uses 3-shot prompt approach for each step
 */
export async function generateEnhancedProgressiveStep(
	request: EnhancedGenerationRequest
): Promise<{
	content: any;
	message: string;
}> {
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
					console.log('[enhanced-progressive-generator] ✓ Found API key in process.env directly');
				}
			}
		}
		
		// Final check
		if (!apiKey || apiKey.trim() === '') {
			console.error('[enhanced-progressive-generator] API key not found. env.GOOGLE_GEMINI_API:', env?.GOOGLE_GEMINI_API || 'undefined/empty');
			console.error('[enhanced-progressive-generator] process.env.Google_Gemini_Api:', typeof process !== 'undefined' && process.env ? process.env.Google_Gemini_Api || 'NOT FOUND' : 'process not available');
			throw new Error('Google Gemini API key is not configured. Please check your .env file and ensure Google_Gemini_Api is set correctly, then restart the dev server.');
		}
		
		// Use the API key directly instead of env object
		const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
			model: 'gemini-2.0-flash',
			generationConfig: {
				temperature: 0.8,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 4000
			}
		});

		const prompt = createEnhancedProgressivePrompt(request);
		const result = await model.generateContent(prompt);
		const response = await result.response;
		let text = response.text().trim();

		// For color-palette step, ensure we extract valid JSON
		if (request.step === 'color-palette') {
			// Try to extract JSON from the response (handle markdown code blocks, extra text, etc.)
			const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
			if (jsonMatch) {
				text = jsonMatch[1].trim();
			} else {
				// Try to find JSON object boundaries
				const firstBrace = text.indexOf('{');
				const lastBrace = text.lastIndexOf('}');
				if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
					text = text.substring(firstBrace, lastBrace + 1);
				}
			}
			
			// Validate that we have valid JSON with colors structure
			try {
				const parsed = JSON.parse(text);
				if (parsed && typeof parsed === 'object' && parsed.colors) {
					// Ensure required color fields exist
					if (!parsed.colors.primary || !parsed.colors.secondary || !parsed.colors.accent1 || !parsed.colors.accent2) {
						console.warn('[enhanced-progressive-generator] Color palette missing required colors, regenerating...');
						// Return the text as-is and let the UI handle it
						// The prompt should ensure all colors are present, but if not, we'll let it through
					}
					text = JSON.stringify(parsed); // Re-stringify to ensure clean JSON
				}
			} catch (parseError) {
				console.error('[enhanced-progressive-generator] Failed to parse color palette JSON:', parseError);
				console.error('[enhanced-progressive-generator] Raw text:', text.substring(0, 500));
				// Return as-is and let normalizeStepContent handle it
			}
		}

		return {
			content: text,
			message: 'Step generated successfully'
		};
	} catch (error) {
		console.error('Error generating enhanced progressive step:', error);
		throw new Error(`Failed to generate ${request.step} step. Please try again.`);
	}
}

function createEnhancedProgressivePrompt(request: EnhancedGenerationRequest): string {
	const { step, brandName, industry, style, audience, description, values, industrySpecificInfo, previousSteps, feedback, extractedColors, extractedTypography, groundingData } = request;

	// Build grounding data section if available
	const groundingSection = groundingData ? `
	
🔍 GROUNDING SEARCH DATA - REAL INDUSTRY INSIGHTS:
Based on analysis of ${groundingData.websites.length} leading websites in the ${industry} industry:

INDUSTRY SUMMARY:
${groundingData.summary}

KEY FINDINGS FROM INDUSTRY WEBSITES:
${groundingData.keyFindings.map((finding, i) => `${i + 1}. ${finding}`).join('\n')}

WEBSITES ANALYZED:
${groundingData.websites.map(w => `- ${w.title} (${w.url}): ${w.extractedFacts.slice(0, 3).join('; ')}`).join('\n')}

CRITICAL: Use these real-world industry insights to inform your brand guideline generation. These findings are based on actual analysis of successful brands in this industry. Reference these patterns and best practices when creating guidelines.
` : '';

	// Extract and build previous steps section from stepHistory
	const previousStepsSection = buildPreviousStepsSection(previousSteps);
	
	// Build context string - PRIORITY: Industry + Vibe are PRIMARY, everything else is secondary
	const contextInfo = `
🎯 PRIMARY DRIVERS (MANDATORY - NON-NEGOTIABLE):
- Industry: "${industry}" - This is the PRIMARY driver for ALL generation decisions
- Style/Vibe: "${style}" - This is the PRIMARY driver for ALL visual and messaging decisions
- Brand Name: "${brandName}" - Use this for personalization only

📋 SECONDARY CONTEXT (Use ONLY if it aligns with Industry + Vibe):
${audience ? `- Target Audience: "${audience}"` : ''}
${description ? `- Description: "${description}"` : ''}
${values ? `- Brand Values: "${values}"` : ''}
${industrySpecificInfo ? `- Industry-Specific Info: ${JSON.stringify(industrySpecificInfo)}` : ''}
${previousSteps?.short_description ? `- Previous Context: ${previousSteps.short_description}` : ''}
${previousStepsSection}
${groundingSection}
${feedback ? `\n\n🚨 USER FEEDBACK: "${feedback}"\nIMPORTANT: Incorporate this feedback ONLY if it aligns with ${industry} industry and ${style} vibe.` : ''}
`;

	// Get step-specific prompt
	// Common steps (first 5)
	if (step === 'brand-positioning') {
		return createBrandPositioningPrompt(contextInfo, brandName, industry, style, audience, description, values);
	}
	if (step === 'logo-guidelines') {
		return createLogoGuidelinesPrompt(contextInfo, brandName, industry, style);
	}
	if (step === 'color-palette') {
		return createColorPalettePrompt(contextInfo, brandName, industry, style, extractedColors, feedback, request.logoColors);
	}
	if (step === 'typography') {
		return createTypographyPrompt(contextInfo, brandName, industry, style, extractedTypography, feedback);
	}
	if (step === 'iconography') {
		return createIconographyPrompt(contextInfo, brandName, industry, style);
	}
	
	// Industry-specific steps - use generic handler which will adapt to industry
	// Photography and applications are now industry-specific, not always shown
	if (step === 'photography') {
		return createPhotographyPrompt(contextInfo, brandName, industry, style, previousSteps);
	}
	if (step === 'applications') {
		return createApplicationsPrompt(contextInfo, brandName, industry, style, industrySpecificInfo, previousSteps);
	}
	
	// All other industry-specific steps use generic handler
	return createGenericStepPrompt(contextInfo, step, brandName, industry, style);
}

function createBrandPositioningPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	audience?: string,
	description?: string,
	values?: string
): string {
	// Get vibe-specific messaging guidelines
	const vibeGuidelines = getVibeMessagingGuidelines(style);
	
	return `You are a brand strategy expert. Generate brand positioning content for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

${vibeGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- ALL content MUST be generated based on ${industry} industry FIRST
- Content MUST STRICTLY follow ${style} vibe messaging guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- All content must be SPECIFIC to "${brandName}" brand (use brand name for personalization only)
- Use user's exact inputs (description, values, audience) ONLY if they align with Industry + Vibe
- If user inputs conflict with Industry + Vibe, prioritize Industry + Vibe
- Keep descriptions brief - maximum 1-2 lines each

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic", Audience: "B2B Enterprise"
Output:
**Brand Positioning**: TechFlow empowers enterprise teams with streamlined workflow solutions, combining minimal design with powerful functionality.

**Mission**: To simplify complex business processes through intuitive, elegant software that enhances productivity without overwhelming users.

**Vision**: A world where enterprise software feels effortless, where every interaction is purposeful and every feature serves a clear need.

**Core Values**: 
- Simplicity over complexity
- User-centric design
- Transparent communication
- Continuous improvement

**Target Audience**: Enterprise decision-makers and operations teams seeking elegant, efficient solutions that integrate seamlessly into existing workflows.

**Voice & Tone**: Calm, clear, professional, concise. We communicate with clarity and purpose, avoiding unnecessary complexity while maintaining authority and expertise. Short sentences, precise words, focus on benefits rather than storytelling.

Example 2 - Gaming, Futuristic:
Brand: "NexusGames", Industry: "Gaming", Style: "Futuristic", Audience: "Tech enthusiasts"
Output:
**Brand Positioning**: NexusGames redefines interactive entertainment through cutting-edge technology and immersive gaming experiences that push the boundaries of what's possible.

**Mission**: To revolutionize human interaction with gaming technology, creating experiences that blend innovation with entertainment in ways never seen before.

**Vision**: A future where gaming transcends reality, where every player becomes part of an evolving digital universe powered by next-generation technology.

**Core Values**:
- Innovation and exploration
- Cutting-edge technology
- Progress and advancement
- Visionary thinking

**Target Audience**: Tech enthusiasts and early adopters who seek innovative, forward-thinking gaming experiences that showcase the latest in technology and design.

**Voice & Tone**: Visionary, innovative, confident. We use forward-looking statements and tech-focused language. Trendy, imaginative storytelling that explains possibilities rather than just products.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic", Audience: "Fashion-forward millennials"
Output:
**Brand Positioning**: VividStyle celebrates bold self-expression through vibrant, statement-making fashion that defies conventional boundaries.

**Mission**: To empower individuals to express their unique identity through fearless, colorful fashion choices that make a statement and celebrate creativity in all its forms.

**Vision**: A fashion landscape where boldness is celebrated, where every outfit tells a story and individuality shines through vibrant, expressive design.

**Core Values**:
- Bold self-expression
- Creative freedom
- Luxury and uniqueness
- Fearless boldness

**Target Audience**: Fashion-forward millennials and Gen Z who embrace vibrant colors, bold patterns, and statement pieces that reflect their unique personality and celebrate richness.

**Voice & Tone**: Bold, expressive, confident. We use strong adjectives and dramatic storytelling. Emphasize experience and lifestyle through detailed, emotional narratives that celebrate larger-than-life expression.

NOW GENERATE FOR:
${contextInfo}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT, NO BULLET POINTS):
{
  "step": "brand-positioning",
  "brand_name": "${brandName}",
  "positioning_statement": "[1-2 sentence positioning line tailored to ${industry} with ${style} tone]",
  "mission": "[1 sentence mission in ${style} tone]",
  "vision": "[1 sentence vision in ${style} tone]",
  "values": ["Value 1", "Value 2", "Value 3"],
  "target_audience": "[1-2 sentence audience summary]",
  "voice_and_tone": {
    "adjectives": ["trait 1", "trait 2", "trait 3"],
    "guidelines": "[1-2 sentence communication guidance]",
    "sample_lines": ["Short sample line 1", "Short sample line 2"]
  }
}

Return ONLY this JSON object.`;
}

function getVibeMessagingGuidelines(style: string): string {
	const lowerStyle = style.toLowerCase();
	
	if (lowerStyle.includes('minimalistic') || lowerStyle.includes('minimal')) {
		return `MINIMALISTIC VIBE MESSAGING GUIDELINES (STRICT):
- Tone of Voice: Calm, clear, professional, concise. No fluff.
- Content Style: Short sentences, precise words, focus on benefits rather than storytelling.
- Mission & Vision: Clear, direct, no exaggeration. Example: "To simplify how people manage their work"
- Values: Efficiency, clarity, honesty, simplicity.
- Impact: Feels high-end, premium, professional. Communicates trust, reliability, and sophistication.`;
	}
	
	if (lowerStyle.includes('futuristic') || lowerStyle.includes('futur')) {
		return `FUTURISTIC VIBE MESSAGING GUIDELINES (STRICT):
- Tone of Voice: Visionary, innovative, confident. Uses forward-looking statements.
- Content Style: Trendy, tech-focused, imaginative storytelling. Explains possibilities rather than just products.
- Mission & Vision: Emphasizes progress and innovation. Example: "To redefine human interaction with technology"
- Values: Innovation, exploration, cutting-edge, progress.
- Impact: Feels innovative and cutting-edge. Appeals to tech enthusiasts and early adopters. Positions brand as forward-thinking.`;
	}
	
	if (lowerStyle.includes('funky') || lowerStyle.includes('playful') || lowerStyle.includes('fun')) {
		return `FUNKY VIBE MESSAGING GUIDELINES (STRICT):
- Tone of Voice: Friendly, casual, humorous, full of personality.
- Content Style: Storytelling, informal copy, relatable jokes, social media-ready text.
- Mission & Vision: Expresses fun and engagement. Example: "To make everyday moments more colorful and exciting"
- Values: Creativity, fun, playfulness, inclusivity.
- Impact: Feels energetic, youthful, and approachable. Makes brand memorable and relatable. Strong social media appeal.`;
	}
	
	if (lowerStyle.includes('maximalistic') || lowerStyle.includes('maximal')) {
		return `MAXIMALISTIC VIBE MESSAGING GUIDELINES (STRICT):
- Tone of Voice: Bold, expressive, confident. Uses strong adjectives and storytelling.
- Content Style: Dramatic, emotional, detailed narratives. Emphasizes experience and lifestyle.
- Mission & Vision: Expressive and larger-than-life. Example: "To celebrate creativity in all its forms and empower expression"
- Values: Creativity, luxury, uniqueness, boldness.
- Impact: Feels extravagant, artistic, and attention-grabbing. Appeals to audiences who value richness and self-expression.`;
	}
	
	// Default/Professional
	return `PROFESSIONAL VIBE MESSAGING GUIDELINES (STRICT):
- Tone of Voice: Warm yet professional, empathetic and clear.
- Content Style: Balanced, informative, trustworthy communication.
- Mission & Vision: Clear, trustworthy, focused on value delivery.
- Values: Trust, integrity, professionalism, reliability.
- Impact: Feels trustworthy, reliable, and professional.`;
}

function createLogoGuidelinesPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string
): string {
	return `You are a logo design expert. Generate logo guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Logo concept MUST be generated based on ${industry} industry FIRST
- Logo concept MUST reflect ${style} style
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be specific to "${brandName}" brand (use brand name for personalization only)
- Professional and accurate

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Logo Concept**: A clean, geometric mark combining a simplified "T" and "F" in a single, flowing line. The design emphasizes negative space and simplicity, reflecting the brand's commitment to streamlined solutions.

**Variants**: 
- Full color (primary brand blue on white)
- Monochrome (black on white, white on dark)
- Icon only (simplified mark)
- Reversed (white on brand blue)

**Usage Rules**:
- Do not scale below 24px height
- Clearspace equals the height of the "T"
- Always maintain aspect ratio
- Use on solid backgrounds only
- Minimum size: 24px digital, 0.5" print

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Logo Concept**: A modern, trustworthy symbol combining a medical cross with a shield element, rendered in clean, professional typography. The design conveys trust, care, and medical expertise.

**Variants**:
- Full color (medical blue and white)
- Monochrome (dark blue on white)
- Icon only (medical cross-shield symbol)
- Reversed (white on medical blue)

**Usage Rules**:
- Do not scale below 32px height
- Clearspace equals the width of the cross element
- Maintain professional appearance at all sizes
- Use on clean, medical-appropriate backgrounds
- Minimum size: 32px digital, 0.75" print

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Logo Concept**: A bold, expressive wordmark with vibrant color combinations and dynamic typography. The design incorporates playful elements and bold patterns that reflect the brand's fearless approach to fashion.

**Variants**:
- Full color (vibrant multi-color palette)
- Monochrome (bold black on white)
- Icon only (abstract pattern mark)
- Reversed (white on vibrant backgrounds)

**Usage Rules**:
- Do not scale below 28px height
- Clearspace equals the height of the tallest letter
- Bold colors must maintain contrast
- Can be used on various backgrounds with proper contrast
- Minimum size: 28px digital, 0.6" print

NOW GENERATE FOR:
${contextInfo}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "logo-guidelines",
  "brand_name": "${brandName}",
  "concept": "[2 sentence description of concept tied to ${industry} and ${style}]",
  "variants": [
    { "name": "full_color", "description": "[usage note]" },
    { "name": "monochrome", "description": "[usage note]" },
    { "name": "icon_only", "description": "[usage note]" },
    { "name": "reversed", "description": "[usage note]" }
  ],
  "usage_rules": [
    "Rule 1",
    "Rule 2",
    "Rule 3"
  ],
  "clearspace": "[brief clearspace guidance]",
  "minimum_size": "[digital + print minimums]"
}

Return ONLY this JSON object.`;
}

function createColorPalettePrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	extractedColors?: string,
	feedback?: string,
	logoColors?: { primary: string; secondary: string; accent1: string; accent2?: string }
): string {
	// If we have logo colors (from logo generation), use those EXACT colors
	const logoColorsContext = logoColors
		? `\n\n🎨 LOGO COLORS (MANDATORY - USE THESE EXACT COLORS):\nThese colors were generated for the logo and MUST be used in the color palette:\n- Primary: ${logoColors.primary}\n- Secondary: ${logoColors.secondary}\n- Accent 1: ${logoColors.accent1}\n${logoColors.accent2 ? `- Accent 2: ${logoColors.accent2}\n` : ''}\n\nCRITICAL: You MUST use these EXACT hex codes in your color palette response. The logo and color palette MUST have identical colors.`
		: '';

	const colorContext = extractedColors && !logoColors
		? `\n\n🎨 EXTRACTED COLORS FROM LOGO:\n${extractedColors}\n\n⚠️ REFERENCE ONLY: Use these extracted colors as inspiration if they align with the ${industry} industry. Analyze the grounding search data to determine if these colors are appropriate for this industry.`
		: '';

	const feedbackContext = feedback
		? `\n\n🚨 USER FEEDBACK: "${feedback}"\nIncorporate this feedback while ensuring colors remain appropriate for the ${industry} industry.`
		: '';

	return `You are a color design expert. Generate a color palette for "${brandName}" in the ${industry} industry.

${contextInfo}${logoColorsContext}${colorContext}${feedbackContext}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
${logoColors ? `- CRITICAL: Use the EXACT colors provided above from logo generation (${logoColors.primary}, ${logoColors.secondary}, ${logoColors.accent1}${logoColors.accent2 ? `, ${logoColors.accent2}` : ''})
- These colors MUST match the logo exactly - same hex codes, same color values
- Generate color names, RGB values, and usage descriptions for these EXACT colors
- DO NOT generate different colors - use the provided hex codes exactly
- The logo and color palette MUST have identical colors - this is CRITICAL for brand consistency
- Generate exactly 4 MANDATORY colors: Primary, Secondary, Accent 1, Accent 2 (using the provided hex codes)
- Optionally generate 1 additional color if it enhances the palette for this specific industry
- All colors must include hex codes and rgb values
- Return structured JSON only; no markdown` : `- Colors MUST be generated COMPLETELY DYNAMICALLY based on ${industry} industry analysis FIRST
- Use the grounding search data to understand what colors successful brands in this industry actually use
- Analyze the industry context, target audience, and brand positioning to determine appropriate colors
- Style (${style}) should influence the color selection but NOT dictate specific colors - let industry research guide you
- DO NOT use any hardcoded or predefined colors - generate colors based on real industry analysis
- Generate exactly 4 MANDATORY colors: Primary, Secondary, Accent 1, Accent 2
- Optionally generate 1 additional color if it enhances the palette for this specific industry
- All colors must include hex codes and rgb values
- Return structured JSON only; no markdown
- Colors should be appropriate for the ${industry} industry based on real-world analysis from grounding data`}

${logoColors ? `CRITICAL GENERATION PROCESS (WHEN LOGO COLORS PROVIDED):
1. FIRST: Use the EXACT hex codes provided above from logo generation
2. SECOND: Generate appropriate color names for these hex codes based on their actual color values
3. THIRD: Calculate and provide accurate RGB values for these hex codes
4. FOURTH: Generate usage descriptions that explain how to use these colors effectively
5. FIFTH: Optionally add 1 additional color if it enhances the palette, but keep the 4 main colors EXACTLY as provided` : `CRITICAL GENERATION PROCESS:
1. FIRST: Analyze the grounding search data provided above to understand what colors successful brands in the ${industry} industry actually use
2. SECOND: Consider the industry context, target audience, and brand positioning from the context
3. THIRD: Let the ${style} style influence your color selection approach (e.g., minimalistic = more muted, maximalistic = more vibrant) but industry research is PRIMARY
4. FOURTH: Generate colors dynamically based on your analysis - DO NOT use predefined color palettes
5. FIFTH: Ensure all colors are appropriate for the ${industry} industry based on real-world analysis`}

EXAMPLE STRUCTURE (DO NOT COPY COLORS - USE AS FORMAT REFERENCE ONLY):
${logoColors ? `{
  "step": "color-palette",
  "brand_name": "[Brand Name]",
  "colors": {
    "primary": { "name": "[Color name for ${logoColors.primary}]", "hex": "${logoColors.primary}", "rgb": "[RGB values for ${logoColors.primary}]", "usage": "[Usage description]" },
    "secondary": { "name": "[Color name for ${logoColors.secondary}]", "hex": "${logoColors.secondary}", "rgb": "[RGB values for ${logoColors.secondary}]", "usage": "[Usage description]" },
    "accent1": { "name": "[Color name for ${logoColors.accent1}]", "hex": "${logoColors.accent1}", "rgb": "[RGB values for ${logoColors.accent1}]", "usage": "[Usage description]" },
    "accent2": { "name": "[Color name for ${logoColors.accent2 || 'accent2'}]", "hex": "${logoColors.accent2 || '#HEXCODE'}", "rgb": "[RGB values]", "usage": "[Usage description]" },
    "optional": { "name": "[Optional color name]", "hex": "#HEXCODE", "rgb": "[RGB values]", "usage": "[Usage description]" } OR null
  },
  "usage": {
    "backgrounds": "[Guidance for background color usage]",
    "text": "[Guidance for text color usage]",
    "buttons": "[Guidance for button color usage]",
    "gradients": ["Gradient tip 1", "Gradient tip 2"]
  },
  "contrast_guidelines": ["Contrast guideline 1", "Contrast guideline 2"]
}

⚠️ CRITICAL: The hex codes above (${logoColors.primary}, ${logoColors.secondary}, ${logoColors.accent1}${logoColors.accent2 ? `, ${logoColors.accent2}` : ''}) are the EXACT colors from logo generation. You MUST use these EXACT hex codes in your response.` : `{
  "step": "color-palette",
  "brand_name": "[Brand Name]",
  "colors": {
    "primary": { "name": "[Dynamically generated color name based on industry]", "hex": "#[Dynamically generated hex]", "rgb": "[Dynamically generated rgb]", "usage": "[Usage description]" },
    "secondary": { "name": "[Dynamically generated color name based on industry]", "hex": "#[Dynamically generated hex]", "rgb": "[Dynamically generated rgb]", "usage": "[Usage description]" },
    "accent1": { "name": "[Dynamically generated color name based on industry]", "hex": "#[Dynamically generated hex]", "rgb": "[Dynamically generated rgb]", "usage": "[Usage description]" },
    "accent2": { "name": "[Dynamically generated color name based on industry]", "hex": "#[Dynamically generated hex]", "rgb": "[Dynamically generated rgb]", "usage": "[Usage description]" },
    "optional": { "name": "[Dynamically generated color name based on industry]", "hex": "#[Dynamically generated hex]", "rgb": "[Dynamically generated rgb]", "usage": "[Usage description]" } OR null
  },
  "usage": {
    "backgrounds": "[Guidance for background color usage based on generated colors]",
    "text": "[Guidance for text color usage based on generated colors]",
    "buttons": "[Guidance for button color usage based on generated colors]",
    "gradients": ["Gradient tip 1", "Gradient tip 2"]
  },
  "contrast_guidelines": ["Contrast guideline 1", "Contrast guideline 2"]
}`}

NOW GENERATE FOR:
${contextInfo}${colorContext}${feedbackContext}

CRITICAL INSTRUCTIONS:
${logoColors ? `1. Use the EXACT hex codes provided above from logo generation: ${logoColors.primary}, ${logoColors.secondary}, ${logoColors.accent1}${logoColors.accent2 ? `, ${logoColors.accent2}` : ''}
2. Generate appropriate color names for these hex codes (e.g., analyze the hex code and create a descriptive name like "Vibrant Pink" for a pink color)
3. Calculate accurate RGB values for these hex codes
4. Generate usage descriptions that explain how to use these colors effectively for "${brandName}" in the ${industry} industry
5. Optionally add 1 additional color if it enhances the palette, but keep the 4 main colors EXACTLY as provided
6. The logo and color palette MUST have identical colors - this ensures brand consistency
7. DO NOT generate different colors - use the provided hex codes exactly` : `1. Analyze the grounding search data to understand what colors successful brands in the ${industry} industry actually use
2. Consider the industry context, target audience, and brand positioning
3. Style (${style}) should influence your color choices but industry research is PRIMARY
4. Generate exactly 4 MANDATORY colors: primary, secondary, accent1, accent2
5. Optionally add 1 additional color if it enhances the palette for this specific industry
6. All colors must be appropriate for the ${industry} industry based on real-world analysis
7. Use the grounding data insights to inform your color selection
8. DO NOT use any hardcoded colors - generate everything dynamically based on industry analysis`}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT, NO CODE BLOCKS):
{
  "step": "color-palette",
  "brand_name": "${brandName}",
  "colors": {
    "primary": { "name": "[Color name]", "hex": "${logoColors ? logoColors.primary : '#HEXCODE'}", "rgb": "R,G,B", "usage": "[Usage description]" },
    "secondary": { "name": "[Color name]", "hex": "${logoColors ? logoColors.secondary : '#HEXCODE'}", "rgb": "R,G,B", "usage": "[Usage description]" },
    "accent1": { "name": "[Color name]", "hex": "${logoColors ? logoColors.accent1 : '#HEXCODE'}", "rgb": "R,G,B", "usage": "[Usage description]" },
    "accent2": { "name": "[Color name]", "hex": "${logoColors ? (logoColors.accent2 || '#HEXCODE') : '#HEXCODE'}", "rgb": "R,G,B", "usage": "[Usage description]" },
    "optional": { "name": "[Color name]", "hex": "#HEXCODE", "rgb": "R,G,B", "usage": "[Usage description]" } OR null
  },
  "usage": {
    "backgrounds": "[Guidance for background color usage]",
    "text": "[Guidance for text color usage]",
    "buttons": "[Guidance for button color usage]",
    "gradients": ["Gradient tip 1", "Gradient tip 2"]
  },
  "contrast_guidelines": ["Contrast guideline 1", "Contrast guideline 2"]
}

CRITICAL JSON REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no code blocks, no backticks, no explanations
- The "colors" object MUST contain at minimum: primary, secondary, accent1, accent2
${logoColors ? `- CRITICAL: You MUST use these EXACT hex codes from logo generation:
  * primary: "${logoColors.primary}"
  * secondary: "${logoColors.secondary}"
  * accent1: "${logoColors.accent1}"
  ${logoColors.accent2 ? `* accent2: "${logoColors.accent2}"` : ''}
- These hex codes MUST match the logo exactly - do NOT generate different colors
- Generate appropriate color names, RGB values, and usage descriptions for these EXACT hex codes` : `- Each color object MUST have: "name" (string), "hex" (string starting with #), "rgb" (string like "R,G,B"), "usage" (string)`}
- The "optional" color can be null if not needed
- All hex codes must be valid (format: "#RRGGBB" where RR, GG, BB are hexadecimal values)
- All RGB values must be in format "R,G,B" (three comma-separated numbers from 0-255)

Return ONLY the JSON object above. Start with { and end with }. No other text before or after.`;
}

function createTypographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	extractedTypography?: string,
	feedback?: string
): string {
	const typographyContext = extractedTypography
		? `\n\n🔤 EXTRACTED TYPOGRAPHY FROM LOGO:\n${extractedTypography}\n\n⚠️ SECONDARY: Use this as reference ONLY if it aligns with ${style} vibe and ${industry} industry. If it conflicts, IGNORE it and generate typography based on Industry + Vibe ONLY.`
		: '';

	const feedbackContext = feedback
		? `\n\n🚨 USER FEEDBACK: "${feedback}"\n⚠️ SECONDARY: Incorporate this feedback ONLY if it aligns with ${industry} industry and ${style} vibe. Industry + Vibe take PRIORITY.`
		: '';

	// Get vibe-specific typography guidelines
	const vibeTypographyGuidelines = getVibeTypographyGuidelines(style);

	return `You are a typography expert. Generate typography guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${typographyContext}${feedbackContext}

${vibeTypographyGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Typography MUST be generated based on ${industry} industry FIRST
- Typography MUST STRICTLY follow ${style} vibe typography guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be SPECIFIC to "${brandName}" brand (not generic)
- Provide exact font names, weights, and usage examples
- If extracted typography or feedback conflicts with Industry + Vibe, IGNORE them
- font_hierarchy MUST include exactly 3 entries: H1, H2, and Body (all mandatory)
- H1 and H2 MUST use the primary_font, Body MUST use the secondary_font

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Primary Font**: Inter - Clean, modern sans-serif that embodies minimalism while maintaining excellent readability. Perfect for "${brandName}"'s streamlined approach to enterprise software.

**Supporting Font**: Roboto - Versatile, geometric sans-serif that complements Inter with its balanced proportions. Ideal for body text and UI elements.

**Font Hierarchy**:
- H1 (Display): Inter Bold, 48px/700 - Main headlines
- H2 (Heading): Inter SemiBold, 32px/600 - Section headers
- H3 (Subheading): Inter Medium, 24px/500 - Subsections
- Body: Roboto Regular, 16px/400 - Body text
- UI: Roboto Medium, 14px/500 - Buttons and labels

**Web Usage**: Load Inter and Roboto from Google Fonts. Use Inter for all headings and key messaging. Use Roboto for body text and UI elements.

**Print Usage**: Use Inter for headlines and Roboto for body text. Maintain consistent hierarchy with appropriate sizing for print media.

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Primary Font**: Source Sans Pro - Professional, highly readable sans-serif that conveys trust and medical authority. Perfect for "${brandName}"'s patient-focused healthcare approach.

**Supporting Font**: Open Sans - Warm, approachable sans-serif that maintains professionalism while feeling human and compassionate. Ideal for patient communications.

**Font Hierarchy**:
- H1 (Display): Source Sans Pro Bold, 44px/700 - Main headlines
- H2 (Heading): Source Sans Pro SemiBold, 28px/600 - Section headers
- H3 (Subheading): Source Sans Pro Regular, 20px/400 - Subsections
- Body: Open Sans Regular, 16px/400 - Body text and patient information
- UI: Open Sans SemiBold, 14px/600 - Medical forms and labels

**Web Usage**: Load Source Sans Pro and Open Sans from Google Fonts. Use Source Sans Pro for medical information and headers. Use Open Sans for patient-facing content.

**Print Usage**: Use Source Sans Pro for medical documents and Open Sans for patient materials. Ensure high readability with appropriate contrast.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Primary Font**: Poppins - Bold, expressive sans-serif with geometric character that matches "${brandName}"'s fearless fashion approach. Perfect for making bold statements.

**Supporting Font**: Montserrat - Versatile, modern sans-serif with distinctive character that complements Poppins. Ideal for supporting text and descriptions.

**Font Hierarchy**:
- H1 (Display): Poppins ExtraBold, 64px/800 - Bold headlines
- H2 (Heading): Poppins Bold, 40px/700 - Section headers
- H3 (Subheading): Poppins SemiBold, 28px/600 - Subsections
- Body: Montserrat Regular, 18px/400 - Body text
- UI: Montserrat Bold, 16px/700 - Buttons and labels

**Web Usage**: Load Poppins and Montserrat from Google Fonts. Use Poppins for all bold statements and headlines. Use Montserrat for body text and supporting content.

**Print Usage**: Use Poppins for fashion headlines and Montserrat for descriptions. Embrace bold sizing and expressive typography in print materials.

NOW GENERATE FOR:
${contextInfo}${typographyContext}${feedbackContext}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "typography",
  "brand_name": "${brandName}",
  "primary_font": "[Exact font name]",
  "primary_usage": "[1 sentence reason]",
  "secondary_font": "[Exact font name]",
  "secondary_usage": "[1 sentence reason]",
  "font_hierarchy": [
    { "label": "H1", "font": "[Primary font name - use primary_font]", "weight": "bold", "size": "48px" },
    { "label": "H2", "font": "[Primary font name - use primary_font]", "weight": "semibold", "size": "32px" },
    { "label": "Body", "font": "[Secondary font name - use secondary_font]", "weight": "regular", "size": "16px" }
  ],
  "web_usage": "[1-2 sentence guidance]",
  "print_usage": "[1-2 sentence guidance]"
}

CRITICAL REQUIREMENTS FOR font_hierarchy:
- MUST include exactly 3 entries: H1, H2, and Body (all three are MANDATORY)
- H1 and H2 MUST use the primary_font (same font as specified in primary_font field)
- Body MUST use the secondary_font (same font as specified in secondary_font field)
- Each entry MUST have: "label" (exact: "H1", "H2", or "Body"), "font" (exact font name), "weight" (e.g., "bold", "semibold", "regular"), "size" (e.g., "48px", "32px", "16px")
- Font names in font_hierarchy MUST match exactly the font names in primary_font and secondary_font fields
- Sizes should be appropriate: H1 typically 40-64px, H2 typically 28-40px, Body typically 14-18px
- Weights should be appropriate: H1 typically "bold" (700), H2 typically "semibold" (600), Body typically "regular" (400)

Return ONLY this JSON object.`;
}

function createIconographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string
): string {
	// Get vibe-specific iconography guidelines
	const vibeIconGuidelines = getVibeIconGuidelines(style);

	return `You are an iconography expert. Generate icon guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

${vibeIconGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Icon style MUST be generated based on ${industry} industry FIRST
- Icon style MUST STRICTLY follow ${style} vibe iconography guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Icons must be SPECIFIC to ${industry} industry
- Must be relevant to "${brandName}" brand (use brand name for personalization only)
- Provide AT LEAST 16 required icon glyphs (ideal range: 16-20 unique icons covering real product/service use-cases)

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Icon Style**: Minimal line icons with rounded corners, 2px stroke weight. Clean, geometric shapes that match the brand's streamlined aesthetic.

**Source Recommendation**: Lucide Icons or custom SVG - Both support the minimal, clean style needed for "${brandName}".

**Required Glyphs**:
- dashboard (main navigation)
- users (team management)
- settings (configuration)
- bell (notifications)
- search (global search)
- file-text (documents)
- calendar (scheduling)
- zap (quick actions)

**Usage Guidelines**: Use 24px base size with 2px stroke. Maintain consistent rounded corners and spacing. Icons should feel integrated with the minimal design system.

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Icon Style**: Professional medical icons with clear, recognizable shapes. Slightly rounded for approachability, 2.5px stroke weight for clarity.

**Source Recommendation**: Custom SVG or Medical Icon Library - Ensures appropriate medical iconography for "${brandName}".

**Required Glyphs**:
- stethoscope (medical services)
- heart (health and wellness)
- calendar-check (appointments)
- user-md (doctors)
- pill (medications)
- hospital (facilities)
- activity (health tracking)
- shield (protection and trust)

**Usage Guidelines**: Use 28px base size with 2.5px stroke. Maintain medical accuracy and professional appearance. Icons should convey trust and care.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Icon Style**: Bold, expressive icons with vibrant fills and dynamic shapes. Thicker strokes (3px) and playful elements that match the brand's fearless aesthetic.

**Source Recommendation**: Custom SVG - Allows for unique, brand-specific iconography that matches "${brandName}"'s bold style.

**Required Glyphs**:
- shopping-bag (purchases)
- heart (favorites)
- star (ratings)
- tag (products)
- sparkles (special items)
- user (profile)
- search (product search)
- gift (promotions)

**Usage Guidelines**: Use 32px base size with 3px stroke or filled styles. Embrace bold colors and expressive shapes. Icons should feel energetic and vibrant.

NOW GENERATE FOR:
${contextInfo}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "iconography",
  "brand_name": "${brandName}",
  "style": "[2 sentence style description]",
  "source": { "library": "[lucide|custom|iconify]", "reason": "[why]" },
  "icons": [
    { "name": "icon-one", "description": "[usage]" },
    { "name": "icon-two", "description": "[usage]" },
    "... minimum of 16 total entries ..."
  ],
  "usage_guidelines": [
    "Guideline 1",
    "Guideline 2"
  ],
  "grid": "[e.g., 24px grid, 2px stroke]"
}

Return ONLY this JSON object.`;
}

function createPhotographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	previousSteps?: any
): string {
	// Get vibe-specific imagery guidelines
	const vibeImageryGuidelines = getVibeImageryGuidelines(style);
	const previousStepsSection = buildPreviousStepsSection(previousSteps);

	return `You are a photography style expert. Generate photography guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

${vibeImageryGuidelines}
${previousStepsSection}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Photography style MUST be generated based on ${industry} industry FIRST
- Photography style MUST STRICTLY follow ${style} vibe imagery guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be specific to "${brandName}" brand (use brand name for personalization only)
- MUST maintain consistency with previously established brand elements (colors, typography, logo) if provided above

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Photo Style**: Clean, uncluttered workspaces with natural lighting. Minimal backgrounds, focus on people and technology. Soft, professional tones.

**Patterns & Textures**: Subtle geometric patterns, clean lines, minimal textures. Focus on negative space and simplicity.

**Stock Search Keywords**: "minimalist workspace", "modern office", "clean technology", "professional team", "minimal design", "contemporary office"

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Photo Style**: Warm, trustworthy medical environments. Natural lighting, compassionate moments, professional medical settings. Calming, professional tones.

**Patterns & Textures**: Soft medical patterns, clean clinical environments, warm textures. Focus on trust and care.

**Stock Search Keywords**: "professional healthcare", "compassionate medical care", "modern hospital", "trusted doctor", "patient care", "medical professionalism"

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Photo Style**: Bold, vibrant fashion photography with dynamic compositions. High energy, colorful backgrounds, expressive models. Vibrant, saturated tones.

**Patterns & Textures**: Bold patterns, vibrant textures, dynamic compositions. Focus on energy and expression.

**Stock Search Keywords**: "vibrant fashion", "bold style", "colorful fashion photography", "expressive models", "dynamic fashion", "maximalist style"

NOW GENERATE FOR:
${contextInfo}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "photography",
  "brand_name": "${brandName}",
  "style": "[2-3 sentence description]",
  "patterns_textures": ["Pattern 1", "Pattern 2"],
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}

Return ONLY this JSON object.`;
}

function createApplicationsPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	industrySpecificInfo?: Record<string, any>,
	previousSteps?: any
): string {
	const industryContext = industrySpecificInfo
		? `\n\n⚠️ SECONDARY CONTEXT:\n${JSON.stringify(industrySpecificInfo)}\n\nUse this information ONLY if it aligns with ${industry} industry and ${style} vibe. Industry + Vibe take PRIORITY.`
		: '';

	const previousStepsSection = buildPreviousStepsSection(previousSteps);
	
	return `You are a brand application expert. Generate application guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${industryContext}
${previousStepsSection}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Applications MUST be generated based on ${industry} industry FIRST
- Applications MUST reflect ${style} style
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be relevant to "${brandName}" brand (use brand name for personalization only)
- MUST maintain consistency with previously established brand elements (colors, typography, logo) if provided above

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Web Application**: Clean dashboard interface with minimal UI elements. Focus on functionality and user experience. Use brand colors sparingly for key actions.

**Mobile App**: Streamlined mobile experience with touch-friendly minimal design. Maintain brand consistency across all screen sizes.

**Marketing Website**: Minimal landing pages with clear value propositions. Use white space effectively and focus on key messaging.

**Sales Materials**: Clean presentation templates with minimal design. Professional, focused on product benefits.

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Patient Portal**: Trustworthy, accessible interface with clear medical information. Professional design that builds confidence.

**Medical Forms**: Clean, easy-to-read forms with professional styling. Ensure accessibility and clarity for all patients.

**Marketing Materials**: Professional healthcare marketing with compassionate messaging. Build trust through consistent brand application.

**Clinic Signage**: Clear, professional signage that guides patients. Maintain brand consistency in physical spaces.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**E-commerce Website**: Bold, vibrant product pages with dynamic layouts. Showcase fashion items with energy and style.

**Social Media**: Expressive social media templates with bold colors and patterns. Match the brand's fearless aesthetic.

**Lookbook**: Dynamic fashion lookbook with vibrant photography and bold typography. Celebrate the brand's maximalist approach.

**Packaging**: Bold, eye-catching packaging that makes a statement. Use vibrant colors and expressive design.

NOW GENERATE FOR:
${contextInfo}${industryContext}

FORMAT AS VALID JSON (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "applications",
  "brand_name": "${brandName}",
  "applications": [
    { "name": "Application 1", "description": "[1 sentence use case]" },
    { "name": "Application 2", "description": "[1 sentence use case]" },
    { "name": "Application 3", "description": "[1 sentence use case]" },
    { "name": "Application 4", "description": "[1 sentence use case]" }
  ],
  "priorities": ["Priority 1", "Priority 2"]
}

Return ONLY this JSON object.`;
}

function createGenericStepPrompt(
	contextInfo: string,
	step: string,
	brandName: string,
	industry: string,
	style: string
): string {
return `Generate ${step} content for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

CRITICAL REQUIREMENTS:
- Content must be SPECIFIC to "${brandName}" brand
- Must reflect ${style} style
- Must be appropriate for ${industry} industry
- MUST maintain consistency with previously established brand elements (colors, typography, logo guidelines) if they were provided above
- Professional and accurate
- Keep descriptions brief - maximum 1-2 lines each
- If previous steps established colors, typography, or logo guidelines, ensure this ${step} step aligns with and complements those elements

FORMAT OUTPUT AS VALID JSON ONLY (NO MARKDOWN, NO EXTRA TEXT):
{
  "step": "${step}",
  "brand_name": "${brandName}",
  "sections": [
    { "title": "Section 1", "description": "[1-2 sentences]" },
    { "title": "Section 2", "description": "[1-2 sentences]" }
  ]
}

Return ONLY this JSON object.`;
}

/**
 * Build a section that extracts and summarizes information from previous steps
 * This helps industry-specific steps maintain consistency with previously generated content
 */
function buildPreviousStepsSection(previousSteps: any): string {
	if (!previousSteps?.stepHistory || !Array.isArray(previousSteps.stepHistory)) {
		return '';
	}

	const approvedSteps = previousSteps.stepHistory.filter((s: any) => s.approved && s.content);
	
	if (approvedSteps.length === 0) {
		return '';
	}

	const stepSummaries: string[] = [];

	for (const step of approvedSteps) {
		const stepId = step.step || '';
		const content = step.content || '';
		const title = step.title || stepId;

		let summary = '';

		// Extract specific information based on step type
		if (stepId === 'color-palette') {
			// Extract colors from content
			const colors: string[] = [];
			
			// Try to extract from JSON format
			try {
				const parsed = typeof content === 'string' ? JSON.parse(content) : content;
				if (parsed?.colors) {
					if (parsed.colors.primary?.hex) colors.push(`Primary: ${parsed.colors.primary.hex}`);
					if (parsed.colors.secondary?.hex) colors.push(`Secondary: ${parsed.colors.secondary.hex}`);
					if (parsed.colors.accent1?.hex) colors.push(`Accent 1: ${parsed.colors.accent1.hex}`);
					if (parsed.colors.accent2?.hex) colors.push(`Accent 2: ${parsed.colors.accent2.hex}`);
				}
			} catch (e) {
				// If not JSON, try to extract hex codes from text
				const hexMatches = content.match(/#[0-9A-Fa-f]{6}/g);
				if (hexMatches && hexMatches.length > 0) {
					colors.push(...hexMatches.slice(0, 4).map((h: string) => `Color: ${h}`));
				}
			}
			
			summary = colors.length > 0 
				? `Colors established: ${colors.join(', ')}`
				: 'Color palette defined';
		} else if (stepId === 'typography') {
			// Extract typography information
			const fonts: string[] = [];
			
			try {
				const parsed = typeof content === 'string' ? JSON.parse(content) : content;
				if (parsed?.primary_font?.name) fonts.push(`Primary: ${parsed.primary_font.name}`);
				if (parsed?.secondary_font?.name) fonts.push(`Secondary: ${parsed.secondary_font.name}`);
				if (parsed?.supporting_font?.name) fonts.push(`Supporting: ${parsed.supporting_font.name}`);
			} catch (e) {
				// Try to extract font names from text
				const fontMatches = content.match(/(?:primary|main).*?font[:\s]+([A-Za-z\s]+)/i);
				if (fontMatches) fonts.push(`Primary: ${fontMatches[1].trim()}`);
			}
			
			summary = fonts.length > 0
				? `Typography established: ${fonts.join(', ')}`
				: 'Typography guidelines defined';
		} else if (stepId === 'logo-guidelines') {
			summary = 'Logo guidelines and usage rules established';
		} else if (stepId === 'brand-positioning') {
			summary = 'Brand positioning, mission, and values established';
		} else if (stepId === 'iconography') {
			summary = 'Iconography style and guidelines established';
		} else {
			// For other steps, just indicate they were generated
			summary = `${title} guidelines established`;
		}

		stepSummaries.push(`- **${title}**: ${summary}`);
	}

	if (stepSummaries.length === 0) {
		return '';
	}

	return `
📚 PREVIOUSLY ESTABLISHED BRAND ELEMENTS:
${stepSummaries.join('\n')}

CRITICAL: When generating this step's content, ensure it aligns with and complements the previously established brand elements above. Reference the colors, typography, logo guidelines, and other elements that were already defined. Maintain visual and messaging consistency throughout all brand guidelines.
`;
}

// Helper functions for vibe-specific guidelines

function getVibeColorGuidelines(style: string): string {
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

function getVibeTypographyGuidelines(style: string): string {
	const lowerStyle = style.toLowerCase();
	
	if (lowerStyle.includes('minimalistic') || lowerStyle.includes('minimal')) {
		return `MINIMALISTIC VIBE TYPOGRAPHY GUIDELINES (STRICT):
- Typeface: Clean, sans-serif fonts (like Helvetica, Open Sans, or Roboto). Minimal decorative fonts.
- Font Characteristics: Clean lines, excellent readability, geometric simplicity.
- Usage: Simple hierarchy, clear roles (display, heading, body, UI). Minimal font variations.
- Weights: Limited weights (Regular, Medium, Bold). Avoid excessive variation.
- Impact: Feels high-end, premium, professional. Communicates clarity and sophistication.`;
	}
	
	if (lowerStyle.includes('futuristic') || lowerStyle.includes('futur')) {
		return `FUTURISTIC VIBE TYPOGRAPHY GUIDELINES (STRICT):
- Typeface: Sleek, modern sans-serifs, sometimes angular or geometric fonts. Digital-inspired fonts for headings.
- Font Characteristics: Angular, geometric, tech-forward. Digital and modern feel.
- Usage: Bold display fonts for headlines. Tech-inspired typography. Digital aesthetic.
- Weights: Bold weights for impact. Modern, forward-looking typography.
- Impact: Feels innovative and cutting-edge. Positions brand as forward-thinking and high-tech.`;
	}
	
	if (lowerStyle.includes('funky') || lowerStyle.includes('playful') || lowerStyle.includes('fun')) {
		return `FUNKY VIBE TYPOGRAPHY GUIDELINES (STRICT):
- Typeface: Handwritten or quirky fonts, bold display fonts, fun typography with personality.
- Font Characteristics: Playful, expressive, full of character. Hand-drawn or quirky styles.
- Usage: Bold display fonts for headlines. Playful, expressive typography. Personality-driven.
- Weights: Bold, expressive weights. Fun, energetic typography.
- Impact: Feels energetic, youthful, and approachable. Makes brand memorable and relatable.`;
	}
	
	if (lowerStyle.includes('maximalistic') || lowerStyle.includes('maximal')) {
		return `MAXIMALISTIC VIBE TYPOGRAPHY GUIDELINES (STRICT):
- Typeface: Ornate, decorative, or bold serif fonts. Combination of multiple fonts can work.
- Font Characteristics: Expressive, decorative, bold. Rich typography with character.
- Usage: Bold, expressive typography. Can combine multiple fonts. Dramatic hierarchy.
- Weights: Bold, extra-bold weights. Expressive, dramatic typography.
- Impact: Feels extravagant, artistic, and attention-grabbing. Appeals to audiences who value richness.`;
	}
	
	// Default/Professional
	return `PROFESSIONAL VIBE TYPOGRAPHY GUIDELINES (STRICT):
- Typeface: Professional, readable fonts appropriate for the industry.
- Font Characteristics: Clear, trustworthy, professional.
- Usage: Standard hierarchy. Professional typography.
- Weights: Standard weights (Regular, Medium, Bold).
- Impact: Feels trustworthy, reliable, and professional.`;
}

function getVibeIconGuidelines(style: string): string {
	const lowerStyle = style.toLowerCase();
	
	if (lowerStyle.includes('minimalistic') || lowerStyle.includes('minimal')) {
		return `MINIMALISTIC VIBE ICONOGRAPHY GUIDELINES (STRICT):
- Icon Style: Simple line icons, geometric shapes, plenty of whitespace, minimal textures.
- Characteristics: Clean lines, geometric shapes, 2px stroke weight, rounded corners.
- Source: Lucide Icons, Iconify, or custom SVG with minimal style.
- Usage: Minimal, clean icons. Plenty of whitespace. Simple geometric shapes.
- Impact: Feels clean, professional, sophisticated.`;
	}
	
	if (lowerStyle.includes('futuristic') || lowerStyle.includes('futur')) {
		return `FUTURISTIC VIBE ICONOGRAPHY GUIDELINES (STRICT):
- Icon Style: 3D shapes, holographic effects, abstract geometry, tech-inspired symbols.
- Characteristics: 3D effects, abstract geometry, tech-inspired, angular shapes.
- Source: Custom SVG with 3D effects, tech-inspired icon libraries.
- Usage: 3D icons, abstract geometry, tech-inspired symbols. Futuristic aesthetic.
- Impact: Feels innovative, cutting-edge, high-tech.`;
	}
	
	if (lowerStyle.includes('funky') || lowerStyle.includes('playful') || lowerStyle.includes('fun')) {
		return `FUNKY VIBE ICONOGRAPHY GUIDELINES (STRICT):
- Icon Style: Cartoonish illustrations, playful doodles, emojis, unconventional shapes.
- Characteristics: Playful, cartoonish, hand-drawn feel, expressive, fun.
- Source: Custom SVG, playful icon libraries, emoji integration.
- Usage: Playful, expressive icons. Cartoonish, fun aesthetic.
- Impact: Feels energetic, youthful, approachable. Strong social media appeal.`;
	}
	
	if (lowerStyle.includes('maximalistic') || lowerStyle.includes('maximal')) {
		return `MAXIMALISTIC VIBE ICONOGRAPHY GUIDELINES (STRICT):
- Icon Style: Complex illustrations, layered graphics, detailed patterns, and textures.
- Characteristics: Detailed, layered, complex, rich textures, ornate.
- Source: Custom SVG with detailed illustrations, complex iconography.
- Usage: Complex, layered icons. Detailed patterns and textures.
- Impact: Feels extravagant, artistic, attention-grabbing.`;
	}
	
	// Default/Professional
	return `PROFESSIONAL VIBE ICONOGRAPHY GUIDELINES (STRICT):
- Icon Style: Professional, clear icons appropriate for the industry.
- Characteristics: Clear, recognizable, professional.
- Source: Professional icon libraries, custom SVG.
- Usage: Standard, professional iconography.
- Impact: Feels trustworthy, reliable, professional.`;
}

function getVibeImageryGuidelines(style: string): string {
	const lowerStyle = style.toLowerCase();
	
	if (lowerStyle.includes('minimalistic') || lowerStyle.includes('minimal')) {
		return `MINIMALISTIC VIBE IMAGERY GUIDELINES (STRICT):
- Photo Style: Clean, uncluttered photography. Lots of negative space. Focused subject matter.
- Patterns & Textures: Subtle geometric patterns, clean lines, minimal textures. Focus on negative space.
- Stock Keywords: "minimalist", "clean", "uncluttered", "negative space", "simple", "focused"
- Impact: Feels high-end, premium, professional. Communicates clarity and sophistication.`;
	}
	
	if (lowerStyle.includes('futuristic') || lowerStyle.includes('futur')) {
		return `FUTURISTIC VIBE IMAGERY GUIDELINES (STRICT):
- Photo Style: Futuristic illustrations, AI/tech imagery, sci-fi concepts, or digitally enhanced photography.
- Patterns & Textures: Abstract geometry, tech-inspired patterns, digital effects, holographic elements.
- Stock Keywords: "futuristic", "sci-fi", "tech", "AI", "digital", "cyberpunk", "neon", "holographic"
- Impact: Feels innovative and cutting-edge. Appeals to tech enthusiasts. Positions brand as forward-thinking.`;
	}
	
	if (lowerStyle.includes('funky') || lowerStyle.includes('playful') || lowerStyle.includes('fun')) {
		return `FUNKY VIBE IMAGERY GUIDELINES (STRICT):
- Photo Style: Vibrant, lifestyle-driven, energetic, and relatable visuals.
- Patterns & Textures: Playful patterns, vibrant textures, energetic compositions.
- Stock Keywords: "vibrant", "lifestyle", "energetic", "playful", "colorful", "relatable", "fun"
- Impact: Feels energetic, youthful, and approachable. Makes brand memorable and relatable.`;
	}
	
	if (lowerStyle.includes('maximalistic') || lowerStyle.includes('maximal')) {
		return `MAXIMALISTIC VIBE IMAGERY GUIDELINES (STRICT):
- Photo Style: Over-the-top photography, luxurious or artistic visuals, visually intense.
- Patterns & Textures: Bold patterns, vibrant textures, layered graphics, detailed compositions.
- Stock Keywords: "maximalist", "luxurious", "artistic", "vibrant", "bold", "layered", "rich", "intense"
- Impact: Feels extravagant, artistic, and attention-grabbing. Appeals to audiences who value richness.`;
	}
	
	// Default/Professional
	return `PROFESSIONAL VIBE IMAGERY GUIDELINES (STRICT):
- Photo Style: Professional, appropriate imagery for the industry.
- Patterns & Textures: Professional patterns and textures.
- Stock Keywords: Professional keywords appropriate for the industry.
- Impact: Feels trustworthy, reliable, professional.`;
}