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
  
  // Default icons if none provided
  $: displayIcons = icons.length > 0 ? icons.slice(0, 8) : [
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
    const elements: SlideData['elements'] = [
      // Title
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'Iconography',
        fontSize: 36,
        fontFace: 'Arial',
        bold: true,
        color: primaryColor.replace('#', ''),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      // Divider
      {
        id: 'divider',
        type: 'shape' as const,
        position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
        shapeType: 'rect',
        fillColor: primaryColor.replace('#', ''),
        zIndex: 2
      }
    ];
    
    // Add icon circles and labels in 4x2 grid
    const startX = 0.47;
    const startY = 1.11;
    const iconSize = 0.42; // inches
    const gap = 0.16;
    
    displayIcons.forEach((icon, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = startX + col * (iconSize + gap);
      const y = startY + row * (iconSize + 0.28);
      
      // Icon circle background
      elements.push({
        id: `icon-circle-${index}`,
        type: 'shape' as const,
        position: { x, y, w: iconSize, h: iconSize },
        shapeType: 'circle',
        fillColor: primaryColor.replace('#', ''),
        zIndex: 2
      });
      
      // Icon symbol text
      elements.push({
        id: `icon-symbol-${index}`,
        type: 'text' as const,
        position: { x, y, w: iconSize, h: iconSize },
        text: icon.symbol,
        fontSize: 24,
        fontFace: 'Arial',
        bold: true,
        color: 'FFFFFF',
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 3
      });
      
      // Icon label
      elements.push({
        id: `icon-label-${index}`,
        type: 'text' as const,
        position: { x, y: y + iconSize + 0.07, w: iconSize, h: 0.14 },
        text: icon.name,
        fontSize: 10,
        fontFace: 'Arial',
        color: '666666',
        align: 'center' as const,
        valign: 'top' as const,
        zIndex: 2
      });
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

<div
  class="iconography-slide"
  style={`background: linear-gradient(135deg, ${color5Lighter} 0%, ${color6Lighter} 30%, #FFFFFF 50%, ${color7Lighter} 70%, #FFFFFF 100%); --color5-rgba12: ${color5Rgba12}; --color6-rgba12: ${color6Rgba12}; --primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Iconography</div>
    </div>
    
    <div class="content">
      <div class="icon-grid">
        <div class="grid-title">Icon Library</div>
        <div class="icons">
          {#each displayIcons as icon, index}
            <div class="icon-item">
              <div class="icon-circle">{icon.symbol}</div>
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
          <div class="card-title">Icon Style</div>
          <div class="card-content">
            Use rounded, friendly icons that match our brand personality.
          </div>
          <div class="style-demo">
            <div class="demo-icon">◐</div>
          </div>
        </div>
        
        <div class="guideline-card">
          <div class="card-title">Size & Weight</div>
          <div class="card-content">
            Icons should be 24px–48px. Use 2px stroke weight for consistency.
          </div>
        </div>
        
        <div class="guideline-card">
          <div class="card-title">Colors</div>
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
    background: 
      radial-gradient(circle at 30% 40%, var(--color5-rgba12) 0%, transparent 50%),
      radial-gradient(circle at 70% 60%, var(--color6-rgba12) 0%, transparent 50%);
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
    border-bottom: 4px solid var(--primary-color);
    padding-bottom: 15px;
    margin-bottom: 30px;
  }
  
  .title {
    font-size: 42px;
    font-weight: bold;
    color: var(--primary-color);
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
    color: var(--primary-color);
    margin-bottom: 25px;
  }
  
  .icons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 25px;
  }
  
  .icon-item {
    text-align: center;
  }
  
  .icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
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
    color: var(--primary-color);
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
    background: var(--primary-color);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
  }
</style>



