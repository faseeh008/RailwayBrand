import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import type { ScrapedIndustryData } from '$lib/services/grounding-search';

// Initialize Gemini AI (lazy initialization)
function getGenAI(): GoogleGenerativeAI {
	const apiKey = env?.GOOGLE_GEMINI_API || '';
	if (!apiKey) {
		throw new Error('GOOGLE_GEMINI_API is not configured. Please set it in your .env file.');
	}
	return new GoogleGenerativeAI(apiKey);
}

export interface IndustryQuestion {
	id: string;
	question: string;
	type: 'text' | 'text-with-suggestions' | 'select' | 'logo';
	suggestions?: string[];
	required: boolean;
	icon: string;
	helper?: string;
}

/**
 * Generate industry-specific questions based on selected industry
 * Uses 3-shot prompt approach
 */
export async function generateIndustryQuestions(
	industry: string,
	existingInfo?: {
		brandName?: string;
		style?: string;
		audience?: string;
	},
	alreadyAskedQuestionIds?: string[], // NEW: Track already asked question IDs
	groundingData?: ScrapedIndustryData,
	previousQuestions?: string[]
): Promise<IndustryQuestion[]> {
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
					console.log('[industry-questions] ✓ Found API key in process.env directly');
				}
			}
		}
		
		// Final check
		if (!apiKey || apiKey.trim() === '') {
			console.error('[industry-questions] API key not found. env.GOOGLE_GEMINI_API:', env?.GOOGLE_GEMINI_API || 'undefined/empty');
			console.error('[industry-questions] process.env.Google_Gemini_Api:', typeof process !== 'undefined' && process.env ? process.env.Google_Gemini_Api || 'NOT FOUND' : 'process not available');
			throw new Error('Google Gemini API key is not configured. Please check your .env file and ensure Google_Gemini_Api is set correctly, then restart the dev server.');
		}
		
		// Use the API key directly instead of env object
		const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });

		const prompt = createIndustryQuestionsPrompt(
			industry,
			existingInfo,
			alreadyAskedQuestionIds,
			groundingData,
			previousQuestions
		);

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		try {
			const jsonMatch = text.match(/\[[\s\S]*\]/);
			if (!jsonMatch) {
				throw new Error('No valid JSON array found in response');
			}

			const questions: IndustryQuestion[] = JSON.parse(jsonMatch[0]);
			return questions;
		} catch (parseError) {
			console.error('Failed to parse industry questions:', parseError);
			console.error('Raw response:', text);
			
			// Fallback: return empty array
			return [];
		}
	} catch (error) {
		console.error('Error generating industry questions:', error);
		return [];
	}
}

function createIndustryQuestionsPrompt(
	industry: string,
	existingInfo?: {
		brandName?: string;
		style?: string;
		audience?: string;
	},
	alreadyAskedQuestionIds?: string[],
	groundingData?: ScrapedIndustryData,
	previousQuestions?: string[]
): string {
	const contextInfo = existingInfo
		? `\n\nEXISTING INFORMATION:\n- Brand Name: ${existingInfo.brandName || 'Not provided'}\n- Style: ${existingInfo.style || 'Not provided'}\n- Audience: ${existingInfo.audience || 'Not provided'}`
		: '';

	const alreadyAskedInfo =
		alreadyAskedQuestionIds && alreadyAskedQuestionIds.length > 0
			? `\n\n⚠️ IMPORTANT - DO NOT ASK QUESTIONS ON THESE TOPICS AGAIN:\n${alreadyAskedQuestionIds
					.map((id) => `- ${id}`)
					.join('\n')}`
			: '';

	const askedQuestionSection =
		previousQuestions && previousQuestions.length > 0
			? `\n\nQUESTIONS/ANGLES ALREADY COVERED:\n${previousQuestions
					.map((q, idx) => `  ${idx + 1}. ${q}`)
					.join('\n')}\nYou must propose entirely new angles.`
			: '';

	const groundingSection = groundingData
		? `\n\n🔍 REAL-WORLD INSIGHTS FROM ${industry.toUpperCase()} BRANDS:\n- SUMMARY: ${groundingData.summary}\n- KEY FINDINGS:\n${groundingData.keyFindings
				.slice(0, 5)
				.map((finding, idx) => `  ${idx + 1}. ${finding}`)
				.join('\n')}\n- EXAMPLES:\n${groundingData.websites
				.slice(0, 3)
				.map((site) => `  • ${site.title}: ${site.extractedFacts.slice(0, 2).join('; ')}`)
				.join('\n')}\n\nEvery follow-up MUST cite or obviously stem from one of these insights. Do not introduce topics that do not appear here or in the EXISTING INFORMATION.`
		: '';

	return `You are a senior brand strategist and industry expert with deep knowledge of the "${industry}" sector. Your role is to generate 2-4 PROFESSIONAL, MATURE follow-up questions that uncover critical strategic and tactical details needed to create comprehensive, industry-accurate brand guidelines.

CRITICAL RULES FOR PROFESSIONAL QUESTION GENERATION:
1. PROFESSIONAL TONE: Questions must be mature, strategic, and business-focused. Use professional terminology appropriate for brand strategy discussions. Avoid casual language.

2. INDUSTRY-SPECIFIC DEPTH: Each question must be deeply rooted in ${industry} industry practices, standards, and real-world requirements. Reference specific patterns, regulations, or conventions from the REAL-WORLD INSIGHTS.

3. STRATEGIC VALUE: Questions should uncover information that directly impacts:
   - Brand positioning and competitive differentiation
   - Industry-specific design requirements and constraints
   - Target market segmentation and customer personas
   - Regulatory or compliance considerations
   - Go-to-market strategies and channel requirements
   - Product/service delivery models
   - Partnership and ecosystem relationships

4. REAL-WORLD GROUNDING: ${groundingSection ? 'EVERY question must reference or be inspired by specific insights, patterns, or examples from the REAL-WORLD INSIGHTS section. Cite actual industry practices, not generic concepts.' : 'Base questions on industry best practices and standards.'}

5. QUESTION STRUCTURE:
   - Professional, clear, and concise (1-2 sentences maximum)
   - Use industry-appropriate terminology
   - Focus on actionable insights that inform brand guideline creation
   - Avoid generic or superficial questions

6. SUGGESTIONS QUALITY: For "text-with-suggestions" type questions:
   - Provide 5-8 professional, industry-specific options
   - Base suggestions on real industry segments, models, or practices
   - Include options that reflect actual market categories or approaches
   - Avoid generic or made-up options

7. COVERAGE: Questions should explore different strategic dimensions:
   - Business model and revenue streams
   - Target market segments and customer profiles
   - Product/service categories and positioning
   - Distribution channels and touchpoints
   - Regulatory or compliance requirements
   - Competitive landscape positioning
   - Technology or platform considerations
   - Partnership and ecosystem dynamics

8. AVOID DUPLICATION: ${askedQuestionSection ? 'Never repeat topics already covered. Propose entirely new strategic angles.' : 'Ensure questions don\'t overlap with basic information already collected.'}

9. ${alreadyAskedInfo}

10. HELPER TEXT: Each question must include a professional helper text (20-30 words) that explains:
    - Why this information is valuable for brand guideline creation
    - How it will be used in the guidelines
    - The strategic benefit of providing this detail

REAL-WORLD DATA FOR REFERENCE:\n${groundingSection || 'No additional research data is available. Focus on unique, high-impact questions derived from the existing brand information.'}\n

OUTPUT: Return ONLY a JSON array.\n

EXAMPLE OUTPUTS (structure reference only — DO NOT copy verbatim):\n
Example 1 - SaaS Industry (Professional):\nIndustry: "SaaS"\nReal-World Insights: "Enterprise SaaS brands use sophisticated color systems with data visualization palettes. B2B SaaS emphasizes trust through professional typography and clean UI patterns."\nOutput:\n[\n  {\n    "id": "targetMarketSegment",\n    "question": "What is your primary market segment and customer profile?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Enterprise (1000+ employees)", "Mid-Market (100-1000 employees)", "SMB (10-100 employees)", "Solo/Small Teams (1-10)", "B2C Consumers", "B2B2C Platform"],\n    "required": false,\n    "icon": "🎯",\n    "helper": "Understanding your market segment enables us to create brand guidelines that align with industry standards for your customer base, including appropriate visual hierarchy and communication tone."\n  },\n  {\n    "id": "productCategory",\n    "question": "Which product category best describes your SaaS offering?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Project Management & Collaboration", "CRM & Sales Automation", "Marketing Technology", "Business Intelligence & Analytics", "HR & People Operations", "Financial Management", "Developer Tools & Infrastructure", "Customer Support & Service"],\n    "required": false,\n    "icon": "📊",\n    "helper": "Product category informs UI/UX patterns, iconography systems, and visual metaphors that resonate with your target users and align with category conventions."\n  },\n  {\n    "id": "deploymentModel",\n    "question": "What is your primary deployment and pricing model?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Cloud-Based Subscription", "On-Premise Enterprise", "Hybrid Cloud", "Freemium Model", "Usage-Based Pricing", "Per-Seat Licensing", "Enterprise Contracts"],\n    "required": false,\n    "icon": "💼",\n    "helper": "Deployment model influences brand positioning, messaging tone, and visual style to match customer expectations and industry standards for your business model."\n  }\n]\n
Example 2 - Healthcare Industry:\nIndustry: "Healthcare"\nOutput:\n[\n  {\n    "id": "healthcareType",\n    "question": "What type of healthcare services do you provide?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Hospital", "Clinic", "Telemedicine", "Pharmaceutical", "Medical Device", "Health Insurance", "Wellness/Preventive Care"],\n    "required": false,\n    "icon": "🏥",\n    "helper": "This helps us create appropriate imagery and compliance-focused guidelines"\n  },\n  {\n    "id": "patientDemographics",\n    "question": "Who is your primary patient demographic?",\n    "type": "text-with-suggestions",\n    "suggestions": ["General Public", "Seniors", "Children", "Women's Health", "Mental Health", "Chronic Care", "Emergency Care"],\n    "required": false,\n    "icon": "👨‍⚕️",\n    "helper": "This helps us tailor communication tone and visual style"\n  }\n]\n
Example 3 - Gaming Industry:\nIndustry: "Gaming"\nOutput:\n[\n  {\n    "id": "gameGenre",\n    "question": "What genre does your game fall into?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Action", "Adventure", "RPG", "Strategy", "Puzzle", "Racing", "Sports", "Simulation", "Fighting", "Horror", "MMO", "Mobile Casual"],\n    "required": false,\n    "icon": "🎮",\n    "helper": "This helps us create genre-appropriate visual style and color palettes"\n  },\n  {\n    "id": "targetAgeGroup",\n    "question": "What's your primary target age group?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Kids (6-12)", "Teens (13-17)", "Young Adults (18-25)", "Adults (26-35)", "Mature (36+)", "All Ages"],\n    "required": false,\n    "icon": "👥",\n    "helper": "This helps us tailor typography, imagery, and communication tone"\n  },\n  {\n    "id": "monetizationModel",\n    "question": "What's your monetization model?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Free-to-Play", "Premium/Paid", "Subscription", "In-App Purchases", "Ad-Supported", "Hybrid"],\n    "required": false,\n    "icon": "💰",\n    "helper": "This helps us create appropriate UI/UX guidelines and marketing materials"\n  }\n]\n
Example 4 - Fashion Industry:\nIndustry: "Fashion"\nOutput:\n[\n  {\n    "id": "fashionCategory",\n    "question": "What's your fashion category?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Luxury", "Streetwear", "Sustainable/Eco", "Fast Fashion", "Athleisure", "Vintage/Retro", "High-End Designer", "Accessible Fashion"],\n    "required": false,\n    "icon": "👗",\n    "helper": "This helps us create appropriate brand positioning and visual style"\n  },\n  {\n    "id": "targetMarket",\n    "question": "What's your primary market focus?",\n    "type": "text-with-suggestions",\n    "suggestions": ["Women's", "Men's", "Unisex", "Children's", "Plus Size", "Petite", "Luxury Market"],\n    "required": false,\n    "icon": "🌍",\n    "helper": "This helps us tailor photography and marketing guidelines"\n  }\n]\n
NOW GENERATE QUESTIONS FOR THIS INDUSTRY:\nIndustry: "${industry}"${contextInfo}\n
OUTPUT FORMAT (return ONLY valid JSON array, no markdown, no code blocks):\n[\n  {\n    "id": "uniqueQuestionId",\n    "question": "Question text",\n    "type": "text" | "text-with-suggestions" | "select",\n    "suggestions": ["option1", "option2", ...], // Only if type is "text-with-suggestions"\n    "required": false,\n    "icon": "emoji",\n    "helper": "Optional helper text"\n  }\n]\n
Return ONLY the JSON array, no additional text.\n
IMPORTANT: Generate 2-3 questions (preferably 2-3, not just 1) that cover different aspects of the ${industry} industry. Each question should help create more accurate and tailored brand guidelines. Think about what information would be most valuable for generating industry-specific colors, typography, imagery, and tone.`;
}

/**
 * Get basic essential questions (always asked)
 */
export function getEssentialQuestions(analysis: {
	brandName?: string;
	industry?: string;
	style?: string;
}): IndustryQuestion[] {
	const questions: IndustryQuestion[] = [];

	// Brand Name (if missing)
	if (!analysis.brandName) {
		questions.push({
			id: 'brandName',
			question: 'What is your brand name?',
			type: 'text',
			required: true,
			icon: '🏢',
			helper: 'This is the official name of your brand or company'
		});
	}

	// Industry (if missing)
	if (!analysis.industry) {
		questions.push({
			id: 'industry',
			question: 'What industry does your brand operate in?',
			type: 'text-with-suggestions',
			required: true,
			icon: '🎯',
			helper: 'Choose from common industries or type your own',
			suggestions: [
				'SaaS',
				'Fintech',
				'Healthcare',
				'E-commerce',
				'Retail',
				'Technology & Software',
				'Education & Learning',
				'Food & Beverage',
				'Fashion & Luxury',
				'Real Estate',
				'Consulting & Professional Services',
				'Non-profit & Social Impact',
				'Finance & Banking',
				'Healthcare & Medical',
				'Manufacturing & Industrial',
				'Travel & Hospitality',
				'Entertainment & Media',
				'Automotive',
				'Energy & Utilities',
				'Legal Services',
				'Marketing & Advertising',
				'Sports & Fitness',
				'Beauty & Personal Care',
				'Creative Agency & Design'
			]
		});
	}

	// Style/Vibe (ALWAYS ASK - even if mentioned)
	const styleOptions = [
		'Minimalistic',
		'Maximalistic',
		'Funky',
		'Futuristic',
		'Retro/Vintage',
		'Playful',
		'Professional',
		'Bold',
		'Modern',
		'Classic',
		'Elegant',
		'Luxury',
		'Casual',
		'Artistic',
		'Contemporary'
	];

	questions.push({
		id: 'style',
		question: analysis.style
			? `You mentioned "${analysis.style}". Please confirm this is the style you want, or choose a different one:`
			: "What's your brand's visual style/vibe?",
		type: 'text-with-suggestions',
		required: true,
		icon: '🎨',
		helper: 'Choose a style that best represents your brand\'s aesthetic',
		suggestions: styleOptions
	});

	// NOTE: Logo question is NOT added here - it will be added at the END after all industry questions
	// This ensures we have all information (industry, vibe, audience, etc.) before generating the logo

	return questions;
}

