<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandName: string = 'Brand Name';
  export let logoUrl: string = '';
  export let logoData: string = '';
  export let primaryColor: string = '#1E40AF';
  export let color2Lighter: string = '#DBEAFE';
  export let color3Lighter: string = '#BFDBFE';
  export let color4Lighter: string = '#93C5FD';
  export let color5Lighter: string = '#60A5FA';
  export let color2Rgba12: string = 'rgba(59, 130, 246, 0.12)';
  export let color4Rgba12: string = 'rgba(147, 197, 253, 0.12)';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    const elements: SlideData['elements'] = [
      // Title
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'Logo Don\'ts',
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
    
    // Add logo examples with strike-through if available
    if (logoData || logoUrl) {
      for (let i = 0; i < 4; i++) {
        elements.push({
          id: `logo-dont-${i}`,
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
      id: 'logo-donts',
      type: 'logo',
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
              color4Lighter.replace('#', ''),
              color5Lighter.replace('#', ''),
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
  class="logo-donts-slide"
  style={`background: linear-gradient(135deg, ${color2Lighter} 0%, ${color3Lighter} 15%, #FFFFFF 45%, ${color4Lighter} 65%, ${color5Lighter} 85%, #FFFFFF 100%); --color2-rgba12: ${color2Rgba12}; --color4-rgba12: ${color4Rgba12}; --primary-color: ${primaryColor};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Logo Don'ts</div>
    </div>
    
    <div class="content">
      <div class="examples">
        <div class="example-card">
          <div class="card-header">
            <div class="badge-dont">DON'T</div>
            <div class="card-title">Do Not Stretch or Distort</div>
          </div>
          <div class="logo-demo" style="transform: scaleX(1.25);">
            <div class="strike"></div>
            {#if logoData}
              <img src={`data:image/png;base64,${logoData}`} alt={`${brandName} Logo`} />
            {:else if logoUrl}
              <img src={logoUrl} alt={`${brandName} Logo`} />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Always maintain original proportions; avoid non-uniform scaling.</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-dont">DON'T</div>
            <div class="card-title">Do Not Change Colors</div>
          </div>
          <div class="logo-demo" style="background: linear-gradient(135deg, #A855F7 0%, #F97316 100%);">
            <div class="strike"></div>
            {#if logoData}
              <img src={`data:image/png;base64,${logoData}`} alt={`${brandName} Logo`} />
            {:else if logoUrl}
              <img src={logoUrl} alt={`${brandName} Logo`} />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Never use unapproved colors outside the brand palette.</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-dont">DON'T</div>
            <div class="card-title">Do Not Add Effects</div>
          </div>
          <div class="logo-demo" style="filter: drop-shadow(6px 6px 0 #000) blur(1px);">
            <div class="strike"></div>
            {#if logoData}
              <img src={`data:image/png;base64,${logoData}`} alt={`${brandName} Logo`} />
            {:else if logoUrl}
              <img src={logoUrl} alt={`${brandName} Logo`} />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Avoid shadows, glows, outlines, or other decorative effects.</div>
        </div>
        
        <div class="example-card">
          <div class="card-header">
            <div class="badge-dont">DON'T</div>
            <div class="card-title">Do Not Place on Busy Backgrounds</div>
          </div>
          <div class="logo-demo" style="background: repeating-linear-gradient(45deg, #222, #222 10px, #555 10px, #555 20px);">
            <div class="strike"></div>
            {#if logoData}
              <img src={`data:image/png;base64,${logoData}`} alt={`${brandName} Logo`} />
            {:else if logoUrl}
              <img src={logoUrl} alt={`${brandName} Logo`} />
            {:else}
              <div class="logo-placeholder">{brandName}</div>
            {/if}
          </div>
          <div class="hint">Avoid low-contrast or cluttered backgrounds that reduce legibility.</div>
        </div>
      </div>
      
      <div class="guidelines">
        <div class="guidelines-title">Usage Restrictions</div>
        <div class="guideline-item">Do not stretch, rotate, skew, or alter proportions.</div>
        <div class="guideline-item">Do not modify colors beyond approved brand palette.</div>
        <div class="guideline-item">Do not add outlines, shadows, or visual effects.</div>
        <div class="guideline-item">Do not place over complex imagery or low-contrast backgrounds.</div>
      </div>
    </div>
  </div>
</div>

<style>
  .logo-donts-slide {
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
      radial-gradient(ellipse at top left, var(--color2-rgba12) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, var(--color4-rgba12) 0%, transparent 55%);
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
  
  .badge-dont {
    background: #FEE2E2;
    color: #991B1B;
    border: 2px solid #EF4444;
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
  
  .strike {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 50%;
    height: 4px;
    background: #EF4444;
    transform: rotate(-8deg);
    box-shadow: 0 0 0 2px rgba(255,255,255,0.5) inset;
    z-index: 3;
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
    color: var(--primary-color);
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
    content: '✗';
    position: absolute;
    left: 0;
    color: #EF4444;
    font-weight: bold;
  }
</style>



