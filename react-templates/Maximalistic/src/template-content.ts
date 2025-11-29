import { getBrandConfig } from "./shared-brand-config";

export interface TemplateContent {
  hero: {
    badgeLabel: string;
    highlights: [string, string, string];
    description: string;
    primaryCta: string;
    secondaryCta: string;
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
    }>;
    ctaLabel: string;
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
    socialLinks: Array<{ label: string; url: string }>;
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

const defaultContent: TemplateContent = {
  hero: {
    badgeLabel: "New Collection",
    highlights: ["Bold", "Design", "Maximum Impact"],
    description: "Experience the future of creative design with our vibrant collection.",
    primaryCta: "Explore Now",
    secondaryCta: "Learn More",
    metrics: [
      { value: "1000+", label: "Projects" },
      { value: "100k+", label: "Customers" },
      { value: "24/7", label: "Support" },
    ],
    collageLabels: ["Featured", "New", "Trending"],
  },
  about: {
    badges: ["Creative", "Innovative", "Bold"],
    titleLines: ["We Create", "Maximum Impact"],
    paragraphs: [
      "Our team of creative professionals brings years of experience in design, branding, and digital innovation.",
      "We believe in pushing boundaries and creating designs that not only look stunning but also drive results.",
    ],
    pillars: [
      { title: "Bold Design", description: "Stand out with vibrant aesthetics" },
      { title: "Full Service", description: "Complete creative solutions" },
      { title: "Fast Delivery", description: "Quick turnaround times" },
    ],
  },
  products: {
    badgeLabel: "Our Products",
    headingLines: ["Featured", "Collections"],
    description: "Discover our carefully curated selection of premium products.",
    items: [
      {
        name: "Premium Package",
        description: "Complete solution for your creative needs",
        price: "$299",
        badge: "Popular",
        variant: "primary",
        rating: 4.8,
      },
      {
        name: "Enterprise Suite",
        description: "Advanced features for large teams",
        price: "$599",
        badge: "Pro",
        variant: "secondary",
        rating: 4.9,
      },
      {
        name: "Starter Kit",
        description: "Perfect for getting started",
        price: "$99",
        badge: "New",
        variant: "accent",
        rating: 4.7,
      },
    ],
    ctaLabel: "View All Products",
  },
  testimonials: {
    badgeLabel: "Testimonials",
    headingLines: ["What Our", "Clients Say"],
    entries: [
      {
        name: "Sarah Johnson",
        role: "Creative Director",
        quote: "The design quality exceeded our expectations. Truly remarkable work!",
        rating: 5.0,
      },
      {
        name: "Michael Chen",
        role: "Brand Manager",
        quote: "Outstanding service and incredible attention to detail. Highly recommended!",
        rating: 4.9,
      },
      {
        name: "Emily Rodriguez",
        role: "Marketing Lead",
        quote: "Transformed our brand identity completely. The results speak for themselves.",
        rating: 5.0,
      },
    ],
    stats: [
      { value: "98%", label: "Satisfaction" },
      { value: "500+", label: "Projects" },
      { value: "50+", label: "Awards" },
      { value: "10+", label: "Years" },
    ],
  },
  gallery: {
    badgeLabel: "Gallery",
    headingLines: ["Our Work", "In Action"],
    description: "See how we bring creative visions to life.",
    tiles: Array.from({ length: 12 }, () => ({
      likes: Math.floor(Math.random() * 1000) + 100,
      comments: Math.floor(Math.random() * 100) + 10,
    })),
    ctaLabel: "View Full Gallery",
    videoTitle: "Behind the Scenes",
    videoSubtitle: "See how we create magic",
    videoCta: "Watch Video",
  },
  footer: {
    brandLines: ["VIBRANT", "DESIGN"],
    tagline: "Bold Design, Maximum Impact",
    socialLinks: [
      { label: "Twitter", url: "#" },
      { label: "Instagram", url: "#" },
      { label: "LinkedIn", url: "#" },
    ],
    quickLinks: [
      { label: "About", url: "#" },
      { label: "Services", url: "#" },
      { label: "Portfolio", url: "#" },
      { label: "Contact", url: "#" },
    ],
    contact: {
      address: "123 Creative St, Design City",
      phone: "+1 (555) 123-4567",
      email: "hello@vibrant.design",
    },
    newsletter: {
      intro: "Stay updated with our latest designs",
      placeholder: "Enter your email",
      ctaLabel: "Subscribe",
    },
    hours: {
      heading: "Working Hours",
      details: "Mon-Fri: 9AM-6PM | Sat: 10AM-4PM",
    },
    bottomNote: "Building creative solutions since 2015",
    copyright: "© 2025 VIBRANT. All rights reserved.",
    legalLinks: [
      { label: "Privacy", url: "#" },
      { label: "Terms", url: "#" },
      { label: "Cookies", url: "#" },
    ],
  },
};

export const getTemplateContent = (): TemplateContent => {
  const config = getBrandConfig();
  
  // You can customize content based on brand config if needed
  // For now, return default content
  return defaultContent;
};

