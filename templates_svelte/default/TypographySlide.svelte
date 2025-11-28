<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let primaryFont: string = 'Arial';
  export let secondaryFont: string = 'Arial';
  export let primaryWeights: string = 'Regular, Bold';
  export let secondaryWeights: string = 'Regular, Medium';
  export let primaryColor: string = '#1E40AF';
  export let color4Lighter: string = '#93C5FD';
  export let color5Lighter: string = '#60A5FA';
  export let color6Lighter: string = '#3B82F6';
  export let color4Rgba8: string = 'rgba(147, 197, 253, 0.08)';
  export let color5Rgba8: string = 'rgba(96, 165, 250, 0.08)';
  export let color6Rgba8: string = 'rgba(59, 130, 246, 0.08)';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'typography',
      type: 'typography',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color4Lighter.replace('#', ''),
              color5Lighter.replace('#', ''),
              'FFFFFF',
              color6Lighter.replace('#', ''),
              'FFFFFF'
            ],
            direction: 135
          }
        }
      },
      elements: [
        // Title
        {
          id: 'title',
          type: 'text' as const,
          position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
          text: 'TYPEFACE',
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
          fillColor: '8B4513',
          zIndex: 2
        },
        // Primary font card background
        {
          id: 'primary-card-bg',
          type: 'shape' as const,
          position: { x: 0.47, y: 1.11, w: 4.38, h: 1.39 },
          shapeType: 'rect',
          fillColor: 'F8F8F8',
          lineColor: 'E0E0E0',
          lineWidth: 1,
          zIndex: 1
        },
        // Primary font label
        {
          id: 'primary-label',
          type: 'text' as const,
          position: { x: 0.57, y: 1.21, w: 4.18, h: 0.14 },
          text: 'PRIMARY FONT',
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '666666',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Primary font name
        {
          id: 'primary-name',
          type: 'text' as const,
          position: { x: 0.57, y: 1.35, w: 4.18, h: 0.39 },
          text: primaryFont,
          fontSize: 24,
          fontFace: primaryFont,
          bold: true,
          color: '2563EB',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Secondary font card background
        {
          id: 'secondary-card-bg',
          type: 'shape' as const,
          position: { x: 5.15, y: 1.11, w: 4.38, h: 1.39 },
          shapeType: 'rect',
          fillColor: 'F8F8F8',
          lineColor: 'E0E0E0',
          lineWidth: 1,
          zIndex: 1
        },
        // Secondary font label
        {
          id: 'secondary-label',
          type: 'text' as const,
          position: { x: 5.25, y: 1.21, w: 4.18, h: 0.14 },
          text: 'SECONDARY FONT',
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '666666',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Secondary font name
        {
          id: 'secondary-name',
          type: 'text' as const,
          position: { x: 5.25, y: 1.35, w: 4.18, h: 0.39 },
          text: secondaryFont,
          fontSize: 24,
          fontFace: secondaryFont,
          bold: true,
          color: '2563EB',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Hierarchy card background
        {
          id: 'hierarchy-card-bg',
          type: 'shape' as const,
          position: { x: 0.47, y: 2.7, w: 9.06, h: 1.39 },
          shapeType: 'rect',
          fillColor: 'F8F8F8',
          lineColor: 'E0E0E0',
          lineWidth: 1,
          zIndex: 1
        },
        // Hierarchy title
        {
          id: 'hierarchy-title',
          type: 'text' as const,
          position: { x: 0.57, y: 2.8, w: 8.86, h: 0.14 },
          text: 'TYPOGRAPHY HIERARCHY',
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '666666',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        }
      ]
    };
  }
  
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div
  class="typography-slide"
  style={`background: linear-gradient(135deg, ${color4Lighter} 0%, ${color5Lighter} 25%, #FFFFFF 50%, ${color6Lighter} 75%, #FFFFFF 100%); --primary-color: ${primaryColor}; --color4-rgba8: ${color4Rgba8}; --color5-rgba8: ${color5Rgba8}; --color6-rgba8: ${color6Rgba8};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="title">TYPEFACE</div>
    <div class="divider"></div>
    
    <div class="font-row">
      <div class="font-card">
        <div class="font-label">PRIMARY FONT</div>
        {#if isEditable}
          <input type="text" bind:value={primaryFont} class="font-name-input" />
        {:else}
          <div
            class="font-name"
            style={`font-family: '${primaryFont}', Arial, sans-serif;`}
          >
            {primaryFont}
          </div>
        {/if}
        <div class="font-sample" style={`font-family: '${primaryFont}', Arial, sans-serif;`}>
          Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br>
          0123456789
        </div>
        <div class="font-weights">
          {#each primaryWeights.split(', ') as weight}
            <span>{weight}</span>
          {/each}
        </div>
      </div>
      
      <div class="font-card">
        <div class="font-label">SECONDARY FONT</div>
        {#if isEditable}
          <input type="text" bind:value={secondaryFont} class="font-name-input" />
        {:else}
          <div
            class="font-name"
            style={`font-family: '${secondaryFont}', Arial, sans-serif;`}
          >
            {secondaryFont}
          </div>
        {/if}
        <div class="font-sample" style={`font-family: '${secondaryFont}', Arial, sans-serif;`}>
          Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br>
          0123456789
        </div>
        <div class="font-weights">
          {#each secondaryWeights.split(', ') as weight}
            <span>{weight}</span>
          {/each}
        </div>
      </div>
    </div>
    
    <div class="hierarchy-card">
      <div class="hierarchy-title">TYPOGRAPHY HIERARCHY</div>
      <div class="hierarchy-item">H1: 32pt - Main titles</div>
      <div class="hierarchy-item">H2: 24pt - Section headers</div>
      <div class="hierarchy-item">H3: 20pt - Subsection headers</div>
      <div class="hierarchy-item">Body: 16pt - Main content</div>
    </div>
  </div>
</div>

<style>
  .typography-slide {
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
      linear-gradient(90deg, transparent 0%, var(--color4-rgba8) 20%, transparent 40%, var(--color5-rgba8) 60%, transparent 80%, var(--color6-rgba8) 100%);
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
    color: var(--primary-color);
    margin-bottom: 15px;
  }
  
  .divider {
    width: 100%;
    height: 3px;
    background: #8B4513;
    margin-bottom: 25px;
  }
  
  .font-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .font-card {
    flex: 1;
    background: #F8F8F8;
    padding: 25px;
    border-radius: 8px;
    border: 1px solid #E0E0E0;
  }
  
  .font-label {
    font-size: 14px;
    color: #666;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .font-name,
  .font-name-input {
    font-size: 32px;
    font-weight: bold;
    color: #2C2C2C;
    margin-bottom: 5px;
  }
  
  .font-name-input {
    width: 100%;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 8px;
    background: white;
  }
  
  .font-sample {
    font-size: 16px;
    color: #2C2C2C;
    line-height: 1.4;
    margin-bottom: 10px;
  }
  
  .font-weights {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  
  .font-weights span {
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #2C2C2C;
  }
  
  .hierarchy-card {
    background: #F8F8F8;
    padding: 25px;
    border-radius: 8px;
    border: 1px solid #E0E0E0;
  }
  
  .hierarchy-title {
    font-size: 14px;
    color: #666;
    font-weight: bold;
    margin-bottom: 15px;
  }
  
  .hierarchy-item {
    margin-bottom: 10px;
    font-size: 13px;
    color: #2C2C2C;
  }
</style>



