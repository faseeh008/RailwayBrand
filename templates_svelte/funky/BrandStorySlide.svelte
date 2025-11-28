<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 03';
  export let title: string = 'Our Brand';
  export let description: string =
    'Presentation are communication tools that can be used as demonstrations, lectures, reports, and more.';
  export let heroImage: string =
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80';
  export let insetImage: string =
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
  export let stampText: string = 'Brand Guidelines';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-brand-story',
      type: 'story',
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
          position: { x: 5.5, y: 1.8, w: 3.5, h: 0.8 },
          text: title.toUpperCase(),
          fontSize: 34,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 5.5, y: 2.6, w: 3.4, h: 2.4 },
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
  <div class="brand-story">
    <div class="images">
      <div class="hero">
        <img src={heroImage} alt="Brand" />
      </div>
      <div class="inset">
        <img src={insetImage} alt="Detail" />
      </div>
      <div class="stamp">{stampText.toUpperCase()}</div>
    </div>

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
  </div>
</FunkySlideShell>

<style>
  .brand-story {
    display: grid;
    grid-template-columns: 1.2fr 0.9fr;
    gap: 40px;
    height: 100%;
    align-items: center;
  }

  .images {
    position: relative;
  }

  .hero {
    border-radius: 40px 40px 10px 10px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  }

  .hero img,
  .inset img {
    width: 100%;
    display: block;
    object-fit: cover;
  }

  .inset {
    width: 55%;
    border-radius: 20px;
    overflow: hidden;
    position: absolute;
    bottom: -40px;
    right: -20px;
    border: 8px solid var(--bg-color);
  }

  .stamp {
    position: absolute;
    right: 20px;
    top: -30px;
    font-size: 14px;
    letter-spacing: 0.4rem;
    text-transform: uppercase;
    color: var(--body-color);
    transform: rotate(12deg);
  }

  .copy h2,
  .title-input {
    font-size: 42px;
    letter-spacing: 0.12rem;
    font-weight: 700;
    color: var(--text-color);
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.4);
  }

  .copy p,
  .copy textarea {
    margin-top: 20px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--body-color);
  }

  textarea {
    width: 100%;
    min-height: 150px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.6);
  }
</style>

