/**
 * API Endpoint: Generate Brand Guideline Slides (PDF)
 * 
 * This endpoint accepts brand data from the frontend and generates
 * a PDF using HTML slides rendered with Puppeteer
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import { buildFilledHtmlSlides } from '$lib/services/html-slide-generator.js';
import { adaptBrandDataForSlides, validateAdaptedData } from '$lib/services/brand-data-adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get the current session
		const session = await locals.auth();
		
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse request body
		const requestData = await request.json();
		
		console.log('📥 Received brand data for PDF generation', {
			brandName: requestData.brandName,
			hasStepHistory: !!requestData.stepHistory,
			stepsCount: requestData.stepHistory?.length || 0,
			hasSavedSlides: !!requestData.savedSlides,
			savedSlidesCount: requestData.savedSlides?.length || 0
		});
		
		let htmlSlides: Array<{ name: string; html: string }>;
		
		// Check if we have saved slides to use
		if (requestData.savedSlides && requestData.savedSlides.length > 0) {
			console.log('📋 Using saved slides for PDF generation');
			htmlSlides = requestData.savedSlides;
		} else {
			// Transform frontend data using the adapter
			const brandInput = adaptBrandDataForSlides({
				...requestData,
				generatedSteps: requestData.stepHistory || requestData.generatedSteps || []
			});
			
			// Validate adapted data
			const validation = validateAdaptedData(brandInput);
			if (!validation.valid) {
				console.error('❌ Validation failed:', validation.errors);
				return json({ 
					error: 'Validation failed', 
					details: validation.errors 
				}, { status: 400 });
			}
			
			console.log('✅ Brand data adapted and validated successfully');
			
			// Get template set from request (if provided)
			const templateSet = requestData.templateSet || undefined;
			console.log('🎨 Using template set:', templateSet || 'default (root)');
			
			// Generate HTML slides
			htmlSlides = buildFilledHtmlSlides(brandInput, templateSet);
			console.log(`📄 Generated ${htmlSlides.length} HTML slides`);
		}
		
		// Generate PDF using Puppeteer
		console.log('🖨️ Generating PDF with Puppeteer...');
		const pdfBuffer = await generatePdfFromHtmlSlidesMultiPage(htmlSlides);
		
		console.log(`✅ PDF generated successfully (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
		
		// Return the PDF file
		const brandName = requestData.brandName || 'Brand';
		// Convert Uint8Array to Buffer for Response
		const buffer = Buffer.from(pdfBuffer);
		return new Response(buffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${brandName.replace(/[^a-zA-Z0-9]/g, '-')}-Brand-Guidelines.pdf"`,
				'Content-Length': buffer.length.toString()
			}
		});
		
	} catch (error) {
		console.error('❌ Error generating PDF:', error);
		
		return json({
			error: 'Failed to generate PDF',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

/**
 * Generate PDF from HTML slides
 * Renders each slide individually then merges them using pdf-lib
 */
async function generatePdfFromHtmlSlidesMultiPage(
	slides: Array<{ name: string; html: string }>
): Promise<Uint8Array> {
	let browser;
	
	try {
		// Launch Puppeteer
		browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-gpu',
				'--disable-dev-shm-usage'
			]
		});
		
		const page = await browser.newPage();
		
		// Set viewport to match slide dimensions
		await page.setViewport({
			width: 1280,
			height: 720,
			deviceScaleFactor: 2
		});
		
		// Create PDF document for merging
		const finalPdf = await PDFDocument.create();
		
		// Generate each slide as a separate PDF, then merge them
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			console.log(`Converting slide ${i + 1}/${slides.length}: ${slide.name}`);
			
			// Load slide HTML - use domcontentloaded since we're using data URLs (no network requests)
			await page.setContent(slide.html, {
				waitUntil: 'domcontentloaded',
				timeout: 30000
			});
			
			// Wait for fonts and images to load
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Generate PDF for this slide
			const slidePdfBuffer = await page.pdf({
				width: '1280px',
				height: '720px',
				printBackground: true,
				displayHeaderFooter: false,
				margin: { top: '0', right: '0', bottom: '0', left: '0' },
				format: undefined
			});
			
			// Load this slide's PDF and copy pages to final PDF
			const slidePdf = await PDFDocument.load(slidePdfBuffer);
			const pages = await finalPdf.copyPages(slidePdf, slidePdf.getPageIndices());
			pages.forEach((page) => finalPdf.addPage(page));
			
			console.log(`✓ Slide ${i + 1} added to PDF`);
		}
		
		// Save and return the merged PDF
		const pdfBytes = await finalPdf.save();
		return new Uint8Array(pdfBytes);
		
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}
