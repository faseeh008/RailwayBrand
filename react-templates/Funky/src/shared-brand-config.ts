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
  features: Array<{ title: string; description: string }>;
  contact: Record<string, any>;
}

// Helper function to compute background and text colors from primary color
function computeColors(primary: string, secondary: string, accent: string) {
  // Convert hex to RGB for calculations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 245, g: 245, b: 242 };
  };

  const primaryRgb = hexToRgb(primary);
  const isLight = primaryRgb.r + primaryRgb.g + primaryRgb.b > 382; // Threshold for light colors

  // Compute white and black based on brand colors
  // White should be light enough for text on dark backgrounds
  // Black should be dark enough for overlays on light backgrounds
  const white = isLight ? "#ffffff" : "#ffffff"; // Always use white for contrast
  const black = isLight ? "#000000" : "#000000"; // Always use black for overlays

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
    brandDescription: `Discover ${userConfig.brandName} - Premium ${userConfig.industry} collection.`,
    logoUrl: "",
    colors,
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
    images: {
      hero: userConfig.images?.hero || "",
      gallery: userConfig.images?.gallery || [],
    },
    industry: userConfig.industry,
    stats: [
      { value: "24/7", label: "Creative Flow" },
      { value: "120+", label: "Happy Clients" },
      { value: "12", label: "Brand Touchpoints" },
    ],
    features: [
      { title: "Joyful Expressions", description: "Turn every interaction into a playful moment." },
      { title: "Bold Voice", description: "A brand story that never whispers." },
      { title: "Culture Ready", description: "Made for social, retail, and experiential drops." },
    ],
    contact: {},
  };
}

const defaultConfig: BrandConfig = {
  brandName: "FUNKIFY",
  brandDescription: "Bold. Funky. Fearless. Express yourself with fashion that speaks your language.",
  logoUrl: "",
  colors: {
    primary: "#9333ea",
    secondary: "#ec4899",
    accent: "#f59e0b",
    background: "#faf5ff",
    text: "#1f2937",
    white: "#ffffff",
    black: "#000000",
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  images: {
    hero: "",
    gallery: [],
  },
  industry: "Fashion",
  stats: [
    { value: "24/7", label: "Creative Flow" },
    { value: "120+", label: "Happy Clients" },
    { value: "12", label: "Brand Touchpoints" },
  ],
  features: [
    { title: "Joyful Expressions", description: "Turn every interaction into a playful moment." },
    { title: "Bold Voice", description: "A brand story that never whispers." },
    { title: "Culture Ready", description: "Made for social, retail, and experiential drops." },
  ],
  contact: {},
};

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
  return defaultConfig;
};

