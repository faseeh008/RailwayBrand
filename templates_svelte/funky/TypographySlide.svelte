<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 10';
  export let title: string = 'Typeface';
  export let description: string =
    'Presentations are communication tools that can be used as demonstrations, lectures, reports, and more.';
  export let fontFamily: string = 'Poppins';
  export let primarySample: string = 'Aa Bb Cc 123';
  export let secondarySample: string = 'Aa Bb Cc 123';
  export let supportingCopy: string = 'Typography';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-typography',
      type: 'typography',
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
          position: { x: 2.0, y: 1.9, w: 6.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 38,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'center'
        },
        {
          id: 'copy',
          type: 'text',
          position: { x: 1.4, y: 2.6, w: 3.2, h: 2.6 },
          text: `${supportingCopy.toUpperCase()}\n${description}`,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'font-name',
          type: 'text',
          position: { x: 5.2, y: 2.6, w: 3.2, h: 0.5 },
          text: fontFamily.toUpperCase(),
          fontSize: 20,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left'
        },
        {
          id: 'primary-sample',
          type: 'text',
          position: { x: 5.2, y: 3.0, w: 3.2, h: 0.8 },
          text: primarySample,
          fontSize: 36,
          fontFace: fontFamily,
          bold: true,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'secondary-sample',
          type: 'text',
          position: { x: 5.2, y: 3.8, w: 3.2, h: 0.6 },
          text: secondarySample,
          fontSize: 24,
          fontFace: fontFamily,
          color: theme.bodyColor.replace('#', '')
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="type-card">
    <div class="header">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="columns">
      <div class="column">
        <div class="label">{supportingCopy.toUpperCase()}</div>
        {#if isEditable}
          <textarea bind:value={description}></textarea>
        {:else}
          <p>{description}</p>
        {/if}
      </div>
      <div class="divider"></div>
      <div class="column">
        <div class="label">{fontFamily.toUpperCase()}</div>
        <div class="samples">
          {#if isEditable}
            <input type="text" bind:value={primarySample} class="sample-input" />
          {:else}
            <div class="sample primary">{primarySample}</div>
          {/if}
          {#if isEditable}
            <input type="text" bind:value={secondarySample} class="sample-input" />
          {:else}
            <div class="sample secondary">{secondarySample}</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</FunkySlideShell>

<style>
  .type-card {
    background: white;
    border-radius: 32px;
    padding: 48px 52px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
    height: calc(100% - 30px);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .header h2,
  .title-input {
    font-size: 40px;
    letter-spacing: 0.12rem;
    text-align: center;
    color: var(--text-color);
  }

  .title-input {
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
  }

  .columns {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 40px;
    align-items: center;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .label {
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.35rem;
    color: var(--text-color);
  }

  p,
  textarea {
    font-size: 18px;
    line-height: 1.6;
    color: var(--body-color);
  }

  textarea {
    width: 100%;
    min-height: 140px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(249, 249, 249, 0.7);
  }

  .divider {
    width: 2px;
    height: 100%;
    background: var(--divider-color);
  }

  .samples {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .sample {
    font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
    letter-spacing: 0.1rem;
  }

  .sample.primary {
    font-size: 42px;
    font-weight: 700;
    color: var(--text-color);
  }

  .sample.secondary {
    font-size: 26px;
    color: var(--body-color);
  }

  .sample-input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.6);
  }
</style>


