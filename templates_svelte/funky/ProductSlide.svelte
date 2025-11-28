<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 07';
  export let title: string = 'The Product';
  export let description: string =
    'Presentations are communication tools that can be used as demonstrations, lectures, reports, and more. They are mostly presented before an audience.';
  export let gallery: string[] = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'
  ];
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-product',
      type: 'product',
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
          position: { x: 1.0, y: 1.9, w: 3.5, h: 0.7 },
          text: title.toUpperCase(),
          fontSize: 38,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 1.0, y: 2.6, w: 3.5, h: 2.5 },
          text: description,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="product-grid">
    <div class="copy">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
      {#if isEditable}
        <textarea bind:value={description}></textarea>
      {:else}
        <p>{description}</p>
      {/if}
    </div>

    <div class="gallery">
      {#each gallery as src, index}
        <div class="frame {index === 0 ? 'large' : ''}">
          <img src={src} alt="Product" />
        </div>
      {/each}
    </div>
  </div>
</FunkySlideShell>

<style>
  .product-grid {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 40px;
    height: 100%;
    align-items: center;
  }

  .copy h2,
  .title-input {
    font-size: 40px;
    letter-spacing: 0.1rem;
    color: var(--text-color);
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.4);
  }

  .copy p,
  textarea {
    margin-top: 18px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--body-color);
  }

  textarea {
    width: 100%;
    min-height: 160px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.6);
  }

  .gallery {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 160px;
    gap: 18px;
  }

  .frame {
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  }

  .frame.large {
    grid-column: span 2;
    grid-row: span 2;
  }

  .frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

