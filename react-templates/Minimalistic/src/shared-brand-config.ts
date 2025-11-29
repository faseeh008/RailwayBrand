import type { IconName } from "./icon-registry";

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
  menuIcon: IconName;
  closeIcon: IconName;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; icon?: IconName };
  secondaryCta: { label: string };
}

export interface AboutContent {
  title: string;
  description: string;
  highlights: string[];
  highlightIcon?: IconName;
}

export interface ServicesContent {
  title: string;
  subtitle: string;
  items: Array<{ title: string; description: string; icon?: IconName }>;
}

export interface FooterContent {
  columns: Array<{
    title: string;
    links: Array<{ label: string; href?: string }>;
  }>;
  social: Array<{ icon: IconName; href: string; label: string }>;
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
      : { r: 10, g: 10, b: 10 };
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
    brandDescription: `Pure Design, Timeless Comfort - ${userConfig.industry}`,
    logoUrl: "",
    colorPalette,
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
      { value: "500+", label: "Products" },
      { value: "50k+", label: "Happy Homes" },
      { value: "Free", label: "Delivery" },
    ],
    navigation: {
      links: [
        { label: "Products", href: "#" },
        { label: "Collections", href: "#" },
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
      ],
      cartLabel: "Cart",
      primaryCtaLabel: "Shop Now",
      mobileCtaLabel: "Get Started",
      menuIcon: "Menu",
      closeIcon: "X",
    },
    heroContent: {
      eyebrow: `${userConfig.industry} Excellence`,
      headline: "Pure design. Timeless comfort.",
      subheadline: "Each collection is crafted to bring balance and warmth into modern spaces.",
      primaryCta: { label: "Explore Collection", icon: "ArrowRight" },
      secondaryCta: { label: "Learn More" },
    },
    aboutContent: {
      title: `Why Choose ${userConfig.brandName}`,
      description: "We combine natural materials with modern silhouettes to create adaptable, lasting pieces.",
      highlights: [
        "Premium quality and service",
        "Expert team and support",
        "Trusted by thousands",
        "Innovative solutions",
        "Customer satisfaction guaranteed",
        "Professional consultation",
      ],
      highlightIcon: "CheckCircle2",
    },
    servicesContent: {
      title: "Our Services",
      subtitle: "Discover what makes us unique",
      items: [
        { title: "Custom Solutions", description: "Tailored designs built for your space", icon: "Sofa" },
        { title: "Quality Products", description: "Refined details with premium materials", icon: "Armchair" },
        { title: "Expert Service", description: "Professional consultation and support", icon: "Table2" },
        { title: "Fast Delivery", description: "Quick and reliable shipping", icon: "Lamp" },
        { title: "Warranty", description: "Comprehensive coverage for peace of mind", icon: "Bed" },
        { title: "Support", description: "Dedicated customer service team", icon: "ShoppingBag" },
      ],
    },
    footerContent: {
      columns: [
        {
          title: "Products",
          links: [
            { label: "Collections", href: "#" },
            { label: "New Arrivals", href: "#" },
            { label: "Featured", href: "#" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "Blog", href: "#" },
            { label: "Guides", href: "#" },
            { label: "Support", href: "#" },
          ],
        },
        {
          title: "Policies",
          links: [
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
          ],
        },
      ],
      social: [
        { icon: "Twitter", href: "#", label: "Twitter" },
        { icon: "Github", href: "#", label: "Github" },
        { icon: "Linkedin", href: "#", label: "LinkedIn" },
        { icon: "Mail", href: "#", label: "Email" },
      ],
      legalText: `© {year} ${userConfig.brandName}. All rights reserved.`,
    },
    contact: {
      title: "Contact",
    },
  };
}

const defaultConfig: BrandConfig = {
  brandName: "MONO",
  brandDescription: "Pure Design, Timeless Comfort",
  logoUrl: "",
  colors: {
    primary: "#0a0a0a",
    secondary: "#171717",
    accent: "#404040",
    background: "#ffffff",
    text: "#0a0a0a",
    white: "#ffffff",
    black: "#000000",
    surface: "#f7f7f7",
    border: "rgba(0, 0, 0, 0.1)",
    mutedText: "rgba(10,10,10,0.7)",
  },
  colorPalette: {
    primary: "#0a0a0a",
    primaryForeground: "#ffffff",
    secondary: "#171717",
    secondaryForeground: "#ffffff",
    accent: "#404040",
    accentForeground: "#ffffff",
    background: "#ffffff",
    surface: "#f7f7f7",
    border: "rgba(0, 0, 0, 0.1)",
    text: "#0a0a0a",
    mutedText: "rgba(10,10,10,0.7)",
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
  industry: "Furniture",
  stats: [
    { value: "500+", label: "Products" },
    { value: "50k+", label: "Happy Homes" },
    { value: "Free", label: "Delivery" },
  ],
  navigation: {
    links: [
      { label: "Sofas", href: "#" },
      { label: "Chairs", href: "#" },
      { label: "Tables", href: "#" },
      { label: "Collections", href: "#" },
    ],
    cartLabel: "Cart",
    primaryCtaLabel: "Shop Now",
    mobileCtaLabel: "Get Started",
    menuIcon: "Menu",
    closeIcon: "X",
  },
  heroContent: {
    eyebrow: "Furniture Excellence",
    headline: "Pure design. Timeless comfort.",
    subheadline: "Each collection is crafted to bring balance and warmth into modern spaces.",
    primaryCta: { label: "Explore Collection", icon: "ArrowRight" },
    secondaryCta: { label: "Learn More" },
  },
  aboutContent: {
    title: "Why Choose MONO",
    description: "We combine natural materials with modern silhouettes to create adaptable, lasting pieces.",
    highlights: [
      "Premium quality and service",
      "Expert team and support",
      "Trusted by thousands",
      "Innovative solutions",
      "Customer satisfaction guaranteed",
      "Professional consultation",
    ],
    highlightIcon: "CheckCircle2",
  },
  servicesContent: {
    title: "Our Services",
    subtitle: "Discover what makes us unique",
    items: [
      { title: "Custom Sofas", description: "Tailored silhouettes built for your space", icon: "Sofa" },
      { title: "Comfort Chairs", description: "Ergonomic seating with refined details", icon: "Armchair" },
      { title: "Dining Tables", description: "Durable finishes for everyday gatherings", icon: "Table2" },
      { title: "Ambient Lighting", description: "Lighting concepts that set a calm mood", icon: "Lamp" },
      { title: "Bedroom Sets", description: "Layered textures for restorative rest", icon: "Bed" },
      { title: "Lifestyle Shop", description: "Curated objects that complete the look", icon: "ShoppingBag" },
    ],
  },
  footerContent: {
    columns: [
      {
        title: "Products",
        links: [
          { label: "Living", href: "#" },
          { label: "Dining", href: "#" },
          { label: "Outdoor", href: "#" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "#" },
          { label: "Careers", href: "#" },
          { label: "Press", href: "#" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Journal", href: "#" },
          { label: "Guides", href: "#" },
          { label: "Support", href: "#" },
        ],
      },
      {
        title: "Policies",
        links: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of Service", href: "#" },
        ],
      },
    ],
    social: [
      { icon: "Twitter", href: "#", label: "Twitter" },
      { icon: "Github", href: "#", label: "Github" },
      { icon: "Linkedin", href: "#", label: "LinkedIn" },
      { icon: "Mail", href: "#", label: "Email" },
    ],
    legalText: "© {year} {brand}. All rights reserved.",
  },
  contact: {
    title: "Contact",
  },
};

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
  return defaultConfig;
};

