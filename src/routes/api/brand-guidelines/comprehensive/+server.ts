import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { generateComprehensiveBrandGuidelines } from '$lib/services/gemini';
import { PowerPointGenerator } from '$lib/services/powerpoint-generator';
import { AssetsGenerator } from '$lib/services/assets-generator';
import type { RequestHandler } from './$types';
import type { BrandGuidelinesInput } from '$lib/types/brand-guidelines';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const contentType = request.headers.get('content-type');
		const isJson = contentType?.includes('application/json');

		// Handle JSON requests from progressive generation
		if (isJson) {
			const jsonData = await request.json();
			
			console.log('Comprehensive endpoint - received JSON data:', {
				brand_name: jsonData.brand_name,
				brand_domain: jsonData.brand_domain,
				short_description: jsonData.short_description?.substring(0, 100),
				hasStepHistory: !!jsonData.stepHistory,
				stepHistoryLength: jsonData.stepHistory?.length || 0,
				logoFilesCount: jsonData.logo_files?.length || 0
			});
			
			// Validate required fields
			if (!jsonData.brand_name || !jsonData.brand_domain || !jsonData.short_description) {
				return json(
					{
						error: 'Missing required fields: brand_name, brand_domain, short_description'
					},
					{ status: 400 }
				);
			}

			// Create input object
			const input: BrandGuidelinesInput = {
				brand_name: jsonData.brand_name,
				brand_domain: jsonData.brand_domain,
				short_description: jsonData.short_description,
				logo_files: jsonData.logo_files || [],
				colors: jsonData.colors,
				typography: jsonData.typography,
				contact: jsonData.contact || {}
			};

			// Check if we have stepHistory from progressive generation
			let structuredDataToSave;
			let contentToSave;
			
			if (jsonData.stepHistory && Array.isArray(jsonData.stepHistory)) {
				console.log('Saving progressive generation with stepHistory:', {
					stepCount: jsonData.stepHistory.length,
					steps: jsonData.stepHistory.map((s: any) => s.step)
				});
				
				// Save the step history directly - this is what StepViewer will use
				structuredDataToSave = {
					stepHistory: jsonData.stepHistory,
					brand_name: input.brand_name,
					brand_domain: input.brand_domain,
					short_description: input.short_description,
					// Include all builder form inputs in structured data
					selectedMood: input.selectedMood,
					selectedAudience: input.selectedAudience,
					brandValues: input.brandValues,
					customPrompt: input.customPrompt,
					logo_files: input.logo_files,
					contact: input.contact
				};
				
				// For content, we can just create a simple text summary (NOT comprehensive generation!)
				contentToSave = `Progressive brand guidelines for ${input.brand_name} (${input.brand_domain})`;
				
				console.log('Progressive generation - skipping comprehensive AI generation, using step history directly');
			} else {
				console.log('No stepHistory found - generating comprehensive brand guidelines');
				// Generate comprehensive brand guidelines (legacy path)
				const brandGuidelinesSpec = await generateComprehensiveBrandGuidelines(input);
				structuredDataToSave = brandGuidelinesSpec;
				contentToSave = JSON.stringify(brandGuidelinesSpec);
			}

			// Extract all builder form inputs from the request
			const selectedMood = jsonData.selectedMood || jsonData.mood || null;
			const selectedAudience = jsonData.selectedAudience || jsonData.audience || null;
			const brandValues = jsonData.brandValues || null;
			const customPrompt = jsonData.customPrompt || null;
			
			// Build complete contact info object
			const contactInfo = {
				name: input.contact?.name || jsonData.contactName || '',
				email: input.contact?.email || jsonData.contactEmail || '',
				role: input.contact?.role || jsonData.contactRole || '',
				company: input.contact?.company || jsonData.contactCompany || input.brand_name || '',
				
			};
			
			// Save to database with all builder inputs
			const valuesToInsert = {
				userId: session.user.id,
				brandName: input.brand_name,
				content: contentToSave,
				// Builder form inputs
				brandDomain: input.brand_domain,
				shortDescription: input.short_description,
				brandValues: brandValues,
				mood: selectedMood,
				audience: selectedAudience,
				customPrompt: customPrompt,
				// Structured data
				structuredData: JSON.stringify(structuredDataToSave),
				logoFiles: JSON.stringify(input.logo_files),
				logoData: input.logo_files && input.logo_files.length > 0 ? (input.logo_files[0].file_data || (input.logo_files[0] as any).fileData) : null,
				colors: JSON.stringify(input.colors || []),
				typography: JSON.stringify(input.typography || {}),
				contactInfo: JSON.stringify(contactInfo),
				exportFiles: JSON.stringify([]) // Progressive doesn't generate export files initially
			};
			
			console.log('Inserting into database with values:', {
				userId: valuesToInsert.userId,
				brandName: valuesToInsert.brandName,
				contentLength: valuesToInsert.content.length,
				structuredDataLength: valuesToInsert.structuredData.length,
				logoFilesLength: valuesToInsert.logoFiles.length,
				logoDataLength: valuesToInsert.logoData ? valuesToInsert.logoData.length : 0,
				hasLogoData: !!valuesToInsert.logoData
			});
			
			// Check for extremely large data that might cause issues
			const totalDataSize = 
				valuesToInsert.content.length +
				valuesToInsert.structuredData.length +
				valuesToInsert.logoFiles.length +
				(valuesToInsert.logoData?.length || 0);
			
			console.log('Total data size to insert:', totalDataSize, 'bytes');
			
			if (totalDataSize > 10 * 1024 * 1024) { // 10MB warning
				console.warn('Warning: Data size is very large:', totalDataSize, 'bytes. This may cause performance issues.');
			}
			
			const savedGuidelines = await db
				.insert(brandGuidelines)
				.values(valuesToInsert)
				.returning();

			console.log('Successfully saved guidelines to database, ID:', savedGuidelines[0]?.id);

			return json({
				success: true,
				brandGuidelines: structuredDataToSave,
				savedGuidelines: savedGuidelines[0]
			});
		}

		// Handle FormData requests (original functionality)
		const formData = await request.formData();

		// Parse form data
		const brandName = formData.get('brandName') as string;
		const brandDomain = formData.get('brandDomain') as string;
		const shortDescription = formData.get('shortDescription') as string;
		const brandValuesForm = formData.get('brandValues') as string;
		const moodForm = formData.get('mood') as string;
		const audienceForm = formData.get('audience') as string;
		const customPromptForm = formData.get('customPrompt') as string;
		const contactName = formData.get('contactName') as string;
		const contactEmail = formData.get('contactEmail') as string;
		const contactRole = formData.get('contactRole') as string;
		const contactCompany = formData.get('contactCompany') as string;
		const website = formData.get('website') as string || '';
		const phone = formData.get('phone') as string || '';

		// Validate required fields
		if (!brandName || !brandDomain || !shortDescription) {
			return json(
				{
					error: 'Missing required fields: brandName, brandDomain, shortDescription'
				},
				{ status: 400 }
			);
		}

		// Handle logo files
		const logoFiles: Array<{
			filename: string;
			fileData: string;
			usageTag: string;
			fileSize: number;
			mimeType: string;
		}> = [];
		let logoData: string | null = null;
		const logoFile = formData.get('logo') as File;

		if (logoFile && logoFile.size > 0) {
			// Convert logo file to base64
			const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
			const base64Data = logoBuffer.toString('base64');
			const mimeType = logoFile.type;
			
			// Create data URL format
			const dataUrl = `data:${mimeType};base64,${base64Data}`;
			logoData = dataUrl;

			logoFiles.push({
				filename: logoFile.name,
				fileData: dataUrl,
				usageTag: 'primary',
				fileSize: logoFile.size,
				mimeType: mimeType
			});
		}

		// Parse colors if provided
		let colors: any[] = [];
		const colorsData = formData.get('colors') as string;
		if (colorsData) {
			try {
				colors = JSON.parse(colorsData);
			} catch (error) {
				console.warn('Failed to parse colors data:', error);
			}
		}

		// Parse typography if provided
		let typography: any = null;
		const typographyData = formData.get('typography') as string;
		if (typographyData) {
			try {
				typography = JSON.parse(typographyData);
			} catch (error) {
				console.warn('Failed to parse typography data:', error);
			}
		}

		// Extract all builder form inputs from formData (use form values or fallback to null)
		const selectedMood = moodForm || formData.get('selectedMood') as string || null;
		const selectedAudience = audienceForm || formData.get('selectedAudience') as string || null;
		const brandValues = brandValuesForm || null;
		const customPrompt = customPromptForm || null;
		
		// Create input object
		const input: BrandGuidelinesInput = {
			brand_name: brandName,
			brand_domain: brandDomain,
			short_description: shortDescription,
			// Include all builder form inputs
			selectedMood: selectedMood || undefined,
			selectedAudience: selectedAudience || undefined,
			brandValues: brandValues || undefined,
			customPrompt: customPrompt || undefined,
			logo_files: logoFiles.map((logo) => ({
				filename: logo.filename,
				usage_tag: logo.usageTag as 'primary' | 'icon' | 'lockup',
				file_data: logo.fileData,
				file_size: logo.fileSize
			})),
			colors: colors.length > 0 ? colors : undefined,
			typography: typography,
			contact: {
				name: contactName || '',
				email: contactEmail || '',
				role: contactRole || '',
				company: contactCompany || brandName
			}
		};

		// Generate comprehensive brand guidelines
		const brandGuidelinesSpec = await generateComprehensiveBrandGuidelines(input);

		// Build complete contact info object
		const contactInfo = {
			name: input.contact?.name || contactName || '',
			email: input.contact?.email || contactEmail || '',
			role: input.contact?.role || contactRole || '',
			company: input.contact?.company || contactCompany || brandName,
			website: website,
			phone: phone
		};
		
		// Save to database with all builder inputs
		const savedGuidelines = await db
			.insert(brandGuidelines)
			.values({
				userId: session.user.id,
				brandName: brandName,
				content: JSON.stringify(brandGuidelinesSpec), // Store as JSON string for backward compatibility
				// All builder form inputs
				brandValues: brandValues || null,
				industry: brandDomain, // Use brandDomain as industry for legacy compatibility
				mood: selectedMood || null,
				audience: selectedAudience || null,
				customPrompt: customPrompt || null,
				logoData: logoData,
				// New structured fields
				brandDomain: brandDomain,
				shortDescription: shortDescription,
				structuredData: JSON.stringify(brandGuidelinesSpec),
				logoFiles: JSON.stringify(logoFiles),
				colors: JSON.stringify(colors),
				typography: JSON.stringify(typography),
				contactInfo: JSON.stringify(contactInfo),
				exportFiles: JSON.stringify(brandGuidelinesSpec.export_files)
			})
			.returning();

		return json({
			success: true,
			brandGuidelines: brandGuidelinesSpec,
			savedGuidelines: savedGuidelines[0]
		});
	} catch (error) {
		console.error('Error generating comprehensive brand guidelines:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		console.error('Comprehensive API error details:', {
			message: errorMessage,
			stack: errorStack
		});
		
		return json(
			{
				error: 'Failed to generate comprehensive brand guidelines',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};
