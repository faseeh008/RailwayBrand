/**
 * Convert SVG to PNG base64 data URL
 * Works in both browser and Node.js environments
 */

/**
 * Convert SVG string to PNG base64 data URL (browser)
 */
export async function svgToPngBrowser(svgString: string, width: number, height: number): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			console.log(`🖼️ [Browser] Converting SVG to PNG (${width}x${height})...`);
			
			const img = new Image();
			const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);
			
			img.onload = () => {
				try {
					console.log(`✅ [Browser] SVG image loaded, creating canvas...`);
					
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d');
					
					if (!ctx) {
						URL.revokeObjectURL(url);
						reject(new Error('Could not get canvas context'));
						return;
					}
					
					// Clear canvas (transparent background)
					ctx.clearRect(0, 0, width, height);
					
					// Draw SVG image
					ctx.drawImage(img, 0, 0, width, height);
					
					// Convert to PNG data URL
					const pngDataUrl = canvas.toDataURL('image/png');
					
					console.log(`✅ [Browser] PNG created (${pngDataUrl.length} chars)`);
					
					URL.revokeObjectURL(url);
					
					if (pngDataUrl && pngDataUrl.startsWith('data:image/png')) {
						resolve(pngDataUrl);
					} else {
						reject(new Error('Invalid PNG data URL generated'));
					}
				} catch (error) {
					URL.revokeObjectURL(url);
					console.error('❌ [Browser] Error converting SVG to PNG:', error);
					reject(error);
				}
			};
			
			img.onerror = (error) => {
				URL.revokeObjectURL(url);
				console.error('❌ [Browser] Failed to load SVG image:', error);
				reject(new Error('Failed to load SVG image'));
			};
			
			img.src = url;
		} catch (error) {
			console.error('❌ [Browser] Error in svgToPngBrowser:', error);
			reject(error);
		}
	});
}

/**
 * Convert SVG string to PNG base64 data URL (Node.js/server)
 */
export async function svgToPngNode(svgString: string, width: number, height: number): Promise<string> {
	try {
		const { createCanvas, loadImage } = await import('canvas');
		
		// Clean SVG string - ensure it's valid XML
		const cleanSvg = svgString.trim();
		
		// Convert SVG to data URL (URL encode to handle special characters)
		const svgBase64 = Buffer.from(cleanSvg, 'utf-8').toString('base64');
		const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
		
		console.log(`🖼️ Loading SVG image (${width}x${height})...`);
		
		// Load SVG as image
		const img = await loadImage(svgDataUrl);
		
		console.log(`✅ SVG loaded, creating canvas...`);
		
		// Create canvas
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');
		
		// Clear canvas (transparent background)
		ctx.clearRect(0, 0, width, height);
		
		// Draw SVG image
		ctx.drawImage(img, 0, 0, width, height);
		
		// Convert to PNG buffer
		const buffer = canvas.toBuffer('image/png');
		const base64 = buffer.toString('base64');
		
		console.log(`✅ PNG created (${buffer.length} bytes, base64: ${base64.length} chars)`);
		
		return `data:image/png;base64,${base64}`;
	} catch (error) {
		console.error('❌ Failed to convert SVG to PNG (Node.js):', error);
		// Return SVG as fallback
		const svgBase64 = Buffer.from(svgString, 'utf-8').toString('base64');
		return `data:image/svg+xml;base64,${svgBase64}`;
	}
}

/**
 * Convert SVG to PNG (works in both browser and Node.js)
 */
export async function svgToPng(svgString: string, width: number, height: number): Promise<string> {
	if (typeof window !== 'undefined') {
		// Browser environment
		return svgToPngBrowser(svgString, width, height);
	} else {
		// Node.js environment
		return svgToPngNode(svgString, width, height);
	}
}

