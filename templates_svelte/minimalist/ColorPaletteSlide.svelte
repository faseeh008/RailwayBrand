<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Color Palette';
  export let description: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  export let pageLabel: string = 'COLOR PALETTE';
  export let pageNumber: string = 'PAGE 07';
  export let colors: Array<{ hex: string; label: string }> = [
    { hex: '#E1DAD6', label: 'Background' },
    { hex: '#C6A28D', label: 'Background' },
    { hex: '#868668', label: 'Font' },
    { hex: '#AD6237', label: 'Pattern' }
  ];
  export let textColor: string = '#1B1B1B';
  export let backgroundColor: string = '#FFFFFF';
export let brandName: string = '';

  const serifFont = 'Cormorant Garamond';
  const sansFont = 'Inter';
  const serifStack = "'Cormorant Garamond', 'Playfair Display', serif";
  const sansStack = "'Inter', 'Helvetica Neue', Arial, sans-serif";

function computeFooterBrand(): string {
  const source = brandName && brandName.trim().length > 0 ? brandName : pageLabel;
  return (source || '').toUpperCase();
}

let footerBrand = '';
$: footerBrand = computeFooterBrand();

  export function getSlideData(): SlideData {
    const swatches = colors.slice(0, 4).map((color, index) => ({
      id: `color-${index}`,
      type: 'color-swatch' as const,
      position: { x: 6.0, y: 1.4 + index * 0.9, w: 2.8, h: 0.7 },
      colorSwatch: {
        hex: color.hex,
        name: color.label,
        usage: color.label
      },
      zIndex: 2
    }));

    return {
      id: 'minimalist-color-palette',
      type: 'color-palette',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: backgroundColor.replace('#', '')
        }
      },
      elements: [
        {
          id: 'top-line',
          type: 'shape' as const,
          position: { x: 0.5, y: 0.5, w: 9, h: 0.02 },
          shapeType: 'rect',
          fillColor: textColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'bottom-line',
          type: 'shape' as const,
          position: { x: 0.5, y: 5.2, w: 9, h: 0.02 },
          shapeType: 'rect',
          fillColor: textColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title',
          type: 'text' as const,
          position: { x: 1.1, y: 1.5, w: 4.0, h: 0.9 },
          text: title,
          fontSize: 60,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'description',
          type: 'text' as const,
          position: { x: 1.1, y: 3.0, w: 4.5, h: 1.1 },
          text: description,
          fontSize: 20,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        ...swatches,
        {
          id: 'page-label',
          type: 'text' as const,
          position: { x: 0.5, y: 5.25, w: 3, h: 0.3 },
          text: footerBrand,
          fontSize: 14,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'middle',
          zIndex: 2
        },
        {
          id: 'page-number',
          type: 'text' as const,
          position: { x: 6.5, y: 5.25, w: 3, h: 0.3 },
          text: pageNumber,
          fontSize: 14,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'right',
          valign: 'middle',
          zIndex: 2
        }
      ]
    };
  }
</script>

<div
  class="color-palette"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="90px" />
  <div class="layout">
    <div class="copy">
      <p class="description">{description}</p>
    </div>
    <div class="swatches">
      {#each colors as color}
        <div class="swatch">
          <div class="color-block" style={`background-color: ${color.hex};`}></div>
          <div class="meta">
            <span class="hex">{color.hex}</span>
            <span class="label">{color.label}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="bottom-line"></div>
  <div class="page-meta">
    <span>{footerBrand}</span>
    <span>{pageNumber}</span>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap');

  .color-palette {
    width: 1280px;
    height: 720px;
    padding: 80px 90px;
    position: relative;
    box-sizing: border-box;
    font-family: var(--sans-stack);
  }

  .top-line,
  .bottom-line {
    position: absolute;
    left: 60px;
    right: 60px;
    height: 1px;
    background: var(--text-color);
  }

  .top-line {
    top: 60px;
  }

  .bottom-line {
    bottom: 60px;
  }

  .layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 60px;
    margin-top: 60px;
  }

  p {
    font-size: 22px;
    line-height: 1.6;
  }

  .swatches {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .swatch {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    align-items: center;
    gap: 20px;
  }

  .color-block {
    height: 80px;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    letter-spacing: 0.1rem;
  }

  .hex {
    font-size: 18px;
  }

  .label {
    font-size: 14px;
    text-transform: uppercase;
  }

  .page-meta {
    position: absolute;
    bottom: 30px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    letter-spacing: 0.3rem;
  }
</style>

