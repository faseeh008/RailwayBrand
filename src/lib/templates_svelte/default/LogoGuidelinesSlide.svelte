<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandName: string = 'Brand Name';
  export let logoUrl: string = '';
  export let logoData: string = '';
  export let primaryColor: string = '#1E40AF';
  export let color3Lighter: string = '#BFDBFE';
  export let color4Lighter: string = '#93C5FD';
  export let color3Rgba12: string = 'rgba(96, 165, 250, 0.12)';
  export let color4Rgba12: string = 'rgba(147, 197, 253, 0.12)';
  export let isEditable: boolean = false;
  
  // Dynamic styles computed from props
  $: radialOverlayStyle = `radial-gradient(ellipse at top left, ${color3Rgba12} 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${color4Rgba12} 0%, transparent 50%)`;
  $: headerBorderStyle = `4px solid ${primaryColor}`;
  $: titleColorStyle = primaryColor;
  $: sectionTitleColorStyle = primaryColor;
  $: spacingDemoBorderStyle = `3px dashed ${primaryColor}`;
  $: guidelineItemColorStyle = primaryColor;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    // Helper: Convert pixels to inches (1280px = 10in, 720px = 5.625in)
    const pxToIn = (px: number) => (px / 1280) * 10;
    const pyToIn = (py: number) => (py / 720) * 5.625;
    
    const elements: SlideData['elements'] = [];
    
    // Slide padding: 60px left/right, 40px top
    const paddingX = pxToIn(60); // ~0.47in
    const paddingY = pyToIn(40); // ~0.28in
    const headerHeight = pyToIn(100); // Header + margin ~100px
    
    // Title (in header)
    elements.push({
      id: 'title',
      type: 'text' as const,
      position: { x: paddingX, y: paddingY, w: 10 - (paddingX * 2), h: pyToIn(42) },
      text: 'Logo Guidelines',
      fontSize: 36,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 3
    });
    
    // Divider line
    elements.push({
      id: 'divider',
      type: 'shape' as const,
      position: { x: paddingX, y: paddingY + pyToIn(60), w: 10 - (paddingX * 2), h: pyToIn(4) },
      shapeType: 'rect',
      fillColor: primaryColor.replace('#', ''),
      lineColor: primaryColor.replace('#', ''),
      lineWidth: 0,
      zIndex: 3
    });
    
    // Content area starts after header
    const contentStartY = paddingY + headerHeight;
    const contentHeight = 5.625 - contentStartY - paddingY;
    const contentWidth = 10 - (paddingX * 2);
    const gap = pxToIn(40); // 40px gap between columns
    const colWidth = (contentWidth - gap) / 2;
    
    // Left column: Logo section
    const leftColX = paddingX;
    const logoSectionY = contentStartY;
    const logoSectionHeight = contentHeight;
    
    // Logo section background (white card)
    elements.push({
      id: 'logo-section-bg',
      type: 'shape' as const,
      position: { x: leftColX, y: logoSectionY, w: colWidth, h: logoSectionHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    
    // Section title "Primary Logo"
    const sectionTitleY = logoSectionY + pyToIn(30);
    elements.push({
      id: 'section-title',
      type: 'text' as const,
      position: { x: leftColX + pxToIn(30), y: sectionTitleY, w: colWidth - pxToIn(60), h: pyToIn(20) },
      text: 'Primary Logo',
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Logo placeholder area (200px × 200px centered in column)
    const logoPlaceholderSize = pxToIn(200);
    const logoPlaceholderX = leftColX + (colWidth - logoPlaceholderSize) / 2;
    const logoPlaceholderY = sectionTitleY + pyToIn(45);
    
    // Logo placeholder background
    elements.push({
      id: 'logo-placeholder-bg',
      type: 'shape' as const,
      position: { x: logoPlaceholderX, y: logoPlaceholderY, w: logoPlaceholderSize, h: logoPlaceholderSize },
      shapeType: 'rect',
      fillColor: 'F8F9FA',
      lineColor: 'DDDDDD',
      lineWidth: 2,
      zIndex: 2
    });
    
    // Logo image or text (centered in placeholder area)
    // Image should fill the placeholder area and be centered (like UI)
    if (logoData || logoUrl) {
      // Image fills entire placeholder area - PPTX will center it with 'contain' sizing
      elements.push({
        id: 'logo',
        type: 'image' as const,
        position: { 
          x: logoPlaceholderX, 
          y: logoPlaceholderY, 
          w: logoPlaceholderSize, 
          h: logoPlaceholderSize
        },
        imageData: logoData || undefined,
        imageSrc: logoUrl || undefined,
        zIndex: 3
      });
    } else {
      elements.push({
        id: 'logo-text',
        type: 'text' as const,
        position: { x: logoPlaceholderX, y: logoPlaceholderY, w: logoPlaceholderSize, h: logoPlaceholderSize },
        text: brandName,
        fontSize: 28,
        fontFace: 'Arial',
        bold: true,
        color: '666666',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 3
      });
    }
    
    // Spacing guides (below logo)
    const spacingGuideY = logoPlaceholderY + logoPlaceholderSize + pyToIn(20);
    const spacingBoxSize = pxToIn(80);
    const spacingBoxGap = pxToIn(20);
    const spacingBoxStartX = leftColX + (colWidth - (spacingBoxSize * 2 + spacingBoxGap)) / 2;
    
    // Minimum size box
    elements.push({
      id: 'min-size-box',
      type: 'shape' as const,
      position: { x: spacingBoxStartX, y: spacingGuideY, w: spacingBoxSize, h: spacingBoxSize },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: primaryColor.replace('#', ''),
      lineWidth: 2,
      zIndex: 2
    });
    elements.push({
      id: 'min-size-label',
      type: 'text' as const,
      position: { x: spacingBoxStartX, y: spacingGuideY, w: spacingBoxSize, h: spacingBoxSize },
      text: 'MIN',
      fontSize: 10,
      fontFace: 'Arial',
      color: primaryColor.replace('#', ''),
      align: 'center' as const,
      valign: 'middle' as const,
      zIndex: 3
    });
    elements.push({
      id: 'min-size-text',
      type: 'text' as const,
      position: { x: spacingBoxStartX, y: spacingGuideY + spacingBoxSize + pyToIn(5), w: spacingBoxSize, h: pyToIn(30) },
      text: 'Minimum Size\n32px',
      fontSize: 10,
      fontFace: 'Arial',
      color: '666666',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Clear space box
    const clearSpaceBoxX = spacingBoxStartX + spacingBoxSize + spacingBoxGap;
    elements.push({
      id: 'clear-space-box',
      type: 'shape' as const,
      position: { x: clearSpaceBoxX, y: spacingGuideY, w: spacingBoxSize, h: spacingBoxSize },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: primaryColor.replace('#', ''),
      lineWidth: 2,
      zIndex: 2
    });
    elements.push({
      id: 'clear-space-label',
      type: 'text' as const,
      position: { x: clearSpaceBoxX, y: spacingGuideY, w: spacingBoxSize, h: spacingBoxSize },
      text: 'CLEAR',
      fontSize: 10,
      fontFace: 'Arial',
      color: primaryColor.replace('#', ''),
      align: 'center' as const,
      valign: 'middle' as const,
      zIndex: 3
    });
    elements.push({
      id: 'clear-space-text',
      type: 'text' as const,
      position: { x: clearSpaceBoxX, y: spacingGuideY + spacingBoxSize + pyToIn(5), w: spacingBoxSize, h: pyToIn(30) },
      text: 'Clear Space\n10% padding',
      fontSize: 10,
      fontFace: 'Arial',
      color: '666666',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Right column: Guidelines section
    const rightColX = leftColX + colWidth + gap;
    const guidelinesSectionY = contentStartY;
    
    // Guidelines section background (white card)
    elements.push({
      id: 'guidelines-section-bg',
      type: 'shape' as const,
      position: { x: rightColX, y: guidelinesSectionY, w: colWidth, h: contentHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    
    // Guidelines section title
    elements.push({
      id: 'guidelines-title',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(30), y: guidelinesSectionY + pyToIn(30), w: colWidth - pxToIn(60), h: pyToIn(20) },
      text: 'Usage Guidelines',
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Guidelines items
    const guidelines = [
      { title: 'Minimum Size', desc: 'Never scale the logo below 32px in height to maintain legibility.' },
      { title: 'Clear Space', desc: 'Maintain clear space equal to 10% of the logo\'s width on all sides.' },
      { title: 'Background Usage', desc: 'Use on white or light backgrounds for optimal visibility and impact.' },
      { title: 'Do Not Modify', desc: 'Never rotate, distort, or change the logo colors or proportions.' }
    ];
    
    const guidelineStartY = guidelinesSectionY + pyToIn(70);
    const guidelineItemHeight = pyToIn(60);
    const guidelineSpacing = pyToIn(20);
    
    guidelines.forEach((guideline, index) => {
      const itemY = guidelineStartY + (index * (guidelineItemHeight + guidelineSpacing));
      
      // Checkmark/bullet
      elements.push({
        id: `guideline-check-${index}`,
        type: 'text' as const,
        position: { x: rightColX + pxToIn(30), y: itemY, w: pxToIn(25), h: guidelineItemHeight },
        text: '✓',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: primaryColor.replace('#', ''),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      });
      
      // Guideline title
      elements.push({
        id: `guideline-title-${index}`,
        type: 'text' as const,
        position: { x: rightColX + pxToIn(55), y: itemY, w: colWidth - pxToIn(85), h: pyToIn(16) },
        text: guideline.title,
        fontSize: 14,
        fontFace: 'Arial',
        bold: true,
        color: '333333',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      });
      
      // Guideline description
      elements.push({
        id: `guideline-desc-${index}`,
        type: 'text' as const,
        position: { x: rightColX + pxToIn(55), y: itemY + pyToIn(18), w: colWidth - pxToIn(85), h: pyToIn(42) },
        text: guideline.desc,
        fontSize: 12,
        fontFace: 'Arial',
        color: '666666',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    });
    
    return {
      id: 'logo-guidelines',
      type: 'logo',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color3Lighter.replace('#', ''),
              color4Lighter.replace('#', ''),
              'FFFFFF',
              color3Lighter.replace('#', '')
            ],
            direction: 135
          }
        }
      },
      elements
    };
  }
  
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div class="logo-guidelines-slide" style="background: linear-gradient(135deg, {color3Lighter} 0%, {color4Lighter} 25%, #FFFFFF 50%, {color3Lighter} 75%, #FFFFFF 100%);">
  <div class="radial-overlay" style="background: {radialOverlayStyle};"></div>
  
  <div class="slide">
    <div class="header" style="border-bottom: {headerBorderStyle};">
      <div class="title" style="color: {titleColorStyle};">Logo Guidelines</div>
    </div>
    
    <div class="content">
      <div class="logo-section">
        <div class="section-title" style="color: {sectionTitleColorStyle};">Primary Logo</div>
        <div class="logo-placeholder">
          {#if logoData}
            <img src={logoData} alt="{brandName} Logo" class="logo-image" />
          {:else if logoUrl}
            <img src={logoUrl} alt="{brandName} Logo" class="logo-image" />
          {:else}
            <div class="logo-text">{brandName}</div>
          {/if}
        </div>
        <div class="spacing-guide">
          <div class="spacing-box">
            <div class="spacing-demo" style="border: {spacingDemoBorderStyle};">
              <span style="font-size: 10px;">MIN</span>
            </div>
            <div class="spacing-label">Minimum Size<br>32px</div>
          </div>
          <div class="spacing-box">
            <div class="spacing-demo" style="border: {spacingDemoBorderStyle};">
              <span style="font-size: 14px;">CLEAR</span>
            </div>
            <div class="spacing-label">Clear Space<br>10% padding</div>
          </div>
        </div>
      </div>
      
      <div class="guidelines-box">
        <div class="section-title" style="color: {sectionTitleColorStyle};">Usage Guidelines</div>
        
        <div class="guideline-item" style="--guideline-color: {guidelineItemColorStyle};">
          <div class="guideline-title">Minimum Size</div>
          <div class="guideline-desc">Never scale the logo below 32px in height to maintain legibility.</div>
        </div>
        
        <div class="guideline-item" style="--guideline-color: {guidelineItemColorStyle};">
          <div class="guideline-title">Clear Space</div>
          <div class="guideline-desc">Maintain clear space equal to 10% of the logo's width on all sides.</div>
        </div>
        
        <div class="guideline-item" style="--guideline-color: {guidelineItemColorStyle};">
          <div class="guideline-title">Background Usage</div>
          <div class="guideline-desc">Use on white or light backgrounds for optimal visibility and impact.</div>
        </div>
        
        <div class="guideline-item" style="--guideline-color: {guidelineItemColorStyle};">
          <div class="guideline-title">Do Not Modify</div>
          <div class="guideline-desc">Never rotate, distort, or change the logo colors or proportions.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .logo-guidelines-slide {
    width: 1280px;
    height: 720px;
    position: relative;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
  }
  
  .radial-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }
  
  .slide {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    padding: 40px 60px;
  }
  
  .header {
    padding-bottom: 15px;
    margin-bottom: 30px;
  }
  
  .title {
    font-size: 42px;
    font-weight: bold;
  }
  
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    height: calc(100% - 100px);
  }
  
  .logo-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
  }
  
  .logo-placeholder {
    width: 200px;
    height: 200px;
    background: #f8f9fa;
    border: 2px dashed #ddd;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
  }
  
  .logo-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .logo-text {
    font-size: 36px;
    font-weight: bold;
    color: #666;
  }
  
  .spacing-guide {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 20px;
  }
  
  .spacing-box {
    text-align: center;
  }
  
  .spacing-demo {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .spacing-label {
    font-size: 12px;
    color: #666;
    font-weight: bold;
  }
  
  .guidelines-box {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .guideline-item {
    margin-bottom: 20px;
    padding-left: 25px;
    position: relative;
  }
  
  .guideline-item::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--guideline-color, #1E40AF);
    font-weight: bold;
    font-size: 18px;
  }
  
  .guideline-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  
  .guideline-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
</style>

