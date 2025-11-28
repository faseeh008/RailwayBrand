<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 05';
  export let title: string = 'Our Plan';
  export let vision: string =
    'Presentation are communication tools that can be used as demonstrations, lectures, reports, and more.';
  export let mission: string =
    'Presentation are communication tools that can be used as demonstrations, lectures, reports, and more.';
  export let dividerLabel: string = '';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-plan',
      type: 'plan',
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
          position: { x: 2.0, y: 1.8, w: 6.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 38,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'center'
        },
        {
          id: 'vision',
          type: 'text',
          position: { x: 1.8, y: 2.6, w: 3.4, h: 2.6 },
          text: `VISION\n${vision}`,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'mission',
          type: 'text',
          position: { x: 5.2, y: 2.6, w: 3.4, h: 2.6 },
          text: `MISSION\n${mission}`,
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
  <div class="plan-card">
    <div class="title-row">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="plan-columns">
      <div class="column">
        <h3>Vision</h3>
        {#if isEditable}
          <textarea bind:value={vision}></textarea>
        {:else}
          <p>{vision}</p>
        {/if}
      </div>

      <div class="divider"></div>

      <div class="column">
        <h3>Mission</h3>
        {#if isEditable}
          <textarea bind:value={mission}></textarea>
        {:else}
          <p>{mission}</p>
        {/if}
      </div>
    </div>
  </div>
</FunkySlideShell>

<style>
  .plan-card {
    background: white;
    border-radius: 32px;
    padding: 50px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
    height: calc(100% - 40px);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title-row h2,
  .title-input {
    font-size: 38px;
    text-align: center;
    letter-spacing: 0.1rem;
    color: var(--text-color);
  }

  .title-input {
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
  }

  .plan-columns {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 40px;
    align-items: stretch;
  }

  .column h3 {
    font-size: 20px;
    letter-spacing: 0.3rem;
    text-transform: uppercase;
    color: var(--text-color);
    margin-bottom: 15px;
  }

  .column p,
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
    background: rgba(249, 249, 249, 0.6);
  }

  .divider {
    width: 2px;
    background: var(--divider-color);
  }
</style>

