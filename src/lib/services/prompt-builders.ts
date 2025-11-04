/**
 * Prompt Builders for Different AI Tasks
 * Generates optimized prompts for Groq and Gemini
 */

import type { StepData, BrandData, LogoPlacement } from '$lib/types/presentation-agent';

/**
 * Build prompt for batch content analysis
 */
export function buildContentAnalysisPrompt(
	slides: StepData[],
	provider: 'groq' | 'gemini'
): any {
	const slideData = slides.map((s, i) => ({
		index: i,
		step: s.step,
		title: s.title,
		contentPreview: s.content.substring(0, 600) // Truncate to save tokens
	}));

	const systemPrompt = `Analyze presentation slides. Return JSON.

For each slide determine:
1. Content type: color_palette | typography | text_heavy | list | visual_grid | iconography | photography | mixed
2. Key elements: colors, fonts, images, bullets, icons
3. Best slide type: visual_grid | typography_showcase | text_heavy | list_slide | card_layout
4. Complexity: simple | medium | complex

Output schema:
{
  "slides": [
    {
      "index": 0,
      "contentType": "color_palette",
      "elements": {
        "hasColors": true,
        "colorCount": 3,
        "hasBullets": true,
        "bulletCount": 5,
        "hasHeadings": 2,
        "hasImages": false,
        "hasFonts": false,
        "fontCount": 0,
        "hasIcons": false,
        "iconCount": 0,
        "textLength": 250,
        "keyElements": ["color_swatches", "hex_codes"]
      },
      "recommendedSlideType": "visual_grid",
      "complexity": "medium",
      "estimatedSlides": 1
    }
  ],
  "totalSlides": 8,
  "averageComplexity": "medium"
}`;

	if (provider === 'groq') {
		return [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: JSON.stringify(slideData) }
		];
	} else {
		// Gemini format
		return `${systemPrompt}\n\nAnalyze these slides:\n${JSON.stringify(slideData, null, 2)}`;
	}
}

/**
 * Build prompt for batch layout design
 */
export function buildLayoutDesignPrompt(
	analysis: any,
	logoPlacement: LogoPlacement | null,
	brandData: BrandData,
	provider: 'groq' | 'gemini'
): any {
	const data = {
		analysis: analysis.slides || [],
		brand: {
			name: brandData.brandName || 'Brand',
			colors: brandData.brandColors || ['#2C504D', '#E2AB4A'],
			primaryFont: brandData.primaryFont || 'Inter',
			secondaryFont: brandData.secondaryFont || 'Arial'
		},
		logo: logoPlacement
	};

	const systemPrompt = `Design professional slide layouts. Return JSON.

CONSTRAINTS:
- Slide: 10"×5.625" (16:9)
- Margins: 0.5" all sides
- Font: 14-44pt
- Grid: 0.25" alignment
- No overflow
- Balanced visual weight

SLIDE TYPES & LAYOUTS:

1. visual_grid (colors/icons):
   - Header: 0.5,0.3,9,0.8 @ 36pt bold
   - Grid: 3-4 columns, 0.3" spacing
   - Each item: ~2.5"×2" with swatch, label, description

2. typography_showcase:
   - Header: 0.5,0.3,9,0.8 @ 36pt bold
   - 2 font cards: 4.5"×3.5" each
   - Show alphabet preview

3. text_heavy:
   - Header: 0.5,0.3,9,0.8 @ 32pt bold
   - 2 columns: 4.2"×3.5" each
   - Body: 16pt, 1.4 line height

4. list_slide:
   - Header: 0.5,0.3,9,0.8 @ 36pt bold
   - Bullets: 0.5,1.5,8.5,3.5 @ 18-24pt
   - Max 8 bullets

5. card_layout (mission/vision/values):
   - Header: 0.5,0.3,9,0.7 @ 32pt bold
   - 2-4 cards: equal width with 0.3" spacing
   - Each card: title + content + background

OUTPUT: Return JSON array of slide layouts:
{
  "slides": [
    {
      "index": 0,
      "slideType": "visual_grid",
      "regions": [
        {
          "type": "text",
          "role": "header",
          "binding": "title",
          "position": {"x": 0.5, "y": 0.3, "w": 9, "h": 0.8},
          "style": {"fontSize": 36, "bold": true, "color": "2C504D", "align": "left"}
        },
        {
          "type": "color_swatch",
          "position": {"x": 1, "y": 1.5, "w": 2.5, "h": 2},
          "metadata": {"color": "#2C504D", "name": "Primary", "description": "Main brand color"}
        }
      ]
    }
  ]
}`;

	if (provider === 'groq') {
		return [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: JSON.stringify(data) }
		];
	} else {
		return `${systemPrompt}\n\nDesign layouts for:\n${JSON.stringify(data, null, 2)}`;
	}
}

/**
 * Build prompt for logo analysis
 */
export function buildLogoAnalysisPrompt(
	logoFile: { fileData: string },
	provider: 'groq' | 'gemini'
): any {
	const prompt = `Analyze this logo and recommend optimal placement on slides.

Return JSON:
{
  "aspectRatio": 1.5,
  "positions": {
    "cover": {"x": 0.5, "y": 0.5, "w": 2, "h": 1.33},
    "header": {"x": 8.5, "y": 0.3, "w": 1, "h": 0.67},
    "content": {"x": 9, "y": 0.2, "w": 0.8, "h": 0.53}
  },
  "showOnAllSlides": false,
  "reasoning": "Logo is horizontal, best in header at small size"
}`;

	if (provider === 'groq') {
		// Llama 4 Scout format (vision)
		return [
			{
				role: 'user',
				content: [
					{ type: 'text', text: prompt },
					{ type: 'image_url', image_url: { url: logoFile.fileData } }
				]
			}
		];
	} else {
		// Gemini Vision format
		const base64Data = logoFile.fileData.includes(',')
			? logoFile.fileData.split(',')[1]
			: logoFile.fileData;

		return [
			prompt,
			{
				inlineData: {
					data: base64Data,
					mimeType: 'image/jpeg'
				}
			}
		];
	}
}

/**
 * Build prompt for overflow decision
 */
export function buildOverflowPrompt(
	params: {
		content: string;
		textLength: number;
		boxWidth: number;
		boxHeight: number;
		currentFontSize: number;
		minFontSize: number;
	},
	provider: 'groq' | 'gemini'
): any {
	const prompt = `Content doesn't fit in box. Decide best strategy.

Content: "${params.content.substring(0, 300)}..."
Length: ${params.textLength} chars
Box: ${params.boxWidth}"W × ${params.boxHeight}"H
Current font: ${params.currentFontSize}pt
Min font: ${params.minFontSize}pt

STRATEGIES:
1. shrink_font: Reduce to min ${params.minFontSize}pt
2. split_columns: Split into 2-3 columns
3. create_continuation: Multiple slides
4. remove_whitespace: Tighten spacing

Return JSON:
{
  "strategy": "shrink_font",
  "parameters": {"newFontSize": 16},
  "reasoning": "Content fits at 16pt",
  "willFit": true
}`;

	if (provider === 'groq') {
		return [
			{
				role: 'system',
				content: 'You are a layout expert. Choose best overflow strategy.'
			},
			{ role: 'user', content: prompt }
		];
	} else {
		return prompt;
	}
}

/**
 * Build prompt for quality validation
 */
export function buildValidationPrompt(layout: any, provider: 'groq' | 'gemini'): any {
	const systemPrompt = `Validate slide layout quality.

CHECK:
1. Text overflow: No text cut off
2. Font size: Min 14pt
3. Contrast: Min 4.5:1 ratio
4. Alignment: To 0.25" grid
5. Spacing: Min 0.25" between elements
6. Balance: Visual weight distributed

Return JSON:
{
  "passed": true,
  "score": 92,
  "issues": [
    {
      "severity": "warning",
      "type": "font_size",
      "description": "Caption text at 13pt (min 14pt)",
      "element": "footer_text"
    }
  ],
  "suggestions": [
    "Increase footer font to 14pt",
    "Add more spacing between title and body"
  ]
}`;

	if (provider === 'groq') {
		return [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: JSON.stringify(layout) }
		];
	} else {
		return `${systemPrompt}\n\nValidate this layout:\n${JSON.stringify(layout, null, 2)}`;
	}
}

/**
 * Estimate tokens for a prompt
 */
export function estimatePromptTokens(prompt: any): number {
	let textLength = 0;

	if (typeof prompt === 'string') {
		textLength = prompt.length;
	} else if (Array.isArray(prompt)) {
		for (const item of prompt) {
			if (typeof item === 'string') {
				textLength += item.length;
			} else if (item.content) {
				if (typeof item.content === 'string') {
					textLength += item.content.length;
				} else if (Array.isArray(item.content)) {
					for (const contentItem of item.content) {
						if (contentItem.text) {
							textLength += contentItem.text.length;
						}
					}
				}
			}
		}
	}

	// Rough estimation: 1 token ≈ 4 characters
	// Add 20% buffer
	return Math.ceil((textLength / 4) * 1.2);
}

