<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let positioningStatement: string = 'Our brand positioning statement';
  export let primaryColor: string = '#1E40AF';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color3Lighter: string = '#BFDBFE';
  export let color1Rgba10: string = 'rgba(30, 64, 175, 0.1)';
  export let color2Rgba10: string = 'rgba(59, 130, 246, 0.1)';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'brand-introduction',
      type: 'content',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color1Lighter.replace('#', ''),
              color2Lighter.replace('#', ''),
              color3Lighter.replace('#', ''),
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
          text: 'Brand Introduction',
          fontSize: 36,
          fontFace: 'Arial',
          bold: true,
          color: primaryColor.replace('#', ''),
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Divider line
        {
          id: 'divider',
          type: 'shape' as const,
          position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
          shapeType: 'rect',
          fillColor: primaryColor.replace('#', ''),
          zIndex: 2
        },
        // Positioning statement
        {
          id: 'positioning-statement',
          type: 'text' as const,
          position: { x: 1.25, y: 2.5, w: 7.5, h: 2.0 },
          text: positioningStatement,
          fontSize: 20,
          fontFace: 'Arial',
          color: '333333',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        },
        // Background card shape
        {
          id: 'card-bg',
          type: 'shape' as const,
          position: { x: 1.25, y: 2.5, w: 7.5, h: 2.0 },
          shapeType: 'rect',
          fillColor: 'FFFFFF',
          lineColor: 'FFFFFF',
          lineWidth: 0,
          zIndex: 1
        }
      ]
    };
  }
  
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div
  class="brand-intro-slide"
  style={`background: linear-gradient(135deg, ${color1Lighter} 0%, ${color2Lighter} 30%, ${color3Lighter} 60%, #FFFFFF 100%); --primary-color: ${primaryColor}; --color1-rgba10: ${color1Rgba10}; --color2-rgba10: ${color2Rgba10};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Brand Introduction</div>
    </div>
    
    <div class="content">
      <div class="positioning-statement">
        {#if isEditable}
          <textarea
            bind:value={positioningStatement}
            class="editable-text"
            placeholder="Positioning Statement"
          ></textarea>
        {:else}
          {positioningStatement}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .brand-intro-slide {
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
      radial-gradient(circle at 20% 50%, var(--color1-rgba10) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, var(--color2-rgba10) 0%, transparent 50%);
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
    margin-bottom: 15px;
  }
  
  .content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 100px);
  }
  
  .positioning-statement {
    font-size: 24px;
    line-height: 1.6;
    color: #333;
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    max-width: 800px;
    border-left: 6px solid var(--primary-color);
  }
  
  .editable-text {
    width: 100%;
    min-height: 200px;
    font-size: 24px;
    line-height: 1.6;
    color: #333;
    text-align: center;
    background: transparent;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 20px;
    resize: vertical;
    font-family: 'Arial', sans-serif;
  }
</style>



