<script lang="ts">
  import type { SlideData } from '$lib/types/slide-data';
  import FunkySlideShell from './FunkySlideShell.svelte';
  import { defaultFunkyTheme, type FunkyTheme } from './theme';

  export interface TeamMember {
    name: string;
    role: string;
    photo: string;
  }

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 06';
  export let title: string = 'Our Team';
  export let members: TeamMember[] = [
    {
      name: 'Howard O.',
      role: 'Founder',
      photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Morgan M.',
      role: 'Graphic Designer',
      photo: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Olivia W.',
      role: 'Art Director',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
    }
  ];
  export let isEditable: boolean = false;
  export let theme: FunkyTheme = defaultFunkyTheme;

  const bodyFont = 'Poppins';

  $: slideData = createSlideData();

  function createSlideData(): SlideData {
    return {
      id: 'funky-team',
      type: 'team',
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
          position: { x: 2.0, y: 1.8, w: 6.0, h: 0.7 },
          text: title.toUpperCase(),
          fontSize: 36,
          fontFace: bodyFont,
          bold: true,
          color: theme.textColor.replace('#', ''),
          align: 'center'
        }
      ]
    };
  }

  export function getSlideData(): SlideData {
    return slideData;
  }
</script>

<FunkySlideShell {brandName} {pageLabel} {theme}>
  <div class="team-card">
    <div class="title-row">
      {#if isEditable}
        <input type="text" bind:value={title} class="title-input" />
      {:else}
        <h2>{title.toUpperCase()}</h2>
      {/if}
    </div>

    <div class="team-grid">
      {#each members as member, index}
        <div class="member">
          <div class="photo">
            <img src={member.photo} alt={member.name} />
          </div>
          {#if isEditable}
            <input type="text" bind:value={members[index].name} class="name-input" />
            <input type="text" bind:value={members[index].role} class="role-input" />
          {:else}
            <div class="name">{member.name}</div>
            <div class="role">{member.role}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</FunkySlideShell>

<style>
  .team-card {
    background: white;
    border-radius: 32px;
    padding: 50px;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.18);
    height: calc(100% - 30px);
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .title-row h2,
  .title-input {
    font-size: 38px;
    letter-spacing: 0.1rem;
    text-align: center;
    color: var(--text-color);
  }

  .title-input {
    border: 2px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 12px;
  }

  .team-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
  }

  .member {
    text-align: center;
  }

  .photo {
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.18);
  }

  .photo img {
    width: 100%;
    height: 220px;
    object-fit: cover;
  }

  .name,
  .name-input {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    text-transform: uppercase;
  }

  .role,
  .role-input {
    margin-top: 6px;
    font-size: 16px;
    color: var(--body-color);
  }

  input {
    width: 100%;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    padding: 6px 8px;
    background: rgba(249, 249, 249, 0.6);
  }
</style>

