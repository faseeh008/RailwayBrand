import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { 
	BrandGuidelinesSpec, 
	BrandGuidelinesInput, 
	BrandGuidelinesResponse
} from '$lib/types/brand-guidelines';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API);

export interface BrandGuidelineRequest {
	brandName: string;
	brandValues?: string;
	industry?: string;
	mood?: string;
	audience?: string;
	customPrompt?: string;
	logoPath?: string;
}

export interface BrandGuidelineResponse {
	content: string;
	brandName: string;
}

/**
 * Use Gemini 2.0 Flash to optimize slide layout and prevent overflow
 */
export async function optimizeSlideLayoutWithGemini(
	template: any, 
	stepData: any, 
	slideType: string
): Promise<any> {
	try {
		if (!env.GOOGLE_GEMINI_API) {
			console.warn('Gemini API not available, using template as-is');
			return template;
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		// Create layout optimization prompt
		const prompt = createLayoutOptimizationPrompt(template, stepData, slideType);

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const optimizedJson = response.text();

		// Try to parse the optimized JSON
		try {
			const optimized = JSON.parse(optimizedJson);
			return optimized;
		} catch (parseError) {
			console.warn('Failed to parse Gemini layout optimization, using original template');
			return template;
		}
	} catch (error) {
		console.warn('Gemini layout optimization failed:', error);
		return template;
	}
}

/**
 * Create prompt for Gemini to optimize slide layout
 */
function createLayoutOptimizationPrompt(template: any, stepData: any, slideType: string): string {
	const content = stepData?.content || '';
	const title = stepData?.title || '';
	
	return `
You are a STRICT presentation layout expert. You must fix ALL issues with ZERO tolerance for errors.

CRITICAL ISSUES TO ELIMINATE:
1. NO PLACEHOLDER TEXT: Remove ALL Latin text like "ut posuere erat", "hendrerit", "aliquam"
2. NO TEXT TRUNCATION: Every word must be fully visible
3. NO CONTENT DUPLICATION: Each section must have unique content
4. NO OVERFLOW: All text must fit perfectly in its bounding box
5. NO INCOMPLETE CONTENT: Remove any sentences ending with "..." or incomplete phrases

CURRENT TEMPLATE:
${JSON.stringify(template, null, 2)}

STEP DATA:
- Title: "${title}"
- Content: "${content}"
- Slide Type: "${slideType}"

STRICT OPTIMIZATION RULES:
1. CONTENT CLEANING: Remove ALL Latin placeholder text completely
2. REGION SIZING: Every text region must be 150% wider than its content
3. FONT SIZING: Calculate exact font size needed for perfect fit
4. CONTENT SEPARATION: Mission and Vision must be completely different
5. OVERFLOW PREVENTION: If content doesn't fit, create new slides with proper headings

MANDATORY ACTIONS:
- Scan EVERY content_binding for Latin text and remove it
- Increase ALL bbox.width values by 50% for titles, 30% for body text
- Calculate font sizes based on: fontSize = (boxWidth / contentLength) * 0.8
- Split content at paragraph boundaries if it exceeds max_chars
- Ensure Mission ≠ Vision with completely different content
- Remove any region with incomplete sentences

LAYOUT CALCULATIONS:
- Title font size: Math.min(64, (bbox.width / title.length) * 1.2)
- Body font size: Math.min(24, (bbox.width / content.length) * 0.6)
- Minimum bbox.height: (contentLines * fontSize * 1.4) + 20px padding
- Maximum content per slide: 600 characters for body, 100 for titles

QUALITY CONTROL:
- NO Latin words anywhere in the template
- NO truncated text (every character visible)
- NO duplicate content between sections
- NO overflow (all text fits perfectly)
- NO incomplete sentences or placeholder phrases

OUTPUT FORMAT:
Return ONLY the corrected JSON template. Every issue must be fixed.

The template must produce perfect slides with zero errors.
`;
}

/**
 * Use Gemini to intelligently split content with proper headings
 */
export async function splitContentWithHeadings(
	content: string,
	title: string,
	maxChars: number = 800
): Promise<Array<{title: string, content: string}>> {
	try {
		if (!env.GOOGLE_GEMINI_API) {
			// Fallback: simple split without Gemini
			return splitContentSimple(content, title, maxChars);
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `
You are a STRICT content organization expert. Split content with ZERO duplication and perfect placement.

ORIGINAL TITLE: "${title}"
CONTENT: "${content}"

STRICT RULES:
1. NO DUPLICATION: Each slide must have completely unique content
2. NO PLACEHOLDER TEXT: Remove ALL Latin text like "ut posuere erat", "hendrerit"
3. NO INCOMPLETE CONTENT: Remove any sentences ending with "..." or incomplete phrases
4. PERFECT SPLITTING: Split at natural paragraph boundaries only
5. MEANINGFUL HEADINGS: Create distinct, descriptive titles for each section

CONTENT CLEANING:
- Remove ALL Latin placeholder text completely
- Remove incomplete sentences (ending with "..." or incomplete phrases)
- Preserve ONLY real, complete content
- Ensure each section has substantial, unique content

SPLITTING STRATEGY:
- Maximum ${maxChars} characters per slide
- Split only at paragraph boundaries (\\n\\n)
- Create meaningful section titles like "Core Mission", "Vision & Values", "Brand Strategy"
- Each slide must have a clear, distinct focus

QUALITY CONTROL:
- NO duplicate content between slides
- NO placeholder text anywhere
- NO incomplete sentences
- NO content overlap between sections

OUTPUT FORMAT:
Return a JSON array where each object has:
{
  "title": "Distinct section title",
  "content": "Complete, clean content for this slide only"
}

Example:
[
  {
    "title": "Brand Positioning - Core Mission",
    "content": "**Mission**: Our mission is to create sustainable automotive excellence through innovation and environmental responsibility."
  },
  {
    "title": "Brand Positioning - Vision & Values", 
    "content": "**Vision**: We envision a future where transportation is both innovative and environmentally responsible. Our values center on sustainability, innovation, and customer satisfaction."
  }
]

Return ONLY the JSON array. Each slide must be completely unique with no overlap.
`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const splitJson = response.text();

		try {
			const slides = JSON.parse(splitJson);
			return Array.isArray(slides) ? slides : [{title, content}];
		} catch (parseError) {
			console.warn('Failed to parse Gemini content split, using fallback');
			return splitContentSimple(content, title, maxChars);
		}
	} catch (error) {
		console.warn('Gemini content splitting failed:', error);
		return splitContentSimple(content, title, maxChars);
	}
}

/**
 * Fallback content splitting when Gemini is not available
 */
function splitContentSimple(content: string, title: string, maxChars: number): Array<{title: string, content: string}> {
	if (content.length <= maxChars) {
		return [{title, content}];
	}

	const slides = [];
	const paragraphs = content.split(/\n\n+/);
	let currentContent = '';
	let slideNumber = 1;

	for (const paragraph of paragraphs) {
		if ((currentContent + '\n\n' + paragraph).length > maxChars && currentContent.length > 0) {
			// Save current slide and start new one
			const slideTitle = slideNumber === 1 ? title : `${title} - Part ${slideNumber}`;
			slides.push({title: slideTitle, content: currentContent.trim()});
			currentContent = paragraph;
			slideNumber++;
		} else {
			currentContent += (currentContent ? '\n\n' : '') + paragraph;
		}
	}

	// Add final slide
	if (currentContent.trim()) {
		const slideTitle = slideNumber === 1 ? title : `${title} - Part ${slideNumber}`;
		slides.push({title: slideTitle, content: currentContent.trim()});
	}

	return slides;
}

export async function generateBrandGuidelines(request: BrandGuidelineRequest): Promise<BrandGuidelineResponse> {
	let text = '';
	
	try {
		// Check if API key is available
		if (!env.GOOGLE_GEMINI_API) {
			throw new Error('Google Gemini API key is not configured. Please check your environment variables.');
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		// Create a comprehensive prompt for brand guideline generation
		const prompt = createBrandGuidelinePrompt(request);

		// Debug: Log the prompt to see if logo path is included

		const result = await model.generateContent(prompt);
		const response = await result.response;
		text = response.text();

		// Return the natural language response directly
		const cleanedText = text.trim();
		
		return {
			content: cleanedText,
			brandName: request.brandName
		};
	} catch (error) {
		throw new Error('Failed to generate brand guidelines. Please try again.');
	}
}

// New comprehensive brand guidelines generator
export async function generateComprehensiveBrandGuidelines(input: BrandGuidelinesInput): Promise<BrandGuidelinesSpec> {
	try {
		// Check if API key is available
		if (!env.GOOGLE_GEMINI_API) {
			throw new Error('Google Gemini API key is not configured. Please check your environment variables.');
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		// Create a comprehensive prompt for structured brand guideline generation
		const prompt = createComprehensiveBrandGuidelinePrompt(input);

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		// Parse the JSON response
		let brandGuidelines: BrandGuidelinesSpec;
		try {
			// Extract JSON from the response (handle cases where AI adds extra text)
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No valid JSON found in AI response');
			}
			
			brandGuidelines = JSON.parse(jsonMatch[0]);
		} catch (parseError) {
			console.error('Failed to parse AI response as JSON:', parseError);
			console.error('Raw response:', text);
			
			// Fallback: create a basic structure with the parsed content
			brandGuidelines = createFallbackBrandGuidelines(input, text);
		}

		// Validate and enhance the generated guidelines
		brandGuidelines = validateAndEnhanceGuidelines(brandGuidelines, input);

		return brandGuidelines;
	} catch (error) {
		console.error('Error generating comprehensive brand guidelines:', error);
		throw new Error('Failed to generate comprehensive brand guidelines. Please try again.');
	}
}

function createBrandGuidelinePrompt(request: BrandGuidelineRequest): string {
	const { brandName, brandValues, industry, mood, audience, customPrompt, logoPath } = request;
	
	// Get domain-specific adaptations (using industry as domain for legacy compatibility)
	const domainAdaptations = getDomainAdaptations(industry || 'General Business');
	
		return `You are a Brand Identity & Design Expert specializing in ${industry || 'general business'} industry. Your task is to generate **complete, professional, and DOMAIN-SPECIFIC brand guidelines** for "${brandName}".

[BRAND INPUTS]
- Brand name: ${brandName}
- Industry / Domain: ${industry || 'General Business'}
- Target audience: ${audience || 'General consumers'}
- Brand values & personality: ${brandValues || 'Not specified - generate based on domain and brand context'}
- Custom description: ${customPrompt || 'No additional specifications provided'}
- Logo: ${logoPath ? 'User has provided an existing logo image - include reference to the uploaded logo in the guidelines' : 'No logo provided - AI should generate logo concepts'}

${logoPath ? `**CRITICAL INSTRUCTION**: The user has uploaded a logo image. You MUST include this logo in your response in the Logo Guidelines section. Use this exact format: "![Brand Logo](${logoPath})" to display the logo. The logo should appear in the Logo Guidelines section where you discuss logo usage rules.` : ''}

[DOMAIN-SPECIFIC REQUIREMENTS FOR ${industry?.toUpperCase() || 'GENERAL BUSINESS'}]
${domainAdaptations.guidelines}

[OUTPUT REQUIREMENTS]
Produce a **concise, structured brand guideline document** with brief one-line explanations for each section. Generate appropriate section headings and structure based on the ${industry || 'general business'} industry requirements.

[STYLE REQUIREMENTS]
- Keep content **concise and brief** - one line per bullet point
- Write in a **professional, instructional tone** appropriate for ${industry || 'general business'}
- Generate creative defaults consistent with the ${industry || 'general business'} industry
- Make each section **brief but actionable** for ${industry || 'general business'} professionals
- Use markdown formatting for clear structure
- Ensure all content reflects the domain-specific requirements
- Focus on applications and use cases that are SPECIFICALLY relevant to ${industry || 'general business'} industry

Create comprehensive brand guidelines that would help anyone understand and implement the "${brandName}" brand consistently across all touchpoints in the ${industry || 'general business'} industry:

${logoPath ? `**FINAL REMINDER**: You MUST include the uploaded logo in the Logo Guidelines section using this exact format: ![Brand Logo](${logoPath}). Do not forget to include this logo in your response.` : ''}`;
}


function createComprehensiveBrandGuidelinePrompt(input: BrandGuidelinesInput): string {
	const { brand_name, brand_domain, short_description, logo_files, colors, typography, contact } = input;
	
	// Get domain-specific adaptations
	const domainAdaptations = getDomainAdaptations(brand_domain);
	
	return `Create a concise brand guidelines JSON specification tailored specifically for ${brand_domain}. Keep descriptions brief and focused.

INPUT:
- Brand: "${brand_name}" (${brand_domain})
- Description: "${short_description}"
- Logo: ${logo_files.length > 0 ? 'Provided' : 'Not provided'}
- Colors: ${colors ? 'Provided' : 'Generate'}
- Typography: ${typography ? 'Provided' : 'Generate'}

REQUIREMENTS:
- Keep all text content concise and to the point
- Avoid lengthy explanations
- Focus on essential brand elements for ${brand_domain}
- Generate sensible defaults for missing inputs
- For iconography.specific_icons: Generate 5-8 specific icon names relevant to ${brand_domain} (e.g., for healthcare: "stethoscope", "heart", "pill", "medical-cross", "hospital", "ambulance", "user-md", "shield")
- Return ONLY valid JSON

JSON SCHEMA:
{
  "brand_name": string,
  "brand_domain": string,
  "short_description": string,
  "positioning_statement": string,
  "voice_and_tone": {
    "adjectives": string[],
    "guidelines": string,
    "sample_lines": string[]
  },
  "logo": {
    "primary": string,
    "variants": string[],
    "color_versions": string[],
    "clear_space_method": string,
    "minimum_sizes": string[],
    "correct_usage": [],
    "incorrect_usage": []
  },
  "colors": {
    "core_palette": [
      {
        "name": string,
        "hex": string,
        "rgb": string,
        "cmyk": string,
        "pantone": string,
        "usage": string,
        "accessibility_rating": string
      }
    ],
    "secondary_palette": [
      {
        "name": string,
        "hex": string,
        "rgb": string,
        "cmyk": string,
        "pantone": string,
        "usage": string,
        "accessibility_rating": string
      }
    ]
  },
  "typography": {
    "primary": {
      "name": string,
      "weights": string[],
      "usage": string,
      "fallback_suggestions": string[],
      "web_link": string
    },
    "supporting": {
      "name": string,
      "weights": string[],
      "usage": string,
      "fallback_suggestions": string[],
      "web_link": string
    },
    "secondary": [
      {
        "name": string,
        "weights": string[],
        "usage": string,
        "fallback_suggestions": string[],
        "web_link": string
      }
    ]
  },
  "iconography": {
    "style": string,
    "grid": string,
    "stroke": string,
    "color_usage": string,
    "specific_icons": string[],
    "notes": string
  },
  "patterns_gradients": [
    {
      "name": string,
      "colors": string[],
      "usage": string
    }
  ],
  "photography": {
    "mood": string[],
    "guidelines": string,
    "examples": string[]
  },
  "applications": [
    {
      "context": string,
      "description": string,
      "layout_notes": string[]
    }
  ],
  "dos_and_donts": [
    {
      "description": string,
      "visual_reference": string,
      "reason": string
    }
  ],
  "legal_contact": {
    "contact_name": string,
    "title": string,
    "email": string,
    "company": string,
    "address": string,
    "website": string
  },
  "export_files": {
    "pptx": string,
    "assets_zip": string,
    "json": string
  },
  "missing_assets": string[],
  "slide_decisions": {},
  "created_at": string,
  "version": "1.0"
}

DOMAIN CUSTOMIZATION FOR ${brand_domain.toUpperCase()}:
${domainAdaptations.guidelines}

DYNAMIC STRUCTURE GENERATION:
${domainAdaptations.structure}

DOMAIN-SPECIFIC APPLICATIONS:
${domainAdaptations.applications}

CONTENT GUIDELINES:
- Keep all descriptions brief (1-2 sentences max)
- Avoid lengthy explanations or detailed instructions
- Focus on essential brand elements only
- Use bullet points for lists instead of paragraphs
- Make do/don't examples concise (1 line each)
- Tailor all content specifically for ${brand_domain} industry

ERROR HANDLING:
- If essential inputs missing, produce JSON with "missing_assets":[...] and include sensible defaults
- Include a "do/don't" set of 6 visual examples (3 do, 3 don't) with brief explanations
- Include an "Export checklist" with recommended files for designers

ADAPTIVITY:
- Generate applications specific to ${brand_domain} industry
- If brand_domain suggests an alternate structure, map content to that structure and record mapping in the JSON field 'slide_decisions'
- Ensure all content is relevant to ${brand_domain} professionals

PRODUCE ONLY VALID JSON - NO EXTRA COMMENTARY OR MARKDOWN.`;
}

// Progressive generation function
export async function generateStepTitles(input: {
	brand_domain: string;
	brand_name: string;
	short_description?: string;
	selectedMood?: string;
	selectedAudience?: string;
}): Promise<Array<{ id: string; title: string; description: string }>> {
	try {
		if (!env.GOOGLE_GEMINI_API) {
			throw new Error('Google Gemini API key is not configured');
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `Generate 8 easy-to-understand step titles and descriptions for a brand guideline creation process for "${input.brand_name}" in the ${input.brand_domain} industry.

Brand Context:
- Brand Name: ${input.brand_name}
- Industry: ${input.brand_domain}
- Description: ${input.short_description || 'Professional brand'}
- Mood: ${input.selectedMood || 'Professional'}
- Target Audience: ${input.selectedAudience || 'General audience'}

Generate step titles that are:
- Easy to understand and professional
- Specific to the ${input.brand_domain} industry
- Relevant to ${input.selectedMood || 'professional'} brand personality
- Targeted at ${input.selectedAudience || 'general audience'}
- Clear, actionable, and user-friendly
- NOT hardcoded - make them dynamic based on the brand context

Return as JSON array with this exact structure:
[
  {
    "id": "brand-positioning",
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "logo-guidelines", 
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "color-palette",
    "title": "Dynamic title based on brand and industry", 
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "typography",
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "iconography",
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "photography", 
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "applications",
    "title": "Dynamic title based on brand and industry",
    "description": "Dynamic description based on brand context"
  },
  {
    "id": "final-review",
    "title": "Dynamic title based on brand and industry", 
    "description": "Dynamic description based on brand context"
  }
]

Return ONLY the JSON array, no additional text.`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		// Parse JSON response
		try {
			const jsonMatch = text.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			}
		} catch (parseError) {
			console.error('Failed to parse step titles response:', parseError);
		}

		// Fallback to user-friendly titles
		return [
			{ id: 'brand-positioning', title: `Building ${input.brand_name}'s Foundation`, description: `Creating your brand's core identity and values` },
			{ id: 'logo-guidelines', title: `Perfecting ${input.brand_name}'s Logo`, description: `Setting up professional logo usage rules` },
			{ id: 'color-palette', title: `Crafting ${input.brand_name}'s Colors`, description: `Choosing the perfect color palette for your brand` },
			{ id: 'typography', title: `Selecting ${input.brand_name}'s Fonts`, description: `Picking fonts that represent your brand perfectly` },
			{ id: 'iconography', title: `Designing ${input.brand_name}'s Icons`, description: `Creating consistent icon style guidelines` },
			{ id: 'photography', title: `Shaping ${input.brand_name}'s Visual Style`, description: `Defining your brand's photography mood and style` },
			{ id: 'applications', title: `Applying ${input.brand_name}'s Brand`, description: `Using your brand across different materials and platforms` },
			{ id: 'final-review', title: `Reviewing ${input.brand_name}'s Guidelines`, description: `Final review of your complete brand guidelines` }
		];
	} catch (error) {
		console.error('Error generating step titles:', error);
		throw new Error('Failed to generate step titles');
	}
}

export async function generateProgressiveBrandGuidelines(request: {
	step: string;
	previousSteps: Partial<BrandGuidelinesInput>;
	userApproval?: boolean;
	feedback?: string;
	extractedColors?: string;
	extractedTypography?: string;
}): Promise<{
	content: string;
	brandGuidelines?: BrandGuidelinesSpec;
	message: string;
}> {
	const maxRetries = 3;
	let lastError: Error | null = null;
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Check if API key is available
			if (!env.GOOGLE_GEMINI_API) {
				throw new Error('Google Gemini API key is not configured. Please check your environment variables.');
			}

			// Use higher temperature for typography step to ensure uniqueness and variation
			// Higher temperature (0.75) encourages more creative and varied font selections based on brand name
			const temperature = request.step === 'typography' ? 0.75 : 0.3;
			const topP = request.step === 'typography' ? 0.95 : 0.9;
			const topK = request.step === 'typography' ? 50 : 40;
			const model = genAI.getGenerativeModel({ 
				model: 'gemini-2.0-flash-exp',
				generationConfig: {
					temperature: temperature,
					topP: topP,
					topK: topK,
					maxOutputTokens: 4000
				}
			});

			// Create step-specific prompt
			const prompt = createProgressivePrompt(request);

			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			// For final step, build complete brand guidelines object
			if (request.step === 'final-review') {
				// Build complete brand guidelines from previous steps
				const completeGuidelines: BrandGuidelinesSpec = {
					brand_name: request.previousSteps.brand_name || 'Your Brand',
					brand_domain: request.previousSteps.brand_domain || 'General Business',
					short_description: request.previousSteps.short_description || '',
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

				return {
					content: text,
					brandGuidelines: completeGuidelines,
					message: 'Final brand guidelines generated successfully!'
				};
			}

			// For other steps, return text content
			return {
				content: text,
				message: getStepMessage(request.step)
			};

		} catch (error) {
			lastError = error as Error;
			console.error(`Attempt ${attempt} failed for ${request.step} step:`, error);
			
			// Check if it's a retryable error (503 Service Unavailable, rate limits, etc.)
			const isRetryableError = error instanceof Error && (
				error.message.includes('503') ||
				error.message.includes('Service Unavailable') ||
				error.message.includes('overloaded') ||
				error.message.includes('quota') ||
				error.message.includes('rate limit')
			);
			
			if (attempt < maxRetries && isRetryableError) {
				const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
				console.log(`Retrying in ${delay}ms...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
			
			// If not retryable or max retries reached, throw error
			break;
		}
	}
	
	// If we get here, all retries failed
	throw new Error(`Failed to generate ${request.step} step after ${maxRetries} attempts. ${lastError?.message || 'Unknown error'}`);
}

function createProgressivePrompt(request: {
	step: string;
	previousSteps: Partial<BrandGuidelinesInput>;
	userApproval?: boolean;
	feedback?: string;
	extractedColors?: string;
	extractedTypography?: string;
}): string {
	const { step, previousSteps, userApproval, feedback } = request;
	
	const domainAdaptations = getDomainAdaptations(previousSteps.brand_domain || 'General Business');
	
	const baseInfo = `
Brand: ${previousSteps.brand_name || 'Your Brand'}
Domain: ${previousSteps.brand_domain || 'General Business'}
Description: ${previousSteps.short_description || 'Professional brand'}
Mood: ${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}
Target Audience: ${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}
${previousSteps.brandValues ? `Brand Values & Mission: ${previousSteps.brandValues}` : ''}
${previousSteps.customPrompt ? `Custom Requirements: ${previousSteps.customPrompt}` : ''}
${feedback ? `
USER FEEDBACK FOR REGENERATION:
The user has provided the following feedback about the previous version: "${feedback}"
Please incorporate this feedback and create an improved version that addresses their concerns.
` : ''}`;

	switch (step) {
		case 'brand-positioning':
			return `${baseInfo}

Generate brief brand positioning content (1-2 lines per section) for ${previousSteps.brand_domain || 'General Business'} industry.

DOMAIN-SPECIFIC GUIDANCE FOR ${previousSteps.brand_domain?.toUpperCase() || 'GENERAL BUSINESS'}:
${domainAdaptations.guidelines}

CRITICAL REQUIREMENTS:
- Keep all descriptions brief - maximum 1-2 lines each
- Generate content SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry
- Make content concise but actionable
- Use clear, professional language
${feedback ? `

🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- Read the feedback carefully and implement EXACTLY what the user requests
- If they want specific wording, tone, or values, use those EXACTLY as requested
- If they want to add or remove elements, do so precisely
- If they want different focus or emphasis, adjust the content accordingly
- DO NOT ignore any part of their feedback - every request must be implemented

` : ''}

FORMAT AS:
**Brand Positioning**: [1-2 line statement based on user input and domain]
**Mission**: [1-2 line mission based on user input]
**Vision**: [1-2 line vision based on user input]
**Core Values**: [3-5 short values based on user input, one per line]
**Target Audience**: [1-2 line description based on user input]
**Voice & Tone**: [1-2 line guidelines based on user input]

IMPORTANT: 
- Use **bold** formatting for ALL headings
- Generate content based on user's brand name, description, mood, audience, brand values, and custom requirements
${previousSteps.brandValues ? `- Incorporate the user's brand values and mission statement: "${previousSteps.brandValues}"` : ''}
${previousSteps.customPrompt ? `- Address the user's custom requirements: "${previousSteps.customPrompt}"` : ''}
- Keep descriptions brief - maximum 1-2 lines each
- Make content SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry

Return ONLY the formatted text above.`;

		case 'logo-guidelines':
			return '';

		case 'color-palette':
			return `${baseInfo}

🎨 EXTRACTED COLORS FROM LOGO:
${request.extractedColors}

IMPORTANT: Use the extracted colors above as the foundation for the brand color palette. These colors were extracted directly from the logo using AI analysis. Build upon these colors and create a cohesive system.

${feedback ? `

🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- If the user mentions ANY specific color (e.g., "blue", "red", "#FF5733"), you MUST include that EXACT color
- If they say "change [color] to [new color]", replace with the EXACT new color they specified
- If they mention hex codes, use those EXACT hex codes
- If they want different mood/style, choose colors that match EXACTLY what they described
- DO NOT ignore color requests - they are REQUIREMENTS, not suggestions

EXAMPLES OF CORRECT RESPONSES TO FEEDBACK:
- Feedback: "make the primary color blue" → Must include a blue color as primary
- Feedback: "use #FF5733 for accent" → Must use EXACTLY #FF5733
- Feedback: "change green to purple" → Replace green with purple color
- Feedback: "more vibrant colors" → Use brighter, more saturated colors
- Feedback: "softer palette" → Use pastel or muted tones

` : ''}

Create a comprehensive brand color palette based on the extracted colors from the logo. The extracted colors should be the PRIMARY foundation, but you can suggest additional complementary colors to create a complete system.

REQUIREMENTS:
- Use the extracted colors as your primary palette foundation
- Suggest additional complementary colors that work harmoniously with the extracted colors
- Provide specific hex codes, RGB values, and CMYK values for each color
- Include usage guidelines for each color (primary, secondary, accent, neutral)
- Explain the psychological impact and brand associations of each color
- Provide accessibility considerations (contrast ratios, WCAG compliance)
- Include color combinations and pairing suggestions
- Specify when to use each color in different contexts

FORMAT YOUR RESPONSE AS A JSON OBJECT:
{
  "primary": [
    {
      "name": "[Color name]",
      "hex": "#hexcode",
      "rgb": [r, g, b],
      "cmyk": [c, m, y, k],
      "usage": "[specific usage guidelines]",
      "psychology": "[brand associations and emotional impact]"
    }
  ],
  "secondary": [
    {
      "name": "[Color name]",
      "hex": "#hexcode",
      "rgb": [r, g, b],
      "cmyk": [c, m, y, k],
      "usage": "[specific usage guidelines]",
      "psychology": "[brand associations and emotional impact]"
    }
  ],
  "accent": [
    {
      "name": "[Color name]",
      "hex": "#hexcode",
      "rgb": [r, g, b],
      "cmyk": [c, m, y, k],
      "usage": "[specific usage guidelines]",
      "psychology": "[brand associations and emotional impact]"
    }
  ],
  "neutrals": [
    {
      "name": "[Color name]",
      "hex": "#hexcode",
      "rgb": [r, g, b],
      "cmyk": [c, m, y, k],
      "usage": "[specific usage guidelines]",
      "psychology": "[brand associations and emotional impact]"
    }
  ],
  "background": [
    {
      "name": "[Color name]",
      "hex": "#hexcode",
      "rgb": [r, g, b],
      "cmyk": [c, m, y, k],
      "usage": "[specific usage guidelines]",
      "psychology": "[brand associations and emotional impact]"
    }
  ],
  "combinations": [
    {
      "name": "Primary + Secondary",
      "context": "[usage context]"
    },
    {
      "name": "Primary + Accent", 
      "context": "[usage context]"
    },
    {
      "name": "Secondary + Neutral",
      "context": "[usage context]"
    }
  ],
  "accessibility": {
    "contrast_ratios": "Contrast ratios for text on backgrounds",
    "wcag_compliance": "WCAG compliance notes",
    "color_blind_friendly": "Color-blind friendly considerations"
  },
  "usage_guidelines": {
    "hierarchy": "Color hierarchy and importance",
    "context_applications": "Context-specific applications",
    "consistency_rules": "Brand consistency rules"
  }
}

Return ONLY the JSON object above, no additional text, no markdown formatting, no code blocks, no backticks.`;

		case 'typography':
			return `${baseInfo}

🚨 CRITICAL: Generate UNIQUE typography that is SPECIFICALLY tailored to "${previousSteps.brand_name || 'Brand'}" brand. DO NOT use generic fonts that could apply to any brand in this domain.

BRAND-SPECIFIC CONTEXT (USE THIS TO CREATE UNIQUE TYPOGRAPHY):
- Brand Name: "${previousSteps.brand_name || 'Brand'}" - Analyze the name's characteristics, length, and personality
- Industry/Domain: "${previousSteps.brand_domain || 'General Business'}"
- Brand Description: "${previousSteps.short_description || 'Professional brand'}" - This is KEY for unique typography
${previousSteps.brandValues ? `- Brand Values & Mission: "${previousSteps.brandValues}"` : ''}
${previousSteps.customPrompt ? `- Custom Requirements: "${previousSteps.customPrompt}"` : ''}
- Brand Mood: "${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}"
- Target Audience: "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}"

UNIQUENESS REQUIREMENTS:
1. ✓ The typography MUST reflect the SPECIFIC personality of "${previousSteps.brand_name || 'Brand'}"
2. ✓ Consider the brand name "${previousSteps.brand_name || 'Brand'}" - what typography characteristics match this name?
3. ✓ Analyze the description "${previousSteps.short_description || 'Professional brand'}" - what fonts convey this EXACT message?
4. ✓ Different brands in "${previousSteps.brand_domain || 'General Business'}" should get DIFFERENT fonts based on their unique attributes
5. ✓ The typography should be DISTINCTIVE and memorable for "${previousSteps.brand_name || 'Brand'}"

TYPOGRAPHY PERSONALITY ANALYSIS:
- Brand Name Analysis: "${previousSteps.brand_name || 'Brand'}" suggests: [Analyze if name is short/long, modern/classic, bold/subtle, playful/serious]
- Description Analysis: "${previousSteps.short_description || 'Professional brand'}" suggests: [Analyze the tone, values, and personality]
- Mood Analysis: "${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}" suggests: [Analyze the emotional characteristics]
- Audience Analysis: "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}" suggests: [Analyze readability and accessibility needs]

${feedback ? `
🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- If the user mentions ANY font name (e.g., "Roboto", "Montserrat", "Inter"), you MUST use that EXACT font name
- If they say "change [font] to [new font]", replace the old font with the EXACT new font name they specified
- If they want a different style, choose appropriate fonts that match that style
- DO NOT ignore font name requests - they are REQUIREMENTS, not suggestions
- If user says "use Roboto", the output MUST have "**Primary Font**: Roboto - ..."
- If user says "change to Helvetica", the output MUST have the new font as "Helvetica"

EXAMPLES OF CORRECT RESPONSES TO FEEDBACK:
- Feedback: "change primary font to Roboto" → Output: "**Primary Font**: Roboto - [description]"
- Feedback: "use Montserrat instead" → Output: "**Primary Font**: Montserrat - [description]"  
- Feedback: "I want Inter for headings" → Output: "**Primary Font**: Inter - [description]"
- Feedback: "make it more modern with Poppins" → Output: "**Primary Font**: Poppins - [description]"

` : ''}

FONT SELECTION PROCESS - FOLLOW THIS EXACTLY TO CREATE UNIQUE TYPOGRAPHY:

STEP 1: ANALYZE BRAND NAME "${previousSteps.brand_name || 'Brand'}" CHARACTERISTICS:
- Name length: ${(previousSteps.brand_name || 'Brand').length} characters
  * ${(previousSteps.brand_name || 'Brand').length < 6 ? 'SHORT name - Use bold, condensed fonts (Oswald, Bebas Neue, Montserrat, Poppins)' : (previousSteps.brand_name || 'Brand').length > 10 ? 'LONG name - Use readable, spacious fonts (Inter, Lato, Open Sans, Source Sans Pro)' : 'MEDIUM name - Use balanced fonts (Roboto, Montserrat, Work Sans, DM Sans)'}
- Name style analysis:
  * Contains tech terms? → Geometric sans-serifs (Space Grotesk, DM Sans, Work Sans, IBM Plex Sans)
  * Contains classic terms? → Serif or humanist fonts (Georgia, Merriweather, Playfair Display, Libre Baskerville)
  * Contains creative terms? → Distinctive fonts (Poppins, Nunito, Rubik, Montserrat)
  * Contains professional terms? → Clean sans-serifs (Inter, Roboto, Helvetica, Open Sans)
  * Contains luxury/premium terms? → Elegant fonts (Playfair Display, Crimson Text, Libre Baskerville)
  * Contains modern/contemporary terms? → Contemporary fonts (Space Grotesk, DM Sans, Work Sans, Montserrat)

STEP 2: ANALYZE BRAND DESCRIPTION "${previousSteps.short_description || 'Professional brand'}" FOR SPECIFIC TYPOGRAPHY NEEDS:
- Extract key words from description: [Analyze specific words, tone, and values]
- Match typography personality to these EXACT words (not generic domain fonts)
- Example: If description says "innovative technology" → Use modern, tech fonts (Space Grotesk, DM Sans)
- Example: If description says "trusted financial services" → Use professional, trustworthy fonts (Inter, Roboto)
- Example: If description says "creative design studio" → Use distinctive, creative fonts (Poppins, Montserrat, Playfair Display)
- Example: If description says "premium luxury brand" → Use elegant, refined fonts (Playfair Display, Crimson Text)
- CRITICAL: Avoid generic fonts for "${previousSteps.brand_domain || 'General Business'}" - find fonts that match the SPECIFIC description words

STEP 3: CONSIDER BRAND MOOD "${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}" FOR TYPOGRAPHY PERSONALITY:
- Professional: Clean, authoritative fonts (Inter, Roboto, Helvetica, Source Sans Pro) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name
- Modern: Geometric, contemporary fonts (Space Grotesk, DM Sans, Work Sans, IBM Plex Sans) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name
- Creative: Distinctive, expressive fonts (Montserrat, Poppins, Playfair Display, Nunito) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name
- Luxury: Elegant, refined fonts (Playfair Display, Crimson Text, Libre Baskerville, Merriweather) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name
- Friendly: Approachable, humanist fonts (Nunito, Lato, Open Sans, Rubik) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name
- Bold: Strong, impactful fonts (Oswald, Bebas Neue, Montserrat, Poppins) - BUT choose based on "${previousSteps.brand_name || 'Brand'}" name

STEP 4: CONSIDER TARGET AUDIENCE "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}" FOR READABILITY:
- Professional/B2B: Highly readable, professional fonts (Inter, Roboto, Helvetica, Source Sans Pro)
- Consumers: Approachable, friendly fonts (Lato, Open Sans, Nunito, Rubik)
- Tech-savvy: Modern, geometric fonts (Space Grotesk, DM Sans, Work Sans, IBM Plex Sans)
- Traditional: Classic, serif fonts (Georgia, Merriweather, Times New Roman, Libre Baskerville)
- Young: Contemporary, bold fonts (Poppins, Montserrat, Rubik, Nunito)

STEP 5: ENSURE UNIQUENESS - CRITICAL VALIDATION:
- Ask: "Would another brand named '${previousSteps.brand_name || 'Brand'}' with description '${previousSteps.short_description || 'Professional brand'}' get the SAME fonts?" If YES, choose DIFFERENT fonts
- Ask: "Are these fonts SPECIFIC to "${previousSteps.brand_name || 'Brand'}" or could they apply to ANY brand in "${previousSteps.brand_domain || 'General Business'}"?" If they could apply to ANY brand, choose MORE SPECIFIC fonts
- Consider the UNIQUE combination: Brand name "${previousSteps.brand_name || 'Brand'}" + Description "${previousSteps.short_description || 'Professional brand'}"${previousSteps.brandValues ? ` + Values "${previousSteps.brandValues}"` : ''}${previousSteps.customPrompt ? ` + Requirements "${previousSteps.customPrompt}"` : ''} + Mood "${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}" + Audience "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}"
- Select fonts that reflect THIS SPECIFIC combination, not generic domain fonts
- If you've seen similar combinations before, intentionally choose DIFFERENT fonts to ensure uniqueness

AVAILABLE FONTS (use these exact names):
- Sans-serif: Inter, Roboto, Montserrat, Poppins, Open Sans, Lato, Source Sans Pro, Raleway, Nunito, Work Sans, DM Sans, Space Grotesk, IBM Plex Sans, Fira Sans, Noto Sans, Rubik, Ubuntu, Oswald, Bebas Neue, Helvetica, Arial
- Serif: Georgia, Times New Roman, Merriweather, Libre Baskerville, Crimson Text, Playfair Display
- Display: Bebas Neue, Oswald, Playfair Display

FONT COMBINATION GUIDELINES:
- Primary font should match "${previousSteps.brand_name || 'Brand'}" personality for headlines
- Supporting font should be highly readable and complement the primary
- Ensure fonts work together harmoniously
- Consider contrast: if primary is bold/display, supporting should be readable/body
- Consider similarity: if primary is geometric, supporting can be geometric or humanist

FORMAT AS (EXACT STRUCTURE):
**Primary Font**: [Exact Font Name] - [1-2 line description explaining WHY this specific font fits "${previousSteps.brand_name || 'Brand'}" based on name, description, mood, and audience]
**Supporting Font**: [Exact Font Name] - [1-2 line description explaining WHY this specific font complements the primary and works for "${previousSteps.brand_name || 'Brand'}"]
**Font Hierarchy**: [1-2 line hierarchy guidelines specific to "${previousSteps.brand_name || 'Brand'}" brand]
**Web Usage**: [1-2 line web implementation guidelines]
**Print Usage**: [1-2 line print guidelines]

CRITICAL FORMAT REQUIREMENTS:
- Font name MUST come IMMEDIATELY after "**Primary Font**:" or "**Supporting Font**:"
- Use EXACT font names from the list above
- Correct: **Primary Font**: Montserrat - Bold, modern sans-serif that matches "${previousSteps.brand_name || 'Brand'}"'s ${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'} personality
- WRONG: **Primary Font**: A modern font like Montserrat (this won't work!)
- WRONG: **Primary Font**: Montserrat - Good for ${previousSteps.brand_domain || 'General Business'} (too generic!)

MANDATORY VALIDATION CHECKLIST - Verify EACH font before including:
1. ✓ Does this font reflect the SPECIFIC personality of "${previousSteps.brand_name || 'Brand'}"? (MUST be YES)
2. ✓ Does this font match the EXACT description: "${previousSteps.short_description || 'Professional brand'}"? (MUST be YES)
3. ✓ Is this font UNIQUE to "${previousSteps.brand_name || 'Brand'}" and not generic for "${previousSteps.brand_domain || 'General Business'}"? (MUST be YES)
4. ✓ Would another brand in "${previousSteps.brand_domain || 'General Business'}" get DIFFERENT fonts? (MUST be YES)
5. ✓ Can I explain EXACTLY why these fonts are perfect for "${previousSteps.brand_name || 'Brand'}" specifically? (MUST be YES)
6. ✓ Does this font reflect the brand name's characteristics (length: ${(previousSteps.brand_name || 'Brand').length} chars, style, personality)? (MUST be YES)
7. ✓ Is this font choice based on the SPECIFIC combination of name + description + mood + audience? (MUST be YES)

If ANY answer is NO, STOP and choose DIFFERENT fonts that are more specific to "${previousSteps.brand_name || 'Brand'}".

UNIQUENESS TEST:
- Before finalizing fonts, ask: "If I changed the brand name from '${previousSteps.brand_name || 'Brand'}' to a different name in '${previousSteps.brand_domain || 'General Business'}', would I still choose these fonts?"
- If YES → Fonts are too generic, choose MORE SPECIFIC fonts based on "${previousSteps.brand_name || 'Brand'}" name
- If NO → Fonts are specific to "${previousSteps.brand_name || 'Brand'}", proceed

FONT VARIETY REQUIREMENT - CRITICAL FOR UNIQUENESS:
- DO NOT use the same font combinations that are commonly used for "${previousSteps.brand_domain || 'General Business'}"
- Consider LESS common but appropriate fonts that match "${previousSteps.brand_name || 'Brand'}" specifically
- Example: Instead of always using "Inter + Roboto" for tech brands, consider "Space Grotesk + DM Sans" or "Work Sans + IBM Plex Sans" based on the specific brand
- DO NOT use predictable font pairs - vary based on "${previousSteps.brand_name || 'Brand'}" name characteristics
- If multiple brands in "${previousSteps.brand_domain || 'General Business'}" use similar fonts, intentionally choose DIFFERENT fonts for "${previousSteps.brand_name || 'Brand'}"

BRAND NAME-SPECIFIC FONT SELECTION:
- Analyze "${previousSteps.brand_name || 'Brand'}" name phonetics, syllables, and visual characteristics
- Short, punchy names (< 6 chars): Bold display fonts (Oswald, Bebas Neue, Montserrat, Poppins)
- Long, elegant names (> 10 chars): Refined serif or spacious sans-serif fonts (Playfair Display, Libre Baskerville, Lato, Open Sans)
- Technical names: Geometric sans-serif fonts (Space Grotesk, DM Sans, Work Sans, IBM Plex Sans)
- Creative names: Distinctive, expressive fonts (Poppins, Nunito, Rubik, Montserrat)
- Classic names: Traditional serif fonts (Georgia, Merriweather, Times New Roman, Libre Baskerville)
- Modern names: Contemporary sans-serif fonts (Inter, Roboto, Montserrat, Work Sans)

DESCRIPTION-BASED FONT SELECTION:
- Analyze "${previousSteps.short_description || 'Professional brand'}" for specific keywords and tone
- Match fonts to the EXACT words in the description, not generic domain fonts
- If description emphasizes "innovation" → Modern, tech fonts (Space Grotesk, DM Sans)
- If description emphasizes "trust" → Professional, readable fonts (Inter, Roboto, Open Sans)
- If description emphasizes "creativity" → Distinctive, expressive fonts (Poppins, Montserrat, Playfair Display)
- If description emphasizes "luxury" → Elegant, refined fonts (Playfair Display, Crimson Text, Libre Baskerville)
- If description emphasizes "accessibility" → Highly readable fonts (Open Sans, Lato, Source Sans Pro)

IMPORTANT: 
- Use **bold** formatting for ALL headings
- Generate typography that is UNIQUE to "${previousSteps.brand_name || 'Brand'}" brand
- DO NOT use generic fonts that would work for any brand in "${previousSteps.brand_domain || 'General Business'}"
- Consider the brand name's characteristics, length, and personality
- Analyze the description "${previousSteps.short_description || 'Professional brand'}" for specific typography needs
- Match typography to brand mood: ${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}
- Consider target audience: ${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}
${previousSteps.brandValues ? `- Incorporate brand values: "${previousSteps.brandValues}"` : ''}
${previousSteps.customPrompt ? `- Address custom requirements: "${previousSteps.customPrompt}"` : ''}
- Keep descriptions brief - maximum 1-2 lines each
- Always specify exact font names as the FIRST word(s) after the colon
- DO NOT extract or reference fonts from the logo - generate fonts based on brand requirements
${feedback ? `- REMEMBER: User feedback is MANDATORY - implement their exact font requests!` : ''}

Return ONLY the formatted text above with correct font names that are SPECIFICALLY tailored to "${previousSteps.brand_name || 'Brand'}" brand.`;

		case 'iconography':
			return `${baseInfo}

🚨 ULTRA-STRICT REQUIREMENT: Generate ONLY icons that are ABSOLUTELY ESSENTIAL and DIRECTLY RELEVANT to this specific brand. ZERO tolerance for generic or irrelevant icons.

BRAND CONTEXT (USE THIS TO VALIDATE EVERY ICON):
- Brand Name: "${previousSteps.brand_name || 'Brand'}"
- Industry/Domain: "${previousSteps.brand_domain || 'General Business'}"
- Description: "${previousSteps.short_description || 'Professional brand'}"
${previousSteps.brandValues ? `- Brand Values & Mission: "${previousSteps.brandValues}"` : ''}
${previousSteps.customPrompt ? `- Custom Requirements: "${previousSteps.customPrompt}"` : ''}
- Brand Mood: "${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}"
- Target Audience: "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}"

${feedback ? `
🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- If the user wants specific icons (e.g., "add shopping cart icon"), include those EXACT icons
- If they want different icons or styles, implement those changes EXACTLY
- If they want more/fewer icons, adjust the count accordingly
- DO NOT ignore any icon requests - they are REQUIREMENTS
- If they want specific icon names, use those EXACT names

` : ''}

ULTRA-STRICT VALIDATION - EVERY ICON MUST PASS ALL 5 CHECKS:
1. ✓ Is this icon directly and specifically used in "${previousSteps.brand_domain || 'General Business'}" industry? (MUST be YES - NO GENERICS)
2. ✓ Would "${previousSteps.brand_name || 'Brand'}" ACTUALLY use this icon in their products/services? (MUST be YES)
3. ✓ Does this icon DIRECTLY relate to: "${previousSteps.short_description || 'Professional brand'}"? (MUST be YES)
4. ✓ Is this icon SPECIFICALLY relevant for: "${previousSteps.selectedAudience || (previousSteps as any).audience || 'General audience'}"? (MUST be YES)
5. ✓ Can you explain EXACTLY why this icon is needed for this brand? (MUST have clear reason)

If ANY answer is NO or UNCERTAIN, DO NOT include that icon - find a more relevant one or skip it.

ABSOLUTE PROHIBITIONS:
- ❌ NO generic UI icons (settings, menu, button, home) UNLESS they are SPECIFICALLY essential for "${previousSteps.brand_domain || 'General Business'}"
- ❌ NO random or decorative icons - every icon MUST have a clear functional purpose
- ❌ NO icons that could apply to any brand - icons MUST be industry-specific
- ❌ NO placeholder icons - if you can't find a relevant icon, skip it
- ❌ NO icons that don't directly relate to user interactions with "${previousSteps.brand_name || 'Brand'}" products/services

MANDATORY ICON SELECTION PROCESS:
1. THINK: What do users actually DO with "${previousSteps.brand_name || 'Brand'}"?
2. THINK: What objects, actions, or services are SPECIFIC to "${previousSteps.brand_domain || 'General Business'}"?
3. THINK: What icons would users see in a real "${previousSteps.brand_domain || 'General Business'}" application?
4. VALIDATE: Does each icon pass ALL 5 validation checks above?
5. REMOVE: Any icon that fails validation - quality over quantity

DOMAIN-SPECIFIC ICON REQUIREMENTS (USE THESE AS REFERENCE - ONLY INCLUDE IF RELEVANT):
- E-commerce/Retail: shopping-cart, shopping-bag, credit-card, package, truck, tag, gift, star
- Healthcare/Medical: stethoscope, heart, pill, hospital, ambulance, shield, user-md, activity
- Food/Restaurant: utensils, coffee, wine, cake, chef-hat, food, restaurant, delivery-truck
- Technology/Tech: code, server, wifi, smartphone, laptop, cloud, zap, monitor, database
- Education: graduation-cap, book, book-open, school, student, teacher, certificate, pencil
- Finance: dollar-sign, credit-card, wallet, chart, trending-up, bank, calculator, receipt
- Real Estate: building, home, map-pin, key, door, blueprint, house, compass
- Transportation: car, bus, train, plane, ship, bike, navigation, map, route
- Fashion/Retail: shopping-bag, tag, star, heart, crown, sparkles, gift, user
- Fitness/Sports: dumbbell, trophy, award, target, activity, heart, timer, medal
- Creative/Design: brush, palette, image, camera, video, layers, pen-tool, edit

CRITICAL: Only include icons from the list above if they are ACTUALLY relevant to "${previousSteps.brand_name || 'Brand'}" in "${previousSteps.brand_domain || 'General Business'}". Do NOT include icons just because they're in the list.

FORMAT AS (use ONLY icon names that exist in Lucide or common icon libraries):
• [Icon Name]
• [Icon Name]
• [Icon Name]
• [Icon Name]
• [Icon Name]
• [Icon Name]
• [Icon Name]
• [Icon Name]

USE ONLY THESE ICON NAMES (they must exist in icon libraries):
- Common: shopping-cart, shopping-bag, credit-card, package, truck, tag, gift, star, heart, user, shield, zap, monitor, laptop, smartphone, wifi, cloud, server, database
- Medical: stethoscope, heart, pill, hospital, ambulance, shield, activity
- Food: utensils, coffee, wine, cake, food, restaurant
- Education: graduation-cap, book, book-open, school, certificate, pencil
- Finance: dollar-sign, credit-card, wallet, chart, trending-up, bank, calculator
- Buildings: building, home, map-pin, key, door, house, compass
- Transportation: car, bus, train, plane, ship, bike, navigation, map, route
- Fitness: dumbbell, trophy, award, target, activity, heart, timer
- Creative: brush, palette, image, camera, video, layers, pen-tool, edit

FINAL VALIDATION BEFORE OUTPUT:
For each icon you're about to include, ask:
1. Is this icon SPECIFICALLY needed for "${previousSteps.brand_domain || 'General Business'}"? (YES/NO)
2. Would "${previousSteps.brand_name || 'Brand'}" actually use this? (YES/NO)
3. Is this icon name available in standard icon libraries (Lucide, Feather, Material)? (YES/NO)
4. Can I explain EXACTLY why this icon is relevant? (YES/NO)

If ANY answer is NO, REMOVE that icon from the list.

IMPORTANT: 
- Generate 6-8 STRICTLY RELEVANT icon names (MUST exist in standard icon libraries)
- Use ONLY icon names from the list above or similar well-known icon names
- ALL icons must pass the 4-question validation above
- QUALITY over quantity - better to have 4 relevant icons than 8 generic ones
- If you can't find enough relevant icons, generate fewer (minimum 4)
- Match icon selection to brand mood: ${previousSteps.selectedMood || (previousSteps as any).mood || 'Professional'}
${previousSteps.brandValues ? `- Consider brand values: "${previousSteps.brandValues}"` : ''}
${previousSteps.customPrompt ? `- Address custom requirements: "${previousSteps.customPrompt}"` : ''}

Return ONLY the bullet list above with 4-8 STRICTLY RELEVANT icon names that exist in standard icon libraries for "${previousSteps.brand_name || 'Brand'}" in "${previousSteps.brand_domain || 'General Business'}" industry.`;

		case 'photography':
			return `${baseInfo}

Generate brief photography content (1-2 lines per section) for ${previousSteps.brand_domain || 'General Business'} industry.

DOMAIN-SPECIFIC GUIDANCE FOR ${previousSteps.brand_domain?.toUpperCase() || 'GENERAL BUSINESS'}:
${domainAdaptations.guidelines}

CRITICAL REQUIREMENTS:
- Keep all descriptions brief - maximum 1-2 lines each
- Generate guidelines SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry
- Make content concise but actionable
${feedback ? `

🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- Implement EXACTLY what the user requests in their feedback
- If they want different photography styles, moods, or guidelines, use those EXACTLY
- If they want specific examples or approaches, include those precisely
- DO NOT ignore any requests - implement every change they ask for

` : ''}

DYNAMIC GENERATION:
Generate photography guidelines ONLY if relevant to ${previousSteps.brand_domain || 'General Business'} industry.

IMPORTANT: 
- Skip photography section if not relevant to ${previousSteps.brand_domain || 'General Business'} industry (e.g., B2B software, financial services)
- If relevant, generate headings and content based on user input and domain
- Use **bold** formatting for ALL headings
- Keep descriptions brief - maximum 1-2 lines each
- Generate photography guidelines SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry

Return ONLY the formatted text with dynamic headings relevant to the industry, or "Not applicable for this industry" if photography is not relevant.`;

		case 'applications':
			return `${baseInfo}

Generate brief applications content (1-2 lines per section) for ${previousSteps.brand_domain || 'General Business'} industry.

DOMAIN-SPECIFIC APPLICATIONS:
${domainAdaptations.applications}

${feedback ? `
🚨 CRITICAL USER FEEDBACK - HIGHEST PRIORITY 🚨
The user has requested changes: "${feedback}"

MANDATORY ACTIONS:
- Implement EXACTLY what the user requests in their feedback
- If they want specific applications, platforms, or use cases, include those EXACTLY
- If they want different contexts or examples, adjust accordingly
- DO NOT ignore any application requests - implement every change they ask for

` : ''}

CRITICAL REQUIREMENTS:
- Keep all descriptions brief - maximum 1-2 lines each
- Generate applications SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry
- Make content concise but actionable

DYNAMIC GENERATION:
Generate applications structure with headings and content that are SPECIFICALLY relevant to ${previousSteps.brand_domain || 'General Business'} industry.

IMPORTANT: 
- Generate ONLY the application-related headings and sections that are relevant to ${previousSteps.brand_domain || 'General Business'} industry
- Customize applications based on user input and domain needs
- Use **bold** formatting for ALL headings
- Keep descriptions brief - maximum 1-2 lines each
- Generate applications SPECIFICALLY appropriate for ${previousSteps.brand_domain || 'General Business'} industry
${feedback ? `- REMEMBER: User feedback is MANDATORY - implement their exact requests!` : ''}

Return ONLY the formatted text with dynamic headings relevant to the industry.`;

		case 'final-review':
			return `${baseInfo}

Generate brief final review content (1-2 lines per section) summarizing all brand guidelines for ${previousSteps.brand_domain || 'General Business'} industry.

CRITICAL REQUIREMENTS:
- Keep all descriptions brief - maximum 1-2 lines each
- Summarize all previous steps in concise format
- Make content actionable and clear
- Include visual references where applicable

FORMAT AS:
**Brand Summary**: [1-2 line brand overview based on user input]
**Key Guidelines**: [1-2 line key guidelines summary based on user input]
**Implementation**: [1-2 line implementation notes based on user input]
**Next Steps**: [1-2 line next steps based on user input]

IMPORTANT: 
- Use **bold** formatting for ALL headings
- Summarize content based on user's brand name, description, mood, and audience
- Keep descriptions brief - maximum 1-2 lines each
- Summarize only the sections that were actually generated for this industry

Return ONLY the formatted text above.`;

		default:
			throw new Error(`Unknown step: ${step}`);
	}
}

function getStepMessage(step: string): string {
	switch (step) {
		case 'brand-positioning':
			return '✅ Brand foundation created! Review the guidelines and approve to continue building your brand.';
		case 'logo-guidelines':
			return '✅ Logo standards established! Check the usage rules and approve to proceed.';
		case 'color-palette':
			return '✅ Color palette designed! Review the colors and approve to continue.';
		case 'typography':
			return '✅ Typography guidelines set! Review the font choices and approve to proceed.';
		case 'iconography':
			return '✅ Icon system created! Review the icon guidelines and approve to continue.';
		case 'photography':
			return '✅ Photography style defined! Review the visual guidelines and approve to proceed.';
		case 'applications':
			return '✅ Brand applications mapped! Review the usage guidelines and approve to continue.';
		case 'final-review':
			return '🎉 Brand guidelines complete! Review everything and approve to finalize your brand guide.';
		default:
			return 'Step completed! Please review and approve to continue.';
	}
}

function getDomainAdaptations(domain: string): {
	guidelines: string;
	structure: string;
	applications: string;
} {
	// All content is now completely AI-generated - no hardcoded headings or content
	return {
		guidelines: `Generate brand guidelines that are SPECIFICALLY tailored for ${domain} industry. Consider industry standards, regulations, target audience, and unique requirements for this domain.`,
		structure: `Generate appropriate section headings and structure based on the ${domain} industry requirements. Create headings that are relevant and meaningful for this specific industry.`,
		applications: `Generate applications and use cases that are SPECIFICALLY relevant to ${domain} industry. Focus on real-world applications commonly used in this domain.`
	};
}

function createFallbackBrandGuidelines(input: BrandGuidelinesInput, rawText: string): BrandGuidelinesSpec {
	// Create a minimal structure when JSON parsing fails - all content will be generated by AI
	return {
		brand_name: input.brand_name,
		brand_domain: input.brand_domain,
		short_description: input.short_description,
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
			primary: input.logo_files[0]?.filename || '',
			variants: input.logo_files.map(logo => logo.filename),
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
			contact_name: input.contact.name,
			title: input.contact.role || '',
			email: input.contact.email,
			company: input.contact.company || input.brand_name,
			address: input.contact.address || '',
			website: input.contact.website || ''
		},
		export_files: {
			pptx: `${input.brand_name}_Brand_Guidelines.pptx`,
			assets_zip: `${input.brand_name}_assets.zip`,
			json: `${input.brand_name}_brand_guidelines.json`
		},
		missing_assets: [],
		slide_decisions: {},
		created_at: new Date().toISOString(),
		version: '1.0'
	};
}

function validateAndEnhanceGuidelines(guidelines: BrandGuidelinesSpec, input: BrandGuidelinesInput): BrandGuidelinesSpec {
	// Validate required fields and add defaults
	if (!guidelines.brand_name) guidelines.brand_name = input.brand_name;
	if (!guidelines.brand_domain) guidelines.brand_domain = input.brand_domain;
	if (!guidelines.short_description) guidelines.short_description = input.short_description;
	if (!guidelines.created_at) guidelines.created_at = new Date().toISOString();
	if (!guidelines.version) guidelines.version = '1.0';
	
	// Ensure logo files are properly referenced
	if (input.logo_files.length > 0) {
		guidelines.logo.primary = input.logo_files[0].filename;
		guidelines.logo.variants = input.logo_files.map(logo => logo.filename);
	}
	
	// Add missing assets if any
	const missingAssets: string[] = [];
	if (input.logo_files.length === 0) missingAssets.push('logo files');
	if (!input.colors || input.colors.length === 0) missingAssets.push('color palette');
	if (!input.typography) missingAssets.push('typography preferences');
	
	guidelines.missing_assets = missingAssets;
	
	return guidelines;
}
