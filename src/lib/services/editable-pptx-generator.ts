import PptxGenJS from 'pptxgenjs';

export interface SlideData {
  id: string;
  type: string;
  title: string;
  data: any;
  order: number;
}

export async function generateEditablePPTX(slideData: SlideData[], brandData: any): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = brandData.brandName || 'Brand Guidelines';
  pptx.title = `${brandData.brandName || 'Brand'} Guidelines`;
  pptx.subject = 'Brand Guidelines Presentation';
  
  console.log('🎨 Generating editable PPTX with', slideData.length, 'slides');
  
  for (const slide of slideData) {
    const pptxSlide = pptx.addSlide();
    
    switch (slide.type) {
      case 'cover':
        await addCoverSlide(pptxSlide, slide.data);
        break;
      case 'brand-introduction':
        await addBrandIntroductionSlide(pptxSlide, slide.data);
        break;
      case 'brand-positioning':
        await addBrandPositioningSlide(pptxSlide, slide.data);
        break;
      case 'logo-guidelines':
        await addLogoGuidelinesSlide(pptxSlide, slide.data);
        break;
      case 'color-palette':
        await addColorPaletteSlide(pptxSlide, slide.data);
        break;
      case 'typography':
        await addTypographySlide(pptxSlide, slide.data);
        break;
      case 'iconography':
        await addIconographySlide(pptxSlide, slide.data);
        break;
      case 'photography':
        await addPhotographySlide(pptxSlide, slide.data);
        break;
      case 'applications':
        await addApplicationsSlide(pptxSlide, slide.data);
        break;
      case 'thank-you':
        await addThankYouSlide(pptxSlide, slide.data);
        break;
      default:
        console.warn(`Unknown slide type: ${slide.type}`);
        break;
    }
  }
  
  console.log('✅ PPTX generation complete');
  return await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
}

async function addCoverSlide(slide: any, data: any) {
  // Background gradient
  slide.background = { 
    fill: { 
      type: 'gradient',
      gradient: {
        angle: 135,
        stops: [
          { position: 0, color: data.primaryColor || '#2563EB' },
          { position: 100, color: data.secondaryColor || '#7C3AED' }
        ]
      }
    }
  };
  
  // Brand name
  slide.addText(data.brandName || 'Your Brand', {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 48, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
  
  // Tagline
  slide.addText(data.tagline || 'Brand Guidelines', {
    x: 0.5, y: 3.8, w: 9, h: 0.8,
    fontSize: 24, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
  
  // Date
  slide.addText(data.date || new Date().toLocaleDateString(), {
    x: 0.5, y: 5.5, w: 9, h: 0.5,
    fontSize: 14, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
}

async function addBrandIntroductionSlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'Brand Introduction', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '2563EB',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: data.primaryColor || '2563EB' }
  });
  
  // Positioning statement box
  slide.addShape('rect', {
    x: 1, y: 2.5, w: 8, h: 3,
    fill: { color: 'FFFFFF' },
    line: { color: 'E5E7EB', width: 1 }
  });
  
  slide.addText(data.positioningStatement || 'Your positioning statement goes here.', {
    x: 1.2, y: 2.7, w: 7.6, h: 2.6,
    fontSize: 18, color: '333333',
    align: 'center', valign: 'middle',
    fontFace: 'Arial',
    lineSpacing: 1.4
  });
}

async function addBrandPositioningSlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'BRAND POSITIONING', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '2563EB',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Mission and Vision cards
  const cardHeight = 1.8;
  const cardSpacing = 0.2;
  
  // Mission card
  slide.addShape('rect', {
    x: 0.5, y: 2, w: 4.2, h: cardHeight,
    fill: { color: 'F0F9FF' },
    line: { color: '2563EB', width: 2 }
  });
  
  slide.addText(data.missionTitle || 'MISSION', {
    x: 0.7, y: 2.2, w: 4, h: 0.3,
    fontSize: 16, bold: true, color: '2563EB',
    fontFace: 'Arial'
  });
  
  slide.addText(data.mission || 'Your mission statement goes here.', {
    x: 0.7, y: 2.6, w: 4, h: 1.2,
    fontSize: 12, color: '1E40AF',
    fontFace: 'Arial',
    lineSpacing: 1.3
  });
  
  // Vision card
  slide.addShape('rect', {
    x: 4.8, y: 2, w: 4.2, h: cardHeight,
    fill: { color: 'F5F3FF' },
    line: { color: '7C3AED', width: 2 }
  });
  
  slide.addText(data.visionTitle || 'VISION', {
    x: 5, y: 2.2, w: 4, h: 0.3,
    fontSize: 16, bold: true, color: '7C3AED',
    fontFace: 'Arial'
  });
  
  slide.addText(data.vision || 'Your vision statement goes here.', {
    x: 5, y: 2.6, w: 4, h: 1.2,
    fontSize: 12, color: '6D28D9',
    fontFace: 'Arial',
    lineSpacing: 1.3
  });
  
  // Values card
  slide.addShape('rect', {
    x: 0.5, y: 4.2, w: 9, h: cardHeight,
    fill: { color: 'F0FDF4' },
    line: { color: '10B981', width: 2 }
  });
  
  slide.addText(data.valuesTitle || 'CORE VALUES', {
    x: 0.7, y: 4.4, w: 8.6, h: 0.3,
    fontSize: 16, bold: true, color: '10B981',
    fontFace: 'Arial'
  });
  
  slide.addText(data.values || 'Your core values go here.', {
    x: 0.7, y: 4.8, w: 8.6, h: 1.2,
    fontSize: 12, color: '059669',
    fontFace: 'Arial',
    lineSpacing: 1.3
  });
  
  // Personality card
  slide.addShape('rect', {
    x: 0.5, y: 6.2, w: 9, h: cardHeight,
    fill: { color: 'F0FDF4' },
    line: { color: '10B981', width: 2 }
  });
  
  slide.addText(data.personalityTitle || 'TARGET AUDIENCE', {
    x: 0.7, y: 6.4, w: 8.6, h: 0.3,
    fontSize: 16, bold: true, color: '10B981',
    fontFace: 'Arial'
  });
  
  slide.addText(data.personality || 'Your target audience description goes here.', {
    x: 0.7, y: 6.8, w: 8.6, h: 1.2,
    fontSize: 12, color: '059669',
    fontFace: 'Arial',
    lineSpacing: 1.3
  });
}

async function addLogoGuidelinesSlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'LOGO GUIDELINES', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '2563EB',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Guidelines grid
  const guidelines = data.guidelines || [];
  const cols = 2;
  const cardWidth = 4.2;
  const cardHeight = 2.5;
  const cardSpacing = 0.3;
  
  guidelines.forEach((guideline: any, index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = 0.5 + (col * (cardWidth + cardSpacing));
    const y = 2 + (row * (cardHeight + cardSpacing));
    
    // Guideline card
    slide.addShape('rect', {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 }
    });
    
    // Guideline title
    slide.addText(guideline.title || 'Guideline Title', {
      x: x + 0.2, y: y + 0.2, w: cardWidth - 0.4, h: 0.4,
      fontSize: 16, bold: true, color: '333333',
      fontFace: 'Arial'
    });
    
    // Guideline description
    slide.addText(guideline.description || 'Guideline description goes here.', {
      x: x + 0.2, y: y + 0.7, w: cardWidth - 0.4, h: 1.6,
      fontSize: 12, color: '666666',
      fontFace: 'Arial',
      lineSpacing: 1.3
    });
  });
}

async function addColorPaletteSlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'COLORS PALETTE', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.colors?.[0]?.hex || '000000',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Color swatches
  const colors = data.colors || [];
  const startX = 1;
  const swatchWidth = 1.8;
  const swatchHeight = 1.8;
  const swatchSpacing = 0.4;
  
  colors.forEach((color: any, index: number) => {
    const x = startX + (index * (swatchWidth + swatchSpacing));
    const y = 2.5;
    
    // Color swatch
    slide.addShape('rect', {
      x, y, w: swatchWidth, h: swatchHeight,
      fill: { color: color.hex },
      line: { color: 'FFFFFF', width: 2 }
    });
    
    // Color name
    slide.addText(color.name, {
      x, y: y + swatchHeight + 0.1, w: swatchWidth, h: 0.3,
      fontSize: 14, bold: true, color: '2C2C2C',
      align: 'center', fontFace: 'Arial'
    });
    
    // Color hex
    slide.addText(color.hex, {
      x, y: y + swatchHeight + 0.4, w: swatchWidth, h: 0.3,
      fontSize: 12, color: '666666',
      align: 'center', fontFace: 'Arial'
    });
    
    // Color usage
    slide.addText(color.usage, {
      x, y: y + swatchHeight + 0.7, w: swatchWidth, h: 0.3,
      fontSize: 10, color: '999999', italic: true,
      align: 'center', fontFace: 'Arial'
    });
  });
}

async function addTypographySlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'TYPEFACE', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '000000',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Primary Font Card
  slide.addShape('rect', {
    x: 0.5, y: 2, w: 4.2, h: 3,
    fill: { color: 'F8F8F8' },
    line: { color: 'E0E0E0', width: 1 }
  });
  
  slide.addText('PRIMARY FONT', {
    x: 0.7, y: 2.2, w: 4, h: 0.3,
    fontSize: 12, bold: true, color: '666666',
    fontFace: 'Arial'
  });
  
  slide.addText(data.primaryFont || 'Arial', {
    x: 0.7, y: 2.6, w: 4, h: 0.6,
    fontSize: 24, bold: true, color: '2563EB',
    fontFace: data.primaryFont || 'Arial'
  });
  
  slide.addText(data.primarySample || 'Aa Bb Cc...', {
    x: 0.7, y: 3.3, w: 4, h: 0.8,
    fontSize: 14, color: '2C2C2C',
    fontFace: data.primaryFont || 'Arial',
    lineSpacing: 1.2
  });
  
  // Secondary Font Card
  slide.addShape('rect', {
    x: 4.8, y: 2, w: 4.2, h: 3,
    fill: { color: 'F8F8F8' },
    line: { color: 'E0E0E0', width: 1 }
  });
  
  slide.addText('SECONDARY FONT', {
    x: 5, y: 2.2, w: 4, h: 0.3,
    fontSize: 12, bold: true, color: '666666',
    fontFace: 'Arial'
  });
  
  slide.addText(data.secondaryFont || 'Arial', {
    x: 5, y: 2.6, w: 4, h: 0.6,
    fontSize: 24, bold: true, color: '2563EB',
    fontFace: data.secondaryFont || 'Arial'
  });
  
  slide.addText(data.secondarySample || 'Aa Bb Cc...', {
    x: 5, y: 3.3, w: 4, h: 0.8,
    fontSize: 14, color: '2C2C2C',
    fontFace: data.secondaryFont || 'Arial',
    lineSpacing: 1.2
  });
  
  // Typography Hierarchy
  slide.addShape('rect', {
    x: 0.5, y: 5.2, w: 9, h: 1.2,
    fill: { color: 'F8F8F8' },
    line: { color: 'E0E0E0', width: 1 }
  });
  
  slide.addText(data.hierarchyTitle || 'TYPOGRAPHY HIERARCHY', {
    x: 0.7, y: 5.4, w: 8.6, h: 0.3,
    fontSize: 12, bold: true, color: '666666',
    fontFace: 'Arial'
  });
  
  slide.addText(data.hierarchyContent || 'H1: 32pt - Main titles\nH2: 24pt - Section headers\nH3: 20pt - Subsection headers\nBody: 16pt - Main content', {
    x: 0.7, y: 5.7, w: 8.6, h: 0.8,
    fontSize: 11, color: '2C2C2C',
    fontFace: 'Arial',
    lineSpacing: 1.2
  });
}

async function addIconographySlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'ICONOGRAPHY', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '000000',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Icons grid
  const icons = data.icons || [];
  const cols = 3;
  const cardWidth = 2.8;
  const cardHeight = 3;
  const cardSpacing = 0.2;
  
  icons.forEach((icon: any, index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = 0.5 + (col * (cardWidth + cardSpacing));
    const y = 2 + (row * (cardHeight + cardSpacing));
    
    // Icon card
    slide.addShape('rect', {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 }
    });
    
    // Icon placeholder
    slide.addShape('rect', {
      x: x + 0.8, y: y + 0.3, w: 1.2, h: 1.2,
      fill: { color: data.primaryColor + '20' || '2563EB20' }
    });
    
    // Icon name
    slide.addText(icon.name || 'Icon Name', {
      x: x + 0.2, y: y + 1.8, w: cardWidth - 0.4, h: 0.4,
      fontSize: 16, bold: true, color: '333333',
      align: 'center', fontFace: 'Arial'
    });
    
    // Icon description
    slide.addText(icon.description || 'Icon description goes here.', {
      x: x + 0.2, y: y + 2.3, w: cardWidth - 0.4, h: 0.6,
      fontSize: 10, color: '666666',
      align: 'center', fontFace: 'Arial',
      lineSpacing: 1.2
    });
  });
}

async function addPhotographySlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'PHOTOGRAPHY', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '000000',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Photography styles grid
  const styles = data.styles || [];
  const cols = 2;
  const cardWidth = 4.2;
  const cardHeight = 3.5;
  const cardSpacing = 0.3;
  
  styles.forEach((style: any, index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = 0.5 + (col * (cardWidth + cardSpacing));
    const y = 2 + (row * (cardHeight + cardSpacing));
    
    // Style card
    slide.addShape('rect', {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 }
    });
    
    // Image placeholder
    slide.addShape('rect', {
      x: x + 0.2, y: y + 0.3, w: cardWidth - 0.4, h: 1.5,
      fill: { color: data.primaryColor + '20' || '2563EB20' }
    });
    
    // Style name
    slide.addText(style.name || 'Style Name', {
      x: x + 0.2, y: y + 2, w: cardWidth - 0.4, h: 0.4,
      fontSize: 16, bold: true, color: '333333',
      align: 'center', fontFace: 'Arial'
    });
    
    // Style description
    slide.addText(style.description || 'Style description goes here.', {
      x: x + 0.2, y: y + 2.5, w: cardWidth - 0.4, h: 0.8,
      fontSize: 12, color: '666666',
      align: 'center', fontFace: 'Arial',
      lineSpacing: 1.3
    });
  });
}

async function addApplicationsSlide(slide: any, data: any) {
  // Title
  slide.addText(data.title || 'BRAND APPLICATIONS', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32, bold: true, color: data.primaryColor || '000000',
    fontFace: 'Arial'
  });
  
  // Divider line
  slide.addShape('rect', {
    x: 0.5, y: 1.4, w: 9, h: 0.05,
    fill: { color: '8B4513' }
  });
  
  // Applications grid
  const applications = data.applications || [];
  const cols = 3;
  const cardWidth = 2.8;
  const cardHeight = 3;
  const cardSpacing = 0.2;
  
  applications.forEach((application: any, index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = 0.5 + (col * (cardWidth + cardSpacing));
    const y = 2 + (row * (cardHeight + cardSpacing));
    
    // Application card
    slide.addShape('rect', {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 }
    });
    
    // Application placeholder
    slide.addShape('rect', {
      x: x + 0.2, y: y + 0.3, w: cardWidth - 0.4, h: 1.2,
      fill: { color: data.primaryColor + '20' || '2563EB20' }
    });
    
    // Application name
    slide.addText(application.name || 'Application Name', {
      x: x + 0.2, y: y + 1.8, w: cardWidth - 0.4, h: 0.4,
      fontSize: 16, bold: true, color: '333333',
      align: 'center', fontFace: 'Arial'
    });
    
    // Application description
    slide.addText(application.description || 'Application description goes here.', {
      x: x + 0.2, y: y + 2.3, w: cardWidth - 0.4, h: 0.6,
      fontSize: 10, color: '666666',
      align: 'center', fontFace: 'Arial',
      lineSpacing: 1.2
    });
  });
}

async function addThankYouSlide(slide: any, data: any) {
  // Background gradient
  slide.background = { 
    fill: { 
      type: 'gradient',
      gradient: {
        angle: 135,
        stops: [
          { position: 0, color: data.primaryColor || '#2563EB' },
          { position: 100, color: data.secondaryColor || '#7C3AED' }
        ]
      }
    }
  };
  
  // Thank you message
  slide.addText(data.title || 'THANK YOU', {
    x: 0.5, y: 2.5, w: 9, h: 1.5,
    fontSize: 48, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
  
  // Subtitle
  slide.addText(data.subtitle || 'Thank you for your attention', {
    x: 0.5, y: 4.2, w: 9, h: 0.8,
    fontSize: 20, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
  
  // Contact information
  slide.addText(data.contact || 'Contact us for more information', {
    x: 0.5, y: 5.5, w: 9, h: 0.5,
    fontSize: 14, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial'
  });
}
