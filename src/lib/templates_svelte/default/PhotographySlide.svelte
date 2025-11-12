<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color6Lighter: string = '#3B82F6';
  export let color7Lighter: string = '#1E40AF';
  export let color8Lighter: string = '#2563EB';
  export let color6Rgba10: string = 'rgba(59, 130, 246, 0.1)';
  export let color7Rgba10: string = 'rgba(30, 64, 175, 0.1)';
  export let isEditable: boolean = false;
  
  // Dynamic styles computed from props
  $: radialOverlayStyle = `radial-gradient(ellipse at top right, ${color6Rgba10} 0%, transparent 60%), radial-gradient(ellipse at bottom left, ${color7Rgba10} 0%, transparent 60%)`;
  $: headerBorderStyle = `4px solid ${primaryColor}`;
  $: titleColorStyle = primaryColor;
  $: photoPlaceholderGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  $: boxTitleColorStyle = primaryColor;
  $: guidelineListColorStyle = primaryColor;
  
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
      text: 'Photography Style',
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
    const columnGap = pxToIn(40); // 40px gap between columns
    const leftColWidth = (contentWidth - columnGap) * (1.5 / 2.5); // 1.5fr out of 1.5fr + 1fr
    const rightColWidth = (contentWidth - columnGap) * (1 / 2.5); // 1fr out of 1.5fr + 1fr
    const leftColX = paddingX;
    const rightColX = leftColX + leftColWidth + columnGap;
    
    // Left column: Photo examples in 2x2 grid
    const photoExamples = [
      { emoji: '📷', label: 'Authentic Moments' },
      { emoji: '🌟', label: 'Natural Lighting' },
      { emoji: '🎨', label: 'Vibrant Colors' },
      { emoji: '👥', label: 'People-Focused' }
    ];
    
    const photoGridGap = pxToIn(20); // 20px gap between photos
    const photoBoxWidth = (leftColWidth - photoGridGap) / 2;
    const photoBoxHeight = (contentHeight - photoGridGap) / 2;
    const photoStartY = contentStartY;
    
    photoExamples.forEach((photo, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const photoBoxX = leftColX + col * (photoBoxWidth + photoGridGap);
      const photoBoxY = photoStartY + row * (photoBoxHeight + photoGridGap);
      
      // Photo box background (white card)
      elements.push({
        id: `photo-box-${index}`,
        type: 'shape' as const,
        position: { x: photoBoxX, y: photoBoxY, w: photoBoxWidth, h: photoBoxHeight },
        shapeType: 'rect',
        fillColor: 'FFFFFF',
        lineColor: 'E0E0E0',
        lineWidth: 1,
        zIndex: 1
      });
      
      // Photo placeholder area (200px height, full width)
      const placeholderHeight = pyToIn(200);
      const placeholderY = photoBoxY;
      
      // Photo placeholder background (gradient area)
      elements.push({
        id: `photo-placeholder-bg-${index}`,
        type: 'shape' as const,
        position: { x: photoBoxX, y: placeholderY, w: photoBoxWidth, h: placeholderHeight },
        shapeType: 'rect',
        fillColor: primaryColor.replace('#', ''),
        zIndex: 2
      });
      
      // Emoji/icon (centered in placeholder)
      elements.push({
        id: `photo-icon-${index}`,
        type: 'text' as const,
        position: { x: photoBoxX, y: placeholderY, w: photoBoxWidth, h: placeholderHeight },
        text: photo.emoji,
        fontSize: 32,
        fontFace: 'Arial',
        color: 'FFFFFF',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 3
      });
      
      // Photo label (below placeholder)
      const labelY = placeholderY + placeholderHeight;
      const labelHeight = photoBoxHeight - placeholderHeight;
      elements.push({
        id: `photo-label-${index}`,
        type: 'text' as const,
        position: { x: photoBoxX, y: labelY, w: photoBoxWidth, h: labelHeight },
        text: photo.label,
        fontSize: 14,
        fontFace: 'Arial',
        bold: true,
        color: '333333',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 2
      });
    });
    
    // Right column: Guidelines section
    const guidelinesStartY = contentStartY;
    const guidelineCardGap = pyToIn(20);
    const guidelineCardHeight = (contentHeight - guidelineCardGap) / 2;
    
    // Guideline card 1: Style Guidelines
    const card1Y = guidelinesStartY;
    elements.push({
      id: 'guideline-card-1-bg',
      type: 'shape' as const,
      position: { x: rightColX, y: card1Y, w: rightColWidth, h: guidelineCardHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    elements.push({
      id: 'guideline-card-1-title',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card1Y + pxToIn(25), w: rightColWidth - pxToIn(50), h: pyToIn(18) },
      text: 'Style Guidelines',
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Guideline list items
    const guidelineItems = [
      'Natural, authentic moments',
      'Bright, well-lit environments',
      'Warm, inviting tones',
      'Diverse, inclusive representation',
      'Professional yet approachable'
    ];
    
    const guidelineStartY = card1Y + pxToIn(50);
    guidelineItems.forEach((item, index) => {
      elements.push({
        id: `guideline-item-${index}`,
        type: 'text' as const,
        position: { 
          x: rightColX + pxToIn(25), 
          y: guidelineStartY + (index * pyToIn(22)), 
          w: rightColWidth - pxToIn(50), 
          h: pyToIn(20) 
        },
        text: `• ${item}`,
        fontSize: 12,
        fontFace: 'Arial',
        color: '666666',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    });
    
    // Guideline card 2: Do's & Don'ts
    const card2Y = card1Y + guidelineCardHeight + guidelineCardGap;
    elements.push({
      id: 'guideline-card-2-bg',
      type: 'shape' as const,
      position: { x: rightColX, y: card2Y, w: rightColWidth, h: guidelineCardHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    elements.push({
      id: 'guideline-card-2-title',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card2Y + pxToIn(25), w: rightColWidth - pxToIn(50), h: pyToIn(18) },
      text: 'Do\'s & Don\'ts',
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Do box
    const doDontGap = pxToIn(15);
    const doDontWidth = (rightColWidth - pxToIn(50) - doDontGap) / 2;
    const doDontHeight = pyToIn(80);
    const doBoxX = rightColX + pxToIn(25);
    const doBoxY = card2Y + pxToIn(50);
    
    elements.push({
      id: 'do-box-bg',
      type: 'shape' as const,
      position: { x: doBoxX, y: doBoxY, w: doDontWidth, h: doDontHeight },
      shapeType: 'rect',
      fillColor: 'D1FAE5',
      lineColor: '10B981',
      lineWidth: 2,
      zIndex: 2
    });
    elements.push({
      id: 'do-title',
      type: 'text' as const,
      position: { x: doBoxX, y: doBoxY, w: doDontWidth, h: pyToIn(20) },
      text: '✓ DO',
      fontSize: 14,
      fontFace: 'Arial',
      bold: true,
      color: '10B981',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 3
    });
    elements.push({
      id: 'do-text',
      type: 'text' as const,
      position: { x: doBoxX, y: doBoxY + pyToIn(22), w: doDontWidth, h: pyToIn(58) },
      text: 'Use natural lighting & authentic scenes',
      fontSize: 11,
      fontFace: 'Arial',
      color: '666666',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 3
    });
    
    // Don't box
    const dontBoxX = doBoxX + doDontWidth + doDontGap;
    elements.push({
      id: 'dont-box-bg',
      type: 'shape' as const,
      position: { x: dontBoxX, y: doBoxY, w: doDontWidth, h: doDontHeight },
      shapeType: 'rect',
      fillColor: 'FEE2E2',
      lineColor: 'EF4444',
      lineWidth: 2,
      zIndex: 2
    });
    elements.push({
      id: 'dont-title',
      type: 'text' as const,
      position: { x: dontBoxX, y: doBoxY, w: doDontWidth, h: pyToIn(20) },
      text: '✗ DON\'T',
      fontSize: 14,
      fontFace: 'Arial',
      bold: true,
      color: 'EF4444',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 3
    });
    elements.push({
      id: 'dont-text',
      type: 'text' as const,
      position: { x: dontBoxX, y: doBoxY + pyToIn(22), w: doDontWidth, h: pyToIn(58) },
      text: 'Avoid staged poses & heavy filters',
      fontSize: 11,
      fontFace: 'Arial',
      color: '666666',
      align: 'center' as const,
      valign: 'top' as const,
      zIndex: 3
    });
    
    return {
      id: 'photography',
      type: 'photography',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color6Lighter.replace('#', ''),
              color7Lighter.replace('#', ''),
              'FFFFFF',
              color8Lighter.replace('#', ''),
              color6Lighter.replace('#', '')
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

<div class="photography-slide" style="background: linear-gradient(135deg, {color6Lighter} 0%, {color7Lighter} 25%, #FFFFFF 50%, {color8Lighter} 75%, {color6Lighter} 100%);">
  <div class="radial-overlay" style="background: {radialOverlayStyle};"></div>
  
  <div class="slide">
    <div class="header" style="border-bottom: {headerBorderStyle};">
      <div class="title" style="color: {titleColorStyle};">Photography Style</div>
    </div>
    
    <div class="content">
      <div class="photo-examples">
        <div class="photo-box">
          <div class="photo-placeholder" style="background: {photoPlaceholderGradient};">📷</div>
          <div class="photo-label">Authentic Moments</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder" style="background: {photoPlaceholderGradient};">🌟</div>
          <div class="photo-label">Natural Lighting</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder" style="background: {photoPlaceholderGradient};">🎨</div>
          <div class="photo-label">Vibrant Colors</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder" style="background: {photoPlaceholderGradient};">👥</div>
          <div class="photo-label">People-Focused</div>
        </div>
      </div>
      
      <div class="guidelines">
        <div class="guideline-box">
          <div class="box-title" style="color: {boxTitleColorStyle};">Style Guidelines</div>
          <ul class="guideline-list" style="--guideline-color: {guidelineListColorStyle};">
            <li>Natural, authentic moments</li>
            <li>Bright, well-lit environments</li>
            <li>Warm, inviting tones</li>
            <li>Diverse, inclusive representation</li>
            <li>Professional yet approachable</li>
          </ul>
        </div>
        
        <div class="guideline-box">
          <div class="box-title" style="color: {boxTitleColorStyle};">Do's & Don'ts</div>
          <div class="do-dont">
            <div class="do-box">
              <div class="do-title">✓ DO</div>
              <div class="rule-text">Use natural lighting & authentic scenes</div>
            </div>
            <div class="dont-box">
              <div class="dont-title">✗ DON'T</div>
              <div class="rule-text">Avoid staged poses & heavy filters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .photography-slide {
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
    grid-template-columns: 1.5fr 1fr;
    gap: 40px;
    height: calc(100% - 100px);
  }
  
  .photo-examples {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .photo-box {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .photo-placeholder {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 32px;
  }
  
  .photo-label {
    padding: 15px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
  
  .guidelines {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .guideline-box {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .box-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
  }
  
  .guideline-list {
    list-style: none;
  }
  
  .guideline-list li {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
    padding-left: 25px;
    position: relative;
    margin-bottom: 10px;
  }
  
  .guideline-list li::before {
    content: '●';
    position: absolute;
    left: 0;
    color: var(--guideline-color, #1E40AF);
    font-size: 18px;
  }
  
  .do-dont {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .do-box, .dont-box {
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .do-box {
    background: #D1FAE5;
    border: 2px solid #10B981;
  }
  
  .dont-box {
    background: #FEE2E2;
    border: 2px solid #EF4444;
  }
  
  .do-title {
    font-size: 16px;
    font-weight: bold;
    color: #10B981;
    margin-bottom: 8px;
  }
  
  .dont-title {
    font-size: 16px;
    font-weight: bold;
    color: #EF4444;
    margin-bottom: 8px;
  }
  
  .rule-text {
    font-size: 12px;
    color: #666;
  }
</style>

