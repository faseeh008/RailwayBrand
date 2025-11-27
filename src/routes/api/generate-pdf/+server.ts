import { json, type RequestHandler } from '@sveltejs/kit';
import { convertHtmlSlidesToPdf } from '$lib/services/pdf-generator';
import { adaptBrandDataForSlides, validateAdaptedData } from '$lib/services/brand-data-adapter.js';
import { buildFilledHtmlSlides } from '$lib/services/html-slide-generator.js';
import { db, brandBuilderChats } from '$lib/db';
import { and, desc, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get the current session
		const session = await locals.auth();
		
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse request body
		const requestData = await request.json();
		await hydrateLogoFilesFromSnapshots(session.user.id, requestData);
		
		console.log('📥 Received request for PDF generation', {
			brandName: requestData.brandName,
			hasSavedSlides: !!requestData.savedSlides,
			savedSlidesCount: requestData.savedSlides?.length || 0,
			templateSet: requestData.templateSet
		});
		
		let slidesToConvert: Array<{ name: string; html: string }>;
		
		// Use saved slides if available, otherwise generate from brand data
		if (requestData.savedSlides && requestData.savedSlides.length > 0) {
			console.log('📋 Using saved slides for PDF generation');
			slidesToConvert = requestData.savedSlides;
		} else {
			console.log('🔄 Generating slides from brand data...');
			
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
			
			// Build HTML slides
			const templateSet = requestData.templateSet || undefined;
			slidesToConvert = buildFilledHtmlSlides(brandInput, templateSet);
		}
		
		console.log(`📄 Converting ${slidesToConvert.length} slides to PDF...`);
		
		// Convert HTML slides to PDF using Puppeteer
		const pdfBuffer = await convertHtmlSlidesToPdf(slidesToConvert);
		
		console.log(`✅ PDF generated successfully (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
		
		// Return the PDF file
		const brandName = requestData.brandName || 'Brand';
		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${brandName.replace(/[^a-zA-Z0-9]/g, '-')}-Brand-Guidelines.pdf"`,
				'Content-Length': pdfBuffer.length.toString()
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

async function hydrateLogoFilesFromSnapshots(userId: string, requestData: any): Promise<void> {
	if (requestData.logoFiles && requestData.logoFiles.length > 0) return;

	const logoFiles = await loadLogoFilesFromChatSnapshot(
		userId,
		requestData.chatId,
		requestData.brandName
	);

	if (logoFiles) {
		requestData.logoFiles = logoFiles;
	}
}

async function loadLogoFilesFromChatSnapshot(
	userId: string,
	chatId?: string,
	brandName?: string
): Promise<Array<{ filename: string; usageTag: string; fileData: string }> | null> {
	let query = db
		.select({ snapshot: brandBuilderChats.latestLogoSnapshot })
		.from(brandBuilderChats)
		.where(eq(brandBuilderChats.userId, userId))
		.limit(1);

	if (chatId) {
		query = db
			.select({ snapshot: brandBuilderChats.latestLogoSnapshot })
			.from(brandBuilderChats)
			.where(and(eq(brandBuilderChats.id, chatId), eq(brandBuilderChats.userId, userId)))
			.limit(1);
	} else if (brandName) {
		query = db
			.select({ snapshot: brandBuilderChats.latestLogoSnapshot })
			.from(brandBuilderChats)
			.where(and(eq(brandBuilderChats.userId, userId), eq(brandBuilderChats.brandName, brandName)))
			.orderBy(desc(brandBuilderChats.updatedAt))
			.limit(1);
	}

	const rows = await query;
	const snapshotRaw = rows?.[0]?.snapshot;
	if (!snapshotRaw) return null;

	try {
		const parsed = JSON.parse(snapshotRaw);
		const fileUrl = parsed.fileUrl || parsed.data || null;
		if (!fileUrl) return null;
		return [
			{
				filename: parsed.filename || 'logo.svg',
				usageTag: 'primary',
				fileData: fileUrl,
				fileUrl,
				storageId: parsed.assetId || parsed.storageId
			}
		];
	} catch (error) {
		console.warn('Failed to parse logo snapshot', error);
		return null;
	}
}

