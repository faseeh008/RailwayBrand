<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandName: string = 'Brand Name';
  export let tagline: string = 'Brand Guidelines';
  export let date: string = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  export let primaryColor: string = '#1E40AF';
  export let color2: string = '#3B82F6';
  export let color3: string = '#60A5FA';
  export let secondaryColor: string = '#93C5FD';
export let logoData: string | undefined = undefined; // base64 image data
  export let isEditable: boolean = false;
  
  // Editable state
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'cover-slide',
      type: 'cover',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              primaryColor.replace('#', ''),
              color2.replace('#', ''),
              color3.replace('#', ''),
              secondaryColor.replace('#', '')
            ],
            direction: 135
          }
        }
      },
      elements: [
        // Brand name
        {
          id: 'brand-name',
          type: 'text' as const,
          position: { x: 0.5, y: 2.0, w: 9, h: 1.5 },
          text: brandName.toUpperCase(),
          fontSize: 64,
          fontFace: 'Arial',
          bold: true,
          color: 'FFFFFF',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        },
        // Tagline
        {
          id: 'tagline',
          type: 'text' as const,
          position: { x: 0.5, y: 3.6, w: 9, h: 0.6 },
          text: tagline,
          fontSize: 32,
          fontFace: 'Arial',
          color: 'FFFFFF',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        },
        // Date
        {
          id: 'date',
          type: 'text' as const,
          position: { x: 0.5, y: 4.6, w: 9, h: 0.4 },
          text: date,
          fontSize: 16,
          fontFace: 'Arial',
          color: 'FFFFFF',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        }
      ]
    };
  }
  
  // Export function to get slide data for PPTX conversion
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div
  class="cover-slide"
  style={`background: linear-gradient(135deg, ${primaryColor} 0%, ${color2} 30%, ${color3} 60%, ${secondaryColor} 100%);`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide-content">
    <div class="brand-name">{brandName}</div>
    <div class="subtitle">{tagline}</div>
    <div class="date">{date}</div>
  </div>
</div>

<style>
  .cover-slide {
    width: 1280px;
    height: 720px;
    position: relative;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
  }
  
  .radial-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
  }
  
  .slide-content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px 80px;
    box-sizing: border-box;
  }
  
  .brand-name {
    font-size: 72px;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 25px;
    text-transform: uppercase;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
    text-align: center;
    width: 100%;
    line-height: 1.1;
    letter-spacing: 3px;
    flex-shrink: 0;
  }
  
  .subtitle {
    font-size: 32px;
    color: #FFFFFF;
    margin-bottom: 40px;
    text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
    text-align: center;
    width: 100%;
    font-weight: 300;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  
  .date {
    font-size: 18px;
    color: rgba(255,255,255,0.95);
    margin-top: auto;
    padding-top: 40px;
    text-align: center;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
    font-weight: 300;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
</style>



