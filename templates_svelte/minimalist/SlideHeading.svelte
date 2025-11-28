<script lang="ts">
  export let title: string;
  export let textColor: string = '#1B1B1B';
  export let accentCircleColor: string = '#F2EAE6';
  export let size: string = '90px';
  export let showAccentCircle: boolean = true;
</script>

<div
  class="slide-heading"
  style={`--heading-color: ${textColor}; --heading-circle: ${accentCircleColor}; --heading-size: ${size};`}
>
  {#if showAccentCircle}
    <div class="slide-heading__circle"></div>
  {/if}
  <h2 class="slide-heading__title">{title}</h2>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');

  .slide-heading {
    position: relative;
    margin: 0 0 32px 0;
    padding-left: 6px;
  }

  .slide-heading__circle {
    position: absolute;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: var(--heading-circle);
    opacity: 0.35;
    top: -50px;
    left: 0;
    z-index: 0;
  }

  .slide-heading__title {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: var(--heading-size);
    color: var(--heading-color);
    font-family: 'Cormorant Garamond', 'Playfair Display', serif;
    font-weight: 500;
    letter-spacing: 0.04em;
  }
</style>

