<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let applications: Array<{ icon: string; name: string; description: string }> = [];
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color7Lighter: string = '#1E40AF';
  export let color8Lighter: string = '#2563EB';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color7Rgba12: string = 'rgba(30, 64, 175, 0.12)';
  export let color8Rgba12: string = 'rgba(37, 99, 235, 0.12)';
  export let color1Rgba5: string = 'rgba(30, 64, 175, 0.05)';
  export let isEditable: boolean = false;
  
  // Dynamic styles computed from props
  $: headerBorderStyle = `4px solid ${primaryColor}`;
  $: titleColorStyle = primaryColor;
  $: appIconGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  $: noteTitleColorStyle = primaryColor;
  $: radialOverlayStyle = `radial-gradient(circle at 20% 30%, ${color7Rgba12 || 'rgba(30, 64, 175, 0.12)'} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${color8Rgba12 || 'rgba(37, 99, 235, 0.12)'} 0%, transparent 50%), linear-gradient(45deg, transparent 0%, ${color1Rgba5 || 'rgba(30, 64, 175, 0.05)'} 50%, transparent 100%)`;
  
  // Default applications if none provided
  $: displayApplications = applications.length > 0 ? applications.slice(0, 6) : [
    { icon: '📄', name: 'Business Cards', description: 'Professional cards with logo, brand colors, and typography' },
    { icon: '🌐', name: 'Website', description: 'Digital presence with consistent brand identity' },
    { icon: '📱', name: 'Social Media', description: 'Posts, stories, and profile graphics' },
    { icon: '📧', name: 'Email Templates', description: 'Branded email signatures and campaigns' },
    { icon: '📊', name: 'Presentations', description: 'Pitch decks and slide templates' },
    { icon: '📦', name: 'Packaging', description: 'Product packaging and labels' }
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
      text: 'Brand Applications',
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
    const contentWidth = 10 - (paddingX * 2);
    const contentHeight = 5.625 - contentStartY - paddingY;
    
    // Applications grid: 3 columns
    const appGridGap = pxToIn(25); // 25px gap between cards
    const appCardWidth = (contentWidth - (appGridGap * 2)) / 3;
    const appGridHeight = contentHeight - pyToIn(100); // Leave space for footer
    const appCardHeight = (appGridHeight - appGridGap) / 2; // 2 rows
    const appsStartY = contentStartY;
    
    displayApplications.forEach((app, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const appCardX = paddingX + col * (appCardWidth + appGridGap);
      const appCardY = appsStartY + row * (appCardHeight + appGridGap);
      
      // Card background (white card)
      elements.push({
        id: `app-card-${index}`,
        type: 'shape' as const,
        position: { x: appCardX, y: appCardY, w: appCardWidth, h: appCardHeight },
        shapeType: 'rect',
        fillColor: 'FFFFFF',
        lineColor: 'E0E0E0',
        lineWidth: 1,
        zIndex: 1
      });
      
      // Card padding
      const cardPadding = pxToIn(25);
      
      // Icon (100px × 100px, centered horizontally)
      const iconSizePx = 100;
      const iconSize = pxToIn(iconSizePx);
      const iconX = appCardX + (appCardWidth - iconSize) / 2;
      const iconY = appCardY + cardPadding;
      
      // Icon background (rounded square, not circle - CSS uses border-radius: 12px)
      elements.push({
        id: `app-icon-bg-${index}`,
        type: 'shape' as const,
        position: { x: iconX, y: iconY, w: iconSize, h: iconSize },
        shapeType: 'rect',
        fillColor: primaryColor.replace('#', ''),
        zIndex: 2
      });
      
      // Icon text (emoji/character)
      elements.push({
        id: `app-icon-text-${index}`,
        type: 'text' as const,
        position: { x: iconX, y: iconY, w: iconSize, h: iconSize },
        text: app.icon || '📄',
        fontSize: 32,
        fontFace: 'Arial',
        color: 'FFFFFF',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 3
      });
      
      // App name (below icon)
      const appNameY = iconY + iconSize + pyToIn(15);
      elements.push({
        id: `app-name-${index}`,
        type: 'text' as const,
        position: { x: appCardX + cardPadding, y: appNameY, w: appCardWidth - (cardPadding * 2), h: pyToIn(18) },
        text: app.name || 'Application',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: '333333',
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
      
      // App description (below name)
      const appDescY = appNameY + pyToIn(23);
      const appDescHeight = appCardY + appCardHeight - appDescY - cardPadding;
      elements.push({
        id: `app-desc-${index}`,
        type: 'text' as const,
        position: { x: appCardX + cardPadding, y: appDescY, w: appCardWidth - (cardPadding * 2), h: appDescHeight },
        text: app.description || 'Description',
        fontSize: 12,
        fontFace: 'Arial',
        color: '666666',
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    });
    
    // Footer note (at bottom)
    const footerY = appsStartY + (appCardHeight * 2) + appGridGap + pyToIn(30);
    const footerHeight = 5.625 - footerY - paddingY;
    
    if (footerHeight > pyToIn(50)) {
      // Footer background (white card)
      elements.push({
        id: 'footer-bg',
        type: 'shape' as const,
        position: { x: paddingX, y: footerY, w: contentWidth, h: footerHeight },
        shapeType: 'rect',
        fillColor: 'FFFFFF',
        lineColor: 'E0E0E0',
        lineWidth: 1,
        zIndex: 1
      });
      
      // Footer title
      elements.push({
        id: 'footer-title',
        type: 'text' as const,
        position: { x: paddingX, y: footerY + pyToIn(20), w: contentWidth, h: pyToIn(16) },
        text: 'Consistency is Key',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: primaryColor.replace('#', ''),
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
      
      // Footer text
      elements.push({
        id: 'footer-text',
        type: 'text' as const,
        position: { x: paddingX, y: footerY + pyToIn(40), w: contentWidth, h: pyToIn(40) },
        text: 'Apply these brand guidelines consistently across all touchpoints to build recognition and trust',
        fontSize: 12,
        fontFace: 'Arial',
        color: '666666',
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    }
    
    return {
      id: 'applications',
      type: 'applications',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color7Lighter.replace('#', ''),
              color8Lighter.replace('#', ''),
              'FFFFFF',
              color1Lighter.replace('#', ''),
              color2Lighter.replace('#', ''),
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

<div class="applications-slide" style="background: linear-gradient(135deg, {color7Lighter} 0%, {color8Lighter} 20%, #FFFFFF 40%, {color1Lighter} 60%, {color2Lighter} 80%, #FFFFFF 100%);">
  <div class="radial-overlay" style="background: {radialOverlayStyle};"></div>
  
  <div class="slide">
    <div class="header" style="border-bottom: {headerBorderStyle};">
      <div class="title" style="color: {titleColorStyle};">Brand Applications</div>
    </div>
    
    <div class="content">
      <div class="applications-grid">
        {#each displayApplications as app, index}
          <div class="app-card">
            <div class="app-icon" style="background: {appIconGradient};">{app.icon}</div>
            {#if isEditable}
              <input type="text" bind:value={app.name} class="app-title-input" />
              <textarea bind:value={app.description} class="app-desc-input"></textarea>
            {:else}
              <div class="app-title">{app.name}</div>
              <div class="app-desc">{app.description}</div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="footer-note">
        <div class="note-title" style="color: {noteTitleColorStyle};">Consistency is Key</div>
        <div class="note-text">Apply these brand guidelines consistently across all touchpoints to build recognition and trust</div>
      </div>
    </div>
  </div>
</div>

<style>
  .applications-slide {
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
    height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  
  .applications-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    flex: 1;
  }
  
  .app-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.3s;
  }
  
  .app-icon {
    width: 100px;
    height: 100px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .app-title,
  .app-title-input {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .app-title-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
  
  .app-desc,
  .app-desc-input {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    resize: vertical;
  }
  
  .app-desc-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
    min-height: 40px;
  }
  
  .footer-note {
    background: white;
    border-radius: 12px;
    padding: 20px 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    text-align: center;
  }
  
  .note-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .note-text {
    font-size: 14px;
    color: #666;
  }
</style>

