// Commented out to avoid bundling in Vercel serverless functions (exceeds 250MB limit)
// Uncomment if deploying to a platform that supports larger bundles (e.g., Railway, Render)
// import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

/**
 * Convert HTML slides to PDF using Puppeteer
 */
export async function convertHtmlSlidesToPdf(
	slides: Array<{ name: string; html: string }>
): Promise<Buffer> {
	// Dynamic import to avoid bundling puppeteer in serverless functions
	const puppeteer = await import('puppeteer');
	let browser: typeof puppeteer.Browser | null = null;
	
	try {
		console.log('🚀 Launching Puppeteer browser...');
		
		browser = await puppeteer.default.launch({
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-gpu',
				'--disable-dev-shm-usage',
				'--disable-extensions',
				'--disable-background-timer-throttling',
				'--disable-backgrounding-occluded-windows',
				'--disable-renderer-backgrounding'
			]
		});
		
		const page = await browser.newPage();
		
		// Set a longer default timeout for the page
		page.setDefaultTimeout(60000); // 60 seconds
		page.setDefaultNavigationTimeout(60000);
		
		// Intercept requests to skip unnecessary resources (analytics, websockets, etc.)
		// This helps speed up loading and prevents timeout issues
		// Note: We allow fonts since slides may use custom fonts
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const resourceType = request.resourceType();
			const url = request.url();
			
			// Block only clearly unnecessary resources
			if (resourceType === 'websocket' ||
				url.includes('analytics') ||
				url.includes('tracking') ||
				url.includes('google-analytics') ||
				url.includes('gtag') ||
				url.includes('facebook.net')) {
				request.abort();
			} else {
				request.continue();
			}
		});
		
		// Set viewport to match slide dimensions (16:9 ratio)
		await page.setViewport({
			width: 1280,
			height: 720,
			deviceScaleFactor: 2
		});
		
		// Create a PDF with multiple pages, one per slide
		const pdfPages: Buffer[] = [];
		
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			
			console.log(`📄 Converting slide ${i + 1}/${slides.length}: ${slide.name}`);
			
			try {
				// Set HTML content with less strict wait condition
				// Use 'domcontentloaded' which fires when HTML is parsed (not waiting for all resources)
				await page.setContent(slide.html, {
					waitUntil: 'domcontentloaded', // Fires when HTML is parsed, before all resources load
					timeout: 60000 // Increased timeout to 60 seconds
				});
				
				// Wait for resources to load (images, fonts, stylesheets)
				// This gives time for embedded resources (base64 images, fonts) without blocking on network
				// Using a fixed wait time instead of waiting for network idle
				await new Promise(resolve => setTimeout(resolve, 3000));
				
				// Generate PDF for this slide
				const pdfBuffer = await page.pdf({
					format: 'A4',
					landscape: true, // 16:9 slides are landscape
					printBackground: true,
					margin: {
						top: '0px',
						right: '0px',
						bottom: '0px',
						left: '0px'
					}
				});
				
				pdfPages.push(Buffer.from(pdfBuffer));
				console.log(`✓ Successfully converted slide ${i + 1}`);
			} catch (slideError) {
				console.error(`❌ Error converting slide ${i + 1} (${slide.name}):`, slideError);
				// Continue with other slides instead of failing completely
				// You might want to add a blank page or error page instead
				throw new Error(`Failed to convert slide ${i + 1}: ${slideError instanceof Error ? slideError.message : 'Unknown error'}`);
			}
		}
		
		// Merge all PDF pages into a single document
		// Using pdf-lib to merge pages
		const mergedPdf = await PDFDocument.create();
		
		for (const pdfBuffer of pdfPages) {
			const pdfDoc = await PDFDocument.load(pdfBuffer);
			const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
			pages.forEach((page) => mergedPdf.addPage(page));
		}
		
		const finalPdfBytes = await mergedPdf.save();
		
		return Buffer.from(finalPdfBytes);
		
	} catch (error) {
		console.error('❌ Error converting slides to PDF:', error);
		throw error;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

