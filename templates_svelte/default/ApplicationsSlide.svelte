<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let applications: Array<{ icon: string; name: string; description: string }> = [];
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color7Lighter: string = '#1E40AF';
  export let color8Lighter: string = '#2563EB';
  export let color1Lighter: string = '#EFF6FF';
  export let color2Lighter: string = '#DBEAFE';
  export let color7Rgba12: string = 'rgba(30, 64, 175, 0.12)';
  export let color8Rgba12: string = 'rgba(37, 99, 235, 0.12)';
  export let color1Rgba5: string = 'rgba(30, 64, 175, 0.05)';
  export let isEditable: boolean = false;
  
  // Default applications if none provided
  $: displayApplications = applications.length > 0 ? applications.slice(0, 6) : [
    { icon: '📄', name: 'Business Cards', description: 'Professional cards with logo, brand colors, and typography' },
    { icon: '🌐', name: 'Website', description: 'Digital presence with consistent brand identity' },
    { icon: '📱', name: 'Social Media', description: 'Posts, stories, and profile graphics' },
    { icon: '📧', name: 'Email Templates', description: 'Branded email signatures and campaigns' },
    { icon: '📊', name: 'Presentations', description: 'Pitch decks and slide templates' },
    { icon: '📦', name: 'Packaging', description: 'Product packaging and labels' }
  ];
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'applications',
      type: 'applications',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              color7Lighter.replace('#', ''),
              color8Lighter.replace('#', ''),
              'FFFFFF',
              color1Lighter.replace('#', ''),
              color2Lighter.replace('#', ''),
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
          text: 'Brand Applications',
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
        },
        // Footer note
        {
          id: 'footer-title',
          type: 'text' as const,
          position: { x: 0.47, y: 4.5, w: 9.06, h: 0.25 },
          text: 'Consistency is Key',
          fontSize: 16,
          fontFace: 'Arial',
          bold: true,
          color: primaryColor.replace('#', ''),
          align: 'center' as const,
          valign: 'top' as const,
          zIndex: 2
        },
        {
          id: 'footer-text',
          type: 'text' as const,
          position: { x: 0.47, y: 4.75, w: 9.06, h: 0.4 },
          text: 'Apply these brand guidelines consistently across all touchpoints to build recognition and trust',
          fontSize: 12,
          fontFace: 'Arial',
          color: '666666',
          align: 'center' as const,
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
  class="applications-slide"
  style={`background: linear-gradient(135deg, ${color7Lighter} 0%, ${color8Lighter} 20%, #FFFFFF 40%, ${color1Lighter} 60%, ${color2Lighter} 80%, #FFFFFF 100%); --color7-rgba12: ${color7Rgba12}; --color8-rgba12: ${color8Rgba12}; --color1-rgba5: ${color1Rgba5}; --primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};`}
>
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="header">
      <div class="title">Brand Applications</div>
    </div>
    
    <div class="content">
      <div class="applications-grid">
        {#each displayApplications as app, index}
          <div class="app-card">
            <div class="app-icon">{app.icon}</div>
            {#if isEditable}
              <input type="text" bind:value={app.name} class="app-title-input" />
              <textarea bind:value={app.description} class="app-desc-input"></textarea>
            {:else}
              <div class="app-title">{app.name}</div>
              <div class="app-desc">{app.description}</div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="footer-note">
        <div class="note-title">Consistency is Key</div>
        <div class="note-text">Apply these brand guidelines consistently across all touchpoints to build recognition and trust</div>
      </div>
    </div>
  </div>
</div>

<style>
  .applications-slide {
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
      radial-gradient(circle at 20% 30%, var(--color7-rgba12) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, var(--color8-rgba12) 0%, transparent 50%),
      linear-gradient(45deg, transparent 0%, var(--color1-rgba5) 50%, transparent 100%);
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
    height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  
  .applications-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    flex: 1;
  }
  
  .app-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.3s;
  }
  
  .app-icon {
    width: 100px;
    height: 100px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 48px;
    margin-bottom: 15px;
  }
  
  .app-title,
  .app-title-input {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
  }
  
  .app-title-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
  }
  
  .app-desc,
  .app-desc-input {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    resize: vertical;
  }
  
  .app-desc-input {
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 4px;
    padding: 4px;
    min-height: 40px;
  }
  
  .footer-note {
    background: white;
    border-radius: 12px;
    padding: 20px 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    text-align: center;
  }
  
  .note-title {
    font-size: 16px;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 8px;
  }
  
  .note-text {
    font-size: 14px;
    color: #666;
  }
</style>



