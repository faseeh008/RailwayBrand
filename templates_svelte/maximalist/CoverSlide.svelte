<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 38040 02038 70 1';
  export let title: string = 'Creating Uniformity in Every Space';
  export let subtitle: string = 'Unspoken principles create harmony in interior brand experiences, ensuring spaces, from cozy living rooms to busy offices, reflect a cohesive aesthetic aligned with the brand\'s core values.';
  export let mainHeading: string = 'BRAND GUIDELINES';
  export let heroImage: string = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-cover',
      type: 'cover',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: theme.backgroundColor.replace('#', '')
        }
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 0.8, y: 1.0, w: 4.5, h: 0.6 },
          text: title,
          fontSize: 32,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'subtitle',
          type: 'text',
          position: { x: 0.8, y: 1.7, w: 4.5, h: 1.2 },
          text: subtitle,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'main-heading',
          type: 'text',
          position: { x: 0.8, y: 3.2, w: 5.0, h: 1.5 },
          text: mainHeading,
          fontSize: 72,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
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

<MaximalistSlideShell {studioName} {propertyName} {barcodeNumber} {theme}>
  <div class="cover-layout">
    <div class="text-section">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h1 class="title">{title}</h1>
      {/if}
      
      {#if isEditable}
        <textarea bind:value={subtitle} class="subtitle-input"></textarea>
      {:else}
        <p class="subtitle">{subtitle}</p>
      {/if}
      
      {#if isEditable}
        <input type="text" bind:value={mainHeading} class="heading-input" />
      {:else}
        <h2 class="main-heading">{mainHeading}</h2>
      {/if}
    </div>
    
    <div class="image-section">
      <img src={heroImage} alt="Interior" />
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .cover-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    height: 100%;
    align-items: center;
  }

  .text-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title,
  .title-input {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.2;
    margin: 0;
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
  }

  .subtitle,
  .subtitle-input {
    font-size: 16px;
    line-height: 1.6;
    color: var(--body-color);
    margin: 0;
  }

  .subtitle-input {
    width: 100%;
    min-height: 100px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    resize: vertical;
  }

  .main-heading,
  .heading-input {
    font-size: 72px;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.1;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }

  .heading-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
  }

  .image-section {
    height: 100%;
    overflow: hidden;
    border-radius: 4px;
  }

  .image-section img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

