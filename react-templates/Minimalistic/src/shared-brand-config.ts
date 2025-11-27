import type { IconName } from "./icon-registry";

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
  colorPalette: ColorPalette;
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

const defaultConfig: BrandConfig = {
  brandName: "MONO",
  brandDescription: "Pure Design, Timeless Comfort",
  logoUrl: "",
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
    return (window as any).__BRAND_CONFIG__;
  }
  return defaultConfig;
};

