<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 00040 62098 76 1';
  export let title: string = 'Capturing the Brand\'s Atmosphere';
  export let description: string = 'Every interior brand carries its own atmosphere – whether it\'s warm and inviting, sleek and modern, or bold and eclectic. Brand guidelines help define how that atmosphere is created and maintained. From the tone of voice in marketing materials to the selection of decor pieces, every detail contributes to building that recognizable brand feeling.';
  export let subDescription: string = 'These guidelines ensure that the atmosphere is preserved no matter the setting. They serve as a blueprint for consistency, guiding designers and marketers in making choices that align with the brand\'s identity.';
  export let images: string[] = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'
  ];
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-image-grid',
      type: 'photography',
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
          position: { x: 0.8, y: 0.8, w: 5.0, h: 0.5 },
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
          position: { x: 5.8, y: 0.8, w: 3.5, h: 1.8 },
          text: description,
          fontSize: 15,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'sub-description',
          type: 'text',
          position: { x: 5.8, y: 2.7, w: 3.5, h: 1.2 },
          text: subDescription,
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
  <div class="grid-layout">
    <div class="text-section">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h1 class="title">{title.toUpperCase()}</h1>
      {/if}
      
      <div class="image-grid">
        {#each images.slice(0, 2) as src, index}
          <div class="grid-image">
            <img src={src} alt="Interior {index + 1}" />
          </div>
        {/each}
      </div>
    </div>
    
    <div class="content-section">
      {#if isEditable}
        <textarea bind:value={description} class="description-input"></textarea>
      {:else}
        <p class="description">{description}</p>
      {/if}
      
      {#if isEditable}
        <textarea bind:value={subDescription} class="sub-description-input"></textarea>
      {:else}
        <p class="sub-description">{subDescription}</p>
      {/if}
      
      {#if images.length > 2}
        <div class="large-image">
          <img src={images[2]} alt="Interior 3" />
        </div>
      {/if}
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .grid-layout {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 40px;
    height: 100%;
  }

  .text-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
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

  .image-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    flex: 1;
  }

  .grid-image {
    border-radius: 4px;
    overflow: hidden;
    height: 200px;
  }

  .grid-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .content-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .description,
  .description-input,
  .sub-description,
  .sub-description-input {
    font-size: 15px;
    line-height: 1.7;
    color: var(--body-color);
    margin: 0;
  }

  .description-input,
  .sub-description-input {
    width: 100%;
    min-height: 120px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    resize: vertical;
  }

  .sub-description {
    padding-left: 20px;
  }

  .large-image {
    border-radius: 4px;
    overflow: hidden;
    height: 240px;
    margin-top: 10px;
  }

  .large-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

