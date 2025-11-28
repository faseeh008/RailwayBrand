<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let heading: string = 'Brand Guidelines';
  export let subheading: string = 'Presentation by Reallygreatsite';
  export let loopLabel: string = 'Brand Guidelines';
  export let pageLabel: string = 'Page 01';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const headingFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-cover',
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
          id: 'heading',
          type: 'text',
          position: { x: 1.6, y: 2.0, w: 7.0, h: 1.5 },
          text: heading.toUpperCase(),
          fontSize: 54,
          fontFace: headingFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 2
        },
        {
          id: 'subheading',
          type: 'text',
          position: { x: 2.0, y: 3.2, w: 6.0, h: 0.5 },
          text: subheading,
          fontSize: 20,
          fontFace: headingFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 2
        },
        {
          id: 'loop-label',
          type: 'text',
          position: { x: 4.4, y: 1.2, w: 1.6, h: 1.0 },
          text: loopLabel.toUpperCase(),
          fontSize: 16,
          fontFace: headingFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'center',
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

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="cover-content">
    <div class="loop-label">{loopLabel.toUpperCase()}</div>

    <div class="heading-block">
      {#if isEditable}
        <input type="text" bind:value={heading} class="heading-input" />
      {:else}
        <h1>{heading}</h1>
      {/if}
    </div>

    <div class="subheading">
      {#if isEditable}
        <input type="text" bind:value={subheading} class="subheading-input" />
      {:else}
        {subheading}
      {/if}
    </div>
  </div>
</FunkySlideShell>

<style>
  .cover-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .loop-label {
    letter-spacing: 0.35rem;
    font-size: 16px;
    margin-bottom: 30px;
    color: var(--body-color);
  }

  .heading-block h1,
  .heading-input {
    font-size: 72px;
    text-transform: uppercase;
    letter-spacing: 0.15rem;
    font-weight: 700;
    color: var(--text-color);
    border: none;
    background: transparent;
    text-align: center;
  }

  .heading-input {
    border-bottom: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
  }

  .subheading,
  .subheading-input {
    margin-top: 20px;
    font-size: 20px;
    color: var(--body-color);
    letter-spacing: 0.05rem;
  }

  .subheading-input {
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 16px;
    text-align: center;
    background: rgba(255, 255, 255, 0.5);
  }
</style>

