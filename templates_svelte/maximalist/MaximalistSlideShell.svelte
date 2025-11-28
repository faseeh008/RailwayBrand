<script lang="ts">
  import type { MaximalistTheme } from './theme';

  export let studioName: string = 'STUDIO SHODWE';
  export let propertyName: string = 'INTERIOR PROPERTY';
  export let barcodeNumber: string = '0 38040 02038 70 1';
  export let backgroundColorOverride: string | undefined = undefined;
  export let footerBackgroundOverride: string | undefined = undefined;
  export let footerTextColorOverride: string | undefined = undefined;
  export let theme: MaximalistTheme = {
    backgroundColor: '#E8E2DA',
    footerBackground: '#CDBB9F',
    textColor: '#111111',
    bodyColor: '#333333',
    accentColor: '#000000'
  };
</script>

<div
  class="maximalist-shell"
  style={`--bg-color: ${backgroundColorOverride || theme.backgroundColor}; --footer-bg: ${theme.footerBackground}; --footer-bg-override: ${footerBackgroundOverride || 'unset'}; --text-color: ${theme.textColor}; --footer-text-color-override: ${footerTextColorOverride || 'unset'}; --body-color: ${theme.bodyColor}; --accent-color: ${theme.accentColor};`}
>
  <div class="shell-content">
    <slot />
  </div>

  <div class="footer">
    <div class="footer-left">{studioName}</div>
    <div class="footer-center">{propertyName}</div>
    <div class="footer-right">
      <div class="barcode">
        <div class="barcode-graphic"></div>
        <div class="barcode-number">{barcodeNumber}</div>
      </div>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .maximalist-shell {
    width: 1280px;
    height: 720px;
    overflow: hidden;
    position: relative;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-color);
    color: var(--text-color);
    padding: 60px 80px 80px 80px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .shell-content {
    flex: 1;
    position: relative;
    z-index: 2;
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--footer-bg-override, var(--footer-bg));
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 80px;
    z-index: 3;
  }

  .footer-left,
  .footer-center {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--footer-text-color-override, var(--text-color));
  }

  .footer-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .footer-right {
    display: flex;
    align-items: center;
  }

  .barcode {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .barcode-graphic {
    width: 120px;
    height: 30px;
    background: repeating-linear-gradient(
      90deg,
      #000 0px,
      #000 2px,
      transparent 2px,
      transparent 4px
    );
    border: 1px solid #000;
  }

  .barcode-number {
    font-size: 10px;
    color: var(--footer-text-color-override, var(--text-color));
    letter-spacing: 0.05em;
  }
</style>

