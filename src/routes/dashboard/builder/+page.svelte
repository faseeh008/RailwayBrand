<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Upload,
		Download,
		Eye,
		Palette,
		Type,
		MessageCircle,
		Loader2,
		CheckCircle,
		AlertCircle,
		History,
		Edit3,
		Save,
		X,
		Trash2,
		FileText,
		Zap,
		FileDown
	} from 'lucide-svelte';
	import { mockMoodOptions, mockTargetAudiences } from '$lib/data/mock-data';
	import type { BrandGuidelineResponse } from '$lib/services/gemini';
	import type { BrandGuidelinesSpec } from '$lib/types/brand-guidelines';
	import { goto } from '$app/navigation';
	import { exportAsPDF, exportAsText, type ExportOptions } from '$lib/utils/export';
	import { downloadBrandGuidelinesPptx } from '$lib/utils/pptx-client';
	import ProgressiveGenerator from '$lib/components/ProgressiveGenerator.svelte';

	// Form fields
	let brandName = '';
	let brandDomain = '';
	let shortDescription = '';
	let brandValues = '';
	let selectedMood = '';
	let selectedAudience = '';
	let customPrompt = '';
	let contactName = '';
	let contactEmail = '';
	let contactRole = '';
	let contactCompany = '';

	// UI state
	let logoFile: File | null = null;
	let logoPreview: string | null = null;
	let logoFiles: Array<{ filename: string; filePath: string; usageTag: string; fileData?: string }> = [];
	let showGuidelines = false;
	let comprehensiveGuidelines: BrandGuidelinesSpec | null = null;
	let errorMessage = '';

	// Progressive generation state
	let showProgressiveGenerator = false;
	let savedGuidelineId: string | null = null;
	let savedLogoPath: string | null = null;
	let progressiveStepHistory: Array<{ step: string; content: string; approved: boolean }> = [];

	// Expanded domain options (consolidated from both fields)
	const domainOptions = [
		'SaaS',
		'Fintech',
		'Healthcare',
		'Ecommerce',
		'Retail',
		'Technology & Software',
		'Education & Learning',
		'Food & Beverage',
		'Fashion & Luxury',
		'Real Estate',
		'Consulting & Professional Services',
		'Non-profit & Social Impact',
		'Finance & Banking',
		'Healthcare & Medical',
		'Manufacturing & Industrial',
		'Travel & Hospitality',
		'Entertainment & Media',
		'Automotive',
		'Energy & Utilities',
		'Legal Services',
		'Marketing & Advertising',
		'Sports & Fitness',
		'Beauty & Personal Care',
		'Creative Agency & Design'
	];

	async function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];

			// Validate file type
			if (!file.type.startsWith('image/')) {
				errorMessage = 'Please select a valid image file for the logo.';
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				errorMessage = 'Logo file size must be less than 5MB.';
				return;
			}

			logoFile = file;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				logoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);

			// Upload file to server
			try {
				const formData = new FormData();
				formData.append('logo', file);

				const response = await fetch('/api/upload-logo', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					const result = await response.json();

					// Populate logoFiles array with server response
					logoFiles = [
						{
							filename: result.filename,
							filePath: result.filePath,
							fileData: result.fileData, // Base64 data URL
							usageTag: 'primary'
						}
					];

					// Store the base64 data for later use
					savedLogoPath = result.fileData;

					errorMessage = '';
				} else {
					const error = await response.json();
					errorMessage = error.error || 'Failed to upload logo';
				}
			} catch (error) {
				console.error('Logo upload error:', error);
				errorMessage = 'Failed to upload logo. Please try again.';
			}
		}
	}

	function removeLogo() {
		logoFile = null;
		logoPreview = null;
		logoFiles = [];
		savedLogoPath = null;
		// Clear the file input
		const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function resetForm() {
		// Reset all form fields
		brandName = '';
		brandDomain = '';
		shortDescription = '';
		brandValues = '';
		selectedMood = '';
		selectedAudience = '';
		customPrompt = '';
		contactName = '';
		contactEmail = '';
		contactRole = '';
		contactCompany = '';
		
		// Reset state
		removeLogo();
		showGuidelines = false;
		showProgressiveGenerator = false;
		comprehensiveGuidelines = null;
		errorMessage = '';
		savedGuidelineId = null;
		savedLogoPath = null;
		progressiveStepHistory = [];
	}

	function exportAsPDFFile() {
		let brandNameForExport = brandName;
		let contentForExport = '';

		if (comprehensiveGuidelines) {
			brandNameForExport = comprehensiveGuidelines.brand_name;
			contentForExport = formatStructuredDataToContent(comprehensiveGuidelines);
		} else {
			// Use form data to create basic content
			contentForExport = `# Brand Guidelines for ${brandName}

## Brand Overview
**Domain:** ${brandDomain}
**Description:** ${shortDescription}
**Values:** ${brandValues}

## Brand Positioning
**Domain:** ${brandDomain}
**Mood:** ${selectedMood}
**Target Audience:** ${selectedAudience}

## Contact Information
**Name:** ${contactName}
**Email:** ${contactEmail}
**Role:** ${contactRole}
**Company:** ${contactCompany}

## Additional Details
${customPrompt}`;
		}

		const exportOptions: ExportOptions = {
			brandName: brandNameForExport,
			content: contentForExport,
			includeMetadata: true,
			metadata: {
				industry: brandDomain || undefined,
				mood: selectedMood || undefined,
				audience: selectedAudience || undefined,
				createdAt: new Date()
			},
			logoPath: logoPreview || undefined
		};

		exportAsPDF(exportOptions);
	}

	function exportAsTextFile() {
		let brandNameForExport = brandName;
		let contentForExport = '';

		if (comprehensiveGuidelines) {
			brandNameForExport = comprehensiveGuidelines.brand_name;
			contentForExport = formatStructuredDataToContent(comprehensiveGuidelines);
		} else {
			// Use form data to create basic content
			contentForExport = `# Brand Guidelines for ${brandName}

## Brand Overview
**Domain:** ${brandDomain}
**Description:** ${shortDescription}
**Values:** ${brandValues}

## Brand Positioning
**Domain:** ${brandDomain}
**Mood:** ${selectedMood}
**Target Audience:** ${selectedAudience}

## Contact Information
**Name:** ${contactName}
**Email:** ${contactEmail}
**Role:** ${contactRole}
**Company:** ${contactCompany}

## Additional Details
${customPrompt}`;
		}

		const exportOptions: ExportOptions = {
			brandName: brandNameForExport,
			content: contentForExport,
			includeMetadata: true,
			metadata: {
				industry: brandDomain || undefined,
				mood: selectedMood || undefined,
				audience: selectedAudience || undefined,
				createdAt: new Date()
			},
			logoPath: logoPreview || undefined
		};

		exportAsText(exportOptions);
	}

	async function exportAsPPT() {
		isExportingPPT = true;
		errorMessage = '';

		try {
			let response;

			if (savedGuidelineId) {
				// Use saved guidelines ID for export
				const formData = new FormData();
				formData.append('guidelineId', savedGuidelineId);

				response = await fetch('/api/export-pptx', {
					method: 'POST',
					body: formData
				});
			} else {
				// Use current form data for export
				const formData = new FormData();
				formData.append('brandName', brandName);
				formData.append('brandDomain', brandDomain);
				formData.append('shortDescription', shortDescription);
				formData.append('brandValues', brandValues);
				formData.append('industry', selectedIndustry);
				formData.append('mood', selectedMood);
				formData.append('audience', selectedAudience);
				formData.append('customPrompt', customPrompt);
				formData.append('contactName', contactName);
				formData.append('contactEmail', contactEmail);
				formData.append('contactRole', contactRole);
				formData.append('contactCompany', contactCompany);

				// Add logo file if present
				if (logoFile) {
					formData.append('logo', logoFile);
				}

				response = await fetch('/api/export-pptx', {
					method: 'POST',
					body: formData
				});
			}

			if (response.ok) {
				// Get the filename from the Content-Disposition header
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename =
					contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
					`${brandName}_Brand_Guidelines.pptx`;

				// Create a blob and download it
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				errorMessage = '';
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Failed to generate PowerPoint presentation';
			}
		} catch (error) {
			console.error('Error exporting PPT:', error);
			errorMessage = 'Failed to generate PowerPoint presentation';
		} finally {
			isExportingPPT = false;
		}
	}

	function handleProgressiveGeneration() {
		// Validate required fields for progressive generation
		if (!brandName || !brandDomain || !shortDescription) {
			errorMessage =
				'Please fill in Brand Name, Brand Domain, and Short Description to start progressive generation.';
			return;
		}

		showProgressiveGenerator = true;
		showGuidelines = false;
		errorMessage = '';
	}

	function handleProgressiveComplete(data: {
		stepHistory: Array<{ step: string; content: string; approved: boolean }>;
		brandInput: any;
		logoFiles: any[];
		completeGuidelines: BrandGuidelinesSpec;
		savedGuidelines?: any;
	}) {
		// Store the step history content for display
		comprehensiveGuidelines = data.completeGuidelines;
		// Store step history for custom display
		progressiveStepHistory = data.stepHistory;
		
		// Store MINIMAL data for preview page (avoid sessionStorage quota issues)
		const previewData = {
			brandName,
			brandDomain,
			shortDescription,
			stepHistory: data.stepHistory, // Only text content, no base64 logos
			// Remove logoFiles - contains large base64 data, will be fetched from DB
			// logoFiles: logoFiles,
			brandInput: data.brandInput,
			guidelineId: data.savedGuidelines?.id // Store just the ID for fetching from DB
		};
		
		try {
			sessionStorage.setItem('preview_brand_data', JSON.stringify(previewData));
		} catch (error: any) {
			// If quota exceeded, try without stepHistory
			console.error('SessionStorage quota exceeded, trying minimal data:', error);
			const minimalData = {
				brandName,
				brandDomain,
				guidelineId: data.savedGuidelines?.id
			};
			sessionStorage.setItem('preview_brand_data', JSON.stringify(minimalData));
		}
		
        // Redirect to new HTML-based preview page
        goto('/dashboard/preview-html');
	}

	async function handleDownloadPptx() {
		try {
			const result = await downloadBrandGuidelinesPptx({
				brandName,
				brandDomain,
				shortDescription,
				brandValues,
				selectedMood,
				selectedAudience,
				contactName,
				contactEmail,
				contactRole,
				contactCompany,
				stepHistory: progressiveStepHistory,
				generatedSteps: progressiveStepHistory, // Pass generated steps for new system
				logoFiles: logoFiles,
				structuredData: lastGeneratedStructuredData,
				useHtmlSlides: true, // 🎨 Use new HTML-based slide system
				useTemplate: false // Not using old template
			});

			if (!result.success) {
				errorMessage = result.error || 'Failed to download PowerPoint';
			} else {
				successMessage = 'PowerPoint presentation downloaded successfully!';
				setTimeout(() => successMessage = '', 3000);
			}
		} catch (error: any) {
			console.error('Error downloading PowerPoint:', error);
			errorMessage = 'Failed to download PowerPoint presentation';
		}
	}

	async function exportAssetsZip() {
		isExportingAssets = true;
		errorMessage = '';

		try {
			const formData = new FormData();

			if (savedGuidelineId) {
				formData.append('guidelineId', savedGuidelineId);
			} else {
				// Use current form data for export
				formData.append('brandName', brandName);
				formData.append('brandDomain', brandDomain);
				formData.append('shortDescription', shortDescription);
				formData.append('brandValues', brandValues);
				formData.append('industry', brandDomain); // Use brandDomain as industry for legacy compatibility
				formData.append('mood', selectedMood);
				formData.append('audience', selectedAudience);
				formData.append('customPrompt', customPrompt);
				formData.append('contactName', contactName);
				formData.append('contactEmail', contactEmail);
				formData.append('contactRole', contactRole);
				formData.append('contactCompany', contactCompany);

				if (logoFile) {
					formData.append('logo', logoFile);
				}
			}

			const response = await fetch('/api/export-assets', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename =
					contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || `${brandName}_assets.zip`;

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				errorMessage = '';
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Failed to generate assets ZIP';
			}
		} catch (error) {
			console.error('Error exporting assets:', error);
			errorMessage = 'Failed to generate assets ZIP';
		} finally {
			isExportingAssets = false;
		}
	}

	async function downloadJSON() {
		if (comprehensiveGuidelines) {
			const jsonString = JSON.stringify(comprehensiveGuidelines, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${brandName}_brand_guidelines.json`;
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			document.body.removeChild(a);
		}
	}


	function goToHistory() {
		goto('/dashboard/history');
	}

	function handleSlideExport(format: string, editedData?: BrandGuidelinesSpec) {
		// Update the comprehensive guidelines with any edits made in slides
		if (editedData && comprehensiveGuidelines) {
			comprehensiveGuidelines = { ...comprehensiveGuidelines, ...editedData };
		}

		if (format === 'pdf') {
			exportAsPDFFile();
		} else if (format === 'pptx') {
			exportAsPPT();
		}
	}

	function convertToStructuredFormat(
		simpleGuidelines: BrandGuidelineResponse
	): BrandGuidelinesSpec {
		// Convert simple guidelines to structured format for slide viewer - all content AI-generated
		return {
			brand_name: getBrandName(simpleGuidelines),
			brand_domain: brandDomain || '',
			short_description: shortDescription || '',
			positioning_statement: '',
			vision: '',
			mission: '',
			values: brandValues ? brandValues.split(',').map((v) => v.trim()) : [],
			target_audience: selectedAudience || '',
			differentiation: '',
			voice_and_tone: {
				adjectives: [],
				guidelines: '',
				sample_lines: []
			},
			brand_personality: {
				identity: '',
				language: '',
				voice: '',
				characteristics: [],
				motivation: '',
				fear: ''
			},
			logo: {
				primary: '',
				variants: [],
				color_versions: [],
				clear_space_method: '',
				minimum_sizes: [],
				correct_usage: [],
				incorrect_usage: []
			},
			colors: {
				core_palette: [],
				secondary_palette: []
			},
			typography: {
				primary: {
					name: '',
					weights: [],
					usage: '',
					fallback_suggestions: [],
					web_link: ''
				},
				supporting: {
					name: '',
					weights: [],
					usage: '',
					fallback_suggestions: [],
					web_link: ''
				},
				secondary: []
			},
			iconography: {
				style: '',
				grid: '',
				stroke: '',
				color_usage: '',
				notes: ''
			},
			patterns_gradients: [],
			photography: {
				mood: [],
				guidelines: '',
				examples: []
			},
			applications: [],
			dos_and_donts: [],
			legal_contact: {
				contact_name: contactName || '',
				title: contactRole || '',
				email: contactEmail || '',
				company: contactCompany || '',
				address: '',
				website: ''
			},
			export_files: {
				pptx: `${getBrandName(simpleGuidelines)}_Brand_Guidelines.pptx`,
				assets_zip: `${getBrandName(simpleGuidelines)}_assets.zip`,
				json: `${getBrandName(simpleGuidelines)}_brand_guidelines.json`
			},
			created_at: new Date().toISOString(),
			version: '1.0'
		};
	}

	function formatBrandGuidelines(content: string, logoPath?: string | null): string {
		let formatted = content
			// Convert markdown images to HTML img tags FIRST
			.replace(
				/!\[([^\]]*)\]\(([^)]+)\)/g,
				'<div class="my-6 flex justify-center"><img src="$2" alt="$1" class="max-h-32 max-w-full object-contain" /></div>'
			)
			// Convert markdown headers to HTML
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
			// Convert bold text (remove asterisks and make bold)
			.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
			.replace(/\*(.*?)\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
			// Convert bullet points
			.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
			.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
			// Wrap consecutive list items in ul tags
			.replace(
				/(<li class="ml-4 mb-1">.*<\/li>)/gs,
				'<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>'
			)
			// Convert line breaks to paragraphs
			.replace(/\n\n/g, '</p><p class="mb-4">')
			.replace(/\n/g, '<br>')
			// Wrap in paragraph tags
			.replace(/^(.*)$/gm, '<p class="mb-4">$1</p>')
			// Clean up empty paragraphs
			.replace(/<p class="mb-4"><\/p>/g, '')
			// Clean up paragraphs that only contain HTML tags
			.replace(/<p class="mb-4">(<[^>]+>)<\/p>/g, '$1')
			// Clean up paragraphs that contain list items
			.replace(/<p class="mb-4">(<ul[^>]*>.*<\/ul>)<\/p>/g, '$1')
			// Clean up paragraphs that contain headers
			.replace(/<p class="mb-4">(<h[1-6][^>]*>.*<\/h[1-6]>)<\/p>/g, '$1')
			// Clean up paragraphs that contain images
			.replace(/<p class="mb-4">(<img[^>]*>)<\/p>/g, '$1');

		// Add logo visualization
		formatted = addLogoVisualization(formatted, logoPath);

		// Add color palette visualization
		formatted = addColorPaletteVisualization(formatted);

		// Add typography visualization
		formatted = addTypographyVisualization(formatted);

		return formatted;
	}

	function addLogoVisualization(content: string, logoPath: string | null): string {
		if (!logoPath) return content;

		// First, check if logo is already in the content (AI included it as markdown or HTML)
		if (content.includes(logoPath) || content.includes(`src="${logoPath}"`)) {
			return content; // Logo is already there, no need to add it
		}

		// Look for any logo-related sections (Logo Guidelines, Logo, Brand Logo, etc.)
		const logoSectionMatch = content.match(/(<h[2-3][^>]*>.*[Ll]ogo.*<\/h[2-3]>.*?)(<h[1-3]|$)/gs);

		if (logoSectionMatch) {
			// Add logo to existing logo section
			return content.replace(
				/(<h[2-3][^>]*>.*[Ll]ogo.*<\/h[2-3]>.*?)(<h[1-3]|$)/gs,
				(match, logoSection, nextSection) => {
					// Create simple centered logo display
					const logoDisplay = `
						<div class="my-6 flex justify-center">
							<img 
								src="${logoPath}" 
								alt="Brand Logo" 
								class="max-h-20 max-w-64 object-contain"
							/>
						</div>
					`;

					// Insert logo after the header but before the content
					return (
						logoSection.replace(/(<h[2-3][^>]*>.*<\/h[2-3]>)/, `$1${logoDisplay}`) + nextSection
					);
				}
			);
		} else {
			// No logo section found, add a new one at the beginning
			const logoSection = `
				<div class="mt-6 mb-6">
					<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3">Logo Guidelines</h3>
					<div class="my-6 flex justify-center">
						<img 
							src="${logoPath}" 
							alt="Brand Logo" 
							class="max-h-20 max-w-64 object-contain"
						/>
					</div>
				</div>
			`;

			// Add at the beginning of the content
			return logoSection + content;
		}
	}

	function addColorPaletteVisualization(content: string): string {
		// Look for color palette sections and add visual swatches
		return content.replace(
			/(<h[2-3][^>]*>.*[Cc]olor.*[Pp]alette.*<\/h[2-3]>.*?)(<h[2-3]|$)/gs,
			(match, colorSection, nextSection) => {
				// Extract hex codes from the content
				const hexMatches = colorSection.match(/#[0-9A-Fa-f]{6}/g);
				if (!hexMatches || hexMatches.length === 0) return match;

				// Create color swatches
				const colorSwatches = hexMatches
					.map((hex) => {
						const colorName = getColorName(hex);
						return `
						<div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
							<div class="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm" style="background-color: ${hex}"></div>
							<div>
								<div class="font-semibold text-gray-900">${colorName}</div>
								<div class="text-sm text-gray-600 font-mono">${hex.toUpperCase()}</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					colorSection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-gray-900 mb-3">Color Swatches</h4>${colorSwatches}</div>`
					) + nextSection
				);
			}
		);
	}

	function addTypographyVisualization(content: string): string {
		// Look for typography sections and add font showcase
		return content.replace(
			/(<h[2-3][^>]*>.*[Tt]ypography.*<\/h[2-3]>.*?)(<h[2-3]|$)/gs,
			(match, typographySection, nextSection) => {
				// Extract font names from the content
				const fontMatches = typographySection.match(/([A-Za-z\s]+)(?:\s*\([^)]*\))?/g);
				const fonts =
					fontMatches
						?.filter(
							(font) =>
								font.length > 3 &&
								font.length < 30 &&
								!font.includes('font') &&
								!font.includes('size') &&
								!font.includes('weight')
						)
						.slice(0, 2) || [];

				if (fonts.length === 0) return match;

				// Create typography showcase
				const typographyShowcase = fonts
					.map((font) => {
						const cleanFont = font.trim();
						return `
						<div class="mb-6 p-4 bg-gray-50 rounded-lg">
							<div class="mb-3">
								<h4 class="text-lg font-semibold text-gray-900 mb-2">${cleanFont}</h4>
								<p class="text-sm text-gray-600">Primary Font</p>
							</div>
							<div class="space-y-2">
								<div class="text-2xl font-bold text-gray-900" style="font-family: '${cleanFont}', serif;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
								<div class="text-lg text-gray-700" style="font-family: '${cleanFont}', serif;">abcdefghijklmnopqrstuvwxyz</div>
								<div class="text-lg text-gray-700" style="font-family: '${cleanFont}', serif;">1234567890 !@#$%^&*()</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					typographySection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-gray-900 mb-3">Font Showcase</h4>${typographyShowcase}</div>`
					) + nextSection
				);
			}
		);
	}

	function getColorName(hex: string): string {
		const colorMap: { [key: string]: string } = {
			'#FFA500': 'Orange',
			'#007FFF': 'Blue',
			'#90EE90': 'Green',
			'#FFD700': 'Yellow',
			'#F5F5F5': 'Off-White',
			'#FF0000': 'Red',
			'#800080': 'Purple',
			'#000000': 'Black',
			'#FFFFFF': 'White',
			'#808080': 'Gray'
		};
		return colorMap[hex.toUpperCase()] || `Color ${hex.toUpperCase()}`;
	}

	function getBrandName(brandGuidelines: any): string {
		if (brandGuidelines.structuredData) {
			const structuredData = JSON.parse(brandGuidelines.structuredData);
			return structuredData.brand_name || brandGuidelines.brandName;
		}
		return brandGuidelines.brandName;
	}

	function getBrandContent(brandGuidelines: any): string {
		if (brandGuidelines.structuredData) {
			const structuredData = JSON.parse(brandGuidelines.structuredData);
			return formatStructuredDataToContent(structuredData);
		}
		return brandGuidelines.content;
	}

	function formatStructuredDataToContent(data: any): string {
		let content = `# Brand Guidelines for ${data.brand_name}\n\n`;

		// Brand Overview
		content += `## Brand Overview\n`;
		content += `**Domain:** ${data.brand_domain}\n`;
		content += `**Description:** ${data.short_description}\n`;
		content += `**Positioning:** ${data.positioning_statement}\n\n`;

		// Vision & Mission
		if (data.vision) content += `**Vision:** ${data.vision}\n`;
		if (data.mission) content += `**Mission:** ${data.mission}\n`;
		if (data.values && Array.isArray(data.values) && data.values.length > 0) {
			content += `**Values:** ${data.values.join(', ')}\n`;
		}
		content += `\n`;

		// Voice & Tone
		if (data.voice_and_tone) {
			content += `## Voice & Tone\n`;
			if (
				data.voice_and_tone.adjectives &&
				Array.isArray(data.voice_and_tone.adjectives) &&
				data.voice_and_tone.adjectives.length > 0
			) {
				content += `**Personality Traits:** ${data.voice_and_tone.adjectives.join(', ')}\n`;
			}
			if (data.voice_and_tone.guidelines) {
				content += `**Communication Style:** ${data.voice_and_tone.guidelines}\n`;
			}
			if (
				data.voice_and_tone.sample_lines &&
				Array.isArray(data.voice_and_tone.sample_lines) &&
				data.voice_and_tone.sample_lines.length > 0
			) {
				content += `**Sample Messages:**\n`;
				data.voice_and_tone.sample_lines.forEach((line: string) => {
					content += `- ${line}\n`;
				});
			}
			content += `\n`;
		}

		// Colors
		if (
			data.colors &&
			data.colors.core_palette &&
			Array.isArray(data.colors.core_palette) &&
			data.colors.core_palette.length > 0
		) {
			content += `## Color Palette\n`;
			data.colors.core_palette.forEach((color: any) => {
				content += `**${color.name}:** ${color.hex} (${color.usage})\n`;
			});
			if (
				data.colors.secondary_palette &&
				Array.isArray(data.colors.secondary_palette) &&
				data.colors.secondary_palette.length > 0
			) {
				content += `\n**Secondary Colors:**\n`;
				data.colors.secondary_palette.forEach((color: any) => {
					content += `**${color.name}:** ${color.hex} (${color.usage})\n`;
				});
			}
			content += `\n`;
		}

		// Typography
		if (data.typography) {
			content += `## Typography\n`;
			if (data.typography.primary) {
				content += `**Primary Font:** ${data.typography.primary.name}\n`;
				content += `**Usage:** ${data.typography.primary.usage}\n`;
				if (data.typography.primary.weights && Array.isArray(data.typography.primary.weights)) {
					content += `**Weights:** ${data.typography.primary.weights.join(', ')}\n`;
				}
			}
			if (data.typography.supporting) {
				content += `**Supporting Font:** ${data.typography.supporting.name}\n`;
				content += `**Usage:** ${data.typography.supporting.usage}\n`;
			}
			content += `\n`;
		}

		// Logo
		if (data.logo) {
			content += `## Logo Guidelines\n`;
			content += `**Primary Logo:** ${data.logo.primary}\n`;
			if (
				data.logo.variants &&
				Array.isArray(data.logo.variants) &&
				data.logo.variants.length > 0
			) {
				content += `**Variants:** ${data.logo.variants.join(', ')}\n`;
			}
			if (data.logo.clear_space_method) {
				content += `**Clear Space:** ${data.logo.clear_space_method}\n`;
			}
			content += `\n`;
		}

		// Applications
		if (data.applications && Array.isArray(data.applications) && data.applications.length > 0) {
			content += `## Application Examples\n`;
			data.applications.forEach((app: any) => {
				content += `**${app.context}:** ${app.description}\n`;
				if (app.layout_notes && Array.isArray(app.layout_notes) && app.layout_notes.length > 0) {
					content += `- ${app.layout_notes.join('\n- ')}\n`;
				}
				content += `\n`;
			});
		}

		// Do's and Don'ts
		if (data.dos_and_donts && Array.isArray(data.dos_and_donts) && data.dos_and_donts.length > 0) {
			content += `## Do's and Don'ts\n`;
			data.dos_and_donts.forEach((item: any) => {
				content += `- ${item.description}\n`;
			});
			content += `\n`;
		}

		return content;
	}

	function startEditing() {
		if (brandGuidelines && savedGuidelineId) {
			isEditing = true;
			editedContent = getBrandContent(brandGuidelines);
			editedBrandName = getBrandName(brandGuidelines);
		}
	}

	function cancelEditing() {
		isEditing = false;
		editedContent = '';
		editedBrandName = '';
	}

	async function saveChanges() {
		if (!savedGuidelineId) {
			errorMessage = 'No guideline to save';
			return;
		}

		try {
			const response = await fetch(`/api/brand-guidelines/${savedGuidelineId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: editedContent,
					brandName: editedBrandName
				})
			});

			const result = await response.json();

			if (result.success) {
				// Update the displayed guidelines
				brandGuidelines = {
					content: editedContent,
					brandName: editedBrandName
				};
				isEditing = false;
				errorMessage = '';
			} else {
				errorMessage = result.error || 'Failed to save changes';
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			errorMessage = 'Failed to save changes';
		}
	}
</script>

<div class="max-w-6xl">
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Brand Builder</h1>
				<p class="text-gray-600">Create brand guidelines step-by-step with AI assistance</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" onclick={goToHistory}>
					<History class="mr-2 h-4 w-4" />
					View History
				</Button>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Form Section -->
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Zap class="h-5 w-5 text-blue-600" />
						Brand Information
					</CardTitle>
					<CardDescription>
						Provide detailed brand information for AI-powered progressive guidelines generation
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-6">
							<!-- Brand Identity Section -->
							<div class="space-y-4">
								<div class="mb-3 flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-blue-600"></div>
									<h3 class="text-lg font-semibold text-gray-900">Brand Identity</h3>
								</div>

								<div class="space-y-2">
									<Label for="brand-name">Brand Name *</Label>
									<Input
										id="brand-name"
										name="brandName"
										bind:value={brandName}
										placeholder="Enter your brand name"
										required
										class="text-base"
									/>
									<p class="text-xs text-gray-500">The official name of your brand or company</p>
								</div>

								<div class="space-y-2">
									<Label for="brand-domain">Brand Domain *</Label>
									<select
										id="brand-domain"
										name="brandDomain"
										bind:value={brandDomain}
										class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										required
									>
										<option value="">Select your brand domain</option>
										{#each domainOptions as domain (domain)}
											<option value={domain}>{domain}</option>
										{/each}
									</select>
									<p class="text-xs text-gray-500">
										This determines the specialized AI adaptations and industry-specific guidelines
									</p>
								</div>

								<div class="space-y-2">
									<Label for="short-description">Short Description *</Label>
									<Textarea
										id="short-description"
										name="shortDescription"
										bind:value={shortDescription}
										placeholder="Brief description of your brand and what you do..."
										rows={3}
										required
									/>
								</div>

								<div class="space-y-2">
									<Label for="brand-values">Brand Values & Mission Statement</Label>
									<Textarea
										id="brand-values"
										name="brandValues"
										bind:value={brandValues}
										placeholder="Describe your brand's core values, mission, and what makes you unique..."
										rows={4}
									/>
									<p class="text-xs text-gray-500">
										Help us understand your brand's purpose and personality
									</p>
								</div>
							</div>

							<Separator />

							<!-- Brand Positioning Section -->
							<div class="space-y-4">
								<div class="mb-3 flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-green-600"></div>
									<h3 class="text-lg font-semibold text-gray-900">Brand Positioning</h3>
								</div>

								<div class="space-y-2">
									<Label for="mood">Brand Mood & Personality</Label>
									<select
										id="mood"
										name="mood"
										bind:value={selectedMood}
										class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									>
										<option value="">Select brand mood</option>
										{#each mockMoodOptions as mood (mood)}
											<option value={mood}>{mood}</option>
										{/each}
									</select>
									<p class="text-xs text-gray-500">How should your brand feel and communicate?</p>
								</div>

								<div class="space-y-2">
									<Label for="audience">Target Audience</Label>
									<select
										id="audience"
										name="audience"
										bind:value={selectedAudience}
										class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									>
										<option value="">Select target audience</option>
										{#each mockTargetAudiences as audience (audience)}
											<option value={audience}>{audience}</option>
										{/each}
									</select>
									<p class="text-xs text-gray-500">Who are your primary customers or users?</p>
								</div>
							</div>

							<Separator />

							<!-- Contact Information Section -->
							<div class="space-y-4">
								<div class="mb-3 flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-purple-600"></div>
									<h3 class="text-lg font-semibold text-gray-900">Contact Information</h3>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="contact-name">Contact Name</Label>
										<Input
											id="contact-name"
											name="contactName"
											bind:value={contactName}
											placeholder="John Doe"
										/>
									</div>

									<div class="space-y-2">
										<Label for="contact-email">Contact Email</Label>
										<Input
											id="contact-email"
											name="contactEmail"
											bind:value={contactEmail}
											placeholder="john@company.com"
											type="email"
										/>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="contact-role">Role</Label>
										<Input
											id="contact-role"
											name="contactRole"
											bind:value={contactRole}
											placeholder=""
										/>
									</div>

									<div class="space-y-2">
										<Label for="contact-company">Company</Label>
										<Input
											id="contact-company"
											name="contactCompany"
											bind:value={contactCompany}
											placeholder=""
										/>
									</div>
								</div>
							</div>

							<Separator />

							<!-- Additional Details Section -->
							<div class="space-y-4">
								<div class="mb-3 flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-purple-600"></div>
									<h3 class="text-lg font-semibold text-gray-900">Additional Details</h3>
								</div>

								<div class="space-y-2">
									<Label for="custom-prompt">Custom Brand Description & Requirements</Label>
									<Textarea
										id="custom-prompt"
										name="customPrompt"
										bind:value={customPrompt}
										placeholder="Describe your brand vision, style preferences, tagline ideas, or any specific requirements for the brand guidelines..."
										rows={4}
									/>
									<p class="text-xs text-gray-500">
										Include taglines, style preferences, color inspirations, or any specific
										requirements
									</p>
								</div>
							</div>
						</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Logo</CardTitle>
					<CardDescription>Upload existing logo or let AI generate one for you</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if logoPreview}
						<!-- Logo Preview -->
						<div class="relative rounded-lg border border-gray-200 p-4">
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-medium text-gray-900">Logo Preview</h4>
								<Button
									variant="ghost"
									size="sm"
									onclick={removeLogo}
									class="text-red-600 hover:text-red-700"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
							<div class="flex justify-center">
								<img
									src={logoPreview}
									alt="Brand Logo"
									class="max-h-32 max-w-full object-contain"
								/>
							</div>
							<p class="mt-2 text-center text-xs text-gray-500">Brand Logo Analysis</p>
						</div>

						<!-- Logo Analysis Section -->
						<div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
							<h4 class="mb-3 text-sm font-semibold text-blue-900">Logo Analysis</h4>
							<div class="text-sm leading-relaxed text-blue-800">
								<p class="mb-3">
									<strong>Visual Elements:</strong> The logo features a modern, clean design with geometric
									shapes and contemporary typography. The composition suggests professionalism and innovation.
								</p>
								<p class="mb-3">
									<strong>Color Palette:</strong> The design incorporates a sophisticated color scheme
									that conveys trust, reliability, and forward-thinking approach. The colors work harmoniously
									to create visual impact.
								</p>
								<p class="mb-3">
									<strong>Typography:</strong> The font choice reflects modern sensibilities with clean
									lines and excellent readability across different sizes and applications.
								</p>
								<p>
									<strong>Brand Personality:</strong> This logo evokes a sense of professionalism, innovation,
									and trustworthiness - perfect for establishing credibility in your target market.
								</p>
							</div>
						</div>
					{:else}
						<!-- Upload Area -->
						<div class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
							<Upload class="mx-auto mb-4 h-12 w-12 text-gray-400" />
							<div class="space-y-2">
								<p class="text-sm font-medium text-gray-900">Upload your logo</p>
								<p class="text-xs text-gray-500">PNG, JPG, SVG up to 5MB</p>
							</div>
							<input
								id="logo-upload"
								type="file"
								class="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
								accept="image/*"
								onchange={handleLogoUpload}
							/>
						</div>
					{/if}

					<div class="text-center">
						<p class="mb-2 text-sm text-gray-500">or</p>
						<Button variant="outline" class="w-full">Generate Logo with AI</Button>
					</div>
				</CardContent>
			</Card>

			<div class="space-y-3">
				<Button
					class="w-full"
					size="lg"
					onclick={handleProgressiveGeneration}
					disabled={!brandName.trim() || !brandDomain || !shortDescription.trim()}
				>
					<Zap class="mr-2 h-4 w-4" />
					Generate Brand Guidelines
				</Button>
			</div>

			{#if !brandName.trim() || !brandDomain || !shortDescription.trim()}
				<div class="text-center">
					<p class="text-sm text-gray-500">
						{#if !brandName.trim()}
							Brand name is required
						{:else if !brandDomain}
							Brand domain is required
						{:else if !shortDescription.trim()}
							Short description is required
						{/if}
					</p>
				</div>
			{/if}
		</div>

		<!-- Preview Section -->
		<div class="space-y-6">
			{#if showProgressiveGenerator}
				<ProgressiveGenerator
					brandInput={{
						brand_name: brandName,
						brand_domain: brandDomain,
						short_description: shortDescription,
						logo_files: logoFiles.map((logo) => ({
							filename: logo.filename,
							usage_tag: logo.usageTag as 'primary' | 'icon' | 'lockup',
							file_path: logo.filePath,
							file_size: 0,
							fileData: logo.fileData // Include base64 data
						})),
						contact: {
							name: contactName || '',
							email: contactEmail || '',
							role: contactRole,
							company: contactCompany || brandName
						}
					}}
					{logoFiles}
					onComplete={handleProgressiveComplete}
				/>
			{:else if errorMessage}
				<Card>
					<CardContent class="p-6">
						<div class="flex items-start gap-3">
							<AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
							<div>
								<h3 class="text-sm font-medium text-red-800">Generation Error</h3>
								<p class="mt-1 text-sm text-red-700">{errorMessage}</p>
								<Button
									variant="outline"
									size="sm"
									class="mt-3"
									onclick={() => {
										errorMessage = '';
										showGuidelines = false;
									}}
								>
									Try Again
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
		{:else if showGuidelines && comprehensiveGuidelines}
			<!-- Brand guidelines completed -->
			<Card>
				<CardContent class="p-8 text-center">
					<CheckCircle class="mx-auto mb-4 h-16 w-16 text-green-500" />
					<h2 class="mb-2 text-2xl font-bold text-gray-900">
						Brand Guidelines Created Successfully!
					</h2>
					<p class="mb-6 text-gray-600">
						Your brand guidelines have been generated and saved. You can view them in your history or download as PowerPoint.
					</p>
					<div class="flex justify-center gap-4">
						<Button onclick={() => goto('/dashboard/history')} size="lg">
							<History class="mr-2 h-5 w-5" />
							View in History
						</Button>
						<Button variant="outline" onclick={handleDownloadPptx} size="lg">
							<FileDown class="mr-2 h-5 w-5" />
							Download PowerPoint
						</Button>
						<Button variant="outline" onclick={resetForm} size="lg">
							Create New Guidelines
						</Button>
					</div>
				</CardContent>
			</Card>
			{:else}
				<Card class="flex h-96 items-center justify-center">
					<div class="text-center text-gray-500">
						<Zap class="mx-auto mb-4 h-16 w-16 opacity-50" />
						<p class="mb-2 text-lg font-medium">Brand Guidelines Preview</p>
						<p class="text-sm">
							Fill out the form and click "Generate" to see your AI-generated brand guidelines
						</p>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
