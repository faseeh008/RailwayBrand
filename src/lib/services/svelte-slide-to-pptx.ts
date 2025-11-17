import PptxGenJS from 'pptxgenjs';
import type { SlideData, SlideElement } from '$lib/types/slide-data';

export interface SvelteSlideToPptxOptions {
  slides: SlideData[];
  brandName: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Convert Svelte slide data to editable PPTX
 * This is much simpler than parsing HTML!
 */
export async function convertSvelteSlidesToPptx(
  options: SvelteSlideToPptxOptions
): Promise<Blob> {
  const { slides, brandName, onProgress } = options;
  
  console.log(`🔄 Converting ${slides.length} Svelte slides to editable PPTX...`);
  
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = brandName || 'Brand Guidelines';
  pptx.title = `${brandName} Brand Guidelines`;
  
  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    onProgress?.(i + 1, slides.length);
    
    console.log(`📄 Processing slide ${i + 1}/${slides.length}: ${slideData.type}`);
    
    const slide = pptx.addSlide();
    
    // Set background
    await setSlideBackground(slideData.layout.background, slide);
    
    // Sort elements by z-index
    const sortedElements = [...slideData.elements].sort((a, b) => 
      (a.zIndex || 0) - (b.zIndex || 0)
    );
    
    // Add each element
    for (const element of sortedElements) {
      await addElementToSlide(element, slide);
    }
  }
  
  const blob = await pptx.write({ outputType: 'blob' });
  console.log('✅ Editable PPTX generated successfully');
  
  return blob as Blob;
}

/**
 * Set slide background
 */
async function setSlideBackground(
  background: SlideData['layout']['background'],
  slide: any
): Promise<void> {
  if (background.type === 'color' && background.color) {
    // Ensure color is in correct format (no #, 6 hex digits)
    const cleanColor = background.color.replace('#', '').substring(0, 6);
    slide.background = { color: cleanColor };
  } else if (background.type === 'gradient' && background.gradient && background.gradient.colors.length > 0) {
    // PPTX doesn't support gradients natively, so we use the most prominent color
    // Find the first non-white color (usually the primary brand color)
    let baseColor = background.gradient.colors.find((c: string) => {
      const clean = c.replace('#', '').toUpperCase();
      return clean !== 'FFFFFF' && clean !== 'FFF';
    }) || background.gradient.colors[0];
    
    // Clean color format (remove #, ensure 6 hex digits)
    const cleanBaseColor = baseColor.replace('#', '').substring(0, 6);
    slide.background = { color: cleanBaseColor };
    
    // Note: For a more accurate gradient representation, we could add overlay shapes,
    // but PowerPoint's native gradient support is limited. The primary color provides
    // a good visual approximation that matches the brand identity.
  } else {
    // Default white background
    slide.background = { color: 'FFFFFF' };
  }
}

/**
 * Add element to PPTX slide
 */
async function addElementToSlide(element: SlideElement, slide: any): Promise<void> {
  const { type, position } = element;
  
  // Font size scaling factor for PPTX (reduce by ~15% for better fit in downloaded slides)
  const FONT_SCALE_FACTOR = 0.85;
  
  switch (type) {
    case 'text':
      // Skip text icon elements - they should have been converted to images
      if (element.id && (element.id.startsWith('icon-symbol-') || element.id === 'demo-icon-symbol')) {
        console.warn(`⚠️ Skipping text icon element ${element.id} - should have been converted to image`);
        return; // Skip this element entirely
      }
      
      if (element.text) {
        // Clean color format (remove #, ensure 6 hex digits)
        let textColor = '000000';
        if (element.color) {
          textColor = element.color.replace('#', '').substring(0, 6);
        }
        
        // Apply font size scaling factor
        const baseFontSize = element.fontSize || 12;
        const scaledFontSize = baseFontSize * FONT_SCALE_FACTOR;
        
        // Ensure font size is valid (between 8 and 72)
        const fontSize = Math.max(8, Math.min(72, Math.round(scaledFontSize)));
        
        // Clean font face (remove quotes if present)
        const fontFace = (element.fontFace || 'Arial').replace(/['"]/g, '');
        
        slide.addText(element.text, {
          x: position.x,
          y: position.y,
          w: position.w,
          h: position.h,
          fontSize: fontSize,
          fontFace: fontFace,
          bold: element.bold || false,
          italic: element.italic || false,
          color: textColor,
          align: element.align || 'left',
          valign: element.valign || 'top',
          wrap: true,
          breakLine: true
        });
      }
      break;
      
    case 'image':
      if (element.imageData) {
        try {
          // pptxgenjs accepts data URLs directly
          let imageData = element.imageData;
          
          // Ensure it's a proper data URL
          if (!imageData.startsWith('data:image/')) {
            // If it's just base64, determine if it's SVG or PNG
            // SVG data URLs should be: data:image/svg+xml;base64,...
            // PNG data URLs should be: data:image/png;base64,...
            if (imageData.includes('svg') || imageData.includes('SVG')) {
              imageData = `data:image/svg+xml;base64,${imageData.replace(/^data:image\/svg\+xml;base64,/, '')}`;
            } else {
              imageData = `data:image/png;base64,${imageData.replace(/^data:image\/png;base64,/, '')}`;
            }
          }
          
          // Log for debugging icon images
          if (element.id && element.id.includes('icon')) {
            console.log(`🖼️ Adding icon image: ${element.id}`);
            console.log(`   Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}) size ${position.w.toFixed(2)}x${position.h.toFixed(2)}`);
            console.log(`   Data type: ${imageData.startsWith('data:image/png') ? 'PNG' : imageData.startsWith('data:image/svg') ? 'SVG' : 'Unknown'}`);
            console.log(`   Data length: ${imageData.length} chars`);
          }
          
          // Add image to slide with proper sizing
          // Use 'contain' to maintain aspect ratio, center the image, and fit within bounds
          // This matches UI behavior: object-fit: contain with flex centering
          // Ensure images don't stretch by using proper sizing constraints
          slide.addImage({
            data: imageData,
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h,
            sizing: {
              type: 'contain',
              w: position.w,
              h: position.h
            }
            // Images are centered automatically with 'contain' sizing
            // This matches the UI's flexbox centering behavior
            // 'contain' type ensures aspect ratio is maintained and image doesn't stretch
          });
          
          console.log(`✅ Added image: ${element.id} at (${position.x.toFixed(2)}, ${position.y.toFixed(2)}) size ${position.w.toFixed(2)}x${position.h.toFixed(2)}`);
        } catch (error) {
          console.error(`❌ Failed to add image ${element.id}:`, error);
          // Add a placeholder rectangle if image fails (with lighter background)
          slide.addShape('rect', {
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h,
            fill: { color: 'F8F9FA' },
            line: { color: 'DDDDDD', width: 1 }
          });
          slide.addText('Logo\nPlaceholder', {
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h,
            fontSize: Math.round(10 * FONT_SCALE_FACTOR),
            color: '999999',
            align: 'center',
            valign: 'middle'
          });
        }
      } else if (element.imageSrc) {
        // Load image from URL (if needed)
        try {
          const imageData = await loadImageAsBase64(element.imageSrc);
          slide.addImage({
            data: imageData,
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h,
            sizing: {
              type: 'contain',
              w: position.w,
              h: position.h
            }
          });
          console.log(`✅ Added image from URL: ${element.id}`);
        } catch (error) {
          console.error(`❌ Failed to load image from URL:`, error);
          // Add a placeholder if image fails to load
          slide.addShape('rect', {
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h,
            fill: { color: 'F0F0F0' },
            line: { color: 'CCCCCC', width: 1 }
          });
        }
      } else {
        console.warn(`⚠️ Image element ${element.id} has no imageData or imageSrc - adding placeholder`);
        // Add a placeholder rectangle
        slide.addShape('rect', {
          x: position.x,
          y: position.y,
          w: position.w,
          h: position.h,
          fill: { color: 'F0F0F0' },
          line: { color: 'CCCCCC', width: 1 }
        });
        slide.addText('Logo\nPlaceholder', {
          x: position.x,
          y: position.y,
          w: position.w,
          h: position.h,
          fontSize: Math.round(10 * FONT_SCALE_FACTOR),
          color: '999999',
          align: 'center',
          valign: 'middle'
        });
      }
      break;
      
    case 'shape':
      if (element.shapeType) {
        // Clean color formats
        let fillColor = undefined;
        if (element.fillColor) {
          const cleanFill = element.fillColor.replace('#', '').substring(0, 6);
          // Skip transparent fills (represented as '00000000' or similar)
          if (cleanFill !== '00000000' && cleanFill.length === 6) {
            // Check if it's a valid hex color (not all zeros with alpha)
            const isTransparent = cleanFill.toUpperCase().startsWith('000000') && cleanFill.length > 6;
            if (!isTransparent) {
              fillColor = { color: cleanFill };
            }
          }
        }
        
        let lineColor = undefined;
        if (element.lineColor) {
          const cleanLine = element.lineColor.replace('#', '').substring(0, 6);
          // Skip transparent lines
          if (cleanLine !== '00000000' && cleanLine.length === 6) {
            const isTransparent = cleanLine.toUpperCase().startsWith('000000') && cleanLine.length > 6;
            if (!isTransparent) {
              lineColor = { 
                color: cleanLine, 
                width: Math.max(1, Math.min(20, element.lineWidth || 1)) 
              };
            }
          }
        }
        
        // Only add shape if it has a fill or line (skip completely transparent shapes)
        if (fillColor || lineColor) {
          // Handle different shape types
          // pptxgenjs uses string constants for shape types
          let shapeType: string;
          if (element.shapeType === 'circle') {
            shapeType = 'ellipse';
            // For circles, ensure width and height are equal
            const size = Math.min(position.w, position.h);
            slide.addShape(shapeType, {
              x: position.x,
              y: position.y,
              w: size,
              h: size,
              fill: fillColor,
              line: lineColor
            });
          } else if (element.shapeType === 'rect') {
            shapeType = 'rect';
            slide.addShape(shapeType, {
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h,
              fill: fillColor,
              line: lineColor
            });
          } else if (element.shapeType === 'line') {
            shapeType = 'line';
            slide.addShape(shapeType, {
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h,
              line: lineColor || { color: '000000', width: 1 }
            });
          }
        }
      }
      break;
      
    case 'color-swatch':
      if (element.colorSwatch) {
        // Clean hex color (remove #, ensure 6 hex digits)
        const cleanHex = element.colorSwatch.hex.replace('#', '').substring(0, 6).toUpperCase();
        
        // Add color rectangle (70% of height for color swatch)
        const colorHeight = position.h * 0.7;
        slide.addShape('rect', {
          x: position.x,
          y: position.y,
          w: position.w,
          h: colorHeight,
          fill: { color: cleanHex },
          line: { color: 'E0E0E0', width: 1 }
        });
        
        // Calculate text positions
        const textStartY = position.y + colorHeight + 0.05;
        const textHeight = (position.h - colorHeight - 0.1) / 2;
        
        // Add color name
        if (element.colorSwatch.name) {
          slide.addText(element.colorSwatch.name, {
            x: position.x,
            y: textStartY,
            w: position.w,
            h: textHeight,
            fontSize: Math.round(11 * FONT_SCALE_FACTOR),
            bold: true,
            color: '333333',
            align: 'center',
            valign: 'top',
            wrap: true
          });
        }
        
        // Add hex code
        slide.addText(`#${cleanHex}`, {
          x: position.x,
          y: textStartY + textHeight,
          w: position.w,
          h: textHeight,
          fontSize: Math.round(10 * FONT_SCALE_FACTOR),
          fontFace: 'Courier New',
          color: '666666',
          align: 'center',
          valign: 'top'
        });
        
        // Add usage text if available
        if (element.colorSwatch.usage) {
          slide.addText(element.colorSwatch.usage, {
            x: position.x,
            y: textStartY + textHeight * 1.5,
            w: position.w,
            h: textHeight * 0.5,
            fontSize: Math.round(9 * FONT_SCALE_FACTOR),
            color: '999999',
            align: 'center',
            valign: 'top',
            italic: true,
            wrap: true
          });
        }
      }
      break;
  }
}

/**
 * Load image as base64
 */
function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (src.startsWith('data:')) {
      resolve(src);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
}

/**
 * Generate PPTX buffer (for server-side use)
 */
export async function convertSvelteSlidesToPptxBuffer(
  options: SvelteSlideToPptxOptions
): Promise<Buffer> {
  const { slides, brandName, onProgress } = options;
  
  console.log(`🔄 Converting ${slides.length} Svelte slides to editable PPTX (server-side)...`);
  
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = brandName || 'Brand Guidelines';
  pptx.title = `${brandName} Brand Guidelines`;
  
  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    onProgress?.(i + 1, slides.length);
    
    console.log(`📄 Processing slide ${i + 1}/${slides.length}: ${slideData.type}`);
    
    const slide = pptx.addSlide();
    
    // Set background
    if (slideData.layout.background.type === 'color' && slideData.layout.background.color) {
      slide.background = { color: slideData.layout.background.color };
    } else if (slideData.layout.background.type === 'gradient' && slideData.layout.background.gradient) {
      const firstColor = slideData.layout.background.gradient.colors[0];
      slide.background = { color: firstColor };
    }
    
    // Sort elements by z-index
    const sortedElements = [...slideData.elements].sort((a, b) => 
      (a.zIndex || 0) - (b.zIndex || 0)
    );
    
    // Add each element
    for (const element of sortedElements) {
      const { type, position } = element;
      
      switch (type) {
        case 'text':
          if (element.text) {
            slide.addText(element.text, {
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h,
              fontSize: element.fontSize || 12,
              fontFace: element.fontFace || 'Arial',
              bold: element.bold || false,
              italic: element.italic || false,
              color: element.color || '000000',
              align: element.align || 'left',
              valign: element.valign || 'top',
              wrap: true
            });
          }
          break;
          
        case 'image':
          if (element.imageData) {
            slide.addImage({
              data: element.imageData,
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h,
              sizing: { 
                type: 'contain',
                w: position.w,
                h: position.h
              }
            });
          }
          break;
          
        case 'shape':
          if (element.shapeType) {
            slide.addShape(element.shapeType, {
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h,
              fill: element.fillColor ? { color: element.fillColor } : undefined,
              line: element.lineColor 
                ? { color: element.lineColor, width: element.lineWidth || 1 }
                : undefined
            });
          }
          break;
          
        case 'color-swatch':
          if (element.colorSwatch) {
            slide.addShape('rect', {
              x: position.x,
              y: position.y,
              w: position.w,
              h: position.h * 0.6,
              fill: { color: element.colorSwatch.hex.replace('#', '') },
              line: { color: 'CCCCCC', width: 1 }
            });
            
            if (element.colorSwatch.name) {
              slide.addText(element.colorSwatch.name, {
                x: position.x,
                y: position.y + position.h * 0.6,
                w: position.w,
                h: position.h * 0.2,
                fontSize: 14,
                bold: true,
                align: 'center',
                valign: 'top'
              });
            }
            
            slide.addText(element.colorSwatch.hex.toUpperCase(), {
              x: position.x,
              y: position.y + position.h * 0.8,
              w: position.w,
              h: position.h * 0.2,
              fontSize: 12,
              fontFace: 'Courier New',
              align: 'center',
              valign: 'top'
            });
          }
          break;
      }
    }
  }
  
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  console.log('✅ Editable PPTX generated successfully');
  
  return buffer as Buffer;
}



