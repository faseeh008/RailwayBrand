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
	import {
		Download,
		Eye,
		Palette,
		Type,
		Loader2,
		CheckCircle,
		AlertCircle,
		History,
		Edit3,
		Save,
		X,
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
	import ThemeSelect from '$lib/components/ThemeSelect.svelte';
	import BrandBuilderChatbot from '$lib/components/BrandBuilderChatbot.svelte';

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
	let chatData: any = null; // Store chatbot data for progressive generator
	
	// Component references
	let progressiveGeneratorRef: ProgressiveGenerator;
	let chatbotRef: BrandBuilderChatbot;
	

	// Expanded domain options (consolidated from both fields) - MUST BE BEFORE questions array
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

	
	const questions = [
		// Brand Identity Questions
		{ 
			id: 'brandName', 
			question: 'What is your brand name?', 
			placeholder: 'Enter your brand name',
			helper: 'This is the official name of your brand or company',
			type: 'text',
			required: true,
			icon: '🏢',
			getValue: () => brandName,
			setValue: (val: string) => brandName = val,
			suggestions: []
		},
		{ 
			id: 'brandDomain', 
			question: 'What industry does your brand operate in?', 
			placeholder: 'Type your own or select from suggestions below',
			helper: 'Choose from common industries or type your own',
			type: 'text-with-suggestions',
			required: true,
			icon: '🎯',
			getValue: () => brandDomain,
			setValue: (val: string) => brandDomain = val,
			suggestions: domainOptions
		},
		{ 
			id: 'shortDescription', 
			question: 'Briefly describe what your brand does', 
			placeholder: 'Tell us about your brand and what makes it unique...',
			helper: 'A few sentences about your brand\'s purpose and offerings',
			type: 'textarea',
			required: true,
			icon: '📝',
			getValue: () => shortDescription,
			setValue: (val: string) => shortDescription = val,
			suggestions: []
		},
		{ 
			id: 'brandValues', 
			question: 'What are your brand\'s core values and mission?', 
			placeholder: 'Describe your brand\'s values, mission, and what makes you unique...',
			helper: 'Help us understand your brand\'s purpose and personality',
			type: 'textarea',
			required: false,
			icon: '💎',
			getValue: () => brandValues,
			setValue: (val: string) => brandValues = val,
			suggestions: []
		},
		// Brand Positioning Questions
		{ 
			id: 'selectedMood', 
			question: 'How should your brand feel and communicate?', 
			placeholder: 'Type your own or select from suggestions below',
			helper: 'Choose a mood or describe your own brand personality',
			type: 'text-with-suggestions',
			required: false,
			icon: '🎨',
			getValue: () => selectedMood,
			setValue: (val: string) => selectedMood = val,
			suggestions: mockMoodOptions
		},
		{ 
			id: 'selectedAudience', 
			question: 'Who is your target audience?', 
			placeholder: 'Type your own or select from suggestions below',
			helper: 'Choose from common audiences or describe your own',
			type: 'text-with-suggestions',
			required: false,
			icon: '👥',
			getValue: () => selectedAudience,
			setValue: (val: string) => selectedAudience = val,
			suggestions: mockTargetAudiences
		},
		// Contact Information - Individual Questions
		{ 
			id: 'contactName', 
			question: 'What is your contact name?', 
			placeholder: 'e.g., John Doe',
			helper: 'Your full name for the brand guidelines',
			type: 'text',
			required: false,
			icon: '👤',
			getValue: () => contactName,
			setValue: (val: string) => contactName = val,
			suggestions: []
		},
		{ 
			id: 'contactEmail', 
			question: 'What is your contact email?', 
			placeholder: 'e.g., john@company.com',
			helper: 'Your email address',
			type: 'email',
			required: false,
			icon: '📧',
			getValue: () => contactEmail,
			setValue: (val: string) => contactEmail = val,
			suggestions: []
		},
		{ 
			id: 'contactRole', 
			question: 'What is your role?', 
			placeholder: 'e.g., Marketing Manager',
			helper: 'Your position or role in the company',
			type: 'text',
			required: false,
			icon: '💼',
			getValue: () => contactRole,
			setValue: (val: string) => contactRole = val,
			suggestions: []
		},
		{ 
			id: 'contactCompany', 
			question: 'What is your company name?', 
			placeholder: 'e.g., Acme Corp',
			helper: 'The name of your company or organization',
			type: 'text',
			required: false,
			icon: '🏢',
			getValue: () => contactCompany,
			setValue: (val: string) => contactCompany = val,
			suggestions: []
		},
		// Additional Details Question
		{ 
			id: 'customPrompt', 
			question: 'Any additional requirements or preferences?', 
			placeholder: 'Taglines, style preferences, color inspirations, specific requirements...',
			helper: 'Share any additional details that would help us create your brand guidelines',
			type: 'textarea',
			required: false,
			icon: '✨',
			getValue: () => customPrompt,
			setValue: (val: string) => customPrompt = val,
			suggestions: []
		},
		// Logo Upload Question
		{ 
			id: 'logo', 
			question: 'Do you have a logo to upload?', 
			placeholder: '',
			helper: 'Upload your existing logo or skip to generate one with AI',
			type: 'logo',
			required: false,
			icon: '🖼️',
			getValue: () => logoPreview,
			setValue: () => {}, // Handled by upload function
			suggestions: []
		}
	];

	// Progressive generation state
	let showProgressiveGenerator = false;
	let savedGuidelineId: string | null = null;
	let savedLogoPath: string | null = null;
	let progressiveStepHistory: Array<{ step: string; content: string; approved: boolean }> = [];

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
	
	// Check if we can generate (all required questions answered)
	function canGenerate(): boolean {
		return brandName.trim() !== '' && brandDomain !== '' && shortDescription.trim() !== '';
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

	function handleProgressiveGeneration(data?: any) {
		// Store chatData for later use
		chatData = data;
		
		// If called from chatbot, populate form fields
		if (data) {
			brandName = data.brandName || brandName;
			brandDomain = data.brandDomain || brandDomain;
			shortDescription = data.shortDescription || shortDescription;
			brandValues = data.brandValues || brandValues;
			selectedMood = data.selectedMood || selectedMood;
			selectedAudience = data.selectedAudience || selectedAudience;
			customPrompt = data.customPrompt || customPrompt;
			
			// Handle individual contact info fields
			contactName = data.contactName || contactName;
			contactEmail = data.contactEmail || contactEmail;
			contactRole = data.contactRole || contactRole;
			contactCompany = data.contactCompany || contactCompany;
			
			// Handle logo
			if (data.logoData) {
				// Check if it's an uploaded logo or AI-generated
				if (data.logoData.type === 'ai-generated') {
					// AI-generated logo - use the fileData from generation
					if (data.logoData.fileData) {
						logoPreview = data.logoData.fileData;
						logoFiles = [{
							filename: data.logoData.filename || 'ai-generated-logo.svg',
							filePath: '',
							fileData: data.logoData.fileData,
							usageTag: 'primary',
							aiGenerated: true
						}];
					} else {
						// Fallback if fileData is missing
						logoFiles = [{
							filename: 'ai-generated-logo.svg',
							filePath: '',
							fileData: '',
							usageTag: 'primary',
							aiGenerated: true
						}];
					}
				} else {
					// Uploaded logo
					logoPreview = data.logoData.fileData;
					logoFiles = [{
						filename: data.logoData.filename,
						filePath: data.logoData.filePath,
						fileData: data.logoData.fileData,
						usageTag: 'primary'
					}];
				}
			}
		}
		
		// Validate required fields for progressive generation
		if (!brandName || !brandDomain || !shortDescription) {
			errorMessage =
				'Please fill in Brand Name, Brand Domain, and Short Description to start progressive generation.';
			return;
		}

		showProgressiveGenerator = true;
		showGuidelines = false;
		errorMessage = '';
		
		// Auto-start generation when chatbot-controlled
		// Wait for component to mount
		setTimeout(() => {
			if (progressiveGeneratorRef) {
				progressiveGeneratorRef.startProgressiveGeneration();
			}
		}, 100);
	}
	
	// Wrapper functions for step approval/regeneration
	function handleApproveStep(stepIndex: number) {
		if (progressiveGeneratorRef) {
			progressiveGeneratorRef.approveStep(stepIndex);
		}
	}
	
	function handleRegenerateStep(stepIndex: number, feedback: string) {
		if (progressiveGeneratorRef) {
			progressiveGeneratorRef.regenerateStep(stepIndex, feedback);
		}
	}
	
	async function handleStepGenerated(step: any) {
		if (chatbotRef) {
			await chatbotRef.handleStepGenerated(step);
		}
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
		
		// Clear chatbot state before redirecting
		if (chatbotRef) {
			chatbotRef.clearChatState();
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
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-foreground mt-6 mb-3">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-foreground mt-8 mb-4">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-foreground mt-8 mb-6">$1</h1>')
			// Convert bold text (remove asterisks and make bold)
			.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
			.replace(/\*(.*?)\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
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
					<h3 class="text-lg font-bold text-foreground mt-6 mb-3">Logo Guidelines</h3>
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
						<div class="flex items-center gap-3 mb-3 p-3 bg-muted rounded-lg">
							<div class="w-12 h-12 rounded-lg border-2 border-border shadow-sm" style="background-color: ${hex}"></div>
							<div>
								<div class="font-semibold text-foreground">${colorName}</div>
								<div class="text-sm text-muted-foreground font-mono">${hex.toUpperCase()}</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					colorSection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-foreground mb-3">Color Swatches</h4>${colorSwatches}</div>`
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
						<div class="mb-6 p-4 bg-muted rounded-lg">
							<div class="mb-3">
								<h4 class="text-lg font-semibold text-foreground mb-2">${cleanFont}</h4>
								<p class="text-sm text-muted-foreground">Primary Font</p>
							</div>
							<div class="space-y-2">
								<div class="text-2xl font-bold text-foreground" style="font-family: '${cleanFont}', serif;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
								<div class="text-lg text-foreground" style="font-family: '${cleanFont}', serif;">abcdefghijklmnopqrstuvwxyz</div>
								<div class="text-lg text-foreground" style="font-family: '${cleanFont}', serif;">1234567890 !@#$%^&*()</div>
							</div>
						</div>
					`;
					})
					.join('');

				return (
					typographySection.replace(
						/(<p class="mb-4">.*?<\/p>)/s,
						`$1<div class="mt-4 mb-6"><h4 class="text-md font-semibold text-foreground mb-3">Font Showcase</h4>${typographyShowcase}</div>`
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

<!-- Enhanced Header with Gradient - Full Width -->
<div class="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent p-8 border border-orange-500/20">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-1/2 -right-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
	</div>
	
	<div class="relative flex items-center justify-between">
		<div class="space-y-2">
			<div class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
					<Zap class="h-6 w-6 text-white" />
				</div>
				<h1 class="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Brand Builder</h1>
			</div>
			<p class="text-muted-foreground text-lg ml-14">Create brand guidelines step-by-step with AI assistance</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" size="sm" onclick={goToHistory} class="border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all duration-300">
				<History class="mr-2 h-4 w-4" />
				View History
			</Button>
		</div>
	</div>
</div>

<div class="flex justify-end pr-6 lg:pr-12">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start max-w-[1400px]">
		<!-- Brand Guidelines Generator (Left Side) -->
		<div class="space-y-6 h-[1000px]">
			{#if showProgressiveGenerator}
				<ProgressiveGenerator
					bind:this={progressiveGeneratorRef}
					brandInput={{
						brand_name: brandName,
						brand_domain: brandDomain,
						short_description: shortDescription,
						// Include all brand positioning fields
						selectedMood: selectedMood || undefined,
						selectedAudience: selectedAudience || undefined,
						brandValues: brandValues || undefined,
						customPrompt: customPrompt || undefined,
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
							role: contactRole || '',
							company: contactCompany || brandName
						},
						// Include industry-specific info if available (from chatbot)
						...(chatData?.industrySpecificInfo ? { industrySpecificInfo: chatData.industrySpecificInfo } : {}),
						...(chatData?.groundingData ? { groundingData: chatData.groundingData } : {})
					} as any}
					{logoFiles}
					onComplete={handleProgressiveComplete}
					chatbotControlled={true}
					onStepGenerated={handleStepGenerated}
				/>
			{:else if errorMessage}
				<Card class="border-destructive/20 shadow-lg bg-destructive/5 backdrop-blur-sm h-full w-[650px]">
					<CardContent class="p-6">
						<div class="flex items-start gap-4">
							<div class="p-3 rounded-full bg-destructive/20">
								<AlertCircle class="h-6 w-6 text-destructive" />
							</div>
							<div class="flex-1">
								<h3 class="text-base font-semibold text-destructive mb-2">Generation Error</h3>
								<p class="text-sm text-destructive/90 mb-4">{errorMessage}</p>
								<Button
									variant="outline"
									size="sm"
									class="border-destructive/30 hover:bg-destructive/10"
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
			<Card class="border-orange-500/20 shadow-xl bg-gradient-to-br from-orange-500/5 to-transparent backdrop-blur-sm relative overflow-hidden h-full w-[650px]">
				<!-- Animated Success Background -->
				<div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/10"></div>
				<div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
				
				<CardContent class="relative p-8 text-center">
					<div class="mb-6 inline-flex p-4 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 animate-bounce">
						<CheckCircle class="h-16 w-16 text-orange-500" />
					</div>
					<h2 class="mb-3 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Brand Guidelines Created Successfully!
					</h2>
					<p class="mb-8 text-base text-muted-foreground max-w-lg mx-auto">
						Your brand guidelines have been generated and saved. You can view them in your history or download as PowerPoint.
					</p>
					<div class="flex flex-col sm:flex-row justify-center gap-3">
						<Button 
							onclick={() => goto('/dashboard/history')} 
							size="lg"
							class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
						>
							<History class="mr-2 h-5 w-5" />
							View in History
						</Button>
						<Button 
							variant="outline" 
							onclick={handleDownloadPptx} 
							size="lg"
							class="border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-300"
						>
							<FileDown class="mr-2 h-5 w-5" />
							Download PowerPoint
						</Button>
						<Button 
							variant="outline" 
							onclick={resetForm} 
							size="lg"
							class="border-border/50 hover:bg-muted transition-all duration-300"
						>
							Create New Guidelines
						</Button>
					</div>
				</CardContent>
			</Card>
			{:else}
				<Card class="flex h-full w-[650px] items-center justify-center border-border/50 shadow-lg bg-card/50 backdrop-blur-sm relative overflow-hidden group">
					<!-- Animated Background -->
					<div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5"></div>
					<div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
					<div class="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" style="animation-delay: 0.5s;"></div>
					
					<div class="relative text-center text-muted-foreground p-8">
						<div class="mb-6 inline-flex p-5 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 group-hover:scale-110 transition-transform duration-300">
							<Zap class="h-16 w-16 text-orange-500 animate-pulse" />
						</div>
						<p class="mb-3 text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Brand Guidelines Generator</p>
						<p class="text-base text-muted-foreground max-w-md">
							Answer the questions in the chat to start generating your AI-powered brand guidelines
						</p>
						<div class="mt-6 flex justify-center gap-2">
							<div class="h-2 w-2 rounded-full bg-orange-500 animate-bounce"></div>
							<div class="h-2 w-2 rounded-full bg-orange-500 animate-bounce" style="animation-delay: 0.1s;"></div>
							<div class="h-2 w-2 rounded-full bg-orange-500 animate-bounce" style="animation-delay: 0.2s;"></div>
						</div>
					</div>
				</Card>
			{/if}
		</div>

		<!-- Chatbot Interface (Right Side) -->
		<div class="space-y-6">
			<BrandBuilderChatbot
				bind:this={chatbotRef}
				{questions}
				onComplete={handleProgressiveGeneration}
				{canGenerate}
				totalSteps={7}
				onApproveStep={handleApproveStep}
				onRegenerateStep={handleRegenerateStep}
			/>
		</div>
	</div>
</div>
