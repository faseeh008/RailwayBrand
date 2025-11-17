<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  
  // Contact information props
  export let contactName: string = '';
  export let contactEmail: string = 'contact@example.com';
  export let contactRole: string = '';
  export let contactCompany: string = '';
  export let website: string = 'your-website.com';
  export let phone: string = '';
  
  // Legacy support - map email to contactEmail if not provided
  $: email = contactEmail || 'contact@example.com';
  export let color1Hex: string = '#1E40AF'; // PRIMARY_COLOR
  export let color2Hex: string = '#3B82F6'; // COLOR_2_HEX
  export let color3Hex: string = '#60A5FA'; // COLOR_3_HEX
  export let color4Hex: string = '#93C5FD'; // SECONDARY_COLOR / COLOR_4_HEX
  export let isEditable: boolean = false;
  
  // Editable background
  export let background: {
    type: 'color' | 'gradient';
    color?: string;
    gradient?: {
      colors: string[];
      direction: number;
    };
  } = {
    type: 'gradient',
    gradient: {
      colors: [color4Hex, color3Hex, color4Hex, color1Hex, color2Hex],
      direction: 135
    }
  };
  
  // Background style
  // HTML template: linear-gradient(135deg, {{SECONDARY_COLOR}} 0%, {{COLOR_3_HEX}} 25%, {{COLOR_4_HEX}} 50%, {{PRIMARY_COLOR}} 75%, {{COLOR_2_HEX}} 100%)
  $: backgroundStyle = (() => {
    if (background && background.type === 'color' && background.color) {
      return background.color;
    } else if (background && background.type === 'gradient' && background.gradient && background.gradient.colors && background.gradient.colors.length > 0) {
      const colors = background.gradient.colors;
      const stops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(', ');
      return `linear-gradient(${background.gradient.direction || 135}deg, ${stops})`;
    } else {
      // Fallback to default gradient matching HTML template
      return `linear-gradient(135deg, ${color4Hex} 0%, ${color3Hex} 25%, ${color4Hex} 50%, ${color1Hex} 75%, ${color2Hex} 100%)`;
    }
  })();
  
  // Editable content
  export let thankYouText: string = 'Thank You';
  export let subtitleText: string = 'Let\'s Create Something Amazing Together';
  
  $: slideData = createSlideData();
  
  // Helper function to build contact text
  function buildContactText(): string {
    const parts: string[] = [];
    
    // Build contact info line by line
    if (contactName || contactRole || contactCompany) {
      const nameParts: string[] = [];
      if (contactName) nameParts.push(contactName);
      if (contactRole) nameParts.push(contactRole);
      if (contactCompany) nameParts.push(contactCompany);
      if (nameParts.length > 0) parts.push(nameParts.join(', '));
    }
    
    if (contactEmail) parts.push(contactEmail);
    if (website && website !== 'your-website.com' && !website.includes('www.yourbrand.com')) parts.push(website);
    if (phone) parts.push(phone);
    
    return parts.length > 0 ? parts.join('\n') : contactEmail || 'Contact information';
  }
  
  function createSlideData(): SlideData {
    // Use the current background prop (which may have been edited)
    let bgColors: string[] = [];
    let bgDirection = 135;
    
    if (background && background.type === 'gradient' && background.gradient && background.gradient.colors) {
      bgColors = background.gradient.colors
        .filter(c => c != null && typeof c === 'string')
        .map(c => (c || '').replace('#', ''))
        .filter(c => c.length > 0);
      bgDirection = background.gradient.direction || 135;
    } else if (background && background.type === 'color' && background.color) {
      const color = (background.color || '').replace('#', '');
      if (color) bgColors = [color];
    }
    
    // Fallback to default if no valid colors found
    if (bgColors.length === 0) {
      const fallbackColors = [
        color4Hex,
        color3Hex,
        color4Hex,
        color1Hex,
        color2Hex
      ].filter(c => c != null && typeof c === 'string');
      
      bgColors = fallbackColors.length > 0
        ? fallbackColors.map(c => (c || '').replace('#', ''))
        : ['000000', '333333', '000000', '666666', '999999'];
    }
    
    return {
      id: 'thank-you',
      type: 'closing',
      layout: {
        width: 10,
        height: 5.625,
        background: bgColors.length === 1 ? {
          type: 'color',
          color: bgColors[0]
        } : {
          type: 'gradient',
          gradient: {
            colors: bgColors,
            direction: bgDirection
          }
        }
      },
      elements: [
        // Thank You text
        {
          id: 'thank-you',
          type: 'text' as const,
          position: { x: 0.5, y: 2.5, w: 9, h: 1.0 },
          text: thankYouText,
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
          text: subtitleText,
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
          text: buildContactText(),
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
  
  // Always call createSlideData() to get the latest values (including edited content)
  export function getSlideData(): SlideData {
    return createSlideData();
  }
</script>

<div class="thank-you-slide" style="background: {backgroundStyle};">
  <div class="radial-overlay"></div>
  
  <div class="slide">
    {#if isEditable}
      <input type="text" bind:value={thankYouText} class="thank-you-input" />
    {:else}
      <div class="thank-you">{thankYouText}</div>
    {/if}
    {#if isEditable}
      <input type="text" bind:value={subtitleText} class="subtitle-input" />
    {:else}
      <div class="subtitle">{subtitleText}</div>
    {/if}
    <div class="contact">
      {#if isEditable}
        {#if contactName || contactRole || contactCompany}
          <input type="text" bind:value={contactName} placeholder="Contact Name" class="contact-input" />
          <input type="text" bind:value={contactRole} placeholder="Role" class="contact-input" />
          <input type="text" bind:value={contactCompany} placeholder="Company" class="contact-input" />
        {/if}
        <input type="text" bind:value={contactEmail} placeholder="Email" class="contact-input" />
        <input type="text" bind:value={website} placeholder="Website" class="contact-input" />
        {#if phone}
          <input type="text" bind:value={phone} placeholder="Phone" class="contact-input" />
        {/if}
      {:else}
        {@html buildContactText().split('\n').map(line => `<div>${line}</div>`).join('')}
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
  
  .thank-you-input,
  .subtitle-input {
    background: rgba(0,0,0,0.2);
    border: 2px dashed rgba(255,255,255,0.5);
    border-radius: 4px;
    padding: 10px 20px;
    text-align: center;
    color: #FFFFFF;
    font-family: 'Arial', sans-serif;
  }
  
  .thank-you-input {
    font-size: 64px;
    font-weight: bold;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 600px;
  }
  
  .subtitle-input {
    font-size: 24px;
    font-style: italic;
    margin-bottom: 40px;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 800px;
  }
</style>

