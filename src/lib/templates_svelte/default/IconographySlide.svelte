<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import DynamicIcon from '$lib/components/DynamicIcon.svelte';
  
  export let icons: Array<{ symbol: string; name: string }> = [];
  export let color1Hex: string = '#1E40AF'; // PRIMARY_COLOR (for title)
  export let color4Hex: string = '#93C5FD'; // SECONDARY_COLOR
  export let color5Lighter: string = '#60A5FA';
  export let color6Lighter: string = '#3B82F6';
  export let color7Lighter: string = '#1E40AF';
  export let color5Rgba12: string = 'rgba(96, 165, 250, 0.12)';
  export let color6Rgba12: string = 'rgba(59, 130, 246, 0.12)';
  export let isEditable: boolean = false;
  
  // Editable background
  export let background: {
    type: 'color' | 'gradient';
    color?: string;
    gradient?: {
      colors: string[];
      direction: number;
    };
  } = {
    type: 'gradient',
    gradient: {
      colors: [color5Lighter, color6Lighter, '#FFFFFF', color7Lighter, '#FFFFFF'],
      direction: 135
    }
  };
  
  // Background style
  $: backgroundStyle = (() => {
    if (background && background.type === 'color' && background.color) {
      return background.color;
    } else if (background && background.type === 'gradient' && background.gradient && background.gradient.colors && background.gradient.colors.length > 0) {
      const colors = background.gradient.colors;
      const stops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(', ');
      return `linear-gradient(${background.gradient.direction || 135}deg, ${stops})`;
    } else {
      // Fallback to default gradient
      return `linear-gradient(135deg, ${color5Lighter} 0%, ${color6Lighter} 30%, #FFFFFF 50%, ${color7Lighter} 70%, #FFFFFF 100%)`;
    }
  })();
  
  // Editable guideline content
  export let gridTitle: string = 'Icon Library';
  export let guideline1Title: string = 'Icon Style';
  export let guideline1Content: string = 'Use rounded, friendly icons that match our brand personality.';
  export let guideline2Title: string = 'Size & Weight';
  export let guideline2Content: string = 'Icons should be 24px–48px. Use 2px stroke weight for consistency.';
  export let guideline3Title: string = 'Colors';
  export let guideline3Content: string = 'Use brand primary color or gradients for emphasis.';
  
  // Dynamic styles computed from props
  $: radialOverlayStyle = `radial-gradient(circle at 30% 40%, ${color5Rgba12} 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${color6Rgba12} 0%, transparent 50%)`;
  $: headerBorderStyle = `4px solid ${color1Hex}`;
  $: titleColorStyle = color1Hex; // HTML uses {{PRIMARY_COLOR}} for title
  $: gridTitleColorStyle = color1Hex;
  $: iconCircleGradient = `linear-gradient(135deg, ${color1Hex} 0%, ${color4Hex} 100%)`;
  $: cardTitleColorStyle = color1Hex;
  $: demoIconBgStyle = color1Hex;
  
  // Display all icons (up to 12 in a 4x3 grid, or 8 in a 4x2 grid)
  // Extract icon names from icons array - use name for Lucide icon lookup
  $: displayIcons = icons.length > 0 ? icons.slice(0, 12) : [
    { symbol: '', name: 'Brand' },
    { symbol: '', name: 'Featured' },
    { symbol: '', name: 'Success' },
    { symbol: '', name: 'Navigation' },
    { symbol: '', name: 'Add' },
    { symbol: '', name: 'Settings' }
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
      color: color1Hex.replace('#', ''),
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
      fillColor: color1Hex.replace('#', ''),
      lineColor: color1Hex.replace('#', ''),
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
      text: gridTitle,
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: color1Hex.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
        zIndex: 2
    });
    
    // Icons grid (4 columns) with proper spacing to prevent overlap
    const iconsStartY = iconGridY + iconGridPadding + pyToIn(50); // After title + margin
    const iconsAreaWidth = iconGridWidth - (iconGridPadding * 2);
    const iconsAreaHeight = iconGridHeight - iconGridPadding - pyToIn(50) - iconGridPadding; // Available height for icons
    
    // Calculate icon size and spacing to fit within available space
    const iconCircleSizePx = 70; // Reduced to prevent overlap
    const iconGapPx = 28; // Gap between icons
    const iconLabelMarginPx = 10; // Margin between circle and label
    const iconLabelHeightPx = 25; // Height for label text
    
    const iconCircleSize = pxToIn(iconCircleSizePx);
    const iconGap = pxToIn(iconGapPx);
    const iconLabelMargin = pyToIn(iconLabelMarginPx);
    const iconLabelHeight = pyToIn(iconLabelHeightPx);
    
    // Total item height: circle + margin + label
    const iconItemHeight = iconCircleSize + iconLabelMargin + iconLabelHeight;
    
    // Gap between rows
    const iconRowGap = pyToIn(15);
    
    // Calculate how many rows can fit within available height
    const maxRows = Math.floor((iconsAreaHeight + iconRowGap) / (iconItemHeight + iconRowGap));
    const actualRows = Math.min(maxRows, Math.ceil(displayIcons.length / 4));
    
    // Calculate column width for 4 columns with proper spacing
    const iconColWidth = (iconsAreaWidth - (iconGap * 3)) / 4;
    
    // Add icons in 4-column grid with proper row spacing
    displayIcons.forEach((icon, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      
      // Only add icons that fit within available space
      if (row >= actualRows) return;
      
      // Calculate column X position (each column starts at its own position)
      const colStartX = iconGridX + iconGridPadding + col * (iconColWidth + iconGap);
      
      // Center icon circle within its column
      const iconX = colStartX + (iconColWidth - iconCircleSize) / 2;
      const iconY = iconsStartY + row * (iconItemHeight + iconRowGap);
      
      // Icon circle background (ensure it's a perfect circle)
      elements.push({
        id: `icon-circle-${index}`,
        type: 'shape' as const,
        position: { x: iconX, y: iconY, w: iconCircleSize, h: iconCircleSize },
        shapeType: 'circle',
        fillColor: color1Hex.replace('#', ''),
        zIndex: 2
      });
      
      // Icon image - convert icon name to base64 image (same as UI uses DynamicIcon)
      // Import the utility at the top of the script section
      const iconImageSize = Math.round(iconCircleSizePx * 0.45); // Icon size within circle (45% of circle size)
      const iconImagePadding = iconCircleSize * 0.15; // 15% padding around icon
      const iconImageSizeIn = iconCircleSize - (iconImagePadding * 2);
      
      // For client-side, we'll need to generate the icon SVG and convert to base64
      // This is a simplified version - in production, you might want to pre-generate these
      // For now, we'll use a placeholder that will be replaced by the actual icon rendering
      // The actual icon rendering happens in the UI via DynamicIcon component
      // For PPTX export, the svelte-slide-generator.ts handles this conversion
      
      // Note: This is kept as text for backward compatibility, but the actual PPTX export
      // should use image elements generated from iconNameToBase64Image utility
      const iconText = icon.name.substring(0, 2).toUpperCase();
      elements.push({
        id: `icon-symbol-${index}`,
        type: 'text' as const,
        position: { x: iconX, y: iconY, w: iconCircleSize, h: iconCircleSize },
        text: iconText,
        fontSize: 20,
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
      text: guideline1Title,
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: color1Hex.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-1-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card1Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(40) },
      text: guideline1Content,
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
      fillColor: color1Hex.replace('#', ''),
      zIndex: 2
    });
    // Demo icon - use first icon name or default
    const demoIconText = displayIcons.length > 0 ? displayIcons[0].name.substring(0, 2).toUpperCase() : 'IC';
    elements.push({
      id: 'demo-icon-symbol',
      type: 'text' as const,
      position: { x: demoIconX, y: demoIconY, w: demoIconSize, h: demoIconSize },
      text: demoIconText,
      fontSize: 16,
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
      text: guideline2Title,
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: color1Hex.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-2-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card2Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(60) },
      text: guideline2Content,
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
      text: guideline3Title,
      fontSize: 16,
      fontFace: 'Arial',
      bold: true,
      color: color1Hex.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    elements.push({
      id: 'guideline-card-3-content',
      type: 'text' as const,
      position: { x: rightColX + pxToIn(25), y: card3Y + pxToIn(50), w: rightColWidth - pxToIn(50), h: pyToIn(60) },
      text: guideline3Content,
      fontSize: 12,
      fontFace: 'Arial',
      color: '666666',
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    });
    
    // Use the current background prop (which may have been edited)
    let bgColors: string[] = [];
    let bgDirection = 135;
    
    if (background && background.type === 'gradient' && background.gradient && background.gradient.colors) {
      bgColors = background.gradient.colors
        .filter(c => c != null && typeof c === 'string')
        .map(c => (c || '').replace('#', ''))
        .filter(c => c.length > 0);
      bgDirection = background.gradient.direction || 135;
    } else if (background && background.type === 'color' && background.color) {
      const color = (background.color || '').replace('#', '');
      if (color) bgColors = [color];
    }
    
    // Fallback to default if no valid colors found
    if (bgColors.length === 0) {
      const fallbackColors = [
        color5Lighter,
        color6Lighter,
        'FFFFFF',
        color7Lighter,
        'FFFFFF'
      ].filter(c => c != null && typeof c === 'string');
      
      bgColors = fallbackColors.length > 0
        ? fallbackColors.map(c => (c || '').replace('#', ''))
        : ['FFFFFF', 'F0F0F0', 'FFFFFF', 'E0E0E0', 'FFFFFF'];
    }
    
    return {
      id: 'iconography',
      type: 'iconography',
      layout: {
        width: 10,
        height: 5.625,
        background: bgColors.length === 1 ? {
          type: 'color',
          color: bgColors[0]
        } : {
          type: 'gradient',
          gradient: {
            colors: bgColors,
            direction: bgDirection
          }
        }
      },
      elements
    };
  }
  
  // Always call createSlideData() to get the latest values (including edited content)
  // Note: This is synchronous, but icon conversion happens in svelte-slide-generator.ts
  // For the UI preview, we use DynamicIcon components which render actual icons
  export function getSlideData(): SlideData {
    return createSlideData();
  }
  
  // Async version for icon conversion (used during export)
  export async function getSlideDataWithIcons(): Promise<SlideData> {
    const slideData = createSlideData();
    
    // Convert text icon elements to image elements
    const { iconNameToBase64Image } = await import('$lib/utils/icon-to-image');
    
    // Helper functions (same as in createSlideData)
    const pxToIn = (px: number) => (px / 1280) * 10;
    const pyToIn = (py: number) => (py / 720) * 5.625;
    const iconCircleSizePx = 70;
    const iconCircleSize = pxToIn(iconCircleSizePx);
    
    // Process all icon elements
    const elementsToRemove: number[] = [];
    const elementsToAdd: SlideData['elements'] = [];
    
    for (let i = 0; i < slideData.elements.length; i++) {
      const element = slideData.elements[i];
      
      // Convert icon text elements to image elements
      if (element.id.startsWith('icon-symbol-') && element.type === 'text') {
        const index = parseInt(element.id.replace('icon-symbol-', ''));
        const icon = displayIcons[index];
        if (icon) {
          // Use the EXACT same icon name as the UI (DynamicIcon uses icon.name)
          const iconName = icon.name || 'Icon';
          const iconImageSize = Math.round(iconCircleSizePx * 0.45); // Icon size in pixels
          
          console.log(`🔄 [IconographySlide] Converting icon ${index} "${iconName}" (same as UI) (size: ${iconImageSize}px)...`);
          
          // Convert to PNG image using the same logic as DynamicIcon
          const iconImageData = await iconNameToBase64Image(iconName, iconImageSize, '#FFFFFF', 2);
          
          if (!iconImageData) {
            console.error(`❌ [IconographySlide] Failed to convert icon ${index} "${iconName}" - no image data returned`);
            continue; // Skip this icon
          }
          
          console.log(`📊 [IconographySlide] Icon ${index} "${iconName}" conversion result:`, {
            hasData: !!iconImageData,
            dataLength: iconImageData?.length,
            isPNG: iconImageData?.startsWith('data:image/png'),
            isSVG: iconImageData?.startsWith('data:image/svg'),
            preview: iconImageData?.substring(0, 50)
          });
          
          // Get circle element to calculate position
          const iconCircleElement = slideData.elements.find(e => e.id === `icon-circle-${index}`);
          if (iconCircleElement && iconImageData) {
            const iconX = iconCircleElement.position.x;
            const iconY = iconCircleElement.position.y;
            const iconImagePadding = iconCircleSize * 0.15;
            const iconImageSizeIn = iconCircleSize - (iconImagePadding * 2);
            
            // Mark text element for removal
            elementsToRemove.push(i);
            
            // Add image element
            elementsToAdd.push({
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
            });
            
            console.log(`✅ Converted icon ${index} "${iconName}" to image (PNG: ${iconImageData.startsWith('data:image/png')})`);
          } else {
            if (!iconCircleElement) {
              console.error(`❌ Could not convert icon ${index} "${iconName}": circle element not found`);
            }
            if (!iconImageData) {
              console.error(`❌ Could not convert icon ${index} "${iconName}": image data is null/empty`);
            }
          }
        }
      }
      
      // Also handle demo icon
      if (element.id === 'demo-icon-symbol' && element.type === 'text') {
        const demoIconName = displayIcons.length > 0 ? displayIcons[0].name : 'Icon';
        const demoIconSizePx = Math.round(50 * 0.6); // 50px * 0.6 = 30px
        const demoIconData = await iconNameToBase64Image(demoIconName, demoIconSizePx, '#FFFFFF', 2);
        
        const demoIconBgElement = slideData.elements.find(e => e.id === 'demo-icon-bg');
        if (demoIconBgElement && demoIconData) {
          const demoX = demoIconBgElement.position.x;
          const demoY = demoIconBgElement.position.y;
          const demoSize = demoIconBgElement.position.w;
          const demoPadding = demoSize * 0.15;
          const demoImageSize = demoSize - (demoPadding * 2);
          
          // Mark text element for removal
          elementsToRemove.push(i);
          
          // Add image element
          elementsToAdd.push({
            id: 'demo-icon-image',
            type: 'image' as const,
            position: {
              x: demoX + demoPadding,
              y: demoY + demoPadding,
              w: demoImageSize,
              h: demoImageSize
            },
            imageData: demoIconData,
            zIndex: 3
          });
          
          console.log(`✅ Converted demo icon "${demoIconName}" to image`);
        }
      }
    }
    
    // Remove text elements (in reverse order to maintain indices)
    elementsToRemove.sort((a, b) => b - a);
    console.log(`🗑️ Removing ${elementsToRemove.length} text icon elements at indices:`, elementsToRemove);
    for (const index of elementsToRemove) {
      const removed = slideData.elements.splice(index, 1);
      console.log(`   Removed element: ${removed[0]?.id} (type: ${removed[0]?.type})`);
    }
    
    // Add image elements
    console.log(`➕ Adding ${elementsToAdd.length} image icon elements`);
    slideData.elements.push(...elementsToAdd);
    
    // Verify: count remaining text icon elements
    const remainingTextIcons = slideData.elements.filter(e => 
      e.id.startsWith('icon-symbol-') || e.id === 'demo-icon-symbol'
    );
    if (remainingTextIcons.length > 0) {
      console.warn(`⚠️ WARNING: ${remainingTextIcons.length} text icon elements still remain:`, remainingTextIcons.map(e => e.id));
    }
    
    // Verify: count image icon elements
    const imageIcons = slideData.elements.filter(e => 
      e.id.startsWith('icon-image-') || e.id === 'demo-icon-image'
    );
    console.log(`✅ Conversion complete: ${imageIcons.length} image icons, ${remainingTextIcons.length} text icons remaining`);
    
    return slideData;
  }
</script>

<div class="iconography-slide" style="background: {backgroundStyle};">
  <div class="radial-overlay" style="background: {radialOverlayStyle};"></div>
  
  <div class="slide">
    <div class="header" style="border-bottom: {headerBorderStyle};">
      <div class="title" style="color: {titleColorStyle};">Iconography</div>
    </div>
    
    <div class="content">
      <div class="icon-grid">
        {#if isEditable}
          <input type="text" bind:value={gridTitle} class="grid-title-input" style="color: {gridTitleColorStyle};" />
        {:else}
          <div class="grid-title" style="color: {gridTitleColorStyle};">{gridTitle}</div>
        {/if}
        <div class="icons">
          {#each displayIcons as icon, index}
            <div class="icon-item">
              <div class="icon-circle" style="background: {iconCircleGradient};">
                <DynamicIcon name={icon.name} size={32} color="#FFFFFF" strokeWidth={2} />
              </div>
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
          {#if isEditable}
            <input type="text" bind:value={guideline1Title} class="card-title-input" style="color: {cardTitleColorStyle};" />
            <textarea bind:value={guideline1Content} class="card-content-input"></textarea>
          {:else}
            <div class="card-title" style="color: {cardTitleColorStyle};">{guideline1Title}</div>
            <div class="card-content">{guideline1Content}</div>
          {/if}
          <div class="style-demo">
            <div class="demo-icon" style="background: {demoIconBgStyle};">
              <DynamicIcon 
                name={displayIcons.length > 0 ? displayIcons[0].name : 'Brand'} 
                size={24} 
                color="#FFFFFF" 
                strokeWidth={2} 
              />
            </div>
          </div>
        </div>
        
        <div class="guideline-card">
          {#if isEditable}
            <input type="text" bind:value={guideline2Title} class="card-title-input" style="color: {cardTitleColorStyle};" />
            <textarea bind:value={guideline2Content} class="card-content-input"></textarea>
          {:else}
            <div class="card-title" style="color: {cardTitleColorStyle};">{guideline2Title}</div>
            <div class="card-content">{guideline2Content}</div>
          {/if}
        </div>
        
        <div class="guideline-card">
          {#if isEditable}
            <input type="text" bind:value={guideline3Title} class="card-title-input" style="color: {cardTitleColorStyle};" />
            <textarea bind:value={guideline3Content} class="card-content-input"></textarea>
          {:else}
            <div class="card-title" style="color: {cardTitleColorStyle};">{guideline3Title}</div>
            <div class="card-content">{guideline3Content}</div>
          {/if}
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
  }
  
  .icon-circle :global(svg) {
    width: 32px;
    height: 32px;
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
  }
  
  .demo-icon :global(svg) {
    width: 24px;
    height: 24px;
  }
  
  .grid-title-input {
    width: 100%;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 8px;
    background: white;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 25px;
  }
  
  .card-title-input {
    width: 100%;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 8px;
    background: white;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
  }
  
  .card-content-input {
    width: 100%;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 8px;
    background: white;
    font-size: 14px;
    color: #666;
    resize: vertical;
    min-height: 50px;
  }
</style>

