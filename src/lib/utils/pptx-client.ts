/**
 * Client-side utility for exporting brand guidelines to PowerPoint
 */

export interface ExportPptxOptions {
	brandName?: string;
	brandDomain?: string;
	shortDescription?: string;
	brandValues?: string;
	selectedMood?: string;
	selectedAudience?: string;
	contactName?: string;
	contactEmail?: string;
	contactRole?: string;
	contactCompany?: string;
	stepHistory?: Array<{
		stepId: string;
		stepTitle: string;
		content: any;
		approved: boolean;
	}>;
	generatedSteps?: Array<{
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
		isApproved: boolean;
	}>;
	logoFiles?: Array<{
		filename: string;
		fileData?: string;
		usageTag: string;
	}>;
	structuredData?: any;
	useTemplate?: boolean; // Use detailed JSON template or simple layout
	useHtmlSlides?: boolean; // Use new HTML-based slide generation
}

/**
 * Download brand guidelines as PowerPoint presentation
 */
export async function downloadBrandGuidelinesPptx(
	options: ExportPptxOptions
): Promise<{ success: boolean; error?: string }> {
	try {
		// Use HTML-based slides if specified (new system)
		const endpoint = options.useHtmlSlides 
			? '/api/generate-slides-html' 
			: '/api/export-pptx-template';
		
		console.log(`🎨 Generating slides using: ${options.useHtmlSlides ? 'HTML templates' : 'legacy system'}`);
		console.log(`📍 Endpoint: ${endpoint}`);
		console.log(`📦 Options:`, {
			useHtmlSlides: options.useHtmlSlides,
			hasBrandName: !!options.brandName,
			hasGeneratedSteps: !!options.generatedSteps,
			stepsCount: options.generatedSteps?.length || 0
		});
		
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				brandName: options.brandName,
				brandDomain: options.brandDomain,
				shortDescription: options.shortDescription,
				brandValues: options.brandValues,
				selectedMood: options.selectedMood,
				selectedAudience: options.selectedAudience,
				contactName: options.contactName,
				contactEmail: options.contactEmail,
				contactRole: options.contactRole,
				contactCompany: options.contactCompany,
				stepHistory: options.stepHistory,
				generatedSteps: options.generatedSteps,
				logoFiles: options.logoFiles,
				structuredData: options.structuredData,
				useTemplate: options.useTemplate || false
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || errorData.details || 'Failed to generate PowerPoint');
		}

		// Get the blob
		const blob = await response.blob();

		// Create download link
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${options.brandName || 'brand'}-Brand-Guidelines.pptx`;
		document.body.appendChild(a);
		a.click();

		// Cleanup
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);

		console.log('✅ PPTX download successful');
		
		return { success: true };
	} catch (error: any) {
		console.error('❌ Error downloading PPTX:', error);
		return {
			success: false,
			error: error.message || 'Failed to download PowerPoint presentation'
		};
	}
}

/**
 * Download guidelines from history page
 */
export async function downloadGuidelinesFromHistory(
	guidelineId: string,
	structuredData: any,
	brandName: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// Parse structured data
		const data = typeof structuredData === 'string' 
			? JSON.parse(structuredData) 
			: structuredData;

		// Extract step history and other info
		const stepHistory = data.stepHistory || [];
		const logoFiles = data.logo_files || [];
		
		return await downloadBrandGuidelinesPptx({
			brandName: data.brand_name || brandName,
			brandDomain: data.brand_domain || '',
			shortDescription: data.short_description || '',
			stepHistory,
			logoFiles,
			useTemplate: true // Use exact template structure
		});
	} catch (error: any) {
		console.error('Error preparing history download:', error);
		return {
			success: false,
			error: error.message || 'Failed to prepare download'
		};
	}
}

