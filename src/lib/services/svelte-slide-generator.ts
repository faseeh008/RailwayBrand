import type { SlideData } from '$lib/types/slide-data';
import { iconNameToBase64Image } from '$lib/utils/icon-to-image';

/**
 * Generate complete Svelte slide data from brand input
 * Matches the structure created by actual Svelte components
 */
export async function buildFilledSvelteSlides(brandInput: any): Promise<SlideData[]> {
	const slides: SlideData[] = [];
	
	// Extract colors
	const colors = brandInput.colors || {};
	const primary = colors.primary || { hex: '#2563EB', name: 'Primary', rgb: 'RGB(37, 99, 235)', usage: 'Main' };
	const secondary = colors.secondary || { hex: '#7C3AED', name: 'Secondary', rgb: 'RGB(124, 58, 237)', usage: 'Accent' };
	const accent = colors.accent || { hex: '#10B981', name: 'Accent', rgb: 'RGB(16, 185, 129)', usage: 'Highlights' };
	const neutral = colors.neutral || { hex: '#6B7280', name: 'Neutral', rgb: 'RGB(107, 114, 128)', usage: 'Text' };
	
	// Extract all colors array (for color palette slide)
	const allColors = colors.allColors || colors.core_palette || [
		primary,
		secondary,
		accent,
		neutral
	];
	
	// Fill to 8 colors if needed (matching HTML generator logic)
	const displayColors = [...allColors];
	if (displayColors.length < 8) {
		const defaultColors = [
			{ name: 'Color 5', hex: '#F59E0B', usage: 'Brand color' },
			{ name: 'Color 6', hex: '#EF4444', usage: 'Brand color' },
			{ name: 'Color 7', hex: '#8B5CF6', usage: 'Brand color' },
			{ name: 'Color 8', hex: '#06B6D4', usage: 'Brand color' }
		];
		for (let i = displayColors.length; i < 8; i++) {
			displayColors.push(defaultColors[i - 4] || defaultColors[0]);
		}
	}
	
	// Helper to clean hex color
	const cleanHex = (hex: string) => (hex || '').replace('#', '').toUpperCase();
	
	// Helper to lighten color (simple approximation)
	const lightenColor = (hex: string, percent: number = 20): string => {
		if (!hex) return 'FFFFFF';
		const num = parseInt(hex.replace('#', ''), 16);
		const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent / 100));
		const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent / 100));
		const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent / 100));
		return ((r << 16) | (g << 8) | b).toString(16).toUpperCase().padStart(6, '0');
	};
	
	// Helper: Convert pixels to inches (1280px = 10in, 720px = 5.625in)
	const pxToIn = (px: number) => (px / 1280) * 10;
	const pyToIn = (py: number) => (py / 720) * 5.625;
	
	const color1Hex = cleanHex(primary.hex);
	const color2Hex = cleanHex(secondary.hex);
	const color3Hex = cleanHex(accent.hex);
	const color4Hex = cleanHex(neutral.hex);
	const color1Lighter = lightenColor(primary.hex, 20);
	const color2Lighter = lightenColor(secondary.hex, 20);
	const color3Lighter = lightenColor(accent.hex, 20);
	const color4Lighter = lightenColor(neutral.hex, 20);
	const color5Lighter = lightenColor(displayColors[4]?.hex || '#F59E0B', 20);
	const color6Lighter = lightenColor(displayColors[5]?.hex || '#EF4444', 20);
	const color7Lighter = lightenColor(displayColors[6]?.hex || '#8B5CF6', 20);
	const color8Lighter = lightenColor(displayColors[7]?.hex || '#06B6D4', 20);
	
	// Extract brand data
	const brandName = brandInput.brandName || 'Your Brand';
	const tagline = brandInput.tagline || 'Brand Guidelines';
	const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	const positioningStatement = brandInput.positioningStatement || 'Our brand positioning statement';
	const mission = brandInput.mission || 'Our mission statement';
	const vision = brandInput.vision || 'Our vision statement';
	
	// Use brandValues if provided, otherwise use parsed values
	const brandValuesText = brandInput.brandValues || '';
	const parsedValues = Array.isArray(brandInput.values) 
		? brandInput.values.join(' • ') 
		: brandInput.values || 'Innovation • Excellence';
	const values = brandValuesText ? brandValuesText.substring(0, 200) : parsedValues; // Limit length for slide
	
	// Use selectedAudience if provided, otherwise use personality
	const selectedAudience = brandInput.selectedAudience || '';
	const personality = selectedAudience || brandInput.personality || 'Our brand personality';
	
	// Extract mood and custom prompt for potential use
	const selectedMood = brandInput.selectedMood || '';
	const customPrompt = brandInput.customPrompt || '';
	const primaryFont = brandInput.typography?.primary || brandInput.primaryFont || 'Arial';
	const secondaryFont = brandInput.typography?.secondary || brandInput.secondaryFont || 'Arial';
	const logoData = brandInput.logo?.primaryLogoUrl || brandInput.logoData || '';
	const logoUrl = brandInput.logo?.primaryLogoUrl || brandInput.logoUrl || '';
	// Extract contact information
	const contactName = brandInput.contact?.name || '';
	const contactEmail = brandInput.contact?.email || brandInput.email || 'contact@example.com';
	const contactRole = brandInput.contact?.role || '';
	const contactCompany = brandInput.contact?.company || brandInput.brandName || '';
	const website = brandInput.contact?.website || brandInput.website || 'your-website.com';
	const phone = brandInput.contact?.phone || brandInput.phone || '';
	const thankYouText = brandInput.thankYouText || 'Thank You';
	const subtitleText = brandInput.subtitleText || 'Let\'s Create Something Amazing Together';
	const hierarchyH1 = brandInput.hierarchyH1 || 'H1: 32pt - Main titles';
	const hierarchyH2 = brandInput.hierarchyH2 || 'H2: 24pt - Section headers';
	const hierarchyH3 = brandInput.hierarchyH3 || 'H3: 20pt - Subsection headers';
	const hierarchyBody = brandInput.hierarchyBody || 'Body: 16pt - Main content';
	
	// Extract icons
	const icons = brandInput.iconography?.icons || brandInput.icons || [
		{ symbol: '🎨', name: 'Design' },
		{ symbol: '💡', name: 'Innovation' },
		{ symbol: '🚀', name: 'Growth' },
		{ symbol: '🌟', name: 'Excellence' },
		{ symbol: '🤝', name: 'Partnership' },
		{ symbol: '📊', name: 'Analytics' },
		{ symbol: '🔒', name: 'Security' },
		{ symbol: '⚡', name: 'Speed' }
	];
	
	// Extract applications
	const applications = brandInput.applications || [
		{ icon: '📱', name: 'Mobile App', description: 'iOS and Android applications' },
		{ icon: '🌐', name: 'Website', description: 'Responsive web platform' },
		{ icon: '📧', name: 'Email', description: 'Email templates and campaigns' },
		{ icon: '📄', name: 'Documents', description: 'Business cards and letterheads' }
	];
	
	// Slide 1: Cover
	slides.push({
		id: 'cover-slide',
		type: 'cover',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color1Hex, color2Hex, color3Hex, color4Hex],
					direction: 135
				}
			}
		},
		elements: [
			{
				id: 'brand-name',
				type: 'text' as const,
				position: { x: 0.5, y: 2.0, w: 9, h: 1.5 },
				text: brandName.toUpperCase(),
				fontSize: 64,
				fontFace: 'Arial',
				bold: true,
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: 'tagline',
				type: 'text' as const,
				position: { x: 0.5, y: 3.6, w: 9, h: 0.6 },
				text: tagline,
				fontSize: 32,
				fontFace: 'Arial',
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: 'date',
				type: 'text' as const,
				position: { x: 0.5, y: 4.6, w: 9, h: 0.4 },
				text: date,
				fontSize: 16,
				fontFace: 'Arial',
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			}
		]
	});
	
	// Slide 2: Brand Introduction
	slides.push({
		id: 'brand-introduction',
		type: 'brand-introduction',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color1Lighter, color2Lighter, color3Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: [
			{
				id: 'title',
				type: 'text' as const,
				position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
				text: 'Brand Introduction',
				fontSize: 36,
				fontFace: 'Arial',
				bold: true,
				color: color1Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'divider',
				type: 'shape' as const,
				position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
				shapeType: 'rect',
				fillColor: color1Hex,
				zIndex: 2
			},
			{
				id: 'card-bg',
				type: 'shape' as const,
				position: { x: 1.25, y: 2.5, w: 7.5, h: 2.0 },
				shapeType: 'rect',
				fillColor: 'FFFFFF',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: 'border-left',
				type: 'shape' as const,
				position: { x: 1.25, y: 2.5, w: 0.15, h: 2.0 },
				shapeType: 'rect',
				fillColor: color1Hex,
				zIndex: 2
			},
			{
				id: 'positioning-statement',
				type: 'text' as const,
				position: { x: 1.5, y: 2.5, w: 7.25, h: 2.0 },
				text: positioningStatement,
				fontSize: 20,
				fontFace: 'Arial',
				color: '333333',
				align: 'left' as const,
				valign: 'middle' as const,
				zIndex: 2
			}
		]
	});
	
	// Slide 3: Brand Positioning
	slides.push({
		id: 'brand-positioning',
		type: 'brand-positioning',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color2Lighter, color3Lighter, 'FFFFFF', color1Lighter],
					direction: 135
				}
			}
		},
		elements: [
			{
				id: 'title',
				type: 'text' as const,
				position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
				text: 'BRAND POSITIONING',
				fontSize: 36,
				fontFace: 'Arial',
				bold: true,
				color: color1Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'divider',
				type: 'shape' as const,
				position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
				shapeType: 'rect',
				fillColor: color1Hex,
				zIndex: 2
			},
			{
				id: 'mission-card',
				type: 'shape' as const,
				position: { x: 0.47, y: 1.11, w: 3.65, h: 1.25 },
				shapeType: 'rect',
				fillColor: color1Lighter,
				lineColor: color1Hex,
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: 'mission-title',
				type: 'text' as const,
				position: { x: 0.57, y: 1.21, w: 3.45, h: 0.25 },
				text: 'MISSION',
				fontSize: 16,
				fontFace: 'Arial',
				bold: true,
				color: color1Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'mission-content',
				type: 'text' as const,
				position: { x: 0.57, y: 1.46, w: 3.45, h: 0.8 },
				text: mission,
				fontSize: 12,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'vision-card',
				type: 'shape' as const,
				position: { x: 4.32, y: 1.11, w: 3.65, h: 1.25 },
				shapeType: 'rect',
				fillColor: color2Lighter,
				lineColor: color2Hex,
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: 'vision-title',
				type: 'text' as const,
				position: { x: 4.42, y: 1.21, w: 3.45, h: 0.25 },
				text: 'VISION',
				fontSize: 16,
				fontFace: 'Arial',
				bold: true,
				color: color2Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'vision-content',
				type: 'text' as const,
				position: { x: 4.42, y: 1.46, w: 3.45, h: 0.8 },
				text: vision,
				fontSize: 12,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'values-card',
				type: 'shape' as const,
				position: { x: 0.47, y: 2.56, w: 9.06, h: 1.25 },
				shapeType: 'rect',
				fillColor: color3Lighter,
				lineColor: color3Hex,
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: 'values-title',
				type: 'text' as const,
				position: { x: 0.57, y: 2.66, w: 8.86, h: 0.25 },
				text: 'CORE VALUES',
				fontSize: 16,
				fontFace: 'Arial',
				bold: true,
				color: color3Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'values-content',
				type: 'text' as const,
				position: { x: 0.57, y: 2.91, w: 8.86, h: 0.8 },
				text: values,
				fontSize: 12,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'audience-card',
				type: 'shape' as const,
				position: { x: 0.47, y: 4.01, w: 9.06, h: 1.25 },
				shapeType: 'rect',
				fillColor: color3Lighter,
				lineColor: color3Hex,
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: 'audience-title',
				type: 'text' as const,
				position: { x: 0.57, y: 4.11, w: 8.86, h: 0.25 },
				text: 'TARGET AUDIENCE',
				fontSize: 16,
				fontFace: 'Arial',
				bold: true,
				color: color3Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'audience-content',
				type: 'text' as const,
				position: { x: 0.57, y: 4.36, w: 8.86, h: 0.8 },
				text: personality,
				fontSize: 12,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		]
	});
	
	// Add mood section if available (insert before audience section)
	if (selectedMood) {
		const moodIndex = slides[slides.length - 1].elements.findIndex((e: any) => e.id === 'audience-card');
		if (moodIndex !== -1) {
			const moodCard = {
				id: 'mood-card',
				type: 'shape' as const,
				position: { x: 0.47, y: 3.31, w: 4.4, h: 0.6 },
				shapeType: 'rect',
				fillColor: color4Lighter,
				lineColor: color4Hex,
				lineWidth: 2,
				zIndex: 1
			};
			const moodTitle = {
				id: 'mood-title',
				type: 'text' as const,
				position: { x: 0.57, y: 3.36, w: 4.2, h: 0.2 },
				text: 'BRAND MOOD',
				fontSize: 14,
				fontFace: 'Arial',
				bold: true,
				color: color4Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			};
			const moodContent = {
				id: 'mood-content',
				type: 'text' as const,
				position: { x: 0.57, y: 3.56, w: 4.2, h: 0.3 },
				text: selectedMood,
				fontSize: 11,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			};
			
			// Adjust audience card position down
			const audienceCard = slides[slides.length - 1].elements.find((e: any) => e.id === 'audience-card');
			if (audienceCard) {
				audienceCard.position.y = 4.21; // Move down by 0.2
			}
			const audienceTitle = slides[slides.length - 1].elements.find((e: any) => e.id === 'audience-title');
			if (audienceTitle) {
				audienceTitle.position.y = 4.31;
			}
			const audienceContent = slides[slides.length - 1].elements.find((e: any) => e.id === 'audience-content');
			if (audienceContent) {
				audienceContent.position.y = 4.56;
			}
			
			// Insert mood elements before audience
			slides[slides.length - 1].elements.splice(moodIndex, 0, moodCard, moodTitle, moodContent);
		}
	}
	
	// Slide 4: Logo Guidelines
	const logoGuidelinesElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Logo Guidelines',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	// Add logo section if logo data exists
	if (logoData || logoUrl) {
		const logoPlaceholderSize = pxToIn(200);
		const logoPlaceholderX = pxToIn(60) + pxToIn(30);
		const logoPlaceholderY = pyToIn(140) + pyToIn(30);
		
		logoGuidelinesElements.push(
			{
				id: 'logo-section-bg',
				type: 'shape' as const,
				position: { x: pxToIn(60), y: pyToIn(140), w: pxToIn(500), h: pyToIn(400) },
				shapeType: 'rect',
				fillColor: 'FFFFFF',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: 'section-title',
				type: 'text' as const,
				position: { x: pxToIn(90), y: pyToIn(170), w: pxToIn(440), h: pyToIn(20) },
				text: 'Primary Logo',
				fontSize: 18,
				fontFace: 'Arial',
				bold: true,
				color: color1Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'logo-placeholder-bg',
				type: 'shape' as const,
				position: { x: logoPlaceholderX, y: logoPlaceholderY, w: logoPlaceholderSize, h: logoPlaceholderSize },
				shapeType: 'rect',
				fillColor: 'F8F9FA',
				lineColor: 'DDDDDD',
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: 'logo',
				type: 'image' as const,
				position: { 
					x: logoPlaceholderX + pxToIn(10), 
					y: logoPlaceholderY + pxToIn(10), 
					w: logoPlaceholderSize - pxToIn(20), 
					h: logoPlaceholderSize - pxToIn(20)
				},
				imageData: logoData || undefined,
				imageSrc: logoUrl || undefined,
				zIndex: 2
			}
		);
	}
	
	slides.push({
		id: 'logo-guidelines',
		type: 'logo-guidelines',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color1Lighter, color2Lighter, 'FFFFFF', color3Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: logoGuidelinesElements
	});
	
	// Slide 5: Logo Do's
	const logoDosElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Logo Do\'s',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	// Add DO example cards
	const doExamples = [
		{ title: 'Use Official Colors', hint: 'Always use brand colors' },
		{ title: 'Maintain Clear Space', hint: 'Keep 10% padding around logo' },
		{ title: 'Respect Minimum Size', hint: 'Never smaller than 32px' },
		{ title: 'Ensure Contrast', hint: 'Use sufficient contrast with backgrounds' }
	];
	
	const cardGap = pxToIn(28);
	const rowGap = pyToIn(28);
	const cardWidth = pxToIn(300);
	const cardHeight = pyToIn(200);
	const cardsStartX = pxToIn(60);
	const cardsStartY = pyToIn(140);
	
	doExamples.forEach((example, index) => {
		const col = index % 2;
		const row = Math.floor(index / 2);
		const cardX = cardsStartX + col * (cardWidth + cardGap);
		const cardY = cardsStartY + row * (cardHeight + rowGap);
		
		logoDosElements.push(
			{
				id: `do-card-${index}`,
				type: 'shape' as const,
				position: { x: cardX, y: cardY, w: cardWidth, h: cardHeight },
				shapeType: 'rect',
				fillColor: 'FFFFFF',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: `do-badge-${index}`,
				type: 'shape' as const,
				position: { x: cardX + pxToIn(20), y: cardY + pxToIn(20), w: pxToIn(60), h: pyToIn(30) },
				shapeType: 'rect',
				fillColor: 'D1FAE5',
				lineColor: '10B981',
				lineWidth: 2,
				zIndex: 2
			},
			{
				id: `do-badge-text-${index}`,
				type: 'text' as const,
				position: { x: cardX + pxToIn(20), y: cardY + pxToIn(20), w: pxToIn(60), h: pyToIn(30) },
				text: 'DO',
				fontSize: 11,
				fontFace: 'Arial',
				bold: true,
				color: '065F46',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 3
			},
			{
				id: `do-title-${index}`,
				type: 'text' as const,
				position: { x: cardX + pxToIn(90), y: cardY + pxToIn(20), w: cardWidth - pxToIn(110), h: pyToIn(30) },
				text: example.title,
				fontSize: 14,
				fontFace: 'Arial',
				bold: true,
				color: '333333',
				align: 'left' as const,
				valign: 'middle' as const,
				zIndex: 2
			}
		);
		
		if (logoData || logoUrl) {
			const logoAreaX = cardX + pxToIn(20);
			const logoAreaY = cardY + pxToIn(62);
			const logoAreaWidth = cardWidth - pxToIn(40);
			const logoAreaHeight = pyToIn(100);
			const logoInnerPadding = pxToIn(8);
			
			logoDosElements.push({
				id: `do-logo-${index}`,
				type: 'image' as const,
				position: {
					x: logoAreaX + logoInnerPadding,
					y: logoAreaY + logoInnerPadding,
					w: logoAreaWidth - (logoInnerPadding * 2),
					h: logoAreaHeight - (logoInnerPadding * 2)
				},
				imageData: logoData || undefined,
				imageSrc: logoUrl || undefined,
				zIndex: 2
			});
		}
		
		logoDosElements.push({
			id: `do-hint-${index}`,
			type: 'text' as const,
			position: { x: cardX + pxToIn(20), y: cardY + cardHeight - pyToIn(35), w: cardWidth - pxToIn(40), h: pyToIn(30) },
			text: example.hint,
			fontSize: 10,
			fontFace: 'Arial',
			color: '666666',
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 2
		});
	});
	
	slides.push({
		id: 'logo-dos',
		type: 'logo-dos',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color1Lighter, color2Lighter, 'FFFFFF', color3Lighter, color4Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: logoDosElements
	});
	
	// Slide 6: Logo Don'ts (similar structure to Do's but with DON'T badge)
	const logoDontsElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Logo Don\'ts',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	const dontExamples = [
		{ title: 'Don\'t Stretch', hint: 'Never distort the logo' },
		{ title: 'Don\'t Rotate', hint: 'Keep logo in original orientation' },
		{ title: 'Don\'t Add Effects', hint: 'No shadows, outlines, or filters' },
		{ title: 'Don\'t Change Colors', hint: 'Use only approved color variations' }
	];
	
	dontExamples.forEach((example, index) => {
		const col = index % 2;
		const row = Math.floor(index / 2);
		const cardX = cardsStartX + col * (cardWidth + cardGap);
		const cardY = cardsStartY + row * (cardHeight + rowGap);
		
		logoDontsElements.push(
			{
				id: `dont-card-${index}`,
				type: 'shape' as const,
				position: { x: cardX, y: cardY, w: cardWidth, h: cardHeight },
				shapeType: 'rect',
				fillColor: 'FFFFFF',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: `dont-badge-${index}`,
				type: 'shape' as const,
				position: { x: cardX + pxToIn(20), y: cardY + pxToIn(20), w: pxToIn(60), h: pyToIn(30) },
				shapeType: 'rect',
				fillColor: 'FEE2E2',
				lineColor: 'EF4444',
				lineWidth: 2,
				zIndex: 2
			},
			{
				id: `dont-badge-text-${index}`,
				type: 'text' as const,
				position: { x: cardX + pxToIn(20), y: cardY + pxToIn(20), w: pxToIn(60), h: pyToIn(30) },
				text: 'DON\'T',
				fontSize: 11,
				fontFace: 'Arial',
				bold: true,
				color: '991B1B',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 3
			},
			{
				id: `dont-title-${index}`,
				type: 'text' as const,
				position: { x: cardX + pxToIn(90), y: cardY + pxToIn(20), w: cardWidth - pxToIn(110), h: pyToIn(30) },
				text: example.title,
				fontSize: 14,
				fontFace: 'Arial',
				bold: true,
				color: '333333',
				align: 'left' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: `dont-hint-${index}`,
				type: 'text' as const,
				position: { x: cardX + pxToIn(20), y: cardY + cardHeight - pyToIn(35), w: cardWidth - pxToIn(40), h: pyToIn(30) },
				text: example.hint,
				fontSize: 10,
				fontFace: 'Arial',
				color: '666666',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		);
		
		// For first card, show stretched logo example
		if (index === 0 && (logoData || logoUrl)) {
			const logoAreaX = cardX + pxToIn(20);
			const logoAreaY = cardY + pxToIn(62);
			const logoAreaWidth = cardWidth - pxToIn(40);
			const logoAreaHeight = pyToIn(100);
			const logoInnerPadding = pxToIn(8);
			
			// Stretched version (wider than tall)
			logoDontsElements.push({
				id: `dont-logo-stretched-${index}`,
				type: 'image' as const,
				position: {
					x: logoAreaX + logoInnerPadding,
					y: logoAreaY + logoInnerPadding,
					w: logoAreaWidth - (logoInnerPadding * 2),
					h: (logoAreaWidth - (logoInnerPadding * 2)) * 0.6 // Intentionally stretched
				},
				imageData: logoData || undefined,
				imageSrc: logoUrl || undefined,
				zIndex: 2
			});
		}
	});
	
	slides.push({
		id: 'logo-donts',
		type: 'logo-donts',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color2Lighter, color3Lighter, 'FFFFFF', color4Lighter, color5Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: logoDontsElements
	});
	
	// Slide 7: Color Palette
	const colorPaletteElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
			text: 'COLORS PALETTE',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 2
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 2
		}
	];
	
	// Add color swatches in 4x2 grid
	const startX = 0.6;
	const startY = 1.2;
	const availableWidth = 10 - (startX * 2);
	const availableHeight = 5.625 - startY - 0.4;
	const gapX = 0.22;
	const gapY = 0.24;
	const swatchWidth = (availableWidth - (gapX * 3)) / 4;
	const swatchHeight = (availableHeight - gapY) / 2;
	const maxSwatchWidth = swatchHeight * 2.0;
	const finalSwatchWidth = Math.min(swatchWidth, maxSwatchWidth);
	const actualTotalWidth = (finalSwatchWidth * 4) + (gapX * 3);
	const adjustedStartX = (10 - actualTotalWidth) / 2;
	
	displayColors.forEach((color, index) => {
		const col = index % 4;
		const row = Math.floor(index / 4);
		const x = adjustedStartX + col * (finalSwatchWidth + gapX);
		const y = startY + row * (swatchHeight + gapY);
		
		colorPaletteElements.push({
			id: `color-swatch-${index}`,
			type: 'color-swatch' as const,
			position: { x, y, w: finalSwatchWidth, h: swatchHeight },
			colorSwatch: {
				hex: color.hex || '#000000',
				name: color.name || 'Color',
				usage: color.usage || 'Brand color'
			},
			zIndex: 2
		});
	});
	
	slides.push({
		id: 'color-palette',
		type: 'color-palette',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color1Lighter, color2Lighter, 'FFFFFF', color3Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: colorPaletteElements
	});
	
	// Slide 8: Typography
	slides.push({
		id: 'typography',
		type: 'typography',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color4Lighter, color5Lighter, 'FFFFFF', color6Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: [
			{
				id: 'title',
				type: 'text' as const,
				position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
				text: 'TYPEFACE',
				fontSize: 36,
				fontFace: 'Arial',
				bold: true,
				color: color1Hex,
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'divider',
				type: 'shape' as const,
				position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
				shapeType: 'rect',
				fillColor: '8B4513',
				zIndex: 2
			},
			{
				id: 'primary-card-bg',
				type: 'shape' as const,
				position: { x: 0.47, y: 1.11, w: 4.38, h: 1.39 },
				shapeType: 'rect',
				fillColor: 'F8F8F8',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: 'primary-label',
				type: 'text' as const,
				position: { x: 0.57, y: 1.21, w: 4.18, h: 0.14 },
				text: 'PRIMARY FONT',
				fontSize: 12,
				fontFace: 'Arial',
				bold: true,
				color: '666666',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'primary-name',
				type: 'text' as const,
				position: { x: 0.57, y: 1.35, w: 4.18, h: 0.39 },
				text: primaryFont,
				fontSize: 24,
				fontFace: primaryFont,
				bold: true,
				color: '2563EB',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'secondary-card-bg',
				type: 'shape' as const,
				position: { x: 5.15, y: 1.11, w: 4.38, h: 1.39 },
				shapeType: 'rect',
				fillColor: 'F8F8F8',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: 'secondary-label',
				type: 'text' as const,
				position: { x: 5.25, y: 1.21, w: 4.18, h: 0.14 },
				text: 'SECONDARY FONT',
				fontSize: 12,
				fontFace: 'Arial',
				bold: true,
				color: '666666',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'secondary-name',
				type: 'text' as const,
				position: { x: 5.25, y: 1.35, w: 4.18, h: 0.39 },
				text: secondaryFont,
				fontSize: 24,
				fontFace: secondaryFont,
				bold: true,
				color: '2563EB',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'hierarchy-card-bg',
				type: 'shape' as const,
				position: { x: 0.47, y: 2.7, w: 9.06, h: 1.39 },
				shapeType: 'rect',
				fillColor: 'F8F8F8',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: 'hierarchy-title',
				type: 'text' as const,
				position: { x: 0.57, y: 2.8, w: 8.86, h: 0.14 },
				text: 'TYPOGRAPHY HIERARCHY',
				fontSize: 12,
				fontFace: 'Arial',
				bold: true,
				color: '666666',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'hierarchy-h1',
				type: 'text' as const,
				position: { x: 0.57, y: 3.04, w: 8.86, h: 0.25 },
				text: hierarchyH1,
				fontSize: 13,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'hierarchy-h2',
				type: 'text' as const,
				position: { x: 0.57, y: 3.29, w: 8.86, h: 0.25 },
				text: hierarchyH2,
				fontSize: 13,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'hierarchy-h3',
				type: 'text' as const,
				position: { x: 0.57, y: 3.54, w: 8.86, h: 0.25 },
				text: hierarchyH3,
				fontSize: 13,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: 'hierarchy-body',
				type: 'text' as const,
				position: { x: 0.57, y: 3.79, w: 8.86, h: 0.25 },
				text: hierarchyBody,
				fontSize: 13,
				fontFace: 'Arial',
				color: '2C2C2C',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		]
	});
	
	// Slide 9: Iconography
	const iconographyElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Iconography',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	// Add icon grid
	const iconGridX = pxToIn(60);
	const iconGridY = pyToIn(140);
	const iconGridWidth = pxToIn(600);
	const iconGridHeight = pyToIn(400);
	const iconGridPadding = pxToIn(30);
	const iconsStartY = iconGridY + iconGridPadding + pyToIn(50);
	const iconCircleSizePx = 70;
	const iconGapPx = 28;
	const iconLabelMarginPx = 10;
	const iconLabelHeightPx = 25;
	const iconCircleSize = pxToIn(iconCircleSizePx);
	const iconGap = pxToIn(iconGapPx);
	const iconLabelMargin = pyToIn(iconLabelMarginPx);
	const iconLabelHeight = pyToIn(iconLabelHeightPx);
	const iconItemHeight = iconCircleSize + iconLabelMargin + iconLabelHeight;
	const iconRowGap = pyToIn(15);
	const iconColWidth = (iconGridWidth - (iconGridPadding * 2) - (iconGap * 3)) / 4;
	
	// Generate icons asynchronously
	await Promise.all(icons.slice(0, 8).map(async (icon: any, index: number) => {
		const col = index % 4;
		const row = Math.floor(index / 4);
		const colStartX = iconGridX + iconGridPadding + col * (iconColWidth + iconGap);
		const iconX = colStartX + (iconColWidth - iconCircleSize) / 2;
		const iconY = iconsStartY + row * (iconItemHeight + iconRowGap);
		
		// Convert icon name to base64 image (same as UI uses DynamicIcon)
		const iconName = icon.name || 'Icon';
		const iconImageSize = Math.round(iconCircleSizePx * 0.45); // Icon size within circle (45% of circle size)
		console.log(`🔄 Converting icon "${iconName}" to image (size: ${iconImageSize}px)...`);
		const iconImageData = await iconNameToBase64Image(iconName, iconImageSize, '#FFFFFF', 2);
		if (iconImageData) {
			console.log(`✅ Successfully converted icon "${iconName}" to base64 image (length: ${iconImageData.length})`);
		} else {
			console.warn(`⚠️ Failed to convert icon "${iconName}" to image`);
		}
		
		// Icon image position (centered in circle with padding)
		const iconImagePadding = iconCircleSize * 0.15; // 15% padding around icon
		const iconImageSizeIn = iconCircleSize - (iconImagePadding * 2);
		
		iconographyElements.push(
			{
				id: `icon-circle-${index}`,
				type: 'shape' as const,
				position: { x: iconX, y: iconY, w: iconCircleSize, h: iconCircleSize },
				shapeType: 'circle',
				fillColor: color1Hex,
				zIndex: 2
			},
			{
				id: `icon-image-${index}`,
				type: 'image' as const,
				position: { 
					x: iconX + iconImagePadding, 
					y: iconY + iconImagePadding, 
					w: iconImageSizeIn, 
					h: iconImageSizeIn 
				},
				imageData: iconImageData,
				zIndex: 3
			},
			{
				id: `icon-label-${index}`,
				type: 'text' as const,
				position: { x: colStartX, y: iconY + iconCircleSize + iconLabelMargin, w: iconColWidth, h: iconLabelHeight },
				text: iconName,
				fontSize: 11,
				fontFace: 'Arial',
				color: '666666',
				align: 'center' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		);
	}));
	
	slides.push({
		id: 'iconography',
		type: 'iconography',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color5Lighter, color6Lighter, 'FFFFFF', color7Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: iconographyElements
	});
	
	// Slide 10: Photography
	const photographyElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Photography',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	// Add photo placeholders
	const photoLabels = [
		{ label: 'Authentic Moments', emoji: '📷' },
		{ label: 'Natural Lighting', emoji: '🌟' },
		{ label: 'Vibrant Colors', emoji: '🎨' },
		{ label: 'People-Focused', emoji: '👥' }
	];
	
	const photoPlaceholderWidth = pxToIn(250);
	const photoPlaceholderHeight = pyToIn(150);
	const photoGap = pxToIn(30);
	const photoStartX = pxToIn(60);
	const photoStartY = pyToIn(140);
	const placeholderPadding = pxToIn(10);
	
	photoLabels.forEach((photo, index) => {
		const col = index % 2;
		const row = Math.floor(index / 2);
		const x = photoStartX + col * (photoPlaceholderWidth + photoGap);
		const y = photoStartY + row * (photoPlaceholderHeight + pyToIn(50));
		
		photographyElements.push(
			{
				id: `photo-placeholder-${index}`,
				type: 'shape' as const,
				position: { x, y, w: photoPlaceholderWidth, h: photoPlaceholderHeight },
				shapeType: 'rect',
				fillColor: 'F8F9FA',
				lineColor: 'E5E7EB',
				lineWidth: 2,
				zIndex: 1
			},
			{
				id: `photo-emoji-${index}`,
				type: 'text' as const,
				position: { x: x + placeholderPadding, y: y + placeholderPadding, w: photoPlaceholderWidth - (placeholderPadding * 2), h: photoPlaceholderHeight - (placeholderPadding * 2) },
				text: photo.emoji,
				fontSize: 48,
				fontFace: 'Arial',
				color: 'CCCCCC',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: `photo-label-${index}`,
				type: 'text' as const,
				position: { x, y: y + photoPlaceholderHeight + pyToIn(10), w: photoPlaceholderWidth, h: pyToIn(20) },
				text: photo.label,
				fontSize: 12,
				fontFace: 'Arial',
				color: '666666',
				align: 'center' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		);
	});
	
	slides.push({
		id: 'photography',
		type: 'photography',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color6Lighter, color7Lighter, 'FFFFFF', color8Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: photographyElements
	});
	
	// Slide 11: Applications
	const applicationsElements: SlideData['elements'] = [
		{
			id: 'title',
			type: 'text' as const,
			position: { x: pxToIn(60), y: pyToIn(40), w: 10 - (pxToIn(60) * 2), h: pyToIn(42) },
			text: 'Brand Applications',
			fontSize: 36,
			fontFace: 'Arial',
			bold: true,
			color: color1Hex,
			align: 'left' as const,
			valign: 'top' as const,
			zIndex: 3
		},
		{
			id: 'divider',
			type: 'shape' as const,
			position: { x: pxToIn(60), y: pyToIn(100), w: 10 - (pxToIn(60) * 2), h: pyToIn(4) },
			shapeType: 'rect',
			fillColor: color1Hex,
			zIndex: 3
		}
	];
	
	// Add application cards
	const appCardWidth = pxToIn(280);
	const appCardHeight = pyToIn(180);
	const appCardGap = pxToIn(25);
	const appStartX = pxToIn(60);
	const appStartY = pyToIn(140);
	
	applications.slice(0, 4).forEach((app: any, index: number) => {
		const col = index % 2;
		const row = Math.floor(index / 2);
		const x = appStartX + col * (appCardWidth + appCardGap);
		const y = appStartY + row * (appCardHeight + pyToIn(30));
		
		applicationsElements.push(
			{
				id: `app-card-${index}`,
				type: 'shape' as const,
				position: { x, y, w: appCardWidth, h: appCardHeight },
				shapeType: 'rect',
				fillColor: 'FFFFFF',
				lineColor: 'E0E0E0',
				lineWidth: 1,
				zIndex: 1
			},
			{
				id: `app-icon-${index}`,
				type: 'text' as const,
				position: { x: x + pxToIn(20), y: y + pxToIn(20), w: pxToIn(60), h: pyToIn(60) },
				text: app.icon || '📱',
				fontSize: 48,
				fontFace: 'Arial',
				color: color1Hex,
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: `app-name-${index}`,
				type: 'text' as const,
				position: { x: x + pxToIn(20), y: y + pyToIn(90), w: appCardWidth - pxToIn(40), h: pyToIn(25) },
				text: app.name || 'Application',
				fontSize: 16,
				fontFace: 'Arial',
				bold: true,
				color: '333333',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			},
			{
				id: `app-description-${index}`,
				type: 'text' as const,
				position: { x: x + pxToIn(20), y: y + pyToIn(120), w: appCardWidth - pxToIn(40), h: pyToIn(50) },
				text: app.description || 'Application description',
				fontSize: 12,
				fontFace: 'Arial',
				color: '666666',
				align: 'left' as const,
				valign: 'top' as const,
				zIndex: 2
			}
		);
	});
	
	slides.push({
		id: 'applications',
		type: 'applications',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color7Lighter, color8Lighter, 'FFFFFF', color1Lighter, color2Lighter, 'FFFFFF'],
					direction: 135
				}
			}
		},
		elements: applicationsElements
	});
	
	// Slide 12: Thank You
	slides.push({
		id: 'thank-you',
		type: 'thank-you',
		layout: {
			width: 10,
			height: 5.625,
			background: {
				type: 'gradient',
				gradient: {
					colors: [color4Hex, color3Hex, color4Hex, color1Hex, color2Hex],
					direction: 135
				}
			}
		},
		elements: [
			{
				id: 'thank-you',
				type: 'text' as const,
				position: { x: 0.5, y: 2.5, w: 9, h: 1.0 },
				text: thankYouText,
				fontSize: 64,
				fontFace: 'Arial',
				bold: true,
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: 'subtitle',
				type: 'text' as const,
				position: { x: 0.5, y: 3.6, w: 9, h: 0.5 },
				text: subtitleText,
				fontSize: 20,
				fontFace: 'Arial',
				italic: true,
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			},
			{
				id: 'contact',
				type: 'text' as const,
				position: { x: 0.5, y: 4.3, w: 9, h: 0.6 },
				text: buildContactText(contactName, contactEmail, contactRole, contactCompany, website, phone),
				fontSize: 16,
				fontFace: 'Arial',
				color: 'FFFFFF',
				align: 'center' as const,
				valign: 'middle' as const,
				zIndex: 2
			}
		]
	});
	
	// Helper function to build contact text
	function buildContactText(name: string, email: string, role: string, company: string, website: string, phone: string): string {
		const parts: string[] = [];
		
		// Build contact info line by line
		if (name || role || company) {
			const nameParts: string[] = [];
			if (name) nameParts.push(name);
			if (role) nameParts.push(role);
			if (company) nameParts.push(company);
			if (nameParts.length > 0) parts.push(nameParts.join(', '));
		}
		
		if (email) parts.push(email);
		if (website && website !== 'your-website.com' && !website.includes('www.yourbrand.com')) parts.push(website);
		if (phone) parts.push(phone);
		
		return parts.length > 0 ? parts.join('\n') : email || 'Contact information';
	}
	
	return slides;
}
