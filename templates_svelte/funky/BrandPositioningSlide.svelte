<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 03';
  export let mission: string = 'State how the brand behaves in the world.';
  export let vision: string = 'Show the future the brand is chasing.';
  export let values: string = 'Playfulness • Boldness • Collaboration';
  export let targetAudience: string = 'Creators, collaborators, and cultural trendsetters looking for expressive tools.';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const headingFont = 'Space Grotesk';
  const bodyFont = 'Poppins';

  $: valuesList = splitValues(values);
  $: slideData = createSlideData();

  function splitValues(text: string): string[] {
    if (!text) return [];
    const tokens = text
      .split(/•|\||,/)
      .map((token) => token.trim())
      .filter(Boolean);
    return tokens.length ? tokens : [text];
  }

  function createSlideData(): SlideData {
    return {
      id: 'funky-brand-positioning',
      type: 'brand-positioning',
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
          position: { x: 0.7, y: 0.8, w: 4.2, h: 0.5 },
          text: 'Brand Positioning',
          fontSize: 36,
          fontFace: headingFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'mission',
          type: 'text',
          position: { x: 0.7, y: 1.6, w: 4.0, h: 1.1 },
          text: `Mission:\n${mission}`,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'vision',
          type: 'text',
          position: { x: 4.9, y: 1.6, w: 4.0, h: 1.1 },
          text: `Vision:\n${vision}`,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'values',
          type: 'text',
          position: { x: 0.7, y: 2.9, w: 4.0, h: 1.2 },
          text: `Values:\n${valuesList.join(' • ')}`,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'audience',
          type: 'text',
          position: { x: 4.9, y: 2.9, w: 4.0, h: 1.2 },
          text: `Target:\n${targetAudience}`,
          fontSize: 16,
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
  <div class="positioning-grid">
    <header>
      <p class="eyebrow">Step 01</p>
      <h2>Brand Positioning</h2>
    </header>

    <div class="cards">
      <article class="card">
        <p class="label">Mission</p>
        {#if isEditable}
          <textarea bind:value={mission}></textarea>
        {:else}
          <p class="copy">{mission}</p>
        {/if}
      </article>

      <article class="card">
        <p class="label">Vision</p>
        {#if isEditable}
          <textarea bind:value={vision}></textarea>
        {:else}
          <p class="copy">{vision}</p>
        {/if}
      </article>
    </div>

    <div class="cards values">
      <article class="card">
        <p class="label">Core Values</p>
        {#if isEditable}
          <textarea bind:value={values}></textarea>
        {:else}
          <ul>
            {#each valuesList as value}
              <li>{value}</li>
            {/each}
          </ul>
        {/if}
      </article>

      <article class="card">
        <p class="label">Target Audience</p>
        {#if isEditable}
          <textarea bind:value={targetAudience}></textarea>
        {:else}
          <p class="copy">{targetAudience}</p>
        {/if}
      </article>
    </div>
  </div>
</FunkySlideShell>

<style>
  .positioning-grid {
    display: flex;
    flex-direction: column;
    gap: 32px;
    height: 100%;
  }

  header .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.6em;
    font-size: 12px;
    color: var(--body-color);
    margin: 0 0 8px 0;
  }

  header h2 {
    font-size: 54px;
    letter-spacing: 0.1em;
    margin: 0;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .card {
    border: 2px solid rgba(0, 0, 0, 0.15);
    border-radius: 32px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.6);
    min-height: 180px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card ul {
    margin: 0;
    padding-left: 18px;
    line-height: 1.5;
  }

  .label {
    font-size: 16px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--accent-pink, #ff5883);
  }

  .copy {
    font-size: 18px;
    line-height: 1.6;
    color: var(--body-color);
    margin: 0;
  }

  textarea {
    width: 100%;
    min-height: 120px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.8);
    padding: 12px;
    font-size: 18px;
    line-height: 1.5;
    font-family: 'Poppins', sans-serif;
    border-radius: 16px;
  }
</style>


