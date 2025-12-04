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
}

export interface ColorPalette {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  mutedText: string;
  white: string;
  black: string;
}

export interface NavigationConfig {
  links: Array<{ label: string; href: string }>;
  cartLabel: string;
  primaryCtaLabel: string;
  mobileCtaLabel: string;
  menuIcon?: string;
  closeIcon?: string;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; icon?: string };
  secondaryCta: { label: string };
}

export interface AboutContent {
  title: string;
  description: string;
  highlights: string[];
  highlightIcon?: string;
}

export interface ServicesContent {
  title: string;
  subtitle: string;
  items: Array<{ title: string; description: string; icon?: string }>;
}

export interface FooterContent {
  columns: Array<{
    title: string;
    links: Array<{ label: string; href?: string }>;
  }>;
  social: Array<{ icon?: string; href: string; label: string }>;
  legalText: string;
}

export interface BrandConfig {
  brandName: string;
  brandDescription: string;
  logoUrl: string;
  colorPalette: ColorPalette; // Keep for backward compatibility, but will use colors internally
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    white: string;
    black: string;
    surface: string;
    border: string;
    mutedText: string;
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
  navigation: NavigationConfig;
  heroContent: HeroContent;
  aboutContent: AboutContent;
  servicesContent: ServicesContent;
  footerContent: FooterContent;
  contact: {
    title?: string;
    email?: string;
    phone?: string;
    address?: string;
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

  // For minimalistic themes, prefer clean light backgrounds
  const white = "#ffffff";
  const black = "#000000";
  const background = isLight ? "#ffffff" : "#0a0a0a";
  const text = isLight ? "#0a0a0a" : "#ffffff";
  const surface = isLight ? "#f7f7f7" : "#171717";
  const border = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";
  const mutedText = isLight ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.7)";

  return {
    primary,
    secondary,
    accent,
    background,
    text,
    white,
    black,
    surface,
    border,
    mutedText,
  };
}

// Convert user config to internal config
function convertUserConfig(userConfig: UserBrandConfig): BrandConfig {
  const colors = computeColors(
    userConfig.colors.primary,
    userConfig.colors.secondary,
    userConfig.colors.accent
  );

  // Create colorPalette for backward compatibility
  const colorPalette: ColorPalette = {
    primary: colors.primary,
    primaryForeground: colors.white,
    secondary: colors.secondary,
    secondaryForeground: colors.white,
    accent: colors.accent,
    accentForeground: colors.white,
    background: colors.background,
    surface: colors.surface,
    border: colors.border,
    text: colors.text,
    mutedText: colors.mutedText,
    white: colors.white,
    black: colors.black,
  };

  return {
    brandName: userConfig.brandName,
    brandDescription: userConfig.brandDescription || "",
    logoUrl: userConfig.logoUrl || "",
    colorPalette,
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
    navigation: userConfig.navigation || {
      links: [],
      cartLabel: "Cart",
      primaryCtaLabel: "Shop Now",
      mobileCtaLabel: "Get Started",
      menuIcon: "Menu",
      closeIcon: "X",
    },
    heroContent: userConfig.heroContent || {
      eyebrow: "",
      headline: "",
      subheadline: "",
      primaryCta: { label: "" },
      secondaryCta: { label: "" },
    },
    aboutContent: userConfig.aboutContent || {
      title: "",
      description: "",
      highlights: [],
    },
    servicesContent: userConfig.servicesContent || {
      title: "",
      subtitle: "",
      items: [],
    },
    footerContent: userConfig.footerContent || {
      columns: [],
      social: [],
      legalText: "",
    },
    contact: userConfig.contact || {},
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
    // If it has colorPalette but no colors, create colors from colorPalette
    if (userConfig.colorPalette && !userConfig.colors) {
      return {
        ...userConfig,
        colors: {
          primary: userConfig.colorPalette.primary,
          secondary: userConfig.colorPalette.secondary,
          accent: userConfig.colorPalette.accent,
          background: userConfig.colorPalette.background,
          text: userConfig.colorPalette.text,
          white: userConfig.colorPalette.white || "#ffffff",
          black: userConfig.colorPalette.black || "#000000",
          surface: userConfig.colorPalette.surface,
          border: userConfig.colorPalette.border,
          mutedText: userConfig.colorPalette.mutedText,
        },
      };
    }
    return userConfig as BrandConfig;
  }
  throw new Error("Brand config not found. Please ensure window.__BRAND_CONFIG__ is set by the mock-page-builder.");
};

