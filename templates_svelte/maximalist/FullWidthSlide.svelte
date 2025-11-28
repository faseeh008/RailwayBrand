<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 30046 62528 78 1';
  export let title: string = 'Creativity Within a Defined Vision';
  export let description: string = 'Design is naturally creative, but creativity needs direction to serve the brand\'s identity. Brand guidelines allow designers to explore new ideas while staying within the brand\'s aesthetic framework. This balance between creative freedom and clear direction ensures that new designs always feel fresh while still reflecting the brand\'s core values and design language.';
  export let imageSrc: string = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-full-width',
      type: 'content',
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
          position: { x: 0.8, y: 0.8, w: 4.5, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 32,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 5.8, y: 0.8, w: 3.5, h: 1.5 },
          text: description,
          fontSize: 15,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
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
  <div class="full-width-layout">
    <div class="top-section">
      <div class="title-section">
        {#if isEditable}
          <input type="text" bind:value={title} class="title-input" />
        {:else}
          <h1 class="title">{title.toUpperCase()}</h1>
        {/if}
      </div>
      
      <div class="description-section">
        {#if isEditable}
          <textarea bind:value={description} class="description-input"></textarea>
        {:else}
          <p class="description">{description}</p>
        {/if}
      </div>
    </div>
    
    <div class="image-section">
      <img src={imageSrc} alt="Interior" />
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .full-width-layout {
    display: flex;
    flex-direction: column;
    gap: 30px;
    height: 100%;
  }

  .top-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
  }

  .title,
  .title-input {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.2;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
  }

  .description,
  .description-input {
    font-size: 15px;
    line-height: 1.7;
    color: var(--body-color);
    margin: 0;
  }

  .description-input {
    width: 100%;
    min-height: 120px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    resize: vertical;
  }

  .image-section {
    flex: 1;
    border-radius: 4px;
    overflow: hidden;
    min-height: 280px;
  }

  .image-section img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

