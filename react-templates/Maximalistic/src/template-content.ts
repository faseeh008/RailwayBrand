export interface TemplateContent {
  hero: {
    badgeLabel: string;
    highlights: string[];
    description: string;
    primaryCta: string;
    primaryCtaIcon?: string;
    secondaryCta: string;
    secondaryCtaIcon?: string;
    metrics: Array<{ value: string; label: string }>;
    collageLabels: string[];
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
    ctaLabel: string;
    ctaIcon?: string;
    items: Array<{
      name: string;
      description: string;
      price: string;
      badge: string;
      rating: number;
      imageIndex?: number;
      variant: "primary" | "secondary" | "accent";
      icon?: string;
    }>;
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
    ctaLabel: string;
    tiles: Array<{ likes: number; comments: number; imageIndex?: number }>;
    videoTitle: string;
    videoSubtitle: string;
    videoCta: string;
  };
  footer: {
    brandLines: string[];
    tagline: string;
    socialLinks: Array<{ label: string; url: string; icon?: string }>;
    quickLinks: Array<{ label: string; url: string }>;
    contact: {
      address: string;
      phone: string;
      email: string;
    };
    newsletter: {
      placeholder: string;
      intro: string;
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

const defaultContent: TemplateContent = {
  hero: {
    badgeLabel: "Established • 2020",
    highlights: ["VIBRANT", "EXPERIENCES", "EVERY PLATE"],
    description:
      "Handcrafted menus inspired by bold palettes and generous hospitality. We design culinary memories that stay with your guests long after the last bite.",
    primaryCta: "Plan A Tasting",
    secondaryCta: "Browse Menu",
    metrics: [
      { value: "500+", label: "Clients" },
      { value: "75", label: "Signature Plates" },
      { value: "4.9", label: "Satisfaction Score" },
    ],
    collageLabels: ["Seasonal", "Limited", "Chef's Pick"],
  },
  about: {
    badges: ["Award Winning", "Sustainably Sourced", "Chef Led"],
    titleLines: ["Culinary Storytelling", "Crafted For Bold Brands"],
    paragraphs: [
      "Born from a studio mindset, our kitchen collaborates with creative directors, brand teams, and hospitality partners to translate vision into immersive menus.",
      "We pair local farmers with global techniques so every course layers color, texture, and flavor with intention.",
    ],
    pillars: [
      { title: "Creative Labs", description: "Immersive tastings that co-create direction with your team." },
      { title: "Daily Harvest", description: "Produce, grains, and proteins sourced within 150 miles." },
      { title: "Responsive Service", description: "Agile production schedules and dedicated point partners." },
      { title: "Legacy Craft", description: "Recipes refined across generations of culinary mentors." },
    ],
  },
  products: {
    badgeLabel: "Menu Capsules",
    headingLines: ["Signature Sets", "Curated For Launches"],
    description: "Modular dishes engineered for press previews, pop-ups, and retail experiences.",
    ctaLabel: "View Full Menu",
    items: [
      {
        name: "Layered Citrus Stack",
        description: "Compressed fruit, citrus gel, micro herbs.",
        price: "$18",
        badge: "Seasonal",
        rating: 4.9,
        imageIndex: 0,
        variant: "primary",
      },
      {
        name: "Midnight Pasta Kit",
        description: "Charred tomato sugo, hand-cut pasta, smoked salt.",
        price: "$22",
        badge: "New",
        rating: 4.8,
        imageIndex: 1,
        variant: "secondary",
      },
      {
        name: "Textured Dessert Bar",
        description: "Three-layer mousse, sable crunch, citrus mist.",
        price: "$14",
        badge: "Studio Favorite",
        rating: 5,
        imageIndex: 2,
        variant: "accent",
      },
      {
        name: "Charred Garden Platter",
        description: "Smoked roots, fermented vinaigrette, toasted seeds.",
        price: "$24",
        badge: "Plant Forward",
        rating: 4.7,
        imageIndex: 3,
        variant: "primary",
      },
      {
        name: "Heritage Broth Bowl",
        description: "Slow steeped broth, hand-pulled noodles, aromatic oil.",
        price: "$20",
        badge: "Comfort",
        rating: 4.8,
        imageIndex: 4,
        variant: "secondary",
      },
      {
        name: "Studio Sampler",
        description: "Chef curated bites highlighting the current collection.",
        price: "$30",
        badge: "Limited",
        rating: 5,
        imageIndex: 5,
        variant: "accent",
      },
    ],
  },
  testimonials: {
    badgeLabel: "Partner Feedback",
    headingLines: ["What collaborators share", "after each activation"],
    entries: [
      {
        name: "Allison Park",
        role: "Experiential Director",
        quote:
          "They translate brand language into flavor better than any culinary partner we have worked with.",
        rating: 5,
        imageIndex: 0,
      },
      {
        name: "Marcus Reed",
        role: "Hospitality Lead",
        quote:
          "The team is agile, thoughtful, and deeply invested in every audience touchpoint.",
        rating: 5,
        imageIndex: 1,
      },
      {
        name: "Helena Cruz",
        role: "Creative Producer",
        quote:
          "Every tasting feels bespoke. They are collaborators in the truest sense.",
        rating: 5,
        imageIndex: 2,
      },
    ],
    stats: [
      { value: "92%", label: "Repeat Partnerships" },
      { value: "48h", label: "Average Response" },
      { value: "120+", label: "Launch Events" },
      { value: "30", label: "Cities Served" },
    ],
  },
  gallery: {
    badgeLabel: "Field Notes",
    headingLines: ["Recent activations", "across our network"],
    description: "A rotating feed capturing plating runs, R&D sessions, and studio drops.",
    ctaLabel: "View live feed",
    tiles: [
      { likes: 1200, comments: 42, imageIndex: 0 },
      { likes: 980, comments: 33, imageIndex: 1 },
      { likes: 1540, comments: 61, imageIndex: 2 },
      { likes: 860, comments: 24, imageIndex: 3 },
      { likes: 1320, comments: 48, imageIndex: 4 },
      { likes: 1010, comments: 29, imageIndex: 5 },
    ],
    videoTitle: "Studio Lab Session",
    videoSubtitle: "A behind-the-scenes look at our iterative plating workflow.",
    videoCta: "Play highlight reel",
  },
  footer: {
    brandLines: ["Vibrant", "Studios"],
    tagline: "Culinary direction for ambitious brands.",
    socialLinks: [
      { label: "Instagram", url: "#" },
      { label: "LinkedIn", url: "#" },
      { label: "Pinterest", url: "#" },
    ],
    quickLinks: [
      { label: "About", url: "#" },
      { label: "Capabilities", url: "#" },
      { label: "Studios", url: "#" },
      { label: "Press", url: "#" },
      { label: "Careers", url: "#" },
      { label: "Contact", url: "#" },
    ],
    contact: {
      address: "129 Spring Street, Suite 4, New York, NY",
      phone: "+1 (212) 555-0198",
      email: "hello@vibrant.studio",
    },
    newsletter: {
      placeholder: "Enter email address",
      intro: "Monthly recaps of releases, residencies, and menu drops.",
      ctaLabel: "Join the list",
    },
    hours: {
      heading: "Studio availability",
      details: "Mon–Fri • 9a–8p  |  Sat • 10a–4p",
    },
    bottomNote: "Crafted in partnership with our culinary collective.",
    copyright: "© 2025 Vibrant Studios. All rights reserved.",
    legalLinks: [
      { label: "Privacy", url: "#" },
      { label: "Terms", url: "#" },
    ],
  },
};

export const getTemplateContent = (): TemplateContent => {
  if (typeof window !== "undefined" && (window as any).__BRAND_CONFIG__) {
    const brandConfig = (window as any).__BRAND_CONFIG__;
    if (brandConfig.templateContent) {
      return brandConfig.templateContent;
    }
  }

  // Fallback to default only if no config is available
  // This should rarely happen as buildMaximalistic.ts always injects templateContent
  return defaultContent;
};

