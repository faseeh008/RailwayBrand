import PptxGenJS from 'pptxgenjs';
import { getLogoDataUrl } from '$lib/server/logo-file-utils';
async function resolveLogoImageData(logoFile: any): Promise<string | null> {
	if (!logoFile) return null;
	if (logoFile.fileData && typeof logoFile.fileData === 'string' && logoFile.fileData.startsWith('data:')) {
		return logoFile.fileData;
	}
	return getLogoDataUrl(logoFile);
}

// EMU to Inches conversion (1 inch = 914400 EMUs)
const EMU_TO_INCHES = 914400;

interface TemplateSlide {
	slide_number: number;
	shapes: TemplateShape[];
}

interface TemplateShape {
	type: string;
	position: { left: number; top: number };
	size: { width: number; height: number };
	text_frame?: Array<{
		text: string;
		alignment: string;
		runs: Array<{
			text: string;
			font: {
				name: string;
				size: number;
				bold?: boolean | null;
				italic?: boolean | null;
				underline?: boolean | null;
				color: string;
			};
		}>;
	}>;
}

interface BrandGuidelineData {
	brandName?: string;
	brandDomain?: string;
	shortDescription?: string;
	stepHistory?: Array<{
		step: string;
		content: string;
		approved: boolean;
	}>;
	logoFiles?: Array<{
		filename: string;
		fileData: string; // Base64 data URL
		usageTag: string;
	}>;
}

/**
 * Convert EMU units to inches
 */
function emuToInches(emu: number): number {
	return emu / EMU_TO_INCHES;
}

/**
 * Convert alignment string to PptxGenJS alignment
 */
function convertAlignment(alignment: string): any {
	const alignMap: Record<string, string> = {
		'LEFT (1)': 'left',
		'CENTER (2)': 'center',
		'RIGHT (3)': 'right',
		'JUSTIFY (4)': 'justify',
		'None': 'left'
	};
	return alignMap[alignment] || 'left';
}

/**
 * Convert hex color to PptxGenJS color format
 */
function convertColor(hexColor: string): string {
	return hexColor.replace('#', '');
}

/**
 * Parse markdown-style text from AI and convert to structured data
 */
function parseStepContent(stepId: string, content: string): any {
	// This function extracts structured information from AI-generated markdown
	const data: any = {};

	if (stepId === 'brand-positioning') {
		// Extract brand positioning content
		const positioningMatch = content.match(/\*\*Positioning Statement\*\*:?\s*([^\n]+)/i);
		const missionMatch = content.match(/\*\*Mission\*\*:?\s*([^\n]+)/i);
		const visionMatch = content.match(/\*\*Vision\*\*:?\s*([^\n]+)/i);
		
		data.positioning_statement = positioningMatch ? positioningMatch[1].trim() : '';
		data.mission = missionMatch ? missionMatch[1].trim() : '';
		data.vision = visionMatch ? visionMatch[1].trim() : '';
	} else if (stepId === 'color-palette') {
		// Extract colors
		const colorPattern = /([^-\n]+)\s*-\s*(#[0-9A-Fa-f]{6})\s*-\s*([^\n]+)/g;
		data.colors = [];
		let match;
		while ((match = colorPattern.exec(content)) !== null) {
			data.colors.push({
				name: match[1].trim(),
				hex: match[2].trim(),
				usage: match[3].trim()
			});
		}
	} else if (stepId === 'typography') {
		// Extract typography info
		const primaryFontMatch = content.match(/\*\*Primary Font\*\*:?\s*([^\n]+)/i);
		const secondaryFontMatch = content.match(/\*\*Secondary Font\*\*:?\s*([^\n]+)/i);
		
		data.primaryFont = primaryFontMatch ? primaryFontMatch[1].trim() : 'Arial';
		data.secondaryFont = secondaryFontMatch ? secondaryFontMatch[1].trim() : 'Times New Roman';
	}

	return data;
}

/**
 * Replace template placeholders with actual content
 */
function replacePlaceholders(text: string, data: BrandGuidelineData, stepData: any): string {
	let result = text;

	// Replace brand information
	if (data.brandName) {
		result = result.replace(/\{brand_name\}/gi, data.brandName);
		result = result.replace(/Timmerman Industries/gi, data.brandName);
		result = result.replace(/Your Brand/gi, data.brandName);
	}

	if (data.brandDomain) {
		result = result.replace(/\{brand_domain\}/gi, data.brandDomain);
	}

	if (data.shortDescription) {
		result = result.replace(/\{short_description\}/gi, data.shortDescription);
	}

	// Replace step-specific content
	if (stepData.positioning_statement) {
		result = result.replace(/Welcome to.*customers\./s, stepData.positioning_statement);
	}

	if (stepData.mission) {
		result = result.replace(/\{mission\}/gi, stepData.mission);
	}

	if (stepData.vision) {
		result = result.replace(/\{vision\}/gi, stepData.vision);
	}

	// Replace font names
	if (stepData.primaryFont) {
		result = result.replace(/Arimo Family/gi, `${stepData.primaryFont} Family`);
		result = result.replace(/Arimo \(/gi, `${stepData.primaryFont} (`);
	}

	return result;
}

/**
 * Generate PPTX from brand guidelines data and template
 */
export async function generateBrandGuidelinePptx(
	data: BrandGuidelineData,
	template: { slides: TemplateSlide[] }
): Promise<Buffer> {
	const pptx = new PptxGenJS();

	// Set presentation properties
	pptx.author = 'Brand Guidelines Generator';
	pptx.company = data.brandName || 'Your Brand';
	pptx.subject = 'Brand Guidelines';
	pptx.title = `${data.brandName || 'Brand'} Guidelines`;

	// Define slide master (16:9 aspect ratio)
	pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
	pptx.layout = 'LAYOUT_16x9';

	// Parse step history for content extraction
	const stepDataMap: Record<string, any> = {};
	if (data.stepHistory) {
		for (const historyItem of data.stepHistory) {
			stepDataMap[historyItem.step] = parseStepContent(historyItem.step, historyItem.content);
		}
	}

	// Process each slide from template
	for (const templateSlide of template.slides) {
		const slide = pptx.addSlide();

		// Process each shape in the slide
		for (const shape of templateSlide.shapes) {
			// Skip GroupShapes for now (they're complex containers)
			if (shape.type === 'GroupShape') {
				continue;
			}

			// Convert position and size from EMU to inches
			const position = {
				x: emuToInches(shape.position.left),
				y: emuToInches(shape.position.top),
				w: emuToInches(shape.size.width),
				h: emuToInches(shape.size.height)
			};

			// Add text shapes
			if (shape.text_frame && shape.text_frame.length > 0) {
				const textOptions: any = {
					x: position.x,
					y: position.y,
					w: position.w,
					h: position.h,
					valign: 'top',
					isTextBox: true
				};

				// Build text runs
				const textRuns: any[] = [];
				for (const frame of shape.text_frame) {
					if (frame.runs && frame.runs.length > 0) {
						for (const run of frame.runs) {
							let text = replacePlaceholders(run.text, data, stepDataMap);

							textRuns.push({
								text: text,
								options: {
									fontFace: run.font.name.replace(' Bold', ''),
									fontSize: run.font.size,
									bold: run.font.bold === true,
									italic: run.font.italic === true,
									underline: run.font.underline === true ? { style: 'sng' } : undefined,
									color: convertColor(run.font.color),
									align: convertAlignment(frame.alignment)
								}
							});
						}
					}
				}

				if (textRuns.length > 0) {
					slide.addText(textRuns, textOptions);
				}
			}
			// Add image shapes (placeholder for now)
			else if (position.w > 1 && position.h > 1 && shape.type === 'Shape') {
				// This might be an image placeholder
				// You can add logo here if it matches certain criteria
				if (templateSlide.slide_number === 1 && data.logoFiles && data.logoFiles.length > 0) {
					try {
						const logoFile = data.logoFiles[0];
						const logoImage = await resolveLogoImageData(logoFile);
						if (logoImage) {
							slide.addImage({
								data: logoImage,
								x: position.x,
								y: position.y,
								w: position.w,
								h: position.h,
								sizing: { type: 'contain', w: position.w, h: position.h }
							});
						}
					} catch (error) {
						console.error('Error adding logo:', error);
					}
				}
			}
		}
	}

	// Generate PPTX as buffer
	const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
	return buffer;
}

/**
 * Generate simplified PPTX with progressive content
 */
export async function generateProgressivePptx(
	data: BrandGuidelineData
): Promise<Buffer> {
	const pptx = new PptxGenJS();

	// Set presentation properties
	pptx.author = 'Brand Guidelines Generator';
	pptx.company = data.brandName || 'Your Brand';
	pptx.subject = 'Brand Guidelines';
	pptx.title = `${data.brandName || 'Brand'} Guidelines`;

	// Define slide master
	pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
	pptx.layout = 'LAYOUT_16x9';

	// Add title slide
	const titleSlide = pptx.addSlide();
	titleSlide.background = { color: '2C504D' };
	
	titleSlide.addText(data.brandName || 'Brand Guidelines', {
		x: 1,
		y: 2,
		w: 8,
		h: 1.5,
		fontSize: 60,
		bold: true,
		color: 'FFFFFF',
		align: 'center'
	});

	titleSlide.addText('BRAND GUIDELINES', {
		x: 1,
		y: 3.5,
		w: 8,
		h: 0.5,
		fontSize: 24,
		color: 'FFFFFF',
		align: 'center'
	});

	// Add logo if available
	if (data.logoFiles && data.logoFiles.length > 0) {
		const logoFile = data.logoFiles[0];
		const logoImage = await resolveLogoImageData(logoFile);
		if (logoImage) {
			try {
				titleSlide.addImage({
					data: logoImage,
					x: 4,
					y: 0.5,
					w: 2,
					h: 1.5,
					sizing: { type: 'contain', w: 2, h: 1.5 }
				});
			} catch (error) {
				console.error('Error adding logo to title:', error);
			}
		}
	}

	// Add content slides from step history
	if (data.stepHistory) {
		for (const step of data.stepHistory) {
			if (!step.approved || !step.content) continue;

			const slide = pptx.addSlide();
			slide.background = { color: 'FFFFFF' };

			// Add step title
			const stepTitles: Record<string, string> = {
				'brand-positioning': 'Brand Positioning',
				'logo-guidelines': 'Logo Guidelines',
				'color-palette': 'Color Palette',
				'typography': 'Typography',
				'iconography': 'Iconography',
				'photography': 'Photography',
				'applications': 'Brand Applications'
			};

			slide.addText(stepTitles[step.step] || step.step, {
				x: 0.5,
				y: 0.3,
				w: 9,
				h: 0.7,
				fontSize: 32,
				bold: true,
				color: '2C504D'
			});

			// Add content (simplified markdown rendering)
			const contentText = step.content
				.replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
				.replace(/\*/g, ''); // Remove italic markers

			slide.addText(contentText, {
				x: 0.5,
				y: 1.2,
				w: 9,
				h: 4,
				fontSize: 14,
				color: '252626',
				valign: 'top',
				isTextBox: true
			});
		}
	}

	// Add closing slide
	const closingSlide = pptx.addSlide();
	closingSlide.background = { color: '2C504D' };
	
	closingSlide.addText('Thank You', {
		x: 1,
		y: 2.5,
		w: 8,
		h: 1,
		fontSize: 60,
		bold: true,
		color: 'FFFFFF',
		align: 'center'
	});

	// Generate PPTX as buffer
	const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
	return buffer;
}

