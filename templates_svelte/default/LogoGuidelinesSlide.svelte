<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandName: string = 'Brand Name';
  export let logoUrl: string = '';
  export let logoData: string = '';
  export let primaryColor: string = '#1E40AF';
  export let color3Lighter: string = '#BFDBFE';
  export let color4Lighter: string = '#93C5FD';
  export let color3Rgba12: string = 'rgba(96, 165, 250, 0.12)';
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
        text: 'Logo Guidelines',
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
    
    // Logo section
    if (logoData || logoUrl) {
      elements.push({
        id: 'logo',
        type: 'image' as const,
        position: { x: 0.47, y: 1.11, w: 3.5, h: 2.5 },
        imageData: logoData || undefined,
        imageSrc: logoUrl || undefined,
        zIndex: 2
      });
    }
    
    // Guidelines text
    const guidelines = [
      'Never scale the logo below 32px in height to maintain legibility.',
      'Maintain clear space equal to 10% of the logo\'s width on all sides.',
      'Use on white or light backgrounds for optimal visibility and impact.',
      'Never rotate, distort, or change the logo colors or proportions.'
    ];
    
    guidelines.forEach((guideline, index) => {
      elements.push({
        id: `guideline-${index}`,
        type: 'text' as const,
        position: { x: 4.17, y: 1.11 + (index * 0.4), w: 5.36, h: 0.35 },
        text: guideline,
        fontSize: 12,
        fontFace: 'Arial',
        color: '666666',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      });
    });
    
    return {
      id: 'logo-guidelines',
      type: 'logo',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color3Lighter.replace('#', ''),
              color4Lighter.replace('#', ''),
              'FFFFFF',
              color3Lighter.replace('#', '')
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

<div class="logo-guidelines-slide" style="background: linear-gradient(135deg, {color3Lighter} 0%, {color4Lighter} 25%, #FFFFFF 50%, {color3Lighter} 75%, #FFFFFF 100%);">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Logo Guidelines</div>
    </div>
    
    <div class="content">
      <div class="logo-section">
        <div class="section-title">Primary Logo</div>
        <div class="logo-placeholder">
          {#if logoData}
            <img src="data:image/png;base64,{logoData}" alt="{brandName} Logo" class="logo-image" />
          {:else if logoUrl}
            <img src={logoUrl} alt="{brandName} Logo" class="logo-image" />
          {:else}
            <div class="logo-text">{brandName}</div>
          {/if}
        </div>
        <div class="spacing-guide">
          <div class="spacing-box">
            <div class="spacing-demo">
              <span style="font-size: 10px;">MIN</span>
            </div>
            <div class="spacing-label">Minimum Size<br>32px</div>
          </div>
          <div class="spacing-box">
            <div class="spacing-demo">
              <span style="font-size: 14px;">CLEAR</span>
            </div>
            <div class="spacing-label">Clear Space<br>10% padding</div>
          </div>
        </div>
      </div>
      
      <div class="guidelines-box">
        <div class="section-title">Usage Guidelines</div>
        
        <div class="guideline-item">
          <div class="guideline-title">Minimum Size</div>
          <div class="guideline-desc">Never scale the logo below 32px in height to maintain legibility.</div>
        </div>
        
        <div class="guideline-item">
          <div class="guideline-title">Clear Space</div>
          <div class="guideline-desc">Maintain clear space equal to 10% of the logo's width on all sides.</div>
        </div>
        
        <div class="guideline-item">
          <div class="guideline-title">Background Usage</div>
          <div class="guideline-desc">Use on white or light backgrounds for optimal visibility and impact.</div>
        </div>
        
        <div class="guideline-item">
          <div class="guideline-title">Do Not Modify</div>
          <div class="guideline-desc">Never rotate, distort, or change the logo colors or proportions.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .logo-guidelines-slide {
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
      radial-gradient(ellipse at top left, {color3Rgba12} 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, {color4Rgba12} 0%, transparent 50%);
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
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    height: calc(100% - 100px);
  }
  
  .logo-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: bold;
    color: {primaryColor};
    margin-bottom: 15px;
  }
  
  .logo-placeholder {
    width: 200px;
    height: 200px;
    background: #f8f9fa;
    border: 2px dashed #ddd;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
  }
  
  .logo-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .logo-text {
    font-size: 36px;
    font-weight: bold;
    color: #666;
  }
  
  .spacing-guide {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 20px;
  }
  
  .spacing-box {
    text-align: center;
  }
  
  .spacing-demo {
    width: 80px;
    height: 80px;
    border: 3px dashed {primaryColor};
    border-radius: 8px;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .spacing-label {
    font-size: 12px;
    color: #666;
    font-weight: bold;
  }
  
  .guidelines-box {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .guideline-item {
    margin-bottom: 20px;
    padding-left: 25px;
    position: relative;
  }
  
  .guideline-item::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: {primaryColor};
    font-weight: bold;
    font-size: 18px;
  }
  
  .guideline-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  
  .guideline-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
</style>



