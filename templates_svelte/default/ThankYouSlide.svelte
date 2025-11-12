<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  export let website: string = 'your-website.com';
  export let email: string = 'contact@example.com';
  export let phone: string = '';
  export let primaryColor: string = '#1E40AF';
  export let secondaryColor: string = '#93C5FD';
  export let color2Hex: string = '#3B82F6';
  export let color3Hex: string = '#60A5FA';
  export let color4Hex: string = '#93C5FD';
  export let isEditable: boolean = false;
  
  $: slideData = createSlideData();
  
  function createSlideData(): SlideData {
    return {
      id: 'thank-you',
      type: 'closing',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [
              secondaryColor.replace('#', ''),
              color3Hex.replace('#', ''),
              color4Hex.replace('#', ''),
              primaryColor.replace('#', ''),
              color2Hex.replace('#', '')
            ],
            direction: 135
          }
        }
      },
      elements: [
        // Thank You text
        {
          id: 'thank-you',
          type: 'text' as const,
          position: { x: 0.5, y: 2.5, w: 9, h: 1.0 },
          text: 'Thank You',
          fontSize: 64,
          fontFace: 'Arial',
          bold: true,
          color: 'FFFFFF',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        },
        // Subtitle
        {
          id: 'subtitle',
          type: 'text' as const,
          position: { x: 0.5, y: 3.6, w: 9, h: 0.5 },
          text: 'Let\'s Create Something Amazing Together',
          fontSize: 20,
          fontFace: 'Arial',
          italic: true,
          color: 'FFFFFF',
          align: 'center' as const,
          valign: 'middle' as const,
          zIndex: 2
        },
        // Contact info
        {
          id: 'contact',
          type: 'text' as const,
          position: { x: 0.5, y: 4.3, w: 9, h: 0.6 },
          text: `${website}\n${email}${phone ? '\n' + phone : ''}`,
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
  
  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div class="thank-you-slide" style="background: linear-gradient(135deg, {secondaryColor} 0%, {color3Hex} 25%, {color4Hex} 50%, {primaryColor} 75%, {color2Hex} 100%);">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    <div class="thank-you">Thank You</div>
    <div class="subtitle">Let's Create Something Amazing Together</div>
    <div class="contact">
      {#if isEditable}
        <input type="text" bind:value={website} class="contact-input" />
        <input type="text" bind:value={email} class="contact-input" />
        {#if phone}
          <input type="text" bind:value={phone} class="contact-input" />
        {/if}
      {:else}
        {website}<br>
        {email}
        {#if phone}
          <br>{phone}
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .thank-you-slide {
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
      radial-gradient(circle at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 60%),
      radial-gradient(circle at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
    z-index: 1;
  }
  
  .slide {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px;
  }
  
  .thank-you {
    font-size: 64px;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .subtitle {
    font-size: 24px;
    color: #FFFFFF;
    font-style: italic;
    margin-bottom: 40px;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
  }
  
  .contact {
    font-size: 20px;
    color: rgba(255,255,255,0.95);
  }
  
  .contact-input {
    display: block;
    width: 100%;
    max-width: 400px;
    margin: 8px auto;
    font-size: 20px;
    color: rgba(255,255,255,0.95);
    background: rgba(0,0,0,0.2);
    border: 2px dashed rgba(255,255,255,0.5);
    border-radius: 4px;
    padding: 8px;
    text-align: center;
  }
</style>



