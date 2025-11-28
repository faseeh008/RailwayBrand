<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import MaximalistSlideShell from './MaximalistSlideShell.svelte';
  import { defaultMaximalistTheme, type MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'POSITIONING';
  export let barcodeNumber: string = '0 38400 12039 70 1';
  export let mission: string = 'Define the purpose and immediate ambition of the brand.';
  export let vision: string = 'Describe the future state this brand wants to enable.';
  export let values: string = 'Intuition, Craft, Conversation, Experimentation';
  export let targetAudience: string = 'Design-led founders and modern hospitality teams who crave expressive interiors.';
  export let isEditable: boolean = false;
  export let theme: MaximalistTheme = defaultMaximalistTheme;

  const bodyFont = 'Inter';

  $: valuesList = values
    ? values.split(/,|•|\n/).map((v) => v.trim()).filter(Boolean)
    : [];
  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'maximalist-brand-positioning',
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
          position: { x: 0.8, y: 0.8, w: 4.0, h: 0.4 },
          text: 'Brand Positioning'.toUpperCase(),
          fontSize: 28,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'mission',
          type: 'text',
          position: { x: 0.8, y: 1.3, w: 4.0, h: 1.0 },
          text: `Mission:\n${mission}`,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'vision',
          type: 'text',
          position: { x: 0.8, y: 2.4, w: 4.0, h: 1.0 },
          text: `Vision:\n${vision}`,
          fontSize: 16,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        },
        {
          id: 'values',
          type: 'text',
          position: { x: 5.1, y: 0.8, w: 3.6, h: 1.6 },
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
          position: { x: 5.1, y: 2.6, w: 3.6, h: 1.4 },
          text: `Target Audience:\n${targetAudience}`,
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

<MaximalistSlideShell {studioName} {propertyName} {barcodeNumber} {theme}>
  <div class="positioning">
    <div class="column">
      <p class="label">Mission</p>
      {#if isEditable}
        <textarea bind:value={mission}></textarea>
      {:else}
        <p class="copy">{mission}</p>
      {/if}

      <p class="label">Vision</p>
      {#if isEditable}
        <textarea bind:value={vision}></textarea>
      {:else}
        <p class="copy">{vision}</p>
      {/if}
    </div>

    <div class="column">
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

      <p class="label">Target Audience</p>
      {#if isEditable}
        <textarea bind:value={targetAudience}></textarea>
      {:else}
        <p class="copy">{targetAudience}</p>
      {/if}
    </div>
  </div>
</MaximalistSlideShell>

<style>
  .positioning {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    height: 100%;
  }

  .column {
    border: 1px solid rgba(0, 0, 0, 0.2);
    padding: 30px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .label {
    text-transform: uppercase;
    letter-spacing: 0.3em;
    font-size: 13px;
    margin: 0;
    color: rgba(0, 0, 0, 0.6);
  }

  .copy,
  textarea {
    font-size: 16px;
    line-height: 1.6;
    color: var(--body-color);
    margin: 0;
  }

  textarea {
    min-height: 120px;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    font-family: 'Inter', sans-serif;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    line-height: 1.6;
  }
</style>


