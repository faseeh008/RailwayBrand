<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 30040 02108 20 1';
  export let title: string = 'More Than Just Design';
  export let description: string = 'An interior brand isn\'t only about the spaces it creates, but about the emotions those spaces inspire. The textures, the light, the arrangement of furniture, even the choice of materials - all combine to express a brand\'s character. People don\'t just see the design, they feel it. Interior brand guidelines help maintain that same feeling, whether the space is a showroom, a hotel lobby, or a client\'s home.';
  export let website: string = 'www.reallygreatsite.com';
  export let imageSrc: string = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
  export let imagePosition: 'left' | 'right' = 'right';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    const textX = imagePosition === 'right' ? 0.8 : 5.2;
    const imageX = imagePosition === 'right' ? 5.2 : 0.8;
    
    return {
      id: 'maximalist-content',
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
          position: { x: textX, y: 1.0, w: 4.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 36,
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
          position: { x: textX, y: 1.7, w: 4.0, h: 2.5 },
          text: description,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'website',
          type: 'text',
          position: { x: textX, y: 4.3, w: 3.0, h: 0.4 },
          text: website,
          fontSize: 14,
          fontFace: bodyFont,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'middle',
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
  <div class="content-layout" class:image-left={imagePosition === 'left'}>
    {#if imagePosition === 'left'}
      <div class="image-section">
        <img src={imageSrc} alt="Interior" />
      </div>
    {/if}
    
    <div class="text-section">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h1 class="title">{title.toUpperCase()}</h1>
      {/if}
      
      {#if isEditable}
        <textarea bind:value={description} class="description-input"></textarea>
      {:else}
        <p class="description">{description}</p>
      {/if}
      
      <div class="website-box">
        {#if isEditable}
          <input type="text" bind:value={website} class="website-input" />
        {:else}
          <span class="website">{website}</span>
        {/if}
      </div>
    </div>
    
    {#if imagePosition === 'right'}
      <div class="image-section">
        <img src={imageSrc} alt="Interior" />
      </div>
    {/if}
  </div>
</MaximalistSlideShell>

<style>
  .content-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    height: 100%;
    align-items: center;
  }

  .content-layout.image-left {
    grid-template-columns: 1.2fr 0.9fr;
  }

  .text-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title,
  .title-input {
    font-size: 36px;
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
    font-size: 16px;
    line-height: 1.7;
    color: var(--body-color);
    margin: 0;
  }

  .description-input {
    width: 100%;
    min-height: 180px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    resize: vertical;
  }

  .website-box {
    border: 1px solid var(--text-color);
    padding: 12px 20px;
    display: inline-block;
    margin-top: 8px;
  }

  .website,
  .website-input {
    font-size: 14px;
    color: var(--text-color);
    text-decoration: none;
  }

  .website-input {
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
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

