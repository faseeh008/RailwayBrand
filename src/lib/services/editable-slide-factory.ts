import CoverSlide from '$lib/components/editable-slides/CoverSlide.svelte';
import BrandIntroductionSlide from '$lib/components/editable-slides/BrandIntroductionSlide.svelte';
import BrandPositioningSlide from '$lib/components/editable-slides/BrandPositioningSlide.svelte';
import LogoGuidelinesSlide from '$lib/components/editable-slides/LogoGuidelinesSlide.svelte';
import ColorPaletteSlide from '$lib/components/editable-slides/ColorPaletteSlide.svelte';
import TypographySlide from '$lib/components/editable-slides/TypographySlide.svelte';
import IconographySlide from '$lib/components/editable-slides/IconographySlide.svelte';
import PhotographySlide from '$lib/components/editable-slides/PhotographySlide.svelte';
import ApplicationsSlide from '$lib/components/editable-slides/ApplicationsSlide.svelte';
import ThankYouSlide from '$lib/components/editable-slides/ThankYouSlide.svelte';

export interface SlideData {
  id: string;
  type: string;
  title: string;
  data: any;
  order: number;
}

export interface EditableSlide {
  component: any;
  data: SlideData;
}

export function createEditableSlides(brandInput: any): EditableSlide[] {
  const slides: EditableSlide[] = [];
  
  // Cover Slide
  slides.push({
    component: CoverSlide,
    data: {
      id: 'cover',
      type: 'cover',
      title: 'Cover',
      data: {
        brandName: brandInput.brandName || 'Your Brand',
        tagline: brandInput.tagline || 'Brand Guidelines',
        date: new Date().toLocaleDateString(),
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB',
        secondaryColor: brandInput.colors?.secondary?.hex || '#7C3AED'
      },
      order: 1
    }
  });
  
  // Brand Introduction
  slides.push({
    component: BrandIntroductionSlide,
    data: {
      id: 'brand-intro',
      type: 'brand-introduction',
      title: 'Brand Introduction',
      data: {
        title: 'Brand Introduction',
        positioningStatement: brandInput.positioningStatement || 'Your positioning statement goes here. This should clearly communicate what your brand stands for and how it differentiates from competitors.',
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 2
    }
  });
  
  // Brand Positioning
  slides.push({
    component: BrandPositioningSlide,
    data: {
      id: 'brand-positioning',
      type: 'brand-positioning',
      title: 'Brand Positioning',
      data: {
        title: 'BRAND POSITIONING',
        missionTitle: 'MISSION',
        mission: brandInput.mission || 'Your mission statement goes here. This should clearly define your company\'s purpose and what you aim to achieve.',
        visionTitle: 'VISION',
        vision: brandInput.vision || 'Your vision statement goes here. This should describe the future you want to create and your long-term aspirations.',
        valuesTitle: 'CORE VALUES',
        values: brandInput.values || 'Your core values go here. These are the fundamental beliefs that guide your company\'s decisions and actions.',
        personalityTitle: 'TARGET AUDIENCE',
        personality: brandInput.personality || 'Your target audience description goes here. This should define who your ideal customers are and what they care about.',
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 3
    }
  });
  
  // Logo Guidelines
  slides.push({
    component: LogoGuidelinesSlide,
    data: {
      id: 'logo-guidelines',
      type: 'logo-guidelines',
      title: 'Logo Guidelines',
      data: {
        title: 'LOGO GUIDELINES',
        guidelines: [
          {
            title: 'Logo Usage',
            description: 'Use the logo consistently across all materials. Maintain proper spacing and sizing.'
          },
          {
            title: 'Color Variations',
            description: 'The logo can be used in full color, single color, or reversed versions as shown.'
          },
          {
            title: 'Minimum Size',
            description: 'Never use the logo smaller than the minimum size to ensure readability.'
          },
          {
            title: 'Clear Space',
            description: 'Maintain clear space around the logo equal to the height of the logo mark.'
          }
        ],
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 4
    }
  });
  
  // Color Palette
  slides.push({
    component: ColorPaletteSlide,
    data: {
      id: 'color-palette',
      type: 'color-palette',
      title: 'Color Palette',
      data: {
        title: 'COLORS PALETTE',
        colors: [
          {
            name: brandInput.colors?.primary?.name || 'Primary',
            hex: brandInput.colors?.primary?.hex || '#2563EB',
            usage: brandInput.colors?.primary?.usage || 'Primary brand color'
          },
          {
            name: brandInput.colors?.secondary?.name || 'Secondary',
            hex: brandInput.colors?.secondary?.hex || '#7C3AED',
            usage: brandInput.colors?.secondary?.usage || 'Secondary color'
          },
          {
            name: brandInput.colors?.accent?.name || 'Accent',
            hex: brandInput.colors?.accent?.hex || '#F59E0B',
            usage: brandInput.colors?.accent?.usage || 'Accent color'
          },
          {
            name: brandInput.colors?.neutral?.name || 'Neutral',
            hex: brandInput.colors?.neutral?.hex || '#6B7280',
            usage: brandInput.colors?.neutral?.usage || 'Text and borders'
          }
        ]
      },
      order: 5
    }
  });
  
  // Typography
  slides.push({
    component: TypographySlide,
    data: {
      id: 'typography',
      type: 'typography',
      title: 'Typography',
      data: {
        title: 'TYPEFACE',
        primaryFont: brandInput.typography?.primaryFont?.name || 'Arial',
        primarySample: brandInput.typography?.primaryFont?.sample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789',
        secondaryFont: brandInput.typography?.secondaryFont?.name || 'Arial',
        secondarySample: brandInput.typography?.secondaryFont?.sample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789',
        hierarchyTitle: 'TYPOGRAPHY HIERARCHY',
        hierarchyContent: 'H1: 32pt - Main titles\nH2: 24pt - Section headers\nH3: 20pt - Subsection headers\nBody: 16pt - Main content',
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 6
    }
  });
  
  // Iconography
  slides.push({
    component: IconographySlide,
    data: {
      id: 'iconography',
      type: 'iconography',
      title: 'Iconography',
      data: {
        title: 'ICONOGRAPHY',
        icons: [
          {
            name: 'Social Media',
            description: 'Icons for social media platforms',
            usage: 'Use consistently across all social media materials'
          },
          {
            name: 'Navigation',
            description: 'Icons for navigation elements',
            usage: 'Use for menu items and navigation buttons'
          },
          {
            name: 'Actions',
            description: 'Icons for user actions',
            usage: 'Use for buttons and interactive elements'
          }
        ],
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 7
    }
  });
  
  // Photography
  slides.push({
    component: PhotographySlide,
    data: {
      id: 'photography',
      type: 'photography',
      title: 'Photography',
      data: {
        title: 'PHOTOGRAPHY',
        styles: [
          {
            name: 'Corporate',
            description: 'Professional corporate photography style with clean backgrounds and professional lighting.'
          },
          {
            name: 'Lifestyle',
            description: 'Lifestyle photography that shows people using products in natural settings.'
          }
        ],
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 8
    }
  });
  
  // Applications
  slides.push({
    component: ApplicationsSlide,
    data: {
      id: 'applications',
      type: 'applications',
      title: 'Brand Applications',
      data: {
        title: 'BRAND APPLICATIONS',
        applications: [
          {
            name: 'Business Cards',
            description: 'How the brand is applied to business cards and stationery.'
          },
          {
            name: 'Website',
            description: 'Brand application in digital environments and websites.'
          },
          {
            name: 'Marketing Materials',
            description: 'Brand usage in marketing materials and promotional content.'
          }
        ],
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB'
      },
      order: 9
    }
  });
  
  // Thank You
  slides.push({
    component: ThankYouSlide,
    data: {
      id: 'thank-you',
      type: 'thank-you',
      title: 'Thank You',
      data: {
        title: 'THANK YOU',
        subtitle: 'Thank you for your attention',
        contact: 'Contact us for more information',
        primaryColor: brandInput.colors?.primary?.hex || '#2563EB',
        secondaryColor: brandInput.colors?.secondary?.hex || '#7C3AED'
      },
      order: 10
    }
  });
  
  return slides.sort((a, b) => a.data.order - b.data.order);
}

// Export slide components for easy access
export const slideComponents = {
  CoverSlide,
  BrandIntroductionSlide,
  BrandPositioningSlide,
  LogoGuidelinesSlide,
  ColorPaletteSlide,
  TypographySlide,
  IconographySlide,
  PhotographySlide,
  ApplicationsSlide,
  ThankYouSlide
};
