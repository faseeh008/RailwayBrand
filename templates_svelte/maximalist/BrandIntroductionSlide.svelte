<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'BRAND INTRODUCTION';
  export let barcodeNumber: string = '0 38400 12038 70 1';
  export let brandName: string = 'Maison Aurelia';
  export let tagline: string = 'Expressive Interiors for Modern Living';
  export let positioningStatement: string =
    'Maison Aurelia blends bold art direction with refined craftsmanship to create spaces that feel collected, lived-in, and unmistakably human.';
  export let heroImage: string = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-brand-introduction',
      type: 'brand-introduction',
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
          id: 'brand-name',
          type: 'text',
          position: { x: 0.8, y: 0.9, w: 4.5, h: 0.5 },
          text: brandName.toUpperCase(),
          fontSize: 36,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'tagline',
          type: 'text',
          position: { x: 0.8, y: 1.4, w: 4.5, h: 0.4 },
          text: tagline,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'statement',
          type: 'text',
          position: { x: 0.8, y: 1.9, w: 4.5, h: 2.5 },
          text: positioningStatement,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'image',
          type: 'image',
          position: { x: 5.5, y: 0.8, w: 3.7, h: 4.0 },
          imageSrc: heroImage
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<MaximalistSlideShell {studioName} {propertyName} {barcodeNumber} {theme}>
  <div class="intro-layout">
    <div class="copy">
      <p class="eyebrow">Brand Introduction</p>
      {#if isEditable}
        <input type="text" bind:value={brandName} class="brand-input" />
      {:else}
        <h1>{brandName}</h1>
      {/if}
      {#if isEditable}
        <input type="text" bind:value={tagline} class="tagline-input" />
      {:else}
        <p class="tagline">{tagline}</p>
      {/if}
      {#if isEditable}
        <textarea bind:value={positioningStatement}></textarea>
      {:else}
        <p class="statement">{positioningStatement}</p>
      {/if}
    </div>
    <div class="image-frame">
      <img src={heroImage} alt="Brand Introduction" />
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .intro-layout {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 50px;
    height: 100%;
    align-items: center;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.3em;
    font-size: 12px;
    margin: 0;
    color: rgba(0, 0, 0, 0.6);
  }

  h1,
  .brand-input {
    font-size: 48px;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .brand-input,
  .tagline-input {
    border: 1px solid rgba(0, 0, 0, 0.2);
    padding: 10px;
    font-family: 'Inter', sans-serif;
  }

  .tagline {
    font-size: 20px;
    margin: 0;
  }

  .statement,
  textarea {
    font-size: 16px;
    line-height: 1.7;
    color: var(--body-color);
  }

  textarea {
    min-height: 180px;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    font-family: 'Inter', sans-serif;
  }

  .image-frame {
    border: 10px solid var(--text-color);
    padding: 12px;
    height: 100%;
  }

  .image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>


