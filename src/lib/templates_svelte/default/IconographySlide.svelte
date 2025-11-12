<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let icons: Array<{ symbol: string; name: string }> = [];
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color5Lighter: string = '#60A5FA';
  export let color6Lighter: string = '#3B82F6';
  export let color7Lighter: string = '#1E40AF';
  export let color5Rgba12: string = 'rgba(96, 165, 250, 0.12)';
  export let color6Rgba12: string = 'rgba(59, 130, 246, 0.12)';
  export let isEditable: boolean = false;
  
  // Dynamic styles computed from props
  $: radialOverlayStyle = `radial-gradient(circle at 30% 40%, ${color5Rgba12} 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${color6Rgba12} 0%, transparent 50%)`;
  $: headerBorderStyle = `4px solid ${primaryColor}`;
  $: titleColorStyle = primaryColor;
  $: gridTitleColorStyle = primaryColor;
  $: iconCircleGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  $: cardTitleColorStyle = primaryColor;
  $: demoIconBgStyle = primaryColor;
  
  // Display all icons (up to 12 in a 4x3 grid, or 8 in a 4x2 grid)
  $: displayIcons = icons.length > 0 ? icons.slice(0, 12) : [
    { symbol: '◐', name: 'Brand' },
    { symbol: '★', name: 'Featured' },
    { symbol: '♥', name: 'Favorites' },
    { symbol: '◆', name: 'Premium' },
    { symbol: '✓', name: 'Success' },
    { symbol: '→', name: 'Navigation' },
    { symbol: '⊕', name: 'Add' },
    { symbol: '⚙', name: 'Settings' }
  ];
  
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
      text: 'Iconography',
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
    const leftColWidth = (contentWidth - columnGap) * (2/3); // 2fr out of 2fr + 1fr
    const rightColWidth = (contentWidth - columnGap) * (1/3); // 1fr out of 2fr + 1fr
    const leftColX = paddingX;
    const rightColX = leftColX + leftColWidth + columnGap;
    
    // Left column: Icon grid section
    const iconGridPadding = pxToIn(30);
    const iconGridX = leftColX;
    const iconGridY = contentStartY;
    const iconGridWidth = leftColWidth;
    const iconGridHeight = contentHeight;
    
    // Icon grid background (white card)
    elements.push({
      id: 'icon-grid-bg',
      type: 'shape' as const,
      position: { x: iconGridX, y: iconGridY, w: iconGridWidth, h: iconGridHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    
    // Icon Library title
    elements.push({
      id: 'grid-title',
      type: 'text' as const,
      position: { x: iconGridX + iconGridPadding, y: iconGridY + iconGridPadding, w: iconGridWidth - (iconGridPadding * 2), h: pyToIn(20) },
      text: 'Icon Library',
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Icons grid (4 columns)
    const iconsStartY = iconGridY + iconGridPadding + pyToIn(45); // After title + margin
    const iconsAreaWidth = iconGridWidth - (iconGridPadding * 2);
    
    // Calculate icon size and spacing (matching CSS exactly)
    const iconCircleSizePx = 80; // 80px circle
    const iconGapPx = 25; // 25px gap between icons (CSS gap: 25px)
    const iconLabelMarginPx = 10; // 10px margin between circle and label
    const iconLabelHeightPx = 30; // Height for label text (allows for 2 lines)
    
    const iconCircleSize = pxToIn(iconCircleSizePx);
    const iconGap = pxToIn(iconGapPx);
    const iconLabelMargin = pyToIn(iconLabelMarginPx);
    const iconLabelHeight = pyToIn(iconLabelHeightPx);
    
    // Total item height: circle + margin + label
    const iconItemHeight = iconCircleSize + iconLabelMargin + iconLabelHeight;
    
    // Calculate column width for 4 columns with proper spacing
    // Total width = 4 columns + 3 gaps
    const iconColWidth = (iconsAreaWidth - (iconGap * 3)) / 4;
    
    // Add icons in 4-column grid
    displayIcons.forEach((icon, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      
      // Calculate column X position (each column starts at its own position)
      const colStartX = iconGridX + iconGridPadding + col * (iconColWidth + iconGap);
      
      // Center icon circle within its column
      const iconX = colStartX + (iconColWidth - iconCircleSize) / 2;
      const iconY = iconsStartY + row * iconItemHeight;
      
      // Icon circle background (ensure it's a perfect circle)
      elements.push({
        id: `icon-circle-${index}`,
        type: 'shape' as const,
        position: { x: iconX, y: iconY, w: iconCircleSize, h: iconCircleSize },
        shapeType: 'circle',
        fillColor: primaryColor.replace('#', ''),
        zIndex: 2
      });
      
      // Icon symbol text (centered in circle)
      elements.push({
        id: `icon-symbol-${index}`,
        type: 'text' as const,
        position: { x: iconX, y: iconY, w: iconCircleSize, h: iconCircleSize },
        text: icon.symbol,
        fontSize: 24,
        fontFace: 'Arial',
        bold: true,
        color: 'FFFFFF',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 3
      });
      
      // Icon label (centered in column, below icon circle)
      const labelY = iconY + iconCircleSize + iconLabelMargin;
      elements.push({
        id: `icon-label-${index}`,
        type: 'text' as const,
        position: { x: colStartX, y: labelY, w: iconColWidth, h: iconLabelHeight },
        text: icon.name,
        fontSize: 11,
        fontFace: 'Arial',
        color: '666666',
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    });
    
    // Right column: Guidelines section
    const guidelinesStartY = contentStartY;
    const guidelineCardHeight = (contentHeight - pyToIn(40)) / 3; // 3 cards with gaps
    const guidelineCardGap = pyToIn(20);
    
    // Guideline card 1: Icon Style
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
      text: 'Icon Style',
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-1-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card1Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(40) },
      text: 'Use rounded, friendly icons that match our brand personality.',
      fontSize: 12,
      fontFace: 'Arial',
      color: '666666',
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    // Demo icon
    const demoIconSize = pxToIn(50);
    const demoIconX = rightColX + (rightColWidth - demoIconSize) / 2;
    const demoIconY = card1Y + pxToIn(95);
    elements.push({
      id: 'demo-icon-bg',
      type: 'shape' as const,
      position: { x: demoIconX, y: demoIconY, w: demoIconSize, h: demoIconSize },
      shapeType: 'rect',
      fillColor: primaryColor.replace('#', ''),
      zIndex: 2
    });
    elements.push({
      id: 'demo-icon-symbol',
      type: 'text' as const,
      position: { x: demoIconX, y: demoIconY, w: demoIconSize, h: demoIconSize },
      text: '◐',
      fontSize: 18,
      fontFace: 'Arial',
      color: 'FFFFFF',
      align: 'center' as const,
      valign: 'middle' as const,
      zIndex: 3
    });
    
    // Guideline card 2: Size & Weight
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
      text: 'Size & Weight',
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-2-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card2Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(60) },
      text: 'Icons should be 24px–48px. Use 2px stroke weight for consistency.',
      fontSize: 12,
      fontFace: 'Arial',
      color: '666666',
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Guideline card 3: Colors
    const card3Y = card2Y + guidelineCardHeight + guidelineCardGap;
    elements.push({
      id: 'guideline-card-3-bg',
      type: 'shape' as const,
      position: { x: rightColX, y: card3Y, w: rightColWidth, h: guidelineCardHeight },
      shapeType: 'rect',
      fillColor: 'FFFFFF',
      lineColor: 'E0E0E0',
      lineWidth: 1,
      zIndex: 1
    });
    elements.push({
      id: 'guideline-card-3-title',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card3Y + pxToIn(25), w: rightColWidth - pxToIn(50), h: pyToIn(18) },
      text: 'Colors',
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: primaryColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-3-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card3Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(60) },
      text: 'Use brand primary color or gradients for emphasis.',
      fontSize: 12,
      fontFace: 'Arial',
      color: '666666',
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    return {
      id: 'iconography',
      type: 'iconography',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color5Lighter.replace('#', ''),
              color6Lighter.replace('#', ''),
              'FFFFFF',
              color7Lighter.replace('#', ''),
              'FFFFFF'
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

<div class="iconography-slide" style="background: linear-gradient(135deg, {color5Lighter} 0%, {color6Lighter} 30%, #FFFFFF 50%, {color7Lighter} 70%, #FFFFFF 100%);">
  <div class="radial-overlay" style="background: {radialOverlayStyle};"></div>
  
  <div class="slide">
    <div class="header" style="border-bottom: {headerBorderStyle};">
      <div class="title" style="color: {titleColorStyle};">Iconography</div>
    </div>
    
    <div class="content">
      <div class="icon-grid">
        <div class="grid-title" style="color: {gridTitleColorStyle};">Icon Library</div>
        <div class="icons">
          {#each displayIcons as icon, index}
            <div class="icon-item">
              <div class="icon-circle" style="background: {iconCircleGradient};">{icon.symbol}</div>
              {#if isEditable}
                <input type="text" bind:value={icon.name} class="icon-label-input" />
              {:else}
                <div class="icon-label">{icon.name}</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      
      <div class="guidelines">
        <div class="guideline-card">
          <div class="card-title" style="color: {cardTitleColorStyle};">Icon Style</div>
          <div class="card-content">
            Use rounded, friendly icons that match our brand personality.
          </div>
          <div class="style-demo">
            <div class="demo-icon" style="background: {demoIconBgStyle};">◐</div>
          </div>
        </div>
        
        <div class="guideline-card">
          <div class="card-title" style="color: {cardTitleColorStyle};">Size & Weight</div>
          <div class="card-content">
            Icons should be 24px–48px. Use 2px stroke weight for consistency.
          </div>
        </div>
        
        <div class="guideline-card">
          <div class="card-title" style="color: {cardTitleColorStyle};">Colors</div>
          <div class="card-content">
            Use brand primary color or gradients for emphasis.
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .iconography-slide {
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
    grid-template-columns: 2fr 1fr;
    gap: 40px;
    height: calc(100% - 100px);
  }
  
  .icon-grid {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .grid-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 25px;
  }
  
  .icons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 25px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .icon-item {
    text-align: center;
  }
  
  .icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 32px;
    font-weight: bold;
  }
  
  .icon-label,
  .icon-label-input {
    font-size: 12px;
    color: #666;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .icon-label-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
  
  .guidelines {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .guideline-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .card-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
  }
  
  .card-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
  
  .style-demo {
    background: #F9FAFB;
    border-radius: 8px;
    padding: 15px;
    margin-top: 12px;
    text-align: center;
  }
  
  .demo-icon {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
  }
</style>

