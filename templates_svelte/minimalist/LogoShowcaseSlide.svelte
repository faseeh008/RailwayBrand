<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import SlideHeading from './SlideHeading.svelte';

  export let primaryTitle: string = 'Primary';
  export let secondaryTitle: string = 'Secondary';
  export let primaryDescription: string =
    'Primary Logo: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dictum arcu neque, nec fringilla enim aliquet sit amet.';
  export let secondaryDescription: string =
    'Secondary Logo: Ut porttitor nunc sed neque pulvinar interdum. Curabitur quis tristique felis.';
  export let primaryImageSrc: string = '';
  export let secondaryImageSrc: string = '';
  export let pageLabel: string = 'LOGO';
  export let pageNumber: string = 'PAGE 04';
  export let textColor: string = '#1B1B1B';
  export let backgroundColor: string = '#FFFFFF';
  export let swatchBackground: string = '#F4EDE7';
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

  function logoElement(id: string, x: number, src: string): SlideData['elements'][number] {
    if (src) {
      return {
        id,
        type: 'image',
        position: { x, y: 1.6, w: 2.5, h: 2.5 },
        imageSrc: src,
        zIndex: 2
      };
    }
    return {
      id: `${id}-placeholder`,
      type: 'shape',
      position: { x, y: 1.6, w: 2.5, h: 2.5 },
      shapeType: 'rect',
      fillColor: swatchBackground.replace('#', ''),
      zIndex: 2
    };
  }

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
        id: 'primary-text',
        type: 'text',
        position: { x: 1.0, y: 1.2, w: 4.0, h: 1.0 },
        text: primaryTitle,
        fontSize: 22,
        fontFace: sansFont,
        color: textColor.replace('#', ''),
        align: 'left',
        valign: 'top',
        zIndex: 2
      },
      {
        id: 'secondary-text',
        type: 'text',
        position: { x: 5.5, y: 1.2, w: 4.0, h: 1.0 },
        text: secondaryTitle,
        fontSize: 22,
        fontFace: sansFont,
        color: textColor.replace('#', ''),
        align: 'left',
        valign: 'top',
        zIndex: 2
      },
      {
        id: 'body-text',
        type: 'text',
        position: { x: 1.0, y: 3.8, w: 3.8, h: 1.3 },
        text: primaryDescription,
        fontSize: 18,
        fontFace: sansFont,
        color: textColor.replace('#', ''),
        align: 'left',
        valign: 'top',
        zIndex: 2
      },
      {
        id: 'body-text-2',
        type: 'text',
        position: { x: 5.5, y: 3.8, w: 3.8, h: 1.3 },
        text: secondaryDescription,
        fontSize: 18,
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
      }
    ];

    elements.push(logoElement('primary-logo', 4.3, primaryImageSrc));
    elements.push(logoElement('secondary-logo', 8.0, secondaryImageSrc));

    return {
      id: 'minimalist-logo-showcase',
      type: 'logo-guidelines',
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
  class="logo-showcase"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --swatch-background: ${swatchBackground}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <SlideHeading title="Logo Showcase" textColor={textColor} accentCircleColor={swatchBackground} size="70px" />
  <div class="content">
    <div class="column">
      <div class="label">{primaryTitle}</div>
      <div class="logo-card">
        {#if primaryImageSrc}
          <img src={primaryImageSrc} alt="Primary logo" />
        {:else}
          <div class="placeholder"></div>
        {/if}
      </div>
      <p>{primaryDescription}</p>
    </div>
    <div class="column">
      <div class="label">{secondaryTitle}</div>
      <div class="logo-card">
        {#if secondaryImageSrc}
          <img src={secondaryImageSrc} alt="Secondary logo" />
        {:else}
          <div class="placeholder"></div>
        {/if}
      </div>
      <p>{secondaryDescription}</p>
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

  .logo-showcase {
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 60px;
    margin-top: 60px;
  }

  .column .label {
    font-size: 22px;
    text-align: center;
    letter-spacing: 0.2rem;
    margin-bottom: 20px;
  }

  .logo-card {
    height: 240px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--swatch-background);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.05),
      rgba(0, 0, 0, 0.05) 10px,
      transparent 10px,
      transparent 20px
    );
  }

  p {
    font-size: 18px;
    line-height: 1.6;
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

