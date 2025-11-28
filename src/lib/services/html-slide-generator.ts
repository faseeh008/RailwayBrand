/**
 * HTML Slide Generator Service
 * 
 * This service wraps the html-to-pptx-converter for use in SvelteKit.
 * It handles the conversion of brand data to PowerPoint slides using
 * HTML templates and Puppeteer.
 */

import puppeteer from 'puppeteer';
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (go up from src/lib/services/)
const projectRoot = path.resolve(__dirname, '..', '..', '..');

/**
 * Extract iconography icons from step data
 */
function extractIconographyIcons(brandInput: any, fileName?: string, templateSet?: string): string {
	// Look for iconography step in stepHistory
	const stepHistory = brandInput.stepHistory || [];
	const iconographyStep = stepHistory.find((step: any) => step.step === 'iconography');
	
	// Normalize content to string (handle both string and object cases)
	const rawContent = iconographyStep?.content;
	let contentString = '';
	if (rawContent) {
		if (typeof rawContent === 'string') {
			contentString = rawContent;
		} else if (typeof rawContent === 'object' && rawContent !== null) {
			// If content is an object, try to extract text from common properties
			contentString = rawContent.rawText || rawContent.text || rawContent.content || JSON.stringify(rawContent);
		}
	}
	
	console.log('🔍 Extracting iconography icons:', {
		hasStepHistory: !!brandInput.stepHistory,
		stepHistoryLength: stepHistory.length,
		iconographyStep: !!iconographyStep,
		contentType: typeof rawContent,
		iconographyContent: contentString ? contentString.substring(0, 200) : 'No content',
		templateSet: templateSet
	});
	
	// Determine HTML format based on template (default vs alternate templates)
	// modern-minimal uses .icon-box wrapper
	// corporate-professional and creative-bold use .icon wrapper
	// default uses .icon-item wrapper
	const useAltFormat = !!templateSet && templateSet !== 'default';
	let iconWrapperClass = 'icon-item'; // default
	if (useAltFormat) {
		if (templateSet === 'modern-minimal') {
			iconWrapperClass = 'icon-box';
		} else {
			iconWrapperClass = 'icon'; // corporate-professional, creative-bold
		}
	}
	const iconSymbolClass = useAltFormat ? 'icon-symbol' : 'icon-circle';
	
	if (!iconographyStep || !contentString) {
		// Fallback to default icons if no iconography step found
		return generateIconHTML([
			{ symbol: '◐', name: 'Brand' },
			{ symbol: '★', name: 'Featured' },
			{ symbol: '♥', name: 'Favorites' },
			{ symbol: '◆', name: 'Premium' },
			{ symbol: '✓', name: 'Success' },
			{ symbol: '→', name: 'Navigation' },
			{ symbol: '⊕', name: 'Add' },
			{ symbol: '⚙', name: 'Settings' }
		], iconWrapperClass, iconSymbolClass);
	}
	
	// Extract icons from content using the same pattern as SmartPresentationAgent
	const icons: Array<{ symbol: string; name: string }> = [];
	const lines = contentString.split('\n');
	
	console.log(`🔍 Processing ${lines.length} lines from iconography content`);
	
	for (const line of lines) {
		console.log('🔍 Processing line:', line);
		// Match pattern: • Symbol Name (more flexible - any character that's not whitespace)
		const match = line.match(/^[\s]*[•\-\*]\s*([^\s]+)\s+(.+)/);
		if (match) {
			console.log('✅ Found icon:', { symbol: match[1], name: match[2] });
			icons.push({
				symbol: match[1].trim(),
				name: match[2].trim()
			});
		} else {
			console.log('❌ No match for line:', line);
		}
	}
	
	// Generate HTML for icons
	if (icons.length === 0) {
		console.log('⚠️ No icons found, using fallback');
		// Fallback if no icons found
		return generateIconHTML([
			{ symbol: '◐', name: 'Brand' },
			{ symbol: '★', name: 'Featured' }
		], iconWrapperClass, iconSymbolClass);
	}
	
	// Generate HTML for each icon
	console.log(`🎨 Generated ${icons.length} icons:`, icons);
	return generateIconHTML(icons, iconWrapperClass, iconSymbolClass);
}

/**
 * Generate icon HTML with the appropriate format
 */
function generateIconHTML(icons: Array<{ symbol: string; name: string }>, wrapperClass: string, symbolClass: string): string {
	return icons.map(icon => `
		<div class="${wrapperClass}">
			<div class="${symbolClass}">${icon.symbol}</div>
			<div class="icon-label">${icon.name}</div>
		</div>
	`).join('');
}

/**
 * Generate Logo Do's/Dont's HTML with images
 */
function generateLogoDoDontsWithImages(logoUrl: string, brandName: string, className: string, primaryColor: string, isDos: boolean): string[] {
	const logoImgNormal = `<img src="${logoUrl}" alt="${brandName} Logo" style="max-width: 100%; max-height: 100px; object-fit: contain; display: block; margin: 0 auto;">`;
	const logoImgStretched = `<img src="${logoUrl}" alt="${brandName} Logo" style="max-width: 100%; max-height: 100px; object-fit: contain; display: block; margin: 0 auto; transform: scaleX(1.25);">`;
	const logoImgFiltered = `<img src="${logoUrl}" alt="${brandName} Logo" style="max-width: 100%; max-height: 100px; object-fit: contain; display: block; margin: 0 auto; filter: drop-shadow(6px 6px 0 #000) blur(1px);">`;
	const strikeOverlay = '<div style="position:absolute; left: 12px; right: 12px; top: 50%; height: 4px; background: #EF4444; transform: rotate(-8deg); box-shadow: 0 0 0 2px rgba(255,255,255,0.5) inset;"></div>';
	
	if (isDos) {
		return [
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center;">${logoImgNormal}</div><div class="do-text">Use approved colors</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">${logoImgNormal}<div style="position:absolute; inset: 8px; border: 2px dashed rgba(0,0,0,0.3); border-radius: 4px; pointer-events: none;"></div></div><div class="do-text">Maintain clear space</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 80px; display: flex; align-items: center; justify-content: center;">${logoImgNormal}</div><div class="do-text">Respect minimum size</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #111 0%, ${primaryColor} 100%); border-radius: 8px;">${logoImgNormal}</div><div class="do-text">Ensure strong contrast</div></div>`
		];
	} else {
		return [
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center;">${logoImgStretched}${strikeOverlay}</div><div class="dont-text">Do not stretch or distort</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #A855F7 0%, #F97316 100%); border-radius: 8px;">${logoImgNormal}${strikeOverlay}</div><div class="dont-text">Do not change colors</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center;">${logoImgFiltered}${strikeOverlay}</div><div class="dont-text">Do not add effects</div></div>`,
			`<div class="${className}"><div style="position: relative; margin-bottom: 10px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(45deg, #222, #222 10px, #555 10px, #555 20px); border-radius: 8px;">${logoImgNormal}${strikeOverlay}</div><div class="dont-text">Do not place on busy backgrounds</div></div>`
		];
	}
}

/**
 * Replace template variables with brand data
 */
function replaceTemplateVars(html: string, brandInput: any, fileName?: string, templateSet?: string): string {
	let result = html;
	
	// Slide 1: Cover
	result = result.replace(/\{\{BRAND_NAME\}\}/g, brandInput.brandName || 'Your Brand');
	result = result.replace(/\{\{TAGLINE\}\}/g, brandInput.tagline || 'Brand Guidelines');
	result = result.replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	}));
	
    // Slide 2: Brand Positioning
    const titles = brandInput.titles || {};
    const defaultTitle = 'Brand Guidelines';
    // Try to use step-specific titles based on filename
    const perFileTitle = (() => {
        if (!fileName) return null;
        if (fileName.includes('slide-02')) return titles.positioning || 'Brand Positioning';
        if (fileName.includes('slide-03')) return titles.logoGuidelines || 'Logo Guidelines';
        if (fileName.includes('slide-04')) return titles.colorPalette || 'Color Palette';
        if (fileName.includes('slide-05')) return titles.typography || 'Typography';
        if (fileName.includes('slide-06')) return titles.iconography || 'Iconography';
        if (fileName.includes('slide-07')) return titles.photography || 'Photography';
        if (fileName.includes('slide-08')) return titles.applications || 'Brand Applications';
        if (fileName.includes('slide-09')) return titles.closing || 'Thank You';
        return null;
    })();

    result = result.replace(/\{\{TITLE\}\}/g, perFileTitle || defaultTitle);
	result = result.replace(/\{\{POSITIONING_STATEMENT\}\}/g, brandInput.positioningStatement || 'Our brand positioning statement');
	result = result.replace(/\{\{BRAND_VOICE\}\}/g, brandInput.brandVoice || 'Our brand voice');
	result = result.replace(/\{\{BRAND_TONE\}\}/g, brandInput.brandTone || 'Our brand tone');
	result = result.replace(/\{\{BRAND_PERSONALITY\}\}/g, brandInput.brandPersonality || 'Our brand personality');
	result = result.replace(/\{\{MISSION\}\}/g, brandInput.mission || 'Our mission statement');
	result = result.replace(/\{\{VISION\}\}/g, brandInput.vision || 'Our vision statement');
	result = result.replace(/\{\{VALUES\}\}/g, 
		Array.isArray(brandInput.values) 
			? brandInput.values.join(' • ') 
			: brandInput.values || 'Innovation • Excellence'
	);
	result = result.replace(/\{\{PERSONALITY\}\}/g, brandInput.personality || 'Our brand personality');
	
	// Introduction text - used in slide-02 across different templates
	result = result.replace(/\{\{INTRODUCTION_TEXT\}\}/g, brandInput.shortDescription || brandInput.brandIntroduction || 'is a leading brand in the industry');
	
	// Logo
	console.log('🔍 Logo data:', {
		hasLogo: !!brandInput.logo,
		primaryLogoUrl: brandInput.logo?.primaryLogoUrl,
		logoType: typeof brandInput.logo?.primaryLogoUrl,
		logoUrlLength: brandInput.logo?.primaryLogoUrl?.length || 0,
		logoUrlPreview: brandInput.logo?.primaryLogoUrl?.substring(0, 50) || 'N/A'
	});
	result = result.replace(/\{\{PRIMARY_LOGO_URL\}\}/g, brandInput.logo?.primaryLogoUrl || '');
	
	// Colors
	const colors = brandInput.colors || {};
	const primary = colors.primary || { hex: '#2563EB', name: 'Primary', rgb: 'RGB(37, 99, 235)', usage: 'Main' };
	const secondary = colors.secondary || { hex: '#7C3AED', name: 'Secondary', rgb: 'RGB(124, 58, 237)', usage: 'Accent' };
	const accent = colors.accent || { hex: '#10B981', name: 'Accent', rgb: 'RGB(16, 185, 129)', usage: 'Highlights' };
	const neutral = colors.neutral || { hex: '#6B7280', name: 'Neutral', rgb: 'RGB(107, 114, 128)', usage: 'Text' };
	
	result = result.replace(/\{\{PRIMARY_COLOR\}\}/g, primary.hex);
	result = result.replace(/\{\{PRIMARY_NAME\}\}/g, primary.name);
	result = result.replace(/\{\{PRIMARY_HEX\}\}/g, primary.hex);
	result = result.replace(/\{\{PRIMARY_RGB\}\}/g, primary.rgb || '');
	result = result.replace(/\{\{PRIMARY_USAGE\}\}/g, primary.usage || 'Main brand color');
	
	result = result.replace(/\{\{SECONDARY_COLOR\}\}/g, secondary.hex);
	result = result.replace(/\{\{SECONDARY_NAME\}\}/g, secondary.name);
	result = result.replace(/\{\{SECONDARY_HEX\}\}/g, secondary.hex);
	result = result.replace(/\{\{SECONDARY_RGB\}\}/g, secondary.rgb || '');
	result = result.replace(/\{\{SECONDARY_USAGE\}\}/g, secondary.usage || 'Accent color');
	
	result = result.replace(/\{\{ACCENT_COLOR\}\}/g, accent.hex);
	result = result.replace(/\{\{ACCENT_NAME\}\}/g, accent.name);
	result = result.replace(/\{\{ACCENT_HEX\}\}/g, accent.hex);
	result = result.replace(/\{\{ACCENT_RGB\}\}/g, accent.rgb || '');
	result = result.replace(/\{\{ACCENT_USAGE\}\}/g, accent.usage || 'Highlights');
	
	result = result.replace(/\{\{NEUTRAL_COLOR\}\}/g, neutral.hex);
	result = result.replace(/\{\{NEUTRAL_NAME\}\}/g, neutral.name);
	result = result.replace(/\{\{NEUTRAL_HEX\}\}/g, neutral.hex);
	result = result.replace(/\{\{NEUTRAL_RGB\}\}/g, neutral.rgb || '');
	result = result.replace(/\{\{NEUTRAL_USAGE\}\}/g, neutral.usage || 'Text and borders');
	
	// Support 8 colors for color palette slide
	const allColors = colors.allColors || [];
	
	// Build default colors array using primary/secondary/accent/neutral first
	const defaultColors = [
		primary,
		secondary,
		accent,
		neutral,
		{ hex: '#F59E0B', name: 'Color 5', rgb: 'RGB(245, 158, 11)', usage: 'Brand color' },
		{ hex: '#EF4444', name: 'Color 6', rgb: 'RGB(239, 68, 68)', usage: 'Brand color' },
		{ hex: '#8B5CF6', name: 'Color 7', rgb: 'RGB(139, 92, 246)', usage: 'Brand color' },
		{ hex: '#06B6D4', name: 'Color 8', rgb: 'RGB(6, 182, 212)', usage: 'Brand color' }
	];
	
	// Use allColors if available and has at least 4 colors, otherwise build from individual colors
	let colorPalette: any[];
	if (allColors.length >= 8) {
		colorPalette = allColors.slice(0, 8);
	} else if (allColors.length >= 4) {
		// Use allColors and fill remaining with defaults
		colorPalette = [...allColors, ...defaultColors.slice(allColors.length, 8)];
	} else if (allColors.length > 0) {
		// Use allColors and fill with primary/secondary/accent/neutral first, then defaults
		const baseColors = [primary, secondary, accent, neutral].filter(c => c && c.hex);
		const combined = [...allColors];
		// Add base colors that aren't already in allColors
		for (const baseColor of baseColors) {
			if (!combined.find((c: any) => c.hex === baseColor.hex)) {
				combined.push(baseColor);
			}
		}
		colorPalette = [...combined.slice(0, 8), ...defaultColors.slice(combined.length, 8)].slice(0, 8);
	} else {
		// Use primary/secondary/accent/neutral first, then defaults
		colorPalette = [primary, secondary, accent, neutral, ...defaultColors.slice(4, 8)].filter(c => c && c.hex).slice(0, 8);
	}
	
	// Helper function to convert hex to rgba with opacity
	function hexToRgba(hex: string, opacity: number = 1): string {
		if (!hex || !hex.startsWith('#')) return `rgba(0, 0, 0, ${opacity})`;
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}
	
	// Helper function to lighten a color (for backgrounds)
	function lightenColor(hex: string, amount: number = 0.9): string {
		if (!hex || !hex.startsWith('#')) return hex;
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		// Lighten by mixing with white
		const newR = Math.round(r + (255 - r) * amount);
		const newG = Math.round(g + (255 - g) * amount);
		const newB = Math.round(b + (255 - b) * amount);
		return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
	}
	
	// Replace COLOR_1 through COLOR_8 placeholders
	for (let i = 0; i < 8; i++) {
		const color = colorPalette[i] || defaultColors[i];
		const num = i + 1;
		const hex = color.hex || '#000000';
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_HEX\\}\\}`, 'g'), hex);
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_NAME\\}\\}`, 'g'), color.name || `Color ${num}`);
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGB\\}\\}`, 'g'), color.rgb || '');
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_USAGE\\}\\}`, 'g'), color.usage || color.category || 'Brand color');
		// Add light variants for backgrounds
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_LIGHT\\}\\}`, 'g'), lightenColor(hex, 0.85));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_LIGHTER\\}\\}`, 'g'), lightenColor(hex, 0.92));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_5\\}\\}`, 'g'), hexToRgba(hex, 0.05));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_8\\}\\}`, 'g'), hexToRgba(hex, 0.08));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_10\\}\\}`, 'g'), hexToRgba(hex, 0.1));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_12\\}\\}`, 'g'), hexToRgba(hex, 0.12));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_15\\}\\}`, 'g'), hexToRgba(hex, 0.15));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_20\\}\\}`, 'g'), hexToRgba(hex, 0.2));
		result = result.replace(new RegExp(`\\{\\{COLOR_${num}_RGBA_30\\}\\}`, 'g'), hexToRgba(hex, 0.3));
	}
	
	// Typography
	const typo = brandInput.typography || {};
	const primaryFont = typo.primaryFont || { name: 'Arial', weights: ['Regular', 'Bold'], usage: 'Headlines' };
	const secondaryFont = typo.secondaryFont || { name: 'Arial', weights: ['Regular'], usage: 'Body text' };
	
	result = result.replace(/\{\{PRIMARY_FONT\}\}/g, primaryFont.name);
	result = result.replace(/\{\{PRIMARY_FONT_WEIGHTS\}\}/g, 
		Array.isArray(primaryFont.weights) ? primaryFont.weights.join(', ') : primaryFont.weights || 'Regular, Bold'
	);
	// Support alternative variable name used in some templates
	result = result.replace(/\{\{PRIMARY_WEIGHTS\}\}/g, 
		Array.isArray(primaryFont.weights) ? primaryFont.weights.join(', ') : primaryFont.weights || 'Regular, Bold'
	);
	result = result.replace(/\{\{PRIMARY_FONT_USAGE\}\}/g, primaryFont.usage || 'Headlines');
	result = result.replace(/\{\{PRIMARY_FONT_SAMPLE\}\}/g, primaryFont.sample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789');
	
	result = result.replace(/\{\{SECONDARY_FONT\}\}/g, secondaryFont.name);
	result = result.replace(/\{\{SECONDARY_FONT_WEIGHTS\}\}/g, 
		Array.isArray(secondaryFont.weights) ? secondaryFont.weights.join(', ') : secondaryFont.weights || 'Regular'
	);
	// Support alternative variable name used in some templates
	result = result.replace(/\{\{SECONDARY_WEIGHTS\}\}/g, 
		Array.isArray(secondaryFont.weights) ? secondaryFont.weights.join(', ') : secondaryFont.weights || 'Regular'
	);
	result = result.replace(/\{\{SECONDARY_FONT_USAGE\}\}/g, secondaryFont.usage || 'Body text');
	result = result.replace(/\{\{SECONDARY_FONT_SAMPLE\}\}/g, secondaryFont.sample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789');
	
	// Contact
	const contact = brandInput.contact || {};
	result = result.replace(/\{\{CONTACT_WEBSITE\}\}/g, contact.website || '');
	result = result.replace(/\{\{CONTACT_EMAIL\}\}/g, contact.email || '');
	result = result.replace(/\{\{CONTACT_PHONE\}\}/g, contact.phone ? `<br>${contact.phone}` : '');
	result = result.replace(/\{\{DOMAIN\}\}/g, contact.website || 'your-website.com');
	
	// Iconography - Extract icons from step data
	console.log('🔍 Processing iconography icons for file:', fileName);
	const iconographyIcons = extractIconographyIcons(brandInput, fileName, templateSet);
	console.log('🎨 Generated iconography HTML:', iconographyIcons.substring(0, 200) + '...');
	result = result.replace(/\{\{ICONOGRAPHY_ICONS\}\}/g, iconographyIcons);
	// Support alternative variable name used in some templates
	result = result.replace(/\{\{ICON_EXAMPLES\}\}/g, iconographyIcons);
	
	// Debug: Check if placeholder was replaced
	if (fileName && fileName.includes('slide-07-iconography')) {
		console.log('🔍 Final iconography HTML contains placeholder:', result.includes('{{ICONOGRAPHY_ICONS}}'));
		console.log('🔍 Final iconography HTML contains generated icons:', result.includes('icon-circle'));
	}
	
	// Logo Guidelines - Extract from brand data
	const logo = brandInput.logo || {};
	const logoUrl = brandInput.logo?.primaryLogoUrl || '';
	
	// Generate logo HTML - use image if available, otherwise text fallback
	// Set reasonable max dimensions to prevent overflow - template containers vary
	const logoPlaceholder = logoUrl 
		? `<img src="${logoUrl}" alt="${brandInput.brandName || 'Your Brand'} Logo" style="max-width: 200px; max-height: 200px; object-fit: contain; display: block; margin: 0 auto;">`
		: brandInput.brandName || 'Your Brand';
	result = result.replace(/\{\{LOGO_PLACEHOLDER\}\}/g, logoPlaceholder);
	result = result.replace(/\{\{MIN_SIZE\}\}/g, logo.minimumSize || '32px');
	result = result.replace(/\{\{CLEAR_SPACE\}\}/g, logo.clearSpace || '10% padding');
	result = result.replace(/\{\{USAGE\}\}/g, logo.usage || 'Use on all brand materials');
	result = result.replace(/\{\{VARIANTS\}\}/g, logo.variants || 'Full color and monochrome');
	
	// Photography - Extract from brand data
	const photography = brandInput.photography || {};
	result = result.replace(/\{\{PHOTO_STYLE\}\}/g, 
		Array.isArray(photography.style) ? photography.style.join(', ') : photography.style || 'Natural & Authentic'
	);
	result = result.replace(/\{\{PHOTO_GUIDELINES\}\}/g, photography.guidelines || 'Use natural lighting and authentic scenes');
	
	// Applications - Extract from brand data
	const applications = brandInput.applications || [];
	const applicationsHtml = applications.length > 0 
		? applications.map((app: any) => `
			<div class="app-box">
				<div class="app-icon">${app.icon || '📄'}</div>
				<div class="app-name">${app.name}</div>
				<div class="app-desc">${app.description}</div>
			</div>
		`).join('')
		: '<div class="app-box"><div class="app-name">No applications specified</div></div>';
	result = result.replace(/\{\{APPLICATION_EXAMPLES\}\}/g, applicationsHtml);
	
	// Logo Do's and Don'ts - Generate from logo data
	// Different templates use different CSS classes
	const doClass = templateSet === 'modern-minimal' ? 'do-box' : 'do-item';
	const dontClass = templateSet === 'modern-minimal' ? 'dont-box' : 'dont-item';
	
	// Generate DO's with images if logo URL is available
	const dosWithImages = logoUrl ? generateLogoDoDontsWithImages(logoUrl, brandInput.brandName || 'Your Brand', doClass, primary.hex, true) : [];
	const dontsWithImages = logoUrl ? generateLogoDoDontsWithImages(logoUrl, brandInput.brandName || 'Your Brand', dontClass, primary.hex, false) : [];
	
	const logoDos = logo.dos || dosWithImages.length > 0 ? dosWithImages : [
		`<div class="${doClass}"><div class="do-text">Use approved colors</div></div>`,
		`<div class="${doClass}"><div class="do-text">Maintain clear space</div></div>`,
		`<div class="${doClass}"><div class="do-text">Respect minimum size</div></div>`,
		`<div class="${doClass}"><div class="do-text">Ensure strong contrast</div></div>`
	];
	result = result.replace(/\{\{LOGO_DOS\}\}/g, 
		Array.isArray(logoDos) ? logoDos.join('') : logoDos
	);
	
	const logoDonts = logo.donts || dontsWithImages.length > 0 ? dontsWithImages : [
		`<div class="${dontClass}"><div class="dont-text">Do not stretch or distort</div></div>`,
		`<div class="${dontClass}"><div class="dont-text">Do not change colors</div></div>`,
		`<div class="${dontClass}"><div class="dont-text">Do not add effects</div></div>`,
		`<div class="${dontClass}"><div class="dont-text">Do not place on busy backgrounds</div></div>`
	];
	result = result.replace(/\{\{LOGO_DONTS\}\}/g, 
		Array.isArray(logoDonts) ? logoDonts.join('') : logoDonts
	);
	
	// Fix creative-bold color palette overflow issue
	if (templateSet === 'creative-bold' && fileName && fileName.includes('slide-05-color-palette')) {
		console.log('🔧 Applying creative-bold color palette overflow fix');
		// Inject custom CSS to reduce spacing
		const overflowFix = `
<style>
/* Override creative-bold color palette spacing to prevent overflow */
.slide { padding: 50px 60px !important; }
.title { font-size: 56px !important; margin-bottom: 30px !important; }
.colors { gap: 20px !important; }
.swatch { height: 140px !important; }
.info { padding: 15px !important; }
.color-name { font-size: 16px !important; margin-bottom: 5px !important; }
.color-hex { font-size: 18px !important; margin-bottom: 3px !important; }
.color-usage { font-size: 11px !important; }
</style>
`;
		// Inject before </head>
		result = result.replace('</head>', overflowFix + '</head>');
	}
	
	// Fix for creative-bold iconography: black text on black background
	if (templateSet === 'creative-bold' && fileName && fileName.includes('slide-07-iconography')) {
		console.log('🔧 Fixing creative-bold iconography text visibility');
		const iconographyFix = `
<style>
/* Fix black text on black background in creative-bold iconography */
.icon-label { color: #FFFFFF !important; }
</style>
`;
		// Inject before </head>
		result = result.replace('</head>', iconographyFix + '</head>');
	}
	
	// Fix for alternate templates: replace hardcoded "Aa" or "ABCD..." with font names
	if (templateSet && templateSet !== 'default' && fileName && fileName.includes('slide-06-typography')) {
		console.log('🔧 Injecting font names for alternate typography template');
		// Replace patterns that match ANY font name (for primary and secondary)
		// Pattern 1: "Aa" with any font-family
		result = result.replace(
			/(<div class="font-display"[^>]*style="font-family:\s*'[^']+'[^"]*"[^>]*>)Aa(<\/div>)/g,
			(match, p1, p2) => {
				// Check if this is primary or secondary font based on the font name in style
				const isPrimary = match.includes(primaryFont.name);
				const fontName = isPrimary ? primaryFont.name : secondaryFont.name;
				return `${p1}${fontName}<br><span style="font-size: 0.5em; opacity: 0.7;">Aa</span>${p2}`;
			}
		);
		// Pattern 2: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" with any font-family
		result = result.replace(
			/(<div class="font-display"[^>]*style="font-family:\s*'[^']+'[^"]*"[^>]*>)ABCDEFGHIJKLMNOPQRSTUVWXYZ(<\/div>)/g,
			(match, p1, p2) => {
				// Check if this is primary or secondary font based on the font name in style
				const isPrimary = match.includes(primaryFont.name);
				const fontName = isPrimary ? primaryFont.name : secondaryFont.name;
				return `${p1}${fontName}<br><span style="font-size: 0.3em; opacity: 0.7;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>${p2}`;
			}
		);
	}
	
	return result;
}

/**
 * Convert HTML to image using Puppeteer
 */
async function htmlToImage(htmlPath: string, outputPath: string, brandInput: any, templateSet?: string): Promise<void> {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox', 
			'--disable-setuid-sandbox',
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--disable-extensions',
			'--disable-background-timer-throttling',
			'--disable-backgrounding-occluded-windows',
			'--disable-renderer-backgrounding'
		]
	});
	
	try {
		const page = await browser.newPage();
		
		await page.setViewport({
			width: 1280,
			height: 720,
			deviceScaleFactor: 2
		});
		
        let html = fs.readFileSync(htmlPath, 'utf8');
        const fileName = path.basename(htmlPath);
        html = replaceTemplateVars(html, brandInput, fileName, templateSet);
		
		await page.setContent(html, {
			waitUntil: 'domcontentloaded',
			timeout: 60000
		});
		
		// Wait for any additional content to load
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		await page.screenshot({
			path: outputPath as `${string}.png`,
			type: 'png',
			fullPage: false
		});
		
		console.log(`✓ Generated: ${path.basename(outputPath)}`);
		
	} finally {
		await browser.close();
	}
}

/**
 * Create PPTX from images
 */
async function createPptxFromImages(imageFiles: string[], outputPath: string, brandInput: any): Promise<Buffer> {
	const pptx = new PptxGenJS();
	pptx.layout = 'LAYOUT_16x9';
	pptx.author = 'EternaBrand AI';
	pptx.title = `${brandInput.brandName} Brand Guidelines`;
	
	for (const imageFile of imageFiles) {
		const slide = pptx.addSlide();
		slide.addImage({
			path: imageFile,
			x: 0,
			y: 0,
			w: '100%',
			h: '100%'
		});
	}
	
	const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
	fs.writeFileSync(outputPath, buffer);
	
	console.log(`✅ PPTX created: ${outputPath}`);
	console.log(`   Slides: ${imageFiles.length}`);
	console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
	
	return buffer;
}

/**
 * Main conversion function
 */
export async function convertHtmlToPptx(brandInput: any, templateSet?: string): Promise<string> {
	console.log('🎨 HTML to PPTX Converter Starting...');
	console.log(`📋 Brand: ${brandInput.brandName}`);
	console.log(`🎨 Template Set: ${templateSet || 'default (root)'}`);
	
	// Support different template sets
	const templateDir = templateSet 
		? path.join(projectRoot, 'templates', 'html', templateSet)
		: path.join(projectRoot, 'templates', 'html');
	
	const templatesDir = templateDir;
	const imagesDir = path.join(projectRoot, 'templates', 'images');
	const outputDir = path.join(projectRoot, 'test-output');
	
	// Create directories
	[imagesDir, outputDir].forEach(dir => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	});
	
    // HTML template files (in order)
    const templates = [
		'slide-01-cover.html',
		'slide-02-brand-introduction.html',
		'slide-03-brand-positioning.html',
		'slide-04-logo-guidelines.html',
		'slide-10-logo-dos.html',
		'slide-11-logo-donts.html',
		'slide-05-color-palette.html',
		'slide-06-typography.html',
		'slide-07-iconography.html',
		'slide-08-photography.html',
		'slide-09-applications.html',
        'slide-12-thank-you.html'
	];
	
	console.log('📸 Converting HTML templates to images...');
	
	// Convert each HTML to image
	const imageFiles: string[] = [];
	for (let i = 0; i < templates.length; i++) {
		const htmlPath = path.join(templatesDir, templates[i]);
		const imagePath = path.join(imagesDir, `slide-${i + 1}.png`);
		
		if (fs.existsSync(htmlPath)) {
			await htmlToImage(htmlPath, imagePath, brandInput, templateSet);
			imageFiles.push(imagePath);
		} else {
			console.log(`⚠️  Template not found: ${templates[i]}`);
		}
	}
	
	console.log('📊 Creating PPTX presentation...');
	
	// Create PPTX with brand name
	const sanitizedName = brandInput.brandName.replace(/[^a-zA-Z0-9]/g, '-');
	const pptxPath = path.join(outputDir, `${sanitizedName}-Brand-Guidelines.pptx`);
	await createPptxFromImages(imageFiles, pptxPath, brandInput);
	
	console.log('✨ Done!');
	
	return pptxPath;
}

/**
 * Build filled HTML strings for preview (without rendering to images)
 */
export function buildFilledHtmlSlides(brandInput: any, templateSet?: string): Array<{ name: string; html: string }> {
    // Support different template sets
    const templateDir = templateSet 
        ? path.join(projectRoot, 'templates', 'html', templateSet)
        : path.join(projectRoot, 'templates', 'html');
    
    const templatesDir = templateDir;
    const templateFiles = [
        'slide-01-cover.html',
        'slide-02-brand-introduction.html',
        'slide-03-brand-positioning.html',
        'slide-04-logo-guidelines.html',
        'slide-10-logo-dos.html',
        'slide-11-logo-donts.html',
        'slide-05-color-palette.html',
        'slide-06-typography.html',
        'slide-07-iconography.html',
        'slide-08-photography.html',
        'slide-09-applications.html',
        'slide-12-thank-you.html'
    ];

    const slides: Array<{ name: string; html: string }> = [];
    for (const file of templateFiles) {
        const htmlPath = path.join(templatesDir, file);
        if (!fs.existsSync(htmlPath)) {
            continue;
        }
        const raw = fs.readFileSync(htmlPath, 'utf8');
        const filled = replaceTemplateVars(raw, brandInput, file, templateSet);
        slides.push({ name: file, html: filled });
    }
    return slides;
}

/**
 * Convert saved HTML slides directly to PPTX (without regenerating from templates)
 */
export async function convertHtmlToPptxFromSlides(savedSlides: Array<{ name: string; html: string }>): Promise<string> {
	const projectRoot = process.cwd();
	const outputDir = path.join(projectRoot, 'test-output');
	
	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}
	
	console.log('📋 Converting saved slides to PPTX...', {
		slidesCount: savedSlides.length,
		slideNames: savedSlides.map(s => s.name)
	});
	
	// Convert each saved HTML slide to image
	const imageFiles: string[] = [];
	
	for (let i = 0; i < savedSlides.length; i++) {
		const slide = savedSlides[i];
		const imagePath = path.join(outputDir, `slide-${i + 1}.png`);
		
		try {
			await htmlToImageFromString(slide.html, imagePath);
			imageFiles.push(imagePath);
			console.log(`✓ Generated: slide-${i + 1}.png`);
		} catch (error) {
			console.error(`❌ Failed to generate slide ${i + 1}:`, error);
		}
	}
	
	// Create PPTX from images
	const pptx = new PptxGenJS();
	
	// Add each slide as an image
	imageFiles.forEach((imagePath, index) => {
		const slide = pptx.addSlide();
		slide.addImage({
			path: imagePath,
			x: 0,
			y: 0,
			w: '100%',
			h: '100%'
		});
	});
	
	// Generate PPTX file
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `saved-slides-${timestamp}.pptx`;
	const filepath = path.join(outputDir, filename);
	
	await pptx.writeFile({ fileName: filepath });
	
	// Clean up image files
	imageFiles.forEach(imagePath => {
		if (fs.existsSync(imagePath)) {
			fs.unlinkSync(imagePath);
		}
	});
	
	console.log(`✅ PPTX created from saved slides: ${filepath}`);
	return filepath;
}

/**
 * Convert HTML string directly to image using Puppeteer
 */
async function htmlToImageFromString(htmlContent: string, outputPath: string): Promise<void> {
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	
	try {
		const page = await browser.newPage();
		
		await page.setViewport({
			width: 1280,
			height: 720,
			deviceScaleFactor: 2
		});
		
		await page.setContent(htmlContent, {
			waitUntil: 'networkidle0'
		});
		
		await page.screenshot({
			path: outputPath,
			fullPage: false,
			type: 'png'
		} as any);
	} finally {
		await browser.close();
	}
}

