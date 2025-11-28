<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 02';
  export let title: string = 'Table of Content';
  export let items: string[] = [
    'About us',
    'Moodboard',
    'Plan',
    'Team',
    'Product',
    'Palette',
    'Logo Variation',
    'Typeface'
  ];
  export let featuredImage: string =
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const headingFont = 'Poppins';

  $: listText = items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-table-of-contents',
      type: 'agenda',
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
          position: { x: 1.0, y: 1.8, w: 4.5, h: 0.7 },
          text: title.toUpperCase(),
          fontSize: 36,
          fontFace: headingFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'list',
          type: 'text',
          position: { x: 1.0, y: 2.4, w: 3.5, h: 2.5 },
          text: listText,
          fontSize: 18,
          fontFace: headingFont,
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

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="toc-content">
    <div class="title-row">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="body">
      <ol>
        {#each items as item, index}
          <li>
            {#if isEditable}
              <input type="text" bind:value={items[index]} />
            {:else}
              <span class="index">{index + 1}.</span> {item}
            {/if}
          </li>
        {/each}
      </ol>

      <div class="image-card">
        <img src={featuredImage} alt="Featured" />
      </div>
    </div>
  </div>
</FunkySlideShell>

<style>
  .toc-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title-row h2,
  .title-input {
    font-size: 42px;
    letter-spacing: 0.1rem;
    font-weight: 700;
    color: var(--text-color);
    text-transform: uppercase;
  }

  .title-input {
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
    width: 60%;
    background: rgba(255, 255, 255, 0.4);
  }

  .body {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 40px;
    align-items: center;
  }

  ol {
    margin: 0;
    padding-left: 20px;
    font-size: 20px;
    color: var(--body-color);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  li {
    list-style: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  li input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.5);
  }

  .index {
    font-weight: 600;
    color: var(--text-color);
  }

  .image-card {
    background: white;
    border-radius: 120px 120px 10px 10px;
    overflow: hidden;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.15);
  }

  .image-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>

