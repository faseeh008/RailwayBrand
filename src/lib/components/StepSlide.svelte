<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { CheckCircle, XCircle, Loader2, ThumbsUp, ThumbsDown, RefreshCw, Edit } from 'lucide-svelte';

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
	
	// Internal state for feedback
	let showFeedback = false;
	let userFeedback = '';
	let isRegenerating = false;

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
			
			// New markdown format: [Color name] - #hexcode
			let colorMatch = line.match(/^\s*\[([^\]]+)\]\s*-\s*(#[0-9A-Fa-f]{6})\s*$/);
			
			// Original format: [Color Name] - #HEXCODE - [description]
			if (!colorMatch) {
				colorMatch = line.match(/([^-]+)\s*-\s*(#[0-9A-Fa-f]{6})\s*-\s*(.+)/);
			}
			if (!colorMatch) {
				colorMatch = line.match(/^\s*([^-]+)\s*-\s*(#[0-9A-Fa-f]{6})\s*-\s*(.+)$/); // With line start/end
			}
			if (!colorMatch) {
				colorMatch = line.match(/^\s*(.+?)\s*-\s*(#[0-9A-Fa-f]{6})\s*-\s*(.+)$/); // More flexible name matching
			}

			if (colorMatch) {
				const name = colorMatch[1].trim();
				const hex = colorMatch[2].trim();
				// Avoid duplicates
				if (!colors.find((c) => c.hex === hex)) {
					colors.push({ name, hex });
				}
			}
		}

		return colors;
	}

	function extractIconsFromText(text: string): Array<{ name: string; icon: string }> {
		if (!text) return [];

		const icons: Array<{ name: string; icon: string }> = [];
		const lines = text.split('\n');

		for (const line of lines) {
			// Try different patterns to match various AI-generated formats
			let iconMatch = line.match(/^\s*[\*\-\•]\s*(\S+)\s*(.+)$/); // Original format: • ⚫ Button
			if (!iconMatch) {
				iconMatch = line.match(/^\s*[\*\-\•]\s*(.+)$/); // Just bullet with name: • Button
			}
			if (!iconMatch) {
				iconMatch = line.match(/^\s*(.+)$/); // Any line with content
			}

			if (iconMatch) {
				const iconName = iconMatch[2] || iconMatch[1];
				let iconSymbol = '';

				if (iconMatch[1] && iconMatch[2]) {
					// Format: • ⚫ Button - extract the symbol
					iconSymbol = iconMatch[1].trim();
				} else if (iconMatch[1]) {
					// Format: • Button - try to extract symbol from the name
					const parts = iconMatch[1].split(' ');
					if (parts.length > 1 && /[⚫⚪⚡⚙⚠⚰⚱★☆♦♠♣♥♪♫♬♭♮♯]/.test(parts[0])) {
						// First part is a symbol
						iconSymbol = parts[0];
					} else {
						// No symbol found, skip this line
						continue;
					}
				}

				// Only add if we have both symbol and name
				if (iconSymbol && iconName) {
					icons.push({
						name: iconName.trim(),
						icon: iconSymbol.trim()
					});
				}
			}
		}

		return icons;
	}

	// Extract font information for visual typography display
	function extractFontInfo(text: string): { primary: any; supporting: any; weights: string[] } {
		if (!text) return { primary: null, supporting: null, weights: [] };

		// First, try to parse as JSON (new format from microservice)
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
			// Not JSON, continue with text parsing
		}

		const lines = text.split('\n');
		let primary = null;
		let supporting = null;
		const weights = [];

		for (const line of lines) {
			// Look for primary font - try multiple patterns including AI format
			if (line.toLowerCase().includes('primary')) {
				// Pattern 1: "**Primary Font**: FontName - description" (New AI format)
				// Use greedy matching for font name to capture "Font-Name" patterns
				let fontMatch = line.match(/\*\*primary\s+font\*\*[:\s]*([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*?)\s*-\s*(.+)/i);
				if (!fontMatch) {
					// Pattern 2: "**Primary Font**: FontName description" (Old AI format)
					fontMatch = line.match(
						/\*\*primary\s+font\*\*[:\s]*([A-Za-z0-9\s\-]+?)(?:\s+[:\-]|\s|$)/i
					);
				}
				if (!fontMatch) {
					// Pattern 3: "Primary Font: FontName"
					fontMatch = line.match(/primary\s+font[:\s]+([A-Za-z0-9\s\-]+)/i);
				}
				if (!fontMatch) {
					// Pattern 4: "Primary: FontName"
					fontMatch = line.match(/primary[:\s]+([A-Za-z0-9\s\-]+)/i);
				}
				if (!fontMatch) {
					// Pattern 5: Look for font name after "primary"
					fontMatch = line.match(/primary[:\s]+([A-Za-z0-9\s\-]+?)(?:\s*-\s*(.+))?/i);
				}
				if (!fontMatch) {
					// Pattern 6: More flexible - just look for primary and extract next word(s)
					fontMatch = line.match(/primary[:\s]*font[:\s]*([A-Za-z0-9\s\-]+?)(?:\s|$)/i);
				}
				if (fontMatch && fontMatch[1].trim().length > 1) {
					const fontName = fontMatch[1].trim();
					// Filter out common words that aren't font names
					if (!['font', 'typeface', 'text', 'style'].includes(fontName.toLowerCase())) {
						primary = {
							name: fontName,
							description: fontMatch[2]?.trim() || ''
						};
					}
				}
			}

			// Look for supporting/secondary font - try multiple patterns including AI format
			if (line.toLowerCase().includes('supporting') || line.toLowerCase().includes('secondary')) {
				// Pattern 1: "**Supporting Font**: FontName - description" (New AI format)
				// Use greedy matching for font name to capture "Font-Name" patterns
				let fontMatch = line.match(
					/\*\*(?:supporting|secondary)\s+font\*\*[:\s]*([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*?)\s*-\s*(.+)/i
				);
				if (!fontMatch) {
					// Pattern 2: "**Supporting Font**: FontName description" (Old AI format)
					fontMatch = line.match(
						/\*\*(?:supporting|secondary)\s+font\*\*[:\s]*([A-Za-z0-9\s\-]+?)(?:\s+[:\-]|\s|$)/i
					);
				}
				if (!fontMatch) {
					// Pattern 3: "Supporting Font: FontName"
					fontMatch = line.match(/(?:supporting|secondary)\s+font[:\s]+([A-Za-z0-9\s\-]+)/i);
				}
				if (!fontMatch) {
					// Pattern 4: "Supporting: FontName"
					fontMatch = line.match(/(?:supporting|secondary)[:\s]+([A-Za-z0-9\s\-]+)/i);
				}
				if (!fontMatch) {
					// Pattern 5: Look for font name after "supporting" or "secondary"
					fontMatch = line.match(
						/(?:supporting|secondary)[:\s]+([A-Za-z0-9\s\-]+?)(?:\s*-\s*(.+))?/i
					);
				}
				if (!fontMatch) {
					// Pattern 6: More flexible - just look for supporting/secondary and extract next word(s)
					fontMatch = line.match(
						/(?:supporting|secondary)[:\s]*font[:\s]*([A-Za-z0-9\s\-]+?)(?:\s|$)/i
					);
				}
				if (fontMatch && fontMatch[1].trim().length > 1) {
					const fontName = fontMatch[1].trim();
					// Filter out common words that aren't font names
					if (!['font', 'typeface', 'text', 'style'].includes(fontName.toLowerCase())) {
						supporting = {
							name: fontName,
							description: fontMatch[2]?.trim() || ''
						};
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
			'Droid Sans'
		];

		let primary = null;
		let supporting = null;

		// Try to find font names in the text
		for (const font of commonFonts) {
			const regex = new RegExp(`\\b${font.replace(/\s+/g, '\\s+')}\\b`, 'gi');
			const matches = text.match(regex);

			if (matches) {
				// Check if it's mentioned as primary or supporting
				const context = text.toLowerCase();
				const fontLower = font.toLowerCase();
				const fontIndex = context.indexOf(fontLower);

				// Look for context around the font name
				const beforeContext = context.substring(Math.max(0, fontIndex - 50), fontIndex);
				const afterContext = context.substring(fontIndex, fontIndex + 50);

				console.log(`Found font ${font} in context:`, { beforeContext, afterContext });

				if (!primary && (beforeContext.includes('primary') || afterContext.includes('primary'))) {
					primary = font;
					console.log('Set as primary:', font);
				} else if (
					!supporting &&
					(beforeContext.includes('supporting') ||
						beforeContext.includes('secondary') ||
						afterContext.includes('supporting') ||
						afterContext.includes('secondary'))
				) {
					supporting = font;
					console.log('Set as supporting:', font);
				} else if (!primary) {
					primary = font;
					console.log('Set as primary (default):', font);
				} else if (!supporting) {
					supporting = font;
					console.log('Set as supporting (default):', font);
				}
			}
		}

		console.log('Fallback extraction result:', { primary, supporting });
		return { primary, supporting };
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
		<CardTitle class="flex items-center gap-2">
			<span>{stepTitle}</span>
			{#if isGenerating}
				<Loader2 class="h-4 w-4 animate-spin" />
			{/if}
		</CardTitle>
		<p class="text-sm text-gray-600">{stepDescription}</p>
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
								<!-- Visual typography display like professional examples -->
								{#if fontInfo.primary}
									<div class="typography-section">
										<h3 class="section-title">Primary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: '{fontInfo.primary.name}', serif;"
											>
												{fontInfo.primary.name}
											</div>
											<div
												class="character-set"
												style="font-family: '{fontInfo.primary.name}', serif;"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
												0123456789
											</div>
											<div class="font-weights-grid">
												{#each fontInfo.weights as weight}
													<div
														class="weight-sample"
														style="font-family: '{fontInfo.primary
															.name}', serif; font-weight: {weight === 'bold'
															? 'bold'
															: weight === 'light'
																? '300'
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
												style="font-family: '{fontInfo.supporting.name}', sans-serif;"
											>
												{fontInfo.supporting.name}
											</div>
											<div
												class="character-set"
												style="font-family: '{fontInfo.supporting.name}', sans-serif;"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
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
									<div class="typography-section">
										<h3 class="section-title">Primary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: '{fallbackFonts.primary}', serif;"
											>
												{fallbackFonts.primary}
											</div>
											<div
												class="character-set"
												style="font-family: '{fallbackFonts.primary}', serif;"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
												0123456789
											</div>
											<div class="font-weights-grid">
												<div
													class="weight-sample"
													style="font-family: '{fallbackFonts.primary}', serif; font-weight: normal;"
												>
													Regular
												</div>
												<div
													class="weight-sample"
													style="font-family: '{fallbackFonts.primary}', serif; font-weight: bold;"
												>
													Bold
												</div>
												<div
													class="weight-sample"
													style="font-family: '{fallbackFonts.primary}', serif; font-style: italic;"
												>
													Italic
												</div>
											</div>
										</div>
									</div>
								{/if}

								{#if fallbackFonts.supporting}
									<div class="typography-section">
										<h3 class="section-title">Secondary Typeface</h3>
										<div class="font-display">
											<div
												class="font-name-large"
												style="font-family: '{fallbackFonts.supporting}', sans-serif;"
											>
												{fallbackFonts.supporting}
											</div>
											<div
												class="character-set"
												style="font-family: '{fallbackFonts.supporting}', sans-serif;"
											>
												Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
												Zz<br />
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
							{#if typeof stepData === 'string'}
								<!-- Extract icons from AI response and display visually -->
								{@const extractedIcons = extractIconsFromText(stepData)}
								{#if extractedIcons.length > 0}
									<div class="icon-examples">
										<h4 class="section-subtitle">Brand Icons</h4>
										<div class="icon-list">
											{#each extractedIcons as iconData}
												<div class="icon-item">
													<div class="icon-display">
														<div class="icon-symbol">{iconData.icon}</div>
														<div class="icon-name">{iconData.name}</div>
													</div>
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
				{:else if stepId === 'final-review'}
					<div class="final-review-slide">
						<div class="final-review-header">
							<h3 class="final-review-title">Complete Brand Guidelines</h3>
							<p class="final-review-subtitle">Review all approved content from previous steps</p>
						</div>

						<div class="guidelines-summary">
							<div class="summary-item">
								<h4 class="summary-label">Brand Name</h4>
								<p class="summary-value">{stepData.brand_name || 'Your Brand'}</p>
							</div>
							<div class="summary-item">
								<h4 class="summary-label">Domain</h4>
								<p class="summary-value">{stepData.brand_domain || 'General Business'}</p>
							</div>
							<div class="summary-item">
								<h4 class="summary-label">Description</h4>
								<p class="summary-value">{stepData.short_description || 'Professional brand'}</p>
							</div>
						</div>

						<!-- Show each step exactly as it was displayed -->
						{#if stepData.stepHistory}
							<!-- Debug: Show step history info -->
							<div class="debug-info" style="display: none;">
								<p>Step History Length: {stepData.stepHistory.length}</p>
								{#each stepData.stepHistory as stepItem, index}
									<p>
										Step {index}: {stepItem.step} - Approved: {stepItem.approved} - Has Content: {!!stepItem.content}
									</p>
								{/each}
							</div>

							{#each stepData.stepHistory as stepItem}
								{#if stepItem.approved && stepItem.content}
									<!-- Color Palette Step -->
									{#if stepItem.step === 'color-palette'}
										{@const extractedColors = extractColorsFromText(stepItem.content)}
										<h3 class="section-title">Brand Colors</h3>
										<div class="colors-grid">
											{#each extractedColors as color}
												<div class="color-swatch">
													<div class="color-preview" style="background-color: {color.hex}"></div>
													<div class="color-info">
														<div class="color-name">{color.name}</div>
														<div class="color-hex">{color.hex}</div>
													</div>
												</div>
											{/each}
										</div>
										<!-- Iconography Step -->
									{:else if stepItem.step === 'iconography'}
										{@const extractedIcons = extractIconsFromText(stepItem.content)}
										<h3 class="section-title">Icon System</h3>
										<div class="icon-examples">
											<h4 class="section-subtitle">Brand Icons</h4>
											<div class="icon-list">
												{#each extractedIcons as iconData}
													<div class="icon-item">
														<div class="icon-display">
															<div class="icon-symbol">{iconData.icon}</div>
															<div class="icon-name">{iconData.name}</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
										<!-- Logo Guidelines Step -->
									{:else if stepItem.step === 'logo-guidelines'}
										<h3 class="section-title">Logo Guidelines</h3>
										{#if stepData.visualElements?.logoFiles && stepData.visualElements.logoFiles.length > 0}
											<div class="logo-examples">
												<h4 class="section-subtitle">Primary Logo</h4>
												<div class="logo-display">
													{#each stepData.visualElements.logoFiles as logoFile}
														<div class="logo-example">
															<img
																src={logoFile.fileData || `/uploads/logos/${logoFile.filename}`}
																alt="Brand Logo"
																class="logo-example-image"
															/>
														</div>
													{/each}
												</div>
											</div>

											<!-- Logo Usage Guidelines -->
											<div class="logo-usage-guidelines">
												<!-- Do's Section -->
												<div class="usage-section dos-section">
													<h4 class="usage-title dos-title">✅ DO's</h4>
													<div class="usage-examples">
														{#each stepData.visualElements.logoFiles as logoFile}
															<div class="usage-example">
																<div class="example-label">Correct Usage</div>
																<div class="logo-example correct">
																	<img
																		src={logoFile.fileData || `/uploads/logos/${logoFile.filename}`}
																		alt="Correct Logo Usage"
																		class="logo-example-image"
																	/>
																</div>
															</div>
														{/each}
													</div>
												</div>

												<!-- Don'ts Section -->
												<div class="usage-section donts-section">
													<h4 class="usage-title donts-title">❌ DON'Ts</h4>
													<div class="usage-examples">
														{#each stepData.visualElements.logoFiles as logoFile}
															<div class="usage-example">
																<div class="example-label">Don't Stretch</div>
																<div class="logo-example incorrect">
																	<img
																		src={logoFile.fileData || `/uploads/logos/${logoFile.filename}`}
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
																		src={logoFile.fileData || `/uploads/logos/${logoFile.filename}`}
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
																		src={logoFile.fileData || `/uploads/logos/${logoFile.filename}`}
																		alt="Incorrect Logo Usage"
																		class="logo-example-image"
																	/>
																	<div class="x-mark">✕</div>
																</div>
															</div>
														{/each}
													</div>
												</div>
											</div>
										{:else}
											<div class="no-logo-message">
												<p>Upload a logo to see usage guidelines</p>
											</div>
										{/if}
										<!-- Typography Step -->
									{:else if stepItem.step === 'typography'}
										{@const fontInfo = extractFontInfo(stepItem.content)}
										<h3 class="section-title">Typography</h3>
										{#if fontInfo.primary || fontInfo.supporting}
											<!-- Visual typography display like professional examples -->
											{#if fontInfo.primary}
												<div class="typography-section">
													<h4 class="section-subtitle">Primary Typeface</h4>
													<div class="font-display">
														<div
															class="font-name-large"
															style="font-family: '{fontInfo.primary.name}', serif;"
														>
															{fontInfo.primary.name}
														</div>
														<div
															class="character-set"
															style="font-family: '{fontInfo.primary.name}', serif;"
														>
															Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww
															Xx Yy Zz<br />
															0123456789
														</div>
														<div class="font-weights-grid">
															{#each fontInfo.weights as weight}
																<div
																	class="weight-sample"
																	style="font-family: '{fontInfo.primary
																		.name}', serif; font-weight: {weight === 'bold'
																		? 'bold'
																		: weight === 'light'
																			? '300'
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
													<h4 class="section-subtitle">Secondary Typeface</h4>
													<div class="font-display">
														<div
															class="font-name-large"
															style="font-family: '{fontInfo.supporting.name}', sans-serif;"
														>
															{fontInfo.supporting.name}
														</div>
														<div
															class="character-set"
															style="font-family: '{fontInfo.supporting.name}', sans-serif;"
														>
															Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww
															Xx Yy Zz<br />
															0123456789
														</div>
													</div>
												</div>
											{/if}
										{:else}
											<!-- Fallback: Show placeholder typography with generic names -->
											<div class="typography-section">
												<h4 class="section-subtitle">Primary Typeface</h4>
												<div class="font-display">
													<div class="font-name-large" style="font-family: 'Georgia', serif;">
														Georgia
													</div>
													<div class="character-set" style="font-family: 'Georgia', serif;">
														Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx
														Yy Zz<br />
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
												<h4 class="section-subtitle">Secondary Typeface</h4>
												<div class="font-display">
													<div class="font-name-large" style="font-family: 'Arial', sans-serif;">
														Arial
													</div>
													<div class="character-set" style="font-family: 'Arial', sans-serif;">
														Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx
														Yy Zz<br />
														0123456789
													</div>
												</div>
											</div>
										{/if}
										<!-- Photography Step -->
									{:else if stepItem.step === 'photography'}
										<h3 class="section-title">Photography</h3>
										<div class="photo-grid">
											<div class="photo-example">
												<div class="photo-placeholder team">
													<div class="photo-icon">📸</div>
													<span class="photo-label">Photography</span>
												</div>
											</div>
										</div>
										<!-- Applications Step -->
									{:else if stepItem.step === 'applications'}
										<h3 class="section-title">Applications</h3>
										<div class="applications-grid">
											<div class="application-item">
												<div class="app-icon">📄</div>
												<h4 class="app-name">Brand Applications</h4>
											</div>
										</div>
										<!-- Brand Positioning Step -->
									{:else if stepItem.step === 'brand-positioning'}
										<h3 class="section-title">Brand Positioning</h3>
										<div class="brand-positioning-content">
											<div class="positioning-summary">
												<p>Brand positioning statement</p>
											</div>
										</div>
										<!-- Other steps - show content as markdown -->
									{:else}
										<div class="step-content-text">
											<h3 class="section-title">
												{stepItem.step.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
											</h3>
											{@html renderMarkdown(stepItem.content)}
										</div>
									{/if}
								{/if}
							{/each}
						{:else}
							<!-- Fallback: Show message if no step history available -->
							<div class="no-content-message">
								<h3 class="section-title">Brand Guidelines Summary</h3>
								<p>
									Complete brand guidelines will be displayed here after all steps are approved.
								</p>
							</div>
						{/if}

						<div class="guidelines-sections">
							<!-- Brand Positioning Section -->
							{#if stepData.positioning_statement || stepData.mission || stepData.vision}
								<div class="guideline-section">
									<h4 class="section-header">📍 Brand Positioning</h4>
									{#if stepData.positioning_statement}
										<div class="positioning-statement-review">
											<p class="statement-text">"{stepData.positioning_statement}"</p>
										</div>
									{/if}
									{#if stepData.mission}
										<div class="mission-vision-item">
											<strong>Mission:</strong>
											{stepData.mission}
										</div>
									{/if}
									{#if stepData.vision}
										<div class="mission-vision-item">
											<strong>Vision:</strong>
											{stepData.vision}
										</div>
									{/if}
									{#if stepData.voice_and_tone}
										<div class="voice-tone-review">
											<strong>Voice & Tone:</strong>
											<div class="voice-adjectives">
												{#each stepData.voice_and_tone.adjectives || [] as adjective}
													<span class="voice-tag">{adjective}</span>
												{/each}
											</div>
											<p class="voice-guidelines">{stepData.voice_and_tone.guidelines}</p>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Color Palette Section -->
							{#if stepData.colors && stepData.colors.core_palette}
								<div class="guideline-section">
									<h4 class="section-header">🎨 Color Palette</h4>
									<div class="colors-review-grid">
										{#each stepData.colors.core_palette as color}
											<div class="color-review-item">
												<div
													class="color-swatch-review"
													style="background-color: {color.hex}"
												></div>
												<div class="color-details">
													<div class="color-name-review">{color.name}</div>
													<div class="color-hex-review">{color.hex}</div>
													<div class="color-usage-review">{color.usage}</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Typography Section -->
							{#if stepData.typography}
								<div class="guideline-section">
									<h4 class="section-header">📝 Typography</h4>
									<div class="typography-review">
										{#if stepData.typography.primary}
											<div class="typography-section">
												<h3 class="section-title">Primary Typeface</h3>
												<div class="font-display">
													<div
														class="font-name-large"
														style="font-family: '{stepData.typography.primary.name}', serif;"
													>
														{stepData.typography.primary.name}
													</div>
													<div
														class="character-set"
														style="font-family: '{stepData.typography.primary.name}', serif;"
													>
														Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx
														Yy Zz<br />
														0123456789
													</div>
													<div class="font-weights-grid">
														<div
															class="weight-sample"
															style="font-family: '{stepData.typography.primary
																.name}', serif; font-weight: normal;"
														>
															Regular
														</div>
														<div
															class="weight-sample"
															style="font-family: '{stepData.typography.primary
																.name}', serif; font-weight: bold;"
														>
															Bold
														</div>
														<div
															class="weight-sample"
															style="font-family: '{stepData.typography.primary
																.name}', serif; font-style: italic;"
														>
															Italic
														</div>
													</div>
													{#if stepData.typography.primary.usage}
														<div class="font-usage-text">{stepData.typography.primary.usage}</div>
													{/if}
												</div>
											</div>
										{/if}

										{#if stepData.typography.supporting}
											<div class="typography-section">
												<h3 class="section-title">Secondary Typeface</h3>
												<div class="font-display">
													<div
														class="font-name-large"
														style="font-family: '{stepData.typography.supporting
															.name}', sans-serif;"
													>
														{stepData.typography.supporting.name}
													</div>
													<div
														class="character-set"
														style="font-family: '{stepData.typography.supporting
															.name}', sans-serif;"
													>
														Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx
														Yy Zz<br />
														0123456789
													</div>
													{#if stepData.typography.supporting.usage}
														<div class="font-usage-text">
															{stepData.typography.supporting.usage}
														</div>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{:else if stepData.stepHistory}
								<!-- Check if there's typography data in step history -->
								{@const typographyStep = stepData.stepHistory.find((s) => s.step === 'typography')}
								{#if typographyStep}
									{@const fontInfo = extractFontInfo(typographyStep.content)}
									<!-- Debug: Log final review typography -->
									{console.log('Final review typographyStep:', typographyStep)}
									{console.log('Final review fontInfo:', fontInfo)}
									<div class="guideline-section">
										<h4 class="section-header">📝 Typography</h4>
										<div class="typography-review">
											{#if fontInfo.primary}
												<div class="typography-section">
													<h3 class="section-title">Primary Typeface</h3>
													<div class="font-display">
														<div
															class="font-name-large"
															style="font-family: '{fontInfo.primary.name}', serif;"
														>
															{fontInfo.primary.name}
														</div>
														<div
															class="character-set"
															style="font-family: '{fontInfo.primary.name}', serif;"
														>
															Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww
															Xx Yy Zz<br />
															0123456789
														</div>
														<div class="font-weights-grid">
															{#each fontInfo.weights as weight}
																<div
																	class="weight-sample"
																	style="font-family: '{fontInfo.primary
																		.name}', serif; font-weight: {weight === 'bold'
																		? 'bold'
																		: weight === 'light'
																			? '300'
																			: 'normal'};"
																>
																	{weight.charAt(0).toUpperCase() + weight.slice(1)}
																</div>
															{/each}
														</div>
														{#if fontInfo.primary.description}
															<div class="font-usage-text">{fontInfo.primary.description}</div>
														{/if}
													</div>
												</div>
											{/if}

											{#if fontInfo.supporting}
												<div class="typography-section">
													<h3 class="section-title">Secondary Typeface</h3>
													<div class="font-display">
														<div
															class="font-name-large"
															style="font-family: '{fontInfo.supporting.name}', sans-serif;"
														>
															{fontInfo.supporting.name}
														</div>
														<div
															class="character-set"
															style="font-family: '{fontInfo.supporting.name}', sans-serif;"
														>
															Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww
															Xx Yy Zz<br />
															0123456789
														</div>
														{#if fontInfo.supporting.description}
															<div class="font-usage-text">{fontInfo.supporting.description}</div>
														{/if}
													</div>
												</div>
											{/if}
										</div>
									</div>
								{/if}
							{/if}

							<!-- Iconography Section -->
							{#if stepData.iconography}
								<div class="guideline-section">
									<h4 class="section-header">🔧 Iconography</h4>
									<div class="iconography-review">
										<div class="icon-spec-item">
											<strong>Style:</strong>
											{stepData.iconography.style}
										</div>
										<div class="icon-spec-item">
											<strong>Grid:</strong>
											{stepData.iconography.grid}
										</div>
										<div class="icon-spec-item">
											<strong>Stroke:</strong>
											{stepData.iconography.stroke}
										</div>
										{#if stepData.iconography.specific_icons && stepData.iconography.specific_icons.length > 0}
											<div class="icon-spec-item">
												<strong>Icons:</strong>
												{stepData.iconography.specific_icons.join(', ')}
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Photography Section -->
							{#if stepData.photography}
								<div class="guideline-section">
									<h4 class="section-header">📸 Photography</h4>
									<div class="photography-review">
										{#if stepData.photography.mood && stepData.photography.mood.length > 0}
											<div class="mood-tags-review">
												{#each stepData.photography.mood as mood}
													<span class="mood-tag-review">{mood}</span>
												{/each}
											</div>
										{/if}
										{#if stepData.photography.guidelines}
											<p class="photo-guidelines">{stepData.photography.guidelines}</p>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Applications Section -->
							{#if stepData.applications && stepData.applications.length > 0}
								<div class="guideline-section">
									<h4 class="section-header">📱 Applications</h4>
									<div class="applications-review">
										{#each stepData.applications as app}
											<div class="app-review-item">
												<h5 class="app-context">{app.context}</h5>
												<p class="app-description-review">{app.description}</p>
												{#if app.layout_notes && app.layout_notes.length > 0}
													<ul class="layout-notes">
														{#each app.layout_notes as note}
															<li class="layout-note">{note}</li>
														{/each}
													</ul>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Legal Contact Section -->
							{#if stepData.legal_contact}
								<div class="guideline-section">
									<h4 class="section-header">📞 Legal Contact</h4>
									<div class="legal-contact-review">
										<div class="contact-item">
											<strong>Name:</strong>
											{stepData.legal_contact.contact_name}
										</div>
										<div class="contact-item">
											<strong>Title:</strong>
											{stepData.legal_contact.title}
										</div>
										<div class="contact-item">
											<strong>Email:</strong>
											{stepData.legal_contact.email}
										</div>
										<div class="contact-item">
											<strong>Company:</strong>
											{stepData.legal_contact.company}
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Default content display -->
					<div class="default-content">
						<div class="content-preview">
							{#if typeof stepData === 'string'}
								{@html renderMarkdown(stepData)}
							{:else}
								<div class="text-gray-600"></div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			{#if !readOnly && !showFeedback}
				<div class="approval-actions">
					{#if !isApproved && showApproveButton}
						<Button onclick={handleApprove} class="approve-btn">
							<ThumbsUp class="mr-2 h-4 w-4" />
							Approve & Continue
						</Button>
						<Button variant="outline" onclick={handleEdit} class="reject-btn">
							<ThumbsDown class="mr-2 h-4 w-4" />
							Request Changes
						</Button>
					{:else if isApproved || (!showApproveButton && !isGenerating)}
						<Button variant="outline" onclick={handleEdit} class="edit-btn">
							<Edit class="mr-2 h-4 w-4" />
							Edit This Step
						</Button>
						{#if canRevert}
							<Button variant="outline" onclick={handleRevert} class="revert-btn">
								<RefreshCw class="mr-2 h-4 w-4" />
								Revert to Previous
							</Button>
						{/if}
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
				<p class="text-gray-600">Ready to generate {stepTitle.toLowerCase()} guidelines?</p>
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
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
	}

	.statement-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.statement-text {
		font-size: 1.25rem;
		font-style: italic;
		line-height: 1.4;
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
		color: #1f2937;
		margin-bottom: 0.75rem;
	}

	.section-text {
		color: #6b7280;
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
		color: #6b7280;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.logo-subtext {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.logo-display {
		background: #f3f4f6;
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
		background: #f0fdf4;
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
		color: #6b7280;
		font-style: italic;
	}

	.icon-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		transition: all 0.2s ease;
	}

	.icon-display:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
	}

	.icon-symbol {
		font-size: 2rem;
		line-height: 1;
	}

	.icon-name {
		font-size: 0.875rem;
		color: #374151;
		text-align: center;
		font-weight: 500;
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
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
		color: #6b7280;
		font-family: monospace;
		margin-bottom: 0.5rem;
	}

	.color-usage {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	/* Color Combinations */
	.color-combinations {
		margin-top: 2rem;
		padding: 1.5rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
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
		color: #6b7280;
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
		display: grid;
		grid-template-columns: 1fr 1fr;
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
		color: #1f2937;
		margin-bottom: 0.75rem;
	}

	.style-description {
		color: #6b7280;
		line-height: 1.5;
	}

	.icon-examples {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.icon-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.icon-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.icon-placeholder {
		background: #e5e7eb;
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
		background: white;
		border: 1px solid #e5e7eb;
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

	.icon-name {
		font-size: 0.875rem;
		color: #374151;
		font-weight: 500;
		text-align: center;
		text-transform: capitalize;
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
			grid-template-columns: 1fr;
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

	/* Final Review Slide Styles */
	.final-review-slide {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		max-height: 100%;
		padding: 1rem;
	}

	.final-review-header {
		text-align: center;
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		margin-bottom: 1rem;
	}

	.final-review-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.final-review-subtitle {
		font-size: 1rem;
		opacity: 0.9;
		margin: 0;
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
		.applications-slide,
		.final-review-slide {
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
		color: #212529;
		margin-bottom: 1rem;
		border-bottom: 2px solid #e9ecef;
		padding-bottom: 0.5rem;
	}

	.font-display {
		background: #f8f9fa;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 1rem;
	}

	.font-name-large {
		font-size: 2.5rem;
		font-weight: 700;
		color: #007bff;
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
