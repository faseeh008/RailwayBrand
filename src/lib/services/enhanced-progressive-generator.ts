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
	content: string;
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
			model: 'gemini-2.5-flash',
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
		const text = response.text();

		return {
			content: text.trim(),
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
	
	// Check if feedback indicates partial modification (default) or complete replacement
	const isCompleteReplacement = feedback && (
		feedback.toLowerCase().includes('completely regenerate') ||
		feedback.toLowerCase().includes('completely remake') ||
		feedback.toLowerCase().includes('completely redo') ||
		feedback.toLowerCase().includes('entirely regenerate') ||
		feedback.toLowerCase().includes('start over') ||
		feedback.toLowerCase().includes('change everything') ||
		feedback.toLowerCase().includes('replace everything') ||
		feedback.toLowerCase().includes('start from scratch')
	);
	
	// Extract current step content from stepHistory if available (for partial modifications)
	let currentStepContent = '';
	if (!isCompleteReplacement && feedback && previousSteps && (previousSteps as any).stepHistory) {
		const stepHistory = (previousSteps as any).stepHistory;
		const currentStepData = stepHistory.find((s: any) => s.step === step && s.content);
		if (currentStepData) {
			currentStepContent = typeof currentStepData.content === 'string'
				? currentStepData.content
				: typeof currentStepData.content === 'object'
					? JSON.stringify(currentStepData.content)
					: String(currentStepData.content || '');
		}
	}
	
	// Build feedback section with appropriate instructions
	let feedbackSection = '';
	if (feedback) {
		if (isCompleteReplacement) {
			// Complete replacement
			feedbackSection = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this step with the following requirements.`;
		} else if (currentStepContent) {
			// Partial modification with existing content
			feedbackSection = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT STEP CONTENT below carefully
2. Analyze the user's request to identify EXACTLY what they want to change
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other existing content exactly as it is
5. Do NOT regenerate or rewrite the entire step
6. Do NOT add new content unless the user explicitly asked to add something
7. Do NOT remove content unless the user explicitly asked to remove something
8. Keep the same structure, format, and style as the current content

CURRENT STEP CONTENT (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 3000)}${currentStepContent.length > 3000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			// Partial modification without existing content (shouldn't happen, but handle gracefully)
			feedbackSection = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this step while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}
	
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
${groundingSection}${feedbackSection}
`;

	// Get step-specific prompt
	// Common steps (first 5)
	if (step === 'brand-positioning') {
		return createBrandPositioningPrompt(contextInfo, brandName, industry, style, audience, description, values, feedback, currentStepContent, isCompleteReplacement);
	}
	if (step === 'logo-guidelines') {
		return createLogoGuidelinesPrompt(contextInfo, brandName, industry, style, feedback, currentStepContent, isCompleteReplacement);
	}
	if (step === 'color-palette') {
		return createColorPalettePrompt(contextInfo, brandName, industry, style, extractedColors, feedback, currentStepContent, isCompleteReplacement);
	}
	if (step === 'typography') {
		return createTypographyPrompt(contextInfo, brandName, industry, style, extractedTypography, feedback, currentStepContent, isCompleteReplacement);
	}
	if (step === 'iconography') {
		return createIconographyPrompt(contextInfo, brandName, industry, style, feedback, currentStepContent, isCompleteReplacement);
	}
	
	// Industry-specific steps - use generic handler which will adapt to industry
	// Photography and applications are now industry-specific, not always shown
	if (step === 'photography') {
		return createPhotographyPrompt(contextInfo, brandName, industry, style);
	}
	if (step === 'applications') {
		return createApplicationsPrompt(contextInfo, brandName, industry, style, industrySpecificInfo);
	}
	
	// All other industry-specific steps use generic handler with grounding data and previous steps
	return createGenericStepPrompt(contextInfo, step, brandName, industry, style, request.groundingData, request.previousSteps);
}

function createBrandPositioningPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	audience?: string,
	description?: string,
	values?: string,
	feedback?: string,
	currentStepContent?: string,
	isCompleteReplacement?: boolean
): string {
	// Get vibe-specific messaging guidelines
	const vibeGuidelines = getVibeMessagingGuidelines(style);
	
	// Build feedback context for partial modifications
	let feedbackContext = '';
	if (feedback) {
		if (isCompleteReplacement) {
			feedbackContext = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this brand positioning with the following requirements.`;
		} else if (currentStepContent) {
			feedbackContext = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT BRAND POSITIONING below carefully
2. Analyze the user's request to identify EXACTLY what they want to change
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other content exactly as it is
5. Keep the same structure and format
6. Do NOT regenerate the entire positioning

CURRENT BRAND POSITIONING (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 2000)}${currentStepContent.length > 2000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			feedbackContext = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this brand positioning while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}
	
	return `You are a brand strategy expert. Generate brand positioning content for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${feedbackContext}

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

FORMAT AS:
**Brand Positioning**: [1-2 line statement specific to "${brandName}" in ${industry} with ${style} style - MUST follow ${style} vibe guidelines]
**Mission**: [1-2 line mission specific to "${brandName}" - MUST reflect ${style} tone]
**Vision**: [1-2 line vision specific to "${brandName}" - MUST reflect ${style} tone]
**Core Values**: [3-5 short values, one per line, specific to "${brandName}" - MUST align with ${style} values]
**Target Audience**: [1-2 line description specific to "${brandName}" audience]
**Voice & Tone**: [1-2 line guidelines specific to "${brandName}" brand voice - MUST match ${style} tone exactly]

Return ONLY the formatted text above. Make it SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style. STRICTLY follow the ${style} vibe messaging guidelines.`;
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
	style: string,
	feedback?: string,
	currentStepContent?: string,
	isCompleteReplacement?: boolean
): string {
	// Build feedback context for partial modifications
	let feedbackContext = '';
	if (feedback) {
		if (isCompleteReplacement) {
			feedbackContext = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this logo guidelines with the following requirements.`;
		} else if (currentStepContent) {
			feedbackContext = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT LOGO GUIDELINES below carefully
2. Analyze the user's request to identify EXACTLY what they want to change
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other content exactly as it is
5. Keep the same structure and format
6. Do NOT regenerate the entire guidelines

CURRENT LOGO GUIDELINES (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 2000)}${currentStepContent.length > 2000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			feedbackContext = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this logo guidelines while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}
	
	return `You are a logo design expert. Generate logo guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${feedbackContext}

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

FORMAT AS:
**Logo Concept**: [Description specific to "${brandName}" with ${style} style for ${industry}]
**Variants**: [List of variants: full_color, monochrome, icon_only, reversed]
**Usage Rules**: [3-5 specific rules for "${brandName}" logo usage]

Return ONLY the formatted text above. Make it SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style.`;
}

function createColorPalettePrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	extractedColors?: string,
	feedback?: string,
	currentStepContent?: string,
	isCompleteReplacement?: boolean
): string {
	// Build color guidance based on industry and style (same as logo generation)
	let logoColorGuidance = '';
	if (industry && style) {
		logoColorGuidance = `\n\n🎨 LOGO COLOR REQUIREMENTS (MUST MATCH):\n`;
		logoColorGuidance += `The logo was generated using colors based on:\n`;
		logoColorGuidance += `- Industry: ${industry} - Colors appropriate for this industry\n`;
		logoColorGuidance += `- Style/Vibe: ${style} - Colors matching this aesthetic\n`;
		logoColorGuidance += `\n⚠️ CRITICAL: The color palette MUST use the SAME colors that were used in the logo generation.\n`;
		logoColorGuidance += `If extracted colors from logo are provided, use them as the PRIMARY source.\n`;
		logoColorGuidance += `If no extracted colors, generate colors based on ${industry} industry + ${style} style (same logic as logo).\n`;
	}
	
	const colorContext = extractedColors
		? `\n\n🎨 EXTRACTED COLORS FROM LOGO (PRIMARY SOURCE - USE THESE):\n${extractedColors}\n\n${logoColorGuidance}\n⚠️ These colors were extracted from the logo and MUST be used as the primary color palette. Ensure they align with ${style} vibe and ${industry} industry.`
		: `\n\n${logoColorGuidance}\n⚠️ Since no logo colors were extracted, generate colors based on ${industry} industry + ${style} style using the SAME color logic that was used for logo generation.`;

	let feedbackContext = '';
	if (feedback) {
		if (isCompleteReplacement) {
			feedbackContext = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this color palette with the following requirements.`;
		} else if (currentStepContent) {
			feedbackContext = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT COLOR PALETTE below carefully
2. Analyze the user's request to identify EXACTLY what they want to change (e.g., "make colors brighter" = only adjust brightness, "change primary color" = only change primary color)
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other colors exactly as they are
5. Keep the same structure and format
6. Do NOT regenerate the entire palette

CURRENT COLOR PALETTE (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 2000)}${currentStepContent.length > 2000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			feedbackContext = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this color palette while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}

	// Get vibe-specific color guidelines
	const vibeColorGuidelines = getVibeColorGuidelines(style);

	return `You are a color design expert. Generate a color palette for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${colorContext}${feedbackContext}

${vibeColorGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Colors MUST match the colors used in the logo generation (based on ${industry} industry + ${style} style)
- If extracted colors from logo are provided, use them as PRIMARY source and expand them into a full palette
- If no extracted colors, generate colors using the SAME logic as logo generation (${industry} industry + ${style} style)
- Colors MUST be generated based on ${industry} industry FIRST
- Colors MUST STRICTLY follow ${style} vibe color guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Provide EXACTLY 5 colors maximum in this structure:
  1. Primary Color (1 color) - MUST match logo primary color if available
  2. Secondary Color (1 color) - MUST match logo secondary color if available
  3. Accent 1 (1 color) - Can be from logo or complementary to logo colors
  4. Accent 2 (1 color) - Can be from logo or complementary to logo colors
  5. Optional Color (1 color - can be a neutral, additional accent, or supporting color)
- All colors must include hex codes and RGB values
- The color palette MUST be consistent with the logo colors

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Primary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Main brand color reflecting SaaS industry and minimalistic style, used for primary actions and key brand elements

**Secondary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting color for secondary elements and text, aligned with minimalistic aesthetic

**Accent 1**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Muted accent for success states and positive actions, minimalistic style

**Accent 2**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Soft, muted pastel for backgrounds and subtle highlights, minimalistic style

**Optional Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Neutral for primary text and structural elements, minimalistic style

**Usage Guidelines**: Primary color for CTAs and key brand elements. Secondary color for supporting content. Accent 1 for success states. Accent 2 for backgrounds. Optional color for text. Maintain clean, minimal color usage appropriate for SaaS industry.

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Primary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Trust and professionalism, primary brand color reflecting healthcare industry and professional style

**Secondary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting brand color for secondary elements, aligned with healthcare industry standards

**Accent 1**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Wellness and positive health outcomes, accent for positive messaging, healthcare-appropriate

**Accent 2**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Important notices and alerts, accent for attention-grabbing elements, professional style

**Optional Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Neutral for body text and professional elements, appropriate for healthcare industry

**Usage Guidelines**: Primary color for main brand elements and trust-building. Accent 1 for positive health messaging. Maintain professional, calming color palette appropriate for healthcare industry.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Primary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Bold brand statement color reflecting fashion industry and maximalistic style, rich and saturated

**Secondary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting brand color for secondary elements, fashion-appropriate with maximalistic aesthetic

**Accent 1**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Energetic accent for highlights, maximalistic style with bold saturation

**Accent 2**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Fresh accent with layered textures, maximalistic style

**Optional Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting color for structure and contrast, fashion industry appropriate

**Usage Guidelines**: Rich, saturated colors with layered gradients and textures. Mix colors for dynamic looks. Embrace color combinations and bold statements. Visually intense palette appropriate for fashion industry and maximalistic style.

Example 4 - Gaming, Futuristic:
Brand: "NexusGames", Industry: "Gaming", Style: "Futuristic"
Output:
**Primary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Bold primary color reflecting gaming industry and futuristic style, tech-forward

**Secondary Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting color for secondary elements, gaming industry appropriate with futuristic aesthetic

**Accent 1**:
- [Color Name]: #[HEX] (rgb: r, g, b) - High-energy accent for highlights, futuristic style with tech-inspired feel

**Accent 2**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Additional accent for special elements, futuristic style

**Optional Color**:
- [Color Name]: #[HEX] (rgb: r, g, b) - Supporting color for backgrounds or contrast, gaming industry appropriate

**Usage Guidelines**: Bold, tech-forward colors appropriate for gaming industry. Use accents for highlights and special elements. Maintain futuristic aesthetic with cutting-edge color combinations.

NOW GENERATE FOR:
${contextInfo}${colorContext}${feedbackContext}

FORMAT AS:
**Primary Color**: [1 color with hex, rgb, name, and usage]
**Secondary Color**: [1 color with hex, rgb, name, and usage]
**Accent 1**: [1 color with hex, rgb, name, and usage]
**Accent 2**: [1 color with hex, rgb, name, and usage]
**Optional Color**: [1 color with hex, rgb, name, and usage - can be neutral, additional accent, or supporting color]
**Usage Guidelines**: [Brief guidelines specific to "${brandName}" and ${industry}]

IMPORTANT: Format colors clearly with hex codes visible. Use this format for each color:
- [Color Name]: #[HEXCODE] (rgb: r, g, b) - [usage description]

Return ONLY the formatted text above. 

CRITICAL: Generate colors based SOLELY on ${industry} industry and ${style} style. Do NOT use hardcoded or example colors. Create unique, appropriate colors that reflect the ${industry} industry standards and ${style} aesthetic. Each color must be thoughtfully chosen based on industry conventions and style requirements, not copied from examples.

Make colors SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style. Ensure all hex codes are clearly visible and properly formatted.`;
}

function createTypographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	extractedTypography?: string,
	feedback?: string,
	currentStepContent?: string,
	isCompleteReplacement?: boolean
): string {
	const typographyContext = extractedTypography
		? `\n\n🔤 EXTRACTED TYPOGRAPHY FROM LOGO:\n${extractedTypography}\n\n⚠️ SECONDARY: Use this as reference ONLY if it aligns with ${style} vibe and ${industry} industry. If it conflicts, IGNORE it and generate typography based on Industry + Vibe ONLY.`
		: '';

	let feedbackContext = '';
	if (feedback) {
		if (isCompleteReplacement) {
			feedbackContext = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this typography with the following requirements.`;
		} else if (currentStepContent) {
			feedbackContext = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT TYPOGRAPHY below carefully
2. Analyze the user's request to identify EXACTLY what they want to change (e.g., "change primary font" = only change primary font, "make fonts bolder" = only adjust weights)
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other typography exactly as it is
5. Keep the same structure and format
6. Do NOT regenerate the entire typography

CURRENT TYPOGRAPHY (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 2000)}${currentStepContent.length > 2000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			feedbackContext = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this typography while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}

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

EXAMPLES (3-shot learning):

Example 1 - SaaS, Minimalistic:
Brand: "TechFlow", Industry: "SaaS", Style: "Minimalistic"
Output:
**Primary Font**: [Font Name] - Clean, modern sans-serif that embodies minimalism while maintaining excellent readability. Perfect for "${brandName}"'s streamlined approach to enterprise software, reflecting SaaS industry standards.

**Supporting Font**: [Font Name] - Versatile, geometric sans-serif that complements the primary font with balanced proportions. Ideal for body text and UI elements, appropriate for SaaS industry.

**Typography Hierarchy with Visual Examples**:

**Heading 1 (H1) - Display/Title**:
- Font: [Primary Font Name] Bold
- Size: [Size appropriate for SaaS minimalistic style, typically 44-52px]
- Weight: 700
- Line Height: 1.2
- Usage: Main page titles, hero headlines, primary messaging for SaaS platforms
- Visual Example: "[Example heading text]" (shown at [size]px, Bold, 700 weight)

**Heading 2 (H2) - Section Headers**:
- Font: [Primary Font Name] SemiBold
- Size: [Size appropriate for SaaS minimalistic style, typically 28-36px]
- Weight: 600
- Line Height: 1.3
- Usage: Major section headers, feature titles, SaaS product sections
- Visual Example: "[Example heading text]" (shown at [size]px, SemiBold, 600 weight)

**Heading 3 (H3) - Subheadings**:
- Font: [Primary Font Name] Medium
- Size: [Size appropriate for SaaS minimalistic style, typically 20-24px]
- Weight: 500
- Line Height: 1.4
- Usage: Subsections, card titles, secondary headers, SaaS feature descriptions
- Visual Example: "[Example heading text]" (shown at [size]px, Medium, 500 weight)

**Body Text**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for SaaS minimalistic style, typically 16-18px]
- Weight: 400
- Line Height: 1.6
- Usage: Paragraphs, descriptions, main content, SaaS product information
- Visual Example: "[Example paragraph text that demonstrates how body text looks in SaaS context]" (shown at [size]px, Regular, 400 weight)

**Subtext/Captions**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for SaaS minimalistic style, typically 14px]
- Weight: 400
- Line Height: 1.5
- Usage: Captions, metadata, secondary information, SaaS UI metadata
- Visual Example: "[Example subtext or caption]" (shown at [size]px, Regular, 400 weight)

**UI Elements (Buttons, Labels)**:
- Font: [Supporting Font Name] Medium
- Size: [Size appropriate for SaaS minimalistic style, typically 14-16px]
- Weight: 500
- Line Height: 1.4
- Usage: Button text, form labels, navigation items, SaaS interface elements
- Visual Example: "[Example button or label text]" (shown at [size]px, Medium, 500 weight)

**Web Usage**: Load fonts from appropriate source (Google Fonts, Adobe Fonts, etc.). Use primary font for all headings and key messaging. Use supporting font for body text and UI elements.

**Print Usage**: Use primary font for headlines and supporting font for body text. Maintain consistent hierarchy with appropriate sizing for print media.

Example 2 - Healthcare, Professional:
Brand: "MedCare", Industry: "Healthcare", Style: "Professional"
Output:
**Primary Font**: [Font Name] - Professional, highly readable sans-serif that conveys trust and medical authority. Perfect for "${brandName}"'s patient-focused healthcare approach, reflecting healthcare industry standards.

**Supporting Font**: [Font Name] - Warm, approachable sans-serif that maintains professionalism while feeling human and compassionate. Ideal for patient communications, appropriate for healthcare industry.

**Typography Hierarchy with Visual Examples**:

**Heading 1 (H1) - Display/Title**:
- Font: [Primary Font Name] Bold
- Size: [Size appropriate for healthcare professional style, typically 40-48px]
- Weight: 700
- Line Height: 1.2
- Usage: Main page titles, hero headlines, primary medical messaging
- Visual Example: "[Example heading text]" (shown at [size]px, Bold, 700 weight)

**Heading 2 (H2) - Section Headers**:
- Font: [Primary Font Name] SemiBold
- Size: [Size appropriate for healthcare professional style, typically 24-32px]
- Weight: 600
- Line Height: 1.3
- Usage: Major section headers, service categories, healthcare sections
- Visual Example: "[Example heading text]" (shown at [size]px, SemiBold, 600 weight)

**Heading 3 (H3) - Subheadings**:
- Font: [Primary Font Name] Regular
- Size: [Size appropriate for healthcare professional style, typically 18-22px]
- Weight: 400
- Line Height: 1.4
- Usage: Subsections, treatment categories, secondary headers, healthcare information
- Visual Example: "[Example heading text]" (shown at [size]px, Regular, 400 weight)

**Body Text**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for healthcare professional style, typically 16-18px]
- Weight: 400
- Line Height: 1.6
- Usage: Paragraphs, patient information, medical descriptions, healthcare content
- Visual Example: "[Example paragraph text that demonstrates how body text looks in healthcare context]" (shown at [size]px, Regular, 400 weight)

**Subtext/Captions**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for healthcare professional style, typically 14px]
- Weight: 400
- Line Height: 1.5
- Usage: Captions, metadata, disclaimers, fine print, healthcare disclaimers
- Visual Example: "[Example subtext or caption]" (shown at [size]px, Regular, 400 weight)

**UI Elements (Buttons, Labels)**:
- Font: [Supporting Font Name] SemiBold
- Size: [Size appropriate for healthcare professional style, typically 14-16px]
- Weight: 600
- Line Height: 1.4
- Usage: Button text, form labels, medical form fields, healthcare interface elements
- Visual Example: "[Example button or label text]" (shown at [size]px, SemiBold, 600 weight)

**Web Usage**: Load fonts from appropriate source. Use primary font for medical information and headers. Use supporting font for patient-facing content.

**Print Usage**: Use primary font for medical documents and supporting font for patient materials. Ensure high readability with appropriate contrast.

Example 3 - Fashion, Maximalistic:
Brand: "VividStyle", Industry: "Fashion", Style: "Maximalistic"
Output:
**Primary Font**: [Font Name] - Bold, expressive sans-serif with geometric character that matches "${brandName}"'s fearless fashion approach. Perfect for making bold statements, reflecting fashion industry standards.

**Supporting Font**: [Font Name] - Versatile, modern sans-serif with distinctive character that complements the primary font. Ideal for supporting text and descriptions, appropriate for fashion industry.

**Typography Hierarchy with Visual Examples**:

**Heading 1 (H1) - Display/Title**:
- Font: [Primary Font Name] ExtraBold or Bold
- Size: [Size appropriate for fashion maximalistic style, typically 56-72px]
- Weight: 800 or 700
- Line Height: 1.1
- Usage: Main page titles, hero headlines, bold fashion statements
- Visual Example: "[Example heading text]" (shown at [size]px, ExtraBold/Bold, [weight] weight)

**Heading 2 (H2) - Section Headers**:
- Font: [Primary Font Name] Bold
- Size: [Size appropriate for fashion maximalistic style, typically 36-44px]
- Weight: 700
- Line Height: 1.2
- Usage: Major section headers, collection titles, fashion categories
- Visual Example: "[Example heading text]" (shown at [size]px, Bold, 700 weight)

**Heading 3 (H3) - Subheadings**:
- Font: [Primary Font Name] SemiBold
- Size: [Size appropriate for fashion maximalistic style, typically 24-32px]
- Weight: 600
- Line Height: 1.3
- Usage: Subsections, product categories, secondary headers, fashion items
- Visual Example: "[Example heading text]" (shown at [size]px, SemiBold, 600 weight)

**Body Text**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for fashion maximalistic style, typically 16-20px]
- Weight: 400
- Line Height: 1.6
- Usage: Paragraphs, product descriptions, fashion content, brand stories
- Visual Example: "[Example paragraph text that demonstrates how body text looks in fashion context]" (shown at [size]px, Regular, 400 weight)

**Subtext/Captions**:
- Font: [Supporting Font Name] Regular
- Size: [Size appropriate for fashion maximalistic style, typically 12-14px]
- Weight: 400
- Line Height: 1.5
- Usage: Captions, product codes, metadata, pricing information, fashion details
- Visual Example: "[Example subtext or caption]" (shown at [size]px, Regular, 400 weight)

**UI Elements (Buttons, Labels)**:
- Font: [Supporting Font Name] Bold
- Size: [Size appropriate for fashion maximalistic style, typically 14-18px]
- Weight: 700
- Line Height: 1.4
- Usage: Button text, navigation items, call-to-action labels, fashion interface elements
- Visual Example: "[Example button or label text]" (shown at [size]px, Bold, 700 weight)

**Web Usage**: Load fonts from appropriate source. Use primary font for all bold statements and headlines. Use supporting font for body text and supporting content.

**Print Usage**: Use primary font for fashion headlines and supporting font for descriptions. Embrace bold sizing and expressive typography in print materials.

NOW GENERATE FOR:
${contextInfo}${typographyContext}${feedbackContext}

FORMAT AS:
**Primary Font**: [Exact Font Name] - [1-2 line description explaining WHY this font fits "${brandName}" with ${style} style in ${industry}]

**Supporting Font**: [Exact Font Name] - [1-2 line description explaining WHY this font complements the primary]

**Typography Hierarchy with Visual Examples**:

**Heading 1 (H1) - Display/Title**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for H1 in ${industry} industry]
- Visual Example: "[Example heading text]" (shown at [size]px, [weight name], [weight number] weight)

**Heading 2 (H2) - Section Headers**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for H2 in ${industry} industry]
- Visual Example: "[Example heading text]" (shown at [size]px, [weight name], [weight number] weight)

**Heading 3 (H3) - Subheadings**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for H3 in ${industry} industry]
- Visual Example: "[Example heading text]" (shown at [size]px, [weight name], [weight number] weight)

**Body Text**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for body text in ${industry} industry]
- Visual Example: "[Example paragraph text that demonstrates how body text looks]" (shown at [size]px, [weight name], [weight number] weight)

**Subtext/Captions**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for subtext/captions in ${industry} industry]
- Visual Example: "[Example subtext or caption]" (shown at [size]px, [weight name], [weight number] weight)

**UI Elements (Buttons, Labels)**:
- Font: [Font name and weight]
- Size: [Size in px]
- Weight: [Weight number]
- Line Height: [Line height value]
- Usage: [Specific usage for UI elements in ${industry} industry]
- Visual Example: "[Example button or label text]" (shown at [size]px, [weight name], [weight number] weight)

**Web Usage**: [How to use fonts on web, including font loading instructions]

**Print Usage**: [How to use fonts in print, including sizing considerations]

CRITICAL: Generate fonts, sizes, weights, and visual examples based SOLELY on ${industry} industry and ${style} style. Do NOT use hardcoded or example fonts. Create appropriate typography that reflects ${industry} industry standards and ${style} aesthetic. Each font choice, size, weight, and visual example must be thoughtfully selected based on industry conventions and style requirements.

Return ONLY the formatted text above. Make typography SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style. Ensure all font names, sizes, weights, line heights, usage descriptions, and visual examples are clearly specified and professional.`;
}

function createIconographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	feedback?: string,
	currentStepContent?: string,
	isCompleteReplacement?: boolean
): string {
	// Get vibe-specific iconography guidelines
	const vibeIconGuidelines = getVibeIconGuidelines(style);
	
	// Build feedback context for partial modifications
	let feedbackContext = '';
	if (feedback) {
		if (isCompleteReplacement) {
			feedbackContext = `\n\n🚨 USER REQUEST (COMPLETE REPLACEMENT): "${feedback}"\nPlease completely regenerate this iconography with the following requirements.`;
		} else if (currentStepContent) {
			feedbackContext = `\n\n🚨 USER REQUEST (PARTIAL MODIFICATION): "${feedback}"

CRITICAL INSTRUCTIONS FOR PARTIAL MODIFICATION:
1. Read the CURRENT ICONOGRAPHY below carefully
2. Analyze the user's request to identify EXACTLY what they want to change
3. Make ONLY the specific change mentioned - do NOT change anything else
4. Preserve ALL other content exactly as it is
5. Keep the same structure and format
6. Do NOT regenerate the entire iconography

CURRENT ICONOGRAPHY (PRESERVE THIS EXCEPT FOR THE SPECIFIC CHANGE):
${currentStepContent.substring(0, 2000)}${currentStepContent.length > 2000 ? '\n\n[... content truncated ...]' : ''}

Now make ONLY the specific change requested: "${feedback}"`;
		} else {
			feedbackContext = `\n\n🚨 USER REQUEST: "${feedback}"\nPlease modify this iconography while preserving most of the existing content. Only make the specific changes requested.`;
		}
	}

	return `You are an iconography expert. Generate icon guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${feedbackContext}

${vibeIconGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Icon style MUST be generated based on ${industry} industry FIRST
- Icon style MUST STRICTLY follow ${style} vibe iconography guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Icons must be SPECIFIC to ${industry} industry
- Must be relevant to "${brandName}" brand (use brand name for personalization only)
- Provide 6-8 required icon glyphs

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

FORMAT AS:
**Icon Style**: [Description of icon style matching ${style} for ${industry}]
**Source Recommendation**: [Iconify, Lucide, or custom SVG] - [Reasoning]
**Required Glyphs**: [6-8 icon names specific to ${industry} and "${brandName}"]
**Usage Guidelines**: [Brief guidelines for icon usage]

Return ONLY the formatted text above. Make icons SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style.`;
}

function createPhotographyPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string
): string {
	// Get vibe-specific imagery guidelines
	const vibeImageryGuidelines = getVibeImageryGuidelines(style);

	return `You are a photography style expert. Generate photography guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}

${vibeImageryGuidelines}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Photography style MUST be generated based on ${industry} industry FIRST
- Photography style MUST STRICTLY follow ${style} vibe imagery guidelines above
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be specific to "${brandName}" brand (use brand name for personalization only)

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

FORMAT AS:
**Photo Style**: [Description specific to ${style} style for ${industry}]
**Patterns & Textures**: [2-3 patterns/textures specific to "${brandName}"]
**Stock Search Keywords**: [5-6 keywords for stock photo searches specific to ${industry} and ${style}]

Return ONLY the formatted text above. Make photography SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style.`;
}

function createApplicationsPrompt(
	contextInfo: string,
	brandName: string,
	industry: string,
	style: string,
	industrySpecificInfo?: Record<string, any>
): string {
	const industryContext = industrySpecificInfo
		? `\n\n⚠️ SECONDARY CONTEXT:\n${JSON.stringify(industrySpecificInfo)}\n\nUse this information ONLY if it aligns with ${industry} industry and ${style} vibe. Industry + Vibe take PRIORITY.`
		: '';

	return `You are a brand application expert. Generate application guidelines for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${industryContext}

🎯 PRIMARY REQUIREMENTS (MANDATORY):
- Applications MUST be generated based on ${industry} industry FIRST
- Applications MUST reflect ${style} style
- Industry + Vibe are the PRIMARY drivers - everything else is secondary
- Must be relevant to "${brandName}" brand (use brand name for personalization only)

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

FORMAT AS:
**Application 1**: [Name] - [Description specific to ${industry} and ${style}]
**Application 2**: [Name] - [Description specific to ${industry} and ${style}]
**Application 3**: [Name] - [Description specific to ${industry} and ${style}]
[Add 2-4 more applications as needed for ${industry}]

Return ONLY the formatted text above. Make applications SPECIFIC to "${brandName}" brand, ${industry} industry, and ${style} style.`;
}

function createGenericStepPrompt(
	contextInfo: string,
	step: string,
	brandName: string,
	industry: string,
	style: string,
	groundingData?: {
		summary: string;
		keyFindings: string[];
		websites: Array<{ url: string; title: string; extractedFacts: string[] }>;
	},
	previousSteps?: Partial<BrandGuidelinesInput> | any
): string {
	// Extract content from previous common steps (stepHistory)
	let previousStepsContent = '';
	if (previousSteps && (previousSteps as any).stepHistory && Array.isArray((previousSteps as any).stepHistory)) {
		const stepHistory = (previousSteps as any).stepHistory;
		const commonSteps = [
			{ id: 'brand-positioning', name: 'Brand Positioning' },
			{ id: 'logo-guidelines', name: 'Logo Guidelines' },
			{ id: 'color-palette', name: 'Color Palette' },
			{ id: 'typography', name: 'Typography' },
			{ id: 'iconography', name: 'Iconography' }
		];
		
		const previousStepsData: Array<{ name: string; content: string }> = [];
		
		for (const commonStep of commonSteps) {
			const stepData = stepHistory.find((s: any) => s.step === commonStep.id && s.approved && s.content);
			if (stepData) {
				const content = typeof stepData.content === 'string' 
					? stepData.content 
					: typeof stepData.content === 'object'
						? JSON.stringify(stepData.content)
						: String(stepData.content || '');
				previousStepsData.push({ name: commonStep.name, content });
			}
		}
		
		if (previousStepsData.length > 0) {
			previousStepsContent = `

📋 PREVIOUS STEPS CONTENT (MUST USE AND REFERENCE):
The following steps have already been generated for "${brandName}". You MUST use the same colors, fonts, logo guidelines, and brand positioning when creating this ${step} step. Maintain complete consistency.

${previousStepsData.map((stepData, idx) => `
${idx + 1}. ${stepData.name}:
${stepData.content.substring(0, 1000)}${stepData.content.length > 1000 ? '...' : ''}
`).join('\n')}

CRITICAL CONSISTENCY REQUIREMENTS:
- If this ${step} step mentions colors, use EXACTLY the colors from the Color Palette step above
- If this ${step} step mentions fonts/typography, use EXACTLY the fonts from the Typography step above
- If this ${step} step mentions logo, use EXACTLY the logo guidelines from the Logo Guidelines step above
- If this ${step} step mentions brand positioning/voice/tone, use EXACTLY the positioning from the Brand Positioning step above
- If this ${step} step mentions icons, use EXACTLY the iconography style from the Iconography step above
- Maintain the same ${style} aesthetic throughout
- Keep the same ${industry} industry context and standards
`;
		}
	}
	
	// Build grounding data section for industry-specific steps
	const groundingSection = groundingData ? `

🔍 REAL-WORLD INDUSTRY REFERENCE:
Based on analysis of ${groundingData.websites.length} leading ${industry} brands:

INDUSTRY PATTERNS:
${groundingData.summary}

KEY PRACTICES FROM ACTUAL BRANDS:
${groundingData.keyFindings.slice(0, 6).map((finding, i) => `${i + 1}. ${finding}`).join('\n')}

BRAND EXAMPLES AND THEIR APPROACHES:
${groundingData.websites.map((site, idx) => `
${idx + 1}. ${site.title}:
   ${site.extractedFacts.slice(0, 3).join('\n   ')}
`).join('\n')}

CRITICAL: For this "${step}" step, you MUST reference and incorporate actual patterns, elements, and practices found in these real ${industry} brands. Use specific examples from the analyzed brands to create guidelines that reflect what successful brands in this industry actually do. Do not create generic content - base it on real industry practices.
` : '';

	return `Generate ${step} content for "${brandName}" in the ${industry} industry with a ${style} aesthetic.

${contextInfo}${previousStepsContent}${groundingSection}

CRITICAL REQUIREMENTS:
- Content must be SPECIFIC to "${brandName}" brand
- Must reflect ${style} style consistently with previous steps
- Must be appropriate for ${industry} industry
${previousStepsContent ? '- MUST use the EXACT same colors, fonts, logo, and brand elements from the previous steps listed above' : ''}
${groundingData ? '- MUST be based on actual patterns and practices from real industry brands (see REAL-WORLD INDUSTRY REFERENCE above)' : ''}
- Professional and accurate
- Use real industry examples and patterns where applicable
- Keep descriptions brief - maximum 1-2 lines each
- Maintain complete consistency with all previous steps

${previousStepsContent ? `IMPORTANT: When referencing colors, fonts, logo, or brand elements in this ${step} step, you MUST use the exact same specifications from the previous steps. Do not create new colors, fonts, or brand elements - reuse what was already established.` : ''}
${groundingData ? `IMPORTANT: Reference specific elements, patterns, or practices from the analyzed brands when creating this ${step} guideline. Make it reflect what successful ${industry} brands actually use.` : ''}

Return formatted content specific to "${brandName}", ${industry} industry, and ${style} style, maintaining complete consistency with all previous steps.`;
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

