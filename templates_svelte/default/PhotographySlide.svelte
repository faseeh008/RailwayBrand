<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color6Lighter: string = '#3B82F6';
  export let color7Lighter: string = '#1E40AF';
  export let color8Lighter: string = '#2563EB';
  export let color6Rgba10: string = 'rgba(59, 130, 246, 0.1)';
  export let color7Rgba10: string = 'rgba(30, 64, 175, 0.1)';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'photography',
      type: 'photography',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color6Lighter.replace('#', ''),
              color7Lighter.replace('#', ''),
              'FFFFFF',
              color8Lighter.replace('#', ''),
              color6Lighter.replace('#', '')
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
          text: 'Photography Style',
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
      ]
    };
  }
  
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div class="photography-slide" style="background: linear-gradient(135deg, {color6Lighter} 0%, {color7Lighter} 25%, #FFFFFF 50%, {color8Lighter} 75%, {color6Lighter} 100%);">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Photography Style</div>
    </div>
    
    <div class="content">
      <div class="photo-examples">
        <div class="photo-box">
          <div class="photo-placeholder">📷</div>
          <div class="photo-label">Authentic Moments</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder">🌟</div>
          <div class="photo-label">Natural Lighting</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder">🎨</div>
          <div class="photo-label">Vibrant Colors</div>
        </div>
        <div class="photo-box">
          <div class="photo-placeholder">👥</div>
          <div class="photo-label">People-Focused</div>
        </div>
      </div>
      
      <div class="guidelines">
        <div class="guideline-box">
          <div class="box-title">Style Guidelines</div>
          <ul class="guideline-list">
            <li>Natural, authentic moments</li>
            <li>Bright, well-lit environments</li>
            <li>Warm, inviting tones</li>
            <li>Diverse, inclusive representation</li>
            <li>Professional yet approachable</li>
          </ul>
        </div>
        
        <div class="guideline-box">
          <div class="box-title">Do's & Don'ts</div>
          <div class="do-dont">
            <div class="do-box">
              <div class="do-title">✓ DO</div>
              <div class="rule-text">Use natural lighting & authentic scenes</div>
            </div>
            <div class="dont-box">
              <div class="dont-title">✗ DON'T</div>
              <div class="rule-text">Avoid staged poses & heavy filters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .photography-slide {
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
      radial-gradient(ellipse at top right, {color6Rgba10} 0%, transparent 60%),
      radial-gradient(ellipse at bottom left, {color7Rgba10} 0%, transparent 60%);
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
    grid-template-columns: 1.5fr 1fr;
    gap: 40px;
    height: calc(100% - 100px);
  }
  
  .photo-examples {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .photo-box {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .photo-placeholder {
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, {primaryColor} 0%, {secondaryColor} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 32px;
  }
  
  .photo-label {
    padding: 15px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
  
  .guidelines {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .guideline-box {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .box-title {
    font-size: 18px;
    font-weight: bold;
    color: {primaryColor};
    margin-bottom: 15px;
  }
  
  .guideline-list {
    list-style: none;
  }
  
  .guideline-list li {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
    padding-left: 25px;
    position: relative;
    margin-bottom: 10px;
  }
  
  .guideline-list li::before {
    content: '●';
    position: absolute;
    left: 0;
    color: {primaryColor};
    font-size: 18px;
  }
  
  .do-dont {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .do-box, .dont-box {
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .do-box {
    background: #D1FAE5;
    border: 2px solid #10B981;
  }
  
  .dont-box {
    background: #FEE2E2;
    border: 2px solid #EF4444;
  }
  
  .do-title {
    font-size: 16px;
    font-weight: bold;
    color: #10B981;
    margin-bottom: 8px;
  }
  
  .dont-title {
    font-size: 16px;
    font-weight: bold;
    color: #EF4444;
    margin-bottom: 8px;
  }
  
  .rule-text {
    font-size: 12px;
    color: #666;
  }
</style>



