<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let title: string = 'Contents';
  export let sections: Array<{ number: string; label: string }> = [
    { number: '01.', label: 'Brand Guidelines' },
    { number: '02.', label: 'Logo and Design' },
    { number: '03.', label: 'Typography' },
    { number: '04.', label: 'Color Palette' },
    { number: '05.', label: 'Design and Social Media' },
    { number: '06.', label: 'Inspiration and Moodboard' }
  ];
  export let pageLabel: string = 'CONTENTS';
export let pageNumber: string = 'PAGE 02';
export let imageSrc: string = '';
export let accentCircleColor: string = '#F2EAE6';
export let textColor: string = '#1B1B1B';
export let backgroundColor: string = '#FFFFFF';
export let imagePlaceholderColor: string = '#F7F4F1';
export let brandName: string = '';

const serifFont = 'Cormorant Garamond';
const sansFont = 'Inter';
const serifStack = "'Cormorant Garamond', 'Playfair Display', serif";
const sansStack = "'Inter', 'Helvetica Neue', Arial, sans-serif";

$: listText = sections.map(({ number, label }) => `${number} ${label}`).join('\n');

function computeFooterBrand(): string {
	const source = brandName && brandName.trim().length > 0 ? brandName : pageLabel;
	return (source || '').toUpperCase();
}

let footerBrand = '';
$: footerBrand = computeFooterBrand();

  export function getSlideData(): SlideData {
    return {
      id: 'minimalist-contents',
      type: 'content',
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
          position: { x: 0.7, y: 1.2, w: 2.1, h: 2.1 },
          shapeType: 'circle',
          fillColor: accentCircleColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title',
          type: 'text',
          position: { x: 1.0, y: 1.5, w: 4.5, h: 1.5 },
          text: title,
          fontSize: 58,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'sections',
          type: 'text',
          position: { x: 1.2, y: 2.8, w: 4.5, h: 2.4 },
          text: listText,
          fontSize: 20,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
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
        },
        imageSrc
          ? {
              id: 'hero-image',
              type: 'image' as const,
              position: { x: 6.2, y: 1.4, w: 3.0, h: 3.8 },
              imageSrc,
              zIndex: 2
            }
          : {
              id: 'hero-placeholder',
              type: 'shape' as const,
              position: { x: 6.2, y: 1.4, w: 3.0, h: 3.8 },
              shapeType: 'rect',
              fillColor: imagePlaceholderColor.replace('#', ''),
              zIndex: 2
            }
      ].filter(Boolean) as SlideData['elements']
    };
  }
</script>

<div
  class="contents-slide"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --accent-circle-color: ${accentCircleColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>

  <div class="content">
    <SlideHeading title={title} textColor={textColor} accentCircleColor={accentCircleColor} size="80px" />
    <ul class="sections">
      {#each sections as item}
        <li><span class="number">{item.number}</span>{item.label}</li>
      {/each}
    </ul>
    <div class="page-meta">
      <span>{footerBrand}</span>
      <span>{pageNumber}</span>
    </div>
  </div>

  <div class="hero-wrapper">
    {#if imageSrc}
      <img src={imageSrc} alt="Contents visual" />
    {:else}
      <div class="image-placeholder"></div>
    {/if}
  </div>

  <div class="bottom-line"></div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap');

  .contents-slide {
    width: 1280px;
    height: 720px;
    position: relative;
    display: flex;
    padding: 70px 80px;
    box-sizing: border-box;
    font-family: var(--sans-stack);
    gap: 60px;
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
    flex: 1;
  }

  .serif {
    font-family: var(--serif-stack);
  }

  .sections {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sections li {
    display: flex;
    gap: 12px;
    letter-spacing: 0.06rem;
  }

  .number {
    font-weight: 500;
    min-width: 50px;
  }

  .hero-wrapper {
    width: 360px;
    height: 460px;
    border-radius: 6px;
    overflow: hidden;
    align-self: center;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    background: #f8f5f3;
  }

  .hero-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.04),
      rgba(0, 0, 0, 0.04) 10px,
      transparent 10px,
      transparent 20px
    );
  }

  .page-meta {
    position: absolute;
    bottom: -80px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    letter-spacing: 0.3rem;
    text-transform: uppercase;
  }
</style>

