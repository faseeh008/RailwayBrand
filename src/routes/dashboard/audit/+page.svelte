<script lang="ts">
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
	import { Separator } from '$lib/components/ui/separator';
	import { Upload, Link, AlertTriangle, CheckCircle, Download, RefreshCw, ArrowRight, FileText, X } from 'lucide-svelte';
	import { convertAPIClient } from '$lib/services/pdf-extraction/convertapiClient.js';
	import AuditResults from '$lib/components/AuditResults.svelte';
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'lastSelectedBrandGuideline';

	let websiteUrl = '';
	let uploadedFile: File | null = null;
	let showReport = false;
	let isAnalyzing = false;
	let currentStep = 1;
	let isUploading = false;
	let isScraping = false;
	let scrapingMessage = '';
	let scrapingError = '';
	let selectedBrand = null;
	let scrapedData = null;
	let complianceAnalysis = null;
	let companyName = '';
	let uploadingMessage = '';
	let useVisualAudit = true;
	let isLoadingBrand = false;

	// Load persisted brand guideline on mount
	onMount(async () => {
		try {
			const savedBrandData = localStorage.getItem(STORAGE_KEY);
			if (savedBrandData) {
				const brandData = JSON.parse(savedBrandData);
				console.log('📦 Found saved brand guideline:', brandData);
				
				// Try to fetch full brand data from database using the ID
				isLoadingBrand = true;
				try {
					// Try using the brand-guidelines endpoint first (newer schema)
					let response = await fetch(`/api/brand-guidelines/${brandData.id}`);
					if (response.ok) {
						const result = await response.json();
						selectedBrand = result.guideline || result.data || result;
						// Ensure ID is preserved
						if (selectedBrand && brandData.id) {
							selectedBrand.id = brandData.id;
						}
						companyName = selectedBrand.brandName || selectedBrand.companyName || companyName;
						// Save the loaded brand back to localStorage to keep it fresh
						saveBrandGuideline(selectedBrand);
						console.log('✅ Loaded brand guideline from database (brand-guidelines):', selectedBrand);
					} else {
						// Try alternative endpoint or use saved data
						response = await fetch(`/api/brands?search=${encodeURIComponent(brandData.brandName || brandData.companyName || '')}`);
						if (response.ok) {
							const result = await response.json();
							if (result.data && result.data.length > 0) {
								// Find matching brand by ID or name
								const found = result.data.find((b: any) => b.id === brandData.id || b.brandName === brandData.brandName);
								if (found) {
									selectedBrand = found;
									// Ensure ID is preserved
									if (selectedBrand && brandData.id) {
										selectedBrand.id = brandData.id;
									}
									companyName = found.brandName || found.companyName || '';
									// Save the loaded brand back to localStorage to keep it fresh
									saveBrandGuideline(selectedBrand);
									console.log('✅ Loaded brand guideline from database (brands search):', selectedBrand);
								} else {
									throw new Error('Brand not found in search results');
								}
							} else {
								throw new Error('No brands found');
							}
						} else {
							throw new Error('Both endpoints failed');
						}
					}
				} catch (error) {
					// Fallback to saved data if fetch fails
					selectedBrand = brandData;
					companyName = brandData.brandName || brandData.companyName || '';
					console.log('⚠️ Using saved brand data (fetch failed):', error);
				}
				
				// Skip to step 2 if brand is loaded
				if (selectedBrand) {
					currentStep = 2;
					scrapingMessage = `✅ Using saved brand guidelines: ${selectedBrand.brandName || selectedBrand.companyName || 'Brand'}. Ready to analyze websites!`;
				}
			}
		} catch (error) {
			console.error('❌ Failed to load saved brand guideline:', error);
		} finally {
			isLoadingBrand = false;
		}
	});

	// Save brand guideline to localStorage
	function saveBrandGuideline(brand: any) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
			console.log('💾 Saved brand guideline to localStorage');
		} catch (error) {
			console.error('❌ Failed to save brand guideline:', error);
		}
	}

	// Clear saved brand guideline and go back to upload
	function changeBrandGuideline() {
		localStorage.removeItem(STORAGE_KEY);
		selectedBrand = null;
		companyName = '';
		currentStep = 1;
		websiteUrl = '';
		scrapedData = null;
		complianceAnalysis = null;
		scrapingMessage = '';
		scrapingError = '';
		uploadingMessage = '';
		console.log('🔄 Cleared brand guideline - returning to upload step');
	}


	// Step 1: Upload PDF
	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;

		if (!companyName.trim()) {
			alert('Please enter a company name first');
			return;
		}

		uploadedFile = file;
		isUploading = true;

		try {
			console.log('📄 Processing PDF file:', file.name);
			scrapingError = '';
			scrapingMessage = '';
			
			// Convert PDF to text using ConvertAPI
			const text = await convertAPIClient.convertPdfToText(file);
			console.log('✅ PDF converted to text:', text.length, 'characters');

			if (!text || text.length === 0) {
				throw new Error('PDF conversion returned empty text. Please check if the PDF contains readable text.');
			}

			// Use the company name entered by user
			console.log('🏢 Using company name:', companyName);
			
			// Extract brand guidelines
			const guidelines = await convertAPIClient.extractBrandGuidelines(text, companyName);
			console.log('✅ Brand guidelines extracted:', guidelines);

			// Ensure brandName is set at root level (required by /api/brands)
			if (!guidelines.brandName) {
				guidelines.brandName = companyName || guidelines.metadata?.brandName || guidelines.brandName || 'Unknown Brand';
			}
			
			// Ensure companyName is set
			if (!guidelines.companyName) {
				guidelines.companyName = guidelines.brandName;
			}

			console.log('📤 Sending to /api/brands:', {
				brandName: guidelines.brandName,
				hasColors: !!guidelines.colors,
				hasTypography: !!guidelines.typography,
				hasLogo: !!guidelines.logo
			});

			// Store in database
			const response = await fetch('/api/brands', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(guidelines)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: response.statusText }));
				console.error('❌ API Error Response:', errorData);
				throw new Error(errorData.error || errorData.details || `Failed to store guidelines: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			console.log('📥 API Response:', result);
			
			if (!result.success) {
				throw new Error(result.error || 'Failed to store brand guidelines');
			}

			if (!result.data) {
				throw new Error('No data returned from server');
			}

			selectedBrand = result.data;
			console.log('✅ Brand guidelines stored:', selectedBrand.id);

			// Save to localStorage for persistence
			saveBrandGuideline(selectedBrand);

			currentStep = 2;
			scrapingMessage = `✅ Brand guidelines uploaded successfully! Ready to analyze website.`;

		} catch (error: any) {
			console.error('❌ PDF processing failed:', error);
			console.error('❌ Error details:', {
				message: error.message,
				stack: error.stack,
				name: error.name
			});
			scrapingError = `PDF processing failed: ${error.message || 'Unknown error occurred'}`;
			isUploading = false;
		} finally {
			isUploading = false;
		}
	}

	// Step 2: Scrape Website
	async function scrapeWebsite() {
		console.log('🔘 Button clicked! scrapeWebsite function called');
		console.log('🔍 Website URL:', websiteUrl);
		console.log('🔍 Selected Brand:', selectedBrand);
		console.log('🔍 isScraping:', isScraping);
		console.log('🔍 disabled state:', !websiteUrl.trim() || isScraping);
		
		if (!websiteUrl.trim()) {
			scrapingError = 'Please enter a website URL';
			return;
		}

		// Handle file:// URLs for local testing
		if (websiteUrl.startsWith('file://')) {
			console.log('📁 Detected local file URL, will attempt to scrape...');
			// Allow file:// URLs for testing purposes
		}

		// Validate URL format
		try {
			new URL(websiteUrl);
		} catch (error) {
			scrapingError = 'Please enter a valid website URL (e.g., https://example.com)';
			return;
		}

		console.log('🔍 Checking selectedBrand:', selectedBrand);
		if (!selectedBrand) {
			scrapingError = 'Please upload brand guidelines first';
			return;
		}

		isScraping = true;
		scrapingError = '';
		scrapingMessage = '';
		scrapedData = null;
		complianceAnalysis = null;

		try {
			console.log(`🌐 Starting website scraping for: ${websiteUrl}`);
			scrapingMessage = 'Scraping website and analyzing compliance...';

			// Choose API endpoint based on visual audit preference
			const apiEndpoint = useVisualAudit ? '/api/audit-with-visuals' : '/api/scrape-website';
			console.log(`🔗 Using API endpoint: ${apiEndpoint}`);

			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: websiteUrl,
					brandId: selectedBrand.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const result = await response.json();
			console.log('✅ Website scraping completed:', result);

			// Handle different response structures for visual vs standard audit
			if (useVisualAudit) {
				// Visual audit returns the analysis directly with visualData
				console.log('🔍 Visual audit response structure:', {
					hasOverallScore: !!result.overallScore,
					hasIssues: !!result.issues,
					hasVisualData: !!result.visualData,
					hasAnnotatedScreenshot: !!result.visualData?.annotatedScreenshot
				});
				
				scrapedData = {
					url: result.url || websiteUrl,
					screenshot: result.visualData?.annotatedScreenshot || null
				};
				complianceAnalysis = result;
			} else {
				// Standard audit returns data.complianceAnalysis
				scrapedData = result.data;
				complianceAnalysis = result.data.complianceAnalysis;
			}
			
			// Validate that we have the required data
			if (!complianceAnalysis) {
				throw new Error('No compliance analysis data received from server');
			}
			
			scrapingMessage = `✅ Website scraped successfully! Compliance Score: ${(complianceAnalysis?.overallScore * 100 || 0).toFixed(1)}%`;
			currentStep = 3; // Move to results step

		} catch (error: any) {
			console.error('❌ Website scraping failed:', error);
			scrapingError = `Scraping failed: ${error.message}`;
		} finally {
			isScraping = false;
		}
	}

	function startOver() {
		// Reset to step 2 (URL entry) if brand is saved, otherwise step 1 (upload)
		const savedBrandData = localStorage.getItem(STORAGE_KEY);
		if (savedBrandData) {
			try {
				const brandData = JSON.parse(savedBrandData);
				selectedBrand = brandData;
				companyName = brandData.brandName || brandData.companyName || '';
				currentStep = 2;
				scrapingMessage = `✅ Ready to analyze a new website with ${selectedBrand.brandName || selectedBrand.companyName || 'brand'} guidelines.`;
			} catch (error) {
				currentStep = 1;
				selectedBrand = null;
			}
		} else {
			currentStep = 1;
			selectedBrand = null;
		}
		
		uploadedFile = null;
		websiteUrl = '';
		scrapedData = null;
		complianceAnalysis = null;
		scrapingError = '';
		uploadingMessage = '';
		isUploading = false;
		isScraping = false;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-foreground mb-2">AI Brand Audit</h1>
			<p class="text-muted-foreground">Upload brand guidelines PDF, then analyze your website with AI-powered detection.</p>
		</div>

		<!-- Progress Steps -->
		<div class="flex items-center justify-center space-x-4 mb-8">
			<div class="flex items-center">
				<div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}">
					1
				</div>
				<span class="ml-2 text-sm font-medium {currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}">Company & PDF</span>
			</div>
			<div class="w-8 h-0.5 bg-muted"></div>
			<div class="flex items-center">
				<div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}">
					2
				</div>
				<span class="ml-2 text-sm font-medium {currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}">Enter URL</span>
			</div>
			<div class="w-8 h-0.5 bg-muted"></div>
			<div class="flex items-center">
				<div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}">
					3
				</div>
				<span class="ml-2 text-sm font-medium {currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}">Analysis</span>
			</div>
		</div>

		<!-- Step 1: Upload PDF -->
		{#if currentStep === 1}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center">
						<span class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
						Enter Company Name & Upload PDF
					</CardTitle>
					<CardDescription>Enter your company name and upload your brand guidelines PDF to extract brand information</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<!-- Company Name Input -->
					<div class="space-y-2">
						<Label for="company-name">Company Name</Label>
						<Input
							id="company-name"
							bind:value={companyName}
							placeholder="Enter company name (e.g., Switcher, Apple, Microsoft)"
							class="w-full"
							disabled={isUploading}
						/>
						<p class="text-xs text-muted-foreground">This will be used to identify your brand guidelines in the database</p>
					</div>

					<!-- File Upload Section -->
					<div class="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
						<Upload class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
						<div class="space-y-2">
							<p class="text-lg font-medium text-foreground">Upload Brand Guidelines PDF</p>
							<p class="text-sm text-muted-foreground">Drag and drop your PDF file here, or click to browse</p>
						</div>
						<input
							type="file"
							accept=".pdf"
							onchange={handleFileUpload}
							class="hidden"
							id="pdf-upload"
						/>
						<button
							onclick={() => {
								console.log('Button clicked! companyName:', companyName);
								document.getElementById('pdf-upload')?.click();
							}}
							disabled={isUploading || !companyName.trim()}
							class="mt-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
						>
							{#if isUploading}
								<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
								Processing PDF...
							{:else}
								<Upload class="mr-2 h-4 w-4" />
								Choose PDF File
							{/if}
						</button>
						{#if !companyName.trim()}
							<p class="text-xs text-destructive mt-2">Please enter a company name first</p>
						{/if}
						<!-- Debug info -->
						<p class="text-xs text-primary mt-1">
							Debug: companyName="{companyName}" | isUploading={isUploading} | disabled={isUploading || !companyName.trim()}
						</p>
					</div>

					{#if uploadingMessage}
						<div class="rounded-lg bg-primary/10 p-4">
							<p class="text-sm text-green-800">{uploadingMessage}</p>
						</div>
					{/if}


					{#if scrapingMessage}
						<div class="rounded-lg bg-primary/10 p-4">
							<p class="text-sm text-green-800">{scrapingMessage}</p>
						</div>
					{/if}

					{#if scrapingError}
						<div class="rounded-lg bg-red-50 p-4">
							<p class="text-sm text-red-800">{scrapingError}</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Step 2: URL Analysis -->
		{#if currentStep === 2}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center">
						<span class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</span>
						Scrape Website
					</CardTitle>
					<CardDescription>Enter the website URL to scrape and analyze against the uploaded brand guidelines</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if isLoadingBrand}
						<div class="rounded-lg bg-gray-50 p-4 text-center">
							<RefreshCw class="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-2" />
							<p class="text-sm text-muted-foreground">Loading saved brand guidelines...</p>
						</div>
					{:else if selectedBrand}
						<div class="rounded-lg bg-blue-50 p-4 border border-blue-200">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<p class="text-sm text-blue-800 font-medium">
										<strong>Brand Guidelines Loaded:</strong> {selectedBrand.brandName || selectedBrand.companyName || 'Brand'}
									</p>
									<p class="text-xs text-primary mt-1">ID: {selectedBrand.id}</p>
									<p class="text-xs text-primary mt-2">You can test this guideline with different URLs without re-uploading</p>
								</div>
								<button
									onclick={changeBrandGuideline}
									class="ml-4 inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-white text-blue-700 hover:bg-blue-100 border border-blue-300 h-8 px-3"
									title="Upload a different brand guideline"
								>
									<X class="h-4 w-4" />
									Change
								</button>
							</div>
						</div>
					{:else}
						<div class="rounded-lg bg-red-50 p-4">
							<p class="text-sm text-red-800">
								<strong>No Brand Guidelines Loaded</strong>
							</p>
							<p class="text-xs text-red-600 mt-1">Please complete Step 1 first</p>
						</div>
					{/if}
					
					<div class="space-y-2">
						<Label for="website-url">Website URL</Label>
						<div class="relative">
							<Link class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
							<Input
								id="website-url"
								bind:value={websiteUrl}
								placeholder="https://example.com or file:///C:/path/to/file.html"
								class="pl-10"
							/>
						</div>
					</div>

					<!-- Visual Audit Toggle -->
					<div class="space-y-2">
						<Label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={useVisualAudit}
								class="rounded"
							/>
							<span>Enable Visual Audit Mode</span>
						</Label>
						<p class="text-xs text-muted-foreground">
							Visual mode provides annotated screenshots with interactive issue highlighting
						</p>
					</div>

					{#if scrapingMessage}
						<div class="rounded-lg bg-primary/10 p-4">
							<p class="text-sm text-green-800">{scrapingMessage}</p>
						</div>
					{/if}

					{#if scrapingError}
						<div class="rounded-lg bg-red-50 p-4">
							<p class="text-sm text-red-800">{scrapingError}</p>
						</div>
					{/if}

					<!-- Debug info -->
					<div class="text-xs text-muted-foreground mb-2">
						Debug: websiteUrl="{websiteUrl}" | isScraping={isScraping} | disabled={!websiteUrl.trim() || isScraping}
					</div>
					
					<button
						class="w-full h-10 px-8 rounded-md bg-primary text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!websiteUrl.trim() || isScraping}
						onclick={scrapeWebsite}
					>
						{#if isScraping}
							<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
							Scraping Website...
						{:else}
							Scrape & Analyze Website
						{/if}
					</button>
				</CardContent>
			</Card>
		{/if}

		<!-- Results Section - Full Width -->
		{#if currentStep === 3}
			<div class="w-full">
				{#if isScraping}
					<Card>
						<CardContent class="p-8 text-center">
							<RefreshCw class="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
							<h3 class="mb-2 text-lg font-medium text-foreground">Analyzing Website</h3>
							<p class="text-muted-foreground">This may take a few moments...</p>
							<div class="mt-4 space-y-2 text-sm text-muted-foreground">
								<p>✓ Loading webpage</p>
								<p>✓ Extracting colors and typography</p>
								<p>⏳ Analyzing logo usage</p>
								<p>⏳ Checking compliance</p>
							</div>
						</CardContent>
					</Card>
				{:else if scrapedData && complianceAnalysis}
					<!-- Enhanced Audit Results -->
					<AuditResults 
						auditData={complianceAnalysis}
						websiteUrl={scrapedData.url}
						brandName={selectedBrand?.brandName}
						screenshot={scrapedData.screenshot}
						visualData={complianceAnalysis.visualData}
						fixPrompt={complianceAnalysis?.fixPrompt}
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>