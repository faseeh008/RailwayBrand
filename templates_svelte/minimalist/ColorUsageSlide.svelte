<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Color Usage';
  export let description: string =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dictum arcu neque, nec fringilla enim aliquet sit amet.';
  export let pageLabel: string = 'COLOR PALETTE';
  export let pageNumber: string = 'PAGE 08';
  export let swatches: Array<{ hex: string; label: string; usage: string }> = [
    { hex: '#E1DAD6', label: '#E1DAD6', usage: 'Background' },
    { hex: '#C6A28D', label: '#C6A28D', usage: 'Background' },
    { hex: '#868668', label: '#868668', usage: 'Font' },
    { hex: '#AD6237', label: '#AD6237', usage: 'Pattern' }
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
    const elements: SlideData['elements'] = [
      {
        id: 'top-line',
        type: 'shape',
        position: { x: 0.5, y: 0.5, w: 9, h: 0.02 },
        shapeType: 'rect',
        fillColor: textColor.replace('#', ''),
        zIndex: 1
      },
      {
        id: 'bottom-line',
        type: 'shape',
        position: { x: 0.5, y: 5.2, w: 9, h: 0.02 },
        shapeType: 'rect',
        fillColor: textColor.replace('#', ''),
        zIndex: 1
      },
      {
        id: 'title',
        type: 'text',
        position: { x: 1.2, y: 1.5, w: 4.0, h: 0.8 },
        text: title,
        fontSize: 58,
        fontFace: serifFont,
        color: textColor.replace('#', ''),
        align: 'left',
        valign: 'top',
        zIndex: 2
      },
      {
        id: 'description',
        type: 'text',
        position: { x: 1.2, y: 2.4, w: 7.0, h: 0.9 },
        text: description,
        fontSize: 20,
        fontFace: sansFont,
        color: textColor.replace('#', ''),
        align: 'center',
        valign: 'middle',
        zIndex: 2
      }
    ];

    swatches.slice(0, 4).forEach((swatch, index) => {
      elements.push({
        id: `usage-${index}`,
        type: 'color-swatch',
        position: { x: 1.2 + index * 2.1, y: 3.3, w: 1.8, h: 1.4 },
        colorSwatch: {
          hex: swatch.hex,
          name: swatch.label,
          usage: swatch.usage
        },
        zIndex: 2
      });
    });

    elements.push(
      {
        id: 'page-label',
        type: 'text',
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
        type: 'text',
        position: { x: 6.5, y: 5.25, w: 3, h: 0.3 },
        text: pageNumber,
        fontSize: 14,
        fontFace: sansFont,
        color: textColor.replace('#', ''),
        align: 'right',
        valign: 'middle',
        zIndex: 2
      }
    );

    return {
      id: 'minimalist-color-usage',
      type: 'color',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: backgroundColor.replace('#', '')
        }
      },
      elements
    };
  }
</script>

<div
  class="color-usage"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="90px" />
  <p class="description">{description}</p>
  <div class="swatch-row">
    {#each swatches as swatch}
      <div class="swatch">
        <div class="color" style={`background-color: ${swatch.hex};`}></div>
        <div class="hex">{swatch.label}</div>
        <div class="usage">{swatch.usage}</div>
      </div>
    {/each}
  </div>
  <div class="bottom-line"></div>
  <div class="page-meta">
    <span>{footerBrand}</span>
    <span>{pageNumber}</span>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap');

  .color-usage {
    width: 1280px;
    height: 720px;
    padding: 80px 90px;
    position: relative;
    box-sizing: border-box;
    font-family: var(--sans-stack);
    text-align: center;
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

  .serif {
    font-family: var(--serif-stack);
  }

  .description {
    font-size: 22px;
    margin-bottom: 40px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
  }

  .swatch-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    margin-top: 30px;
  }

  .swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .color {
    width: 160px;
    height: 160px;
    border-radius: 8px;
  }

  .hex {
    font-size: 18px;
    letter-spacing: 0.2rem;
  }

  .usage {
    font-size: 16px;
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

