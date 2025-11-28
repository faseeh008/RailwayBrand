<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  interface PaletteColor {
    hex: string;
    label: string;
  }

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 08';
  export let title: string = 'Palette';
  export let colors: PaletteColor[] = [
    { hex: '#65AF70', label: 'Organic Green' },
    { hex: '#EBAFD3', label: 'Candy Pink' },
    { hex: '#FF7B4A', label: 'Tangerine' },
    { hex: '#FFE5C9', label: 'Peach' }
  ];
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-palette',
      type: 'color',
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
          position: { x: 1.0, y: 1.9, w: 4.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 38,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', '')
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="palette">
    <div class="title-row">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="swatches">
      {#each colors as color, index}
        <div class="swatch">
          <div class="chip" style={`background:${color.hex};`}></div>
          {#if isEditable}
            <input type="text" bind:value={colors[index].hex} class="hex-input" />
          {:else}
            <div class="hex">{color.hex}</div>
          {/if}
          {#if isEditable}
            <input type="text" bind:value={colors[index].label} class="label-input" />
          {:else}
            <div class="label">{color.label}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</FunkySlideShell>

<style>
  .palette {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .title-row h2,
  .title-input {
    font-size: 42px;
    letter-spacing: 0.15rem;
    color: var(--text-color);
  }

  .title-input {
    width: 40%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.4);
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .swatch {
    background: white;
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    text-align: center;
  }

  .chip {
    width: 100%;
    height: 140px;
    border-radius: 16px;
    margin-bottom: 12px;
  }

  .hex,
  .hex-input {
    font-weight: 700;
    font-size: 18px;
  }

  .label,
  .label-input {
    margin-top: 4px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.2rem;
    color: var(--body-color);
  }

  input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 4px 6px;
    background: rgba(249, 249, 249, 0.6);
    text-align: center;
  }
</style>

