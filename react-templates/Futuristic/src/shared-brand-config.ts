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

export interface BrandConfig {
  brandName: string;
  brandDescription: string;
  logoUrl: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
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

// Default config (will be overridden by window.__BRAND_CONFIG__)
const defaultConfig: BrandConfig = {
  brandName: "NEXUS",
  brandDescription: "The Future of Technology",
  logoUrl: "",
  colorPalette: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    background: "#0f172a",
    text: "#ffffff",
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
    return (window as any).__BRAND_CONFIG__;
  }
  return defaultConfig;
};

