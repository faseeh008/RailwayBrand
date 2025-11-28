<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';

  export let titlePrimary: string = 'Brand';
  export let titleSecondary: string = 'Guidelines';
  export let website: string = 'www.reallygreatsite.com';
  export let backgroundColor: string = '#FFFFFF';
  export let textColor: string = '#1B1B1B';
  export let accentLineColor: string = '#1B1B1B';
  export let accentCircleColor: string = '#F2EAE6';

  const serifFont = 'Cormorant Garamond';
  const sansFont = 'Inter';
  const serifStack = "'Cormorant Garamond', 'Playfair Display', serif";
  const sansStack = "'Inter', 'Helvetica Neue', Arial, sans-serif";

  export function getSlideData(): SlideData {
    return {
      id: 'minimalist-cover',
      type: 'cover',
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
          fillColor: accentLineColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'bottom-line',
          type: 'shape',
          position: { x: 0.5, y: 5.1, w: 9, h: 0.02 },
          shapeType: 'rect',
          fillColor: accentLineColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'accent-circle',
          type: 'shape',
          position: { x: 0.8, y: 1.2, w: 2.2, h: 2.2 },
          shapeType: 'circle',
          fillColor: accentCircleColor.replace('#', ''),
          zIndex: 1
        },
        {
          id: 'title-primary',
          type: 'text',
          position: { x: 1.0, y: 1.6, w: 6, h: 1.2 },
          text: titlePrimary,
          fontSize: 60,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'title-secondary',
          type: 'text',
          position: { x: 1.0, y: 2.4, w: 6, h: 1.2 },
          text: titleSecondary,
          fontSize: 60,
          fontFace: serifFont,
          color: textColor.replace('#', ''),
          align: 'left',
          valign: 'top',
          zIndex: 2
        },
        {
          id: 'website',
          type: 'text',
          position: { x: 0.5, y: 5.15, w: 9, h: 0.3 },
          text: website.toUpperCase(),
          fontSize: 14,
          fontFace: sansFont,
          color: textColor.replace('#', ''),
          align: 'center',
          valign: 'middle',
          zIndex: 2
        }
      ]
    };
  }
</script>

<div
  class="minimalist-cover"
  style={`background-color: ${backgroundColor}; color: ${textColor}; --text-color: ${textColor}; --accent-line-color: ${accentLineColor}; --accent-circle-color: ${accentCircleColor}; --sans-stack: ${sansStack}; --serif-stack: ${serifStack};`}
>
  <div class="top-line"></div>
  <div class="accent-circle"></div>
  <div class="titles">
    <div class="title serif">{titlePrimary}</div>
    <div class="title serif">{titleSecondary}</div>
  </div>
  <div class="bottom-line"></div>
  <div class="website">{website.toUpperCase()}</div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap');

  .minimalist-cover {
    width: 1280px;
    height: 720px;
    position: relative;
    padding: 80px 90px;
    box-sizing: border-box;
    font-family: var(--sans-stack);
    overflow: hidden;
  }

  .top-line,
  .bottom-line {
    position: absolute;
    left: 60px;
    right: 60px;
    height: 1px;
    background-color: var(--accent-line-color);
  }

  .top-line {
    top: 70px;
  }

  .bottom-line {
    bottom: 70px;
  }

  .accent-circle {
    position: absolute;
    top: 140px;
    left: 120px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: var(--accent-circle-color);
    opacity: 0.8;
    z-index: 0;
  }

  .titles {
    position: relative;
    margin-top: 130px;
    z-index: 1;
  }

  .title {
    font-size: 96px;
    line-height: 1;
    color: var(--text-color);
  }

  .serif {
    font-family: var(--serif-stack);
  }

  .subtitle {
    margin-top: 30px;
    font-size: 22px;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
  }

  .website {
    position: absolute;
    bottom: 28px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 16px;
    letter-spacing: 0.4rem;
  }
</style>
