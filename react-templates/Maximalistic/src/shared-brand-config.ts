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
    white: string;
    black: string;
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
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
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
      : { r: 249, g: 115, b: 22 };
  };

  const primaryRgb = hexToRgb(primary);
  const isLight = primaryRgb.r + primaryRgb.g + primaryRgb.b > 382; // Threshold for light colors

  // For maximalistic themes, prefer light backgrounds with vibrant colors
  const white = "#ffffff";
  const black = "#000000";
  const background = isLight ? "#ffffff" : "#0a0a0a"; // Light for vibrant, dark for dark primary
  const text = isLight ? "#0a0a0a" : "#ffffff"; // Dark text for light backgrounds, white for dark

  return {
    primary,
    secondary,
    accent,
    background,
    text,
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
    brandDescription: `Bold Design, Maximum Impact - ${userConfig.industry}`,
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
      { value: "1000+", label: "Projects" },
      { value: "100k+", label: "Customers" },
      { value: "24/7", label: "Support" },
    ],
    features: [
      { title: "Bold Design", description: "Stand out with vibrant aesthetics" },
      { title: "Full Service", description: "Complete creative solutions" },
      { title: "Fast Delivery", description: "Quick turnaround times" },
    ],
    contact: {},
  };
}

// Default config
const defaultConfig: BrandConfig = {
  brandName: "VIBRANT",
  brandDescription: "Bold Design, Maximum Impact",
  logoUrl: "",
  colors: {
    primary: "#f97316",
    secondary: "#ec4899",
    accent: "#fde047",
    background: "#ffffff",
    text: "#0a0a0a",
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
  industry: "Creative",
  stats: [
    { value: "1000+", label: "Projects" },
    { value: "100k+", label: "Customers" },
    { value: "24/7", label: "Support" },
  ],
  features: [
    { title: "Bold Design", description: "Stand out with vibrant aesthetics" },
    { title: "Full Service", description: "Complete creative solutions" },
    { title: "Fast Delivery", description: "Quick turnaround times" },
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

