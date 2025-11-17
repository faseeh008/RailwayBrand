/**
 * Utility to convert icon names to base64 image data for PPTX export
 * This ensures icons appear the same in downloaded slides as in the UI
 */

import { generateIconSVG } from './icon-generator';
import { getIconName } from './icon-mapper';
import { svgToPng } from './svg-to-png';

/**
 * Convert SVG string to base64 data URL
 * This works in both Node.js (server-side) and browser environments
 */
function svgToBase64(svgString: string): string {
	// Clean the SVG string
	const cleanSvg = svgString.trim().replace(/\s+/g, ' ');
	
	// Encode SVG to base64
	// Use Buffer in Node.js, or btoa in browser
	let base64: string;
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		base64 = Buffer.from(cleanSvg, 'utf-8').toString('base64');
	} else {
		// Browser environment
		base64 = btoa(unescape(encodeURIComponent(cleanSvg)));
	}
	
	// Return as data URL
	return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get Lucide icon SVG string (server-side)
 * Uses lucide package to get actual icon SVG data
 * This converts React/Component icons to pure SVG strings for PPTX export
 */
async function getLucideIconSVG(
	iconName: string,
	size: number = 32,
	color: string = '#FFFFFF',
	strokeWidth: number = 2
): Promise<string | null> {
	try {
		// Import lucide package dynamically (works in both browser and server)
		let lucide: any;
		try {
			lucide = await import('lucide');
		} catch (e) {
			console.warn('Lucide package not available:', e);
			return null;
		}
		
		if (!lucide || typeof lucide !== 'object') {
			return null;
		}
		
		// Lucide icons use PascalCase (e.g., "Zap", "Cloud", "Server")
		// Try multiple strategies to find the icon (same as DynamicIcon)
		const tryKeys: string[] = [];
		const lucideKeys = Object.keys(lucide);
			
		// Strategy 1: Direct name match (case-insensitive)
		const directMatch = lucideKeys.find(k => k.toLowerCase() === iconName.toLowerCase());
		if (directMatch) {
			tryKeys.push(directMatch);
		}
		
		// Strategy 2: PascalCase the original name
		const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
		if (lucideKeys.includes(pascalCase) && !tryKeys.includes(pascalCase)) {
			tryKeys.push(pascalCase);
		}
		
		// Strategy 3: Try mapped name
		const mappedName = getIconName(iconName);
		if (mappedName) {
			const mappedPascal = mappedName.charAt(0).toUpperCase() + mappedName.slice(1);
			if (lucideKeys.includes(mappedPascal) && !tryKeys.includes(mappedPascal)) {
				tryKeys.push(mappedPascal);
			}
			// Also try exact match of mapped name
			if (lucideKeys.includes(mappedName) && !tryKeys.includes(mappedName)) {
				tryKeys.push(mappedName);
			}
		}
		
		// Strategy 4: Try removing hyphens and matching
		const noHyphens = iconName.replace(/-/g, '');
		const noHyphensMatch = lucideKeys.find(k => 
			k.toLowerCase().replace(/-/g, '') === noHyphens.toLowerCase()
		);
		if (noHyphensMatch && !tryKeys.includes(noHyphensMatch)) {
			tryKeys.push(noHyphensMatch);
		}
		
		// Strategy 5: Try camelCase conversion
		const camelCase = iconName.split(/[-_\s]/).map((word, i) => 
			i === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() :
			word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		).join('');
		if (lucideKeys.includes(camelCase) && !tryKeys.includes(camelCase)) {
			tryKeys.push(camelCase);
		}
		
		console.log(`🔍 Looking for icon "${iconName}" (trying: ${tryKeys.join(', ')})`);
		
		// Find the icon in lucide
		let iconData: any = null;
		let foundKey: string | null = null;
		
		// Try all possible keys
		for (const key of tryKeys) {
			if (lucide[key]) {
				// Lucide icons are arrays of [type, attributes] tuples
				if (Array.isArray(lucide[key])) {
					iconData = lucide[key];
					foundKey = key;
					break;
				}
				// Some might be functions that return the data
				else if (typeof lucide[key] === 'function') {
					try {
						const result = lucide[key]();
						if (Array.isArray(result)) {
							iconData = result;
							foundKey = key;
							break;
						}
					} catch (e) {
						// Continue trying
					}
				}
			}
		}
		
		// If still not found, try all keys case-insensitively
		if (!iconData) {
			const lowerName = iconName.toLowerCase();
			for (const key of lucideKeys) {
				if (key.toLowerCase() === lowerName) {
					if (Array.isArray(lucide[key])) {
						iconData = lucide[key];
						foundKey = key;
						break;
					}
				}
			}
		}
		
		if (!iconData || !Array.isArray(iconData) || iconData.length === 0) {
			console.warn(`⚠️ Lucide icon not found: "${iconName}" (tried: ${tryKeys.join(', ')})`);
			return null;
		}
		
		console.log(`✅ Found Lucide icon: "${iconName}" -> "${foundKey}"`);
		
		// Lucide icons are arrays of [type, attributes] tuples
		// Example: [["path", { "d": "M4 14..." }], ["path", { "d": "..." }]]
		const svgElements: string[] = [];
		
		// Extract SVG elements from icon data
		for (const element of iconData) {
			if (!Array.isArray(element) || element.length < 2) continue;
			
			const [type, attrs] = element;
			
			if (!attrs || typeof attrs !== 'object') continue;
			
			// Handle different SVG element types
			switch (type) {
				case 'path':
					if (attrs.d) {
						svgElements.push(
							`<path d="${attrs.d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
						);
					}
					break;
					
				case 'circle':
					const cx = attrs.cx ?? 12;
					const cy = attrs.cy ?? 12;
					const r = attrs.r ?? 5;
					svgElements.push(
						`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
					);
					break;
					
				case 'line':
					const x1 = attrs.x1 ?? 0;
					const y1 = attrs.y1 ?? 0;
					const x2 = attrs.x2 ?? 0;
					const y2 = attrs.y2 ?? 0;
					svgElements.push(
						`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
					);
					break;
					
				case 'rect':
					const rx = attrs.rx ?? 0;
					const ry = attrs.ry ?? 0;
					const rectX = attrs.x ?? 0;
					const rectY = attrs.y ?? 0;
					const rectWidth = attrs.width ?? 0;
					const rectHeight = attrs.height ?? 0;
					svgElements.push(
						`<rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" ${rx > 0 ? `rx="${rx}" ry="${ry}"` : ''} fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
					);
					break;
					
				case 'ellipse':
					const ellipseCx = attrs.cx ?? 12;
					const ellipseCy = attrs.cy ?? 12;
					const ellipseRx = attrs.rx ?? attrs.r ?? 5;
					const ellipseRy = attrs.ry ?? attrs.r ?? 5;
					svgElements.push(
						`<ellipse cx="${ellipseCx}" cy="${ellipseCy}" rx="${ellipseRx}" ry="${ellipseRy}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
					);
					break;
					
				case 'polygon':
				case 'polyline':
					if (attrs.points) {
						svgElements.push(
							`<${type} points="${attrs.points}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
						);
					}
					break;
			}
		}
		
		// Build complete SVG string
		if (svgElements.length > 0) {
			// Use viewBox="0 0 24 24" (Lucide's standard viewBox) and scale to desired size
			const svgString = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${svgElements.join('')}</svg>`;
			console.log(`✅ Built SVG for "${iconName}" (${svgElements.length} elements, ${svgString.length} chars)`);
			return svgString;
		} else {
			console.warn(`⚠️ No SVG elements found for icon "${iconName}"`);
		}
	} catch (error) {
		console.warn(`Failed to load Lucide icon "${iconName}":`, error);
	}
	
	return null;
}

/**
 * Convert icon name to base64 image data
 * First tries to use actual Lucide icons, falls back to generateIconSVG
 */
export async function iconNameToBase64Image(
	iconName: string,
	size: number = 32,
	color: string = '#FFFFFF',
	strokeWidth: number = 2
): Promise<string> {
	console.log(`🔍 Converting icon "${iconName}" to base64 image...`);
	
	// Try to get Lucide icon SVG first
	const lucideSvg = await getLucideIconSVG(iconName, size, color, strokeWidth);
	
	let svgString: string;
	if (lucideSvg) {
		// Use actual Lucide icon
		svgString = lucideSvg;
		console.log(`✅ Found Lucide icon "${iconName}", converting SVG to PNG...`);
	} else {
		// Fallback to generateIconSVG (letter-based icons)
		console.warn(`⚠️ Lucide icon not found for "${iconName}", using fallback letter-based icon`);
		svgString = generateIconSVG(iconName, size, color, strokeWidth);
	}
	
	// Convert SVG to PNG (pptxgenjs works better with PNG than SVG)
	// PowerPoint doesn't support SVG natively, so we MUST convert to PNG
	try {
		console.log(`🔄 Converting SVG to PNG for "${iconName}" (${size}x${size})...`);
		const pngDataUrl = await svgToPng(svgString, size, size);
		
		// Verify it's a valid PNG data URL
		if (pngDataUrl && pngDataUrl.startsWith('data:image/png')) {
			console.log(`✅ Successfully converted icon "${iconName}" to PNG (length: ${pngDataUrl.length})`);
			return pngDataUrl;
		} else {
			console.warn(`⚠️ PNG conversion returned invalid format for "${iconName}", got: ${pngDataUrl?.substring(0, 50)}`);
			// Try SVG as last resort
			return svgToBase64(svgString);
		}
	} catch (error) {
		console.error(`❌ Failed to convert SVG to PNG for "${iconName}":`, error);
		// Fallback to SVG base64 if PNG conversion fails
		const svgBase64 = svgToBase64(svgString);
		console.warn(`⚠️ Using SVG fallback for "${iconName}"`);
		return svgBase64;
	}
}

/**
 * Synchronous version (for when async is not available)
 * Uses generateIconSVG as fallback
 */
export function iconNameToBase64ImageSync(
	iconName: string,
	size: number = 32,
	color: string = '#FFFFFF',
	strokeWidth: number = 2
): string {
	const svg = generateIconSVG(iconName, size, color, strokeWidth);
	return svgToBase64(svg);
}

/**
 * Get icon SVG string for a given icon name
 * This can be extended to support Lucide icons if needed
 */
export function getIconSVG(
	iconName: string,
	size: number = 32,
	color: string = '#FFFFFF',
	strokeWidth: number = 2
): string {
	return generateIconSVG(iconName, size, color, strokeWidth);
}

