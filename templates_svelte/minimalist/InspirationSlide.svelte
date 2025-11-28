<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Inspiration';
  export let description: string =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dictum arcu neque, nec fringilla enim aliquet sit amet.';
  export let mainImageSrc: string = '';
  export let secondaryImageSrc: string = '';
  export let tertiaryImageSrc: string = '';
  export let pageLabel: string = 'INSPIRATION';
export let pageNumber: string = 'PAGE 10';
export let accentCircleColor: string = '#F2EAE6';
export let textColor: string = '#1B1B1B';
export let backgroundColor: string = '#FFFFFF';
export let placeholderColor: string = '#F7F4F2';
export let brandName: string = '';

  const serifFont = 'Cormorant Garamond';
  const sansFont = 'Inter';
  const serifStack = "'Cormorant Garamond', 'Playfair Display', serif";
  const sansStack = "'Inter', 'Helvetica Neue', Arial, sans-serif";

  function imageElement(id: string, x: number, y: number, w: number, h: number, src?: string): SlideData['elements'][number] {
    if (src) {
      return {
        id,
        type: 'image',
        position: { x, y, w, h },
        imageSrc: src,
        zIndex: 2
      };
    }
    return {
      id: `${id}-placeholder`,
      type: 'shape',
      position: { x, y, w, h },
      shapeType: 'rect',
      fillColor: placeholderColor.replace('#', ''),
      zIndex: 2
    };
  }

function computeFooterBrand(): string {
  const source = brandName && brandName.trim().length > 0 ? brandName : pageLabel;
  return (source || '').toUpperCase();
}

let footerBrand = '';
$: footerBrand = computeFooterBrand();

  export function getSlideData(): SlideData {
    return {
      id: 'minimalist-inspiration',
      type: 'photography',
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
          position: { x: 0.8, y: 1.2, w: 2.3, h: 2.3 },
          shapeType: 'circle',
          fillColor: accentCircleColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title',
          type: 'text',
          position: { x: 1.2, y: 1.5, w: 4.5, h: 1.0 },
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
          position: { x: 1.2, y: 3.0, w: 4.8, h: 1.1 },
          text: description,
          fontSize: 20,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        imageElement('main-image', 6.2, 1.5, 2.6, 3.7, mainImageSrc),
        imageElement('secondary-image', 8.9, 1.5, 1.5, 2.2, secondaryImageSrc),
        imageElement('tertiary-image', 8.9, 3.9, 1.5, 1.3, tertiaryImageSrc),
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
  class="inspiration"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --accent-circle-color: ${accentCircleColor}; --placeholder-color: ${placeholderColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="80px" />
  <div class="layout">
    <div class="copy">
      <p class="description">{description}</p>
    </div>
    <div class="gallery">
      <div class="main">
        {#if mainImageSrc}
          <img src={mainImageSrc} alt="Inspiration main" />
        {:else}
          <div class="placeholder"></div>
        {/if}
      </div>
      <div class="stack">
        <div class="secondary">
          {#if secondaryImageSrc}
            <img src={secondaryImageSrc} alt="Inspiration secondary" />
          {:else}
            <div class="placeholder"></div>
          {/if}
        </div>
        <div class="secondary">
          {#if tertiaryImageSrc}
            <img src={tertiaryImageSrc} alt="Inspiration tertiary" />
          {:else}
            <div class="placeholder"></div>
          {/if}
        </div>
      </div>
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

  .inspiration {
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
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    position: relative;
    margin-top: 30px;
    z-index: 1;
  }
  
  .description {
    font-size: 22px;
    line-height: 1.7;
  }

  .gallery {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }

  .main,
  .secondary {
    background: #f7f4f2;
    border-radius: 8px;
    overflow: hidden;
    min-height: 200px;
  }

  .main {
    height: 360px;
  }

  .secondary {
    height: 170px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: var(--placeholder-color);
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

