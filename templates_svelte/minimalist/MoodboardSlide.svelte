<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let images: Array<{ src: string }> = Array(6).fill({ src: '' }).map((_, idx) => ({
    src: ''
  }));
export let pageLabel: string = 'INSPIRATION';
export let pageNumber: string = 'PAGE 11';
export let textColor: string = '#1B1B1B';
export let backgroundColor: string = '#FFFFFF';
export let placeholderColor: string = '#F7F4F2';
export let brandName: string = '';
export let heading: string = 'Moodboard';

  const sansFont = 'Inter';
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
      }
    ];

    images.slice(0, 6).forEach((image, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 0.7 + col * 3.0;
      const y = 1.0 + row * 2.4;
      elements.push(
        image.src
          ? {
              id: `mood-image-${index}`,
              type: 'image',
              position: { x, y, w: 2.8, h: 2.2 },
              imageSrc: image.src,
              zIndex: 2
            }
          : {
              id: `mood-placeholder-${index}`,
              type: 'shape',
              position: { x, y, w: 2.8, h: 2.2 },
              shapeType: 'rect',
              fillColor: placeholderColor.replace('#', ''),
              zIndex: 2
            }
      );
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
      id: 'minimalist-moodboard',
      type: 'photography',
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
  class="moodboard"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --placeholder-color: ${placeholderColor}; --sans-stack: ${sansStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title={heading} textColor={textColor} accentCircleColor={placeholderColor} size="72px" />
  <div class="grid">
    {#each images.slice(0, 6) as image}
      <div class="cell">
        {#if image.src}
          <img src={image.src} alt="Moodboard" />
        {:else}
          <div class="placeholder"></div>
        {/if}
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
  .moodboard {
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

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    margin-top: 30px;
  }

  .cell {
    background: var(--placeholder-color);
    border-radius: 8px;
    overflow: hidden;
    min-height: 160px;
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

