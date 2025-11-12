<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let colors: Array<{
    name: string;
    hex: string;
    usage?: string;
  }> = [];
  export let primaryColor: string = '#1E40AF';
  export let color1Hex: string = '#1E40AF';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color3Lighter: string = '#BFDBFE';
  export let color4Lighter: string = '#93C5FD';
  export let color1Rgba15: string = 'rgba(30, 64, 175, 0.15)';
  export let color2Rgba15: string = 'rgba(59, 130, 246, 0.15)';
  export let color3Rgba10: string = 'rgba(96, 165, 250, 0.1)';
  export let isEditable: boolean = false;
  
  // Ensure we have at least 8 colors
  $: displayColors = colors.length >= 8 ? colors.slice(0, 8) : [
    ...colors,
    ...Array(8 - colors.length).fill(null).map((_, i) => ({
      name: `Color ${colors.length + i + 1}`,
      hex: '#CCCCCC',
      usage: 'Brand color'
    }))
  ];
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    const elements: SlideData['elements'] = [
      // Title
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'COLORS PALETTE',
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
        fillColor: color1Hex.replace('#', ''),
        zIndex: 2
      }
    ];
    
    // Add color swatches in 4x2 grid
    const startX = 0.47;
    const startY = 1.11;
    const swatchWidth = 2.1;
    const swatchHeight = 1.04;
    const gap = 0.16;
    
    displayColors.forEach((color, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = startX + col * (swatchWidth + gap);
      const y = startY + row * (swatchHeight + gap);
      
      // Color swatch rectangle
      elements.push({
        id: `color-swatch-${index}`,
        type: 'color-swatch' as const,
        position: { x, y, w: swatchWidth, h: swatchHeight },
        colorSwatch: {
          hex: color.hex,
          name: color.name,
          usage: color.usage || 'Brand color'
        },
        zIndex: 2
      });
    });
    
    return {
      id: 'color-palette',
      type: 'color',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color1Lighter.replace('#', ''),
              color2Lighter.replace('#', ''),
              'FFFFFF',
              color3Lighter.replace('#', ''),
              color4Lighter.replace('#', ''),
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

<div class="color-palette-slide" style="background: linear-gradient(135deg, {color1Lighter} 0%, {color2Lighter} 20%, #FFFFFF 40%, {color3Lighter} 60%, {color4Lighter} 80%, #FFFFFF 100%);">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="title">COLORS PALETTE</div>
    <div class="divider"></div>
    
    <div class="color-grid">
      {#each displayColors as color, index}
        <div class="color-item">
          <div class="color-swatch" style="background-color: {color.hex};"></div>
          {#if isEditable}
            <input type="text" bind:value={color.name} class="color-name-input" />
            <input type="text" bind:value={color.hex} class="color-hex-input" />
            <input type="text" bind:value={color.usage} class="color-usage-input" />
          {:else}
            <div class="color-name">{color.name}</div>
            <div class="color-hex">{color.hex}</div>
            <div class="color-usage">{color.usage || 'Brand color'}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .color-palette-slide {
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
      radial-gradient(circle at 15% 30%, {color1Rgba15} 0%, transparent 45%),
      radial-gradient(circle at 85% 70%, {color2Rgba15} 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, {color3Rgba10} 0%, transparent 60%);
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
  
  .title {
    font-size: 42px;
    font-weight: bold;
    color: {primaryColor};
    margin-bottom: 15px;
  }
  
  .divider {
    width: 100%;
    height: 3px;
    background: {color1Hex};
    margin-bottom: 30px;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
    max-width: 100%;
  }
  
  .color-item {
    text-align: center;
  }
  
  .color-swatch {
    width: 100%;
    height: 150px;
    border-radius: 8px;
    border: 3px solid white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin-bottom: 15px;
  }
  
  .color-name,
  .color-name-input {
    font-size: 16px;
    font-weight: bold;
    color: #2C2C2C;
    margin-bottom: 5px;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .color-name-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
  
  .color-hex,
  .color-hex-input {
    font-size: 14px;
    color: #666;
    margin-bottom: 3px;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .color-hex-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
  
  .color-usage,
  .color-usage-input {
    font-size: 12px;
    color: #999;
    font-style: italic;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .color-usage-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
</style>



