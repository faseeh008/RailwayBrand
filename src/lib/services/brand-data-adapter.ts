/**
 * Brand Data Adapter
 * 
 * Converts between different data formats:
 * - Frontend generated steps (string content) → HTML slide schema (structured objects)
 * - Handles parsing AI-generated markdown/text content
 * - Extracts structured data from text
 */

/**
 * Parse brand positioning content from text/markdown
 */
function parseBrandPositioning(content: string | any): any {
	console.log('🔍 Parsing brand positioning content:', {
		contentType: typeof content,
		contentLength: typeof content === 'string' ? content.length : 'N/A',
		contentPreview: typeof content === 'string' ? content.substring(0, 300) : content
	});

	// If already an object, return as-is
	if (typeof content === 'object' && content !== null) {
		console.log('🔍 Content is object, extracting directly');
		return {
			mission: content.mission || content.Mission || '',
			vision: content.vision || content.Vision || '',
			values: content.values || content.Values || [],
			personality: content.personality || content.Personality || ''
		};
	}
	
	// Parse from text content
	const text = String(content || '');
	const result: any = {
		mission: '',
		vision: '',
		values: [],
		personality: ''
	};
	
	console.log('🔍 Full text content to parse:', text);
	
	// Extract Mission - specific pattern for **Mission**: format
	const missionMatch = text.match(/\*\*Mission\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is);
	if (missionMatch && missionMatch[1]) {
		result.mission = missionMatch[1].trim();
		console.log('🔍 Found mission:', result.mission.substring(0, 50));
	}
	
	// Extract Vision - specific pattern for **Vision**: format
	const visionMatch = text.match(/\*\*Vision\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is);
	if (visionMatch && visionMatch[1]) {
		result.vision = visionMatch[1].trim();
		console.log('🔍 Found vision:', result.vision.substring(0, 50));
	}
	
	// Extract Values - specific pattern for **Core Values**: format
	const valuesMatch = text.match(/\*\*Core Values\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/is);
	if (valuesMatch && valuesMatch[1]) {
		const valuesText = valuesMatch[1];
		result.values = valuesText
			.split(/[\n*]/)
			.map(v => v.trim().replace(/^-\s*/, ''))
			.filter(v => v.length > 0 && v.length < 100);
		console.log('🔍 Found values:', result.values);
	}
	
	// Extract Target Audience - specific pattern for **Target Audience**: format
	const targetAudienceMatch = text.match(/\*\*Target Audience\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is);
	if (targetAudienceMatch && targetAudienceMatch[1]) {
		result.personality = targetAudienceMatch[1].trim();
		console.log('🔍 Found target audience:', result.personality.substring(0, 50));
	}
	
	console.log('🔍 Final parsed result:', {
		mission: result.mission?.substring(0, 50),
		vision: result.vision?.substring(0, 50),
		valuesCount: result.values?.length,
		personality: result.personality?.substring(0, 50)
	});
	
	return result;
}

/**
 * Parse color palette from text/markdown
 */
function parseColorPalette(content: string | any): any {
	// If already an object, return formatted
	if (typeof content === 'object' && content !== null) {
		// Check for new JSON structure with arrays (primary, secondary, accent, neutrals, background)
		if (content.primary && Array.isArray(content.primary)) {
			// New structure: flatten all color arrays into a single palette
			const allColors: any[] = [];
			
			// Collect colors from all categories
			if (Array.isArray(content.primary)) {
				allColors.push(...content.primary.map((c: any) => ({
					...c,
					category: 'Primary',
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				})));
			}
			if (Array.isArray(content.secondary)) {
				allColors.push(...content.secondary.map((c: any) => ({
					...c,
					category: 'Secondary',
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				})));
			}
			if (Array.isArray(content.accent)) {
				allColors.push(...content.accent.map((c: any) => ({
					...c,
					category: 'Accent',
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				})));
			}
			if (Array.isArray(content.neutrals)) {
				allColors.push(...content.neutrals.map((c: any) => ({
					...c,
					category: 'Neutral',
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				})));
			}
			if (Array.isArray(content.background)) {
				allColors.push(...content.background.map((c: any) => ({
					...c,
					category: 'Background',
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				})));
			}
			
			// Return first 8 colors, plus keep the original structure for backward compatibility
			const palette = allColors.slice(0, 8);
			
			return {
				primary: allColors[0] || null,
				secondary: allColors[1] || null,
				accent: allColors[2] || null,
				neutral: allColors[3] || null,
				// Add all colors array for new templates
				allColors: palette,
				// Keep original structure for backward compatibility
				original: content
			};
		}
		
		// Legacy structure: core_palette array
		const colors = content.core_palette || content.colors || content;
		if (Array.isArray(colors)) {
			return {
				primary: colors[0] || null,
				secondary: colors[1] || null,
				accent: colors[2] || null,
				neutral: colors[3] || null,
				allColors: colors.slice(0, 8).map((c: any) => ({
					...c,
					rgb: Array.isArray(c.rgb) ? `RGB(${c.rgb.join(', ')})` : (c.rgb || hexToRgb(c.hex || '#000000'))
				}))
			};
		}
		return colors;
	}
	
	// Parse from text - try to parse as JSON first
	try {
		const parsed = typeof content === 'string' ? JSON.parse(content) : content;
		if (typeof parsed === 'object' && parsed !== null) {
			return parseColorPalette(parsed); // Recursively parse the parsed object
		}
	} catch {
		// Not JSON, continue with text parsing
	}
	
	// Parse from text
	const text = String(content || '');
	const result: any = {
		primary: null,
		secondary: null,
		accent: null,
		neutral: null,
		allColors: []
	};
	
	// Extract hex colors
	const hexMatches = text.match(/#[0-9A-Fa-f]{6}/g) || [];
	const colorNames = text.match(/(?:Primary|Secondary|Accent|Neutral|Main|Support)[^#\n]*?(?=#|$)/gi) || [];
	
	// Try to match colors with their descriptions (extract up to 8)
	const maxColors = Math.min(hexMatches.length, 8);
	for (let i = 0; i < maxColors; i++) {
		const hex = hexMatches[i];
		const rgbMatch = text.match(new RegExp(`${hex}[^\\n]*?(?:rgb|RGB)\\s*\\(([^)]+)\\)`));
		const nameMatch = colorNames[i] || '';
		
		const colorObj = {
			hex: hex,
			rgb: rgbMatch ? `RGB(${rgbMatch[1]})` : hexToRgb(hex),
			name: extractColorName(nameMatch) || `Color ${i + 1}`,
			usage: extractColorUsage(text, hex) || 'Brand color'
		};
		
		result.allColors.push(colorObj);
		
		if (i === 0) result.primary = colorObj;
		else if (i === 1) result.secondary = colorObj;
		else if (i === 2) result.accent = colorObj;
		else if (i === 3) result.neutral = colorObj;
	}
	
	return result;
}

/**
 * Parse typography from text/markdown
 */
function parseTypography(content: string | any): any {
	console.log('🔍 Parsing typography content:', {
		contentType: typeof content,
		contentLength: typeof content === 'string' ? content.length : 'N/A',
		contentPreview: typeof content === 'string' ? content.substring(0, 300) : content
	});

	// If already an object, return formatted
	if (typeof content === 'object' && content !== null) {
		return {
			primaryFont: content.primary || content.primaryFont || { name: 'Inter', weights: ['Regular', 'Bold'], usage: 'Headlines' },
			secondaryFont: content.supporting || content.secondaryFont || { name: 'Arial', weights: ['Regular'], usage: 'Body' }
		};
	}
	
	// Parse from text
	const text = String(content || '');
	const result: any = {
		primaryFont: { name: '', weights: [], usage: '' },
		secondaryFont: { name: '', weights: [], usage: '' }
	};
	
	console.log('🔍 Full typography text content:', text);
	
	// Extract primary font - specific pattern for **Primary Font**: format
	const primaryMatch = text.match(/\*\*Primary Font\*\*:\s*(.+?)(?=\s*-|\n\*\*|$)/is);
	if (primaryMatch && primaryMatch[1]) {
		// Extract just the font name (before the dash)
		const fontName = primaryMatch[1].split(' - ')[0].trim();
		result.primaryFont.name = fontName;
		result.primaryFont.weights = extractFontWeights(text, fontName);
		result.primaryFont.usage = 'Headlines, buttons, UI elements';
		result.primaryFont.sample = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789';
		console.log('🔍 Found primary font:', result.primaryFont.name);
	}
	
	// Extract secondary font - specific pattern for **Supporting Font**: format
	const secondaryMatch = text.match(/\*\*Supporting Font\*\*:\s*(.+?)(?=\s*-|\n\*\*|$)/is);
	if (secondaryMatch && secondaryMatch[1]) {
		// Extract just the font name (before the dash)
		const fontName = secondaryMatch[1].split(' - ')[0].trim();
		result.secondaryFont.name = fontName;
		result.secondaryFont.weights = extractFontWeights(text, fontName);
		result.secondaryFont.usage = 'Body text, captions';
		result.secondaryFont.sample = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789';
		console.log('🔍 Found secondary font:', result.secondaryFont.name);
	}
	
	console.log('🔍 Final typography result:', {
		primaryName: result.primaryFont.name,
		secondaryName: result.secondaryFont.name,
		primaryWeights: result.primaryFont.weights,
		secondaryWeights: result.secondaryFont.weights
	});
	
	return result;
}

/**
 * Helper: Convert hex to RGB
 */
function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (result) {
		return `RGB(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
	}
	return 'RGB(0, 0, 0)';
}

/**
 * Helper: Extract color name from text
 */
function extractColorName(text: string): string {
	const cleaned = text.replace(/(?:Primary|Secondary|Accent|Neutral|Color)/i, '').trim();
	return cleaned || '';
}

/**
 * Helper: Extract color usage from context
 */
function extractColorUsage(text: string, hex: string): string {
	const contextMatch = text.match(new RegExp(`${hex}[^\\n]*?(?:for|used|usage)[^\\n]*?([^\\n]{10,50})`));
	if (contextMatch) {
		return contextMatch[1].trim();
	}
	return '';
}

/**
 * Helper: Extract font weights from text
 */
function extractFontWeights(text: string, fontName: string): string[] {
	const weights = ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold'];
	const found: string[] = [];
	
	for (const weight of weights) {
		if (text.includes(weight) || text.includes(weight.toLowerCase())) {
			found.push(weight);
		}
	}
	
	// Return multiple weights if found, otherwise return defaults based on font type
	if (found.length > 0) {
		return found;
	}
	
	// Default fallback for primary fonts (usually need more weights)
	if (text.toLowerCase().includes('primary')) {
		return ['Regular (400)', 'Medium (500)', 'Bold (700)'];
	}
	// Default fallback for secondary fonts
	return ['Regular (400)', 'SemiBold (600)'];
}

/**
 * Helper: Extract font sample text from content
 */
function extractFontSample(text: string, fontName: string): string | null {
	// Look for sample text patterns
	const samplePatterns = [
		/Sample[:\s]+(.+?)(?=\n\n|\n\*\*|$)/is,
		/Example[:\s]+(.+?)(?=\n\n|\n\*\*|$)/is,
		/Preview[:\s]+(.+?)(?=\n\n|\n\*\*|$)/is,
		/"[^"]{10,}"/g, // Quoted text longer than 10 chars
		/'[^']{10,}'/g  // Single quoted text longer than 10 chars
	];
	
	for (const pattern of samplePatterns) {
		const match = text.match(pattern);
		if (match && match[1] && match[1].trim().length > 10) {
			return match[1].trim().replace(/^["']|["']$/g, '');
		}
	}
	
	// If no specific sample found, look for descriptive text about the font
	const descriptivePattern = new RegExp(`${fontName}[^.]*?([A-Z][^.]{20,})`, 'i');
	const descMatch = text.match(descriptivePattern);
	if (descMatch && descMatch[1]) {
		return descMatch[1].trim();
	}
	
	return null;
}

/**
 * Parse brand introduction data from first step content
 */
function parseBrandIntroduction(text: string): {
    positioningStatement: string;
    brandVoice: string;
    brandTone: string;
    brandPersonality: string;
} {
    console.log('🔍 Parsing brand introduction from first step...');
    
    const result = {
        positioningStatement: 'Our brand positioning statement',
        brandVoice: 'Our brand voice',
        brandTone: 'Our brand tone',
        brandPersonality: 'Our brand personality'
    };
    
    if (!text) {
        console.log('⚠️ No content in first step');
        return result;
    }
    
    // Extract positioning statement - look for patterns like "Positioning:" or "Brand Statement:"
    const positioningMatch = text.match(/(?:Positioning|Brand Statement|Positioning Statement)[:\s]*(.+?)(?=\n\n|\n(?:Voice|Tone|Personality)|$)/is);
    if (positioningMatch && positioningMatch[1]) {
        result.positioningStatement = positioningMatch[1].trim();
        console.log('🔍 Found positioning statement:', result.positioningStatement.substring(0, 50));
    }
    
    // Clean up any prefixes that might be in the content
    result.positioningStatement = result.positioningStatement
        .replace(/^\*\*:\s*/, '') // Remove "**: " prefix
        .replace(/^:\s*/, '') // Remove ": " prefix
        .replace(/^\*\*\s*/, '') // Remove "**" prefix
        .trim();
    
    // Extract voice - look for patterns like "Voice:" or "Brand Voice:"
    const voiceMatch = text.match(/(?:Voice|Brand Voice)[:\s]*(.+?)(?=\n\n|\n(?:Tone|Personality|Positioning)|$)/is);
    if (voiceMatch && voiceMatch[1]) {
        result.brandVoice = voiceMatch[1].trim();
        console.log('🔍 Found brand voice:', result.brandVoice.substring(0, 50));
    }
    
    // Extract tone - look for patterns like "Tone:" or "Brand Tone:"
    const toneMatch = text.match(/(?:Tone|Brand Tone)[:\s]*(.+?)(?=\n\n|\n(?:Voice|Personality|Positioning)|$)/is);
    if (toneMatch && toneMatch[1]) {
        result.brandTone = toneMatch[1].trim();
        console.log('🔍 Found brand tone:', result.brandTone.substring(0, 50));
    }
    
    // Extract personality - look for patterns like "Personality:" or "Brand Personality:"
    const personalityMatch = text.match(/(?:Personality|Brand Personality)[:\s]*(.+?)(?=\n\n|\n(?:Voice|Tone|Positioning)|$)/is);
    if (personalityMatch && personalityMatch[1]) {
        result.brandPersonality = personalityMatch[1].trim();
        console.log('🔍 Found brand personality:', result.brandPersonality.substring(0, 50));
    }
    
    // If no specific patterns found, try to extract from general content
    if (result.positioningStatement === 'Our brand positioning statement') {
        // Look for the first substantial paragraph as positioning statement
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 20);
        if (paragraphs.length > 0) {
            result.positioningStatement = paragraphs[0].trim();
            console.log('🔍 Using first paragraph as positioning statement:', result.positioningStatement.substring(0, 50));
        }
    }
    
    // Clean up any prefixes that might be in the content (for fallback case too)
    result.positioningStatement = result.positioningStatement
        .replace(/^\*\*:\s*/, '') // Remove "**: " prefix
        .replace(/^:\s*/, '') // Remove ": " prefix
        .replace(/^\*\*\s*/, '') // Remove "**" prefix
        .trim();
    
    console.log('🔍 Brand introduction parsing result:', {
        hasPositioning: result.positioningStatement !== 'Our brand positioning statement',
        hasVoice: result.brandVoice !== 'Our brand voice',
        hasTone: result.brandTone !== 'Our brand tone',
        hasPersonality: result.brandPersonality !== 'Our brand personality'
    });
    
    return result;
}

/**
 * Main adapter function: Transform frontend data to HTML slide schema
 */
export function adaptBrandDataForSlides(frontendData: any): any {
	console.log('🔄 Adapting brand data for slides...', {
		hasBrandName: !!frontendData.brandName,
		hasGeneratedSteps: !!frontendData.generatedSteps,
		stepsCount: frontendData.generatedSteps?.length || 0,
		hasLogoFiles: !!frontendData.logoFiles,
		logoFilesCount: frontendData.logoFiles?.length || 0,
		firstLogoFile: frontendData.logoFiles?.[0],
		logoFileKeys: frontendData.logoFiles?.[0] ? Object.keys(frontendData.logoFiles[0]) : [],
		logoFileData: frontendData.logoFiles?.[0]?.fileData,
		logoFileUrl: frontendData.logoFiles?.[0]?.url,
		logoFileSrc: frontendData.logoFiles?.[0]?.src,
		allFrontendKeys: Object.keys(frontendData),
		hasLogoUrl: !!frontendData.logoUrl,
		hasLogo: !!frontendData.logo
	});
	
	// Normalize steps (support stepHistory shape: { step, title, content })
	const steps = (frontendData.generatedSteps || []).map((s: any) => ({
		stepId: s.stepId || s.step,
		stepTitle: s.stepTitle || s.title,
		content: s.content
	}));

	console.log('🔍 Normalized steps:', steps.map(s => ({
		stepId: s.stepId,
		stepTitle: s.stepTitle,
		contentLength: s.content?.length
	})));

	console.log('🔍 Processing steps:', {
		stepsCount: steps.length,
		stepIds: steps.map(s => s.stepId),
		positioningStep: steps.find(s => s.stepId === 'brand-positioning')?.content?.substring(0, 100)
	});

	// Find specific steps
	const firstStep = steps[0]; // Get the first step for brand introduction
	const positioningStep = steps.find((s: any) => s.stepId === 'brand-positioning');
	
	// Parse brand introduction data from first step
	const brandIntroduction = parseBrandIntroduction(firstStep?.content || '');
	const colorStep = steps.find((s: any) => s.stepId === 'color-palette');
	const typographyStep = steps.find((s: any) => s.stepId === 'typography');
	const logoStep = steps.find((s: any) => s.stepId === 'logo-guidelines');
	const iconStep = steps.find((s: any) => s.stepId === 'iconography');
	const photoStep = steps.find((s: any) => s.stepId === 'photography');
	const appStep = steps.find((s: any) => s.stepId === 'applications');
	
	// Parse positioning data - use actual step content
	console.log('🔍 Positioning step found:', {
		hasPositioningStep: !!positioningStep,
		stepId: positioningStep?.stepId,
		contentLength: positioningStep?.content?.length,
		contentPreview: positioningStep?.content?.substring(0, 200)
	});

	// Debug: Show the full content structure
	if (positioningStep?.content) {
		console.log('🔍 Full positioning content:', positioningStep.content);
		console.log('🔍 Content type:', typeof positioningStep.content);
		console.log('🔍 Content keys (if object):', typeof positioningStep.content === 'object' ? Object.keys(positioningStep.content) : 'N/A');
	}

	const positioning = positioningStep 
		? parseBrandPositioning(positioningStep.content)
		: {
			mission: frontendData.shortDescription || 'Our mission',
			vision: 'Our vision',
			values: frontendData.brandValues?.split(',').map((v: string) => v.trim()) || ['Innovation', 'Excellence'],
			personality: frontendData.shortDescription || 'Our personality'
		};

	console.log('🔍 Parsed positioning result:', {
		mission: positioning.mission?.substring(0, 50),
		vision: positioning.vision?.substring(0, 50),
		valuesCount: positioning.values?.length,
		personality: positioning.personality?.substring(0, 50)
	});

	// If no content was parsed, try a simple fallback
	if (!positioning.mission && !positioning.vision && positioningStep?.content) {
		console.log('🔍 No content parsed, trying fallback extraction...');
		const content = positioningStep.content;
		
		// Simple fallback: use first paragraph as mission if it's substantial
		const paragraphs = content.split('\n\n').filter(p => p.trim().length > 20);
		if (paragraphs.length > 0) {
			positioning.mission = paragraphs[0].trim();
			console.log('🔍 Fallback mission:', positioning.mission.substring(0, 50));
		}
		
		// Try to extract any meaningful content from the step
		console.log('🔍 Trying to extract ANY content from step...');
		const lines = content.split('\n').filter(line => line.trim().length > 10);
		console.log('🔍 Content lines:', lines.slice(0, 5));
		
		// Use the first substantial line as mission if nothing else works
		if (lines.length > 0 && !positioning.mission) {
			positioning.mission = lines[0].trim();
			console.log('🔍 Using first line as mission:', positioning.mission.substring(0, 50));
		}
		
		// Use second substantial line as vision if available
		if (lines.length > 1 && !positioning.vision) {
			positioning.vision = lines[1].trim();
			console.log('🔍 Using second line as vision:', positioning.vision.substring(0, 50));
		}
	}
	
	// Parse colors
	const colors = colorStep 
		? parseColorPalette(colorStep.content)
		: {
			primary: {
				name: 'Brand Blue',
				hex: '#2563EB',
				rgb: 'RGB(37, 99, 235)',
				usage: 'Primary brand color'
			},
			secondary: {
				name: 'Brand Purple',
				hex: '#7C3AED',
				rgb: 'RGB(124, 58, 237)',
				usage: 'Secondary accents'
			}
		};
	
	// Parse typography
	console.log('🔍 Typography step found:', {
		hasTypographyStep: !!typographyStep,
		stepId: typographyStep?.stepId,
		contentLength: typographyStep?.content?.length,
		contentPreview: typographyStep?.content?.substring(0, 200)
	});

	const typography = typographyStep 
		? parseTypography(typographyStep.content)
		: {
			primaryFont: {
				name: 'Inter',
				weights: ['Regular (400)', 'Medium (500)', 'Bold (700)'],
				usage: 'Headlines, buttons, UI elements'
			},
			secondaryFont: {
				name: 'Source Sans Pro',
				weights: ['Regular (400)', 'SemiBold (600)'],
				usage: 'Body text, captions'
			}
		};

	console.log('🔍 Parsed typography result:', {
		primaryName: typography.primaryFont?.name,
		secondaryName: typography.secondaryFont?.name,
		primaryWeights: typography.primaryFont?.weights,
		secondaryWeights: typography.secondaryFont?.weights
	});
	
    // Build final adapted data
	const adapted = {
		// Slide 1: Cover
		brandName: frontendData.brandName || 'Your Brand',
        tagline: 'Brand Identity Guidelines 2025',
		
		// Slide 2: Brand Introduction
		positioningStatement: brandIntroduction.positioningStatement,
		brandVoice: brandIntroduction.brandVoice,
		brandTone: brandIntroduction.brandTone,
		brandPersonality: brandIntroduction.brandPersonality,
		
		// Slide 3: Brand Positioning
		mission: positioning.mission || 'Our mission statement',
		vision: positioning.vision || 'Our vision statement',
		values: positioning.values?.length > 0 ? positioning.values.join(', ') : 'Innovation, Excellence',
		personality: positioning.personality || frontendData.shortDescription || 'Our brand personality',
		
		// Brand positioning fields from builder form (for use in slides)
		selectedMood: frontendData.selectedMood || frontendData.mood,
		selectedAudience: frontendData.selectedAudience || frontendData.audience,
		brandValues: frontendData.brandValues || frontendData.brandValues,
		customPrompt: frontendData.customPrompt || frontendData.customPrompt,
		
		// Slide 3: Logo Guidelines
		logo: {
			primaryLogoUrl: frontendData.logoFiles?.[0]?.fileData || 
							frontendData.logoFiles?.[0]?.url || 
							frontendData.logoFiles?.[0]?.src ||
							frontendData.logoFiles?.[0]?.data ||
							frontendData.logoUrl ||
							frontendData.logo ||
							null,
			minimumSize: '32px',
			clearSpace: '10% padding'
		},
		
		// Slide 4: Color Palette
		colors: colors,
		
		// Slide 5: Typography
		typography: typography,
		
		// Slide 6: Iconography
		iconography: {
			style: 'Rounded, friendly icons',
			strokeWeight: '2px',
			sizeRange: '24px–48px'
		},
		
		// Slide 7: Photography
		photography: {
			style: ['Natural', 'Authentic', 'Professional'],
			dos: 'Use natural lighting and authentic scenes',
			donts: 'Avoid heavy filters and staged poses'
		},
		
		// Slide 8: Applications
		applications: [
			{ name: 'Business Cards', icon: '📄', description: 'Professional cards with logo and colors' },
			{ name: 'Website', icon: '🌐', description: 'Digital presence with consistent identity' },
			{ name: 'Social Media', icon: '📱', description: 'Posts, stories, and graphics' },
			{ name: 'Email Templates', icon: '📧', description: 'Branded email communications' },
			{ name: 'Presentations', icon: '📊', description: 'Pitch decks and slides' },
			{ name: 'Packaging', icon: '📦', description: 'Product packaging and labels' }
		],
		
		// Slide 9: Contact
        contact: {
			name: frontendData.contactName || frontendData.contact?.name || '',
			email: frontendData.contactEmail || frontendData.contact?.email || 'hello@yourbrand.com',
			role: frontendData.contactRole || frontendData.contact?.role || '',
			company: frontendData.contactCompany || frontendData.contact?.company || frontendData.brandName || '',
			website: frontendData.brandDomain || frontendData.contact?.website || 'www.yourbrand.com',
			phone: frontendData.contactPhone || frontendData.contact?.phone || null
        },

        // Titles per slide (from step history when available)
        titles: {
            positioning: positioningStep?.stepTitle || 'Brand Positioning',
            logoGuidelines: logoStep?.stepTitle || 'Logo Guidelines',
            colorPalette: colorStep?.stepTitle || 'Color Palette',
            typography: typographyStep?.stepTitle || 'Typography',
            iconography: iconStep?.stepTitle || 'Iconography',
            photography: photoStep?.stepTitle || 'Photography',
            applications: appStep?.stepTitle || 'Brand Applications',
            closing: 'Thank You'
        },

        // Preserve stepHistory for HTML generator to use
        stepHistory: steps.map((s: any) => ({
            step: s.stepId,
            title: s.stepTitle,
            content: s.content,
            approved: true
        }))
	};
	
	console.log('✅ Brand data adapted successfully', {
		brandName: adapted.brandName,
		hasMission: !!adapted.mission,
		hasVision: !!adapted.vision,
		valuesCount: adapted.values?.length || 0,
		hasColors: !!adapted.colors?.primary,
		hasTypography: !!adapted.typography?.primaryFont,
		hasLogo: !!adapted.logo,
		logoUrl: adapted.logo?.primaryLogoUrl,
		logoUrlType: typeof adapted.logo?.primaryLogoUrl,
		hasStepHistory: !!adapted.stepHistory,
		stepHistoryLength: adapted.stepHistory?.length || 0,
		iconographyStep: adapted.stepHistory?.find((s: any) => s.step === 'iconography')?.content?.substring(0, 100) || 'No iconography step'
	});
	
	return adapted;
}

/**
 * Validate adapted brand data
 */
export function validateAdaptedData(data: any): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	if (!data.brandName) errors.push('Brand name is required');
	if (!data.mission) errors.push('Mission is required');
	if (!data.vision) errors.push('Vision is required');
	if (!data.values || data.values.length === 0) errors.push('Values are required');
	if (!data.colors?.primary) errors.push('Primary color is required');
	if (!data.colors?.secondary) errors.push('Secondary color is required');
	if (!data.typography?.primaryFont) errors.push('Primary font is required');
	if (!data.contact?.website && !data.contact?.email) errors.push('Contact info is required');
	
	return {
		valid: errors.length === 0,
		errors
	};
}

