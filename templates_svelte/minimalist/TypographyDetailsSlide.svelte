<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Typography';
  export let pageLabel: string = 'TYPOGRAPHY';
  export let pageNumber: string = 'PAGE 06';
  export let columns: Array<{ letter: string; description: string }> = [
    {
      letter: 'B',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dictum arcu neque, nec fringilla enim aliquet sit amet.'
    },
    {
      letter: 'b',
      description:
        'Ut porttitor nunc sed neque pulvinar interdum. Curabitur quis tristique felis. Sed fermentum sodales eros.'
    }
  ];
  export let accentCircleColor: string = '#F2EAE6';
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
    const columnElements = columns.slice(0, 2).map((col, idx) => ({
      id: `column-${idx}`,
      type: 'text' as const,
      position: { x: 1 + idx * 4.5, y: 2.2, w: 3.8, h: 2.0 },
      text: `${col.letter}\n${col.description}`,
      fontSize: 20,
      fontFace: sansFont,
      color: textColor.replace('#', ''),
      align: 'left' as const,
      valign: 'top' as const,
      zIndex: 2
    }));

    return {
      id: 'minimalist-typography-details',
      type: 'typography',
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
          id: 'accent-circle',
          type: 'shape',
          position: { x: 0.8, y: 1.1, w: 2.3, h: 2.3 },
          shapeType: 'circle',
          fillColor: accentCircleColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title',
          type: 'text' as const,
          position: { x: 1.2, y: 1.6, w: 4.0, h: 0.8 },
          text: title,
          fontSize: 56,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        ...columnElements,
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
  class="typography-details"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --accent-circle-color: ${accentCircleColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="90px" />
  <div class="columns">
    {#each columns.slice(0, 2) as column}
      <div class="column">
        <div class="letter-circle serif">{column.letter}</div>
        <p>{column.description}</p>
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

  .typography-details {
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

  .columns {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 60px;
    position: relative;
    z-index: 1;
  }

  .letter-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--accent-circle-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    margin-bottom: 20px;
  }

  p {
    font-size: 20px;
    line-height: 1.7;
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

