<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  interface LogoVariation {
    name: string;
    image: string;
    background: string;
  }

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 09';
  export let title: string = 'Logo Variation';
  export let variations: LogoVariation[] = [
    {
      name: 'Primary Logo',
      image: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=600&q=80',
      background: '#FFFFFF'
    },
    {
      name: 'Alternate Logo',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
      background: '#EBAFD3'
    }
  ];
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const headingFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    const elements: SlideData['elements'] = [
      {
        id: 'title',
        type: 'text',
        position: { x: 1.0, y: 1.8, w: 4.0, h: 0.6 },
        text: title.toUpperCase(),
        fontSize: 38,
        fontFace: headingFont,
        bold: true,
        color: theme.textColor.replace('#', '')
      }
    ];

    variations.slice(0, 2).forEach((variation, index) => {
      const x = 1.0 + index * 4.1;
      elements.push({
        id: `logo-card-${index}`,
        type: 'shape',
        position: { x, y: 2.5, w: 3.6, h: 3.0 },
        shapeType: 'rect',
        fillColor: variation.background.replace('#', ''),
        lineColor: 'FFFFFF',
        zIndex: 1
      });
      elements.push({
        id: `logo-name-${index}`,
        type: 'text',
        position: { x, y: 2.3, w: 3.6, h: 0.3 },
        text: variation.name,
        fontSize: 16,
        fontFace: headingFont,
        color: theme.textColor.replace('#', ''),
        align: 'center'
      });
      elements.push(
        variation.image
          ? {
              id: `logo-image-${index}`,
              type: 'image',
              position: { x: x + 0.2, y: 2.8, w: 3.2, h: 2.4 },
              imageSrc: variation.image,
              zIndex: 2
            }
          : {
              id: `logo-placeholder-${index}`,
              type: 'shape',
              position: { x: x + 0.2, y: 2.8, w: 3.2, h: 2.4 },
              shapeType: 'rect',
              fillColor: 'FFFFFF',
              lineColor: 'DDDDDD',
              zIndex: 2
            }
      );
    });

    return {
      id: 'funky-logo-variations',
      type: 'logo',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'color',
          color: theme.backgroundColor.replace('#', '')
        }
      },
      elements
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="logo-variations">
    <div class="title-row">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="card-row">
      {#each variations.slice(0, 2) as variation, index}
        <div class="logo-card">
          {#if isEditable}
            <input type="text" bind:value={variations[index].name} class="logo-name-input" />
          {:else}
            <h3>{variation.name}</h3>
          {/if}

          <div class="logo-preview" style={`background:${variation.background};`}>
            {#if isEditable}
              <input type="text" bind:value={variations[index].image} placeholder="Image URL" />
            {:else}
              {#if variation.image}
                <img src={variation.image} alt={variation.name} />
              {:else}
                <div class="placeholder">Logo</div>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</FunkySlideShell>

<style>
  .logo-variations {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .title-row h2,
  .title-input {
    font-size: 42px;
    letter-spacing: 0.12rem;
    color: var(--text-color);
  }

  .title-input {
    width: 40%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
  }

  .card-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
    flex: 1;
  }

  .logo-card {
    background: white;
    border-radius: 32px;
    padding: 32px;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.16);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .logo-card h3,
  .logo-name-input {
    font-size: 22px;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    color: var(--text-color);
  }

  .logo-name-input {
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 8px;
    background: rgba(249, 249, 249, 0.6);
  }

  .logo-preview {
    flex: 1;
    border-radius: 24px;
    border: 8px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.05);
  }

  .logo-preview img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .logo-preview input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 6px;
    background: rgba(255, 255, 255, 0.7);
  }

  .placeholder {
    font-weight: 600;
    letter-spacing: 0.2rem;
    color: var(--body-color);
  }
</style>


