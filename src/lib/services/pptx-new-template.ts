import PptxGenJS from 'pptxgenjs';
import { optimizeSlideLayoutWithGemini, splitContentWithHeadings } from './gemini';

interface BrandData {
	brandName?: string;
	brandDomain?: string;
	shortDescription?: string;
	stepHistory?: Array<{
		step: string;
		title?: string;
		content: string;
		approved: boolean;
	}>;
	logoFiles?: Array<{
		filename: string;
		fileData: string; // Base64 data URL
		usageTag: string;
	}>;
	website?: string;
	contactEmail?: string;
	contactPhone?: string;
}

/**
 * Convert alignment number to pptxgenjs format
 */
function getAlignment(alignment: number | null): any {
	const map: Record<number, string> = {
		1: 'left',
		2: 'center',
		3: 'right',
		4: 'justify'
	};
	return alignment !== null ? map[alignment] || 'left' : 'left';
}

/**
 * Get step content by step ID
 */
function getStepContent(stepId: string, stepHistory: any[]): string {
	const step = stepHistory.find((s: any) => s.step === stepId && s.approved);
	return step?.content || '';
}

/**
 * Get step title by step ID (AI-generated title)
 */
function getStepTitle(stepId: string, stepHistory: any[]): string {
	const step = stepHistory.find((s: any) => s.step === stepId && s.approved);
	return step?.title || '';
}

/**
 * Smart keyword extraction for slide headings with "Brand" prefix
 * Extracts important keywords from full AI-generated titles
 */
function extractSlideHeading(fullTitle: string): string {
	if (!fullTitle) return '';
	
	// Clean the title first
	let title = fullTitle.trim();
	
	// Remove common prefixes like brand names (e.g., "Zingrata")
	title = title.replace(/^[A-Za-z]+\s+/, '');
	
	// Split by common separators and take the first meaningful part
	const separators = [':', ' - ', ' – ', ' — '];
	for (const sep of separators) {
		if (title.includes(sep)) {
			title = title.split(sep)[0].trim();
			break;
		}
	}
	
	// Extract key concepts - look for important nouns and concepts
	const words = title.split(/\s+/);
	
	// Priority keywords for brand guidelines (these get "Brand" prefix)
	const priorityKeywords = [
		'color', 'palette', 'typography', 'fonts', 'iconography', 'icons',
		'photography', 'images', 'logo', 'applications', 'guidelines',
		'positioning', 'mission', 'vision', 'values', 'identity', 'voice',
		'strategy', 'messaging', 'content', 'tone', 'style', 'design'
	];
	
	// Keywords that don't need "Brand" prefix (already complete concepts)
	const standaloneKeywords = [
		'brand positioning', 'brand identity', 'brand strategy', 'brand voice',
		'mission statement', 'vision statement', 'brand values'
	];
	
	// Check for standalone keywords first
	const titleLower = title.toLowerCase();
	for (const standalone of standaloneKeywords) {
		if (titleLower.includes(standalone)) {
			return standalone.split(' ').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1)
			).join(' ');
		}
	}
	
	// Find priority keywords and add "Brand" prefix
	for (const word of words) {
		const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
		if (priorityKeywords.includes(cleanWord)) {
			// Capitalize the keyword properly
			const capitalizedKeyword = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
			return `Brand ${capitalizedKeyword}`;
		}
	}
	
	// If no priority keyword found, take the first 1-2 meaningful words and add "Brand" prefix
	const meaningfulWords = words.filter(word => 
		word.length > 2 && 
		!['the', 'and', 'for', 'with', 'from', 'to', 'of', 'in', 'on', 'at', 'by'].includes(word.toLowerCase())
	);
	
	if (meaningfulWords.length >= 2) {
		const concept = meaningfulWords.slice(0, 2).map(word => 
			word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		).join(' ');
		return `Brand ${concept}`;
	} else if (meaningfulWords.length === 1) {
		const concept = meaningfulWords[0].charAt(0).toUpperCase() + meaningfulWords[0].slice(1).toLowerCase();
		return `Brand ${concept}`;
	}
	
	// Fallback: add "Brand" to first word
	return `Brand ${words[0] || 'Guidelines'}`;
}

/**
 * Extract Mission and Vision from brand positioning content
 * Preserves markdown formatting for visual rendering
 */
function extractMissionVision(content: string): { mission: string; vision: string } {
	if (!content) return { mission: '', vision: '' };
	
	// Clean content first - remove any Latin placeholder text
	const cleanContent = content.replace(/hendrerit augue blandit, ut posuere erat aliquam\./g, '');
	
	// Try multiple patterns to extract Mission and Vision
	const patterns = [
		// Pattern 1: **Mission**: content until next ** or end
		/\*\*Mission\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i,
		// Pattern 2: Mission: content (without **)
		/Mission:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i,
		// Pattern 3: Mission - content
		/Mission\s*-\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i
	];
	
	const visionPatterns = [
		// Pattern 1: **Vision**: content until next ** or end
		/\*\*Vision\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i,
		// Pattern 2: Vision: content (without **)
		/Vision:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i,
		// Pattern 3: Vision - content
		/Vision\s*-\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i
	];
	
	let mission = '';
	let vision = '';
	
	// Try to extract Mission
	for (const pattern of patterns) {
		const match = cleanContent.match(pattern);
		if (match && match[1]) {
			mission = match[1].trim().replace(/\s+/g, ' '); // Clean up whitespace
			break;
		}
	}
	
	// Try to extract Vision
	for (const pattern of visionPatterns) {
		const match = cleanContent.match(pattern);
		if (match && match[1]) {
			vision = match[1].trim().replace(/\s+/g, ' '); // Clean up whitespace
			break;
		}
	}
	
	// If no specific Mission/Vision found, but content exists, split by paragraphs
	if (!mission && !vision && cleanContent.trim()) {
		const paragraphs = cleanContent.split(/\n\n+/).filter(p => p.trim());
		if (paragraphs.length >= 2) {
			mission = paragraphs[0].trim();
			vision = paragraphs[1].trim();
		} else if (paragraphs.length === 1) {
			mission = paragraphs[0].trim();
		}
	}
	
	return { mission, vision };
}

/**
 * Convert markdown to formatted text array for PowerPoint
 * Preserves bullets, bold text, color codes, icons, and ALL special characters EXACTLY as generated
 */
function markdownToFormattedText(markdown: string, baseFontSize: number = 26, baseColor: string = '000000'): any[] {
	if (!markdown) return [];
	
	const lines = markdown.split('\n');
	const formattedText: any[] = [];
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		// Skip empty lines (but preserve spacing)
		if (!line.trim()) {
			if (i > 0 && formattedText.length > 0) {
				formattedText.push({ text: '\n', options: { fontSize: baseFontSize, color: baseColor, breakLine: true } });
			}
			continue;
		}
		
		// Handle bullet points (*, -, •) - KEEP ALL CONTENT EXACTLY
		const bulletMatch = line.match(/^[\s]*[*\-•]\s+(.+)/);
		if (bulletMatch) {
			const bulletContent = bulletMatch[1];
			
			// Add bullet
			formattedText.push({ 
				text: '• ', 
				options: { fontSize: baseFontSize, color: baseColor, breakLine: false } 
			});
			
			// Parse bullet content for bold/italic only, KEEP everything else
			const contentRuns = parseInlineFormattingPreserveAll(bulletContent, baseFontSize, baseColor);
			contentRuns.forEach((run: any, idx: number) => {
				formattedText.push({
					text: run.text,
					options: { ...run.options, breakLine: idx === contentRuns.length - 1 }
				});
			});
			continue;
		}
		
		// Handle headers (##, ###)
		const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
		if (headerMatch) {
			const headerText = headerMatch[2];
			const headerSize = baseFontSize + 6;
			const headerRuns = parseInlineFormattingPreserveAll(headerText, headerSize, baseColor);
			headerRuns.forEach((run: any, idx: number) => {
				formattedText.push({
					text: run.text,
					options: { ...run.options, bold: true, breakLine: idx === headerRuns.length - 1 }
				});
			});
			continue;
		}
		
		// Handle bold labels (e.g., "**Primary Colors**:" or "**Mission**:")
		const labelMatch = line.match(/^\*\*(.+?):\*\*/);
		if (labelMatch) {
			formattedText.push({
				text: labelMatch[1] + ':',
				options: { fontSize: baseFontSize, bold: true, color: baseColor, breakLine: true }
			});
			
			// Rest of line after label (if any)
			const restOfLine = line.substring(labelMatch[0].length).trim();
			if (restOfLine) {
				const restRuns = parseInlineFormattingPreserveAll(restOfLine, baseFontSize, baseColor);
				restRuns.forEach((run: any, idx: number) => {
					formattedText.push({
						text: run.text,
						options: { ...run.options, breakLine: idx === restRuns.length - 1 }
					});
				});
			}
			continue;
		}
		
		// Regular text - PRESERVE EVERYTHING
		const lineRuns = parseInlineFormattingPreserveAll(line, baseFontSize, baseColor);
		lineRuns.forEach((run: any, idx: number) => {
			formattedText.push({
				text: run.text,
				options: { ...run.options, breakLine: idx === lineRuns.length - 1 }
			});
		});
	}
	
	return formattedText;
}

/**
 * Parse inline formatting (bold/italic) while PRESERVING ALL OTHER CONTENT
 * CRITICAL: Keeps color codes (#E2AB4A), icons (⚫⚕⚙), dashes, ALL special characters
 */
function parseInlineFormattingPreserveAll(text: string, fontSize: number, color: string): any[] {
	if (!text) return [];
	
	const runs: any[] = [];
	const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|([^*]+)/g;
	let match;
	
	while ((match = regex.exec(text)) !== null) {
		if (match[2]) {
			// Bold text - KEEP EXACT CONTENT (including color codes, icons, everything)
			runs.push({ text: match[2], options: { fontSize, bold: true, color } });
		} else if (match[4]) {
			// Italic text - KEEP EXACT CONTENT
			runs.push({ text: match[4], options: { fontSize, italic: true, color } });
		} else if (match[5]) {
			// Plain text - DO NOT STRIP ANYTHING, keep as-is
			runs.push({ text: match[5], options: { fontSize, color } });
		}
	}
	
	return runs.length > 0 ? runs : [{ text: text, options: { fontSize, color } }];
}

/**
 * Estimate text height without canvas (serverless-friendly)
 * Uses character counting and average metrics
 */
function estimateTextHeight(text: string, fontSize: number, boxWidth: number, lineHeightMult: number = 1.4): number {
	if (!text) return 0;
	
	// Average character width is approximately 0.5 * fontSize for most fonts
	const avgCharWidth = fontSize * 0.5;
	const effectiveWidth = Math.max(boxWidth - 20, boxWidth * 0.9); // Account for padding
	const charsPerLine = Math.floor(effectiveWidth / avgCharWidth);
	
	const lines = text.split('\n');
	let totalLines = 0;
	
	for (const line of lines) {
		if (!line.trim()) {
			totalLines += 0.5; // Empty line spacing
			continue;
		}
		
		// Account for bullets (visual indent)
		const isBullet = line.trim().startsWith('•') || line.trim().match(/^[*\-•]/);
		const effectiveChars = isBullet ? charsPerLine - 2 : charsPerLine;
		
		// Calculate wrapped lines
		const lineLength = line.length;
		const wrappedLines = Math.ceil(lineLength / Math.max(effectiveChars, 1));
		totalLines += wrappedLines;
	}
	
	return totalLines * fontSize * lineHeightMult;
}

/**
 * Smart paragraph-aware splitting (ChatGPT-inspired, serverless-friendly)
 * Keeps content coherent by preserving paragraph boundaries
 */
function smartSplitContent(
	content: string, 
	maxChars: number, 
	boxWidth: number, 
	fontSize: number, 
	boxHeight: number,
	lineHeightMult: number = 1.4
): string[] {
	if (!content) return [];
	
	// Quick check: if content fits, return as-is
	const estimatedHeight = estimateTextHeight(content, fontSize, boxWidth, lineHeightMult);
	if (estimatedHeight <= boxHeight && content.length <= maxChars) {
		return [content];
	}
	
	const chunks: string[] = [];
	const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
	
	let currentChunk = '';
	let i = 0;
	
	while (i < paragraphs.length) {
		const para = paragraphs[i];
		const testChunk = currentChunk ? currentChunk + '\n\n' + para : para;
		
		// Estimate if adding this paragraph fits
		const estimatedHeight = estimateTextHeight(testChunk, fontSize, boxWidth, lineHeightMult);
		
		if (estimatedHeight <= boxHeight && testChunk.length <= maxChars) {
			// Fits! Add paragraph to current chunk
			currentChunk = testChunk;
			i++;
		} else {
			// Doesn't fit
			if (currentChunk) {
				// Save current chunk and start new one
				chunks.push(currentChunk.trim());
				currentChunk = '';
			} else {
				// Single paragraph too large - need to split it
				const splitPara = splitLongParagraph(para, maxChars, boxWidth, fontSize, boxHeight, lineHeightMult);
				chunks.push(...splitPara);
				i++;
			}
		}
	}
	
	// Add final chunk
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}
	
	return chunks.length > 0 ? chunks : [content];
}

/**
 * Split a single long paragraph by sentences or hard boundaries
 */
function splitLongParagraph(
	paragraph: string,
	maxChars: number,
	boxWidth: number,
	fontSize: number,
	boxHeight: number,
	lineHeightMult: number
): string[] {
	// Try splitting by sentences first
	const sentences = paragraph.split(/(?<=[.!?])\s+/);
	
	if (sentences.length === 1) {
		// Single long sentence - hard split by character count
		const chunks: string[] = [];
		let remaining = paragraph;
		
		while (remaining.length > 0) {
			const chunk = remaining.substring(0, maxChars);
			chunks.push(chunk);
			remaining = remaining.substring(maxChars);
		}
		
		return chunks;
	}
	
	// Pack sentences into chunks
	const chunks: string[] = [];
	let currentChunk = '';
	
	for (const sentence of sentences) {
		const testChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
		const estimatedHeight = estimateTextHeight(testChunk, fontSize, boxWidth, lineHeightMult);
		
		if (estimatedHeight <= boxHeight && testChunk.length <= maxChars) {
			currentChunk = testChunk;
		} else {
			if (currentChunk) {
				chunks.push(currentChunk.trim());
			}
			currentChunk = sentence;
		}
	}
	
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}
	
	return chunks;
}

/**
 * Calculate optimal font size with gradual shrinking
 */
function calculateOptimalFontSize(
	text: string,
	startFontSize: number,
	minFontSize: number,
	shrinkStep: number,
	boxWidth: number,
	boxHeight: number,
	lineHeightMult: number
): number {
	let currentSize = startFontSize;
	
	while (currentSize >= minFontSize) {
		const estimatedHeight = estimateTextHeight(text, currentSize, boxWidth, lineHeightMult);
		
		if (estimatedHeight <= boxHeight) {
			return currentSize;
		}
		
		currentSize -= shrinkStep;
	}
	
	return minFontSize;
}

/**
 * Aggressively clean content by removing ALL placeholder text and fixing issues
 */
function cleanContent(content: string): string {
	if (!content) return content;
	
	let cleaned = content;
	
	// Remove ALL Latin placeholder text patterns (comprehensive list)
	const latinPatterns = [
		/hendrerit augue blandit, ut posuere erat aliquam\.?/gi,
		/ut posuere erat aliquam\.?/gi,
		/Praesent auctor tellus eget nisl blandit, at varius purus elementum\.?/gi,
		/Lorem ipsum dolor sit amet, consectetur adipiscing elit\.?/gi,
		/Quisque molestie nisl eu sem tristique, sit amet convallis ex aliquam\.?/gi,
		/Maecenas varius lectus hendrerit augue blandit\.?/gi,
		/at varius purus elementum\.?/gi,
		/consectetur adipiscing elit\.?/gi,
		/dolor sit amet\.?/gi,
		/ut posuere erat\.?/gi,
		/aliquam\.?/gi,
		/hendrerit\.?/gi,
		/blandit\.?/gi,
		/posuere\.?/gi,
		/varius\.?/gi,
		/purus\.?/gi,
		/elementum\.?/gi
	];
	
	// Apply all Latin pattern removal
	latinPatterns.forEach(pattern => {
		cleaned = cleaned.replace(pattern, '');
	});
	
	// Remove incomplete sentences (ending with ... or incomplete phrases)
	cleaned = cleaned.replace(/\.\.\.\s*[a-z]+[^.!?]*$/g, '');
	cleaned = cleaned.replace(/,\s*[a-z]+[^.!?]*$/g, '');
	
	// Fix concatenation issues (words merged without spaces)
	cleaned = cleaned.replace(/([a-zA-Z])\.([a-zA-Z])/g, '$1. $2'); // Add space after periods
	cleaned = cleaned.replace(/([a-zA-Z])([A-Z][a-z])/g, '$1 $2'); // Add space between camelCase
	cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
	
	// Clean up multiple spaces and normalize
	cleaned = cleaned.replace(/\s+/g, ' ').trim();
	
	// Remove empty paragraphs
	cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
	
	// If content is too short or mostly placeholder, return empty
	if (cleaned.length < 10 || /^[^a-zA-Z]*$/.test(cleaned)) {
		return '';
	}
	
	return cleaned;
}

/**
 * Strictly validate and clean slides to prevent duplication and ensure quality
 */
function validateAndCleanSlides(slides: Array<{title: string, content: string}>): Array<{title: string, content: string}> {
	if (!slides || slides.length === 0) return [];
	
	const validatedSlides = [];
	const seenContent = new Set<string>();
	const seenTitles = new Set<string>();
	
	for (const slide of slides) {
		// Clean the content again to be absolutely sure
		const cleanedContent = cleanContent(slide.content);
		
		// Skip if content is too short or empty
		if (!cleanedContent || cleanedContent.length < 20) {
			console.warn('⚠️ Skipping slide with insufficient content:', slide.title);
			continue;
		}
		
		// Check for content duplication
		const contentHash = cleanedContent.toLowerCase().replace(/\s+/g, ' ').trim();
		if (seenContent.has(contentHash)) {
			console.warn('⚠️ Skipping duplicate content:', slide.title);
			continue;
		}
		
		// Check for title duplication
		const titleHash = slide.title.toLowerCase().replace(/\s+/g, ' ').trim();
		if (seenTitles.has(titleHash)) {
			console.warn('⚠️ Skipping duplicate title:', slide.title);
			continue;
		}
		
		// Validate content quality
		if (containsPlaceholderText(cleanedContent)) {
			console.warn('⚠️ Skipping slide with placeholder text:', slide.title);
			continue;
		}
		
		// Add to validated slides
		validatedSlides.push({
			title: slide.title,
			content: cleanedContent
		});
		
		// Track what we've seen
		seenContent.add(contentHash);
		seenTitles.add(titleHash);
		
		console.log('✅ Validated slide:', slide.title, `(${cleanedContent.length} chars)`);
	}
	
	return validatedSlides;
}

/**
 * Check if content contains any placeholder text
 */
function containsPlaceholderText(content: string): boolean {
	const placeholderPatterns = [
		/ut posuere erat/gi,
		/hendrerit/gi,
		/aliquam/gi,
		/lorem ipsum/gi,
		/consectetur adipiscing/gi,
		/dolor sit amet/gi,
		/praesent auctor/gi,
		/maecenas varius/gi,
		/varius purus/gi,
		/elementum/gi
	];
	
	return placeholderPatterns.some(pattern => pattern.test(content));
}

/**
 * Remove empty spaces and unused regions from template
 */
function cleanEmptySpaces(template: any): any {
	if (!template.content_regions) return template;
	
	// Filter out regions with empty or whitespace-only content
	const cleanedRegions = template.content_regions.filter((region: any) => {
		// Keep regions without content_binding (decorative elements)
		if (!region.content_binding) return true;
		
		// Remove regions with empty content bindings
		const binding = region.content_binding.trim();
		if (!binding || binding === '') return false;
		
		// Remove regions that only contain whitespace or placeholder text
		if (binding.match(/^\s*$/) || binding.match(/^(empty|placeholder|none)$/i)) {
			return false;
		}
		
		return true;
	});
	
	return {
		...template,
		content_regions: cleanedRegions
	};
}

/**
 * Extract plain text from markdown (for titles/labels only)
 */
function extractPlainText(markdown: string, maxLength = 500): string {
	if (!markdown) return '';
	
	let text = markdown
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/#{1,6}\s+/g, '')
		.replace(/\n{2,}/g, '\n\n')
		.trim();
	
	if (text.length > maxLength) {
		text = text.substring(0, maxLength - 3) + '...';
	}
	
	return text;
}

/**
 * Get AI-generated content for cover slide subtitle
 */
function getAICoverContent(brandData: BrandData): string {
	if (!brandData?.stepHistory) return '';
	
	// Look for brand positioning content first (most relevant for cover)
	const brandPositioning = brandData.stepHistory.find((s: any) => 
		s.step === 'brand-positioning' && s.approved
	);
	
	if (brandPositioning?.content) {
		// Extract a short tagline or key phrase from the AI content
		const content = brandPositioning.content;
		
		// Look for taglines, mottos, or key phrases in the content
		const taglineMatch = content.match(/\*\*Tagline\*\*:?\s*([^\n]+)/i) ||
							content.match(/\*\*Motto\*\*:?\s*([^\n]+)/i) ||
							content.match(/\*\*Slogan\*\*:?\s*([^\n]+)/i);
		
		if (taglineMatch) {
			return extractPlainText(taglineMatch[1], 100);
		}
		
		// Extract first sentence or key phrase
		const firstSentence = content.split(/[.!?]/)[0];
		if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
			return extractPlainText(firstSentence, 100);
		}
		
		// Extract a meaningful phrase from the content
		const meaningfulPhrase = extractPlainText(content, 80);
		return meaningfulPhrase;
	}
	
	// Fallback to any approved step content
	const anyStep = brandData.stepHistory.find((s: any) => s.approved && s.content);
	if (anyStep?.content) {
		return extractPlainText(anyStep.content, 80);
	}
	
	return '';
}

/**
 * Create 3 custom slides for brand positioning content
 */
function createBrandPositioningSlides(step: any, contentTemplate: any): any[] {
	const content = step.content || '';
	const slides: any[] = [];
	
	// Extract content sections
	const positioningMatch = content.match(/\*\*Brand Positioning\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	const missionMatch = content.match(/\*\*Mission\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	const visionMatch = content.match(/\*\*Vision\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	const valuesMatch = content.match(/\*\*Core Values\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	const audienceMatch = content.match(/\*\*Target Audience\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	const voiceMatch = content.match(/\*\*Voice & Tone\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
	
	// Slide 1: Brand Positioning Statement
	if (positioningMatch) {
		slides.push({
			template: contentTemplate,
			slideType: 'content',
			stepData: {
				...step,
				content: `**Brand Positioning**\n\n${positioningMatch[1].trim()}`,
				title: 'Brand Positioning'
			},
			customSlideType: 'positioning-statement'
		});
	}
	
	// Slide 2: Mission, Vision, Core Values (3 cards)
	if (missionMatch || visionMatch || valuesMatch) {
		slides.push({
			template: contentTemplate,
			slideType: 'content',
			stepData: {
				...step,
				content: '', // Will be handled by custom card layout
				title: 'Mission, Vision & Values',
				// Card data for custom rendering
				cards: [
					{
						title: 'Mission',
						content: missionMatch ? missionMatch[1].trim() : '',
						position: { x: 0.5, y: 2.0, w: 2.8, h: 2.2 }
					},
					{
						title: 'Vision', 
						content: visionMatch ? visionMatch[1].trim() : '',
						position: { x: 3.6, y: 2.0, w: 2.8, h: 2.2 }
					},
					{
						title: 'Core Values',
						content: valuesMatch ? valuesMatch[1].trim() : '',
						position: { x: 6.7, y: 2.0, w: 2.8, h: 2.2 }
					}
				]
			},
			customSlideType: 'mission-vision-values'
		});
	}
	
	// Slide 3: Target Audience, Voice & Tone (2 cards)
	if (audienceMatch || voiceMatch) {
		slides.push({
			template: contentTemplate,
			slideType: 'content',
			stepData: {
				...step,
				content: '', // Will be handled by custom card layout
				title: 'Audience & Voice',
				// Card data for custom rendering
				cards: [
					{
						title: 'Target Audience',
						content: audienceMatch ? audienceMatch[1].trim() : '',
						position: { x: 0.5, y: 2.0, w: 4.2, h: 2.5 }
					},
					{
						title: 'Voice & Tone',
						content: voiceMatch ? voiceMatch[1].trim() : '',
						position: { x: 5.0, y: 2.0, w: 4.2, h: 2.5 }
					}
				]
			},
			customSlideType: 'audience-voice'
		});
	}
	
	return slides;
}

/**
 * Replace template text with brand data and generated content
 */
function replaceText(text: string, brandData: BrandData, slideData: any): string {
	if (!text) return text;
	
	let result = text;
	
	// Handle based on slide type
	if (slideData.slideType === 'cover') {
		// Cover slide - use AI-generated content only
		if (text === 'Pitch Deck') {
			result = 'Brand Guidelines';
		}
		if (text === 'Business Presentation') {
			// Show brand name as the main title
			result = brandData.brandName || '';
		}
		// For the subtitle area, show AI-generated content
		if (text.includes('Brand Identity') || text.includes('Zingrata Brand Identity')) {
			// Use AI-generated content from stepHistory
			const aiContent = getAICoverContent(brandData);
			result = aiContent || '';
		}
		// Hide standalone "Brand" text completely
		if (text === 'Brand') {
			result = ''; // Hide the Brand text completely
		}
		// Replace any template company names with brand name
		if (brandData.brandName && (text === 'Rimberio Company' || text === 'Aaron Loeb')) {
			result = brandData.brandName;
		}
	} else if (slideData.slideType === 'content' && slideData.stepData) {
		// Content slide - use step data
		const step = slideData.stepData;
		
		// Special handling for brand-positioning custom slides
		if (step.step === 'brand-positioning') {
			// Replace heading with custom slide title
			if (text.includes('Who We') || text === 'Who We \nAre' || 
			    text.includes('Market') || text.includes('Services') || 
			    text.includes('Why') || text.includes('Team') || 
			    text.includes('Portfolio') || text.includes('Performance') ||
			    text.includes('Next for Us')) {
				// Use the custom title from stepData
				result = step.title || extractSlideHeading(step.title || '');
			}
			// Replace Lorem ipsum with custom slide content
			else if (text.includes('Lorem ipsum')) {
				result = step.content || ''; // Return custom slide content
			}
		}
		// Other content slides
		else {
			// Replace heading with AI-generated title
			if (text.includes('Market') || text.includes('Services') || 
			    text.includes('Why') || text.includes('Team') || 
			    text.includes('Portfolio') || text.includes('Performance') ||
			    text.includes('Next for Us')) {
				const fullTitle = step.title || '';
				result = extractSlideHeading(fullTitle);
			}
			// Replace Lorem ipsum with AI content (exact match from steps)
			else if (text.includes('Lorem ipsum')) {
				result = step.content || ''; // Return exact content without filtering
			}
			// Keep percentages
			else if (text.match(/^\d+%$/)) {
				result = text;
			}
		}
	} else if (slideData.slideType === 'closing') {
		// Closing slide - use brand name
		if (brandData.brandName && (text === 'Aaron Loeb' || text === 'Rimberio Company')) {
			result = brandData.brandName;
		}
	}
	
	// Replace website if provided
	if (brandData.website) {
		result = result.replace(/www\.reallygreatsite\.com/g, brandData.website);
	}
	
	// Replace contact info if provided
	if (brandData.contactEmail) {
		result = result.replace(/hello@reallygreatsite\.com/g, brandData.contactEmail);
		result = result.replace(/hello@really\ngreatsite\.com/g, brandData.contactEmail);
	}
	if (brandData.contactPhone) {
		result = result.replace(/\+123-456-7890/g, brandData.contactPhone);
	}
	
	return result;
}

/**
 * Generate PPTX from new template format
 */
export async function generateFromNewTemplate(
	brandData: BrandData,
	template: any
): Promise<Buffer> {
	const pptx = new PptxGenJS();
	
	pptx.layout = 'LAYOUT_16x9';
	pptx.author = brandData.brandName || 'Brand Guidelines';
	pptx.title = `${brandData.brandName || 'Brand'} Guidelines`;
	
	const PX_PER_INCH = template.metadata?.pixels_per_inch || template.metadata?.conversion?.pixels_per_inch || 192;
	const templateSlides = template.slide_templates || [];
	const stepHistory = brandData.stepHistory || [];
	
	// Get layout rules from template (all configurable, no hardcoding)
	const layoutEngine = template.layout_engine || {};
	const contentBoundaries = template.content_boundaries || {};
	const overflowHandling = template.overflow_handling || {};
	
	const maxCharsDefault = contentBoundaries.body_max_chars || 800;
	const lineHeightMult = layoutEngine.line_height_multiplier || 1.4;
	const shrinkStep = layoutEngine.autoshrink?.shrink_step || overflowHandling.strategies?.shrink_font?.shrink_increment || 1.0;
	const maxSlidesPerContent = layoutEngine.split_strategy?.max_slides_per_content || overflowHandling.strategies?.create_new_slide?.max_slides_per_content || 5;
	
	// Find templates by name
	const coverTemplate = templateSlides.find((t: any) => t.template_name === 'cover_slide');
	const contentTemplate = templateSlides.find((t: any) => t.template_name === 'content_slide_standard');
	const missionVisionTemplate = templateSlides.find((t: any) => t.template_name === 'content_slide_mission_vision');
	const closingTemplate = templateSlides.find((t: any) => t.template_name === 'closing_slide');
	
	const dynamicSlides: any[] = [];
	
	// Cover slide
	if (coverTemplate) {
		dynamicSlides.push({
			template: coverTemplate,
			slideType: 'cover',
			pageNumber: 1
		});
	}
	
	// Get approved steps
	const approvedSteps = stepHistory.filter(step => step.approved);
		
	// Content slides for all steps except the last 2
	const stepsForContentSlides = approvedSteps.slice(0, -2);
	for (const [idx, step] of stepsForContentSlides.entries()) {
		// Special handling for brand positioning - create 3 custom slides
		if (step.step === 'brand-positioning') {
			const positioningSlides = createBrandPositioningSlides(step, contentTemplate);
			positioningSlides.forEach((slideData: any, slideIdx: number) => {
				dynamicSlides.push({
					...slideData,
					stepIndex: idx,
					pageNumber: dynamicSlides.length + 1,
					isContinuation: slideIdx > 0
				});
			});
			continue;
		}
		
		// Use standard content template for other steps
		const slideTemplate: any = contentTemplate;
		
		if (!slideTemplate) continue;
		
		// Get main content region to determine split rules
		const contentRegion = slideTemplate.content_regions?.find((r: any) => 
			r.content_binding === '{{AI_GENERATED_STEP_CONTENT}}' || r.purpose === 'body_content'
		);
		
		const content = step.content || '';
		const regionMaxChars = contentRegion?.max_chars || maxCharsDefault;
		
		// Use content exactly as generated in steps - no cleaning or filtering
		const cleanedContent = content;
		
		// Use Gemini to intelligently split content with proper headings
		const contentSlides = await splitContentWithHeadings(cleanedContent, step.title || 'Content', regionMaxChars);
		
		// Strict validation: Ensure no duplication and clean content
		const validatedSlides = validateAndCleanSlides(contentSlides);
		
		// Limit to max slides per content
		const limitedSlides = validatedSlides.slice(0, maxSlidesPerContent);
		
		limitedSlides.forEach((contentSlide: any, slideIdx: number) => {
		dynamicSlides.push({
			template: slideTemplate,
			slideType: 'content',
				stepData: { 
					...step, 
					content: contentSlide.content, 
					title: contentSlide.title 
				},
			stepIndex: idx,
				pageNumber: dynamicSlides.length + 1,
				isContinuation: slideIdx > 0
		});
	});
	}
	
	// Last 2 slides: Use the last 2 steps exactly as they are
	const lastTwoSteps = approvedSteps.slice(-2);
	for (const [idx, step] of lastTwoSteps.entries()) {
		// Use content template for last 2 steps
		if (contentTemplate) {
		dynamicSlides.push({
				template: contentTemplate,
				slideType: 'content',
				stepData: step, // Use exact step data without splitting
				stepIndex: approvedSteps.length - 2 + idx,
			pageNumber: dynamicSlides.length + 1
		});
		}
	}
	
	// Add closing slide (Thank You)
	if (closingTemplate) {
		dynamicSlides.push({
			template: closingTemplate,
			slideType: 'closing',
			pageNumber: dynamicSlides.length + 1
		});
	}
	
	// Process each dynamic slide
	// Process each slide with Gemini layout optimization
	for (let slideIdx = 0; slideIdx < dynamicSlides.length; slideIdx++) {
		const slideData = dynamicSlides[slideIdx];
		let slideTemplate = slideData.template;
		const slide = pptx.addSlide();
		
		// Clean empty spaces first
		slideTemplate = cleanEmptySpaces(slideTemplate);
		
		// Use Gemini to optimize layout and prevent overflow
		try {
			console.log('🔧 Optimizing layout with Gemini for slide:', slideData.slideType);
			slideTemplate = await optimizeSlideLayoutWithGemini(
				slideTemplate, 
				slideData.stepData, 
				slideData.slideType
			);
			console.log('✅ Gemini optimization completed');
		} catch (error) {
			console.warn('❌ Gemini layout optimization failed, using cleaned template:', error);
		}
		
		// Set background
		if (slideTemplate.background?.type === 'color') {
			slide.background = { color: slideTemplate.background.value.replace('#', '') };
		}
		
		// Add logo on cover slide if available
		if (slideData.slideType === 'cover' && brandData.logoFiles && brandData.logoFiles.length > 0) {
			const logo = brandData.logoFiles[0];
			try {
				if (logo.fileData) {
					slide.addImage({
						data: logo.fileData,
						x: 0.5,
						y: 0.5,
						w: 1.5,
						h: 1.5,
						sizing: { type: 'contain', w: 1.5, h: 1.5 }
					});
				}
			} catch (err) {
				// Logo failed to load, continue without it
			}
		}
		
		// Handle closing slide specially
		if (slideData.slideType === 'closing') {
			// Add "Thank You" text to closing slide
			slide.addText('Thank You', {
				x: 1,
				y: 2.5,
				w: 8,
				h: 1,
				fontSize: 64,
				bold: true,
				color: 'FFFFFF',
				align: 'center'
			});
			
			// Skip content processing for closing slide
			continue;
		}
		
		// Handle custom card layouts for brand positioning slides
		if (slideData.customSlideType && slideData.stepData?.cards) {
			// Add slide title
			slide.addText(slideData.stepData.title, {
				x: 0.5,
				y: 0.3,
				w: 9,
				h: 0.7,
				fontSize: 36,
				bold: true,
				color: '2C504D',
				align: 'center'
			});
			
			// Render cards
			slideData.stepData.cards.forEach((card: any) => {
				if (!card.content) return;
				
				// Add card background (light gray rectangle)
				slide.addShape('rect', {
					x: card.position.x,
					y: card.position.y,
					w: card.position.w,
					h: card.position.h,
					fill: { color: 'F8F9FA' },
					line: { color: 'E9ECEF', width: 1 }
				});
				
				// Add card title
				slide.addText(card.title, {
					x: card.position.x + 0.1,
					y: card.position.y + 0.1,
					w: card.position.w - 0.2,
					h: 0.5,
					fontSize: 32,
					bold: true,
					color: '2C504D',
					align: 'center'
				});
				
				// Format content with proper vertical bullet points
				let formattedContent = card.content;
				
				// Special handling for Core Values card to ensure all items have bullets
				if (card.title === 'Core Values') {
					// Split by asterisks and clean up
					let items = formattedContent
						.split(/\s*\*\s*/)
						.map((item: string) => item.trim())
						.filter((item: string) => item.length > 0);
					
					// Format each item with a bullet point
					if (items.length > 0) {
						formattedContent = items.map((item: string) => `• ${item}`).join('\n');
					}
				} else {
					// Standard formatting for other cards
					formattedContent = card.content
						.replace(/\*([^*]+)\*/g, '• $1') // Convert *text* to • text
						.replace(/\*([^*]+)\*/g, '• $1') // Handle multiple bullets
						.replace(/\*([^*]+)\*/g, '• $1') // Ensure all bullets are converted
						.replace(/• ([^•]+) •/g, '• $1\n• ') // Add line breaks between bullets
						.replace(/• ([^•]+) •/g, '• $1\n• ') // Handle multiple line breaks
						.replace(/• ([^•]+) •/g, '• $1\n• ') // Ensure all bullets are on separate lines
						.replace(/\*([^*]+)\*/g, '• $1\n') // Handle remaining asterisks
						.replace(/\*([^*]+)\*/g, '• $1\n') // Convert any remaining asterisks
						.replace(/\*([^*]+)\*/g, '• $1\n'); // Final pass for asterisks
				}
				
				// Add card content
				slide.addText(formattedContent, {
					x: card.position.x + 0.1,
					y: card.position.y + 0.6,
					w: card.position.w - 0.2,
					h: card.position.h - 0.7,
					fontSize: 26,
					color: '374151',
					align: card.title === 'Core Values' ? 'justify' : 'center',
					valign: 'top',
					wrap: true,
					lineSpacing: 1.5
				});
			});
			
			// Skip normal content processing for custom cards
			continue;
		}
		
		// Process content regions
		const regions = slideTemplate.content_regions || [];
		
		for (const region of regions) {
			if (!region.bbox) continue;
			
			// Skip decorations
			if (region.editable === false && region.purpose === 'decoration') continue;
			
			const bbox = region.bbox;
			const x = bbox.left / PX_PER_INCH;
			const y = bbox.top / PX_PER_INCH;
			const w = bbox.width / PX_PER_INCH;
			const h = bbox.height / PX_PER_INCH;
			
			// Handle text regions
			if (region.type === 'text' && region.content_binding) {
				// Check if this is content that needs formatted rendering
				const isMainContent = region.content_binding === '{{AI_GENERATED_STEP_CONTENT}}' ||
									  region.content_binding === '{{MISSION_EXTRACTED_FROM_AI}}' ||
									  region.content_binding === '{{VISION_EXTRACTED_FROM_AI}}' ||
									  region.purpose === 'body_content';
				
				if (isMainContent && slideData.stepData?.content) {
					// Use formatted text to preserve EVERYTHING: bullets, bold, color codes, icons, etc.
					let rawContent = slideData.stepData.content;
					
					// Extract Mission or Vision if needed
					if (region.content_binding === '{{MISSION_EXTRACTED_FROM_AI}}') {
						const { mission } = extractMissionVision(rawContent);
						rawContent = mission;
					} else if (region.content_binding === '{{VISION_EXTRACTED_FROM_AI}}') {
						const { vision } = extractMissionVision(rawContent);
						rawContent = vision;
					}
					
					if (!rawContent) continue;
					
					const startFontSize = region.text_style?.size || 28;
					const baseColor = region.text_style?.color?.replace('#', '') || '000000';
					const fontFace = region.text_style?.font?.replace(' Bold', '').replace(' Italic', '') || 'Arial';
					
					// Get layout rules from template (all from JSON, no hardcoding)
					const minFontSize = region.layout_rules?.min_font_size || 
									   region.boundary_rules?.min_font_size || 
									   layoutEngine.autoshrink?.min_font_size || 14;
					
					const padding = region.layout_rules?.padding || 16;
					const boxWidthPx = bbox.width - (padding * 2);
					const boxHeightPx = bbox.height - (padding * 2);
					
					// Calculate optimal font size for this content
					const optimalFontSize = calculateOptimalFontSize(
						rawContent,
						startFontSize,
						minFontSize,
						shrinkStep,
						boxWidthPx,
						boxHeightPx,
						lineHeightMult
					);
					
					console.log(`📏 Font sizing: ${startFontSize}px → ${optimalFontSize}px for content length: ${rawContent.length}`);
					
					// Generate formatted text array with optimal font size
					const formattedTextArray = markdownToFormattedText(rawContent, optimalFontSize, baseColor);
					
					if (formattedTextArray.length > 0) {
						const textElements = formattedTextArray.map((item: any) => ({
							text: item.text,
									options: {
								fontFace: fontFace,
								fontSize: item.options?.fontSize || optimalFontSize,
								bold: item.options?.bold || false,
								italic: item.options?.italic || false,
								color: item.options?.color || baseColor,
								breakLine: item.options?.breakLine || false
							}
						}));
						
						try {
							slide.addText(textElements, {
								x, y, w, h,
								valign: 'top',
								shrinkText: true,
								fit: 'shrink',
								wrap: true
							});
						} catch (err) {
							// Text failed to add
						}
					}
				} else {
					// Simple text (titles, labels, headers)
					let content = region.content_binding;
					
					// Replace placeholders
					content = content.replace(/\{\{BRAND_NAME\}\}/g, brandData?.brandName || '');
					content = content.replace(/\{\{WEBSITE\}\}/g, brandData?.website || '');
					content = content.replace(/\{\{CONTACT_EMAIL\}\}/g, brandData?.contactEmail || '');
					content = content.replace(/\{\{CONTACT_PHONE\}\}/g, brandData?.contactPhone || '');
					content = content.replace(/\{\{PAGE_NUMBER\}\}/g, slideData.pageNumber?.toString() || '');
					
					if (slideData.stepData) {
						const stepNumber = slideData.stepIndex !== undefined ? slideData.stepIndex + 1 : '';
						content = content.replace(/\{\{STEP_NUMBER\}\}/g, stepNumber.toString());
						content = content.replace(/\{\{AI_GENERATED_STEP_TITLE\}\}/g, slideData.stepData.title || '');
						content = content.replace(/\{\{AI_GENERATED_TAGLINE\}\}/g, getAICoverContent(brandData));
					}
					
					if (!content || content.includes('{{')) continue;
					
					// Apply smart font sizing for titles and other text
					const startFontSize = region.text_style?.size || 26;
					const minFontSize = region.layout_rules?.min_font_size || 
									   layoutEngine.autoshrink?.min_font_size || 
									   Math.max(startFontSize * 0.5, 16);
					
					const padding = region.layout_rules?.padding || 10;
					const boxWidthPx = bbox.width - (padding * 2);
					const boxHeightPx = bbox.height - (padding * 2);
					
					// Calculate optimal font size
					const optimalFontSize = calculateOptimalFontSize(
						content,
						startFontSize,
						minFontSize,
						shrinkStep,
						boxWidthPx,
						boxHeightPx,
						lineHeightMult
					);
					
					// STRICT Anti-truncation fix: Ensure every character is visible
					if (region.purpose === 'section_heading' || region.purpose === 'subsection_label' || region.purpose === 'body_content') {
						// Calculate exact character width needed
						const estimatedCharWidth = optimalFontSize * 0.65; // More accurate estimate
						const estimatedWidthNeeded = content.length * estimatedCharWidth;
						const safetyMargin = 50; // Extra pixels for safety
						
						if (estimatedWidthNeeded + safetyMargin > boxWidthPx) {
							// Increase the box width significantly to prevent any truncation
							const newWidth = Math.max(estimatedWidthNeeded * 1.5, bbox.width * 1.3);
							console.log(`🔧 STRICT Anti-truncation: Expanding width from ${bbox.width} to ${newWidth} for "${content}"`);
							bbox.width = newWidth;
							
							// Also increase height if needed for multi-line titles
							if (content.length > 30) {
								const estimatedLines = Math.ceil(content.length / 25); // Rough line estimate
								const estimatedHeight = estimatedLines * optimalFontSize * 1.4 + 20;
								if (estimatedHeight > bbox.height) {
									bbox.height = Math.max(estimatedHeight, bbox.height * 1.2);
									console.log(`🔧 STRICT Anti-truncation: Expanding height to ${bbox.height} for multi-line content`);
								}
							}
						}
					}
					
					try {
						// Process content through markdown formatting to handle **bold** text
						const baseColor = region.text_style?.color?.replace('#', '') || '000000';
						const formattedTextArray = markdownToFormattedText(content, optimalFontSize, baseColor);
						
						if (formattedTextArray.length > 0) {
							const textElements = formattedTextArray.map((item: any) => ({
								text: item.text,
								options: {
									fontFace: region.text_style?.font?.replace(' Bold', '').replace(' Italic', '') || 'Arial',
									fontSize: item.options?.fontSize || optimalFontSize,
									bold: item.options?.bold || region.text_style?.bold || false,
									italic: item.options?.italic || region.text_style?.italic || false,
									color: item.options?.color || baseColor,
									breakLine: item.options?.breakLine || false
								}
							}));
							
							slide.addText(textElements, {
								x, y, w, h,
								valign: 'top',
								shrinkText: true,
								fit: 'shrink',
								align: region.text_style?.alignment || 'left',
								wrap: true
							});
						} else {
							// Fallback to original method if formatting fails
							slide.addText(content, {
								x, y, w, h,
								fontFace: region.text_style?.font?.replace(' Bold', '').replace(' Italic', '') || 'Arial',
								fontSize: optimalFontSize,
								bold: region.text_style?.bold || false,
								italic: region.text_style?.italic || false,
								color: region.text_style?.color?.replace('#', '') || '000000',
								align: region.text_style?.alignment || 'left',
								valign: 'top',
								shrinkText: true,
								wrap: true
							});
						}
					} catch (err) {
						// Text failed to add
					}
				}
			}
		}
	}
	
	// Generate buffer
	const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
	return buffer;
}

