<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let mission: string = 'Our mission statement';
  export let vision: string = 'Our vision statement';
  export let values: string = 'Innovation • Excellence • Integrity';
  export let personality: string = 'Our brand personality';
  export let targetAudience: string = '';
  export let primaryColor: string = '#1E40AF';
  export let color1Hex: string = '#1E40AF';
  export let color2Hex: string = '#3B82F6';
  export let color3Hex: string = '#60A5FA';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color3Lighter: string = '#BFDBFE';
  export let color1Rgba15: string = 'rgba(30, 64, 175, 0.15)';
  export let color2Rgba15: string = 'rgba(59, 130, 246, 0.15)';
  export let color3Rgba15: string = 'rgba(96, 165, 250, 0.15)';
  export let color1Rgba5: string = 'rgba(30, 64, 175, 0.05)';
  export let isEditable: boolean = false;
  
  $: resolvedAudience = (targetAudience && targetAudience.trim()) || personality;
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'brand-positioning',
      type: 'content',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color2Lighter.replace('#', ''),
              color3Lighter.replace('#', ''),
              'FFFFFF',
              color1Lighter.replace('#', '')
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
          text: 'BRAND POSITIONING',
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
        },
        // Mission card
        {
          id: 'mission-card',
          type: 'shape' as const,
          position: { x: 0.47, y: 1.11, w: 3.65, h: 1.25 },
          shapeType: 'rect',
          fillColor: color1Lighter.replace('#', ''),
          lineColor: color1Hex.replace('#', ''),
          lineWidth: 2,
          zIndex: 1
        },
        {
          id: 'mission-title',
          type: 'text' as const,
          position: { x: 0.57, y: 1.21, w: 3.45, h: 0.25 },
          text: 'MISSION',
          fontSize: 16,
          fontFace: 'Arial',
          bold: true,
          color: color1Hex.replace('#', ''),
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        {
          id: 'mission-content',
          type: 'text' as const,
          position: { x: 0.57, y: 1.46, w: 3.45, h: 0.8 },
          text: mission,
          fontSize: 12,
          fontFace: 'Arial',
          color: '2C2C2C',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Vision card
        {
          id: 'vision-card',
          type: 'shape' as const,
          position: { x: 4.32, y: 1.11, w: 3.65, h: 1.25 },
          shapeType: 'rect',
          fillColor: color2Lighter.replace('#', ''),
          lineColor: color2Hex.replace('#', ''),
          lineWidth: 2,
          zIndex: 1
        },
        {
          id: 'vision-title',
          type: 'text' as const,
          position: { x: 4.42, y: 1.21, w: 3.45, h: 0.25 },
          text: 'VISION',
          fontSize: 16,
          fontFace: 'Arial',
          bold: true,
          color: color2Hex.replace('#', ''),
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        {
          id: 'vision-content',
          type: 'text' as const,
          position: { x: 4.42, y: 1.46, w: 3.45, h: 0.8 },
          text: vision,
          fontSize: 12,
          fontFace: 'Arial',
          color: '2C2C2C',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Values card
        {
          id: 'values-card',
          type: 'shape' as const,
          position: { x: 0.47, y: 2.56, w: 9.06, h: 1.25 },
          shapeType: 'rect',
          fillColor: color3Lighter.replace('#', ''),
          lineColor: color3Hex.replace('#', ''),
          lineWidth: 2,
          zIndex: 1
        },
        {
          id: 'values-title',
          type: 'text' as const,
          position: { x: 0.57, y: 2.66, w: 8.86, h: 0.25 },
          text: 'CORE VALUES',
          fontSize: 16,
          fontFace: 'Arial',
          bold: true,
          color: color3Hex.replace('#', ''),
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        {
          id: 'values-content',
          type: 'text' as const,
          position: { x: 0.57, y: 2.91, w: 8.86, h: 0.8 },
          text: values,
          fontSize: 12,
          fontFace: 'Arial',
          color: '2C2C2C',
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        // Target Audience card
        {
          id: 'audience-card',
          type: 'shape' as const,
          position: { x: 0.47, y: 4.01, w: 9.06, h: 1.25 },
          shapeType: 'rect',
          fillColor: color3Lighter.replace('#', ''),
          lineColor: color3Hex.replace('#', ''),
          lineWidth: 2,
          zIndex: 1
        },
        {
          id: 'audience-title',
          type: 'text' as const,
          position: { x: 0.57, y: 4.11, w: 8.86, h: 0.25 },
          text: 'TARGET AUDIENCE',
          fontSize: 16,
          fontFace: 'Arial',
          bold: true,
          color: color3Hex.replace('#', ''),
          align: 'left' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        {
          id: 'audience-content',
          type: 'text' as const,
          position: { x: 0.57, y: 4.36, w: 8.86, h: 0.8 },
          text: resolvedAudience,
          fontSize: 12,
          fontFace: 'Arial',
          color: '2C2C2C',
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
  class="brand-positioning-slide"
  style={`background: linear-gradient(135deg, ${color2Lighter} 0%, ${color3Lighter} 25%, #FFFFFF 50%, ${color1Lighter} 75%, #FFFFFF 100%); --primary-color: ${primaryColor}; --color1-hex: ${color1Hex}; --color2-hex: ${color2Hex}; --color3-hex: ${color3Hex}; --color1-lighter: ${color1Lighter}; --color2-lighter: ${color2Lighter}; --color3-lighter: ${color3Lighter}; --color2-rgba15: ${color2Rgba15}; --color3-rgba15: ${color3Rgba15}; --color1-rgba5: ${color1Rgba5};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="title">BRAND POSITIONING</div>
    <div class="divider"></div>
    
    <div class="cards-row">
      <div class="card mission">
        <div class="card-title">MISSION</div>
        <div class="card-content">
          {#if isEditable}
            <textarea bind:value={mission} class="editable-text"></textarea>
          {:else}
            {mission}
          {/if}
        </div>
      </div>
      
      <div class="card vision">
        <div class="card-title">VISION</div>
        <div class="card-content">
          {#if isEditable}
            <textarea bind:value={vision} class="editable-text"></textarea>
          {:else}
            {vision}
          {/if}
        </div>
      </div>
    </div>
    
    <div class="card values">
      <div class="card-title">CORE VALUES</div>
      <div class="card-content">
        {#if isEditable}
          <textarea bind:value={values} class="editable-text"></textarea>
        {:else}
          {values}
        {/if}
      </div>
    </div>
    
    <div class="card values" style="margin-top: 15px;">
      <div class="card-title">TARGET AUDIENCE</div>
      <div class="card-content">
        {#if isEditable}
          <textarea bind:value={targetAudience} class="editable-text"></textarea>
        {:else}
          {resolvedAudience}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .brand-positioning-slide {
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
      radial-gradient(circle at 10% 20%, var(--color2-rgba15) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, var(--color3-rgba15) 0%, transparent 40%),
      linear-gradient(45deg, transparent 30%, var(--color1-rgba5) 50%, transparent 70%);
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
    background: var(--color1-hex);
    margin-bottom: 25px;
  }
  
  .cards-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .card {
    flex: 1;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid;
  }
  
  .card.mission {
    background: var(--color1-lighter);
    border-color: var(--color1-hex);
  }
  
  .card.vision {
    background: var(--color2-lighter);
    border-color: var(--color2-hex);
  }
  
  .card.values {
    background: var(--color3-lighter);
    border-color: var(--color3-hex);
    width: 100%;
  }
  
  .card-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
  }
  
  .card.mission .card-title {
    color: var(--color1-hex);
  }
  
  .card.vision .card-title {
    color: var(--color2-hex);
  }
  
  .card.values .card-title {
    color: var(--color3-hex);
  }
  
  .card-content {
    font-size: 14px;
    line-height: 1.4;
    color: #2C2C2C;
  }
  
  .editable-text {
    width: 100%;
    min-height: 60px;
    font-size: 14px;
    line-height: 1.4;
    color: #2C2C2C;
    background: transparent;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 8px;
    resize: vertical;
    font-family: 'Arial', sans-serif;
  }
</style>



