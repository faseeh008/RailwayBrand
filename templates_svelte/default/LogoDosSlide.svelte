<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandName: string = 'Brand Name';
  export let logoUrl: string = '';
  export let logoData: string = '';
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color3Lighter: string = '#BFDBFE';
  export let color4Lighter: string = '#93C5FD';
  export let color1Rgba10: string = 'rgba(30, 64, 175, 0.1)';
  export let color3Rgba10: string = 'rgba(96, 165, 250, 0.1)';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    const elements: SlideData['elements'] = [
      // Title
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'Logo Do\'s',
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
    
    // Add logo examples if available
    if (logoData || logoUrl) {
      for (let i = 0; i < 4; i++) {
        elements.push({
          id: `logo-do-${i}`,
          type: 'image' as const,
          position: { 
            x: 0.47 + (i % 2) * 4.5, 
            y: 1.11 + Math.floor(i / 2) * 2.0, 
            w: 2.0, 
            h: 0.97 
          },
          imageData: logoData || undefined,
          imageSrc: logoUrl || undefined,
          zIndex: 2
        });
      }
    }
    
    return {
      id: 'logo-dos',
      type: 'logo',
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

<div class="logo-dos-slide" style="background: linear-gradient(135deg, {color1Lighter} 0%, {color2Lighter} 20%, #FFFFFF 50%, {color3Lighter} 70%, {color4Lighter} 90%, #FFFFFF 100%);">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Logo Do's</div>
    </div>
    
    <div class="content">
      <div class="examples">
        <div class="example-card">
          <div class="card-header">
            <div class="badge-do">DO</div>
            <div class="card-title">Use Approved Colors</div>
          </div>
          <div class="logo-demo">
            {#if logoData}
              <img src="data:image/png;base64,{logoData}" alt="{brandName} Logo" />
            {:else if logoUrl}
              <img src={logoUrl} alt="{brandName} Logo" />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Apply only {primaryColor} and {secondaryColor} per brand palette.</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-do">DO</div>
            <div class="card-title">Maintain Clear Space</div>
          </div>
          <div class="logo-demo" style="position: relative;">
            <div class="clear-space-indicator"></div>
            {#if logoData}
              <img src="data:image/png;base64,{logoData}" alt="{brandName} Logo" />
            {:else if logoUrl}
              <img src={logoUrl} alt="{brandName} Logo" />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Keep minimum clear space around logo (≥ 10% of logo width).</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-do">DO</div>
            <div class="card-title">Respect Minimum Size</div>
          </div>
          <div class="logo-demo" style="height: 100px;">
            {#if logoData}
              <img src="data:image/png;base64,{logoData}" alt="{brandName} Logo" />
            {:else if logoUrl}
              <img src={logoUrl} alt="{brandName} Logo" />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Never display the logo smaller than the specified minimum height.</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-do">DO</div>
            <div class="card-title">Ensure Contrast</div>
          </div>
          <div class="logo-demo" style="background: linear-gradient(135deg, #111 0%, {primaryColor} 100%);">
            {#if logoData}
              <img src="data:image/png;base64,{logoData}" alt="{brandName} Logo" />
            {:else if logoUrl}
              <img src={logoUrl} alt="{brandName} Logo" />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Use sufficient contrast with backgrounds to maintain readability.</div>
        </div>
      </div>
      
      <div class="guidelines">
        <div class="guidelines-title">Usage Guidelines</div>
        <div class="guideline-item">Use only approved color combinations and backgrounds.</div>
        <div class="guideline-item">Maintain clear space around the logo on all sides.</div>
        <div class="guideline-item">Scale proportionally; adhere to minimum size constraints.</div>
        <div class="guideline-item">Place on clean, uncluttered backgrounds with strong contrast.</div>
      </div>
    </div>
  </div>
</div>

<style>
  .logo-dos-slide {
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
      radial-gradient(circle at 25% 25%, {color1Rgba10} 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, {color3Rgba10} 0%, transparent 50%);
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
    border-bottom: 4px solid {primaryColor};
    padding-bottom: 15px;
    margin-bottom: 30px;
  }
  
  .title {
    font-size: 42px;
    font-weight: bold;
    color: {primaryColor};
  }
  
  .content {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 32px;
    height: calc(100% - 100px);
  }
  
  .examples {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .example-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .badge-do {
    background: #D1FAE5;
    color: #065F46;
    border: 2px solid #10B981;
    font-weight: bold;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  
  .card-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }
  
  .logo-demo {
    height: 140px;
    border-radius: 10px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    position: relative;
    border: 1px solid #e5e7eb;
  }
  
  .logo-demo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .logo-placeholder {
    font-size: 24px;
    font-weight: bold;
    color: #666;
  }
  
  .clear-space-indicator {
    position: absolute;
    inset: 8px;
    border: 3px dashed rgba(0,0,0,0.3);
    border-radius: 8px;
    pointer-events: none;
  }
  
  .hint {
    font-size: 12px;
    color: #666;
    line-height: 1.5;
  }
  
  .guidelines {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .guidelines-title {
    font-size: 18px;
    font-weight: bold;
    color: {primaryColor};
    margin-bottom: 12px;
  }
  
  .guideline-item {
    font-size: 14px;
    color: #555;
    line-height: 1.7;
    padding-left: 26px;
    position: relative;
    margin-bottom: 10px;
  }
  
  .guideline-item::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #10B981;
    font-weight: bold;
  }
</style>



