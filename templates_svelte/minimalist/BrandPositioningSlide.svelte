<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let mission: string = 'State the mission clearly and concisely.';
  export let vision: string = 'Describe the future you are building.';
  export let values: string = 'Innovation • Excellence • Integrity';
  export let targetAudience: string = 'Primary audience, segment, or persona focus.';
  export let primaryColor: string = '#111111';
  export let secondaryColor: string = '#4B5563';
  export let accentColor: string = '#2563EB';
  export let isEditable: boolean = false;

  $: valuesList = splitValues(values);
  $: slideData = createSlideData();

  function splitValues(text: string): string[] {
    if (!text) return [];
    const tokens = text
      .split(/•|\||\n|,/)
      .map((token) => token.trim())
      .filter(Boolean);
    return tokens.length ? tokens : [text];
  }

  function createSlideData(): SlideData {
    return {
      id: 'minimalist-brand-positioning',
      type: 'brand-positioning',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: 'FFFFFF'
        }
      },
      elements: [
        {
          id: 'heading',
          type: 'text',
          position: { x: 0.7, y: 0.5, w: 4.2, h: 0.4 },
          text: 'BRAND POSITIONING',
          fontSize: 22,
          fontFace: 'Inter',
          bold: true,
          color: primaryColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'mission-title',
          type: 'text',
          position: { x: 0.7, y: 1.1, w: 2.1, h: 0.3 },
          text: 'Mission',
          fontSize: 18,
          fontFace: 'Inter',
          bold: true,
          color: accentColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'mission-copy',
          type: 'text',
          position: { x: 0.7, y: 1.4, w: 2.1, h: 1.0 },
          text: mission,
          fontSize: 14,
          fontFace: 'Inter',
          color: secondaryColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'vision-title',
          type: 'text',
          position: { x: 3.0, y: 1.1, w: 2.1, h: 0.3 },
          text: 'Vision',
          fontSize: 18,
          fontFace: 'Inter',
          bold: true,
          color: accentColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'vision-copy',
          type: 'text',
          position: { x: 3.0, y: 1.4, w: 2.1, h: 1.0 },
          text: vision,
          fontSize: 14,
          fontFace: 'Inter',
          color: secondaryColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'values-title',
          type: 'text',
          position: { x: 5.3, y: 1.1, w: 3.9, h: 0.3 },
          text: 'Core Values',
          fontSize: 18,
          fontFace: 'Inter',
          bold: true,
          color: accentColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'values-copy',
          type: 'text',
          position: { x: 5.3, y: 1.4, w: 3.9, h: 1.0 },
          text: valuesList.join(' • '),
          fontSize: 14,
          fontFace: 'Inter',
          color: secondaryColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'audience-title',
          type: 'text',
          position: { x: 0.7, y: 2.7, w: 8.5, h: 0.3 },
          text: 'Target Audience',
          fontSize: 18,
          fontFace: 'Inter',
          bold: true,
          color: accentColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'audience-copy',
          type: 'text',
          position: { x: 0.7, y: 3.0, w: 8.5, h: 1.5 },
          text: targetAudience,
          fontSize: 15,
          fontFace: 'Inter',
          color: secondaryColor.replace('#', ''),
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

<div
  class="minimalist-brand-positioning"
  style={`--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor}; --accent-color: ${accentColor};`}
>
  <div class="top-line"></div>
  <SlideHeading title="Brand Positioning" textColor={primaryColor} accentCircleColor={accentColor} size="72px" />
  <div class="grid">
    <div class="column">
      <p class="eyebrow">Mission</p>
      {#if isEditable}
        <textarea bind:value={mission} rows="4"></textarea>
      {:else}
        <p class="body">{mission}</p>
      {/if}
    </div>

    <div class="column">
      <p class="eyebrow">Vision</p>
      {#if isEditable}
        <textarea bind:value={vision} rows="4"></textarea>
      {:else}
        <p class="body">{vision}</p>
      {/if}
    </div>

    <div class="column values">
      <p class="eyebrow">Core Values</p>
      {#if isEditable}
        <textarea bind:value={values} rows="4"></textarea>
      {:else}
        <ul>
          {#each valuesList as value}
            <li>{value}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <div class="audience-card">
    <p class="eyebrow">Target Audience</p>
    {#if isEditable}
      <textarea bind:value={targetAudience} rows="4"></textarea>
    {:else}
      <p class="body">{targetAudience}</p>
    {/if}
  </div>
</div>

<style>
  .minimalist-brand-positioning {
    width: 1280px;
    height: 720px;
    padding: 70px 80px;
    box-sizing: border-box;
    background: #ffffff;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    color: var(--primary-color);
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .top-line {
    height: 2px;
    width: 100%;
    background: var(--primary-color);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .column {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 24px;
    background: rgba(0, 0, 0, 0.015);
    min-height: 180px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 13px;
    color: var(--accent-color);
    margin: 0 0 12px 0;
  }

  .body {
    font-size: 15px;
    line-height: 1.6;
    color: var(--secondary-color);
    margin: 0;
  }

  .column ul {
    margin: 0;
    padding-left: 18px;
    color: var(--secondary-color);
    line-height: 1.6;
  }

  textarea {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.25);
    padding: 12px;
    font-size: 15px;
    line-height: 1.5;
    font-family: 'Inter', sans-serif;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }

  .audience-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 24px;
    background: rgba(37, 99, 235, 0.03);
  }
</style>


