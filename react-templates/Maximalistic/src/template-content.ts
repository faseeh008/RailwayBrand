import { getBrandConfig } from "./shared-brand-config";

export interface TemplateContent {
  hero: {
    badgeLabel: string;
    highlights: [string, string, string];
    description: string;
    primaryCta: string;
    primaryCtaIcon?: string;
    secondaryCta: string;
    secondaryCtaIcon?: string;
    metrics: Array<{ value: string; label: string }>;
    collageLabels: [string, string, string];
  };
  about: {
    badges: string[];
    titleLines: string[];
    paragraphs: string[];
    pillars: Array<{ title: string; description: string }>;
  };
  products: {
    badgeLabel: string;
    headingLines: string[];
    description: string;
    items: Array<{
      name: string;
      description: string;
      price: string;
      badge: string;
      variant: "primary" | "secondary" | "accent";
      imageIndex?: number;
      rating: number;
      icon?: string;
    }>;
    ctaLabel: string;
    ctaIcon?: string;
  };
  testimonials: {
    badgeLabel: string;
    headingLines: string[];
    entries: Array<{
      name: string;
      role: string;
      quote: string;
      rating: number;
      imageIndex?: number;
    }>;
    stats: Array<{ value: string; label: string }>;
  };
  gallery: {
    badgeLabel: string;
    headingLines: string[];
    description: string;
    tiles: Array<{
      likes: number;
      comments: number;
    }>;
    ctaLabel: string;
    videoTitle: string;
    videoSubtitle: string;
    videoCta: string;
  };
  footer: {
    brandLines: [string, string];
    tagline: string;
    socialLinks: Array<{ label: string; url: string; icon?: string }>;
    quickLinks: Array<{ label: string; url: string }>;
    contact: {
      address: string;
      phone: string;
      email: string;
    };
    newsletter: {
      intro: string;
      placeholder: string;
      ctaLabel: string;
    };
    hours: {
      heading: string;
      details: string;
    };
    bottomNote: string;
    copyright: string;
    legalLinks: Array<{ label: string; url: string }>;
  };
}

export const getTemplateContent = (): TemplateContent => {
  const config = getBrandConfig();
  
  // Get content from brand config (injected by mock-page-builder)
  if (!config.templateContent) {
    throw new Error("Template content not found. Please ensure window.__BRAND_CONFIG__.templateContent is set by the mock-page-builder.");
  }
  
  return config.templateContent as TemplateContent;
};

