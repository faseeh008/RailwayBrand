export interface FontHierarchyItem {
  label: string;  // "Heading 1", "Heading 2", "Body Text"
  font: string;   // Font family name
  size: string;   // e.g., "48px", "32px", "16px"
  weight: string; // e.g., "700", "400"
}

export interface Typography {
  primaryFont: string;
  secondaryFont: string;
  fontHierarchy: FontHierarchyItem[];
}

export interface BrandConfig {
  brandName: string;
  industry: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    white?: string;
    black?: string;
  };
  typography?: Typography;
  images: {
    hero: string;
    gallery: string[];
  };
  brandDescription: string;
  stats: Array<{ value: string; label: string }>;
  templateContent?: any; // Will be used by template-content.ts
}

// Helper to compute colors if not already provided
function computeColors(primary: string, secondary: string, accent: string) {
  if (!primary || !secondary || !accent) {
    throw new Error('Colors are required. Primary, secondary, and accent colors must be provided in brand config.');
  }
  
  // Determine if primary color is light or dark
  const cleanHex = primary.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const luminance = (r + g + b) / 3;
  const isPrimaryLight = luminance > 127;
  
  const background = isPrimaryLight ? '#ffffff' : '#0a0a0a';
  const text = isPrimaryLight ? '#0a0a0a' : '#ffffff';
  const white = '#ffffff';
  const black = '#000000';
  
  return { primary, secondary, accent, background, text, white, black };
}

export const getBrandConfig = (): BrandConfig => {
  if (typeof window !== "undefined" && (window as any).__BRAND_CONFIG__) {
    const injectedConfig = (window as any).__BRAND_CONFIG__;
    
    // If colors are already computed (have background and text), use them directly
    if (injectedConfig.colors && injectedConfig.colors.background && injectedConfig.colors.text) {
      return injectedConfig;
    }
    
    // Otherwise, compute colors from primary, secondary, accent
    if (injectedConfig.colors && injectedConfig.colors.primary && injectedConfig.colors.secondary && injectedConfig.colors.accent) {
      return {
        ...injectedConfig,
        colors: computeColors(
          injectedConfig.colors.primary,
          injectedConfig.colors.secondary,
          injectedConfig.colors.accent
        )
      };
    }
    
    // If structure is different (e.g., colorPalette), convert it
    if (injectedConfig.colorPalette) {
      const computedColors = computeColors(
        injectedConfig.colorPalette.primary,
        injectedConfig.colorPalette.secondary,
        injectedConfig.colorPalette.accent
      );
      return {
        ...injectedConfig,
        colors: computedColors
      };
    }
    
    return injectedConfig;
  }
  
  // No default config - throw error if colors are missing
  throw new Error('Brand config not found. Colors must be provided via window.__BRAND_CONFIG__');
};

