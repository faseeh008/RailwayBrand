<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let brandName: string = 'Brand Name';
  export let tagline: string = 'Brand Guidelines';
  export let positioningStatement: string = 'Our positioning statement captures the promise we deliver.';
  export let primaryColor: string = '#111111';
  export let secondaryColor: string = '#4B5563';
  export let accentColor: string = '#2563EB';
  export let isEditable: boolean = false;

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'minimalist-brand-introduction',
      type: 'brand-introduction',
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
          id: 'top-line',
          type: 'shape',
          position: { x: 0.5, y: 0.55, w: 8.9, h: 0.02 },
          shapeType: 'rect',
          fillColor: primaryColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'heading',
          type: 'text',
          position: { x: 0.5, y: 0.2, w: 8.9, h: 0.4 },
          text: 'Brand Introduction',
          fontSize: 28,
          fontFace: 'Inter',
          bold: true,
          color: primaryColor.replace('#', ''),
          align: 'left',
          valign: 'middle',
          zIndex: 2
        },
        {
          id: 'statement',
          type: 'text',
          position: { x: 1.2, y: 1.3, w: 7.6, h: 2.6 },
          text: positioningStatement,
          fontSize: 18,
          fontFace: 'Inter',
          color: secondaryColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 3
        },
        {
          id: 'statement-card',
          type: 'shape',
          position: { x: 1.0, y: 1.15, w: 8.0, h: 3.0 },
          shapeType: 'rect',
          fillColor: 'FFFFFF',
          lineColor: accentColor.replace('#', ''),
          lineWidth: 2,
          zIndex: 2
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<div
  class="minimalist-brand-intro"
  style={`--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor}; --accent-color: ${accentColor};`}
>
  <div class="top-line"></div>
  <SlideHeading title="Brand Introduction" textColor={primaryColor} accentCircleColor={accentColor} size="68px" />
  <div class="statement-wrapper">
    {#if isEditable}
      <textarea bind:value={positioningStatement}></textarea>
    {:else}
      <p>{positioningStatement}</p>
    {/if}
  </div>
</div>

<style>
  .minimalist-brand-intro {
    width: 1280px;
    height: 720px;
    padding: 80px;
    box-sizing: border-box;
    background: #ffffff;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    color: var(--primary-color);
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .top-line {
    height: 2px;
    width: 100%;
    background: var(--primary-color);
  }

  .statement-wrapper {
    width: 70%;
    margin: 0 auto;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-left: 6px solid var(--accent-color);
    border-radius: 18px;
    padding: 32px 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    min-height: 200px;
  }

  .statement-wrapper p {
    margin: 0;
    font-size: 20px;
    line-height: 1.7;
    color: var(--secondary-color);
    text-align: center;
  }

  textarea {
    width: 100%;
    min-height: 200px;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 16px;
    font-size: 20px;
    line-height: 1.6;
    font-family: 'Inter', sans-serif;
    background: transparent;
  }
</style>


