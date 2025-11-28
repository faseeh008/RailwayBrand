<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 04';
  export let title: string = 'Mood Board';
  export let description: string =
    'Presentation are communication tools that can be used as demonstrations, lectures, reports, and more. It is mostly presented before an audience.';
  export let images: string[] = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
  ];
  export let colorDots: string[] = ['#FF7B4A', '#EBAFD3', '#65AF70'];
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-moodboard',
      type: 'moodboard',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: theme.backgroundColor.replace('#', '')
        }
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 5.8, y: 1.8, w: 3.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 34,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 5.8, y: 2.4, w: 3.1, h: 2.8 },
          text: description,
          fontSize: 18,
          fontFace: bodyFont,
          color: theme.bodyColor.replace('#', ''),
          align: 'left',
          valign: 'top'
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="moodboard">
    <div class="gallery">
      {#each images as src, idx}
        <div class="photo {idx === 0 ? 'large' : 'small'}">
          <img src={src} alt="Mood" />
        </div>
      {/each}
    </div>

    <div class="details">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
      {#if isEditable}
        <textarea bind:value={description}></textarea>
      {:else}
        <p>{description}</p>
      {/if}

      <div class="color-dots">
        {#each colorDots as dot, index}
          {#if isEditable}
            <input type="color" bind:value={colorDots[index]} />
          {:else}
            <span style={`background:${dot};`}></span>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</FunkySlideShell>

<style>
  .moodboard {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 40px;
    height: 100%;
  }

  .gallery {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .photo {
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
  }

  .photo.small {
    width: 70%;
    margin-left: auto;
  }

  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .details h2,
  .title-input {
    font-size: 42px;
    letter-spacing: 0.1rem;
    color: var(--text-color);
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.4);
  }

  p,
  textarea {
    margin-top: 20px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--body-color);
  }

  textarea {
    width: 100%;
    min-height: 140px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 12px;
    background: rgba(255, 255, 255, 0.6);
  }

  .color-dots {
    margin-top: 20px;
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .color-dots span {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  .color-dots input[type='color'] {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    padding: 0;
  }
</style>

