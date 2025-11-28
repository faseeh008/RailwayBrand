<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Typography';
  export let description: string =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dictum arcu neque, nec fringilla enim aliquet sit amet.';
  export let primaryLetter: string = 'B';
  export let secondaryLetter: string = 'b';
  export let pageLabel: string = 'TYPOGRAPHY';
  export let pageNumber: string = 'PAGE 05';
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
    return {
      id: 'minimalist-typography-hero',
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
          id: 'accent-circle',
          type: 'shape',
          position: { x: 0.7, y: 1.1, w: 2.3, h: 2.3 },
          shapeType: 'circle',
          fillColor: accentCircleColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title',
          type: 'text',
          position: { x: 1.1, y: 1.6, w: 4.5, h: 1.3 },
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
          type: 'text',
          position: { x: 1.1, y: 3.4, w: 5.2, h: 1 },
          text: description,
          fontSize: 20,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'sample-letter',
          type: 'text',
          position: { x: 7.0, y: 2.1, w: 1.4, h: 1.4 },
          text: primaryLetter,
          fontSize: 80,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 2
        },
        {
          id: 'sample-letter-2',
          type: 'text',
          position: { x: 8.0, y: 2.8, w: 1.2, h: 1.2 },
          text: secondaryLetter,
          fontSize: 72,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 2
        },
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
      ]
    };
  }
</script>

<div
  class="typography-hero"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --accent-circle-color: ${accentCircleColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="96px" />
  <div class="content">
    <p class="description">{description}</p>
  </div>
  <div class="letter-pair serif">
    <span>{primaryLetter}</span>
    <span class="slash">/</span>
    <span>{secondaryLetter}</span>
  </div>
  <div class="bottom-line"></div>
  <div class="page-meta">
    <span>{footerBrand}</span>
    <span>{pageNumber}</span>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap');

  .typography-hero {
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

  .content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    margin-top: 24px;
  }

  .serif {
    font-family: var(--serif-stack);
  }

  .description {
    font-size: 22px;
    line-height: 1.7;
  }

  .letter-pair {
    position: absolute;
    top: 200px;
    right: 140px;
    font-size: 80px;
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .slash {
    font-size: 60px;
    font-weight: 200;
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

