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
    technology?: string;
    innovation?: string;
    gallery?: string[];
  };
}

export interface NavigationLink {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface MetricItem {
  label: string;
  value: number;
}

export interface FooterColumn {
  title: string;
  links: string[];
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
    white: string;
    black: string;
    muted?: string;
    border?: string;
    surface?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  images: {
    hero: string;
    technology?: string;
    innovation?: string;
    gallery: string[];
  };
  industry: string;
  stats: Array<{ value: string; label: string }>;
  features: FeatureItem[];
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  navigation?: {
    links: NavigationLink[];
    ctaLabel: string;
    ctaIcon?: string;
  };
  hero?: {
    eyebrow: string;
    primaryCta: string;
    primaryCtaIcon?: string;
    secondaryCta: string;
    secondaryCtaIcon?: string;
    scrollHint: string;
  };
  featuresContent?: {
    heading: string;
    subheading: string;
    cards: Array<FeatureItem & { icon?: string }>;
  };
  technologyContent?: {
    heading: string;
    description: string;
    metrics: MetricItem[];
    ctaLabel: string;
    ctaIcon?: string;
  };
  innovationContent?: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaIcon?: string;
  };
  ctaContent?: {
    heading: string;
    description: string;
    primaryCta: string;
    primaryCtaIcon?: string;
    secondaryCta: string;
    secondaryCtaIcon?: string;
    trustMessage: string;
  };
  footerContent?: {
    description: string;
    columns: FooterColumn[];
    copyright: string;
  };
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

  // For futuristic/tech themes, prefer dark backgrounds
  const background = "#0f172a"; // Dark tech background
  const text = "#ffffff"; // White text for dark backgrounds
  const muted = "rgba(255,255,255,0.75)";
  const border = "rgba(255,255,255,0.25)";
  const surface = "rgba(15,23,42,0.8)";

  return {
    primary,
    secondary,
    accent,
    background,
    text,
    white,
    black,
    muted,
    border,
    surface,
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
      technology: userConfig.images?.technology || "",
      innovation: userConfig.images?.innovation || "",
      gallery: userConfig.images?.gallery || [],
    },
    industry: userConfig.industry,
    stats: userConfig.stats || [],
    features: userConfig.features || [],
    contact: userConfig.contact || {},
    navigation: userConfig.navigation,
    hero: userConfig.hero,
    featuresContent: userConfig.featuresContent,
    technologyContent: userConfig.technologyContent,
    innovationContent: userConfig.innovationContent,
    ctaContent: userConfig.ctaContent,
    footerContent: userConfig.footerContent,
  };
}

// Get config from window or throw error
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

