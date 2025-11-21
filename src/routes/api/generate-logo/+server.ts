import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';

/**
 * API endpoint for generating professional logos using Gemini 2.5 Flash Image model
 */
export const POST: RequestHandler = async ({ request }) => {
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
			audience
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

		// Initialize Gemini
		const genAI = new GoogleGenerativeAI(apiKey);
		
		// Use gemini-2.5-flash for generating SVG logo code
		const model = genAI.getGenerativeModel({ 
			model: 'gemini-2.5-flash'
		});

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
		const enhancementPrompt = body.enhancementPrompt || body.feedback || '';
		
		const prompt = `You are a senior professional logo designer and SVG specialist. Create a single, unique, high-quality SVG logo for the brand described below.

${brandContext}
${enhancementPrompt ? `\n\nUSER ENHANCEMENT REQUEST:\n${enhancementPrompt}\n\nPlease incorporate these changes while maintaining professional quality and brand consistency.` : ''}

STRICT REQUIREMENTS & GUARDRAILS:

1. Output **ONLY** valid, standalone SVG markup (start with "<svg" and end with "</svg>"). No markdown, no code fences, no explanations, no extra text, no multiple-choice variants — exactly one <svg>...</svg>.

2. Do not reference or embed external resources (no external fonts, images, CSS, or scripts). Use vector shapes, paths, and system-safe font-family fallbacks only.

3. The SVG must have a transparent background and be resolution-independent (fully scalable).

4. Include a suitable viewBox that reflects the artwork (for example "0 0 400 200" for a horizontal logo) and set width/height attributes only if necessary.

5. Ensure the brand name "${brandName}" is clearly visible, legible at small sizes (32px) and balanced at large sizes. Use readable, professional typography and include a sensible font-family stack (primary font name plus generic fallback).

6. Choose a refined color palette that matches the ${style || 'professional'} style in ${brandContext} — prefer 2–3 harmonious colors. Ensure sufficient contrast for accessibility (text readable on transparent and light/dark backgrounds).

7. Keep shapes and paths clean and optimized: avoid unnecessary nodes, group related elements with <g>, and use unique ID attributes when needed.

8. No raster elements (PNG/JPEG). No embedded base64 bitmaps.

9. Include minimal accessibility metadata: a concise <title> and <desc> inside the SVG describing the logo and brand.

10. Do not include comments, editor metadata, or proprietary tool cruft (Inkscape/Illustrator metadata).

11. Use semantic structure: organize logo mark and wordmark into logical groups (e.g., <g id="mark"> and <g id="wordmark">).

12. Avoid text as outlines only — keep text elements as <text> when feasible so the logo remains editable, unless converting to paths is necessary for exact visual fidelity.

13. Ensure the SVG is safe: no script, no foreignObject, no event handlers, and no external links.

14. Produce a compact, well-formed SVG with reasonable attribute naming and no duplicate IDs.

DESIGN GUIDANCE (follow but do not output explanations):

- Style: clean, modern, timeless, and distinctive.

- Proportions: make the mark and logotype work well when stacked and when horizontal.

- Industry relevance: include relevant symbol(s) or abstract mark that reflect the brand context and ${industry || 'the brand'} industry in a tasteful, professional manner.

- Typography: choose a style matching the brand (e.g., geometric sans for futuristic; humanist sans for friendly; serif only if explicitly appropriate), then include a fallback stack.

- Color: suggest a primary color and one or two accent/neutral colors through the chosen palette in the SVG code itself.

OUTPUT FORMAT:

Return ONLY the complete SVG code. No additional text, no explanation. The SVG must include <title> and <desc>, proper namespaces (xmlns), and be valid XML/SVG.

Now generate the SVG.`;

		console.log('[generate-logo] Generating logo SVG with Gemini...');

		// Generate SVG logo code using Gemini
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		
		// Extract SVG code from response
		let svgCode = text.trim();
		
		// Remove markdown code blocks if present
		svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').replace(/```html\n?/g, '');
		svgCode = svgCode.replace(/^<svg/, '<svg').trim();
		
		// Ensure it starts with <svg
		if (!svgCode.startsWith('<svg')) {
			// Try to find SVG tag in the text
			const svgMatch = svgCode.match(/<svg[\s\S]*<\/svg>/i);
			if (svgMatch) {
				svgCode = svgMatch[0];
			} else {
				throw new Error('Generated content does not contain valid SVG code');
			}
		}
		
		// Validate SVG structure
		if (!svgCode.includes('</svg>')) {
			throw new Error('Generated SVG code is incomplete');
		}
		
		// Convert SVG to base64 data URL for easy use
		const base64Svg = Buffer.from(svgCode).toString('base64');
		const imageData = `data:image/svg+xml;base64,${base64Svg}`;

		console.log('[generate-logo] Logo generated successfully');

		return json({
			success: true,
			logoData: imageData,
			filename: `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
			type: 'ai-generated',
			svgCode: svgCode // Also return raw SVG for potential editing
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

