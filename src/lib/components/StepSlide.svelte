<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { CheckCircle, XCircle, Loader2, ThumbsUp, ThumbsDown, RefreshCw, Edit, Copy, Check } from 'lucide-svelte';
	import DynamicIcon from '$lib/components/DynamicIcon.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let stepData: any;
	export let stepTitle: string;
	export let stepDescription: string;
	export let stepId: string = '';
	export let isGenerating = false;
	export let onApprove: () => void;
	export let onRegenerate: (feedback: string) => void;
	export let onRevert: () => void = () => {};
	export let logoFiles: Array<{ filename: string; filePath?: string; fileData?: string; usageTag: string }> = [];
	export let stepIndex: number = 0;
	export let isLastStep: boolean = false;
	export let showApproveButton: boolean = false;
	export let isApproved: boolean = false;
	export let canRevert: boolean = false;
	export let readOnly: boolean = false;
	
	// Navigation props
	export let showNavigationButtons: boolean = false;
	export let onPrevious: () => void = () => {};
	export let onNext: () => void = () => {};
	export let canGoNext: boolean = false;
	export let canGoPrevious: boolean = false;
	export let showCompleteButton: boolean = false;
	export let onComplete: () => void = () => {};
	
	// Progress indicator props
	export let showProgressIndicator: boolean = false;
	export let currentStep: number = 1;
	export let totalSteps: number = 7;
	export let progressPercentage: number = 0;
	export let allSteps: Array<{ title: string; description: string; isApproved: boolean; isCurrent: boolean }> = [];
	
	// Internal state for feedback
	let showFeedback = false;
	let userFeedback = '';
	let isRegenerating = false;
	let copiedIconName: string | null = null;
	let copyIconTimeout: ReturnType<typeof setTimeout> | null = null;
const iconAccentGradients = [
	'linear-gradient(135deg, #f97316, #fb7185)',
	'linear-gradient(135deg, #38bdf8, #6366f1)',
	'linear-gradient(135deg, #34d399, #10b981)',
	'linear-gradient(135deg, #facc15, #f97316)',
	'linear-gradient(135deg, #a855f7, #ec4899)'
];

function getIconAccent(index: number): string {
	return iconAccentGradients[index % iconAccentGradients.length];
}

	async function copyIconLabel(text: string) {
		try {
		if (!navigator?.clipboard) return;
		await navigator.clipboard.writeText(text);
			copiedIconName = text;
			if (copyIconTimeout) clearTimeout(copyIconTimeout);
			copyIconTimeout = setTimeout(() => {
				copiedIconName = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy icon label', error);
		}
	}
	
	// Validate if a string looks like a valid font name
	function isValidFontName(fontName: string): boolean {
		if (!fontName || fontName.length < 2 || fontName.length > 30) return false;
		
		const lowerName = fontName.toLowerCase().trim();
		
		// Reject common description words
		const invalidWords = [
			'font', 'typeface', 'text', 'style', 'usage', 'description', 'guidelines',
			'information', 'ensure', 'readability', 'professional', 'modern', 'clean',
			'appropriate', 'suitable', 'works', 'well', 'for', 'headings', 'body',
			'complements', 'primary', 'secondary', 'supporting', 'should', 'must',
			'based', 'brand', 'mood', 'audience', 'description', 'explaining', 'why',
			'this', 'specific', 'fits', 'matches', 'personality', 'that', 'with'
		];
		
		// Check if it contains invalid words
		for (const word of invalidWords) {
			if (lowerName.includes(word) && lowerName.length > word.length + 2) {
				return false;
			}
		}
		
		// Font names are usually 1-3 words, max 30 chars
		const words = fontName.trim().split(/\s+/);
		if (words.length > 3) return false;
		
		// Must start with a letter
		if (!/^[A-Za-z]/.test(fontName.trim())) return false;
		
		// Should only contain letters, numbers, spaces, and hyphens
		if (!/^[A-Za-z0-9\s\-]+$/.test(fontName.trim())) return false;
		
		// Common valid font names (whitelist approach for safety)
		const commonFonts = [
			'inter', 'roboto', 'montserrat', 'poppins', 'open sans', 'lato', 'source sans pro',
			'raleway', 'nunito', 'work sans', 'dm sans', 'space grotesk', 'ibm plex sans',
			'fira sans', 'noto sans', 'rubik', 'ubuntu', 'oswald', 'bebas neue', 'helvetica',
			'arial', 'georgia', 'times new roman', 'merriweather', 'libre baskerville',
			'crimson text', 'playfair display', 'futura', 'gotham', 'proxima nova'
		];
		
		// If it matches a common font name (case-insensitive), it's valid
		if (commonFonts.some(f => lowerName === f || lowerName.includes(f))) {
			return true;
		}
		
		// For unknown fonts, be more strict - must be short and look like a font name
		// Font names typically have capital letters or are all lowercase
		const hasProperCasing = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(fontName.trim()) || 
		                         /^[a-z]+(\s+[a-z]+)*$/.test(fontName.trim());
		
		return hasProperCasing && words.length <= 2;
	}

	// Load Google Font dynamically
	function loadGoogleFont(fontName: string): void {
		if (!browser || !fontName || typeof document === 'undefined') return;
		
		// Validate font name before attempting to load
		if (!isValidFontName(fontName)) {
			console.warn(`Invalid font name detected: "${fontName}" - skipping Google Fonts load`);
			return;
		}
		
		// Clean font name (remove spaces, special chars for ID)
		const fontId = `font-${fontName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase()}`;
		
		// Check if font is already loaded
		if (document.getElementById(fontId)) return;
		
		// Create link element to load Google Font
		const link = document.createElement('link');
		link.id = fontId;
		link.rel = 'stylesheet';
		link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
		
		// Handle load errors gracefully
		link.onerror = () => {
			console.log(`Font "${fontName}" not found in Google Fonts, using system fallback`);
		};
		
		document.head.appendChild(link);
	}

	// Get appropriate fallback font family based on font name
	function getFontFamily(fontName: string): string {
		if (!fontName) return 'sans-serif';
		
		const lowerName = fontName.toLowerCase();
		
		// Serif fonts
		if (lowerName.includes('serif') || 
			lowerName.includes('display') || 
			lowerName.includes('baskerville') || 
			lowerName.includes('crimson') || 
			lowerName.includes('merriweather') ||
			lowerName.includes('georgia') ||
			lowerName.includes('times') ||
			lowerName.includes('playfair')) {
			return `"${fontName}", Georgia, "Times New Roman", serif`;
		}
		
		// Sans-serif fonts (default)
		return `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
	}

	// Extract font information for visual typography display
	// Parses typography text generated by Gemini API based on user requirements
	function extractFontInfo(text: string): { primary: any; supporting: any; weights: string[] } {
		if (!text) return { primary: null, supporting: null, weights: [] };

		// First, try to parse as JSON (if API returns JSON format)
		try {
			const jsonData = JSON.parse(text);
			if (jsonData.primary_font || jsonData.supporting_font) {
				return {
					primary: jsonData.primary_font ? {
						name: jsonData.primary_font.name,
						description: jsonData.primary_font.usage || jsonData.primary_font.reasoning || ''
					} : null,
					supporting: jsonData.supporting_font ? {
						name: jsonData.supporting_font.name,
						description: jsonData.supporting_font.usage || jsonData.supporting_font.reasoning || ''
					} : null,
					weights: ['regular', 'bold', 'light']
				};
			}
		} catch (e) {
			// Not JSON, continue with text parsing (standard Gemini API text format)
		}

		const lines = text.split('\n');
		let primary = null;
		let supporting = null;
		const weights = [];

		for (const line of lines) {
			// Look for primary font - STRICT pattern matching
			if (line.toLowerCase().includes('primary')) {
				// Pattern 1: "**Primary Font**: FontName - description" (STRICT - font name before dash)
				let fontMatch = line.match(/\*\*primary\s+font\*\*[:\s]*([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\s*-\s*(.+)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						primary = {
							name: fontName,
							description: fontMatch[2]?.trim() || ''
						};
						continue;
					}
				}
				
				// Pattern 2: "**Primary Font**: FontName" (STRICT - stop at first space or end)
				fontMatch = line.match(/\*\*primary\s+font\*\*[:\s]+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)(?:\s|$|,|\.)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						primary = {
							name: fontName,
							description: ''
						};
						continue;
					}
				}
				
				// Pattern 3: "Primary Font: FontName" (STRICT)
				fontMatch = line.match(/primary\s+font[:\s]+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)(?:\s|$|,|\.)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						primary = {
							name: fontName,
							description: ''
						};
						continue;
					}
				}
			}

			// Look for supporting/secondary font - STRICT pattern matching
			if (line.toLowerCase().includes('supporting') || line.toLowerCase().includes('secondary')) {
				// Pattern 1: "**Supporting Font**: FontName - description" (STRICT)
				let fontMatch = line.match(/\*\*(?:supporting|secondary)\s+font\*\*[:\s]*([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\s*-\s*(.+)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						supporting = {
							name: fontName,
							description: fontMatch[2]?.trim() || ''
						};
						continue;
					}
				}
				
				// Pattern 2: "**Supporting Font**: FontName" (STRICT)
				fontMatch = line.match(/\*\*(?:supporting|secondary)\s+font\*\*[:\s]+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)(?:\s|$|,|\.)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						supporting = {
							name: fontName,
							description: ''
						};
						continue;
					}
				}
				
				// Pattern 3: "Supporting Font: FontName" (STRICT)
				fontMatch = line.match(/(?:supporting|secondary)\s+font[:\s]+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)(?:\s|$|,|\.)/i);
				if (fontMatch) {
					const fontName = fontMatch[1].trim();
					if (isValidFontName(fontName)) {
						supporting = {
							name: fontName,
							description: ''
						};
						continue;
					}
				}
			}

			// Look for font weights
			if (
				line.toLowerCase().includes('weight') ||
				line.match(/\b(regular|bold|light|medium|thin|black|heavy)\b/i)
			) {
				const weightMatch = line.match(/\b(regular|bold|light|medium|thin|black|heavy|italic)\b/gi);
				if (weightMatch) {
					weights.push(...weightMatch.map((w) => w.toLowerCase()));
				}
			}
		}

		// Default weights if none found
		if (weights.length === 0) {
			weights.push('regular', 'bold', 'light');
		}

		return { primary, supporting, weights };
	}

	// More aggressive fallback font extraction
	function extractFallbackFonts(text: string): {
		primary: string | null;
		supporting: string | null;
	} {
		if (!text) return { primary: null, supporting: null };

		console.log('Fallback extraction for:', text);

		// Common font names to look for
		const commonFonts = [
			'Montserrat',
			'Roboto',
			'Inter',
			'Open Sans',
			'Source Sans Pro',
			'Lato',
			'Poppins',
			'Nunito',
			'Georgia',
			'Times New Roman',
			'Arial',
			'Helvetica',
			'Verdana',
			'Tahoma',
			'Calibri',
			'Playfair Display',
			'Merriweather',
			'PT Sans',
			'Raleway',
			'Ubuntu',
			'Oswald',
			'Bebas Neue',
			'Space Grotesk',
			'DM Sans',
			'Work Sans',
			'IBM Plex Sans',
			'Fira Sans',
			'Noto Sans',
			'Rubik'
		];

		const textLower = text.toLowerCase();
		let primary = null;
		let supporting = null;

		// Look for common fonts in the text
		for (const font of commonFonts) {
			const fontLower = font.toLowerCase();
			if (textLower.includes(fontLower)) {
				// Check if it's mentioned in a primary context
				if (textLower.includes('primary') && textLower.indexOf(fontLower) > textLower.indexOf('primary') - 50) {
					if (!primary) {
						primary = font;
					}
				}
				// Check if it's mentioned in a supporting/secondary context
				if ((textLower.includes('supporting') || textLower.includes('secondary')) && 
				    textLower.indexOf(fontLower) > (textLower.indexOf('supporting') || textLower.indexOf('secondary')) - 50) {
					if (!supporting) {
						supporting = font;
					}
				}
			}
		}

		return { primary, supporting };
	}
	
	// Function to handle font loading (called from reactive statement)
	function handleFontLoading() {
		if (!browser || stepId !== 'typography' || typeof stepData !== 'string') return;
		
		try {
			const fontInfo = extractFontInfo(stepData);
			if (fontInfo.primary?.name) {
				loadGoogleFont(fontInfo.primary.name);
			}
			if (fontInfo.supporting?.name) {
				loadGoogleFont(fontInfo.supporting.name);
			}
			
			// Also handle fallback fonts if main extraction failed
			if (!fontInfo.primary && !fontInfo.supporting) {
				const fallbackFonts = extractFallbackFonts(stepData);
				if (fallbackFonts.primary) {
					loadGoogleFont(fallbackFonts.primary);
				}
				if (fallbackFonts.supporting) {
					loadGoogleFont(fallbackFonts.supporting);
				}
			}
		} catch (error) {
			console.error('Error loading fonts:', error);
		}
	}
	
	// Reactive statements to load Google Fonts when typography data changes
	$: if (stepId === 'typography' && typeof stepData === 'string' && browser) {
		handleFontLoading();
	}

	// Helper function to render markdown text
	function renderMarkdown(text: string): string {
		if (!text) return '';
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\n/g, '<br>');
	}

	function extractColorsFromText(text: string): Array<{ name: string; hex: string }> {
		if (!text) return [];

		const colors: Array<{ name: string; hex: string }> = [];
		const lines = text.split('\n');

		for (const line of lines) {
			// Try different patterns to match various AI-generated formats
			
			// Pattern 1: - Color Name: #HEXCODE (rgb: r, g, b) - description
			let colorMatch = line.match(/^[\s\-*]*(.+?):\s*(#[0-9A-Fa-f]{6})\s*\(/i);
			
			// Pattern 2: - Color Name: #HEXCODE - description
			if (!colorMatch) {
				colorMatch = line.match(/^[\s\-*]*(.+?):\s*(#[0-9A-Fa-f]{6})\s*[-–]/i);
			}
			
			// Pattern 3: Color Name - #HEXCODE (rgb: ...)
			if (!colorMatch) {
				colorMatch = line.match(/^[\s\-*]*(.+?)\s*-\s*(#[0-9A-Fa-f]{6})\s*\(/i);
			}
			
			// Pattern 4: Color Name - #HEXCODE - description
			if (!colorMatch) {
				colorMatch = line.match(/^[\s\-*]*(.+?)\s*-\s*(#[0-9A-Fa-f]{6})\s*[-–]/i);
			}
			
			// Pattern 5: [Color name] - #hexcode
			if (!colorMatch) {
				colorMatch = line.match(/^\s*\[([^\]]+)\]\s*-\s*(#[0-9A-Fa-f]{6})\s*$/i);
			}
			
			// Pattern 6: Just hex code with name before it (more flexible)
			if (!colorMatch) {
				colorMatch = line.match(/^[\s\-*]*(.+?)\s*-\s*(#[0-9A-Fa-f]{6})\s*$/i);
			}
			
			// Pattern 7: Find hex code anywhere in line, extract name from before it
			if (!colorMatch) {
				const hexMatch = line.match(/#[0-9A-Fa-f]{6}/i);
				if (hexMatch) {
					const hex = hexMatch[0];
					const beforeHex = line.substring(0, hexMatch.index).trim();
					// Extract name (take last word or phrase before hex)
					const nameMatch = beforeHex.match(/([A-Za-z][A-Za-z\s]+?)(?:\s*[-–]|\s*\(|\s*$)/);
					if (nameMatch) {
						colorMatch = [null, nameMatch[1].trim(), hex];
					} else if (beforeHex) {
						// Use everything before hex as name
						colorMatch = [null, beforeHex.replace(/^[\s\-*]+/, ''), hex];
					}
				}
			}

			if (colorMatch && colorMatch[1] && colorMatch[2]) {
				const name = colorMatch[1].trim().replace(/^[\s\-*]+/, '').replace(/[\s\-*]+$/, '');
				const hex = colorMatch[2].trim().toUpperCase();
				// Avoid duplicates and validate hex
				if (hex.match(/^#[0-9A-Fa-f]{6}$/i) && !colors.find((c) => c.hex.toUpperCase() === hex.toUpperCase())) {
					colors.push({ name: name || 'Color', hex });
				}
			}
		}

		return colors;
	}

	function extractIconsFromText(text: string): Array<{ name: string; description?: string }> {
		if (!text) return [];

		const icons: Array<{ name: string; description?: string }> = [];
		const seen = new Set<string>();
		const lines = text.split('\n');
		const separators = [' — ', ' – ', ' - ', ' —', ' –', ' -', ': ', ' | '];

		const pushIcon = (rawName: string, description?: string) => {
			const name = rawName
				.replace(/^[\s\-\•\*]+/, '')
				.replace(/^[^A-Za-z0-9]+/, '')
				.trim();
			if (!name || name.length < 2) return;
			if (seen.has(name.toLowerCase())) return;
			seen.add(name.toLowerCase());

			const cleanDescription = description?.trim();
			icons.push({
				name,
				description: cleanDescription && cleanDescription.length > 2 ? cleanDescription : undefined
			});
		};

		for (const line of lines) {
			// Skip empty lines
			if (!line.trim()) continue;

			let working = line
				.replace(/^[\s\-\•\*]+/, '')
				.replace(/^[^A-Za-z0-9]+/, '')
				.trim();
			if (!working) continue;

			let name = working;
			let description: string | undefined;

			for (const sep of separators) {
				const idx = working.indexOf(sep);
				if (idx > 0) {
					name = working.substring(0, idx).trim();
					description = working.substring(idx + sep.length).trim();
					break;
				}
			}

			pushIcon(name, description);
		}

		return icons;
	}

	// Load logo data
	let logoData: string | null = null;
	let allLogoData: Array<{ filename: string; data: string }> = [];

	async function loadLogoData() {
		if (logoFiles.length > 0) {
			allLogoData = [];
			for (const logoFile of logoFiles) {
				try {
					// Check if logoFile has fileData (new format) or filePath (old format)
					if (logoFile.fileData) {
						// New format: use base64 data directly
						allLogoData.push({
							filename: logoFile.filename,
							data: logoFile.fileData
						});
						// Set first logo as primary
						if (logoFile === logoFiles[0]) {
							logoData = logoFile.fileData;
						}
					} else if (logoFile.filePath) {
						// Old format: try to fetch from file path
						const response = await fetch(`/uploads/logos/${logoFile.filename}`);
						if (response.ok) {
							const blob = await response.blob();
							const reader = new FileReader();
							reader.onload = () => {
								allLogoData.push({
									filename: logoFile.filename,
									data: reader.result as string
								});
								// Set first logo as primary
								if (logoFile === logoFiles[0]) {
									logoData = reader.result as string;
								}
							};
							reader.readAsDataURL(blob);
						}
					}
				} catch (error) {
					console.warn('Could not load logo:', logoFile.filename, error);
				}
			}
		}
	}

	// Load logo when logoFiles change
	$: if (logoFiles.length > 0) {
		loadLogoData();
	}

	// Debug: Log stepData when it changes
	$: if (stepData) {
		console.log('StepSlide - stepData:', {
			stepId,
			stepTitle,
			stepDataType: typeof stepData,
			hasStepData: !!stepData,
			stepDataPreview: typeof stepData === 'string' ? stepData.substring(0, 200) : stepData,
			stepDataLength: typeof stepData === 'string' ? stepData.length : 'N/A'
		});
		
		// For color-palette step, also log extracted colors
		if (stepId === 'color-palette' && typeof stepData === 'string') {
			// Try to parse as JSON first
			let parsedData = null;
			try {
				parsedData = JSON.parse(stepData);
			} catch {
				try {
					const cleanedData = stepData.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
					parsedData = JSON.parse(cleanedData);
				} catch {
					// JSON parsing failed
				}
			}
			
			if (parsedData) {
				console.log('StepSlide - Parsed JSON data for color-palette:', {
					hasPrimary: !!parsedData.primary,
					primaryCount: parsedData.primary?.length || 0,
					hasSecondary: !!parsedData.secondary,
					secondaryCount: parsedData.secondary?.length || 0,
					parsedData: parsedData
				});
			} else {
				const extractedColors = extractColorsFromText(stepData);
				console.log('StepSlide - JSON parsing failed, extracted colors from text:', {
					extractedColorsCount: extractedColors.length,
					extractedColors: extractedColors,
					rawDataPreview: stepData.substring(0, 200)
				});
			}
		}
	}

	function handleApprove() {
		if (onApprove) {
			onApprove();
		}
	}

	function handleEdit() {
		showFeedback = true;
	}

	async function handleRegenerate() {
		if (!userFeedback.trim()) {
			alert('Please provide feedback before regenerating.');
			return;
		}
		
		isRegenerating = true;
		try {
			await onRegenerate(userFeedback);
			showFeedback = false;
			userFeedback = '';
		} catch (error) {
			console.error('Error in regeneration:', error);
		} finally {
			isRegenerating = false;
		}
	}
	
	function cancelFeedback() {
		showFeedback = false;
		userFeedback = '';
	}
	
	function handleRevert() {
		if (confirm('Are you sure you want to revert to the previous version? This will discard the current changes.')) {
			onRevert();
		}
	}
</script>

<Card class="step-slide">
	<CardHeader>
		<!-- Progress Indicator Inside Card -->
		{#if showProgressIndicator}
			<div class="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
				<div class="text-sm font-medium text-muted-foreground">Step {currentStep} of {totalSteps}</div>
				<span class="text-sm font-medium text-orange-500">{progressPercentage}% Complete</span>
			</div>
			
			<!-- Progress Bar -->
			<div class="relative h-1.5 bg-muted/30 rounded-full overflow-hidden mb-4">
				<div 
					class="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out shadow-lg shadow-orange-500/50"
					style="width: {progressPercentage}%"
				></div>
			</div>
		{/if}
		
		<!-- Step Title with Glowing Border -->
		<div class="p-4 rounded-xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/5 to-transparent shadow-lg shadow-orange-500/20">
			<CardTitle class="flex items-center gap-2 step-title">
				<span>{stepTitle}</span>
				{#if isGenerating}
					<Loader2 class="h-4 w-4 animate-spin" />
				{/if}
			</CardTitle>
			<p class="step-description mt-2">{stepDescription}</p>
		</div>
	</CardHeader>
	<CardContent>
		{#if stepData}
			<div class="slide-content">
				{#if stepId === 'brand-positioning'}
					<div class="positioning-slide">
						{#if typeof stepData === 'string'}
							<!-- Display AI-generated content -->
							<div class="ai-generated-content">
								{@html renderMarkdown(stepData)}
							</div>
						{:else}
							<!-- Display structured data -->
							<div class="positioning-statement">
								<p class="statement-text">"{stepData.positioning_statement || ''}"</p>
							</div>
							<div class="slide-sections">
								<div class="slide-section">
									<h3 class="slide-section-title">Mission</h3>
									<p class="slide-text">{stepData.mission || ''}</p>
								</div>
								<div class="slide-section">
									<h3 class="slide-section-title">Vision</h3>
									<p class="slide-text">{stepData.vision || ''}</p>
								</div>
							</div>
							{#if stepData.values && stepData.values.length > 0}
								<div class="slide-section">
									<h3 class="slide-section-title">Brand Values</h3>
									<div class="values-grid">
										{#each stepData.values as value}
											<div class="value-tag">{value}</div>
										{/each}
									</div>
								</div>
							{/if}
							{#if stepData.voice_and_tone}
								<div class="slide-section">
									<h3 class="slide-section-title">Voice & Tone</h3>
									<div class="voice-tone-content">
										<div class="adjectives">
											<h5>Personality Traits:</h5>
											<div class="adjectives-list">
												{#each stepData.voice_and_tone.adjectives as adjective}
													<span class="adjective-tag">{adjective}</span>
												{/each}
											</div>
										</div>
										<div class="guidelines">
											<h5>Communication Style:</h5>
											<p>{stepData.voice_and_tone.guidelines}</p>
										</div>
										{#if stepData.voice_and_tone.sample_lines}
											<div class="sample-lines">
												<h5>Sample Messages:</h5>
												{#each stepData.voice_and_tone.sample_lines as line}
													<p class="sample-line">"{line}"</p>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/if}
					</div>
				{:else if stepId === 'logo-guidelines'}
					<div class="logo-slide">
						<!-- Primary Logo Display -->
						<div class="logo-primary-section">
							<h3 class="slide-section-title">Primary Logo</h3>
							{#if logoData}
								<div class="logo-display">
									<img src={logoData} alt="Brand Logo" class="logo-image" />
								</div>
							{:else}
								<div class="logo-placeholder">
									<div class="logo-placeholder-content">[Logo Placeholder]</div>
								</div>
							{/if}
						</div>
						<!-- Logo Usage Guidelines - Visual Only -->
						<div class="logo-usage-section">
							<h3 class="slide-section-title">Logo Usage Guidelines</h3>
							<div class="usage-grid">
								<!-- Do's Section -->
								<div class="usage-section dos-section">
									<h4 class="usage-title dos-title">✅ DO's</h4>
									<div class="usage-examples">
										{#if logoData}
											<div class="usage-example">
												<div class="example-label">Correct Size</div>
												<div class="logo-example correct">
													<img src={logoData} alt="Correct Logo Usage" class="logo-example-image" />
												</div>
											</div>
											<div class="usage-example">
												<div class="example-label">Proper Spacing</div>
												<div class="logo-example correct">
													<img src={logoData} alt="Correct Logo Usage" class="logo-example-image" />
												</div>
											</div>
											<div class="usage-example">
												<div class="example-label">Clear Background</div>
												<div class="logo-example correct">
													<img src={logoData} alt="Correct Logo Usage" class="logo-example-image" />
												</div>
											</div>
										{:else}
											<div class="no-logo-message">
												<p>Upload a logo to see usage examples</p>
											</div>
										{/if}
									</div>
								</div>
								<!-- Don'ts Section -->
								<div class="usage-section donts-section">
									<h4 class="usage-title donts-title">❌ DON'Ts</h4>
									<div class="usage-examples">
										{#if logoData}
											<div class="usage-example">
												<div class="example-label">Don't Stretch</div>
												<div class="logo-example incorrect">
													<img
														src={logoData}
														alt="Incorrect Logo Usage"
														class="logo-example-image stretched"
													/>
													<div class="x-mark">✕</div>
												</div>
											</div>
											<div class="usage-example">
												<div class="example-label">Don't Distort</div>
												<div class="logo-example incorrect">
													<img
														src={logoData}
														alt="Incorrect Logo Usage"
														class="logo-example-image distorted"
													/>
													<div class="x-mark">✕</div>
												</div>
											</div>
											<div class="usage-example">
												<div class="example-label">Don't Use on Busy Background</div>
												<div class="logo-example incorrect busy-bg">
													<img
														src={logoData}
														alt="Incorrect Logo Usage"
														class="logo-example-image"
													/>
													<div class="x-mark">✕</div>
												</div>
											</div>
										{:else}
											<div class="no-logo-message">
												<p>Upload a logo to see usage examples</p>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else if stepId === 'color-palette'}
					<div class="colors-slide">
						<!-- Visual Color Palette Only -->
						<h3 class="section-title">Brand Colors</h3>
						<div class="colors-grid">
							{#if typeof stepData === 'string'}
								<!-- Try to parse as JSON first, fallback to text extraction -->
								{@const parsedData = (() => {
									try {
										// First try parsing as-is
										return JSON.parse(stepData);
									} catch {
										try {
											// Try removing markdown code blocks if present
											const cleanedData = stepData.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
											return JSON.parse(cleanedData);
										} catch {
											return null;
										}
									}
								})()}
								
								{#if parsedData}
									<!-- Display JSON structured colors -->
									{#each parsedData.primary || [] as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
												<div class="color-usage">{color.usage || ''}</div>
											</div>
										</div>
									{/each}
									{#each parsedData.secondary || [] as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
												<div class="color-usage">{color.usage || ''}</div>
											</div>
										</div>
									{/each}
									{#each parsedData.accent || [] as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
												<div class="color-usage">{color.usage || ''}</div>
											</div>
										</div>
									{/each}
									{#each parsedData.neutrals || [] as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
												<div class="color-usage">{color.usage || ''}</div>
											</div>
										</div>
									{/each}
									{#each parsedData.background || [] as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
												<div class="color-usage">{color.usage || ''}</div>
											</div>
										</div>
									{/each}
								{:else}
									<!-- Fallback: Extract colors from markdown text -->
									{@const extractedColors = extractColorsFromText(stepData)}
									{#each extractedColors as color}
										<div class="color-swatch">
											<div class="color-preview" style="background-color: {color.hex}"></div>
											<div class="color-info">
												<div class="color-name">{color.name}</div>
												<div class="color-hex">{color.hex}</div>
											</div>
										</div>
									{/each}
									{#if extractedColors.length === 0}
										<div class="no-colors-message">
											<p>No colors found in response</p>
										</div>
									{/if}
								{/if}
							{:else}
								{#each stepData.colors?.core_palette || [] as color}
									<div class="color-swatch">
										<div class="color-preview" style="background-color: {color.hex}"></div>
										<div class="color-info">
											<div class="color-name">{color.name}</div>
											<div class="color-hex">{color.hex}</div>
										</div>
									</div>
								{/each}
							{/if}
						</div>

						<!-- Color Combinations Preview -->
						{#if typeof stepData === 'string'}
							{@const extractedColors = extractColorsFromText(stepData)}
							{#if extractedColors.length >= 2}
								<div class="color-combinations">
									<h4 class="section-subtitle">Color Combinations</h4>
									<div class="combination-examples">
										<div class="combination-example">
											<div
												class="combo-primary"
												style="background-color: {extractedColors[0].hex}"
											></div>
											<div
												class="combo-secondary"
												style="background-color: {extractedColors[1].hex}"
											></div>
											<span class="combo-label">Primary + Secondary</span>
										</div>
										{#if extractedColors.length >= 3}
											<div class="combination-example">
												<div
													class="combo-primary"
													style="background-color: {extractedColors[0].hex}"
												></div>
												<div
													class="combo-neutral"
													style="background-color: {extractedColors[2].hex}"
												></div>
												<span class="combo-label">Primary + Accent</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/if}
					</div>
				{:else if stepId === 'typography'}
					<div class="typography-slide">
						{#if typeof stepData === 'string'}
							{@const fontInfo = extractFontInfo(stepData)}
							<!-- Debug: Log font extraction results -->
							{console.log('Typography stepData:', stepData)}
							{console.log('Extracted fontInfo:', fontInfo)}
							{#if fontInfo.primary || fontInfo.supporting}
								<!-- Compute font families for display -->
								{@const primaryFontName = fontInfo.primary?.name}
								{@const supportingFontName = fontInfo.supporting?.name}
								{@const primaryFontFamily = primaryFontName ? getFontFamily(primaryFontName) : 'sans-serif'}
								{@const supportingFontFamily = supportingFontName ? getFontFamily(supportingFontName) : 'sans-serif'}
								
								<!-- Visual typography display like professional examples -->
								{#if fontInfo.primary}
									<div class="typography-section">
										<h3 class="section-title">Primary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: {primaryFontFamily};"
											>
												{fontInfo.primary.name}
											</div>
											<div
												class="character-set"
												style="font-family: {primaryFontFamily};"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br />
												0123456789
											</div>
											<div class="font-weights-grid">
												{#each fontInfo.weights as weight}
													<div
														class="weight-sample"
														style="font-family: {primaryFontFamily}; font-weight: {weight === 'bold'
															? 'bold'
															: weight === 'light'
																? '300'
																: weight === 'medium'
																	? '500'
																	: weight === 'semibold'
																		? '600'
																		: 'normal'};"
													>
														{weight.charAt(0).toUpperCase() + weight.slice(1)}
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/if}

								{#if fontInfo.supporting}
									<div class="typography-section">
										<h3 class="section-title">Secondary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: {supportingFontFamily};"
											>
												{fontInfo.supporting.name}
											</div>
											<div
												class="character-set"
												style="font-family: {supportingFontFamily};"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br />
												0123456789
											</div>
										</div>
									</div>
								{/if}
							{:else}
								{@const fallbackFonts = extractFallbackFonts(stepData)}
								<!-- Show raw typography content for debugging -->
								<div class="typography-section">
									<h3 class="section-title">Typography Content (Debug)</h3>
									<div class="font-display">
										<pre
											style="background: #f5f5f5; padding: 1rem; border-radius: 8px; font-size: 12px; overflow-x: auto;">{stepData}</pre>
									</div>
								</div>

								<!-- Try to show extracted fonts even if main extraction failed -->
								{#if fallbackFonts.primary}
									{@const fallbackPrimaryFamily = getFontFamily(fallbackFonts.primary)}
									<div class="typography-section">
										<h3 class="section-title">Primary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: {fallbackPrimaryFamily};"
											>
												{fallbackFonts.primary}
											</div>
											<div
												class="character-set"
												style="font-family: {fallbackPrimaryFamily};"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br />
												0123456789
											</div>
											<div class="font-weights-grid">
												<div
													class="weight-sample"
													style="font-family: {fallbackPrimaryFamily}; font-weight: normal;"
												>
													Regular
												</div>
												<div
													class="weight-sample"
													style="font-family: {fallbackPrimaryFamily}; font-weight: bold;"
												>
													Bold
												</div>
												<div
													class="weight-sample"
													style="font-family: {fallbackPrimaryFamily}; font-style: italic;"
												>
													Italic
												</div>
											</div>
										</div>
									</div>
								{/if}

								{#if fallbackFonts.supporting}
									{@const fallbackSupportingFamily = getFontFamily(fallbackFonts.supporting)}
									<div class="typography-section">
										<h3 class="section-title">Secondary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: {fallbackSupportingFamily};"
											>
												{fallbackFonts.supporting}
											</div>
											<div
												class="character-set"
												style="font-family: {fallbackSupportingFamily};"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br />
												0123456789
											</div>
										</div>
									</div>
								{/if}

								<!-- Final fallback: Show placeholder typography with generic names -->
								{#if !fallbackFonts.primary && !fallbackFonts.supporting}
									<div class="typography-section">
										<h3 class="section-title">Primary Typeface (Fallback)</h3>
										<div class="font-display">
											<div class="font-name-large" style="font-family: 'Georgia', serif;">
												Georgia
											</div>
											<div class="character-set" style="font-family: 'Georgia', serif;">
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
												0123456789
											</div>
											<div class="font-weights-grid">
												<div
													class="weight-sample"
													style="font-family: 'Georgia', serif; font-weight: normal;"
												>
													Regular
												</div>
												<div
													class="weight-sample"
													style="font-family: 'Georgia', serif; font-weight: bold;"
												>
													Bold
												</div>
												<div
													class="weight-sample"
													style="font-family: 'Georgia', serif; font-style: italic;"
												>
													Italic
												</div>
											</div>
										</div>
									</div>

									<div class="typography-section">
										<h3 class="section-title">Secondary Typeface (Fallback)</h3>
										<div class="font-display">
											<div class="font-name-large" style="font-family: 'Arial', sans-serif;">
												Arial
											</div>
											<div class="character-set" style="font-family: 'Arial', sans-serif;">
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
												0123456789
											</div>
										</div>
									</div>
								{/if}
							{/if}
						{:else}
							<h3 class="section-title">Font System</h3>
							<div class="font-sections">
								<div class="font-section">
									<h4 class="font-title">Primary Font</h4>
									<div
										class="font-display"
										style="font-family: {stepData.primary_font || 'Inter, sans-serif'}"
									>
										<div class="font-name">{stepData.primary_font || 'Inter'}</div>
										<div class="font-sample">The quick brown fox jumps over the lazy dog</div>
										<div class="font-usage">
											{stepData.primary_usage || 'Headings and important text'}
										</div>
									</div>
								</div>
								<div class="font-section">
									<h4 class="font-title">Secondary Font</h4>
									<div
										class="font-display"
										style="font-family: {stepData.secondary_font || 'Roboto, sans-serif'}"
									>
										<div class="font-name">{stepData.secondary_font || 'Roboto'}</div>
										<div class="font-sample">The quick brown fox jumps over the lazy dog</div>
										<div class="font-usage">
											{stepData.secondary_usage || 'Body text and descriptions'}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{:else if stepId === 'iconography'}
					<div class="iconography-slide">
						<!-- Visual Icons Only -->
						<h3 class="section-title">Icon System</h3>
						<div class="icon-sections">
							{#if typeof stepData === 'object' && stepData.icons}
								{#if stepData.icons.length > 0}
									<div class="icon-examples">
										<h4 class="section-subtitle">Brand Icons</h4>
										<div class="icon-gallery icon-mini-gallery">
											{#each stepData.icons.filter((icon) => !!icon?.name).slice(0, 32) as iconData}
												<div class="icon-mini">
													<button
														type="button"
														class="icon-copy-btn icon-mini-copy"
														on:click={() => copyIconLabel(iconData.name)}
														aria-label="Copy icon name"
													>
														{#if copiedIconName === iconData.name}
															<Check class="h-3 w-3" />
														{:else}
															<Copy class="h-3 w-3" />
														{/if}
													</button>
													<div class="icon-mini-preview">
														<DynamicIcon
															name={iconData.name}
															size={36}
															color="#ff6a2a"
															strokeWidth={2}
															class="icon-illustration"
														/>
													</div>
													<div class="icon-mini-label">{iconData.name}</div>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="no-icons-message">
										<p>Icons will appear here once generated.</p>
									</div>
								{/if}
							{:else if typeof stepData === 'string'}
								<!-- Extract icons from AI response and display visually -->
								{@const extractedIcons = extractIconsFromText(stepData)}
								{#if extractedIcons.length > 0}
									<div class="icon-examples">
										<h4 class="section-subtitle">Brand Icons</h4>
										<div class="icon-gallery icon-mini-gallery">
											{#each extractedIcons.filter((icon) => !!icon?.name).slice(0, 32) as iconData}
												<div class="icon-mini">
													<button
														type="button"
														class="icon-copy-btn icon-mini-copy"
														on:click={() => copyIconLabel(iconData.name)}
														aria-label="Copy icon name"
													>
														{#if copiedIconName === iconData.name}
															<Check class="h-3 w-3" />
														{:else}
															<Copy class="h-3 w-3" />
														{/if}
													</button>
													<div class="icon-mini-preview">
														<DynamicIcon
															name={iconData.name}
															size={36}
															color="#ff6a2a"
															strokeWidth={2}
															class="icon-illustration"
														/>
													</div>
													<div class="icon-mini-label">{iconData.name}</div>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="no-icons-message">
										<p></p>
									</div>
								{/if}
							{:else}
								<div class="icon-style-section">
									<h4 class="section-subtitle">Style Guidelines</h4>
									<div class="icon-specs">
										<div class="spec-item">
											<span class="spec-label">Grid:</span>
											<span class="spec-value">{stepData.grid || ''}</span>
										</div>
										<div class="spec-item">
											<span class="spec-label">Stroke:</span>
											<span class="spec-value">{stepData.stroke || ''}</span>
										</div>
									</div>
								</div>
								<div class="icon-examples">
									<h4 class="section-subtitle">Specific Icons</h4>
									<div class="icon-list">
										{#if stepData.specific_icons && stepData.specific_icons.length > 0}
											{#each stepData.specific_icons as icon}
												<div class="icon-item">
													<div class="icon-display">
														<div class="icon-name">{icon}</div>
													</div>
												</div>
											{/each}
										{:else}
											<div class="no-icons-message">
												<p>AI will generate domain-specific icons based on your brand inputs</p>
											</div>
										{/if}
									</div>
								</div>
							{:else}
								<div class="icon-examples">
									<h4 class="section-subtitle">Specific Icons</h4>
									{#if stepData.specific_icons && stepData.specific_icons.length > 0}
										<div class="icon-list">
											{#each stepData.specific_icons as icon}
												<div class="icon-item">
													<div class="icon-display">
														<div class="icon-name">{icon}</div>
													</div>
												</div>
											{/each}
										</div>
									{:else}
										<div class="no-icons-message">
											<p>AI will generate domain-specific icons based on your brand inputs</p>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{:else if stepId === 'photography'}
					<div class="photography-slide">
						<h3 class="section-title">Photography</h3>
						<div class="photo-grid">
							<div class="photo-example">
								<div class="photo-placeholder team">
									<div class="photo-icon">📸</div>
									<span class="photo-label">Photography</span>
								</div>
							</div>
						</div>
					</div>
				{:else if stepId === 'applications'}
					<div class="applications-slide">
						<h3 class="section-title">Applications</h3>
						<div class="applications-grid">
							<div class="application-item">
								<div class="app-icon">📄</div>
								<h4 class="app-name">Brand Applications</h4>
							</div>
						</div>
					</div>
				{:else}
					<!-- Default content display for other step types -->
					<div class="default-content">
						<div class="content-preview">
							{#if typeof stepData === 'string'}
								{@html renderMarkdown(stepData)}
							{:else if typeof stepData === 'object' && stepData.sections && stepData.sections.length}
								<div class="generic-content">
									{#if stepData.summary}
										<p class="generic-summary">{stepData.summary}</p>
									{/if}
									<div class="generic-sections">
										{#each stepData.sections as section, idx}
											<div class="generic-section">
												<div class="generic-section-header">
													<span class="generic-section-step">{idx + 1}</span>
													<div>
														<h4>{section.title || `Section ${idx + 1}`}</h4>
														{#if section.subtitle}
															<p class="generic-subtitle">{section.subtitle}</p>
														{/if}
													</div>
												</div>
												{#if section.description}
													<p class="generic-description">{section.description}</p>
												{/if}
												{#if section.points && section.points.length}
													<ul>
														{#each section.points as point}
															<li>{point}</li>
														{/each}
													</ul>
												{/if}
												{#if section.examples && section.examples.length}
													<div class="generic-examples">
														{#each section.examples as example}
															<div class="generic-example">{example}</div>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div class="text-muted-foreground">Content will appear here once this step finishes generating.</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			{#if !readOnly && !showFeedback}
				<div class="approval-actions">
					{#if !isApproved && showApproveButton}
						<Button onclick={handleApprove} class="approve-btn bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30">
							<ThumbsUp class="mr-2 h-4 w-4" />
							Approve & Continue
						</Button>
						<Button variant="outline" onclick={handleEdit} class="reject-btn border-border/50 hover:bg-muted">
							<ThumbsDown class="mr-2 h-4 w-4" />
							Request Changes
						</Button>
					{:else if isApproved || (!showApproveButton && !isGenerating)}
						<Button variant="outline" onclick={handleEdit} class="edit-btn border-border/50 hover:bg-muted">
							<Edit class="mr-2 h-4 w-4" />
							Edit This Step
						</Button>
						{#if canRevert}
							<Button variant="outline" onclick={handleRevert} class="revert-btn border-border/50 hover:bg-muted">
								<RefreshCw class="mr-2 h-4 w-4" />
								Revert to Previous
							</Button>
						{/if}
					{/if}
				</div>
			{/if}
			
			<!-- Navigation Buttons -->
			{#if showNavigationButtons && !showFeedback}
				<div class="flex items-center justify-between gap-4 pt-6 border-t border-border/50 mt-6">
					<Button
						variant="outline"
						size="lg"
						onclick={onPrevious}
						disabled={!canGoPrevious}
						class="flex-1 border-border/50 hover:bg-muted transition-all duration-300 disabled:opacity-50"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="m15 18-6-6 6-6"/></svg>
						Previous
					</Button>
					
					{#if showCompleteButton}
						<Button
							size="lg"
							onclick={onComplete}
							class="flex-1 group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
						>
							<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
							<CheckCircle class="mr-2 h-5 w-5" />
							<span class="text-base font-semibold">Save Brand Guidelines</span>
						</Button>
					{:else if canGoNext}
						<Button
							size="lg"
							onclick={onNext}
							class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all duration-300"
						>
							Next
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><path d="m9 18 6-6-6-6"/></svg>
						</Button>
					{:else}
						<Button
							size="lg"
							disabled
							class="flex-1 opacity-50"
						>
							Approve step to continue
						</Button>
					{/if}
				</div>
			{/if}

			<!-- Feedback Section -->
			{#if !readOnly && showFeedback}
				<div class="feedback-section">
					<label for="feedback-{stepIndex}" class="feedback-label">What would you like to change?</label>
					<textarea
						id="feedback-{stepIndex}"
						bind:value={userFeedback}
						placeholder="Please describe what you'd like to modify in this section..."
						rows="3"
						class="feedback-textarea"
					></textarea>
					<div class="feedback-actions">
						<Button
							onclick={handleRegenerate}
							disabled={isRegenerating || !userFeedback.trim()}
							class="regenerate-btn"
						>
							{#if isRegenerating}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<RefreshCw class="mr-2 h-4 w-4" />
							{/if}
							Regenerate with Feedback
						</Button>
						<Button variant="outline" onclick={cancelFeedback}>Cancel</Button>
					</div>
				</div>
			{/if}
		{:else if !isGenerating}
			<div class="no-content">
				<p class="text-sm text-muted-foreground">Ready to generate {stepTitle.toLowerCase()} guidelines?</p>
			</div>
		{/if}
	</CardContent>
</Card>

<style>
	.step-slide {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
		min-height: 600px;
		max-height: 800px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Step title in card header - ensure theme-aware color */
	:global(.step-slide [data-slot="card-title"].step-title),
	:global(.step-slide .step-title),
	:global(.step-slide [data-slot="card-title"]) {
		color: oklch(var(--foreground)) !important;
	}

	/* Step description - ensure theme-aware color, matching title */
	.step-slide :global(.step-description),
	.step-slide :global([data-slot="card-header"] p) {
		font-size: 0.875rem;
		color: oklch(var(--foreground)) !important;
		margin-top: 0.25rem;
		opacity: 0.9;
	}

	.step-slide::-webkit-scrollbar {
		width: 6px;
	}

	.step-slide::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	.step-slide::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.step-slide::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.slide-content {
		margin-bottom: 2rem;
	}

	/* AI-generated content - ensure theme-aware text color */
	.ai-generated-content {
		color: oklch(var(--foreground));
	}

	/* Ensure all text elements inside ai-generated-content use theme color */
	.ai-generated-content :global(p),
	.ai-generated-content :global(span),
	.ai-generated-content :global(div),
	.ai-generated-content :global(li),
	.ai-generated-content :global(ul),
	.ai-generated-content :global(ol) {
		color: oklch(var(--foreground));
	}

	.ai-generated-content :global(strong),
	.ai-generated-content :global(b) {
		color: oklch(var(--foreground));
		font-weight: 600;
	}

	/* Slide text - ensure theme-aware text color */
	.slide-text {
		color: oklch(var(--foreground));
	}

	/* Positioning Slide Styles */
	.positioning-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.positioning-statement {
		background: linear-gradient(135deg, #f1f5ff 0%, #e0f2ff 50%, #fef3c7 100%);
		color: #0f172a;
		padding: 2rem;
		border-radius: 16px;
		text-align: center;
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 8px 30px rgba(15, 23, 42, 0.08);
	}

	.statement-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.statement-text {
		font-size: 1.2rem;
		font-weight: 500;
		line-height: 1.5;
		color: #0f172a;
		text-shadow: none;
		opacity: 0.9;
	}

	.mission-vision-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	@media (max-width: 768px) {
		.mission-vision-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.mission-section,
	.vision-section {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: oklch(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.section-text {
		color: oklch(var(--foreground));
		line-height: 1.5;
	}

	.values-section {
		background: #f0fdf4;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #22c55e;
	}

	.values-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.value-tag {
		background: #22c55e;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Voice & Tone Section */
	.voice-tone-section {
		background: #fef3c7;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #fde68a;
	}

	.voice-tone-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.adjectives h5,
	.guidelines h5,
	.sample-lines h5 {
		font-size: 1rem;
		font-weight: 600;
		color: #92400e;
		margin-bottom: 0.5rem;
	}

	.adjectives-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.adjective-tag {
		background: #fef3c7;
		color: #92400e;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #fde68a;
	}

	.guidelines p {
		color: #374151;
		line-height: 1.5;
		margin: 0;
	}

	.sample-line {
		color: #6b7280;
		font-style: italic;
		margin: 0.25rem 0;
		font-size: 0.875rem;
	}

	/* Logo Slide Styles */
	.logo-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.logo-display-section {
		text-align: center;
	}

	.logo-placeholder {
		background: #f3f4f6;
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		padding: 3rem;
		margin: 1rem 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
	}

	.logo-placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.logo-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.logo-text {
		color:rgb(0, 0, 0);
		font-size: 1.125rem;
		font-weight: 500;
	}

	.logo-subtext {
		color:rgb(255, 255, 255);
		font-size: 0.875rem;
	}

	.logo-display {
		background:rgb(243, 241, 241);
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		margin: 1rem 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
	}

	.logo-image {
		max-width: 100%;
		max-height: 120px;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	/* Logo Examples */
	.logo-examples {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.examples-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 1rem;
	}

	.example-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.logo-example {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: white;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		transition: transform 0.2s ease;
	}

	.logo-example:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.logo-example.correct {
		border-color: #10b981;
		background:rgb(243, 240, 253);
	}

	.logo-example.incorrect {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.example-logo {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.example-logo.stretched {
		transform: scaleX(1.5);
	}

	.example-logo.distorted {
		transform: skew(20deg, 10deg);
	}

	.logo-example-image.stretched {
		transform: scaleX(1.5);
	}

	.logo-example-image.distorted {
		transform: skew(10deg, 5deg);
	}

	.example-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
		font-weight: 500;
	}

	.x-mark {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #ef4444;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.logo-example.busy-bg {
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
		background-size: 20px 20px;
		animation: busyBackground 2s linear infinite;
	}

	@keyframes busyBackground {
		0% {
			background-position: 0 0;
		}
		100% {
			background-position: 20px 20px;
		}
	}

	.x-mark {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #ef4444;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.no-logo-message {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
	}

	.no-colors-message {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
		grid-column: 1 / -1;
	}

	.no-icons-message {
		text-align: center;
		padding: 2rem;
		color: oklch(var(--muted-foreground));
		font-style: italic;
	}

	.icon-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid oklch(var(--border));
		border-radius: 8px;
		background: oklch(var(--card));
		color: oklch(var(--foreground));
		box-shadow: 0 1px 3px oklch(var(--foreground) / 0.08);
		transition: all 0.2s ease;
		width: 100%;
		box-sizing: border-box;
	}

	:global(.dark) .icon-display {
		background: oklch(var(--muted));
	}

	.icon-display:hover {
		border-color: oklch(var(--accent));
		box-shadow: 0 2px 8px oklch(var(--accent) / 0.12);
	}

	.icon-symbol {
		display: flex;
		align-items: center;
		justify-content: center;
		color: inherit;
	}
	
	.icon-symbol :global(svg) {
		width: 32px;
		height: 32px;
	}

	.icon-name {
		font-size: 0.875rem;
		color: oklch(var(--muted-foreground));
		text-align: center;
		font-weight: 500;
		text-transform: capitalize;
	}

	.icon-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.icon-mini-gallery {
		margin-top: 0.5rem;
	}

	.icon-mini {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem;
		min-height: 120px;
	}

	.icon-mini-preview {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 106, 42, 0.6);
		border-radius: 12px;
	}

	.icon-mini-preview :global(svg) {
		width: 32px;
		height: 32px;
		color: #ff6a2a;
		stroke: #ff6a2a !important;
	}

	.icon-mini-label {
		text-transform: uppercase;
		font-weight: 600;
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		text-align: center;
		color: #ff6a2a;
	}

	.icon-copy-btn {
		border: none;
		background: rgba(255, 122, 69, 0.18);
		color: #ff6a2a;
		border-radius: 9999px;
		padding: 0.35rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
	}

	:global(.dark) .icon-copy-btn {
		background: rgba(255, 122, 69, 0.28);
		color: #ffd4c3;
	}

	.icon-copy-btn:hover {
		background: rgba(255, 122, 69, 0.35);
		transform: scale(1.05);
	}

	.icon-mini-copy {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: rgba(255, 106, 42, 0.1);
	}

	.logo-guidelines-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.dos-section {
		background: #f0fdf4;
		border: 2px solid #22c55e;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.donts-section {
		background: #fef2f2;
		border: 2px solid #ef4444;
		border-radius: 8px;
		padding: 1.5rem;
	}

	/* Usage title colors - black in light mode, dark grey in dark mode */
	.usage-title.dos-title,
	.usage-title.donts-title {
		/* Light mode: black */
		color: oklch(0.2686 0 0);
	}

	/* Dark mode: dark grey */
	:global(.dark) .usage-title.dos-title,
	:global(.dark) .usage-title.donts-title {
		color: oklch(0.6 0 0); /* Dark grey */
	}

	.guideline-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.guideline-title.dos {
		color: #16a34a;
	}

	.guideline-title.donts {
		color: #dc2626;
	}

	.guideline-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.guideline-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.guideline-item:last-child {
		border-bottom: none;
	}

	.guideline-item.dos {
		color: #16a34a;
	}

	.guideline-item.donts {
		color: #dc2626;
	}

	/* Colors Slide Styles */
	.colors-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.colors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.color-swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background:rgb(247, 217, 165);
		border: 1px solidrgb(255, 255, 255);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 247, 185, 0.1);
	}

	.color-preview {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.color-info {
		text-align: center;
	}

	.color-name {
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.color-hex {
		font-size: 0.875rem;
		color:rgb(0, 0, 0);
		font-family: monospace;
		margin-bottom: 0.5rem;
	}

	.color-usage {
		font-size: 0.75rem;
		color:rgb(54, 53, 53);
	}

	/* Color Combinations */
	.color-combinations {
		margin-top: 2rem;
		padding: 1.5rem;
		background:rgb(247, 32, 32);
		border-radius: 8px;
		border: 1px solidrgb(248, 180, 7);
	}

	.combination-examples {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
	}

	.combination-example {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.combo-primary,
	.combo-secondary,
	.combo-neutral {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.combo-label {
		font-size: 0.875rem;
		color:rgb(22, 94, 236);
		font-weight: 500;
	}

	/* Typography Slide Styles */
	.typography-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.font-sections {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.font-section {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.font-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.font-display {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.font-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.font-sample {
		font-size: 1rem;
		color: #374151;
		line-height: 1.5;
	}

	.font-usage {
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Iconography Slide Styles */
	.iconography-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.icon-sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.icon-style-section {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.section-subtitle {
		font-size: 1rem;
		font-weight: 600;
		color: oklch(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.style-description {
		color: #6b7280;
		line-height: 1.5;
	}

	.icon-examples {
		/* Light mode: light background for icon visibility */
		background: oklch(var(--card));
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid oklch(var(--border));
		width: 100%;
		overflow-x: auto;
		overflow-y: visible;
	}

	/* Dark mode: slightly darker background for better icon contrast */
	:global(.dark) .icon-examples {
		background: oklch(var(--muted));
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.icon-list {
		display: flex !important;
		flex-direction: row !important;
		flex-wrap: wrap !important;
		gap: 1rem;
		margin-top: 1rem;
		justify-content: flex-start;
		align-items: flex-start;
		width: 100%;
	}

	/* Force horizontal layout for icon items */
	.icon-list > .icon-item {
		display: flex !important;
		flex-direction: column !important;
		align-items: center;
		flex: 0 0 auto !important;
		width: 120px !important;
		max-width: 150px;
		min-width: 100px;
		flex-shrink: 0 !important;
		margin: 0;
	}

	.icon-placeholder {
		background:rgb(169, 241, 0);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		font-size: 1.5rem;
	}

	.icon-specs {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.spec-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.spec-item:last-child {
		border-bottom: none;
	}

	.spec-label {
		font-weight: 500;
		color: #374151;
	}

	.spec-value {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.icon-example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: pink;
		border: 1px solidrgb(240, 142, 14);
		border-radius: 8px;
		transition: transform 0.2s ease;
	}

	.icon-example:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.icon-svg {
		width: 24px;
		height: 24px;
		color: #6b7280;
	}

	.icon-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
	}

	/* Photography Slide Styles */
	.photography-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.photo-sections {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.mood-section {
		background: #f0fdf4;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #22c55e;
	}

	.mood-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.mood-tag {
		background: #22c55e;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.photo-examples {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.photo-placeholder {
		background: #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		font-size: 2rem;
	}

	.photo-example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.photo-placeholder.team {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	}

	.photo-placeholder.office {
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	}

	.photo-placeholder.product {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	}

	.photo-placeholder.tech {
		background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
	}

	.photo-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.photo-label {
		font-size: 0.875rem;
		color: #374151;
		font-weight: 500;
		text-align: center;
	}

	.style-description {
		margin-top: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 6px;
		border-left: 4px solid #3b82f6;
	}

	.style-description p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	/* Applications Slide Styles */
	.applications-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
	}

	.applications-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.application-item {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.application-item:hover {
		transform: translateY(-2px);
	}

	.app-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.app-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.app-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.4;
	}

	/* Approval Actions */
	.approval-actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.approve-btn {
		background: #10b981;
		border-color: #10b981;
	}

	.approve-btn:hover {
		background: #059669;
		border-color: #059669;
	}

	.reject-btn {
		border-color: #ef4444;
		color: #ef4444;
	}

	.reject-btn:hover {
		background: #ef4444;
		color: white;
	}
	
	.edit-btn {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.edit-btn:hover {
		background: #3b82f6;
		color: white;
	}
	
	.revert-btn {
		border-color: #f59e0b;
		color: #f59e0b;
	}

	.revert-btn:hover {
		background: #f59e0b;
		color: white;
	}

	/* Feedback Section */
	.feedback-section {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 8px;
		padding: 1.5rem;
		margin-top: 1rem;
	}

	.feedback-label {
		display: block;
		font-weight: 500;
		color: #92400e;
		margin-bottom: 0.5rem;
	}

	.feedback-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d97706;
		border-radius: 6px;
		font-size: 0.875rem;
		resize: vertical;
		margin-bottom: 1rem;
	}

	.feedback-actions {
		display: flex;
		gap: 1rem;
	}

	.regenerate-btn {
		background: #f59e0b;
		border-color: #f59e0b;
	}

	.regenerate-btn:hover {
		background: #d97706;
		border-color: #d97706;
	}

	/* Default Content */
	.default-content {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.content-preview {
		font-size: 0.875rem;
		line-height: 1.6;
		color: #374151;
	}

	.generic-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.generic-summary {
		font-size: 0.95rem;
		color: #475467;
		margin: 0;
	}

	.generic-sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.generic-section {
		border: 1px solid #f0f0f0;
		border-radius: 12px;
		padding: 1rem;
		background: #fff;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
	}

	.generic-section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.generic-section-step {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #ffeede;
		color: #b45309;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.generic-section-header h4 {
		margin: 0;
		font-size: 1rem;
	}

	.generic-subtitle {
		margin: 0.1rem 0 0;
		color: #6b7280;
		font-size: 0.85rem;
	}

	.generic-description {
		margin: 0 0 0.5rem;
		color: #475467;
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.generic-section ul {
		margin: 0.25rem 0 0;
		padding-left: 1rem;
		color: #475467;
		font-size: 0.9rem;
	}

	.generic-examples {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.generic-example {
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: #f1f5f9;
		font-size: 0.8rem;
		color: #475467;
	}

	.no-content {
		text-align: center;
		padding: 2rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.step-slide {
			max-width: 100%;
			padding: 0.5rem;
			min-height: 500px;
			max-height: 600px;
		}

		.mission-vision-grid,
		.logo-guidelines-grid,
		.font-sections,
		.icon-sections,
		.photo-sections {
			flex-direction: column;
		}

		.colors-grid,
		.applications-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.approval-actions {
			flex-direction: column;
		}

		.feedback-actions {
			flex-direction: column;
		}

		.positioning-slide,
		.logo-slide,
		.colors-slide,
		.typography-slide,
		.iconography-slide,
		.photography-slide,
		.applications-slide {
			gap: 1rem;
		}
	}


	.guidelines-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.summary-item {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.summary-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.summary-value {
		font-size: 1rem;
		font-weight: 500;
		color: #1f2937;
		margin: 0;
	}

	.guidelines-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.guideline-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.section-header {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	/* Brand Positioning Review Styles */
	.positioning-statement-review {
		background: #f0f9ff;
		border: 1px solid #0ea5e9;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.statement-text {
		font-size: 1rem;
		font-style: italic;
		color: #0369a1;
		margin: 0;
		text-align: center;
	}

	.mission-vision-item {
		margin-bottom: 0.75rem;
		color: #374151;
	}

	.voice-tone-review {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 1rem;
	}

	.voice-adjectives {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}

	.voice-tag {
		background: #f59e0b;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.voice-guidelines {
		color: #92400e;
		margin: 0.5rem 0 0 0;
		font-size: 0.875rem;
	}

	/* Logo Review Styles */
	.logo-review {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.logo-item {
		color: #374151;
		font-size: 0.875rem;
	}

	/* Color Review Styles */
	.colors-review-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.color-review-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.color-swatch-review {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.color-details {
		flex: 1;
		min-width: 0;
	}

	.color-name-review {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.875rem;
	}

	.color-hex-review {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: monospace;
	}

	.color-usage-review {
		font-size: 0.75rem;
		color: #9ca3af;
		line-height: 1.3;
	}

	/* Typography Review Styles */
	.typography-review {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.font-review-item {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.font-usage-text {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	/* Iconography Review Styles */
	.iconography-review {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.icon-spec-item {
		background: #f0f9ff;
		border: 1px solid #0ea5e9;
		border-radius: 6px;
		padding: 0.75rem;
		color: #374151;
		font-size: 0.875rem;
	}

	/* Photography Review Styles */
	.photography-review {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mood-tags-review {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.mood-tag-review {
		background: #22c55e;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.photo-guidelines {
		background: #f0fdf4;
		border: 1px solid #22c55e;
		border-radius: 8px;
		padding: 1rem;
		color: #166534;
		margin: 0;
		font-size: 0.875rem;
	}

	/* Applications Review Styles */
	.applications-review {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.app-review-item {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.app-context {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.app-description-review {
		color: #6b7280;
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.layout-notes {
		margin: 0;
		padding-left: 1rem;
	}

	.layout-note {
		color: #374151;
		font-size: 0.75rem;
		margin-bottom: 0.25rem;
	}

	/* Legal Contact Review Styles */
	.legal-contact-review {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.contact-item {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 0.75rem;
		color: #374151;
		font-size: 0.875rem;
	}

	/* Accumulated Content Styles */
	.accumulated-content {
		margin-top: 2rem;
	}

	.content-header {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.content-sections {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.content-sections strong {
		color: #2563eb;
		font-weight: 600;
	}

	.content-sections hr {
		border: none;
		border-top: 2px solid #e5e7eb;
		margin: 1.5rem 0;
	}

	.content-sections::-webkit-scrollbar {
		width: 6px;
	}

	.content-sections::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	.content-sections::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.content-sections::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	@media (max-width: 480px) {
		.step-slide {
			min-height: 400px;
			max-height: 500px;
		}

		.positioning-slide,
		.logo-slide,
		.colors-slide,
		.typography-slide,
		.iconography-slide,
		.photography-slide,
		.applications-slide {
			padding: 0.5rem;
			gap: 0.75rem;
		}

		.guidelines-summary {
			grid-template-columns: 1fr;
		}

		.colors-review-grid {
			grid-template-columns: 1fr;
		}

		.applications-review {
			grid-template-columns: 1fr;
		}

		.legal-contact-review {
			grid-template-columns: 1fr;
		}
	}

	/* Typography Visual Display Styles */
	.typography-section {
		margin-bottom: 2rem;
	}

	.typography-section .section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: oklch(var(--foreground));
		margin-bottom: 1rem;
		border-bottom: 2px solid oklch(var(--border));
		padding-bottom: 0.5rem;
	}

	.font-display {
		background:rgb(240, 240, 240);
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 1rem;
	}

	.font-name-large {
		font-size: 2.5rem;
		font-weight: 700;
		color:rgb(29, 30, 31);
		margin-bottom: 1rem;
		letter-spacing: 0.05em;
	}

	.character-set {
		font-size: 1.1rem;
		color: #495057;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		letter-spacing: 0.02em;
	}

	.font-weights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.8rem;
		margin-top: 1rem;
	}

	.weight-sample {
		background: #ffffff;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 0.6rem;
		font-size: 0.8rem;
		color: #495057;
		text-align: center;
		transition: transform 0.2s ease;
	}

	.weight-sample:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
</style>