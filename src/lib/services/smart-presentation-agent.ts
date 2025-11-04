/**
 * Smart Presentation AI Agent
 * Main orchestrator for professional PPTX generation with multi-model AI
 */

import { UsageTracker, getUsageTracker } from './usage-tracker';
import { SmartModelRouter } from './smart-model-router';
import {
	buildContentAnalysisPrompt,
	buildLayoutDesignPrompt,
	buildLogoAnalysisPrompt,
	buildOverflowPrompt,
	estimatePromptTokens
} from './prompt-builders';
import { LOGGING } from '$lib/config/model-config';
import type {
	BrandData,
	StepData,
	BatchAnalysisResult,
	BatchLayoutResult,
	LogoPlacement,
	GenerationResult
} from '$lib/types/presentation-agent';

export class SmartPresentationAgent {
	private router: SmartModelRouter;
	private tracker: UsageTracker;

	constructor() {
		try {
			this.tracker = getUsageTracker();
			this.router = new SmartModelRouter(this.tracker);

			if (LOGGING.ENABLED) {
				console.log('🤖 Smart Presentation Agent initialized');
			}
		} catch (error: any) {
			console.error('❌ Failed to initialize Smart Presentation Agent:', error.message);
			throw new Error(`Agent initialization failed: ${error.message}`);
		}
	}

	/**
	 * Main method: Generate professional presentation (per-slide processing)
	 */
	async generatePresentation(
		stepHistory: StepData[],
		brandData: BrandData
	): Promise<GenerationResult> {
		const startTime = Date.now();

		if (LOGGING.ENABLED) {
			console.log('\n🚀 Starting Smart Presentation Generation (Per-Slide Processing)');
			console.log(`📊 Input: ${stepHistory.length} slides`);
			console.log(`🏢 Brand: ${brandData.brandName || 'N/A'}`);
		}

		try {
			// Validate input
			this.validateInput(stepHistory, brandData);

			// ═══════════════════════════════════════════════════════════
			// PROCESS EACH SLIDE INDIVIDUALLY WITH AI
			// ═══════════════════════════════════════════════════════════

			const PptxGenJS = (await import('pptxgenjs')).default;
			const pptx = new PptxGenJS();

			pptx.layout = 'LAYOUT_16x9';
			pptx.author = brandData.brandName || 'Brand Guidelines';
			pptx.title = `${brandData.brandName || 'Brand'} Guidelines`;

			// Add cover slide
			if (LOGGING.ENABLED) console.log('\n📄 Slide 1: Cover');
			await this.addCoverSlide(pptx, brandData);

			// Process each step/slide individually
			for (let i = 0; i < stepHistory.length; i++) {
				const stepData = stepHistory[i];
				if (!stepData || !stepData.approved) continue;

				if (LOGGING.ENABLED) {
					console.log(`\n📄 Slide ${i + 2}: ${stepData.title} (${stepData.step})`);
					console.log(`   Content:`);
					console.log(`   ${stepData.content.substring(0, 1500)}${stepData.content.length > 1500 ? '...' : ''}`);
					console.log(`   Content length: ${stepData.content.length} chars`);
				}

				// STAGE 1: Analyze this slide's content
				if (LOGGING.ENABLED) console.log('   🔍 Analyzing content...');
				const slideAnalysis = await this.analyzeSingleSlide(stepData);

				// STAGE 2: Design layout for this slide
				if (LOGGING.ENABLED) console.log('   🎨 Designing layout...');
				const slideLayout = await this.designSingleSlideLayout(
					slideAnalysis,
					stepData,
					brandData
				);

				// STAGE 3: Validate and correct layout
				if (LOGGING.ENABLED) console.log('   ✅ Validating layout...');
				const validatedLayout = await this.validateAndCorrectLayout(slideLayout, stepData);

				// STAGE 4: Render this slide to PPTX
				if (LOGGING.ENABLED) console.log('   🖨️  Rendering slide...');
				await this.renderSingleSlide(pptx, validatedLayout, stepData, brandData, i + 2);

				if (LOGGING.ENABLED) console.log('   ✅ Slide complete');
			}

			// Add closing slide
			if (LOGGING.ENABLED) console.log(`\n📄 Slide ${stepHistory.length + 2}: Closing`);
			await this.addClosingSlide(pptx, brandData);

			// Generate buffer
			const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;

			const totalTime = Date.now() - startTime;

			if (LOGGING.ENABLED) {
				console.log(`\n✅ PPTX rendered: ${(buffer.length / 1024).toFixed(2)} KB`);
				console.log(`✨ Generation complete in ${totalTime}ms`);
				this.printUsageReport();
			}

			return {
				success: true,
				buffer,
				stats: {
					slidesGenerated: stepHistory.length + 2,
					modelsUsed: this.getModelsUsed(),
					totalTime,
					totalTokens: this.getTotalTokens()
				}
			};
		} catch (error: any) {
			const totalTime = Date.now() - startTime;

			console.error(`\n❌ Generation failed after ${totalTime}ms:`, error.message);

			return {
				success: false,
				error: error.message || 'Unknown error during generation'
			};
		}
	}

	/**
	 * Validate input data
	 */
	private validateInput(stepHistory: StepData[], brandData: BrandData): void {
		if (!stepHistory || stepHistory.length === 0) {
			throw new Error('No slide content provided');
		}

		if (stepHistory.some((step) => !step.content || step.content.trim().length === 0)) {
			throw new Error('Some slides have empty content');
		}

		if (LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
			console.log('✅ Input validation passed');
		}
	}

	// ═══════════════════════════════════════════════════════════
	// PER-SLIDE PROCESSING METHODS
	// ═══════════════════════════════════════════════════════════

	/**
	 * STEP 1: Analyze a single slide's content with AI
	 */
	private async analyzeSingleSlide(stepData: StepData): Promise<any> {
		const promptBuilder = (provider: 'groq' | 'gemini') => {
			const prompt = `Analyze this brand guideline slide content and extract structured information.

Step: ${stepData.step}
Title: ${stepData.title}
Content:
${stepData.content}

Return JSON with:
{
  "contentType": "color_palette | typography | logo_guidelines | iconography | photography | text_heavy",
  "extractedElements": {
    "colors": [{"name": "Teal", "hex": "#2C504D", "description": "Main brand color"}],
    "fonts": [{"type": "primary", "name": "Inter", "description": "Modern sans-serif"}],
    "icons": [{"symbol": "⚙", "name": "Settings"}],
    "bulletPoints": ["point 1", "point 2"],
    "sections": [{"heading": "Mission", "content": "..."}]
  },
  "recommendedLayout": "visual_grid | typography_cards | text_with_bullets | icon_grid",
  "estimatedTextLength": 500
}`;

			if (provider === 'groq') {
				return [{ role: 'user', content: prompt }];
			} else {
				return prompt;
			}
		};

		try {
			return await this.router.executeWithFallback(
				'contentAnalysis',
				promptBuilder,
				1500
			);
		} catch (error) {
			// Fallback to local analysis
			return {
				contentType: this.detectContentType(stepData.content),
				extractedElements: this.extractAllElements(stepData.content),
				recommendedLayout: this.recommendSlideType(stepData.step),
				estimatedTextLength: stepData.content.length
			};
		}
	}

	/**
	 * STEP 2: Design layout for a single slide with AI
	 */
	private async designSingleSlideLayout(
		analysis: any,
		stepData: StepData,
		brandData: BrandData
	): Promise<any> {
		const promptBuilder = (provider: 'groq' | 'gemini') => {
			const prompt = `Design a professional PowerPoint slide layout for this content.

Slide Info:
- Step: ${stepData.step}
- Title: ${stepData.title}
- Content Type: ${analysis.contentType}
- Extracted Elements: ${JSON.stringify(analysis.extractedElements, null, 2)}

Brand Info:
- Colors: ${brandData.brandColors?.join(', ') || 'default'}
- Primary Font: ${brandData.primaryFont || 'Inter'}

Slide Dimensions: 10" × 5.625" (16:9)
Safe Area: 0.5" margins

Design Requirements:
1. Title area: Top 0.3-1.0" (bold, 32-36pt)
2. Content area: 1.2-5.0" (proper spacing)
3. For colors: Create visual swatches with hex codes
4. For typography: Create font preview cards
5. For icons: Create icon grid
6. For text: Bullets with good spacing
7. All elements must fit without overflow
8. Professional spacing between elements

Return JSON layout:
{
  "slideType": "${analysis.recommendedLayout}",
  "regions": [
    {
      "type": "title",
      "content": "${stepData.title}",
      "position": {"x": 0.5, "y": 0.3, "w": 9, "h": 0.7},
      "style": {"fontSize": 36, "bold": true, "color": "2C504D"}
    },
    {
      "type": "color_swatch",
      "colorData": {"name": "...", "hex": "...", "description": "..."},
      "position": {"x": 0.5, "y": 1.2, "w": 2.8, "h": 1.5}
    }
  ]
}`;

			if (provider === 'groq') {
				return [{ role: 'user', content: prompt }];
			} else {
				return prompt;
			}
		};

		try {
			return await this.router.executeWithFallback(
				'layoutDesign',
				promptBuilder,
				3000
			);
		} catch (error) {
			// Fallback to predefined layout
			return this.createFallbackLayout(stepData, analysis);
		}
	}

	/**
	 * STEP 3: Validate and correct layout
	 */
	private async validateAndCorrectLayout(layout: any, stepData: StepData): Promise<any> {
		// Local validation (no AI needed for basic checks)
		const correctedLayout = { ...layout };

		if (correctedLayout.regions) {
			correctedLayout.regions.forEach((region: any) => {
				// Ensure positions are within bounds
				if (region.position) {
					region.position.x = Math.max(0.5, Math.min(region.position.x, 9.5));
					region.position.y = Math.max(0.3, Math.min(region.position.y, 5.0));
					
					// Ensure widths don't exceed slide
					if (region.position.x + region.position.w > 10) {
						region.position.w = 10 - region.position.x - 0.5;
					}
					
					// Ensure heights don't exceed slide
					if (region.position.y + region.position.h > 5.625) {
						region.position.h = 5.625 - region.position.y - 0.3;
					}
				}

				// Ensure minimum font size
				if (region.style && region.style.fontSize < 12) {
					region.style.fontSize = 12;
				}
			});
		}

		return correctedLayout;
	}

	/**
	 * STEP 4: Render a single slide to PPTX
	 */
	private async renderSingleSlide(
		pptx: any,
		layout: any,
		stepData: StepData,
		brandData: BrandData,
		pageNumber: number
	): Promise<void> {
		// Use specialized rendering based on step type
		switch (stepData.step) {
			case 'color-palette':
				await this.addColorPaletteSlide(pptx, stepData, brandData);
				break;
			case 'typography':
				await this.addTypographySlide(pptx, stepData, brandData);
				break;
			case 'logo-guidelines':
				await this.addLogoGuidelinesSlide(pptx, stepData, brandData);
				break;
			case 'iconography':
				await this.addIconographySlide(pptx, stepData, brandData);
				break;
			default:
				await this.addStandardContentSlide(pptx, stepData, brandData, pageNumber);
				break;
		}
	}

	/**
	 * Create fallback layout when AI fails
	 */
	private createFallbackLayout(stepData: StepData, analysis: any): any {
		return {
			slideType: analysis.recommendedLayout || 'text_heavy',
			regions: [
				{
					type: 'title',
					content: stepData.title,
					position: { x: 0.5, y: 0.3, w: 9, h: 0.7 },
					style: { fontSize: 36, bold: true, color: '2C504D' }
				},
				{
					type: 'content',
					content: stepData.content,
					position: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
					style: { fontSize: 16, color: '374151' }
				}
			]
		};
	}

	/**
	 * Extract all elements from content
	 */
	private extractAllElements(content: string): any {
		return {
			colors: this.extractColors(content),
			fonts: this.extractFonts(content),
			icons: this.extractIcons(content),
			bulletPoints: this.extractBulletPoints(content),
			sections: this.extractSections(content)
		};
	}

	/**
	 * Extract sections from content
	 */
	private extractSections(content: string): Array<{ heading: string; content: string }> {
		const sections: Array<{ heading: string; content: string }> = [];
		const lines = content.split('\n');
		let currentSection: { heading: string; content: string } | null = null;

		for (const line of lines) {
			// Check if line is a heading
			const headingMatch = line.match(/^\*\*([^:]+):\*\*/);
			if (headingMatch) {
				// Save previous section
				if (currentSection) {
					sections.push(currentSection);
				}
				// Start new section
				currentSection = {
					heading: headingMatch[1].trim(),
					content: line.substring(headingMatch[0].length).trim()
				};
			} else if (currentSection && line.trim()) {
				// Add to current section
				currentSection.content += '\n' + line;
			}
		}

		// Add last section
		if (currentSection) {
			sections.push(currentSection);
		}

		return sections;
	}

	/**
	 * TASK 1: Analyze slides (process individually to avoid timeout)
	 */
	async batchAnalyzeSlides(slides: StepData[]): Promise<BatchAnalysisResult> {
		// Simple local analysis instead of AI (faster and no API cost)
		const analyzedSlides = slides.map((slide, index) => ({
			index,
			step: slide.step,
			contentType: this.detectContentType(slide.content),
			complexity: 'medium' as const,
			elements: this.extractElements(slide.content),
			recommendedSlideType: this.recommendSlideType(slide.step),
			estimatedSlides: 1
		}));

		return {
			slides: analyzedSlides,
			totalSlides: slides.length,
			averageComplexity: 'medium'
		};
	}

	/**
	 * Detect content type from step ID and content
	 */
	private detectContentType(content: string): any {
		if (content.includes('#') && content.match(/#[0-9A-Fa-f]{6}/)) {
			return 'color_palette';
		}
		if (content.toLowerCase().includes('font') || content.toLowerCase().includes('typography')) {
			return 'typography';
		}
		if (content.match(/[⚫⚪⚡⚙⚠★☆♦♠♣♥]/)) {
			return 'iconography';
		}
		return 'text_heavy';
	}

	/**
	 * Extract elements from content
	 */
	private extractElements(content: string): any {
		const colorMatches = content.match(/#[0-9A-Fa-f]{6}/g) || [];
		const bulletMatches = content.match(/^[\s]*[*\-•]/gm) || [];
		const headingMatches = content.match(/^\*\*.*\*\*:/gm) || [];
		
		return {
			hasColors: colorMatches.length > 0,
			colorCount: colorMatches.length,
			hasBullets: bulletMatches.length > 0,
			bulletCount: bulletMatches.length,
			hasHeadings: headingMatches.length,
			hasImages: false,
			hasFonts: content.toLowerCase().includes('font'),
			fontCount: 0,
			hasIcons: content.match(/[⚫⚪⚡⚙⚠★☆♦♠♣♥]/) !== null,
			iconCount: 0,
			textLength: content.length,
			keyElements: []
		};
	}

	/**
	 * Recommend slide type based on step
	 */
	private recommendSlideType(step: string): string {
		switch (step) {
			case 'color-palette':
				return 'visual_grid';
			case 'typography':
				return 'typography_showcase';
			case 'iconography':
				return 'visual_grid';
			case 'photography':
				return 'image_text_split';
			default:
				return 'text_heavy';
		}
	}

	/**
	 * TASK 2: Analyze logo placement
	 */
	async analyzeLogoPlacement(logoFile: { fileData: string }): Promise<LogoPlacement> {
		const promptBuilder = (provider: 'groq' | 'gemini') =>
			buildLogoAnalysisPrompt(logoFile, provider);

		// Vision tasks use more tokens due to image
		const estimatedTokens = 3500;

		const result = await this.router.executeWithFallback<LogoPlacement>(
			'logoAnalysis',
			promptBuilder,
			estimatedTokens
		);

		// Validate and add defaults
		if (!result.aspectRatio) {
			result.aspectRatio = 1.5; // Default aspect ratio
		}

		if (!result.positions) {
			result.positions = {};
		}

		if (result.showOnAllSlides === undefined) {
			result.showOnAllSlides = false;
		}

		return result;
	}

	/**
	 * TASK 3: Batch design all layouts
	 */
	async batchDesignLayouts(
		analysis: BatchAnalysisResult,
		logoPlacement: LogoPlacement | null,
		brandData: BrandData
	): Promise<BatchLayoutResult> {
		const promptBuilder = (provider: 'groq' | 'gemini') =>
			buildLayoutDesignPrompt(analysis, logoPlacement, brandData, provider);

		// Large prompt with layout specifications
		const estimatedTokens = 6000;

		const result = await this.router.executeWithFallback<BatchLayoutResult>(
			'layoutDesign',
			promptBuilder,
			estimatedTokens
		);

		// Validate result
		if (!result.slides || !Array.isArray(result.slides)) {
			throw new Error('Invalid layout result: missing slides array');
		}

		// Add defaults
		if (!result.totalSlides) {
			result.totalSlides = result.slides.length;
		}

		if (!result.averageRegionsPerSlide) {
			const totalRegions = result.slides.reduce((sum, slide) => sum + (slide.regions?.length || 0), 0);
			result.averageRegionsPerSlide = totalRegions / result.slides.length;
		}

		// Validate each slide has required fields
		result.slides.forEach((slide, index) => {
			if (!slide.slideType) {
				slide.slideType = 'text_heavy';
			}
			if (!slide.regions) {
				slide.regions = [];
			}
			if (slide.index === undefined) {
				slide.index = index;
			}
		});

		return result;
	}

	/**
	 * TASK 4: Render PPTX locally with proper content handling
	 */
	private async renderPPTX(
		layouts: BatchLayoutResult,
		brandData: BrandData,
		stepHistory: StepData[]
	): Promise<Buffer> {
		try {
			// Dynamic import to avoid loading pptxgenjs unless needed
			const PptxGenJS = (await import('pptxgenjs')).default;
			const pptx = new PptxGenJS();

			// Set presentation metadata
			pptx.layout = 'LAYOUT_16x9';
			pptx.author = brandData.brandName || 'Brand Guidelines';
			pptx.title = `${brandData.brandName || 'Brand'} Guidelines`;
			pptx.subject = 'Brand Guidelines Presentation';

			// Add cover slide
			await this.addCoverSlide(pptx, brandData);

			// Render each content slide based on step type
			for (let i = 0; i < stepHistory.length; i++) {
				const stepData = stepHistory[i];
				if (!stepData || !stepData.approved) continue;

				const slideLayout = layouts.slides[i];
				
				// Render based on step type
				switch (stepData.step) {
					case 'color-palette':
						await this.addColorPaletteSlide(pptx, stepData, brandData);
						break;
					case 'typography':
						await this.addTypographySlide(pptx, stepData, brandData);
						break;
					case 'logo-guidelines':
						await this.addLogoGuidelinesSlide(pptx, stepData, brandData);
						break;
					case 'iconography':
						await this.addIconographySlide(pptx, stepData, brandData);
						break;
					default:
						await this.addStandardContentSlide(pptx, stepData, brandData, i + 2);
						break;
				}
			}

			// Add closing slide
			await this.addClosingSlide(pptx, brandData);

			// Generate buffer
			const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;

			return buffer;
		} catch (error: any) {
			console.error('❌ PPTX rendering failed:', error);
			throw new Error(`Failed to render PPTX: ${error.message}`);
		}
	}

	/**
	 * Add cover slide
	 */
	private async addCoverSlide(pptx: any, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();

		// Background
		slide.background = { color: '2C504D' };

		// Title
		slide.addText(brandData.brandName || 'Brand Guidelines', {
			x: 0.5,
			y: 2,
			w: 9,
			h: 1,
			fontSize: 64,
			bold: true,
			color: 'FFFFFF',
			align: 'center'
		});

		// Subtitle
		slide.addText('Professional Brand Guidelines', {
			x: 0.5,
			y: 3.2,
			w: 9,
			h: 0.5,
			fontSize: 28,
			color: 'E2AB4A',
			align: 'center'
		});

		// Logo (if available)
		if (brandData.logoFiles && brandData.logoFiles.length > 0) {
			try {
				slide.addImage({
					data: brandData.logoFiles[0].fileData,
					x: 4.25,
					y: 0.5,
					w: 1.5,
					h: 1.5,
					sizing: { type: 'contain' }
				});
			} catch (error) {
				console.warn('⚠️ Failed to add logo to cover slide');
			}
		}
	}

	/**
	 * Add color palette slide with visual swatches
	 */
	private async addColorPaletteSlide(pptx: any, stepData: StepData, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();
		slide.background = { color: 'FFFFFF' };

		// Extract colors from content
		const colors = this.extractColors(stepData.content);

		// Title
		slide.addText(stepData.title || 'Brand Colors', {
			x: 0.5,
			y: 0.3,
			w: 9,
			h: 0.7,
			fontSize: 36,
			bold: true,
			color: '2C504D',
			align: 'left'
		});

		// Render color swatches in grid (3 columns)
		const startY = 1.2;
		const swatchWidth = 2.8;
		const swatchHeight = 1.5;
		const spacing = 0.3;
		const columns = 3;

		colors.forEach((colorInfo, index) => {
			const col = index % columns;
			const row = Math.floor(index / columns);
			const x = 0.5 + col * (swatchWidth + spacing);
			const y = startY + row * (swatchHeight + spacing);

			// Color swatch rectangle
			slide.addShape('rect', {
				x,
				y,
				w: swatchWidth,
				h: swatchHeight * 0.5,
				fill: { color: colorInfo.hex.replace('#', '') },
				line: { color: 'CCCCCC', width: 1 }
			});

			// Color name (bold)
			slide.addText(colorInfo.name, {
				x,
				y: y + swatchHeight * 0.55,
				w: swatchWidth,
				h: 0.3,
				fontSize: 16,
				bold: true,
				color: '2C504D',
				align: 'center'
			});

			// Hex code
			slide.addText(colorInfo.hex.toUpperCase(), {
				x,
				y: y + swatchHeight * 0.75,
				w: swatchWidth,
				h: 0.25,
				fontSize: 14,
				color: '666666',
				align: 'center',
				fontFace: 'Courier New'
			});

			// Description (if available and fits)
			if (colorInfo.description && row < 2) {
				slide.addText(colorInfo.description, {
					x,
					y: y + swatchHeight * 0.92,
					w: swatchWidth,
					h: 0.4,
					fontSize: 11,
					color: '999999',
					align: 'center',
					wrap: true
				});
			}
		});
	}

	/**
	 * Add typography slide with font previews
	 */
	private async addTypographySlide(pptx: any, stepData: StepData, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();
		slide.background = { color: 'FFFFFF' };

		// Extract font information
		const fonts = this.extractFonts(stepData.content);

		// Title
		slide.addText(stepData.title || 'Typography', {
			x: 0.5,
			y: 0.3,
			w: 9,
			h: 0.7,
			fontSize: 36,
			bold: true,
			color: '2C504D',
			align: 'left'
		});

		// Primary font card (left side)
		if (fonts.primary) {
			this.addFontCard(slide, fonts.primary, { x: 0.5, y: 1.2, w: 4.5, h: 3.5 });
		}

		// Supporting font card (right side)
		if (fonts.supporting) {
			this.addFontCard(slide, fonts.supporting, { x: 5.2, y: 1.2, w: 4.5, h: 3.5 });
		}
	}

	/**
	 * Add logo guidelines slide (may create 2 slides for do's and don'ts)
	 */
	private async addLogoGuidelinesSlide(pptx: any, stepData: StepData, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();
		slide.background = { color: 'FFFFFF' };

		// Title
		slide.addText(stepData.title || 'Logo Guidelines', {
			x: 0.5,
			y: 0.3,
			w: 9,
			h: 0.7,
			fontSize: 36,
			bold: true,
			color: '2C504D',
			align: 'left'
		});

		// Logo (if available) - centered at top
		if (brandData.logoFiles && brandData.logoFiles.length > 0) {
			try {
				slide.addImage({
					data: brandData.logoFiles[0].fileData,
					x: 3.5,
					y: 1.2,
					w: 3,
					h: 2,
					sizing: { type: 'contain' }
				});
			} catch (error) {
				console.warn('⚠️ Failed to add logo to guidelines slide');
			}
		}

		// Extract and render guidelines text
		const guidelines = this.extractBulletPoints(stepData.content);
		
		if (guidelines.length > 0) {
			const bulletText = guidelines.map(g => `• ${g}`).join('\n');
			
			slide.addText(bulletText, {
				x: 0.5,
				y: 3.5,
				w: 9,
				h: 1.5,
				fontSize: 14,
				color: '374151',
				align: 'left',
				valign: 'top',
				wrap: true
			});
		}
	}

	/**
	 * Add iconography slide with icon grid
	 */
	private async addIconographySlide(pptx: any, stepData: StepData, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();
		slide.background = { color: 'FFFFFF' };

		// Title
		slide.addText(stepData.title || 'Iconography', {
			x: 0.5,
			y: 0.3,
			w: 9,
			h: 0.7,
			fontSize: 36,
			bold: true,
			color: '2C504D',
			align: 'left'
		});

		// Extract icons
		const icons = this.extractIcons(stepData.content);

		// Render icons in grid (4 columns)
		const startY = 1.3;
		const iconSize = 2.2;
		const spacing = 0.3;
		const columns = 4;

		icons.forEach((icon, index) => {
			const col = index % columns;
			const row = Math.floor(index / columns);
			const x = 0.5 + col * (iconSize + spacing);
			const y = startY + row * (iconSize + 0.3);

			// Icon symbol (large)
			slide.addText(icon.symbol, {
				x,
				y,
				w: iconSize,
				h: 0.8,
				fontSize: 48,
				color: '2C504D',
				align: 'center',
				valign: 'middle'
			});

			// Icon name
			slide.addText(icon.name, {
				x,
				y: y + 0.9,
				w: iconSize,
				h: 0.3,
				fontSize: 12,
				color: '666666',
				align: 'center'
			});
		});
	}

	/**
	 * Add standard content slide
	 */
	private async addStandardContentSlide(
		pptx: any,
		stepData: StepData,
		brandData: BrandData,
		pageNumber: number
	): Promise<void> {
		const slide = pptx.addSlide();
		slide.background = { color: 'FFFFFF' };

		// Title
		slide.addText(stepData.title || 'Content', {
			x: 0.5,
			y: 0.3,
			w: 8.5,
			h: 0.7,
			fontSize: 32,
			bold: true,
			color: '2C504D',
			align: 'left'
		});

		// Brand name (top right)
		if (brandData.brandName) {
			slide.addText(brandData.brandName, {
				x: 8.5,
				y: 0.3,
				w: 1,
				h: 0.4,
				fontSize: 12,
				color: '999999',
				align: 'right'
			});
		}

		// Format and add content
		const formattedContent = this.formatMarkdownContent(stepData.content);
		
		slide.addText(formattedContent, {
			x: 0.5,
			y: 1.2,
			w: 9,
			h: 3.8,
			fontSize: 16,
			color: '374151',
			align: 'left',
			valign: 'top',
			wrap: true,
			lineSpacing: 1.3
		});

		// Page number
		slide.addText(`${pageNumber}`, {
			x: 9.2,
			y: 5.2,
			w: 0.5,
			h: 0.3,
			fontSize: 12,
			color: '999999',
			align: 'right'
		});
	}

	/**
	 * Add content slide based on AI layout
	 */
	private async addContentSlide(
		pptx: any,
		layout: any,
		stepData: StepData,
		brandData: BrandData
	): Promise<void> {
		const slide = pptx.addSlide();

		// Set background
		if (layout.background?.type === 'color') {
			slide.background = { color: layout.background.value.replace('#', '') };
		} else {
			slide.background = { color: 'FFFFFF' };
		}

		// Render each region
		for (const region of layout.regions) {
			try {
				await this.renderRegion(slide, region, stepData, brandData);
			} catch (error) {
				console.warn(`⚠️ Failed to render region:`, error);
			}
		}
	}

	/**
	 * Render a specific region on a slide
	 */
	private async renderRegion(
		slide: any,
		region: any,
		stepData: StepData,
		brandData: BrandData
	): Promise<void> {
		const pos = region.position;

		if (region.type === 'text') {
			const content = this.getRegionContent(region, stepData, brandData);
			if (!content) return;

			const style = region.style || {};

			slide.addText(content, {
				x: pos.x,
				y: pos.y,
				w: pos.w,
				h: pos.h,
				fontSize: style.fontSize || 16,
				bold: style.bold || false,
				italic: style.italic || false,
				color: style.color?.replace('#', '') || '000000',
				align: style.align || 'left',
				valign: 'top',
				wrap: true
			});
		} else if (region.type === 'image' && brandData.logoFiles?.[0]) {
			slide.addImage({
				data: brandData.logoFiles[0].fileData,
				x: pos.x,
				y: pos.y,
				w: pos.w,
				h: pos.h,
				sizing: { type: 'contain' }
			});
		} else if (region.type === 'color_swatch' && region.metadata?.color) {
			// Render color swatch
			await this.renderColorSwatch(slide, pos, region.metadata);
		}
	}

	/**
	 * Get content for a region based on binding
	 */
	private getRegionContent(region: any, stepData: StepData, brandData: BrandData): string {
		if (region.content) return region.content;

		switch (region.binding) {
			case 'title':
				return stepData.title || '';
			case 'content':
				return this.formatContent(stepData.content || '');
			case 'brand_name':
				return brandData.brandName || '';
			case 'page_number':
				return ''; // Page numbers handled separately
			default:
				return '';
		}
	}

	/**
	 * Format markdown content for PowerPoint
	 */
	private formatContent(markdown: string): string {
		return (
			markdown
				// Remove markdown formatting
				.replace(/\*\*(.*?)\*\*/g, '$1')
				.replace(/\*(.*?)\*/g, '$1')
				// Remove headers
				.replace(/^#{1,6}\s+/gm, '')
				// Keep bullets
				.replace(/^[\*\-]\s+/gm, '• ')
				.trim()
		);
	}

	/**
	 * Render color swatch with label
	 */
	private async renderColorSwatch(slide: any, pos: any, metadata: any): Promise<void> {
		const color = metadata.color?.replace('#', '') || '000000';

		// Color box
		slide.addShape('rect', {
			x: pos.x,
			y: pos.y,
			w: pos.w,
			h: pos.h * 0.6,
			fill: { color },
			line: { color: 'CCCCCC', width: 1 }
		});

		// Color name
		if (metadata.name) {
			slide.addText(metadata.name, {
				x: pos.x,
				y: pos.y + pos.h * 0.65,
				w: pos.w,
				h: 0.3,
				fontSize: 14,
				bold: true,
				color: '2C504D',
				align: 'center'
			});
		}

		// Hex code
		slide.addText(`#${color.toUpperCase()}`, {
			x: pos.x,
			y: pos.y + pos.h * 0.8,
			w: pos.w,
			h: 0.2,
			fontSize: 12,
			color: '666666',
			align: 'center'
		});
	}

	/**
	 * Add closing slide
	 */
	private async addClosingSlide(pptx: any, brandData: BrandData): Promise<void> {
		const slide = pptx.addSlide();

		// Background
		slide.background = { color: '2C504D' };

		// Thank you text
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

		// Contact info
		if (brandData.contactEmail) {
			slide.addText(brandData.contactEmail, {
				x: 1,
				y: 3.8,
				w: 8,
				h: 0.4,
				fontSize: 18,
				color: 'E2AB4A',
				align: 'center'
			});
		}
	}

	/**
	 * Get list of models used
	 */
	private getModelsUsed(): string[] {
		// This would need to track which models were actually called
		return ['qwen3-32b', 'llama-3.3-70b'];
	}

	/**
	 * Get total tokens used
	 */
	private getTotalTokens(): number {
		const summary = this.tracker.getSummary();
		return summary.totalTokens;
	}

	/**
	 * Print usage report to console
	 */
	private printUsageReport(): void {
		console.log('\n📊 Model Usage Report:');
		console.table(this.router.getUsageReport());
	}

	/**
	 * Get usage report (for API endpoint)
	 */
	getUsageReport(): Record<string, any> {
		return this.router.getUsageReport();
	}

	// ═══════════════════════════════════════════════════════════════
	// HELPER METHODS: Content Extraction
	// ═══════════════════════════════════════════════════════════════

	/**
	 * Extract colors from markdown content
	 */
	private extractColors(content: string): Array<{ name: string; hex: string; description: string }> {
		const colors: Array<{ name: string; hex: string; description: string }> = [];
		const lines = content.split('\n');

		for (const line of lines) {
			// Match patterns like: • **Name** - #hex - description
			const match = line.match(/\*\*([^*]+)\*\*\s*-\s*(#[0-9A-Fa-f]{6})\s*-\s*(.+)/);
			if (match) {
				colors.push({
					name: match[1].trim(),
					hex: match[2].trim(),
					description: match[3].trim()
				});
			} else {
				// Try simpler pattern: Name - #hex
				const simpleMatch = line.match(/([^-]+)\s*-\s*(#[0-9A-Fa-f]{6})/);
				if (simpleMatch) {
					colors.push({
						name: simpleMatch[1].replace(/[•\-\*]/g, '').trim(),
						hex: simpleMatch[2].trim(),
						description: ''
					});
				}
			}
		}

		return colors;
	}

	/**
	 * Extract font information from content
	 */
	private extractFonts(content: string): { primary: any; supporting: any } {
		const fonts = { primary: null, supporting: null };
		const lines = content.split('\n');

		for (const line of lines) {
			// Primary font pattern: **Primary Font**: FontName - description
			if (line.includes('Primary Font')) {
				const match = line.match(/\*\*Primary Font\*\*:\s*([A-Za-z\s]+)\s*-\s*(.+)/i);
				if (match) {
					fonts.primary = {
						name: match[1].trim(),
						description: match[2].trim()
					};
				}
			}

			// Supporting font pattern
			if (line.includes('Supporting Font')) {
				const match = line.match(/\*\*Supporting Font\*\*:\s*([A-Za-z\s]+)\s*-\s*(.+)/i);
				if (match) {
					fonts.supporting = {
						name: match[1].trim(),
						description: match[2].trim()
					};
				}
			}
		}

		return fonts;
	}

	/**
	 * Extract icons from content
	 */
	private extractIcons(content: string): Array<{ symbol: string; name: string }> {
		const icons: Array<{ symbol: string; name: string }> = [];
		const lines = content.split('\n');

		for (const line of lines) {
			// Match pattern: • ⚫ Name or • Symbol Name
			const match = line.match(/^[\s]*[•\-\*]\s*([⚫⚪⚡⚙⚠⚰⚱★☆♦♠♣♥♪♫♬♭♮♯▲▼◄►◆◇○●◎⬛⬜☀☁☂☎☐☑☒☓☕☘☝☞☟☠☢☣☮☯☸☹☺☻☼☽☾♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓♔♕♖♗♘♙♚♛♜♝♞♟])\s+(.+)/);
			if (match) {
				icons.push({
					symbol: match[1].trim(),
					name: match[2].trim()
				});
			}
		}

		return icons;
	}

	/**
	 * Extract bullet points from content
	 */
	private extractBulletPoints(content: string): string[] {
		const bullets: string[] = [];
		const lines = content.split('\n');

		for (const line of lines) {
			// Match bullet lines
			const match = line.match(/^[\s]*[•\-\*]\s+(.+)/);
			if (match) {
				bullets.push(match[1].trim());
			}
		}

		return bullets;
	}

	/**
	 * Format markdown content for PowerPoint
	 */
	private formatMarkdownContent(content: string): string {
		return content
			.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
			.replace(/\*(.*?)\*/g, '$1') // Remove italic markers
			.replace(/^#{1,6}\s+/gm, '') // Remove heading markers
			.replace(/^[\s]*[•\-\*]\s+/gm, '• ') // Normalize bullets
			.trim();
	}

	/**
	 * Add font preview card
	 */
	private addFontCard(slide: any, font: { name: string; description: string }, pos: { x: number; y: number; w: number; h: number }): void {
		// Card background
		slide.addShape('rect', {
			x: pos.x,
			y: pos.y,
			w: pos.w,
			h: pos.h,
			fill: { color: 'F8F9FA' },
			line: { color: 'E9ECEF', width: 1 }
		});

		// Font name (in the actual font)
		slide.addText(font.name, {
			x: pos.x + 0.2,
			y: pos.y + 0.2,
			w: pos.w - 0.4,
			h: 0.5,
			fontSize: 24,
			bold: true,
			color: '2C504D',
			fontFace: font.name,
			align: 'left'
		});

		// Alphabet preview (in the font)
		slide.addText('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789', {
			x: pos.x + 0.2,
			y: pos.y + 0.8,
			w: pos.w - 0.4,
			h: 1.5,
			fontSize: 14,
			color: '374151',
			fontFace: font.name,
			align: 'left'
		});

		// Description
		slide.addText(font.description, {
			x: pos.x + 0.2,
			y: pos.y + 2.5,
			w: pos.w - 0.4,
			h: 0.8,
			fontSize: 12,
			color: '666666',
			align: 'left',
			italic: true,
			wrap: true
		});
	}
}

