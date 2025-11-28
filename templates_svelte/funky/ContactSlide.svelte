<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 11';
  export let title: string = 'Contact Us';
  export let website: string = 'www.reallygreatsite.com';
  export let email: string = 'hello@reallygreatsite.com';
  export let phone: string = '123-456-7890';
  export let contactImage: string =
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80';
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-contact',
      type: 'contact',
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
          position: { x: 2.0, y: 1.9, w: 6.0, h: 0.6 },
          text: title.toUpperCase(),
          fontSize: 38,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'center'
        },
        {
          id: 'website',
          type: 'text',
          position: { x: 5.2, y: 2.8, w: 3.0, h: 0.4 },
          text: website,
          fontSize: 20,
          fontFace: bodyFont,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'email',
          type: 'text',
          position: { x: 5.2, y: 3.3, w: 3.0, h: 0.4 },
          text: email,
          fontSize: 20,
          fontFace: bodyFont,
          color: theme.textColor.replace('#', '')
        },
        {
          id: 'phone',
          type: 'text',
          position: { x: 5.2, y: 3.8, w: 3.0, h: 0.4 },
          text: phone,
          fontSize: 20,
          fontFace: bodyFont,
          color: theme.textColor.replace('#', '')
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="contact-card">
    <div class="image">
      {#if isEditable}
        <input type="text" bind:value={contactImage} placeholder="Image URL" />
      {:else}
        <img src={contactImage} alt="Contact" />
      {/if}
    </div>
    <div class="details">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}

      <div class="info">
        <label>Website</label>
        {#if isEditable}
          <input type="text" bind:value={website} />
        {:else}
          <p>{website}</p>
        {/if}
      </div>

      <div class="info">
        <label>Email</label>
        {#if isEditable}
          <input type="text" bind:value={email} />
        {:else}
          <p>{email}</p>
        {/if}
      </div>

      <div class="info">
        <label>Phone</label>
        {#if isEditable}
          <input type="text" bind:value={phone} />
        {:else}
          <p>{phone}</p>
        {/if}
      </div>
    </div>
  </div>
</FunkySlideShell>

<style>
  .contact-card {
    background: white;
    border-radius: 32px;
    padding: 42px;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.18);
    height: calc(100% - 30px);
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 32px;
    align-items: center;
  }

  .image {
    border-radius: 28px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 8px;
    background: rgba(249, 249, 249, 0.7);
  }

  .details h2,
  .title-input {
    font-size: 38px;
    letter-spacing: 0.12rem;
    color: var(--text-color);
    margin-bottom: 20px;
  }

  .title-input {
    width: 100%;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
  }

  .info {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    text-transform: uppercase;
    letter-spacing: 0.3rem;
    font-size: 14px;
    color: var(--body-color);
  }

  p,
  input {
    font-size: 20px;
    color: var(--text-color);
  }

  .info input {
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 8px;
    background: rgba(249, 249, 249, 0.7);
  }
</style>


