import PptxGenJS from 'pptxgenjs';
import type { BrandGuidelinesSpec } from '$lib/types/brand-guidelines';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface PowerPointGenerationOptions {
	brandGuidelines: BrandGuidelinesSpec;
	logoFiles?: Array<{ filename: string; filePath: string; usageTag: string }>;
	outputPath?: string;
}

export class PowerPointGenerator {
	private pptx: PptxGenJS;
	private brandGuidelines: BrandGuidelinesSpec;
	private logoFiles: Array<{ filename: string; filePath: string; usageTag: string }>;

	constructor(options: PowerPointGenerationOptions) {
		this.pptx = new PptxGenJS();
		this.brandGuidelines = options.brandGuidelines;
		this.logoFiles = options.logoFiles || [];

		// Set presentation properties (16:9 aspect ratio)
		this.pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
		this.pptx.layout = 'LAYOUT_16x9';

		// Set slide margins for better content fit
		this.pptx.defineSlideMaster({
			title: 'MASTER_SLIDE',
			margin: [0.5, 0.5, 0.5, 0.5], // top, right, bottom, left margins
			background: { color: 'FFFFFF' }
		});
	}

	private async getLogoData(logoFile?: {
		filename: string;
		fileData?: string;
		filePath?: string; // For backward compatibility
		usageTag: string;
	}): Promise<string | null> {
		if (!logoFile) return null;

		// If fileData is available (new format), use it directly
		if (logoFile.fileData) {
			return logoFile.fileData;
		}

		// Fallback to filePath for backward compatibility
		if (logoFile.filePath) {
			try {
				// Check if file exists and read it
				const fs = await import('fs');
				const path = await import('path');

				const fullPath = path.join(process.cwd(), logoFile.filePath);

				if (fs.existsSync(fullPath)) {
					const fileBuffer = fs.readFileSync(fullPath);
					const base64 = fileBuffer.toString('base64');
					const extension = logoFile.filename.split('.').pop()?.toLowerCase() || 'png';
					return `data:image/${extension};base64,${base64}`;
				} else {
					console.warn(`Logo file not found: ${fullPath}`);
					return null;
				}
			} catch (error) {
				console.warn(`Error reading logo file ${logoFile.filePath}:`, error);
				return null;
			}
		}

		return null;
	}

	// Helper function to ensure content fits within slide boundaries
	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	// Helper function to split long text into multiple lines that fit
	private wrapText(text: string, maxCharsPerLine: number): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			if ((currentLine + word).length <= maxCharsPerLine) {
				currentLine += (currentLine ? ' ' : '') + word;
			} else {
				if (currentLine) lines.push(currentLine);
				currentLine = word;
			}
		}
		if (currentLine) lines.push(currentLine);
		return lines;
	}

	// Helper function to get optimal content size based on available space
	private getOptimalContentSize(
		availableHeight: number,
		lineCount: number
	): { fontSize: number; lineSpacing: number } {
		const maxFontSize = Math.min(20, Math.floor((availableHeight / lineCount) * 8));
		const fontSize = Math.max(10, maxFontSize);
		const lineSpacing = fontSize * 1.2;
		return { fontSize, lineSpacing };
	}

	// Professional slide dimensions and layout standards
	private getSlideLayout() {
		return {
			// Slide dimensions (16:9 aspect ratio)
			slideWidth: 10,
			slideHeight: 5.625,

			// Professional margins
			margin: 0.75,
			contentWidth: 8.5, // 10 - 1.5 (margins)
			contentHeight: 4.125, // 5.625 - 1.5 (margins)

			// Standard positioning
			titleY: 0.75,
			titleHeight: 0.6,
			contentY: 1.5,
			contentAreaHeight: 3.375, // 4.125 - 0.75 (title space)

			// Typography standards
			titleFontSize: 24,
			subtitleFontSize: 18,
			bodyFontSize: 14,
			captionFontSize: 12,
			smallFontSize: 10,

			// Spacing standards
			lineSpacing: 1.2,
			paragraphSpacing: 0.2,
			sectionSpacing: 0.4
		};
	}

	// Professional content validation and formatting
	private formatContentForSlide(
		content: string,
		maxLines: number = 6,
		maxCharsPerLine: number = 50
	): string {
		if (!content) return '';

		// Clean and normalize content
		let cleanContent = content.trim().replace(/\s+/g, ' ');

		// Split into sentences for better control
		const sentences = cleanContent.split(/[.!?]+/).filter((s) => s.trim().length > 0);

		// Build content line by line
		const lines: string[] = [];
		let currentLine = '';

		for (const sentence of sentences) {
			const trimmedSentence = sentence.trim();
			if (!trimmedSentence) continue;

			// If adding this sentence would exceed line limit
			if ((currentLine + ' ' + trimmedSentence).length > maxCharsPerLine) {
				if (currentLine) {
					lines.push(currentLine.trim());
					currentLine = trimmedSentence;
				} else {
					// Sentence is too long, split it
					const words = trimmedSentence.split(' ');
					for (const word of words) {
						if ((currentLine + ' ' + word).length > maxCharsPerLine) {
							if (currentLine) lines.push(currentLine.trim());
							currentLine = word;
						} else {
							currentLine += (currentLine ? ' ' : '') + word;
						}
					}
				}
			} else {
				currentLine += (currentLine ? ' ' : '') + trimmedSentence;
			}

			// Check if we've reached max lines
			if (lines.length >= maxLines) break;
		}

		// Add remaining content
		if (currentLine && lines.length < maxLines) {
			lines.push(currentLine.trim());
		}

		return lines.join('\n');
	}

	// Professional bullet point formatting
	private formatBulletPoints(items: string[], maxItems: number = 4): string {
		if (!items || items.length === 0) return '';

		const limitedItems = items.slice(0, maxItems);
		return limitedItems.map((item) => `• ${item.trim()}`).join('\n');
	}

	async generatePresentation(): Promise<Buffer> {
		try {
			// Generate slides that match the UI structure exactly
			await this.createUIStyleSlides();

			// Generate the presentation buffer
			const buffer = await this.pptx.write('nodebuffer' as any);
			return buffer as Buffer;
		} catch (error) {
			console.error('Error generating PowerPoint presentation:', error);
			throw new Error('Failed to generate PowerPoint presentation');
		}
	}

	// New method to orchestrate UI-style slide creation
	private async createUIStyleSlides(): Promise<void> {
		// Create slides that match the UI structure exactly
		await this.createCoverSlide();
		await this.createTableOfContentsSlide();
		await this.createIntroSlide();
		await this.createPositioningSlide();
		await this.createBrandPersonalitySlide();
		await this.createLogoSystemSlide();
		await this.createPrimaryColorsSlide();
		await this.createSecondaryColorsSlide();
		await this.createTypographySlide();
		await this.createIconographySlide();
		await this.createPhotographySlide();
		await this.createPatternsSlide();
		await this.createApplicationsSlides();
		await this.createContactSlide();
		await this.createThankYouSlide();
	}

	private async createCoverSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Blue gradient background to match UI
		slide.background = {
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000'
		};

		// Brand name - Large and centered like UI
		const brandName = this.brandGuidelines.brand_name;
		slide.addText(brandName, {
			x: layout.margin,
			y: 1.8,
			w: layout.contentWidth,
			h: 1.0,
			fontSize: 48,
			color: 'FFFFFF',
			bold: true,
			align: 'center',
			fontFace: this.brandGuidelines.typography.primary.name,
			valign: 'middle'
		});

		// Subtitle - "BRAND GUIDELINES"
		slide.addText('BRAND GUIDELINES', {
			x: layout.margin,
			y: 2.9,
			w: layout.contentWidth,
			h: 0.5,
			fontSize: 20,
			color: 'FFFFFF',
			align: 'center',
			fontFace: this.brandGuidelines.typography.supporting.name
		});

		// Description - centered and formatted like UI
		const description = this.formatContentForSlide(
			this.brandGuidelines.short_description,
			2, // max 2 lines
			60 // max 60 chars per line
		);

		slide.addText(description, {
			x: layout.margin,
			y: 3.5,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: 16,
			color: 'FFFFFF',
			align: 'center',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 24
		});

		// Footer - Copyright notice like UI
		slide.addText(`© ${new Date().getFullYear()} ${brandName}`, {
			x: layout.margin,
			y: 4.8,
			w: layout.contentWidth,
			h: 0.3,
			fontSize: 12,
			color: 'FFFFFF',
			align: 'center',
			fontFace: this.brandGuidelines.typography.supporting.name
		});
	}

	private async createTableOfContentsSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Title - Blue color like UI
		slide.addText('Table of Contents', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// TOC items - exactly like UI
		const tocItems = [
			'01. Introduction & Purpose',
			'02. Brand Positioning',
			'03. Brand Personality',
			'04. Logo System',
			'05. Color Palette',
			'06. Typography',
			'07. Iconography',
			'08. Photography',
			'09. Applications',
			'10. Contact Information'
		];

		// Two-column layout matching UI
		const leftColumn = tocItems.slice(0, 5);
		const rightColumn = tocItems.slice(5);

		// Left column
		let yPos = layout.contentY + 0.2;
		leftColumn.forEach((item, index) => {
			slide.addText(item, {
				x: layout.margin,
				y: yPos,
				w: 4,
				h: 0.3,
				fontSize: 16,
				color: this.brandGuidelines.colors.core_palette[1]?.hex || '#000000',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 20
			});
			yPos += 0.35;
		});

		// Right column
		yPos = layout.contentY + 0.2;
		rightColumn.forEach((item, index) => {
			slide.addText(item, {
				x: 5.5,
				y: yPos,
				w: 4,
				h: 0.3,
				fontSize: 16,
				color: this.brandGuidelines.colors.core_palette[1]?.hex || '#000000',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 20
			});
			yPos += 0.35;
		});
	}

	private async createIntroSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Title - Blue like UI
		slide.addText('Introduction & Purpose', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Main content - matching UI text
		const introText = this.formatContentForSlide(
			`This brand guidelines document serves as the definitive guide for maintaining consistent brand identity across all touchpoints for ${this.brandGuidelines.brand_name}.`,
			2, // max 2 lines
			60 // max 60 chars per line
		);

		slide.addText(introText, {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: 18,
			color: '#374151',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 24
		});

		// Purpose section - Blue title like UI
		slide.addText('Purpose', {
			x: layout.margin,
			y: 2.4,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: 24,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const purposeItems = [
			'Ensure brand consistency across all communications',
			'Provide clear guidelines for designers and developers',
			'Maintain brand integrity in all applications',
			'Support brand recognition and recall'
		];

		const purposeText = this.formatBulletPoints(purposeItems, 4);

		slide.addText(purposeText, {
			x: layout.margin,
			y: 2.9,
			w: layout.contentWidth,
			h: 1.2,
			fontSize: 16,
			color: '#374151',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Closing statement - italic like UI
		const closingText = this.formatContentForSlide(
			`These guidelines are essential for anyone working with the ${this.brandGuidelines.brand_name} brand.`,
			1, // max 1 line
			70 // max 70 chars per line
		);

		slide.addText(closingText, {
			x: layout.margin,
			y: 4.2,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: 16,
			color: '#6b7280',
			fontFace: this.brandGuidelines.typography.supporting.name,
			italic: true
		});
	}

	private async createPositioningSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Title - Blue like UI
		slide.addText('Brand Positioning', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Positioning statement - centered and highlighted like UI
		const positioningText = this.formatContentForSlide(
			this.brandGuidelines.positioning_statement,
			3, // max 3 lines
			55 // max 55 chars per line
		);

		slide.addText(positioningText, {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 1.0,
			fontSize: 20,
			color: '#1f2937',
			bold: true,
			align: 'center',
			fontFace: this.brandGuidelines.typography.primary.name,
			lineSpacing: 24,
			italic: true
		});

		// Mission and Vision sections - side by side like UI
		slide.addText('Mission', {
			x: layout.margin,
			y: 2.8,
			w: 4,
			h: 0.4,
			fontSize: 24,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const missionText = this.formatContentForSlide(
			this.brandGuidelines.mission ||
				`Our mission is to deliver exceptional value in the ${this.brandGuidelines.brand_domain} space, creating meaningful connections with our audience through innovative solutions and consistent brand experience.`,
			2, // max 2 lines
			60 // max 60 chars per line
		);

		slide.addText(missionText, {
			x: layout.margin,
			y: 3.3,
			w: 4,
			h: 0.8,
			fontSize: 16,
			color: '#374151',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Vision section
		slide.addText('Vision', {
			x: 5.5,
			y: 2.8,
			w: 4,
			h: 0.4,
			fontSize: 24,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const visionText = this.formatContentForSlide(
			this.brandGuidelines.vision ||
				`To be the leading brand in ${this.brandGuidelines.brand_domain}, recognized for innovation, quality, and exceptional customer experience.`,
			2, // max 2 lines
			60 // max 60 chars per line
		);

		slide.addText(visionText, {
			x: 5.5,
			y: 3.3,
			w: 4,
			h: 0.8,
			fontSize: 16,
			color: '#374151',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});
	}

	private async createBrandPersonalitySlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Brand Personality & Voice', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Personality traits section
		slide.addText('Personality Traits', {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const traitsText = this.brandGuidelines.voice_and_tone.adjectives.slice(0, 4).join(' • ');

		slide.addText(traitsText, {
			x: layout.margin,
			y: 1.9,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Communication style section
		slide.addText('Communication Style', {
			x: layout.margin,
			y: 2.4,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const guidelinesText = this.formatContentForSlide(
			this.brandGuidelines.voice_and_tone.guidelines,
			2, // max 2 lines
			60 // max 60 chars per line
		);

		slide.addText(guidelinesText, {
			x: layout.margin,
			y: 2.9,
			w: layout.contentWidth,
			h: 0.6,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Sample sentences section
		slide.addText('Sample Sentences', {
			x: layout.margin,
			y: 3.6,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const sampleText = this.brandGuidelines.voice_and_tone.sample_lines.slice(0, 2).join('\n');

		slide.addText(sampleText, {
			x: layout.margin,
			y: 4.1,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20,
			italic: true
		});
	}

	private async createClearSpaceSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Clear Space & Minimum Sizes', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Clear space rules section
		slide.addText('Clear Space Rules', {
			x: layout.margin,
			y: layout.contentY,
			w: 4,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const clearSpaceText = this.formatContentForSlide(
			`Clear Space Method: ${this.brandGuidelines.logo.clear_space_method || ''}`,
			3, // max 3 lines
			50 // max 50 chars per line
		);

		slide.addText(clearSpaceText, {
			x: layout.margin,
			y: 1.9,
			w: 4,
			h: 1.0,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Minimum sizes section
		slide.addText('Minimum Sizes', {
			x: 5.5,
			y: layout.contentY,
			w: 4,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const minimumSizes =
			this.brandGuidelines.logo.minimum_sizes?.slice(0, 3) ||
			[
				// Minimum sizes will be generated by AI
			];

		const minimumSizesText = this.formatBulletPoints(minimumSizes, 3);

		slide.addText(minimumSizesText, {
			x: 5.5,
			y: 1.9,
			w: 4,
			h: 1.0,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Visual guide section
		slide.addText('Visual Guide', {
			x: layout.margin,
			y: 3.2,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(
			'[Visual representation of clear space and minimum size guidelines would be shown here]',
			{
				x: layout.margin,
				y: 3.7,
				w: layout.contentWidth,
				h: 0.8,
				fontSize: layout.captionFontSize,
				color: '#999999',
				align: 'center',
				fontFace: this.brandGuidelines.typography.supporting.name
			}
		);
	}

	private async createLogoUsageSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title - centered
		slide.addText('Logo Usage Guidelines', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			align: 'center',
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Section header
		slide.addText("Do's & Don'ts", {
			x: layout.margin,
			y: 1.4,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// DO's column - left side
		slide.addText('DO:', {
			x: layout.margin,
			y: 1.9,
			w: 4,
			h: 0.3,
			fontSize: 16,
			color: '#10B981',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Professional DO's content - limited and formatted
		const dosItems = [
			'Use logo on a solid, contrasting background',
			'Maintain original aspect ratio of the logo',
			'Use approved brand colors for text and UI elements'
		];

		const dosText = this.formatBulletPoints(dosItems, 3);

		slide.addText(dosText, {
			x: layout.margin,
			y: 2.3,
			w: 4,
			h: 1.5,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// DON'T column - right side
		slide.addText("DON'T:", {
			x: 5.5,
			y: 1.9,
			w: 4,
			h: 0.3,
			fontSize: 16,
			color: '#EF4444',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Professional DON'T content - limited and formatted
		const dontsItems = [
			// Logo usage rules will be generated by AI
			'Do not place the logo on busy or clashing photographic backgrounds',
			'Do not use unapproved fonts or off-brand color palettes'
		];

		const dontsText = this.formatBulletPoints(dontsItems, 3);

		slide.addText(dontsText, {
			x: 5.5,
			y: 2.3,
			w: 4,
			h: 1.5,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});
	}

	private async createPrimaryColorsSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Title
		slide.addText('Core Color Palette', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Core palette swatches - single row layout (4 total)
		const coreColors = this.brandGuidelines.colors.core_palette.slice(0, 4);
		const swatchWidth = 1.8; // 200px equivalent
		const swatchHeight = 1.8; // 200px equivalent
		const startX = 1;
		const swatchY = 1.5;

		coreColors.forEach((color, index) => {
			const xPos = startX + index * 2.2; // Spacing between swatches

			// Color swatch (200x200px equivalent)
			slide.addShape('rect', {
				x: xPos,
				y: swatchY,
				w: swatchWidth,
				h: swatchHeight,
				fill: { color: color.hex },
				line: { color: '#CCCCCC', width: 2 }
			});

			// Color name
			slide.addText(color.name, {
				x: xPos,
				y: swatchY + swatchHeight + 0.1,
				w: swatchWidth,
				h: 0.2,
				fontSize: 12,
				color: '#333333',
				bold: true,
				align: 'center',
				fontFace: this.brandGuidelines.typography.primary.name
			});

			// HEX code
			slide.addText(color.hex, {
				x: xPos,
				y: swatchY + swatchHeight + 0.3,
				w: swatchWidth,
				h: 0.15,
				fontSize: 10,
				color: '#666666',
				align: 'center',
				fontFace: this.brandGuidelines.typography.secondary[0]?.name || 'Arial'
			});

			// RGB values
			slide.addText(`RGB: ${color.rgb}`, {
				x: xPos,
				y: swatchY + swatchHeight + 0.45,
				w: swatchWidth,
				h: 0.15,
				fontSize: 9,
				color: '#666666',
				align: 'center',
				fontFace: this.brandGuidelines.typography.secondary[0]?.name || 'Arial'
			});

			// CMYK values
			slide.addText(`CMYK: ${color.cmyk}`, {
				x: xPos,
				y: swatchY + swatchHeight + 0.6,
				w: swatchWidth,
				h: 0.15,
				fontSize: 9,
				color: '#666666',
				align: 'center',
				fontFace: this.brandGuidelines.typography.secondary[0]?.name || 'Arial'
			});

			// Pantone (if provided)
			if (color.pantone) {
				slide.addText(`Pantone: ${color.pantone}`, {
					x: xPos,
					y: swatchY + swatchHeight + 0.75,
					w: swatchWidth,
					h: 0.15,
					fontSize: 9,
					color: '#666666',
					align: 'center',
					fontFace: this.brandGuidelines.typography.secondary[0]?.name || 'Arial'
				});
			}
		});
	}

	private async createSecondaryColorsSlide(): Promise<void> {
		const slide = this.pptx.addSlide();

		// Title
		slide.addText('Secondary Colors & Gradients', {
			x: 1,
			y: 0.5,
			w: 8,
			h: 0.8,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Secondary colors
		slide.addText('Secondary Palette', {
			x: 1,
			y: 1.5,
			w: 4,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		let xPos = 1;
		this.brandGuidelines.colors.secondary_palette.forEach((color, index) => {
			if (xPos > 4) return;

			// Color swatch
			slide.addShape('rect', {
				x: xPos,
				y: 2,
				w: 0.8,
				h: 0.8,
				fill: { color: color.hex },
				line: { color: '#CCCCCC', width: 1 }
			});

			// Color info
			slide.addText(`${color.name}\n${color.hex}`, {
				x: xPos,
				y: 2.9,
				w: 0.8,
				h: 0.4,
				fontSize: 10,
				color: '#333333',
				align: 'center',
				fontFace: this.brandGuidelines.typography.supporting.name
			});

			xPos += 1;
		});

		// Gradients
		slide.addText('Gradients', {
			x: 5.5,
			y: 1.5,
			w: 3.5,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		if (this.brandGuidelines.patterns_gradients.length > 0) {
			this.brandGuidelines.patterns_gradients.forEach((gradient: any, index: number) => {
				slide.addText(`${gradient.name}: ${gradient.colors.join(' → ')}`, {
					x: 5.5,
					y: 2 + index * 0.3,
					w: 3.5,
					h: 0.3,
					fontSize: 12,
					color: '#333333',
					fontFace: this.brandGuidelines.typography.supporting.name
				});
			});
		} else {
			slide.addText('No gradients defined', {
				x: 5.5,
				y: 2,
				w: 3.5,
				h: 0.3,
				fontSize: 12,
				color: '#999999',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
		}

		// Sample UI
		slide.addText('Sample UI Application', {
			x: 1,
			y: 3.5,
			w: 8,
			h: 0.4,
			fontSize: 16,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText('[Sample UI mockup showing color pairings and usage would be displayed here]', {
			x: 1,
			y: 4,
			w: 8,
			h: 1.5,
			fontSize: 14,
			color: '#999999',
			align: 'center',
			fontFace: this.brandGuidelines.typography.supporting.name
		});
	}

	private async createTypographySlide(): Promise<void> {
		const slide = this.pptx.addSlide();

		// Title
		slide.addText('Typography', {
			x: 1,
			y: 0.5,
			w: 8,
			h: 0.8,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Primary font
		slide.addText('Primary Font', {
			x: 1,
			y: 1.5,
			w: 4,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(this.brandGuidelines.typography.primary.name, {
			x: 1,
			y: 2,
			w: 4,
			h: 0.5,
			fontSize: 24,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(
			`Usage: ${this.brandGuidelines.typography.primary.usage}\nWeights: ${this.brandGuidelines.typography.primary.weights.join(', ')}`,
			{
				x: 1,
				y: 2.6,
				w: 4,
				h: 0.8,
				fontSize: 14,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 18
			}
		);

		// Secondary font
		slide.addText('Secondary Font', {
			x: 5.5,
			y: 1.5,
			w: 3.5,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(this.brandGuidelines.typography.supporting.name, {
			x: 5.5,
			y: 2,
			w: 3.5,
			h: 0.5,
			fontSize: 20,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.supporting.name
		});

		slide.addText(
			`Usage: ${this.brandGuidelines.typography.supporting.usage}\nWeights: ${this.brandGuidelines.typography.supporting.weights.join(', ')}`,
			{
				x: 5.5,
				y: 2.6,
				w: 3.5,
				h: 0.8,
				fontSize: 14,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 18
			}
		);

		// Font sizes
		slide.addText('Font Sizes', {
			x: 1,
			y: 3.5,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const weights = this.brandGuidelines.typography.primary.weights;
		slide.addText(`Available Weights: ${weights.join(' | ')}`, {
			x: 1,
			y: 4,
			w: 8,
			h: 0.5,
			fontSize: 14,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name
		});

		// Sample text
		slide.addText('Sample Text', {
			x: 1,
			y: 4.6,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(this.brandGuidelines.typography.primary.usage, {
			x: 1,
			y: 5.1,
			w: 8,
			h: 0.5,
			fontSize: 16,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.primary.name
		});
	}

	private async createIconographySlide(): Promise<void> {
		const slide = this.pptx.addSlide();

		// Title
		slide.addText('Iconography', {
			x: 1,
			y: 0.5,
			w: 8,
			h: 0.8,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Style description
		slide.addText('Style Description', {
			x: 1,
			y: 1.5,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(this.brandGuidelines.iconography.style, {
			x: 1,
			y: 2,
			w: 8,
			h: 0.8,
			fontSize: 16,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 24
		});

		// Technical specifications
		slide.addText('Technical Specifications', {
			x: 1,
			y: 3,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(
			`Grid: ${this.brandGuidelines.iconography.grid}\nStroke: ${this.brandGuidelines.iconography.stroke}\nColor Usage: ${this.brandGuidelines.iconography.color_usage}`,
			{
				x: 1,
				y: 3.5,
				w: 8,
				h: 1,
				fontSize: 14,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 20
			}
		);

		// Usage rules
		slide.addText('Usage Rules', {
			x: 1,
			y: 4.6,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const rulesText = this.brandGuidelines.iconography.notes;
		slide.addText(`• ${rulesText}`, {
			x: 1,
			y: 5.1,
			w: 8,
			h: 0.5,
			fontSize: 14,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 18
		});
	}

	private async createPhotographySlide(): Promise<void> {
		const slide = this.pptx.addSlide();

		// Title
		slide.addText('Photography Guidelines', {
			x: 1,
			y: 0.5,
			w: 8,
			h: 0.8,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Moodboard description
		slide.addText('Moodboard & Style', {
			x: 1,
			y: 1.5,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		slide.addText(this.brandGuidelines.photography.guidelines, {
			x: 1,
			y: 2,
			w: 8,
			h: 0.8,
			fontSize: 16,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 24
		});

		// Do's and Don'ts
		slide.addText("Do's & Don'ts", {
			x: 1,
			y: 3,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Do's
		slide.addText('DO:', {
			x: 1,
			y: 3.5,
			w: 3.5,
			h: 0.3,
			fontSize: 16,
			color: '#10B981',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const dosText = this.brandGuidelines.photography.examples.join('\n• ');
		slide.addText(`• ${dosText}`, {
			x: 1,
			y: 3.9,
			w: 3.5,
			h: 1.5,
			fontSize: 14,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 18
		});

		// Don'ts
		slide.addText("DON'T:", {
			x: 5.5,
			y: 3.5,
			w: 3.5,
			h: 0.3,
			fontSize: 16,
			color: '#EF4444',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const dontsText = this.brandGuidelines.photography.mood.join('\n• ');
		slide.addText(`• ${dontsText}`, {
			x: 5.5,
			y: 3.9,
			w: 3.5,
			h: 1.5,
			fontSize: 14,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 18
		});
	}

	private async createPatternsSlide(): Promise<void> {
		const slide = this.pptx.addSlide();

		// Title
		slide.addText('Patterns & Gradients', {
			x: 1,
			y: 0.5,
			w: 8,
			h: 0.8,
			fontSize: 32,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Patterns
		slide.addText('Patterns', {
			x: 1,
			y: 1.5,
			w: 4,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		if (this.brandGuidelines.patterns_gradients.length > 0) {
			this.brandGuidelines.patterns_gradients.forEach((pattern: any, index: number) => {
				slide.addText(`${pattern.name}: ${pattern.usage}`, {
					x: 1,
					y: 2 + index * 0.3,
					w: 4,
					h: 0.3,
					fontSize: 14,
					color: '#333333',
					fontFace: this.brandGuidelines.typography.supporting.name
				});
			});
		} else {
			slide.addText('No patterns defined', {
				x: 1,
				y: 2,
				w: 4,
				h: 0.3,
				fontSize: 14,
				color: '#999999',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
		}

		// Gradients
		slide.addText('Gradients', {
			x: 5.5,
			y: 1.5,
			w: 3.5,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		if (this.brandGuidelines.patterns_gradients.length > 0) {
			this.brandGuidelines.patterns_gradients.forEach((gradient: any, index: number) => {
				slide.addText(`${gradient.name}: ${gradient.colors.join(' → ')}`, {
					x: 5.5,
					y: 2 + index * 0.3,
					w: 3.5,
					h: 0.3,
					fontSize: 14,
					color: '#333333',
					fontFace: this.brandGuidelines.typography.supporting.name
				});
			});
		} else {
			slide.addText('No gradients defined', {
				x: 5.5,
				y: 2,
				w: 3.5,
				h: 0.3,
				fontSize: 14,
				color: '#999999',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
		}

		// Usage guidelines
		slide.addText('Usage Guidelines', {
			x: 1,
			y: 3.5,
			w: 8,
			h: 0.4,
			fontSize: 18,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const usageText = this.brandGuidelines.patterns_gradients.map((pg) => pg.usage).join('\n• ');
		slide.addText(`• ${usageText}`, {
			x: 1,
			y: 4,
			w: 8,
			h: 1.5,
			fontSize: 14,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 18
		});
	}

	private async createApplicationsSlides(): Promise<void> {
		// Create slides for each application example
		this.brandGuidelines.applications.forEach((appData, index) => {
			const slide = this.pptx.addSlide();

			// Title
			slide.addText(appData.context, {
				x: 1,
				y: 0.5,
				w: 8,
				h: 0.8,
				fontSize: 32,
				color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
				bold: true,
				fontFace: this.brandGuidelines.typography.primary.name
			});

			// Description
			slide.addText(appData.description, {
				x: 1,
				y: 1.5,
				w: 8,
				h: 0.8,
				fontSize: 16,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 24
			});

			// Key elements
			slide.addText('Key Elements', {
				x: 1,
				y: 2.5,
				w: 4,
				h: 0.4,
				fontSize: 18,
				color: '#333333',
				bold: true,
				fontFace: this.brandGuidelines.typography.primary.name
			});

			const elementsText = appData.context;
			slide.addText(`• ${elementsText}`, {
				x: 1,
				y: 3,
				w: 4,
				h: 1.5,
				fontSize: 14,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 18
			});

			// Layout notes
			slide.addText('Layout Notes', {
				x: 5.5,
				y: 2.5,
				w: 3.5,
				h: 0.4,
				fontSize: 18,
				color: '#333333',
				bold: true,
				fontFace: this.brandGuidelines.typography.primary.name
			});

			const layoutText = appData.layout_notes.join('\n• ');
			slide.addText(`• ${layoutText}`, {
				x: 5.5,
				y: 3,
				w: 3.5,
				h: 1.5,
				fontSize: 14,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 18
			});

			// Visual placeholder
			slide.addText('[Visual example would be shown here]', {
				x: 1,
				y: 4.8,
				w: 8,
				h: 0.8,
				fontSize: 14,
				color: '#999999',
				align: 'center',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
		});
	}

	private async createAccessibilitySlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Accessibility & Technical Notes', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Contrast Guidance section
		slide.addText('Contrast Guidance', {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const contrastItems = [
			'Normal text: 4.5:1 contrast ratio',
			'Large text: 3:1 contrast ratio',
			'UI components: 3:1 contrast ratio'
		];

		const contrastText = this.formatBulletPoints(contrastItems, 3);

		slide.addText(contrastText, {
			x: layout.margin,
			y: 1.9,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Technical Specifications section
		slide.addText('Technical Specifications', {
			x: layout.margin,
			y: 2.8,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const techSpecItems = [
			'Print: Minimum 300 DPI, CMYK color mode',
			'Digital: 72-96 DPI, RGB color mode',
			'Web: Optimized formats (JPEG, PNG, SVG)',
			'Vector: SVG or EPS for scalable graphics'
		];

		const techSpecText = this.formatBulletPoints(techSpecItems, 4);

		slide.addText(techSpecText, {
			x: layout.margin,
			y: 3.3,
			w: layout.contentWidth,
			h: 1.0,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Accessibility Notes section
		slide.addText('Accessibility Notes', {
			x: layout.margin,
			y: 4.4,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Professional accessibility ratings - limited to fit
		const accessibilityItems = [
			'Primary Blue: AA rating on light backgrounds',
			'Primary Blue: AAA rating on dark backgrounds',
			'Dark Gray: AAA rating on light backgrounds',
			'Light Gray: AA rating for dark text'
		];

		const accessibilityText = this.formatBulletPoints(accessibilityItems, 4);

		slide.addText(accessibilityText, {
			x: layout.margin,
			y: 4.9,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});
	}

	private async createAssetsSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Assets & Downloads', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Available Files section
		slide.addText('Available Files', {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Professional file list with proper formatting
		const files = [
			`PowerPoint: ${this.brandGuidelines.brand_name}_Brand_Guidelines.pptx`,
			`Assets ZIP: ${this.brandGuidelines.brand_name}_assets.zip`,
			`JSON: ${this.brandGuidelines.brand_name}_brand_guidelines.json`
		];

		files.forEach((file, index) => {
			slide.addText(file, {
				x: layout.margin,
				y: 1.9 + index * 0.25,
				w: layout.contentWidth,
				h: 0.25,
				fontSize: layout.bodyFontSize,
				color: '#333333',
				fontFace: this.brandGuidelines.typography.supporting.name,
				lineSpacing: 18
			});
		});

		// Export Checklist section
		slide.addText('Export Checklist', {
			x: layout.margin,
			y: 2.8,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Professional checklist with proper bullet formatting
		const checklistItems = [
			'SVG/EPS logos for vector graphics',
			'Color specification files',
			'Typography files with web links',
			'Brand guidelines document',
			'Complete assets package'
		];

		const checklistText = this.formatBulletPoints(checklistItems, 5);

		slide.addText(checklistText, {
			x: layout.margin,
			y: 3.3,
			w: layout.contentWidth,
			h: 1.2,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});
	}

	private async createContactSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Contact & Legal', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Contact information section
		slide.addText('Brand Contact', {
			x: layout.margin,
			y: layout.contentY,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const contactInfo = this.formatContentForSlide(
			`${this.brandGuidelines.legal_contact.contact_name || 'Contact Name'}\n${this.brandGuidelines.legal_contact.title || 'Title'}\n${this.brandGuidelines.legal_contact.company || 'Company'}\n${this.brandGuidelines.legal_contact.email || 'email@company.com'}`,
			4, // max 4 lines
			50 // max 50 chars per line
		);

		slide.addText(contactInfo, {
			x: layout.margin,
			y: 1.9,
			w: layout.contentWidth,
			h: 1.0,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Legal notes section
		slide.addText('Legal Notes', {
			x: layout.margin,
			y: 3.2,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: '#333333',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const legalText = this.formatContentForSlide(
			'These brand guidelines are proprietary to the brand owner. Unauthorized use of brand assets is prohibited. For questions about brand usage, please contact the brand team.',
			3, // max 3 lines
			60 // max 60 chars per line
		);

		slide.addText(legalText, {
			x: layout.margin,
			y: 3.7,
			w: layout.contentWidth,
			h: 0.8,
			fontSize: layout.bodyFontSize,
			color: '#333333',
			fontFace: this.brandGuidelines.typography.supporting.name,
			lineSpacing: 20
		});

		// Professional footer
		slide.addText(
			`Generated on ${new Date().toLocaleDateString()} | Version ${this.brandGuidelines.version || '1.0'}`,
			{
				x: layout.margin,
				y: 4.8,
				w: layout.contentWidth,
				h: 0.3,
				fontSize: layout.captionFontSize,
				color: '#666666',
				align: 'center',
				fontFace: this.brandGuidelines.typography.supporting.name
			}
		);
	}

	private async createLogoSystemSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		const layout = this.getSlideLayout();

		// Professional title
		slide.addText('Logo System & Usage', {
			x: layout.margin,
			y: layout.titleY,
			w: layout.contentWidth,
			h: layout.titleHeight,
			fontSize: layout.titleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Primary logo section
		slide.addText('Primary Logo', {
			x: layout.margin,
			y: layout.contentY,
			w: 4,
			h: 0.4,
			fontSize: layout.subtitleFontSize,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Logo display area - optimized size to prevent overflow
		if (this.logoFiles.length > 0) {
			const logoData = await this.getLogoData(this.logoFiles[0]);
			if (logoData) {
				try {
					slide.addImage({
						data: logoData,
						x: layout.margin,
						y: 1.9,
						w: 3,
						h: 0.8,
						sizing: { type: 'contain', w: 3, h: 0.8 }
					});
				} catch (error) {
					// Professional placeholder
					slide.addShape('rect', {
						x: layout.margin,
						y: 1.9,
						w: 3,
						h: 0.8,
						fill: { color: 'F5F5F5' },
						line: { color: '#CCCCCC', width: 1 }
					});
					slide.addText('Logo Placeholder', {
						x: layout.margin,
						y: 1.9,
						w: 3,
						h: 0.8,
						fontSize: 10,
						color: '#999999',
						align: 'center',
						valign: 'middle',
						fontFace: this.brandGuidelines.typography.supporting.name
					});
				}
			}
		} else {
			// Professional placeholder
			slide.addShape('rect', {
				x: layout.margin,
				y: 1.9,
				w: 3,
				h: 0.8,
				fill: { color: 'F5F5F5' },
				line: { color: '#CCCCCC', width: 1 }
			});
			slide.addText('Logo Placeholder', {
				x: layout.margin,
				y: 1.9,
				w: 3,
				h: 0.8,
				fontSize: 10,
				color: '#999999',
				align: 'center',
				valign: 'middle',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
		}

		// Logo Usage Guidelines Section - moved up to prevent overflow
		slide.addText('Logo Usage Guidelines', {
			x: layout.margin,
			y: 2.8,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: 18,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Do's Section
		slide.addText("✅ DO's", {
			x: layout.margin,
			y: 3.3,
			w: 4,
			h: 0.3,
			fontSize: 14,
			color: '#16a34a',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Don'ts Section
		slide.addText("❌ DON'Ts", {
			x: 5.5,
			y: 3.3,
			w: 4,
			h: 0.3,
			fontSize: 14,
			color: '#dc2626',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Visual Examples - Do's (smaller sizes to prevent overflow)
		if (this.logoFiles.length > 0) {
			const logoData = await this.getLogoData(this.logoFiles[0]);
			if (logoData) {
				try {
					// Correct usage example
					slide.addText('Correct Size', {
						x: layout.margin,
						y: 3.7,
						w: 4,
						h: 0.2,
						fontSize: 10,
						color: this.brandGuidelines.colors.core_palette[1]?.hex || '#000000',
						fontFace: this.brandGuidelines.typography.supporting.name
					});

					slide.addImage({
						data: logoData,
						x: layout.margin,
						y: 3.9,
						w: 1.2,
						h: 0.4,
						sizing: { type: 'contain', w: 1.2, h: 0.4 }
					});

					// Incorrect usage example (stretched)
					slide.addText("Don't Stretch", {
						x: 5.5,
						y: 3.7,
						w: 4,
						h: 0.2,
						fontSize: 10,
						color: this.brandGuidelines.colors.core_palette[1]?.hex || '#000000',
						fontFace: this.brandGuidelines.typography.supporting.name
					});

					// Create a stretched version by using a wider container
					slide.addImage({
						data: logoData,
						x: 5.5,
						y: 3.9,
						w: 2.0,
						h: 0.4,
						sizing: { type: 'contain', w: 2.0, h: 0.4 }
					});

					// Add X mark overlay for don't example
					slide.addText('✕', {
						x: 6.3,
						y: 4.0,
						w: 0.3,
						h: 0.2,
						fontSize: 16,
						color: '#dc2626',
						bold: true,
						align: 'center',
						valign: 'middle'
					});
				} catch (error) {
					console.warn('Could not add logo examples to slide:', error);
				}
			}
		}

		// Text guidelines - removed to show only visual examples
		// No text guidelines will be shown, only visual examples

		// Technical Specifications - optimized positioning
		let yPos = 5.7;
		slide.addText('Technical Specifications', {
			x: layout.margin,
			y: 4.9,
			w: layout.contentWidth,
			h: 0.4,
			fontSize: 16,
			color: this.brandGuidelines.colors.core_palette[0]?.hex || '#000000',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		// Minimum sizes
		slide.addText('Minimum Sizes:', {
			x: layout.margin,
			y: 5.4,
			w: 4,
			h: 0.3,
			fontSize: 12,
			color: '#1f2937',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const minSizes =
			this.brandGuidelines.logo?.minimum_sizes ||
			[
				// Minimum sizes will be generated by AI
			];

		yPos = 5.7;
		minSizes.forEach((size, index) => {
			slide.addText(`• ${size}`, {
				x: layout.margin,
				y: yPos,
				w: 4,
				h: 0.2,
				fontSize: 10,
				color: this.brandGuidelines.colors.core_palette[1]?.hex || '#000000',
				fontFace: this.brandGuidelines.typography.supporting.name
			});
			yPos += 0.15;
		});

		// Clear space
		slide.addText('Clear Space:', {
			x: 5.5,
			y: 5.4,
			w: 4,
			h: 0.3,
			fontSize: 12,
			color: '#1f2937',
			bold: true,
			fontFace: this.brandGuidelines.typography.primary.name
		});

		const clearSpace = this.brandGuidelines.logo?.clear_space_method || '';
		slide.addText(clearSpace, {
			x: 5.5,
			y: 5.7,
			w: 4,
			h: 0.3,
			fontSize: 10,
			color: '#374151',
			fontFace: this.brandGuidelines.typography.supporting.name
		});
	}

	private async createThankYouSlide(): Promise<void> {
		const slide = this.pptx.addSlide();
		
		// Set dark background like the progressive generator
		slide.background = { color: '2C504D' };
		
		// Add "Thank You" text
		slide.addText('Thank You', {
			x: 1,
			y: 2.5,
			w: 8,
			h: 1,
			fontSize: 60,
			bold: true,
			color: 'FFFFFF',
			align: 'center'
		});
	}
}
