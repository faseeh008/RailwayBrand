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
  };
  hero?: {
    eyebrow: string;
    primaryCta: string;
    secondaryCta: string;
    scrollHint: string;
  };
  featuresContent?: {
    heading: string;
    subheading: string;
    cards: FeatureItem[];
  };
  technologyContent?: {
    heading: string;
    description: string;
    metrics: MetricItem[];
    ctaLabel: string;
  };
  innovationContent?: {
    heading: string;
    description: string;
    ctaLabel: string;
  };
  ctaContent?: {
    heading: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    trustMessage: string;
  };
  footerContent?: {
    description: string;
    columns: FooterColumn[];
    copyright: string;
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
      : { r: 59, g: 130, b: 246 };
  };

  const primaryRgb = hexToRgb(primary);
  const isLight = primaryRgb.r + primaryRgb.g + primaryRgb.b > 382; // Threshold for light colors

  // Compute white and black based on brand colors
  const white = "#ffffff";
  const black = "#000000";

  // For futuristic/tech themes, prefer dark backgrounds
  const background = isLight ? "#0f172a" : "#0f172a"; // Dark tech background
  const text = isLight ? "#ffffff" : "#ffffff"; // White text for dark backgrounds
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
    brandDescription: `The Future of ${userConfig.industry}`,
    logoUrl: "",
    colors,
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
    images: {
      hero: userConfig.images?.hero || "",
      technology: userConfig.images?.technology || "",
      innovation: userConfig.images?.innovation || "",
      gallery: userConfig.images?.gallery || [],
    },
    industry: userConfig.industry,
    stats: [
      { value: "99.9%", label: "Uptime" },
      { value: "10M+", label: "Users" },
      { value: "500+", label: "Countries" },
    ],
    features: [
      { title: "Lightning Fast", description: "Experience blazing speed with cutting-edge infrastructure" },
      { title: "Ultra Secure", description: "Military-grade encryption keeps your data safe" },
      { title: "AI-Powered", description: "Advanced machine learning adapts to your needs" },
      { title: "Next-Gen UX", description: "Intuitive interfaces for seamless interaction" },
    ],
    contact: {},
    navigation: {
      links: [
        { label: "Features", href: "#features" },
        { label: "Technology", href: "#technology" },
        { label: "About", href: "#about" },
      ],
      ctaLabel: "Get Started",
    },
    hero: {
      eyebrow: `Advanced ${userConfig.industry} Solutions`,
      primaryCta: "Start Your Journey",
      secondaryCta: "Watch Demo",
      scrollHint: "Scroll to explore",
    },
    featuresContent: {
      heading: "Powerful Features",
      subheading: "Built for tomorrow, available today",
      cards: [
        { title: "Lightning Fast", description: "Experience blazing speed with cutting-edge infrastructure" },
        { title: "Ultra Secure", description: "Military-grade encryption keeps your data safe" },
        { title: "AI-Powered", description: "Advanced machine learning adapts to your needs" },
        { title: "Next-Gen UX", description: "Intuitive interfaces for seamless interaction" },
      ],
    },
    technologyContent: {
      heading: "Cutting-Edge Technology",
      description: "Our proprietary quantum neural networks process data at unprecedented speeds, delivering insights in microseconds.",
      metrics: [
        { label: "Processing Speed", value: 98 },
        { label: "Accuracy Rate", value: 99 },
        { label: "Efficiency", value: 96 },
      ],
      ctaLabel: "Explore Technology",
    },
    innovationContent: {
      heading: "Innovation That Matters",
      description: "Join forward-thinking teams already using our platform to revolutionize their operations.",
      ctaLabel: "Schedule a Demo",
    },
    ctaContent: {
      heading: "Ready to Transform?",
      description: "Start your journey into the future. Experience the next evolution of technology.",
      primaryCta: "Get Started Free",
      secondaryCta: "Contact Sales",
      trustMessage: "Trusted by industry leaders worldwide",
    },
    footerContent: {
      description: `Building the future of ${userConfig.industry}, one innovation at a time.`,
      columns: [
        { title: "Product", links: ["Features", "Pricing", "Security", "Enterprise"] },
        { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
        { title: "Connect", links: ["Twitter", "LinkedIn", "GitHub", "Discord"] },
      ],
      copyright: `© 2025 ${userConfig.brandName}. All rights reserved.`,
    },
  };
}

// Default config (will be overridden by window.__BRAND_CONFIG__)
const defaultConfig: BrandConfig = {
  brandName: "NEXUS",
  brandDescription: "The Future of Technology",
  logoUrl: "",
  colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    background: "#0f172a",
    text: "#ffffff",
    white: "#ffffff",
    black: "#000000",
    muted: "rgba(255,255,255,0.75)",
    border: "rgba(255,255,255,0.25)",
    surface: "rgba(15,23,42,0.8)",
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  images: {
    hero: "",
    technology: "",
    innovation: "",
    gallery: [],
  },
  industry: "Technology",
  stats: [
    { value: "99.9%", label: "Uptime" },
    { value: "10M+", label: "Users" },
    { value: "500+", label: "Countries" },
  ],
  features: [
    { title: "Lightning Fast", description: "Experience blazing speed with cutting-edge infrastructure" },
    { title: "Ultra Secure", description: "Military-grade encryption keeps your data safe" },
    { title: "AI-Powered", description: "Advanced machine learning adapts to your needs" },
    { title: "Next-Gen UX", description: "Intuitive interfaces for seamless interaction" },
  ],
  contact: {},
  navigation: {
    links: [
      { label: "Features", href: "#features" },
      { label: "Technology", href: "#technology" },
      { label: "About", href: "#about" },
    ],
    ctaLabel: "Get Started",
  },
  hero: {
    eyebrow: "Advanced Industry Solutions",
    primaryCta: "Start Your Journey",
    secondaryCta: "Watch Demo",
    scrollHint: "Scroll to explore",
  },
  featuresContent: {
    heading: "Powerful Features",
    subheading: "Built for tomorrow, available today",
    cards: [
      { title: "Lightning Fast", description: "Experience blazing speed with cutting-edge infrastructure" },
      { title: "Ultra Secure", description: "Military-grade encryption keeps your data safe" },
      { title: "AI-Powered", description: "Advanced machine learning adapts to your needs" },
      { title: "Next-Gen UX", description: "Intuitive interfaces for seamless interaction" },
    ],
  },
  technologyContent: {
    heading: "Cutting-Edge Technology",
    description: "Our proprietary quantum neural networks process data at unprecedented speeds, delivering insights in microseconds.",
    metrics: [
      { label: "Processing Speed", value: 98 },
      { label: "Accuracy Rate", value: 99 },
      { label: "Efficiency", value: 96 },
    ],
    ctaLabel: "Explore Technology",
  },
  innovationContent: {
    heading: "Innovation That Matters",
    description: "Join forward-thinking teams already using our platform to revolutionize their operations.",
    ctaLabel: "Schedule a Demo",
  },
  ctaContent: {
    heading: "Ready to Transform?",
    description: "Start your journey into the future. Experience the next evolution of technology.",
    primaryCta: "Get Started Free",
    secondaryCta: "Contact Sales",
    trustMessage: "Trusted by industry leaders worldwide",
  },
  footerContent: {
    description: "Building the future of technology, one innovation at a time.",
    columns: [
      { title: "Product", links: ["Features", "Pricing", "Security", "Enterprise"] },
      { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
      { title: "Connect", links: ["Twitter", "LinkedIn", "GitHub", "Discord"] },
    ],
    copyright: "© 2025 NEXUS. All rights reserved.",
  },
};

// Get config from window or use default
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

