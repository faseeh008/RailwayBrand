import type { BrandConfig } from "../shared-brand-config";
import { getBrandConfig } from "../shared-brand-config";
import { getContrastingColor, mixColors, withAlpha } from "../utils/color";

export interface BrandTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    mutedText: string;
    overlay: string;
    onPrimary: string;
    onSecondary: string;
    onAccent: string;
  };
  gradients: {
    primary: string;
    accent: string;
    soft: string;
  };
}

export const buildBrandTokens = (config: BrandConfig): BrandTokens => {
  // Use colors directly from config (already computed by buildMaximalistic.ts)
  const { colors } = config;
  const { primary, secondary, accent, background, text } = colors;

  // Validate colors are present
  if (!primary || !secondary || !accent || !background || !text) {
    throw new Error('Brand tokens require all colors: primary, secondary, accent, background, text');
  }

  const surface = mixColors(background, primary, 0.08);
  const surfaceAlt = mixColors(background, secondary, 0.12);
  const border = withAlpha(text, 0.12);
  const mutedText = withAlpha(text, 0.7);
  const overlay = withAlpha(text, 0.08);

  return {
    colors: {
      primary,
      secondary,
      accent,
      background,
      surface,
      surfaceAlt,
      border,
      text,
      mutedText,
      overlay,
      onPrimary: getContrastingColor(primary, background, text),
      onSecondary: getContrastingColor(secondary, background, text),
      onAccent: getContrastingColor(accent, background, text),
    },
    gradients: {
      primary: `linear-gradient(135deg, ${primary}, ${secondary})`,
      accent: `linear-gradient(135deg, ${secondary}, ${accent})`,
      soft: `linear-gradient(135deg, ${mixColors(primary, background, 0.4)}, ${mixColors(
        secondary,
        background,
        0.4,
      )})`,
    },
  };
};

export const getBrandTokens = () => buildBrandTokens(getBrandConfig());

export const applyBrandTokens = (tokens: BrandTokens) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const { colors } = tokens;

  const setVar = (name: string, value: string) => {
    if (value) {
      root.style.setProperty(name, value);
    }
  };

  setVar("--background", colors.background);
  setVar("--foreground", colors.text);
  setVar("--card", colors.surface);
  setVar("--card-foreground", colors.text);
  setVar("--popover", colors.surfaceAlt);
  setVar("--popover-foreground", colors.text);
  setVar("--primary", colors.primary);
  setVar("--primary-foreground", colors.onPrimary);
  setVar("--secondary", colors.secondary);
  setVar("--secondary-foreground", colors.onSecondary);
  setVar("--accent", colors.accent);
  setVar("--accent-foreground", colors.onAccent);
  setVar("--muted", colors.surface);
  setVar("--muted-foreground", colors.mutedText);
  setVar("--border", colors.border);
  setVar("--input-background", colors.surfaceAlt);
  setVar("--ring", colors.overlay);
  
  // Apply typography CSS variables if available
  const brandConfig = (window as any).__BRAND_CONFIG__;
  if (brandConfig?.typography) {
    const { typography } = brandConfig;
    
    // Set font families
    setVar("--font-primary", typography.primaryFont);
    setVar("--font-secondary", typography.secondaryFont);
    
    // Set font hierarchy CSS variables
    if (Array.isArray(typography.fontHierarchy)) {
      typography.fontHierarchy.forEach((h: any) => {
        const label = String(h.label || '').toLowerCase().replace(/\s+/g, '-');
        if (label && h.font && h.size && h.weight) {
          setVar(`--font-${label}-family`, h.font);
          setVar(`--font-${label}-size`, h.size);
          setVar(`--font-${label}-weight`, h.weight);
        }
      });
    }
    
    // Load Google Fonts if needed
    if (typography.primaryFont && !typography.primaryFont.includes('Arial') && !typography.primaryFont.includes('sans-serif')) {
      const fontName = typography.primaryFont.replace(/\s+/g, '+');
      if (!document.querySelector(`link[href*="${fontName}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
    if (typography.secondaryFont && !typography.secondaryFont.includes('Arial') && !typography.secondaryFont.includes('sans-serif')) {
      const fontName = typography.secondaryFont.replace(/\s+/g, '+');
      if (!document.querySelector(`link[href*="${fontName}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }
};

