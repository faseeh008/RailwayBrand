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

			// Save to database
			const valuesToInsert = {
				userId: session.user.id,
				brandName: input.brand_name,
				content: contentToSave,
				brandDomain: input.brand_domain,
				shortDescription: input.short_description,
				structuredData: JSON.stringify(structuredDataToSave),
				logoFiles: JSON.stringify(input.logo_files),
				logoData: input.logo_files && input.logo_files.length > 0 ? input.logo_files[0].fileData || input.logo_files[0].file_data : null,
				colors: JSON.stringify(input.colors || []),
				typography: JSON.stringify(input.typography || {}),
				contactInfo: JSON.stringify(input.contact),
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
		const brandValues = formData.get('brandValues') as string;
		const mood = formData.get('mood') as string;
		const audience = formData.get('audience') as string;
		const customPrompt = formData.get('customPrompt') as string;
		const contactName = formData.get('contactName') as string;
		const contactEmail = formData.get('contactEmail') as string;
		const contactRole = formData.get('contactRole') as string;
		const contactCompany = formData.get('contactCompany') as string;

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

		// Create input object
		const input: BrandGuidelinesInput = {
			brand_name: brandName,
			brand_domain: brandDomain,
			short_description: shortDescription,
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
				role: contactRole,
				company: contactCompany || brandName
			}
		};

		// Generate comprehensive brand guidelines
		const brandGuidelinesSpec = await generateComprehensiveBrandGuidelines(input);

		// Save to database
		const savedGuidelines = await db
			.insert(brandGuidelines)
			.values({
				userId: session.user.id,
				brandName: brandName,
				content: JSON.stringify(brandGuidelinesSpec), // Store as JSON string for backward compatibility
				brandValues: brandValues,
				industry: brandDomain, // Use brandDomain as industry for legacy compatibility
				mood: mood,
				audience: audience,
				customPrompt: customPrompt,
				logoData: logoData,
				// New structured fields
				brandDomain: brandDomain,
				shortDescription: shortDescription,
				structuredData: JSON.stringify(brandGuidelinesSpec),
				logoFiles: JSON.stringify(logoFiles),
				colors: JSON.stringify(colors),
				typography: JSON.stringify(typography),
				contactInfo: JSON.stringify(input.contact),
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
