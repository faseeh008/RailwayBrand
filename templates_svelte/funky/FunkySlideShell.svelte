<script lang="ts">
  import type { FunkyTheme } from './theme';

  export let brandName: string = 'Reallygreatsite';
  export let pageLabel: string = 'Page 01';
  export let theme: FunkyTheme = {
    backgroundColor: '#FDE5CC',
    accentOrange: '#FF7B4A',
    accentPink: '#EBAFD3',
    accentGreen: '#65AF70',
    accentLavender: '#D9ACF7',
    accentBeige: '#FFE5C9',
    textColor: '#111111',
    bodyColor: '#6A6A6A',
    dividerColor: '#E4B5D4'
  };
</script>

<div
  class="funky-shell"
  style={`--bg-color: ${theme.backgroundColor}; --accent-orange: ${theme.accentOrange}; --accent-pink: ${theme.accentPink}; --accent-green: ${theme.accentGreen}; --accent-lavender: ${theme.accentLavender}; --accent-beige: ${theme.accentBeige}; --text-color: ${theme.textColor}; --body-color: ${theme.bodyColor}; --divider-color: ${theme.dividerColor};`}
>
  <div class="organic-shape orange-large"></div>
  <div class="organic-shape pink-river"></div>
  <div class="organic-shape green-bend"></div>
  <div class="organic-shape lavender-loop"></div>
  <div class="organic-shape orange-drop"></div>

  <div class="shell-header">
    <div class="brand-name">{brandName}</div>
    <div class="header-line"></div>
    <div class="page-label">{pageLabel}</div>
  </div>

  <div class="shell-content">
    <slot />
  </div>

  <div class="bottom-line"></div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  .funky-shell {
    width: 1280px;
    height: 720px;
    overflow: hidden;
    position: relative;
    font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-color);
    color: var(--text-color);
    padding: 40px 60px;
    box-sizing: border-box;
  }

  .shell-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
    text-transform: capitalize;
    position: relative;
    z-index: 2;
  }

  .header-line {
    flex: 1;
    height: 2px;
    background: var(--text-color);
    margin: 0 20px;
    opacity: 0.6;
  }

  .page-label {
    font-size: 18px;
  }

  .shell-content {
    position: relative;
    z-index: 2;
    height: calc(100% - 120px);
    margin-top: 30px;
  }

  .bottom-line {
    position: absolute;
    left: 60px;
    right: 60px;
    bottom: 35px;
    height: 2px;
    background: var(--text-color);
    opacity: 0.6;
    z-index: 2;
  }

  .organic-shape {
    position: absolute;
    opacity: 0.75;
    border-radius: 40% 60% 50% 50%;
    filter: blur(0px);
  }

  .orange-large {
    background: var(--accent-orange);
    width: 520px;
    height: 260px;
    bottom: -40px;
    left: 180px;
    border-radius: 60% 40% 50% 50%;
  }

  .pink-river {
    background: var(--accent-pink);
    width: 420px;
    height: 200px;
    top: 10px;
    left: -40px;
    border-radius: 50% 50% 40% 60%;
  }

  .green-bend {
    background: var(--accent-green);
    width: 220px;
    height: 320px;
    top: 40px;
    right: 30px;
    border-radius: 60% 40% 60% 40%;
  }

  .lavender-loop {
    background: var(--accent-lavender);
    width: 260px;
    height: 200px;
    bottom: 20px;
    right: -40px;
    border-radius: 50% 50% 40% 40%;
    opacity: 0.5;
  }

  .orange-drop {
    background: var(--accent-orange);
    width: 200px;
    height: 320px;
    bottom: -80px;
    left: -30px;
  }
</style>

