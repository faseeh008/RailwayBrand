// User-provided JSON structure
export interface UserBrandConfig {
  brandName: string;
  industry: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  images?: {
    hero?: string;
    gallery?: string[];
  };
  // Icon fields
  logoIcon?: string;
  heroCtaIcon?: string;
  categoryIcons?: string[];
  socialIcons?: string[];
}

// Internal brand config with computed values
export interface BrandConfig {
  brandName: string;
  brandDescription: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    white: string; // Computed white/light color for text on dark backgrounds
    black: string; // Computed black/dark color for overlays
  };
  fonts: {
    heading: string;
    body: string;
  };
  images: {
    hero: string;
    gallery: string[];
  };
  industry: string;
  stats: Array<{ value: string; label: string }>;
  features: Array<{ title: string; description: string; icon?: string }>;
  contact: Record<string, any>;
  // Icon fields
  logoIcon?: string;
  heroCtaIcon?: string;
  categoryIcons?: string[];
  socialIcons?: string[];
  typography?: {
    primaryFont: string;
    secondaryFont: string;
    fontHierarchy: Array<{
      label: string;
      font: string;
      weight: string;
      size: string;
    }>;
  };
}

// Helper function to compute background and text colors from primary color
// Uses colors directly from brand config (no fallbacks)
function computeColors(primary: string, secondary: string, accent: string) {
  if (!primary || !secondary || !accent) {
    throw new Error('Colors are required. Primary, secondary, and accent colors must be provided in brand config.');
  }
  
  // Convert hex to RGB for calculations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
    };
  };

  const primaryRgb = hexToRgb(primary);
  const isLight = primaryRgb.r + primaryRgb.g + primaryRgb.b > 382; // Threshold for light colors

  // Compute white and black based on brand colors
  const white = "#ffffff";
  const black = "#000000";

  return {
    primary,
    secondary,
    accent,
    background: isLight ? "#F5F5F2" : "#1f2937", // Light background for light primary, dark for dark primary
    text: isLight ? "#1f2937" : "#ffffff", // Dark text for light backgrounds, white for dark
    white,
    black,
  };
}

// Convert user config to internal config
function convertUserConfig(userConfig: UserBrandConfig): BrandConfig {
  const colors = computeColors(
    userConfig.colors.primary,
    userConfig.colors.secondary,
    userConfig.colors.accent
  );

  return {
    brandName: userConfig.brandName,
    brandDescription: userConfig.brandDescription || "",
    logoUrl: userConfig.logoUrl || "",
    colors,
    fonts: {
      heading: userConfig.fonts?.heading || "Inter, sans-serif",
      body: userConfig.fonts?.body || "Inter, sans-serif",
    },
    images: {
      hero: userConfig.images?.hero || "",
      gallery: userConfig.images?.gallery || [],
    },
    industry: userConfig.industry,
    stats: userConfig.stats || [],
    features: userConfig.features || [],
    contact: userConfig.contact || {},
    logoIcon: userConfig.logoIcon,
    heroCtaIcon: userConfig.heroCtaIcon,
    categoryIcons: userConfig.categoryIcons,
    socialIcons: userConfig.socialIcons,
};
}

export const getBrandConfig = (): BrandConfig => {
  if (typeof window !== "undefined" && (window as any).__BRAND_CONFIG__) {
    const userConfig = (window as any).__BRAND_CONFIG__;
    // Check if it's in the new format (has colors object with primary, secondary, accent)
    if (userConfig.colors && userConfig.colors.primary && userConfig.colors.secondary && userConfig.colors.accent) {
      return convertUserConfig(userConfig as UserBrandConfig);
    }
    // Otherwise, assume it's already in the old BrandConfig format
    return userConfig as BrandConfig;
  }
  throw new Error("Brand config not found. Please ensure window.__BRAND_CONFIG__ is set by the mock-page-builder.");
};

