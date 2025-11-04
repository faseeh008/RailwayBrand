/**
 * Brand Input Schema
 * Define all variable inputs needed to generate brand guideline slides
 */

export const brandInputSchema = {
  // ============================================
  // SLIDE 1: COVER SLIDE
  // ============================================
  brandName: {
    type: 'string',
    required: true,
    description: 'The name of the brand',
    example: 'TechFlow'
  },
  
  tagline: {
    type: 'string',
    required: true,
    description: 'Brand tagline or subtitle',
    example: 'Brand Guidelines 2025'
  },
  
  // ============================================
  // SLIDE 2: BRAND POSITIONING
  // ============================================
  mission: {
    type: 'string',
    required: true,
    maxLength: 120,
    description: 'Brand mission statement',
    example: 'To revolutionize technology interaction through intuitive solutions'
  },
  
  vision: {
    type: 'string',
    required: true,
    maxLength: 120,
    description: 'Brand vision statement',
    example: 'A world where technology serves humanity seamlessly'
  },
  
  values: {
    type: 'array',
    required: true,
    minItems: 3,
    maxItems: 6,
    description: 'Core brand values',
    example: ['Innovation', 'Integrity', 'Excellence', 'Collaboration']
  },
  
  personality: {
    type: 'string',
    required: true,
    maxLength: 150,
    description: 'Brand personality description',
    example: 'Modern, innovative, and user-focused. We balance professionalism with approachability.'
  },
  
  // ============================================
  // SLIDE 3: LOGO GUIDELINES
  // ============================================
  logo: {
    type: 'object',
    required: true,
    properties: {
      primaryLogoUrl: {
        type: 'string',
        description: 'URL or path to primary logo',
        example: '/uploads/logos/primary-logo.png'
      },
      minimumSize: {
        type: 'string',
        description: 'Minimum logo size',
        example: '32px'
      },
      clearSpace: {
        type: 'string',
        description: 'Clear space around logo',
        example: '10% padding'
      }
    }
  },
  
  // ============================================
  // SLIDE 4: COLOR PALETTE
  // ============================================
  colors: {
    type: 'object',
    required: true,
    properties: {
      primary: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', example: 'Tech Blue' },
          hex: { type: 'string', example: '#2563EB' },
          rgb: { type: 'string', example: 'RGB(37, 99, 235)' },
          usage: { type: 'string', example: 'Headers, CTAs, Links' }
        }
      },
      secondary: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', example: 'Innovation Purple' },
          hex: { type: 'string', example: '#7C3AED' },
          rgb: { type: 'string', example: 'RGB(124, 58, 237)' },
          usage: { type: 'string', example: 'Accents, Highlights' }
        }
      },
      accent: {
        type: 'object',
        required: false,
        properties: {
          name: { type: 'string', example: 'Success Green' },
          hex: { type: 'string', example: '#10B981' },
          rgb: { type: 'string', example: 'RGB(16, 185, 129)' },
          usage: { type: 'string', example: 'Success states' }
        }
      },
      neutral: {
        type: 'object',
        required: false,
        properties: {
          name: { type: 'string', example: 'Professional Gray' },
          hex: { type: 'string', example: '#6B7280' },
          rgb: { type: 'string', example: 'RGB(107, 114, 128)' },
          usage: { type: 'string', example: 'Body text, Borders' }
        }
      }
    }
  },
  
  // ============================================
  // SLIDE 5: TYPOGRAPHY
  // ============================================
  typography: {
    type: 'object',
    required: true,
    properties: {
      primaryFont: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', example: 'Inter' },
          weights: { type: 'array', example: ['Regular (400)', 'Medium (500)', 'Bold (700)'] },
          usage: { type: 'string', example: 'Headlines, Buttons, UI Elements' }
        }
      },
      secondaryFont: {
        type: 'object',
        required: true,
        properties: {
          name: { type: 'string', example: 'Source Sans Pro' },
          weights: { type: 'array', example: ['Regular (400)', 'SemiBold (600)'] },
          usage: { type: 'string', example: 'Body text, Captions, Descriptions' }
        }
      }
    }
  },
  
  // ============================================
  // SLIDE 6: ICONOGRAPHY
  // ============================================
  iconography: {
    type: 'object',
    required: false,
    properties: {
      style: {
        type: 'string',
        description: 'Icon style description',
        example: 'Rounded, friendly icons that match our brand personality'
      },
      strokeWeight: {
        type: 'string',
        description: 'Icon stroke weight',
        example: '2px'
      },
      sizeRange: {
        type: 'string',
        description: 'Icon size range',
        example: '24px–48px'
      }
    }
  },
  
  // ============================================
  // SLIDE 7: PHOTOGRAPHY
  // ============================================
  photography: {
    type: 'object',
    required: false,
    properties: {
      style: {
        type: 'array',
        description: 'Photography style guidelines',
        example: [
          'Natural, authentic moments',
          'Bright, well-lit environments',
          'Warm, inviting tones',
          'Diverse, inclusive representation'
        ]
      },
      dos: {
        type: 'string',
        description: 'Photography dos',
        example: 'Use natural lighting & authentic scenes'
      },
      donts: {
        type: 'string',
        description: 'Photography don\'ts',
        example: 'Avoid staged poses & heavy filters'
      }
    }
  },
  
  // ============================================
  // SLIDE 8: APPLICATIONS
  // ============================================
  applications: {
    type: 'array',
    required: false,
    description: 'Brand application areas',
    example: [
      { name: 'Business Cards', icon: '📄', description: 'Professional cards with logo, brand colors, and typography' },
      { name: 'Website', icon: '🌐', description: 'Digital presence with consistent brand identity' },
      { name: 'Social Media', icon: '📱', description: 'Posts, stories, and profile graphics' }
    ]
  },
  
  // ============================================
  // SLIDE 9: CLOSING/THANK YOU
  // ============================================
  contact: {
    type: 'object',
    required: true,
    properties: {
      website: { type: 'string', example: 'www.techflow.com' },
      email: { type: 'string', example: 'hello@techflow.com' },
      phone: { type: 'string', example: '+1 (555) 123-4567', required: false }
    }
  }
};

// ============================================
// SAMPLE BRAND INPUT DATA
// ============================================
export const sampleBrandInput = {
  // Cover
  brandName: "TechFlow",
  tagline: "Brand Guidelines 2025",
  
  // Brand Positioning
  mission: "To revolutionize technology interaction through intuitive solutions",
  vision: "A world where technology serves humanity seamlessly",
  values: ["Innovation", "Integrity", "Excellence", "Collaboration"],
  personality: "Modern, innovative, and user-focused. We balance professionalism with approachability.",
  
  // Logo Guidelines
  logo: {
    primaryLogoUrl: null, // Will use brand name as placeholder
    minimumSize: "32px",
    clearSpace: "10% padding"
  },
  
  // Color Palette
  colors: {
    primary: {
      name: "Tech Blue",
      hex: "#2563EB",
      rgb: "RGB(37, 99, 235)",
      usage: "Headers, CTAs, Links"
    },
    secondary: {
      name: "Innovation Purple",
      hex: "#7C3AED",
      rgb: "RGB(124, 58, 237)",
      usage: "Accents, Highlights"
    },
    accent: {
      name: "Success Green",
      hex: "#10B981",
      rgb: "RGB(16, 185, 129)",
      usage: "Success states, Positive feedback"
    },
    neutral: {
      name: "Professional Gray",
      hex: "#6B7280",
      rgb: "RGB(107, 114, 128)",
      usage: "Body text, Borders, Backgrounds"
    }
  },
  
  // Typography
  typography: {
    primaryFont: {
      name: "Inter",
      weights: ["Regular (400)", "Medium (500)", "Bold (700)"],
      usage: "Headlines, Buttons, UI Elements"
    },
    secondaryFont: {
      name: "Source Sans Pro",
      weights: ["Regular (400)", "SemiBold (600)"],
      usage: "Body text, Captions, Descriptions"
    }
  },
  
  // Iconography
  iconography: {
    style: "Rounded, friendly icons that match our brand personality",
    strokeWeight: "2px",
    sizeRange: "24px–48px"
  },
  
  // Photography
  photography: {
    style: [
      "Natural, authentic moments",
      "Bright, well-lit environments",
      "Warm, inviting tones",
      "Diverse, inclusive representation",
      "Professional yet approachable"
    ],
    dos: "Use natural lighting & authentic scenes",
    donts: "Avoid staged poses & heavy filters"
  },
  
  // Applications
  applications: [
    { name: "Business Cards", icon: "📄", description: "Professional cards with logo, brand colors, and typography" },
    { name: "Website", icon: "🌐", description: "Digital presence with consistent brand identity" },
    { name: "Social Media", icon: "📱", description: "Posts, stories, and profile graphics" },
    { name: "Email Templates", icon: "📧", description: "Branded email signatures and campaigns" },
    { name: "Presentations", icon: "📊", description: "Pitch decks and slide templates" },
    { name: "Packaging", icon: "📦", description: "Product packaging and labels" }
  ],
  
  // Contact
  contact: {
    website: "www.techflow.com",
    email: "hello@techflow.com",
    phone: "+1 (555) 123-4567"
  }
};

