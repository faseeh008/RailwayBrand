<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 30346 02058 70 1';
  export let header: string = 'Creating Uniformity in Every Space';
  export let description: string = 'Unspoken principles create harmony in interior brand experiences, ensuring spaces, from cozy living rooms to busy offices, reflect a cohesive aesthetic aligned with the brand\'s core values.';
  export let thankYouText: string = 'THANK YOU';
  export let imageSrc: string = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-thank-you',
      type: 'thank-you',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: '000000'
        }
      },
      elements: [
        {
          id: 'header',
          type: 'text',
          position: { x: 0.8, y: 0.8, w: 4.5, h: 0.5 },
          text: header,
          fontSize: 20,
          fontFace: bodyFont,
          bold: true,
          color: 'FFFFFF',
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 0.8, y: 1.4, w: 4.5, h: 1.0 },
          text: description,
          fontSize: 15,
          fontFace: bodyFont,
          color: 'FFFFFF',
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'thank-you',
          type: 'text',
          position: { x: 0.8, y: 2.8, w: 4.5, h: 1.5 },
          text: thankYouText,
          fontSize: 84,
          fontFace: bodyFont,
          bold: true,
          color: 'FFFFFF',
          align: 'left',
          valign: 'top',
          zIndex: 2
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<MaximalistSlideShell {studioName} {propertyName} {barcodeNumber} {theme} backgroundColorOverride="#000000" footerBackgroundOverride="#000000" footerTextColorOverride="#FFFFFF">
  <div class="thank-you-layout">
    <div class="text-section">
      {#if isEditable}
        <input type="text" bind:value={header} class="header-input" />
      {:else}
        <h2 class="header">{header}</h2>
      {/if}
      
      {#if isEditable}
        <textarea bind:value={description} class="description-input"></textarea>
      {:else}
        <p class="description">{description}</p>
      {/if}
      
      {#if isEditable}
        <input type="text" bind:value={thankYouText} class="thank-you-input" />
      {:else}
        <h1 class="thank-you">{thankYouText}</h1>
      {/if}
    </div>
    
    <div class="image-section">
      <img src={imageSrc} alt="Interior" />
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .thank-you-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    height: 100%;
    align-items: center;
  }

  .text-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .header,
  .header-input {
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.3;
    margin: 0;
  }

  .header-input {
    width: 100%;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.3);
    color: #FFFFFF;
  }

  .description,
  .description-input {
    font-size: 15px;
    line-height: 1.7;
    color: #FFFFFF;
    margin: 0;
  }

  .description-input {
    width: 100%;
    min-height: 100px;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    color: #FFFFFF;
    resize: vertical;
  }

  .thank-you,
  .thank-you-input {
    font-size: 84px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.1;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .thank-you-input {
    width: 100%;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    color: #FFFFFF;
  }

  .image-section {
    height: 100%;
    border-radius: 4px;
    overflow: hidden;
  }

  .image-section img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

