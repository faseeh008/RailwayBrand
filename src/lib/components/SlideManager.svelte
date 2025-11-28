<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import {
    CoverSlide as DefaultCoverSlide,
    BrandIntroductionSlide as DefaultBrandIntroductionSlide,
    BrandPositioningSlide as DefaultBrandPositioningSlide,
    LogoGuidelinesSlide as DefaultLogoGuidelinesSlide,
    ColorPaletteSlide as DefaultColorPaletteSlide,
    TypographySlide as DefaultTypographySlide,
    IconographySlide as DefaultIconographySlide,
    PhotographySlide as DefaultPhotographySlide,
    ApplicationsSlide as DefaultApplicationsSlide,
    LogoDosSlide as DefaultLogoDosSlide,
    LogoDontsSlide as DefaultLogoDontsSlide,
    ThankYouSlide as DefaultThankYouSlide
  } from '../../../templates_svelte/default';
  import {
    CoverSlide as MinimalistCoverSlide,
    BrandIntroductionSlide as MinimalistBrandIntroductionSlide,
    BrandPositioningSlide as MinimalistBrandPositioningSlide,
    ContentsSlide as MinimalistContentsSlide,
    LogoOverviewSlide as MinimalistLogoOverviewSlide,
    LogoShowcaseSlide as MinimalistLogoShowcaseSlide,
    TypographyHeroSlide as MinimalistTypographyHeroSlide,
    TypographyDetailsSlide as MinimalistTypographyDetailsSlide,
    ColorPaletteSlide as MinimalistColorPaletteSlide,
    ColorUsageSlide as MinimalistColorUsageSlide,
    SocialMediaSlide as MinimalistSocialMediaSlide,
    InspirationSlide as MinimalistInspirationSlide,
    MoodboardSlide as MinimalistMoodboardSlide,
    ThankYouSlide as MinimalistThankYouSlide
  } from '../../../templates_svelte/minimalist';
  import {
    CoverSlide as FunkyCoverSlide,
    TableOfContentsSlide as FunkyTableOfContentsSlide,
    BrandStorySlide as FunkyBrandStorySlide,
    MoodboardSlide as FunkyMoodboardSlide,
    PlanSlide as FunkyPlanSlide,
    ProductSlide as FunkyProductSlide,
    TeamSlide as FunkyTeamSlide,
    PaletteSlide as FunkyPaletteSlide,
    LogoVariationsSlide as FunkyLogoVariationsSlide,
    TypographySlide as FunkyTypographySlide,
    ContactSlide as FunkyContactSlide,
    BrandPositioningSlide as FunkyBrandPositioningSlide
  } from '../../../templates_svelte/funky';
  import { defaultFunkyTheme, type FunkyTheme } from '../../../templates_svelte/funky/theme';
  import { convertSvelteSlidesToPptx } from '$lib/services/svelte-slide-to-pptx';
  import type { SlideData } from '$lib/types/slide-data';
  import EditingPanel from './EditingPanel.svelte';
  
  const defaultSlideComponents = {
    CoverSlide: DefaultCoverSlide,
    BrandIntroductionSlide: DefaultBrandIntroductionSlide,
    BrandPositioningSlide: DefaultBrandPositioningSlide,
    LogoGuidelinesSlide: DefaultLogoGuidelinesSlide,
    ColorPaletteSlide: DefaultColorPaletteSlide,
    TypographySlide: DefaultTypographySlide,
    IconographySlide: DefaultIconographySlide,
    PhotographySlide: DefaultPhotographySlide,
    ApplicationsSlide: DefaultApplicationsSlide,
    LogoDosSlide: DefaultLogoDosSlide,
    LogoDontsSlide: DefaultLogoDontsSlide,
    ThankYouSlide: DefaultThankYouSlide
  } as const;
  
  const minimalistSlideComponents = {
    CoverSlide: MinimalistCoverSlide,
    BrandIntroductionSlide: MinimalistBrandIntroductionSlide,
    BrandPositioningSlide: MinimalistBrandPositioningSlide,
    ContentsSlide: MinimalistContentsSlide,
    LogoOverviewSlide: MinimalistLogoOverviewSlide,
    LogoShowcaseSlide: MinimalistLogoShowcaseSlide,
    TypographyHeroSlide: MinimalistTypographyHeroSlide,
    TypographyDetailsSlide: MinimalistTypographyDetailsSlide,
    ColorPaletteSlide: MinimalistColorPaletteSlide,
    ColorUsageSlide: MinimalistColorUsageSlide,
    SocialMediaSlide: MinimalistSocialMediaSlide,
    InspirationSlide: MinimalistInspirationSlide,
    MoodboardSlide: MinimalistMoodboardSlide,
    ThankYouSlide: MinimalistThankYouSlide
  } as const;
  
  const funkySlideComponents = {
    CoverSlide: FunkyCoverSlide,
    TableOfContentsSlide: FunkyTableOfContentsSlide,
    BrandStorySlide: FunkyBrandStorySlide,
    MoodboardSlide: FunkyMoodboardSlide,
    PlanSlide: FunkyPlanSlide,
    ProductSlide: FunkyProductSlide,
    TeamSlide: FunkyTeamSlide,
    PaletteSlide: FunkyPaletteSlide,
    LogoVariationsSlide: FunkyLogoVariationsSlide,
    TypographySlide: FunkyTypographySlide,
    ContactSlide: FunkyContactSlide,
    BrandPositioningSlide: FunkyBrandPositioningSlide
  } as const;
  
  export const slideComponentSets = {
    default: defaultSlideComponents,
    minimalist: minimalistSlideComponents,
    funky: funkySlideComponents
  } as const;
  
  export type SlideVibe = keyof typeof slideComponentSets;
  
  const {
    CoverSlide,
    BrandIntroductionSlide,
    BrandPositioningSlide,
    LogoGuidelinesSlide,
    ColorPaletteSlide,
    TypographySlide,
    IconographySlide,
    PhotographySlide,
    ApplicationsSlide,
    LogoDosSlide,
    LogoDontsSlide,
    ThankYouSlide
  } = defaultSlideComponents;
  
  export let brandData: any = null;
  export let slideVibe: SlideVibe | null = null;
  
  // Component refs
  let coverSlideRef: CoverSlide;
  let brandIntroRef: BrandIntroductionSlide;
  let brandPositioningRef: BrandPositioningSlide;
  let logoGuidelinesRef: LogoGuidelinesSlide;
  let colorPaletteRef: ColorPaletteSlide;
  let typographyRef: TypographySlide;
  let iconographyRef: IconographySlide;
  let photographyRef: PhotographySlide;
  let applicationsRef: ApplicationsSlide;
  let logoDosRef: LogoDosSlide;
  let logoDontsRef: LogoDontsSlide;
  let thankYouRef: ThankYouSlide;
  let minimalistCoverRef: MinimalistCoverSlide;
  let minimalistBrandIntroductionRef: MinimalistBrandIntroductionSlide;
  let minimalistBrandPositioningRef: MinimalistBrandPositioningSlide;
  let minimalistContentsRef: MinimalistContentsSlide;
  let minimalistLogoOverviewRef: MinimalistLogoOverviewSlide;
  let minimalistLogoShowcaseRef: MinimalistLogoShowcaseSlide;
  let minimalistTypographyHeroRef: MinimalistTypographyHeroSlide;
  let minimalistTypographyDetailsRef: MinimalistTypographyDetailsSlide;
  let minimalistColorPaletteRef: MinimalistColorPaletteSlide;
  let minimalistColorUsageRef: MinimalistColorUsageSlide;
  let minimalistSocialMediaRef: MinimalistSocialMediaSlide;
  let minimalistInspirationRef: MinimalistInspirationSlide;
  let minimalistMoodboardRef: MinimalistMoodboardSlide;
  let minimalistThankYouRef: MinimalistThankYouSlide;
  let funkyCoverRef: FunkyCoverSlide;
  let funkyTableOfContentsRef: FunkyTableOfContentsSlide;
  let funkyBrandStoryRef: FunkyBrandStorySlide;
  let funkyMoodboardRef: FunkyMoodboardSlide;
  let funkyPlanRef: FunkyPlanSlide;
  let funkyProductRef: FunkyProductSlide;
  let funkyTeamRef: FunkyTeamSlide;
  let funkyPaletteRef: FunkyPaletteSlide;
  let funkyBrandPositioningRef: FunkyBrandPositioningSlide;
  let funkyLogoVariationsRef: FunkyLogoVariationsSlide;
  let funkyTypographyRef: FunkyTypographySlide;
  let funkyContactRef: FunkyContactSlide;
  
  // State
  let currentSlideIndex = 0;
  let isEditable = false;
  let isDownloading = false;
  let downloadProgress = { current: 0, total: 0 };
  let showEditingPanel = false;
  let editingPanelData: any = {};
  
  // Get current slide name
  $: currentSlideName = slides[currentSlideIndex]?.name || '';
  
  // Get current slide's background (reactive to both slide index and background changes)
  $: currentSlideBackground = effectiveSlideVibe === 'default'
    ? (slideBackgrounds[currentSlideIndex] || getDefaultBackground(currentSlideIndex))
    : null;
  
  // Update editing panel data when slide changes or isEditable changes
  $: if (isEditable && currentSlideIndex !== undefined) {
    updateEditingPanelData();
  }
  
  function updateEditingPanelData() {
    // Get current slide's background or create default
    const currentBackground = slideBackgrounds[currentSlideIndex] || getDefaultBackground(currentSlideIndex);
    
    editingPanelData = {
      brandName,
      tagline,
      primaryColor,
      secondaryColor,
      color2,
      color3,
      logoData,
      logoUrl,
      positioningStatement,
      mission,
      vision,
      values,
      personality,
      targetAudience,
      colors,
      primaryFont,
      secondaryFont,
      primaryWeights,
      secondaryWeights,
      icons,
      applications,
      website,
      email,
      phone,
      thankYouText,
      subtitleText,
      hierarchyH1,
      hierarchyH2,
      hierarchyH3,
      hierarchyBody,
      photoLabel1,
      photoLabel2,
      photoLabel3,
      photoLabel4,
      photoEmoji1,
      photoEmoji2,
      photoEmoji3,
      photoEmoji4,
      guidelineTitle1,
      guidelineItems,
      guidelineTitle2,
      doText,
      dontText,
      background: currentBackground
    };
  }
  
  // Helper function to get default background for each slide
  function getDefaultBackground(slideIndex: number): {
    type: 'color' | 'gradient';
    color?: string;
    gradient?: {
      colors: string[];
      direction: number;
    };
  } {
    if (effectiveSlideVibe === 'minimalist') {
      return {
        type: 'color',
        color: 'FFFFFF'
      };
    }
    switch (slideIndex) {
      case 0: // Cover
        // HTML template: linear-gradient(135deg, {{PRIMARY_COLOR}} 0%, {{COLOR_2_HEX}} 30%, {{COLOR_3_HEX}} 60%, {{SECONDARY_COLOR}} 100%)
        return {
          type: 'gradient',
          gradient: {
            colors: [color1Hex, color2Hex, color3Hex, color4Hex],
            direction: 135
          }
        };
      case 1: // Brand Introduction
        return {
          type: 'gradient',
          gradient: {
            colors: [color1Lighter, color2Lighter, color3Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 2: // Brand Positioning
        return {
          type: 'gradient',
          gradient: {
            colors: [color2Lighter, color3Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 3: // Logo Guidelines
        return {
          type: 'gradient',
          gradient: {
            colors: [color1Lighter, color2Lighter, '#FFFFFF', color3Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 4: // Logo Do's
        return {
          type: 'gradient',
          gradient: {
            colors: [color1Lighter, color2Lighter, '#FFFFFF', color3Lighter, color4Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 5: // Logo Don'ts
        return {
          type: 'gradient',
          gradient: {
            colors: [color2Lighter, color3Lighter, '#FFFFFF', color4Lighter, color5Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 6: // Color Palette
        return {
          type: 'gradient',
          gradient: {
            colors: [color1Lighter, color2Lighter, '#FFFFFF', color3Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 7: // Typography
        return {
          type: 'gradient',
          gradient: {
            colors: [color4Lighter, color5Lighter, '#FFFFFF', color6Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 8: // Iconography
        return {
          type: 'gradient',
          gradient: {
            colors: [color5Lighter, color6Lighter, '#FFFFFF', color7Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 9: // Photography
        return {
          type: 'gradient',
          gradient: {
            colors: [color6Lighter, color7Lighter, '#FFFFFF', color8Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 10: // Applications
        return {
          type: 'gradient',
          gradient: {
            colors: [color7Lighter, color8Lighter, '#FFFFFF', color1Lighter, color2Lighter, '#FFFFFF'],
            direction: 135
          }
        };
      case 11: // Thank You
        // HTML template: linear-gradient(135deg, {{SECONDARY_COLOR}} 0%, {{COLOR_3_HEX}} 25%, {{COLOR_4_HEX}} 50%, {{PRIMARY_COLOR}} 75%, {{COLOR_2_HEX}} 100%)
        return {
          type: 'gradient',
          gradient: {
            colors: [color4Hex, color3Hex, color4Hex, color1Hex, color2Hex],
            direction: 135
          }
        };
      default:
        return {
          type: 'color',
          color: '#FFFFFF'
        };
    }
  }
  
  function handleEditingPanelUpdate(event: CustomEvent) {
    const { type, target, value, index } = event.detail;
    
    switch (type) {
      case 'color':
        if (target === 'primaryColor') primaryColor = value;
        else if (target === 'secondaryColor') secondaryColor = value;
        else if (target.startsWith('color-')) {
          const idx = parseInt(target.split('-')[1]);
          if (colors[idx]) colors[idx].hex = value;
        }
        break;
      case 'text':
        if (target === 'brandName') brandName = value;
        else if (target === 'tagline') tagline = value;
        else if (target === 'mission') mission = value;
        else if (target === 'vision') vision = value;
        else if (target === 'values') values = value;
        else if (target === 'targetAudience') targetAudience = value;
        else if (target === 'personality') personality = value;
        else if (target === 'positioningStatement') positioningStatement = value;
        else if (target === 'primaryWeights') primaryWeights = value;
        else if (target === 'secondaryWeights') secondaryWeights = value;
        else if (target === 'website') website = value;
        else if (target === 'email') email = value;
        else if (target === 'phone') phone = value;
        else if (target === 'primaryColor') primaryColor = value;
        else if (target === 'secondaryColor') secondaryColor = value;
        break;
      case 'image':
        if (target === 'logoData') logoData = value;
        break;
      case 'font':
        if (target === 'primaryFont') primaryFont = value;
        else if (target === 'secondaryFont') secondaryFont = value;
        break;
      case 'color-name':
        if (colors[index]) colors[index].name = value;
        colors = [...colors]; // Trigger reactivity
        break;
      case 'color-hex':
        if (colors[index]) colors[index].hex = value;
        colors = [...colors];
        break;
      case 'color-usage':
        if (colors[index]) colors[index].usage = value;
        colors = [...colors];
        break;
      case 'add-color':
        colors = [...colors, { name: '', hex: '#000000', usage: '' }];
        break;
      case 'remove-color':
        colors = colors.filter((_: any, i: number) => i !== index);
        break;
      case 'icon-symbol':
        if (icons[index]) icons[index].symbol = value;
        icons = [...icons];
        break;
      case 'icon-name':
        if (icons[index]) icons[index].name = value;
        icons = [...icons];
        break;
      case 'add-icon':
        icons = [...icons, { symbol: '', name: '' }];
        break;
      case 'remove-icon':
        icons = icons.filter((_: any, i: number) => i !== index);
        break;
      case 'app-icon':
        if (applications[index]) applications[index].icon = value;
        applications = [...applications];
        break;
      case 'app-name':
        if (applications[index]) applications[index].name = value;
        applications = [...applications];
        break;
      case 'app-description':
        if (applications[index]) applications[index].description = value;
        applications = [...applications];
        break;
      case 'add-app':
        applications = [...applications, { icon: '', name: '', description: '' }];
        break;
      case 'remove-app':
        applications = applications.filter((_: any, i: number) => i !== index);
        break;
      case 'thank-you-text':
        thankYouText = value;
        break;
      case 'subtitle-text':
        subtitleText = value;
        break;
      case 'hierarchy-h1':
        hierarchyH1 = value;
        break;
      case 'hierarchy-h2':
        hierarchyH2 = value;
        break;
      case 'hierarchy-h3':
        hierarchyH3 = value;
        break;
      case 'hierarchy-body':
        hierarchyBody = value;
        break;
      case 'photo-label':
        if (index === 0) photoLabel1 = value;
        else if (index === 1) photoLabel2 = value;
        else if (index === 2) photoLabel3 = value;
        else if (index === 3) photoLabel4 = value;
        break;
      case 'photo-emoji':
        if (index === 0) photoEmoji1 = value;
        else if (index === 1) photoEmoji2 = value;
        else if (index === 2) photoEmoji3 = value;
        else if (index === 3) photoEmoji4 = value;
        break;
      case 'guideline-title-1':
        guidelineTitle1 = value;
        break;
      case 'guideline-title-2':
        guidelineTitle2 = value;
        break;
      case 'guideline-item':
        if (guidelineItems[index] !== undefined) {
          guidelineItems[index] = value;
          guidelineItems = [...guidelineItems]; // Trigger reactivity
        }
        break;
      case 'add-guideline-item':
        guidelineItems = [...guidelineItems, ''];
        break;
      case 'remove-guideline-item':
        guidelineItems = guidelineItems.filter((_: any, i: number) => i !== index);
        break;
      case 'do-text':
        doText = value;
        break;
      case 'dont-text':
        dontText = value;
        break;
      case 'background':
        // Store background for current slide (reassign to trigger reactivity)
        slideBackgrounds = { ...slideBackgrounds, [currentSlideIndex]: value };
        updateEditingPanelData();
        break;
    }
    updateEditingPanelData();
  }
  
  function toggleEditingPanel() {
    showEditingPanel = !showEditingPanel;
    if (showEditingPanel) {
      updateEditingPanelData();
    }
  }
  
  // Editable state variables (initialized from brandData)
  let brandName = 'Brand Name';
  let tagline = 'Brand Guidelines';
  let primaryColor = '#1E40AF';
  let secondaryColor = '#93C5FD';
  let color2 = '#3B82F6';
  let color3 = '#60A5FA';
  let logoData = '';
  let logoUrl = '';
  let positioningStatement = 'Our brand positioning statement';
  let mission = 'Our mission statement';
  let vision = 'Our vision statement';
  let values = 'Innovation • Excellence • Integrity';
  let personality = 'Our brand personality';
  let targetAudience = 'Our target audience';
  let colors: Array<{ name: string; hex: string; usage?: string }> = [];
  let primaryFont = 'Arial';
  let secondaryFont = 'Arial';
  let primaryWeights = 'Regular, Bold';
  let secondaryWeights = 'Regular, Medium';
  let icons: Array<{ symbol: string; name: string }> = [];
  let applications: Array<{ icon: string; name: string; description: string }> = [];
  // Contact information
  let contactName = '';
  let contactEmail = 'contact@example.com';
  let contactRole = '';
  let contactCompany = '';
  let website = 'your-website.com';
  let phone = '';
  
  // Legacy support - map email to contactEmail
  $: email = contactEmail || 'contact@example.com';
  
  // Editable content for ThankYouSlide
  let thankYouText = 'Thank You';
  let subtitleText = 'Let\'s Create Something Amazing Together';
  
  // Editable content for TypographySlide
  let hierarchyH1 = 'H1: 32pt - Main titles';
  let hierarchyH2 = 'H2: 24pt - Section headers';
  let hierarchyH3 = 'H3: 20pt - Subsection headers';
  let hierarchyBody = 'Body: 16pt - Main content';
  
  // Editable content for PhotographySlide
  let photoLabel1 = 'Authentic Moments';
  let photoLabel2 = 'Natural Lighting';
  let photoLabel3 = 'Vibrant Colors';
  let photoLabel4 = 'People-Focused';
  let photoEmoji1 = '📷';
  let photoEmoji2 = '🌟';
  let photoEmoji3 = '🎨';
  let photoEmoji4 = '👥';
  let guidelineTitle1 = 'Style Guidelines';
  let guidelineItems: string[] = [
    'Natural, authentic moments',
    'Bright, well-lit environments',
    'Warm, inviting tones',
    'Diverse, inclusive representation',
    'Professional yet approachable'
  ];
  let guidelineTitle2 = 'Do\'s & Don\'ts';
  let doText = 'Use natural lighting & authentic scenes';
  let dontText = 'Avoid staged poses & heavy filters';
  
  // Background state for each slide (keyed by slide index)
  // Using object instead of Map for better Svelte reactivity
  let slideBackgrounds: Record<number, {
    type: 'color' | 'gradient';
    color?: string;
    gradient?: {
      colors: string[];
      direction: number;
    };
  }> = {};
  
  // Initialize from brandData when it changes
  $: if (brandData) {
    brandName = brandData?.brandName || brandData?.brand_name || 'Brand Name';
    tagline = brandData?.tagline || 'Brand Guidelines';
    primaryColor = extractColor(brandData, 'primary') || '#1E40AF';
    secondaryColor = extractColor(brandData, 'secondary') || '#93C5FD';
    color2 = extractColor(brandData, 'accent') || extractColor(brandData, 'color2') || '#3B82F6';
    color3 = extractColor(brandData, 'color3') || '#60A5FA';
    // Fix double base64 prefix issue
    const rawLogoData = brandData?.logoFiles?.[0]?.fileData || '';
    if (rawLogoData && rawLogoData.startsWith('data:image')) {
      // If it already has the data:image prefix, use it as is
      logoData = rawLogoData;
    } else if (rawLogoData) {
      // If it's just base64 data, add the prefix
      logoData = `data:image/png;base64,${rawLogoData}`;
    } else {
      logoData = '';
    }
    logoUrl = brandData?.logo?.primaryLogoUrl || brandData?.logo?.primary || '';
    positioningStatement = extractPositioningStatement(brandData);
    mission = extractMission(brandData);
    vision = extractVision(brandData);
    values = extractValues(brandData);
    personality = extractPersonality(brandData);
    targetAudience = extractTargetAudience(brandData);
    // Colors will be set by reactive statement below
    primaryFont = extractFont(brandData, 'primary') || 'Arial';
    secondaryFont = extractFont(brandData, 'secondary') || 'Arial';
    primaryWeights = extractFontWeights(brandData, 'primary') || 'Regular, Bold';
    secondaryWeights = extractFontWeights(brandData, 'secondary') || 'Regular, Medium';
    icons = extractIcons(brandData);
    applications = extractApplications(brandData);
    // Extract contact information
    contactName = brandData?.contact?.name || brandData?.legal_contact?.contact_name || '';
    contactEmail = brandData?.contact?.email || brandData?.legal_contact?.email || 'contact@example.com';
    contactRole = brandData?.contact?.role || brandData?.legal_contact?.title || '';
    contactCompany = brandData?.contact?.company || brandData?.legal_contact?.company || brandData?.brandName || '';
    website = brandData?.contact?.website || brandData?.legal_contact?.website || brandData?.brandDomain || 'your-website.com';
    phone = brandData?.contact?.phone || brandData?.legal_contact?.phone || '';
  }
  
  // Reactive statement to ensure colors are updated when color values change
  $: if (brandData && primaryColor && secondaryColor) {
    colors = extractColorsArray(brandData, primaryColor, secondaryColor, color2, color3);
  }
  
  // Save Svelte slides to database when brandData is set and slides are ready
  // Use a more reliable approach with onMount and reactive checks
  // Note: Svelte slides are automatically saved server-side when HTML slides are generated
  // via the /api/preview-slides-html endpoint. No client-side saving is needed.
  
  // Helper functions
  function extractColor(data: any, type: string): string | null {
    if (!data?.colors) return null;
    
    // Try different structures
    const colorObj = data.colors[type] || 
                     data.colors[`${type}Color`] ||
                     (data.colors.core_palette && data.colors.core_palette.find((c: any) => c.name?.toLowerCase().includes(type)));
    
    if (colorObj) {
      return colorObj.hex || colorObj;
    }
    
    // Try allColors array
    if (Array.isArray(data.colors.allColors)) {
      const index = type === 'primary' ? 0 : type === 'secondary' ? 1 : type === 'accent' ? 2 : -1;
      if (index >= 0 && data.colors.allColors[index]) {
        return data.colors.allColors[index].hex || data.colors.allColors[index];
      }
    }
    
    return null;
  }
  
  function extractColorsArray(data: any, fallbackPrimary?: string, fallbackSecondary?: string, fallbackAccent?: string, fallbackColor3?: string): Array<{ name: string; hex: string; usage?: string }> {
    const colors: Array<{ name: string; hex: string; usage?: string }> = [];
    
    // Try direct colors object first
    if (data?.colors) {
      // Try allColors first
      if (Array.isArray(data.colors.allColors) && data.colors.allColors.length > 0) {
        const extracted = data.colors.allColors.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || c,
          usage: c.usage || 'Brand color'
        }));
        // Fill to 8 colors if needed (matching HTML generator logic)
        if (extracted.length < 8) {
          const defaultColors = [
            { name: 'Color 5', hex: '#F59E0B', usage: 'Brand color' },
            { name: 'Color 6', hex: '#EF4444', usage: 'Brand color' },
            { name: 'Color 7', hex: '#8B5CF6', usage: 'Brand color' },
            { name: 'Color 8', hex: '#06B6D4', usage: 'Brand color' }
          ];
          const filled = [...extracted];
          for (let i = extracted.length; i < 8; i++) {
            filled.push(defaultColors[i - 4] || defaultColors[0]);
          }
          return filled;
        }
        return extracted;
      }
      
      // Try core_palette
      if (Array.isArray(data.colors.core_palette) && data.colors.core_palette.length > 0) {
        const extracted = data.colors.core_palette.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || c,
          usage: c.usage || 'Brand color'
        }));
        // Fill to 8 colors if needed (matching HTML generator logic)
        if (extracted.length < 8) {
          const defaultColors = [
            { name: 'Color 5', hex: '#F59E0B', usage: 'Brand color' },
            { name: 'Color 6', hex: '#EF4444', usage: 'Brand color' },
            { name: 'Color 7', hex: '#8B5CF6', usage: 'Brand color' },
            { name: 'Color 8', hex: '#06B6D4', usage: 'Brand color' }
          ];
          const filled = [...extracted];
          for (let i = extracted.length; i < 8; i++) {
            filled.push(defaultColors[i - 4] || defaultColors[0]);
          }
          return filled;
        }
        return extracted;
      }
      
      // Build from individual colors
      if (data.colors.primary) {
        colors.push({
          name: 'Primary',
          hex: typeof data.colors.primary === 'string' ? data.colors.primary : (data.colors.primary.hex || '#1E40AF'),
          usage: 'Primary brand color'
        });
      }
      if (data.colors.secondary) {
        colors.push({
          name: 'Secondary',
          hex: typeof data.colors.secondary === 'string' ? data.colors.secondary : (data.colors.secondary.hex || '#93C5FD'),
          usage: 'Secondary brand color'
        });
      }
      if (data.colors.accent) {
        colors.push({
          name: 'Accent',
          hex: typeof data.colors.accent === 'string' ? data.colors.accent : (data.colors.accent.hex || '#3B82F6'),
          usage: 'Accent color'
        });
      }
      if (data.colors.neutral) {
        colors.push({
          name: 'Neutral',
          hex: typeof data.colors.neutral === 'string' ? data.colors.neutral : (data.colors.neutral.hex || '#6B7280'),
          usage: 'Neutral color'
        });
      }
    }
    
    // If we have colors, return them
    if (colors.length > 0) return colors;
    
    // Try to parse from stepHistory
    const colorStep = data?.stepHistory?.find((s: any) => s.step === 'color-palette');
    if (colorStep?.content) {
      const content = colorStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.colors) {
        const extractedColors = Array.isArray(content.colors) ? content.colors : Object.values(content.colors);
        const parsed = extractedColors.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || c,
          usage: c.usage || 'Brand color'
        }));
        if (parsed.length > 0) return parsed;
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        const foundColors: Array<{ name: string; hex: string }> = [];
        
        // Extract primary - try multiple patterns
        const primaryMatch = content.match(/\*\*Primary\*\*[:\s]+#?([A-Fa-f0-9]{6})/i) || 
                           content.match(/Primary[:\s]+#?([A-Fa-f0-9]{6})/i) ||
                           content.match(/Primary Color[:\s]+#?([A-Fa-f0-9]{6})/i);
        if (primaryMatch) {
          foundColors.push({ name: 'Primary', hex: `#${primaryMatch[1]}` });
        }
        
        // Extract secondary
        const secondaryMatch = content.match(/\*\*Secondary\*\*[:\s]+#?([A-Fa-f0-9]{6})/i) || 
                              content.match(/Secondary[:\s]+#?([A-Fa-f0-9]{6})/i) ||
                              content.match(/Secondary Color[:\s]+#?([A-Fa-f0-9]{6})/i);
        if (secondaryMatch) {
          foundColors.push({ name: 'Secondary', hex: `#${secondaryMatch[1]}` });
        }
        
        // Extract accent
        const accentMatch = content.match(/\*\*Accent\*\*[:\s]+#?([A-Fa-f0-9]{6})/i) || 
                           content.match(/Accent[:\s]+#?([A-Fa-f0-9]{6})/i) ||
                           content.match(/Accent Color[:\s]+#?([A-Fa-f0-9]{6})/i);
        if (accentMatch) {
          foundColors.push({ name: 'Accent', hex: `#${accentMatch[1]}` });
        }
        
        // Try to find any hex codes in the content
        const hexMatches = content.match(/#([A-Fa-f0-9]{6})/gi);
        if (hexMatches && hexMatches.length > 0) {
          hexMatches.forEach((hex, idx) => {
            if (!foundColors.find(c => c.hex.toLowerCase() === hex.toLowerCase())) {
              const colorNames = ['Primary', 'Secondary', 'Accent', 'Neutral', 'Tertiary', 'Quaternary', 'Supporting', 'Highlight'];
              foundColors.push({ 
                name: colorNames[idx] || `Color ${idx + 1}`, 
                hex: hex 
              });
            }
          });
        }
        
        if (foundColors.length > 0) {
          return foundColors.map(c => ({ ...c, usage: 'Brand color' }));
        }
      }
    }
    
    // Fallback: Use the already-extracted colors from extractColor function
    const fallbackColors: Array<{ name: string; hex: string; usage?: string }> = [];
    if (fallbackPrimary) {
      fallbackColors.push({ name: 'Primary', hex: fallbackPrimary, usage: 'Primary brand color' });
    }
    if (fallbackSecondary) {
      fallbackColors.push({ name: 'Secondary', hex: fallbackSecondary, usage: 'Secondary brand color' });
    }
    if (fallbackAccent) {
      fallbackColors.push({ name: 'Accent', hex: fallbackAccent, usage: 'Accent color' });
    }
    if (fallbackColor3) {
      fallbackColors.push({ name: 'Tertiary', hex: fallbackColor3, usage: 'Tertiary brand color' });
    }
    
    // If we still have no colors, add some default ones
    if (fallbackColors.length === 0) {
      fallbackColors.push(
        { name: 'Primary', hex: '#1E40AF', usage: 'Primary brand color' },
        { name: 'Secondary', hex: '#93C5FD', usage: 'Secondary brand color' },
        { name: 'Accent', hex: '#3B82F6', usage: 'Accent color' },
        { name: 'Neutral', hex: '#6B7280', usage: 'Neutral color' }
      );
    }
    
    // Fill to 8 colors (matching HTML generator logic)
    // HTML generator uses defaultColors array to fill remaining slots
    const defaultColors = [
      { name: 'Color 5', hex: '#F59E0B', usage: 'Brand color' },
      { name: 'Color 6', hex: '#EF4444', usage: 'Brand color' },
      { name: 'Color 7', hex: '#8B5CF6', usage: 'Brand color' },
      { name: 'Color 8', hex: '#06B6D4', usage: 'Brand color' }
    ];
    
    // Fill missing colors with defaults (same logic as HTML generator)
    const filledColors = [...fallbackColors];
    for (let i = fallbackColors.length; i < 8; i++) {
      filledColors.push(defaultColors[i - 4] || defaultColors[0]);
    }
    
    return filledColors;
  }
  
  function extractPositioningStatement(data: any): string {
    // Try direct property first
    if (data?.positioningStatement || data?.positioning_statement) {
      let statement = data.positioningStatement || data.positioning_statement;
      // Clean it to remove any mission/vision content
      return cleanPositioningStatement(statement);
    }
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.positioning_statement) {
        return cleanPositioningStatement(content.positioning_statement);
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        // Try to find positioning statement in markdown format - be very specific
        // Look for "Brand Positioning:" or "Positioning Statement:" and stop at next section
        const patterns = [
          /\*\*Brand Positioning\*\*:\s*([\s\S]+?)(?=\n\n\*\*(?:Mission|Vision|Core Values|Target Audience|Voice|Tone)|$)/i,
          /\*\*Positioning Statement\*\*:\s*([\s\S]+?)(?=\n\n\*\*(?:Mission|Vision|Core Values|Target Audience|Voice|Tone)|$)/i,
          /Brand Positioning[:\s]+([\s\S]+?)(?=\n\n(?:Mission|Vision|Core Values|Target Audience|Voice|Tone)|$)/i,
          /Positioning Statement[:\s]+([\s\S]+?)(?=\n\n(?:Mission|Vision|Core Values|Target Audience|Voice|Tone)|$)/i,
          /Positioning[:\s]+([\s\S]+?)(?=\n\n(?:Mission|Vision|Core Values|Target Audience|Voice|Tone)|$)/i
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            let extracted = match[1].trim();
            // Remove any trailing markdown formatting
            extracted = extracted.replace(/\*\*/g, '').trim();
            // Remove any leading/trailing newlines
            extracted = extracted.replace(/^\n+|\n+$/g, '');
            if (extracted.length > 10) {
              return cleanPositioningStatement(extracted);
            }
          }
        }
        
        // Last resort: use first paragraph only if it doesn't contain other section headers
        const firstPara = content.split('\n\n').find(p => {
          const trimmed = p.trim();
          return trimmed.length > 20 && 
                 !trimmed.match(/^(Mission|Vision|Core Values|Target Audience|Voice|Tone)[:\s]/i);
        });
        if (firstPara) {
          let cleaned = firstPara.trim();
          // Remove section headers if they appear
          cleaned = cleaned.replace(/^\*\*Brand Positioning\*\*:\s*/i, '');
          cleaned = cleaned.replace(/^Brand Positioning[:\s]+/i, '');
          return cleanPositioningStatement(cleaned);
        }
      }
    }
    
    return 'Our brand positioning statement';
  }
  
  // Helper function to clean positioning statement and remove mission/vision content
  function cleanPositioningStatement(statement: string): string {
    if (!statement) return 'Our brand positioning statement';
    
    // Remove markdown formatting
    let cleaned = statement.replace(/\*\*/g, '').trim();
    
    // Split by sentences and stop at first mention of Mission, Vision, etc.
    const stopKeywords = ['Mission', 'Vision', 'Core Values', 'Target Audience', 'Voice', 'Tone', 'Values'];
    
    // Check if the statement contains any stop keywords
    for (const keyword of stopKeywords) {
      const index = cleaned.indexOf(keyword);
      if (index > 0) {
        // Take only the text before the keyword
        cleaned = cleaned.substring(0, index).trim();
        // Remove any trailing punctuation that might be left
        cleaned = cleaned.replace(/[.,;:]$/, '').trim();
        break;
      }
    }
    
    // Also split by double newlines and take only the first paragraph
    const paragraphs = cleaned.split(/\n\n+/);
    if (paragraphs.length > 0) {
      cleaned = paragraphs[0].trim();
    }
    
    // Remove any section headers that might be in the text
    cleaned = cleaned.replace(/^(Brand Positioning|Positioning Statement|Positioning)[:\s]+/i, '');
    
    // Ensure it's not empty and has reasonable length
    if (cleaned.length < 10) {
      return 'Our brand positioning statement';
    }
    
    return cleaned;
  }
  
  function extractMission(data: any): string {
    // Try direct property first
    if (data?.mission) return data.mission;
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.mission) {
        return content.mission;
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        const match = content.match(/\*\*Mission\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is) ||
                     content.match(/Mission[:\s]+(.+?)(?=\n\n|\n(?:Vision|Values)|$)/is);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    return 'Our mission statement';
  }
  
  function extractVision(data: any): string {
    // Try direct property first
    if (data?.vision) return data.vision;
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.vision) {
        return content.vision;
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        const match = content.match(/\*\*Vision\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is) ||
                     content.match(/Vision[:\s]+(.+?)(?=\n\n|\n(?:Mission|Values)|$)/is);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    return 'Our vision statement';
  }
  
  function extractValues(data: any): string {
    // Try direct property first
    if (Array.isArray(data?.values)) {
      return data.values.join(' • ');
    }
    if (typeof data?.values === 'string') {
      return data.values;
    }
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.values) {
        if (Array.isArray(content.values)) {
          return content.values.join(' • ');
        }
        return content.values;
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        const match = content.match(/\*\*Core Values\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/is) ||
                     content.match(/\*\*Values\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/is) ||
                     content.match(/Values[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision)|$)/is);
        if (match && match[1]) {
          const valuesText = match[1].trim();
          // Split by bullet points or newlines
          const values = valuesText.split(/[•\-\*]\s*/).filter(v => v.trim().length > 0);
          if (values.length > 0) {
            return values.map(v => v.trim()).join(' • ');
          }
          return valuesText;
        }
      }
    }
    
    return 'Innovation • Excellence • Integrity';
  }
  
  function extractPersonality(data: any): string {
    // Try direct property first
    if (data?.personality || data?.brandPersonality) {
      return data.personality || data.brandPersonality;
    }
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && (content.personality || content.target_audience)) {
        const personalityText = content.personality || content.target_audience;
        return typeof personalityText === 'string' ? personalityText : JSON.stringify(personalityText);
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        // Try multiple patterns to find target audience/personality
        const patterns = [
          /\*\*Target Audience\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/i,
          /Target Audience[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision|Values)|$)/i,
          /\*\*Personality\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/i,
          /Personality[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision|Values)|$)/i,
          /\*\*Brand Personality\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/i,
          /Brand Personality[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision|Values)|$)/i
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            const extracted = match[1].trim();
            // Remove any trailing markdown formatting
            const cleaned = extracted.replace(/\*\*/g, '').trim();
            if (cleaned.length > 10) { // Only return if we have substantial content
              return cleaned;
            }
          }
        }
        
        // Fallback: look for any paragraph that mentions "target" or "audience" or "personality"
        const paragraphs = content.split('\n\n');
        for (const para of paragraphs) {
          if (para.match(/target|audience|personality/i) && para.trim().length > 20) {
            return para.trim().replace(/\*\*/g, '');
          }
        }
      }
    }
    
    return 'Our brand personality';
  }

  function extractTargetAudience(data: any): string {
    const directAudience =
      data?.targetAudience ||
      data?.target_audience ||
      data?.selectedAudience ||
      data?.audience;
    if (typeof directAudience === 'string' && directAudience.trim().length > 0) {
      return directAudience.trim();
    }
    
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      if (typeof content === 'object' && content !== null) {
        const audienceText =
          content.target_audience ||
          content.targetAudience ||
          content.target ||
          content.audience ||
          content.persona;
        if (typeof audienceText === 'string' && audienceText.trim().length > 0) {
          return audienceText.trim();
        }
      }
      
      if (typeof content === 'string') {
        const patterns = [
          /\*\*Target Audience\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/i,
          /Target Audience[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision|Values)|$)/i,
          /\*\*Audience\*\*:\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/i,
          /Audience[:\s]+([\s\S]+?)(?=\n\n|\n(?:Mission|Vision|Values)|$)/i
        ];
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            const extracted = match[1].trim().replace(/\*\*/g, '');
            if (extracted.length > 5) {
              return extracted;
            }
          }
        }
      }
    }
    
    if (typeof data?.persona === 'string' && data.persona.trim().length > 0) {
      return data.persona.trim();
    }
    
    const personalityText = extractPersonality(data);
    if (personalityText && personalityText !== 'Our brand personality') {
      return personalityText;
    }
    
    return 'Our target audience';
  }
  
  function extractFont(data: any, type: string): string | null {
    // Try direct typography object first
    if (data?.typography) {
      let fontObj = null;
      
      if (type === 'primary') {
        fontObj = data.typography.primaryFont || 
                 data.typography.primary || 
                 data.typography[type];
      } else {
        // For secondary, try multiple keys: supporting, secondaryFont, secondary, supportingFont
        fontObj = data.typography.supporting || 
                 data.typography.secondaryFont || 
                 data.typography.supportingFont ||
                 data.typography.secondary || 
                 data.typography[type];
      }
      
      if (fontObj) {
        let fontName = typeof fontObj === 'string' ? fontObj : (fontObj.name || fontObj.family || null);
        if (fontName) {
          // Clean the font name - remove description after dash
          fontName = fontName.split(/\s*-\s*/)[0].trim();
          fontName = fontName.split(/[,\n]/)[0].trim();
          return fontName;
        }
      }
    }
    
    // Try to parse from stepHistory
    const typographyStep = data?.stepHistory?.find((s: any) => s.step === 'typography');
    if (typographyStep?.content) {
      const content = typographyStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object') {
        let fontObj = null;
        
        if (type === 'primary') {
          fontObj = content.primaryFont || content.primary || content[type];
        } else {
          // For secondary, try multiple keys: supporting, secondaryFont, secondary, supportingFont
          fontObj = content.supporting || 
                   content.secondaryFont || 
                   content.supportingFont ||
                   content.secondary || 
                   content[type];
        }
        
        if (fontObj) {
          let fontName = typeof fontObj === 'string' ? fontObj : (fontObj.name || fontObj.family || null);
          if (fontName) {
            // Clean the font name - remove description after dash
            fontName = fontName.split(/\s*-\s*/)[0].trim();
            fontName = fontName.split(/[,\n]/)[0].trim();
            return fontName;
          }
        }
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        // Look for font patterns like "**Primary Font**: FontName" or "Primary Font: FontName"
        let fontPattern = null;
        
        if (type === 'primary') {
          fontPattern = /\*\*Primary Font\*\*[:\s]+([^\n]+)/i.exec(content) || 
                       /Primary Font[:\s]+([^\n]+)/i.exec(content) ||
                       /\*\*Primary\*\*[:\s]+([^\n]+)/i.exec(content) ||
                       /Primary[:\s]+([^\n]+)/i.exec(content);
        } else {
          // For secondary, try multiple patterns including "Supporting Font" which is what Gemini generates
          fontPattern = /\*\*Supporting Font\*\*[:\s]+([^\n]+)/i.exec(content) ||
                       /Supporting Font[:\s]+([^\n]+)/i.exec(content) ||
                       /\*\*Secondary Font\*\*[:\s]+([^\n]+)/i.exec(content) || 
                       /Secondary Font[:\s]+([^\n]+)/i.exec(content) ||
                       /\*\*Secondary\*\*[:\s]+([^\n]+)/i.exec(content) ||
                       /Secondary[:\s]+([^\n]+)/i.exec(content) ||
                       /\*\*Supporting\*\*[:\s]+([^\n]+)/i.exec(content) ||
                       /Supporting[:\s]+([^\n]+)/i.exec(content);
        }
        
        if (fontPattern && fontPattern[1]) {
          let fontName = fontPattern[1].trim();
          
          // Remove description after dash (e.g., "Playfair Display - A sophisticated serif" -> "Playfair Display")
          fontName = fontName.split(/\s*-\s*/)[0].trim();
          
          // Also split on comma, newline, or other separators
          fontName = fontName.split(/[,\n]/)[0].trim();
          
          // Remove any trailing markdown formatting
          fontName = fontName.replace(/\*\*/g, '').trim();
          
          if (fontName && fontName !== 'Arial' && fontName.length > 0) {
            return fontName;
          }
        }
      }
    }
    
    return null;
  }
  
  function extractFontWeights(data: any, type: string): string | null {
    // Try direct typography object first
    if (data?.typography) {
      const fontObj = data.typography[`${type}Font`] || 
                     data.typography[type] ||
                     (type === 'primary' ? data.typography.primary : data.typography.supporting);
      
      if (fontObj?.weights) {
        return Array.isArray(fontObj.weights) 
          ? fontObj.weights.join(', ')
          : fontObj.weights;
      }
    }
    
    // Try to parse from stepHistory
    const typographyStep = data?.stepHistory?.find((s: any) => s.step === 'typography');
    if (typographyStep?.content) {
      const content = typographyStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object') {
        const fontKey = type === 'primary' ? 'primaryFont' : 'secondaryFont';
        const fontObj = content[fontKey] || content[type] || (type === 'primary' ? content.primary : content.supporting);
        if (fontObj?.weights) {
          return Array.isArray(fontObj.weights) 
            ? fontObj.weights.join(', ')
            : fontObj.weights;
        }
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        // Look for weights patterns
        const weightPattern = type === 'primary'
          ? /Primary Font[:\s]+[^\n]+Weights?[:\s]+([^\n]+)/i.exec(content)
          : /Secondary Font[:\s]+[^\n]+Weights?[:\s]+([^\n]+)/i.exec(content);
        
        if (weightPattern && weightPattern[1]) {
          return weightPattern[1].trim();
        }
      }
    }
    
    return null;
  }
  
  function extractApplications(data: any): Array<{ icon: string; name: string; description: string }> {
    if (Array.isArray(data?.applications)) {
      return data.applications.map((app: any) => ({
        icon: app.icon || '📄',
        name: app.name || 'Application',
        description: app.description || app.context || ''
      }));
    }
    return [];
  }
  
  function normalizeStyleValue(value: unknown): string {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }
  
  function deriveSlideVibeFromBrand(data: any): SlideVibe {
    const styleCandidates = [
      data?.selectedMood,
      data?.style,
      data?.mood,
      data?.visualStyle,
      data?.selectedTheme,
      data?.vibe
    ];
    
    for (const candidate of styleCandidates) {
      const normalized = normalizeStyleValue(candidate);
      if (!normalized) continue;
      if (normalized.includes('funky') || normalized.includes('playful') || normalized.includes('groovy')) {
        return 'funky';
      }
      if (normalized.includes('minimal')) {
        return 'minimalist';
      }
    }
    
    return 'default';
  }
  
  $: effectiveSlideVibe = slideVibe ?? deriveSlideVibeFromBrand(brandData);
  
  // Extract colors from colors array in the same order as HTML templates
  // COLOR_1 = colors[0], COLOR_2 = colors[1], etc.
  const defaultColor1 = '#1E40AF';
  const defaultColor2 = '#2563EB';
  const defaultColor3 = '#3B82F6';
  const defaultColor4 = '#60A5FA';

  $: color1Hex = colors.length > 0
    ? normalizeColorValue(colors[0], primaryColor || defaultColor1)
    : normalizeColorValue(primaryColor, defaultColor1);
  $: color2Hex = colors.length > 1
    ? normalizeColorValue(colors[1], color2 || defaultColor2)
    : (colors.length > 0
        ? normalizeColorValue(colors[0], color2 || defaultColor2)
        : normalizeColorValue(color2, defaultColor2));
  $: color3Hex = colors.length > 2
    ? normalizeColorValue(colors[2], color3 || defaultColor3)
    : (colors.length > 1
        ? normalizeColorValue(colors[1], color3 || defaultColor3)
        : normalizeColorValue(color3, defaultColor3));
  $: color4Hex = colors.length > 3
    ? normalizeColorValue(colors[3], secondaryColor || defaultColor4)
    : (colors.length > 2
        ? normalizeColorValue(colors[2], secondaryColor || defaultColor4)
        : normalizeColorValue(secondaryColor, defaultColor4));
  $: color5Hex = colors.length > 4
    ? normalizeColorValue(colors[4], '#60A5FA')
    : '#60A5FA';
  $: color6Hex = colors.length > 5
    ? normalizeColorValue(colors[5], '#3B82F6')
    : '#3B82F6';
  $: color7Hex = colors.length > 6
    ? normalizeColorValue(colors[6], '#1E40AF')
    : '#1E40AF';
  $: color8Hex = colors.length > 7
    ? normalizeColorValue(colors[7], '#2563EB')
    : '#2563EB';
  
  // Color variants for gradients - using same logic as HTML templates
  // HTML uses lightenColor(hex, 0.92) for LIGHTER variants
  $: color1Lighter = lightenColor(color1Hex, 0.92);
  $: color2Lighter = lightenColor(color2Hex, 0.92);
  $: color3Lighter = lightenColor(color3Hex, 0.92);
  $: color4Lighter = lightenColor(color4Hex, 0.92);
  $: color5Lighter = lightenColor(color5Hex, 0.92);
  $: color6Lighter = lightenColor(color6Hex, 0.92);
  $: color7Lighter = lightenColor(color7Hex, 0.92);
  $: color8Lighter = lightenColor(color8Hex, 0.92);
  
  // RGBA variants - matching HTML template variables
  $: color1Rgba10 = hexToRgba(color1Hex, 0.1);
  $: color2Rgba10 = hexToRgba(color2Hex, 0.1);
  $: color3Rgba10 = hexToRgba(color3Hex, 0.1);
  $: color4Rgba10 = hexToRgba(color4Hex, 0.1);
  $: color5Rgba10 = hexToRgba(color5Hex, 0.1);
  $: color6Rgba10 = hexToRgba(color6Hex, 0.1);
  $: color7Rgba10 = hexToRgba(color7Hex, 0.1);
  $: color1Rgba15 = hexToRgba(color1Hex, 0.15);
  $: color2Rgba15 = hexToRgba(color2Hex, 0.15);
  $: color3Rgba15 = hexToRgba(color3Hex, 0.15);
  $: color1Rgba12 = hexToRgba(color1Hex, 0.12);
  $: color2Rgba12 = hexToRgba(color2Hex, 0.12);
  $: color3Rgba12 = hexToRgba(color3Hex, 0.12);
  $: color4Rgba12 = hexToRgba(color4Hex, 0.12);
  $: color5Rgba12 = hexToRgba(color5Hex, 0.12);
  $: color6Rgba12 = hexToRgba(color6Hex, 0.12);
  $: color7Rgba12 = hexToRgba(color7Hex, 0.12);
  $: color4Rgba8 = hexToRgba(color4Hex, 0.08);
  $: color5Rgba8 = hexToRgba(color5Hex, 0.08);
  $: color6Rgba8 = hexToRgba(color6Hex, 0.08);
  $: color1Rgba5 = hexToRgba(color1Hex, 0.05);
  $: color8Rgba12 = hexToRgba(color8Hex, 0.12);
  const MINIMALIST_BACKGROUND = '#FFFFFF';
  $: minimalistTextColor = ensureHexColor(color1Hex, '#1B1B1B');
  $: minimalistAccentCircleColor = lightenColor(color3Hex, 0.9);
  $: minimalistPlaceholderColor = lightenColor(color2Hex, 0.94);
  $: minimalistCoverProps = {
    titlePrimary: brandName || 'Brand',
    titleSecondary: tagline || 'Guidelines',
    subtitle: positioningStatement || mission || '',
    website: formatWebsiteUrl(website),
    backgroundColor: '#FFFFFF',
    textColor: ensureHexColor(color1Hex, '#111111'),
    accentLineColor: ensureHexColor(color1Hex, '#111111'),
    accentCircleColor: lightenColor(ensureHexColor(color2Hex, '#C0C0C0'), 0.9)
  };
  $: minimalistContentsSections = minimalistContentsDefaults.map((label, index) => ({
    number: `${String(index + 1).padStart(2, '0')}.`,
    label
  }));
  $: minimalistPalette = buildMinimalistPalette();
  $: minimalistUsage = buildMinimalistUsage();
  $: minimalistTypographyColumns = [
    {
      letter: initialsFromFont(primaryFont, 'A'),
      description: `${primaryFont || 'Primary Font'} — ${primaryWeights || 'Regular'}`
    },
    {
      letter: initialsFromFont(secondaryFont, 'B'),
      description: `${secondaryFont || 'Secondary Font'} — ${secondaryWeights || 'Regular'}`
    }
  ];
  $: minimalistImageSources = extractImageSources(brandData);
  $: minimalistMoodboardImages = minimalistImageSources.slice(0, 6).map((src) => ({ src }));
  $: minimalistInspirationImages = {
    main: minimalistImageSources[0] || '',
    secondary: minimalistImageSources[1] || '',
    tertiary: minimalistImageSources[2] || ''
  };
  $: minimalistLogoOverviewDescription = mission || positioningStatement || values || 'Our logo represents our ethos.';
  $: minimalistLogoPrimaryDescription = mission || 'Primary logo usage guidance.';
  $: minimalistLogoSecondaryDescription = vision || values || 'Secondary logo usage guidance.';
  $: minimalistSocialDescription = applications.length
    ? applications
        .map((app) => app.description || `${app.name || 'Channel'} presence`)
        .filter(Boolean)
        .join(' ')
    : personality || 'Maintain cohesive storytelling across social surfaces.';
  $: minimalistThankYouDescription = subtitleText || 'Let\'s Create Something Amazing Together';
  const funkyPageLabels = [
    'Page 01',
    'Page 02',
    'Page 03',
    'Page 04',
    'Page 05',
    'Page 06',
    'Page 07',
    'Page 08',
    'Page 09',
    'Page 10',
    'Page 11',
    'Page 12'
  ];
  const funkyContentsDefaults = [
    'About us',
    'Moodboard',
    'Plan',
    'Team',
    'Product',
    'Palette',
    'Logo Variation',
    'Typeface',
    'Contact'
  ];
  const funkyFallbackImages = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80'
  ];
  $: funkyTheme = buildFunkyTheme();
  $: funkyContentsItems = funkyContentsDefaults;
  $: funkyHeroImage = minimalistImageSources[0] || funkyFallbackImages[0];
  $: funkyInsetImage = minimalistImageSources[1] || funkyHeroImage;
  $: funkyMoodboardImages = ensureImageCount(minimalistImageSources, 2, funkyFallbackImages).slice(0, 2);
  $: funkyGalleryImages = ensureImageCount(minimalistImageSources, 4, funkyFallbackImages).slice(0, 4);
  $: funkyPaletteColors = buildFunkyPaletteColors();
  $: funkyColorDots = funkyPaletteColors.slice(0, 3).map((color) => color.hex);
  $: funkyLogoImageSrc = getLogoImageSource();
  $: funkyLogoVariations = [
    {
      name: 'Primary Logo',
      image: funkyLogoImageSrc || funkyHeroImage,
      background: '#FFFFFF'
    },
    {
      name: 'Alternate Logo',
      image: funkyLogoImageSrc || funkyHeroImage,
      background: ensureHexColor(color2Hex, defaultFunkyTheme.accentPink)
    }
  ];
  $: funkyTypographyDescription = values || mission || 'Presentation tools for communication.';
  $: funkyTypographyFont = primaryFont || 'Poppins';
  $: funkyProductDescription = applications.length
    ? applications.map((app) => app.description || app.name).filter(Boolean).join(' • ')
    : positioningStatement || values || 'Highlight the product experience.';
  $: funkyWebsiteDisplay = formatWebsiteUrl(website);
  $: funkySubheading = tagline || `Presentation by ${brandName || 'Reallygreatsite'}`;
  $: funkyLoopLabel = (brandName || 'Brand Guidelines').toUpperCase();
  $: funkyTeamMembers = extractTeamMembers(brandData);
  $: funkyContactImage = minimalistImageSources[2] || funkyHeroImage;
  
  const defaultSlidesList = [
    { name: 'Cover', component: 'cover' },
    { name: 'Brand Introduction', component: 'brand-intro' },
    { name: 'Brand Positioning', component: 'brand-positioning' },
    { name: 'Logo Guidelines', component: 'logo-guidelines' },
    { name: 'Logo Do\'s', component: 'logo-dos' },
    { name: 'Logo Don\'ts', component: 'logo-donts' },
    { name: 'Color Palette', component: 'color-palette' },
    { name: 'Typography', component: 'typography' },
    { name: 'Iconography', component: 'iconography' },
    { name: 'Photography', component: 'photography' },
    { name: 'Applications', component: 'applications' },
    { name: 'Thank You', component: 'thank-you' }
  ];
  
  const minimalistSlidesList = [
    { name: 'Cover', component: 'minimalist-cover' },
    { name: 'Brand Introduction', component: 'minimalist-brand-intro' },
    { name: 'Brand Positioning', component: 'minimalist-brand-positioning' },
    { name: 'Contents', component: 'minimalist-contents' },
    { name: 'Logo Overview', component: 'minimalist-logo-overview' },
    { name: 'Logo Showcase', component: 'minimalist-logo-showcase' },
    { name: 'Typography', component: 'minimalist-typography-hero' },
    { name: 'Typography Details', component: 'minimalist-typography-details' },
    { name: 'Color Palette', component: 'minimalist-color-palette' },
    { name: 'Color Usage', component: 'minimalist-color-usage' },
    { name: 'Social Media', component: 'minimalist-social-media' },
    { name: 'Inspiration', component: 'minimalist-inspiration' },
    { name: 'Moodboard', component: 'minimalist-moodboard' },
    { name: 'Thank You', component: 'minimalist-thank-you' }
  ];
  
  const funkySlidesList = [
    { name: 'Cover', component: 'funky-cover' },
    { name: 'Brand Introduction', component: 'funky-brand-story' },
    { name: 'Brand Positioning', component: 'funky-brand-positioning' },
    { name: 'Table of Contents', component: 'funky-table-of-contents' },
    { name: 'Moodboard', component: 'funky-moodboard' },
    { name: 'Plan', component: 'funky-plan' },
    { name: 'Product', component: 'funky-product' },
    { name: 'Team', component: 'funky-team' },
    { name: 'Palette', component: 'funky-palette' },
    { name: 'Logo Variations', component: 'funky-logo-variations' },
    { name: 'Typography', component: 'funky-typography' },
    { name: 'Contact', component: 'funky-contact' }
  ];
  
  const defaultSlideCount = defaultSlidesList.length;
  
  type SectionSlide = {
    id: string;
    stepId: string;
    title: string;
    partLabel?: string;
  sections: Array<{ title: string; description?: string; points?: string[]; examples?: string[] }>;
  };
  
  let sectionSlides: SectionSlide[] = [];
  let sectionSlideNavEntries: Array<{ name: string; component: string }> = [];
  
  let slides = defaultSlidesList;
  $: sectionSlides = buildSectionSlides(brandData);
  $: sectionSlideNavEntries = sectionSlides.map((slide, index) => ({
    name: slide.partLabel ? `${slide.title} (${slide.partLabel})` : slide.title,
    component: `dynamic-section-${slide.id || index}`
  }));
  
  $: slides = effectiveSlideVibe === 'minimalist'
    ? minimalistSlidesList
    : effectiveSlideVibe === 'funky'
      ? funkySlidesList
      : defaultSlidesList.concat(sectionSlideNavEntries);
  $: if (currentSlideIndex >= slides.length) {
    currentSlideIndex = Math.max(0, slides.length - 1);
  }
  
  function extractIcons(data: any): Array<{ symbol: string; name: string }> {
    if (!data) return [];
    
    const icons: Array<{ symbol: string; name: string }> = [];
    
    // Try direct icons property first
    if (data?.icons && Array.isArray(data.icons)) {
      return data.icons.map((icon: any) => ({
        symbol: '', // No longer using symbols/emojis - using Lucide icons
        name: typeof icon === 'string' ? icon : (icon.name || icon.label || 'Icon')
      }));
    }
    
    // Try to extract from iconography step
    const iconographyStep = data.stepHistory?.find((s: any) => s.step === 'iconography');
    if (iconographyStep?.content) {
      const content = iconographyStep.content;
      
      // If content is an object, extract directly
      if (typeof content === 'object' && content !== null) {
        // Try different object structures
        if (Array.isArray(content.icons)) {
          return content.icons.map((icon: any) => ({
            symbol: '', // No longer using symbols/emojis
            name: typeof icon === 'string' ? icon : (icon.name || icon.label || 'Icon')
          }));
        }
        
        if (Array.isArray(content)) {
          return content.map((icon: any) => ({
            symbol: '', // No longer using symbols/emojis
            name: typeof icon === 'string' ? icon : (icon.name || icon.label || 'Icon')
          }));
        }
        
        // Try to find icon arrays in object
        for (const key in content) {
          if (Array.isArray(content[key])) {
            const potentialIcons = content[key];
            if (potentialIcons.length > 0) {
              return potentialIcons.map((icon: any) => ({
                symbol: '', // No longer using symbols/emojis
                name: typeof icon === 'string' ? icon : (icon.name || icon.label || 'Icon')
              }));
            }
          }
        }
      }
      
      // If content is a string, parse it
      if (typeof content === 'string') {
        const lines = content.split('\n');
        
        // Try multiple patterns to match different formats
        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) continue;
          
          // Pattern 1: • Icon Name or - Icon Name or * Icon Name
          let match = line.match(/^[\s]*[•\-\*]\s*(.+)$/);
          if (match) {
            const iconName = match[1].trim();
            // Remove any leading emoji/symbol if present
            const cleanName = iconName.replace(/^[⚫⚪⚡⚙⚠⚰⚱★☆♦♠♣♥♪♫♬♭♮♯◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡☀☁☂☎☐☑☒☓☕☘☝☞☟☠☢☣☮☯☸☹☺☻☼☽☾♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓♔♕♖♗♘♙♚♛♜♝♞♟\s]+/, '').trim();
            if (cleanName && cleanName.length > 2) {
              icons.push({
                symbol: '', // No longer using symbols/emojis
                name: cleanName
              });
            }
            continue;
          }
          
          // Pattern 2: Icon Name (colon separated)
          match = line.match(/^\s*([^:]+):\s*(.+)$/);
          if (match) {
            const iconName = match[2].trim() || match[1].trim();
            if (iconName.length > 2) {
              icons.push({
                symbol: '', // No longer using symbols/emojis
                name: iconName
              });
            }
            continue;
          }
          
          // Pattern 3: Icon Name (dash separated)
          match = line.match(/^\s*([^\-]+)\s*-\s*(.+)$/);
          if (match && match[2].trim().length > 2) {
            icons.push({
              symbol: '', // No longer using symbols/emojis
              name: match[2].trim()
            });
            continue;
          }
        }
        
        // Also try to find icons in markdown code blocks or JSON
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed)) {
              parsed.forEach((icon: any) => {
                icons.push({
                  symbol: '', // No longer using symbols/emojis
                  name: typeof icon === 'string' ? icon : (icon.name || icon.label || 'Icon')
                });
              });
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }
    
    // Remove duplicates based on name (since we're using names for icon lookup)
    const uniqueIcons = icons.filter((icon, index, self) => 
      index === self.findIndex(i => i.name.toLowerCase() === icon.name.toLowerCase())
    );
    
    if (uniqueIcons.length > 0) {
      return uniqueIcons.slice(0, 12); // Return up to 12 icons
    }
    
    // Default icons if none found - use icon names for Lucide icons
    return [
      { symbol: '', name: 'Brand' },
      { symbol: '', name: 'Featured' },
      { symbol: '', name: 'Success' },
      { symbol: '', name: 'Navigation' },
      { symbol: '', name: 'Add' },
      { symbol: '', name: 'Settings' }
    ];
  }
  
  // Same lightenColor function as HTML generator (matching exactly)
  function lightenColor(hex: string, amount: number): string {
    if (!hex || !hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Lighten by mixing with white (same as HTML generator)
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  function hexToRgba(hex: string, opacity: number): string {
    if (!hex || !hex.startsWith('#')) return `rgba(0, 0, 0, ${opacity})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  function formatWebsiteUrl(url: string | undefined): string {
    if (!url) return 'www.reallygreatsite.com';
    const trimmed = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return trimmed || 'www.reallygreatsite.com';
  }
  
  function pickImageSource(entry: any): string | null {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    return entry.url || entry.src || entry.image || entry.path || null;
  }
  
  function extractImageSources(data: any): string[] {
    if (!data) return [];
    const candidates = [
      data?.moodboardImages,
      data?.moodboard?.images,
      data?.inspirationImages,
      data?.inspiration?.images,
      data?.imagery?.photos,
      data?.photos,
      data?.media
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const images = candidate
          .map(pickImageSource)
          .filter((src): src is string => Boolean(src));
        if (images.length) return images;
      }
    }
    return [];
  }
  
  function ensureHexColor(value: string | undefined, fallback: string): string {
    if (!value || typeof value !== 'string') return fallback;
    return value.startsWith('#') ? value : `#${value}`;
  }

  function normalizeColorValue(value: any, fallback: string): string {
    const safeFallback = ensureHexColor(fallback, '#000000');
    if (!value) return safeFallback;
    if (typeof value === 'string') return ensureHexColor(value, safeFallback);
    if (typeof value === 'object') {
      if (typeof value.hex === 'string') return ensureHexColor(value.hex, safeFallback);
      if (typeof value.value === 'string') return ensureHexColor(value.value, safeFallback);
    }
    return safeFallback;
  }

  const coreStepIds = new Set([
    'brand-introduction',
    'brand-positioning',
    'logo-guidelines',
    'logo-dos',
    'logo-donts',
    'color-palette',
    'typography',
    'iconography',
    'photography',
    'applications',
    'thank-you',
    'generated-slides'
  ]);

  function buildSectionSlides(data: any): SectionSlide[] {
    if (!data?.stepHistory || !Array.isArray(data.stepHistory)) return [];
    return data.stepHistory
      .map((entry: any, index: number) => normalizeSectionSlide(entry, index))
      .filter((slide): slide is SectionSlide => Boolean(slide));
  }

  function normalizeSectionSlide(entry: any, index: number): SectionSlide | null {
    if (!entry) return null;
    const stepId = String(entry.step || entry.stepId || `custom-${index}`);
    if (coreStepIds.has(stepId)) return null;
    const content = entry.content;
    if (!content) return null;
    const title = entry.title || entry.stepTitle || toTitleCase(stepId.replace(/[-_]/g, ' '));
    const partLabel = entry.part || entry.description || entry.subtitle;
    const sections = extractSectionsFromContent(content);
    if (!sections.length) return null;
    return {
      id: stepId,
      stepId,
      title,
      partLabel,
      sections
    };
  }

  function extractSectionsFromContent(content: any): SectionSlide['sections'] {
    if (!content) return [];
    if (typeof content === 'object') {
      if (Array.isArray(content.sections) && content.sections.length) {
        return content.sections.map((section: any, index: number) => normalizeSectionEntry(section, index));
      }
      if (Array.isArray(content) && content.length) {
        return content.map((section: any, index: number) => normalizeSectionEntry(section, index));
      }
      const keys = Object.keys(content).filter((key) => {
        const value = content[key];
        return typeof value === 'string' || Array.isArray(value) || (typeof value === 'object' && value);
      });
      if (keys.length) {
        return keys.map((key, index) => normalizeSectionEntry({
          title: toTitleCase(key.replace(/[-_]/g, ' ')),
          description: typeof content[key] === 'string' ? content[key] : '',
          points: Array.isArray(content[key]) ? content[key] : undefined
        }, index));
      }
    }
    if (typeof content === 'string') {
      return stringToSections(content);
    }
    return [];
  }

  function normalizeSectionEntry(section: any, index: number) {
    if (typeof section === 'string') {
      const blocks = stringToSections(section);
      return blocks[0] || { title: `Section ${index + 1}`, description: section };
    }
    const title = section?.title || section?.heading || `Section ${index + 1}`;
    const description = section?.description || section?.text || '';
    const points = Array.isArray(section?.points)
      ? section.points.map((point: any) => String(point).trim()).filter(Boolean)
      : undefined;
    const examples = Array.isArray(section?.examples)
      ? section.examples.map((example: any) => String(example).trim()).filter(Boolean)
      : undefined;
    return { title, description, points, examples };
  }

  function stringToSections(text: string): SectionSlide['sections'] {
    if (!text) return [];
    const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    return blocks.map((block, index) => {
      const headingMatch = block.match(/^\s*\*\*(.+?)\*\*[:\-]\s*(.+)$/) || block.match(/^\s*([^:\n]+)[:\-]\s*(.+)$/);
      let title = headingMatch ? headingMatch[1] : `Section ${index + 1}`;
      let body = headingMatch ? headingMatch[2] : block;
      title = title.trim();
      const { description, points } = splitDescriptionAndPoints(body);
      return {
        title,
        description,
        points
      };
    });
  }

  function splitDescriptionAndPoints(text: string): { description: string; points?: string[] } {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const points: string[] = [];
    const descriptionLines: string[] = [];
    for (const line of lines) {
      if (/^[-•*]\s+/.test(line)) {
        points.push(line.replace(/^[-•*]\s+/, '').trim());
      } else {
        descriptionLines.push(line);
      }
    }
    return {
      description: descriptionLines.join(' ').trim(),
      points: points.length ? points : undefined
    };
  }

  function toTitleCase(input: string): string {
    return input
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  const minimalistContentsDefaults = [
    'Brand Guidelines',
    'Logo and Design',
    'Typography',
    'Color Palette',
    'Design & Social Media',
    'Inspiration & Moodboard'
  ];
  
  function buildMinimalistPalette(): Array<{ hex: string; label: string }> {
    if (colors.length >= 4) {
      return colors.slice(0, 4).map((color, index) => ({
        hex: color.hex,
        label: color.name || `Color ${index + 1}`
      }));
    }
    return [
      { hex: color1Hex, label: 'Primary' },
      { hex: color2Hex, label: 'Accent' },
      { hex: color3Hex, label: 'Secondary' },
      { hex: color4Hex, label: 'Highlight' }
    ].map((item) => ({
      hex: ensureHexColor(item.hex, '#333333'),
      label: item.label
    }));
  }
  
  function buildMinimalistUsage(): Array<{ hex: string; label: string; usage: string }> {
    const palette = buildMinimalistPalette();
    const usageLabels = ['Background', 'Background', 'Font', 'Pattern'];
    return palette.map((item, index) => ({
      hex: item.hex,
      label: item.hex.toUpperCase(),
      usage: colors[index]?.usage || usageLabels[index] || 'Brand color'
    }));
  }
  
  function buildFunkyTheme(): FunkyTheme {
    return {
      backgroundColor: ensureHexColor(color4Hex, defaultFunkyTheme.backgroundColor),
      accentOrange: ensureHexColor(color3Hex, defaultFunkyTheme.accentOrange),
      accentPink: ensureHexColor(color2Hex, defaultFunkyTheme.accentPink),
      accentGreen: ensureHexColor(color1Hex, defaultFunkyTheme.accentGreen),
      accentLavender: lightenColor(ensureHexColor(color2Hex, defaultFunkyTheme.accentLavender), 0.4),
      accentBeige: ensureHexColor(color4Hex, defaultFunkyTheme.accentBeige),
      textColor: defaultFunkyTheme.textColor,
      bodyColor: defaultFunkyTheme.bodyColor,
      dividerColor: defaultFunkyTheme.dividerColor
    };
  }
  
  function ensureImageCount(source: string[], desired: number, fallbacks: string[]): string[] {
    const result = [...source];
    let fallbackIndex = 0;
    while (result.length < desired && fallbackIndex < fallbacks.length) {
      const candidate = fallbacks[fallbackIndex++];
      if (!result.includes(candidate)) {
        result.push(candidate);
      }
    }
    if (result.length < desired) {
      return fallbacks.slice(0, desired);
    }
    return result;
  }
  
  function buildFunkyPaletteColors(): Array<{ hex: string; label: string }> {
    if (colors.length) {
      return colors.slice(0, 4).map((color, index) => ({
        hex: ensureHexColor(color.hex, defaultFunkyTheme.accentOrange),
        label: color.name || `Color ${index + 1}`
      }));
    }
    return [
      { hex: '#65AF70', label: 'Organic Green' },
      { hex: '#EBAFD3', label: 'Candy Pink' },
      { hex: '#FF7B4A', label: 'Tangerine' },
      { hex: '#FFE5C9', label: 'Peach' }
    ];
  }
  
  function getLogoImageSource(): string | null {
    if (logoData) {
      return logoData.startsWith('data:image')
        ? logoData
        : `data:image/png;base64,${logoData.replace(/^data:image\/\w+;base64,/, '')}`;
    }
    if (logoUrl) return logoUrl;
    if (brandData?.logo?.url) return brandData.logo.url;
    return null;
  }
  
  function extractTeamMembers(data: any): Array<{ name: string; role: string; photo: string }> {
    if (!data) return [];
    const candidates =
      (Array.isArray(data?.teamMembers) && data.teamMembers) ||
      (Array.isArray(data?.team) && data.team) ||
      (Array.isArray(data?.team?.members) && data.team.members);
    if (Array.isArray(candidates)) {
      return candidates
        .map((member: any) => {
          const photo =
            pickImageSource(member?.photo) ||
            pickImageSource(member?.image) ||
            pickImageSource(member?.avatar) ||
            pickImageSource(member) ||
            '';
          return {
            name: member.name || member.fullName || member.title || 'Team Member',
            role: member.role || member.position || 'Role',
            photo: photo || funkyFallbackImages[3]
          };
        })
        .filter((member) => Boolean(member.name));
    }
    return [];
  }
  
  function initialsFromFont(font: string, fallback: string): string {
    if (!font) return fallback;
    return font.trim().charAt(0).toUpperCase() || fallback;
  }
  
  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
    }
  }
  
  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
    }
  }
  
  function goToSlide(index: number) {
    currentSlideIndex = index;
  }
  
  // Helper function to create slide data directly from props (for PPTX export)
  // This ensures we have all slide data even when components aren't rendered
  function createAllSlideData(): SlideData[] {
    const allSlides: SlideData[] = [];
    
    // Helper to clean hex color
    const cleanHex = (color: string) => color.replace('#', '').substring(0, 6);
    
    // 1. Cover Slide
    const coverElements: SlideData['elements'] = [
      {
        id: 'cover-title',
        type: 'text' as const,
        position: { x: 1.0, y: 2.0, w: 8.0, h: 0.8 },
        text: brandName,
        fontSize: 48,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(primaryColor),
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 2
      },
      {
        id: 'cover-tagline',
        type: 'text' as const,
        position: { x: 1.0, y: 3.0, w: 8.0, h: 0.5 },
        text: tagline,
        fontSize: 24,
        fontFace: 'Arial',
        color: cleanHex(primaryColor),
        align: 'center' as const,
        valign: 'middle' as const,
        zIndex: 2
      }
    ];
    
    if (logoData) {
      coverElements.push({
        id: 'cover-logo',
        type: 'image' as const,
        position: { x: 4.0, y: 1.0, w: 2.0, h: 1.0 },
        imageData: logoData,
        zIndex: 2
      });
    }
    
    allSlides.push({
      id: 'cover',
      type: 'cover',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [cleanHex(primaryColor), cleanHex(secondaryColor), 'FFFFFF'],
            direction: 135
          }
        }
      },
      elements: coverElements
    });
    
    // 2. Brand Introduction Slide
    const brandIntroElements: SlideData['elements'] = [
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'Brand Introduction',
        fontSize: 36,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(primaryColor),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'divider',
        type: 'shape' as const,
        position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
        shapeType: 'rect',
        fillColor: cleanHex(primaryColor),
        zIndex: 2
      },
      {
        id: 'card-bg',
        type: 'shape' as const,
        position: { x: 1.25, y: 2.5, w: 7.5, h: 2.0 },
        shapeType: 'rect',
        fillColor: 'FFFFFF',
        lineColor: 'E0E0E0',
        lineWidth: 1,
        zIndex: 1
      },
      {
        id: 'border-left',
        type: 'shape' as const,
        position: { x: 1.25, y: 2.5, w: 0.15, h: 2.0 },
        shapeType: 'rect',
        fillColor: cleanHex(primaryColor),
        zIndex: 2
      },
      {
        id: 'positioning-statement',
        type: 'text' as const,
        position: { x: 1.5, y: 2.5, w: 7.25, h: 2.0 },
        text: positioningStatement || 'Our brand positioning statement',
        fontSize: 20,
        fontFace: 'Arial',
        color: '333333',
        align: 'left' as const,
        valign: 'middle' as const,
        zIndex: 2
      }
    ];
    
    allSlides.push({
      id: 'brand-introduction',
      type: 'content',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [cleanHex(color1Lighter), cleanHex(color2Lighter), cleanHex(color3Lighter), 'FFFFFF'],
            direction: 135
          }
        }
      },
      elements: brandIntroElements
    });
    
    // 3. Brand Positioning Slide
    const positioningElements: SlideData['elements'] = [
      {
        id: 'title',
        type: 'text' as const,
        position: { x: 0.47, y: 0.28, w: 9.06, h: 0.5 },
        text: 'BRAND POSITIONING',
        fontSize: 36,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(primaryColor),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'divider',
        type: 'shape' as const,
        position: { x: 0.47, y: 0.78, w: 9.06, h: 0.02 },
        shapeType: 'rect',
        fillColor: cleanHex(color1Hex),
        zIndex: 2
      }
    ];
    
    // Mission card
    positioningElements.push(
      {
        id: 'mission-card',
        type: 'shape' as const,
        position: { x: 0.47, y: 1.11, w: 3.65, h: 1.25 },
        shapeType: 'rect',
        fillColor: cleanHex(color1Lighter),
        lineColor: cleanHex(color1Hex),
        lineWidth: 2,
        zIndex: 1
      },
      {
        id: 'mission-title',
        type: 'text' as const,
        position: { x: 0.57, y: 1.21, w: 3.45, h: 0.25 },
        text: 'MISSION',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(color1Hex),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'mission-content',
        type: 'text' as const,
        position: { x: 0.57, y: 1.46, w: 3.45, h: 0.8 },
        text: mission || 'Our mission statement',
        fontSize: 12,
        fontFace: 'Arial',
        color: '2C2C2C',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      }
    );
    
    // Vision card
    positioningElements.push(
      {
        id: 'vision-card',
        type: 'shape' as const,
        position: { x: 4.32, y: 1.11, w: 3.65, h: 1.25 },
        shapeType: 'rect',
        fillColor: cleanHex(color2Lighter),
        lineColor: cleanHex(color2Hex),
        lineWidth: 2,
        zIndex: 1
      },
      {
        id: 'vision-title',
        type: 'text' as const,
        position: { x: 4.42, y: 1.21, w: 3.45, h: 0.25 },
        text: 'VISION',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(color2Hex),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'vision-content',
        type: 'text' as const,
        position: { x: 4.42, y: 1.46, w: 3.45, h: 0.8 },
        text: vision || 'Our vision statement',
        fontSize: 12,
        fontFace: 'Arial',
        color: '2C2C2C',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      }
    );
    
    // Values card
    positioningElements.push(
      {
        id: 'values-card',
        type: 'shape' as const,
        position: { x: 0.47, y: 2.56, w: 9.06, h: 1.25 },
        shapeType: 'rect',
        fillColor: cleanHex(color3Lighter),
        lineColor: cleanHex(color3Hex),
        lineWidth: 2,
        zIndex: 1
      },
      {
        id: 'values-title',
        type: 'text' as const,
        position: { x: 0.57, y: 2.66, w: 8.86, h: 0.25 },
        text: 'CORE VALUES',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(color3Hex),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'values-content',
        type: 'text' as const,
        position: { x: 0.57, y: 2.91, w: 8.86, h: 0.8 },
        text: values || 'Innovation • Excellence • Integrity',
        fontSize: 12,
        fontFace: 'Arial',
        color: '2C2C2C',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      }
    );
    
    // Target Audience card
    positioningElements.push(
      {
        id: 'audience-card',
        type: 'shape' as const,
        position: { x: 0.47, y: 4.01, w: 9.06, h: 1.25 },
        shapeType: 'rect',
        fillColor: cleanHex(color3Lighter),
        lineColor: cleanHex(color3Hex),
        lineWidth: 2,
        zIndex: 1
      },
      {
        id: 'audience-title',
        type: 'text' as const,
        position: { x: 0.57, y: 4.11, w: 8.86, h: 0.25 },
        text: 'TARGET AUDIENCE',
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: cleanHex(color3Hex),
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      },
      {
        id: 'audience-content',
        type: 'text' as const,
        position: { x: 0.57, y: 4.36, w: 8.86, h: 0.8 },
        text: personality || 'Our target audience',
        fontSize: 12,
        fontFace: 'Arial',
        color: '2C2C2C',
        align: 'left' as const,
        valign: 'top' as const,
        zIndex: 2
      }
    );
    
    allSlides.push({
      id: 'brand-positioning',
      type: 'content',
      layout: {
        width: 10,
        height: 5.625,
        background: {
          type: 'gradient',
          gradient: {
            colors: [cleanHex(color2Lighter), cleanHex(color3Lighter), 'FFFFFF', cleanHex(color1Lighter)],
            direction: 135
          }
        }
      },
      elements: positioningElements
    });
    
    if (effectiveSlideVibe === 'minimalist') {
      const minimalistGenerators = [
        () => minimalistCoverRef?.getSlideData(),
        () => minimalistBrandIntroductionRef?.getSlideData(),
        () => minimalistBrandPositioningRef?.getSlideData(),
        () => minimalistContentsRef?.getSlideData(),
        () => minimalistLogoOverviewRef?.getSlideData(),
        () => minimalistLogoShowcaseRef?.getSlideData(),
        () => minimalistTypographyHeroRef?.getSlideData(),
        () => minimalistTypographyDetailsRef?.getSlideData(),
        () => minimalistColorPaletteRef?.getSlideData(),
        () => minimalistColorUsageRef?.getSlideData(),
        () => minimalistSocialMediaRef?.getSlideData(),
        () => minimalistInspirationRef?.getSlideData(),
        () => minimalistMoodboardRef?.getSlideData(),
        () => minimalistThankYouRef?.getSlideData()
      ];
      return minimalistGenerators
        .map((generator, index) => {
          try {
            const slide = generator();
            if (slide && slide.elements?.length) {
              return slide;
            }
            console.warn(`Minimalist slide ${index} returned empty data.`);
            return null;
          } catch (error) {
            console.error(`Error generating minimalist slide ${index}:`, error);
            return null;
          }
        })
        .filter((slide): slide is SlideData => Boolean(slide));
    }
    
    if (effectiveSlideVibe === 'funky') {
      const funkyGenerators = [
        () => funkyCoverRef?.getSlideData(),
        () => funkyBrandStoryRef?.getSlideData(),
        () => funkyBrandPositioningRef?.getSlideData(),
        () => funkyTableOfContentsRef?.getSlideData(),
        () => funkyMoodboardRef?.getSlideData(),
        () => funkyPlanRef?.getSlideData(),
        () => funkyProductRef?.getSlideData(),
        () => funkyTeamRef?.getSlideData(),
        () => funkyPaletteRef?.getSlideData(),
        () => funkyLogoVariationsRef?.getSlideData(),
        () => funkyTypographyRef?.getSlideData(),
        () => funkyContactRef?.getSlideData()
      ];
      return funkyGenerators
        .map((generator, index) => {
          try {
            const slide = generator();
            if (slide && slide.elements?.length) {
              return slide;
            }
            console.warn(`Funky slide ${index} returned empty data.`);
            return null;
          } catch (error) {
            console.error(`Error generating funky slide ${index}:`, error);
            return null;
          }
        })
        .filter((slide): slide is SlideData => Boolean(slide));
    }
    
    // Continue with other slides... (Logo Guidelines, Color Palette, Typography, etc.)
    // For now, try to get data from refs if available, otherwise create from props
    const slideGenerators = [
      () => coverSlideRef?.getSlideData(),
      () => brandIntroRef?.getSlideData(),
      () => brandPositioningRef?.getSlideData(),
      () => logoGuidelinesRef?.getSlideData(),
      () => logoDosRef?.getSlideData(),
      () => logoDontsRef?.getSlideData(),
      () => colorPaletteRef?.getSlideData(),
      () => typographyRef?.getSlideData(),
      () => iconographyRef?.getSlideData(),
      () => photographyRef?.getSlideData(),
      () => applicationsRef?.getSlideData(),
      () => thankYouRef?.getSlideData()
    ];
    
    // Use refs if available, otherwise use the pre-built slides
    const finalSlides: SlideData[] = [];
    
    // Use cover and brand intro from our generated data
    finalSlides.push(allSlides[0], allSlides[1], allSlides[2]);
    
    // For remaining slides, try refs first, otherwise generate from props
    for (let i = 3; i < slideGenerators.length; i++) {
      const generator = slideGenerators[i];
      try {
        const slideData = generator();
        if (slideData && slideData.elements && slideData.elements.length > 0) {
          finalSlides.push(slideData);
        } else {
          console.warn(`Slide ${i} data is empty, using fallback`);
          // Could add fallback generation here
        }
      } catch (error) {
        console.error(`Error getting slide ${i} data:`, error);
        // Could add fallback generation here
      }
    }
    
    return finalSlides;
  }
  
  // Function to collect all slide data
  async function collectAllSlideData(): Promise<SlideData[]> {
    const allSlideData: SlideData[] = [];
    
    // Collect data from all slide components in correct order
    const slideRefs = effectiveSlideVibe === 'minimalist'
      ? [
          minimalistCoverRef,
          minimalistBrandIntroductionRef,
          minimalistBrandPositioningRef,
          minimalistContentsRef,
          minimalistLogoOverviewRef,
          minimalistLogoShowcaseRef,
          minimalistTypographyHeroRef,
          minimalistTypographyDetailsRef,
          minimalistColorPaletteRef,
          minimalistColorUsageRef,
          minimalistSocialMediaRef,
          minimalistInspirationRef,
          minimalistMoodboardRef,
          minimalistThankYouRef
        ]
      : effectiveSlideVibe === 'funky'
        ? [
            funkyCoverRef,
            funkyBrandStoryRef,
            funkyBrandPositioningRef,
            funkyTableOfContentsRef,
            funkyMoodboardRef,
            funkyPlanRef,
            funkyProductRef,
            funkyTeamRef,
            funkyPaletteRef,
            funkyLogoVariationsRef,
            funkyTypographyRef,
            funkyContactRef
          ]
        : [
            coverSlideRef,
            brandIntroRef,
            brandPositioningRef,
            logoGuidelinesRef,
            logoDosRef,
            logoDontsRef,
            colorPaletteRef,
            typographyRef,
            iconographyRef,
            photographyRef,
            applicationsRef,
            thankYouRef
          ];
    
    for (const ref of slideRefs) {
      if (ref && typeof ref.getSlideData === 'function') {
        try {
          let slideData: SlideData;
          
          // Special handling for iconography slide - convert text icons to image icons
          if (ref === iconographyRef && typeof (ref as any).getSlideDataWithIcons === 'function') {
            try {
              console.log('🔄 [SlideManager] Calling getSlideDataWithIcons() for iconography slide...');
              slideData = await (ref as any).getSlideDataWithIcons();
              console.log('✅ [SlideManager] Converted iconography icons to images');
              
              // Verify the conversion worked
              const textIcons = slideData.elements.filter(e => 
                e.id.startsWith('icon-symbol-') || e.id === 'demo-icon-symbol'
              );
              const imageIcons = slideData.elements.filter(e => 
                e.id.startsWith('icon-image-') || e.id === 'demo-icon-image'
              );
              console.log(`📊 [SlideManager] Iconography slide: ${imageIcons.length} image icons, ${textIcons.length} text icons`);
              
              if (textIcons.length > 0) {
                console.warn(`⚠️ [SlideManager] WARNING: ${textIcons.length} text icon elements still present!`);
              }
            } catch (iconError) {
              console.error('❌ [SlideManager] Failed to convert icons to images:', iconError);
              // Fallback to regular slideData with text icons
              slideData = ref.getSlideData();
            }
          } else {
            slideData = ref.getSlideData();
          }
          
          if (slideData && slideData.elements && slideData.elements.length > 0) {
            allSlideData.push(slideData);
          }
        } catch (error) {
          console.error('❌ Error getting slide data:', error);
        }
      }
    }
    
    return allSlideData;
  }
  
  // Note: Svelte slides are automatically saved server-side when HTML slides are generated
  // via the /api/preview-slides-html endpoint. No client-side saving is needed.
  
  // Export dropdown state
  let showExportDropdown = false;
  let exportDropdownRef: HTMLDivElement;
  
  async function downloadAllSlidesPPTX() {
    if (isDownloading) return;
    
    isDownloading = true;
    showExportDropdown = false; // Close dropdown
    try {
      console.log('🔄 Collecting slide data from all components...');
      
      const allSlideData = await collectAllSlideData();
      
      console.log(`📊 Collected ${allSlideData.length} slides, converting to PPTX...`);
      
      if (allSlideData.length === 0) {
        throw new Error('No slide data available to export');
      }
      
      const blob = await convertSvelteSlidesToPptx({
        slides: allSlideData,
        brandName: brandName,
        onProgress: (current, total) => {
          downloadProgress = { current, total };
        }
      });
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandName.replace(/[^a-zA-Z0-9]/g, '-')}-Brand-Guidelines.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ PPTX downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PPTX:', error);
      alert('Failed to generate PPTX file. Please try again.');
    } finally {
      isDownloading = false;
      downloadProgress = { current: 0, total: 0 };
    }
  }
  
  async function downloadAllSlidesPDF() {
    if (isDownloading) return;
    
    isDownloading = true;
    showExportDropdown = false; // Close dropdown
    try {
      console.log('🔄 Generating PDF from Svelte slides...');
      
      // Convert Svelte slide data to HTML slides for PDF generation
      // We'll use the brand data to generate HTML slides via the API
      const allSlideData = await collectAllSlideData();
      
      if (allSlideData.length === 0) {
        throw new Error('No slide data available to export');
      }
      
      // Convert SlideData to HTML format for PDF generation
      // The PDF API expects HTML slides, so we need to convert SlideData to HTML
      // For now, we'll use the brand data to regenerate HTML slides
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName,
          brandDomain: brandData?.brand_domain || brandData?.brandDomain || '',
          shortDescription: brandData?.short_description || brandData?.shortDescription || '',
          contact: brandData?.contact || {},
          stepHistory: brandData?.stepHistory || [],
          logoFiles: brandData?.logoFiles || [],
          logoUrl: brandData?.logoUrl,
          logo: brandData?.logo,
          // Pass brand data for HTML slide generation
          selectedMood: brandData?.selectedMood,
          selectedAudience: brandData?.selectedAudience,
          brandValues: brandData?.brandValues,
          customPrompt: brandData?.customPrompt
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate PDF');
      }
      
      // Download the PDF file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandName.replace(/[^a-zA-Z0-9]/g, '-')}-Brand-Guidelines.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF file. Please try again.');
    } finally {
      isDownloading = false;
      downloadProgress = { current: 0, total: 0 };
    }
  }
  
  async function exportToGoogleSlides() {
    if (isDownloading) return;
    
    isDownloading = true;
    showExportDropdown = false; // Close dropdown
    try {
      console.log('🔄 Exporting to Google Slides...');
      
      // Prepare brand data and steps
      if (!brandData || !brandData.stepHistory || brandData.stepHistory.length === 0) {
        throw new Error('No brand data or steps available to export');
      }
      
      // Convert stepHistory to StepData format
      const allSteps = brandData.stepHistory.map((step: any) => ({
        step: step.step || step.stepId || '',
        title: step.title || step.stepTitle || '',
        content: step.content || '',
        approved: step.approved !== false
      }));
      
      // Determine vibe from brandData
      const vibe = brandData.selectedMood || brandData.style || 'default';
      const normalizedVibe = ['minimalist', 'funky', 'maximalist', 'default'].includes(vibe.toLowerCase())
        ? vibe.toLowerCase()
        : 'default';
      
      const response = await fetch('/api/export-google-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandData: {
            brandName: brandName,
            brandDomain: brandData.brand_domain || brandData.brandDomain || '',
            stepHistory: brandData.stepHistory || [],
            logoFiles: brandData.logoFiles || []
          },
          allSteps: allSteps,
          vibe: normalizedVibe
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to export to Google Slides' }));
        throw new Error(errorData.error || errorData.details || 'Failed to export to Google Slides');
      }
      
      const result = await response.json();
      
      if (result.success && result.url) {
        // Open Google Slides in new tab
        window.open(result.url, '_blank');
        alert(`✅ Google Slides presentation created!\n\nYou can view and edit it here:\n${result.url}`);
      } else {
        throw new Error('Invalid response from server');
      }
      
      console.log('✅ Google Slides export successful');
    } catch (error: any) {
      console.error('❌ Error exporting to Google Slides:', error);
      alert(`Failed to export to Google Slides: ${error.message || 'Unknown error'}\n\nMake sure Google Slides API is configured in your .env file.`);
    } finally {
      isDownloading = false;
      downloadProgress = { current: 0, total: 0 };
    }
  }
  
  // Handle clicks outside dropdown to close it
  let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  
  $: if (showExportDropdown && typeof document !== 'undefined') {
    if (!clickOutsideHandler) {
      clickOutsideHandler = (e: MouseEvent) => {
        if (exportDropdownRef && !exportDropdownRef.contains(e.target as Node)) {
          showExportDropdown = false;
        }
      };
      document.addEventListener('click', clickOutsideHandler);
    }
  } else {
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
      clickOutsideHandler = null;
    }
  }
  
  onDestroy(() => {
    if (clickOutsideHandler && typeof document !== 'undefined') {
      document.removeEventListener('click', clickOutsideHandler);
    }
  });
</script>

<div class="slide-manager">
  <!-- Controls -->
  <div class="controls-bar">
    <div class="controls-left">
      <button
        onclick={() => {
          isEditable = !isEditable;
          if (isEditable) {
            showEditingPanel = true;
            updateEditingPanelData();
          } else {
            showEditingPanel = false;
          }
        }}
        class="btn"
        class:active={isEditable}
      >
        {isEditable ? '🔒 Lock Editing' : '✏️ Edit Slides'}
      </button>
      
      {#if isEditable}
        <button
          onclick={toggleEditingPanel}
          class="btn"
          class:active={showEditingPanel}
        >
          {showEditingPanel ? '📋 Hide Panel' : '📋 Show Panel'}
        </button>
      {/if}
      
      <!-- Export Dropdown -->
      <div class="relative inline-block" bind:this={exportDropdownRef}>
        <button
          onclick={() => showExportDropdown = !showExportDropdown}
          disabled={isDownloading}
          class="btn btn-primary flex items-center gap-2"
        >
          {#if isDownloading}
            ⏳ Generating... ({downloadProgress.current}/{downloadProgress.total})
          {:else}
            📥 Export As
            <span class="text-xs">▼</span>
          {/if}
        </button>
        
        {#if showExportDropdown}
          <div class="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <button
              class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-sm border-b border-gray-200"
              onclick={downloadAllSlidesPPTX}
              disabled={isDownloading}
            >
              📄 PPTX (Editable)
            </button>
            <button
              class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm border-b border-gray-200"
              onclick={exportToGoogleSlides}
              disabled={isDownloading}
            >
              📊 Google Slides
            </button>
            <button
              class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 text-sm"
              onclick={downloadAllSlidesPDF}
              disabled={isDownloading}
            >
              📄 PDF
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="controls-right">
      <button onclick={prevSlide} disabled={currentSlideIndex === 0} class="btn">
        ← Previous
      </button>
      <span class="slide-counter">
        Slide {currentSlideIndex + 1} of {slides.length}
      </span>
      <button onclick={nextSlide} disabled={currentSlideIndex === slides.length - 1} class="btn">
        Next →
      </button>
    </div>
  </div>
  
  <!-- Slide Navigation -->
  <div class="slide-navigation">
    {#each slides as slide, index}
      <button
        onclick={() => goToSlide(index)}
        class="nav-item"
        class:active={currentSlideIndex === index}
      >
        {slide.name}
      </button>
    {/each}
  </div>
  
  <!-- Slide Viewer -->
  <div class="slide-viewer">
    <div class="slide-container">
      {#if effectiveSlideVibe === 'minimalist'}
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 0}>
          <MinimalistCoverSlide
            bind:this={minimalistCoverRef}
            titlePrimary={minimalistCoverProps.titlePrimary}
            titleSecondary={minimalistCoverProps.titleSecondary}
            subtitle={minimalistCoverProps.subtitle}
            website={minimalistCoverProps.website}
            backgroundColor={minimalistCoverProps.backgroundColor}
            textColor={minimalistCoverProps.textColor}
            accentLineColor={minimalistCoverProps.accentLineColor}
            accentCircleColor={minimalistCoverProps.accentCircleColor}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 1}>
          <MinimalistBrandIntroductionSlide
            bind:this={minimalistBrandIntroductionRef}
            brandName={brandName || 'Brand Name'}
            tagline={tagline || 'Brand Guidelines'}
            positioningStatement={positioningStatement}
            primaryColor={color1Hex}
            secondaryColor={color2Hex}
            accentColor={color3Hex}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 2}>
          <MinimalistBrandPositioningSlide
            bind:this={minimalistBrandPositioningRef}
            mission={mission}
            vision={vision}
            values={values}
            targetAudience={targetAudience}
            primaryColor={color1Hex}
            secondaryColor={color2Hex}
            accentColor={color3Hex}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 3}>
          <MinimalistContentsSlide
            bind:this={minimalistContentsRef}
            sections={minimalistContentsSections}
            imageSrc={minimalistImageSources[0] || ''}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            imagePlaceholderColor={minimalistPlaceholderColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 4}>
          <MinimalistLogoOverviewSlide
            bind:this={minimalistLogoOverviewRef}
            title="Logo"
            description={minimalistLogoOverviewDescription}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 5}>
          <MinimalistLogoShowcaseSlide
            bind:this={minimalistLogoShowcaseRef}
            primaryImageSrc={logoData || logoUrl}
            secondaryImageSrc={logoUrl}
            primaryDescription={minimalistLogoPrimaryDescription}
            secondaryDescription={minimalistLogoSecondaryDescription}
            textColor={minimalistTextColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            swatchBackground={minimalistPlaceholderColor}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 6}>
          <MinimalistTypographyHeroSlide
            bind:this={minimalistTypographyHeroRef}
            title="Typography"
            description={`${primaryFont || 'Primary Font'} + ${secondaryFont || 'Secondary Font'} pairing`}
            primaryLetter={initialsFromFont(primaryFont, 'B')}
            secondaryLetter={initialsFromFont(secondaryFont, 'b')}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 7}>
          <MinimalistTypographyDetailsSlide
            bind:this={minimalistTypographyDetailsRef}
            columns={minimalistTypographyColumns}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 8}>
          <MinimalistColorPaletteSlide
            bind:this={minimalistColorPaletteRef}
            colors={minimalistPalette}
            description={positioningStatement || values || 'Brand color system'}
            textColor={minimalistTextColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 9}>
          <MinimalistColorUsageSlide
            bind:this={minimalistColorUsageRef}
            swatches={minimalistUsage}
            description={personality || 'Color usage guidance'}
            textColor={minimalistTextColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 10}>
          <MinimalistSocialMediaSlide
            bind:this={minimalistSocialMediaRef}
            description={minimalistSocialDescription}
            imageSrc={minimalistImageSources[3] || minimalistImageSources[0] || ''}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            placeholderColor={minimalistPlaceholderColor}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 11}>
          <MinimalistInspirationSlide
            bind:this={minimalistInspirationRef}
            description={values || mission || 'Inspiration references'}
            mainImageSrc={minimalistInspirationImages.main}
            secondaryImageSrc={minimalistInspirationImages.secondary}
            tertiaryImageSrc={minimalistInspirationImages.tertiary}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            placeholderColor={minimalistPlaceholderColor}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 12}>
          <MinimalistMoodboardSlide
            bind:this={minimalistMoodboardRef}
            images={minimalistMoodboardImages}
            textColor={minimalistTextColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            placeholderColor={minimalistPlaceholderColor}
            brandName={brandName || ''}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 13}>
          <MinimalistThankYouSlide
            bind:this={minimalistThankYouRef}
            title={thankYouText || 'Thanks!'}
            description={minimalistThankYouDescription}
            imageSrc={minimalistImageSources[4] || minimalistImageSources[0] || ''}
            textColor={minimalistTextColor}
            accentCircleColor={minimalistAccentCircleColor}
            backgroundColor={MINIMALIST_BACKGROUND}
            placeholderColor={minimalistPlaceholderColor}
            brandName={brandName || ''}
          />
        </div>
      {:else if effectiveSlideVibe === 'funky'}
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 0}>
          <FunkyCoverSlide
            bind:this={funkyCoverRef}
            brandName={brandName || 'Reallygreatsite'}
            heading={`${brandName || 'Brand'} Guidelines`}
            subheading={funkySubheading}
            loopLabel={funkyLoopLabel}
            pageLabel={funkyPageLabels[0]}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 1}>
          <FunkyBrandStorySlide
            bind:this={funkyBrandStoryRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[1]}
            title="Brand Introduction"
            description={positioningStatement || mission || values || 'Presentation tools that tell your story.'}
            heroImage={funkyHeroImage}
            insetImage={funkyInsetImage}
            stampText={funkyLoopLabel}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 2}>
          <FunkyBrandPositioningSlide
            bind:this={funkyBrandPositioningRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[2]}
            mission={mission}
            vision={vision}
            values={values}
            targetAudience={targetAudience}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 3}>
          <FunkyTableOfContentsSlide
            bind:this={funkyTableOfContentsRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[3]}
            title="Table of Contents"
            items={funkyContentsItems}
            featuredImage={funkyHeroImage}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 4}>
          <FunkyMoodboardSlide
            bind:this={funkyMoodboardRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[4]}
            title="Mood Board"
            description={personality || positioningStatement || 'Presentation tools for demonstrations, lectures, and more.'}
            images={funkyMoodboardImages}
            colorDots={funkyColorDots}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 5}>
          <FunkyPlanSlide
            bind:this={funkyPlanRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[5]}
            title="Our Plan"
            vision={vision || mission || 'Communicate clearly across every touchpoint.'}
            mission={mission || vision || 'Enable consistent storytelling for your brand.'}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 6}>
          <FunkyProductSlide
            bind:this={funkyProductRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[6]}
            title="The Product"
            description={funkyProductDescription}
            gallery={funkyGalleryImages}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 7}>
          {#if funkyTeamMembers.length}
            <FunkyTeamSlide
              bind:this={funkyTeamRef}
              brandName={brandName || 'Reallygreatsite'}
              pageLabel={funkyPageLabels[7]}
              members={funkyTeamMembers}
              theme={funkyTheme}
              {isEditable}
            />
          {:else}
            <FunkyTeamSlide
              bind:this={funkyTeamRef}
              brandName={brandName || 'Reallygreatsite'}
              pageLabel={funkyPageLabels[7]}
              theme={funkyTheme}
              {isEditable}
            />
          {/if}
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 8}>
          <FunkyPaletteSlide
            bind:this={funkyPaletteRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[8]}
            title="Palette"
            colors={funkyPaletteColors}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 9}>
          <FunkyLogoVariationsSlide
            bind:this={funkyLogoVariationsRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[9]}
            title="Logo Variation"
            variations={funkyLogoVariations}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 10}>
          <FunkyTypographySlide
            bind:this={funkyTypographyRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[10]}
            title="Typeface"
            description={funkyTypographyDescription}
            fontFamily={funkyTypographyFont}
            primarySample={primaryWeights || 'Aa Bb Cc 123'}
            secondarySample={secondaryWeights || 'Aa Bb Cc 123'}
            supportingCopy="Typography"
            theme={funkyTheme}
            {isEditable}
          />
        </div>
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== 11}>
          <FunkyContactSlide
            bind:this={funkyContactRef}
            brandName={brandName || 'Reallygreatsite'}
            pageLabel={funkyPageLabels[11]}
            title={thankYouText || 'Contact Us'}
            website={funkyWebsiteDisplay}
            email={email || 'hello@reallygreatsite.com'}
            phone={phone || '123-456-7890'}
            contactImage={funkyContactImage}
            theme={funkyTheme}
            {isEditable}
          />
        </div>
      {:else}
        <!-- Render all slides but hide non-visible ones -->
        <!-- This ensures all refs are available for PPTX export -->
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 0}>
        <CoverSlide
          bind:this={coverSlideRef}
          bind:brandName
          bind:tagline
          date={new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
          color1Hex={color1Hex}
          color2Hex={color2Hex}
          color3Hex={color3Hex}
          color4Hex={color4Hex}
          {logoData}
          background={currentSlideIndex === 0 ? currentSlideBackground : getDefaultBackground(0)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 1}>
        <BrandIntroductionSlide
          bind:this={brandIntroRef}
          bind:positioningStatement
          color1Hex={color1Hex}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color1Rgba10={color1Rgba10}
          color2Rgba10={color2Rgba10}
          background={currentSlideIndex === 1 ? currentSlideBackground : getDefaultBackground(1)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 2}>
        <BrandPositioningSlide
          bind:this={brandPositioningRef}
          bind:mission
          bind:vision
          bind:values
          bind:targetAudience
          personality={personality}
          color1Hex={color1Hex}
          color2Hex={color2Hex}
          color3Hex={color3Hex}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color1Rgba15={color1Rgba15}
          color2Rgba15={color2Rgba15}
          color3Rgba15={color3Rgba15}
          color1Rgba5={color1Rgba5}
          background={currentSlideIndex === 2 ? currentSlideBackground : getDefaultBackground(2)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 3}>
        <LogoGuidelinesSlide
          bind:this={logoGuidelinesRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          color1Hex={color1Hex}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color3Rgba12={color3Rgba12}
          color4Rgba12={color4Rgba12}
          background={currentSlideIndex === 3 ? currentSlideBackground : getDefaultBackground(3)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 4}>
        <LogoDosSlide
          bind:this={logoDosRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          color1Hex={color1Hex}
          color4Hex={color4Hex}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color1Rgba10={color1Rgba10}
          color3Rgba10={color3Rgba10}
          background={currentSlideIndex === 4 ? currentSlideBackground : getDefaultBackground(4)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 5}>
        <LogoDontsSlide
          bind:this={logoDontsRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          color1Hex={color1Hex}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color5Lighter={color5Lighter}
          color2Rgba12={color2Rgba12}
          color4Rgba12={color4Rgba12}
          background={currentSlideIndex === 5 ? currentSlideBackground : getDefaultBackground(5)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 6}>
        <ColorPaletteSlide
          bind:this={colorPaletteRef}
          bind:colors
          color1Hex={color1Hex}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color1Rgba15={color1Rgba15}
          color2Rgba15={color2Rgba15}
          color3Rgba10={color3Rgba10}
          background={currentSlideIndex === 6 ? currentSlideBackground : getDefaultBackground(6)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 7}>
        <TypographySlide
          bind:this={typographyRef}
          bind:primaryFont
          bind:secondaryFont
          bind:primaryWeights
          bind:secondaryWeights
          color1Hex={color1Hex}
          color4Lighter={color4Lighter}
          color5Lighter={color5Lighter}
          color6Lighter={color6Lighter}
          color4Rgba8={color4Rgba8}
          color5Rgba8={color5Rgba8}
          color6Rgba8={color6Rgba8}
          background={currentSlideIndex === 7 ? currentSlideBackground : getDefaultBackground(7)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 8}>
        <IconographySlide
          bind:this={iconographyRef}
          bind:icons
          color1Hex={color1Hex}
          color4Hex={color4Hex}
          color5Lighter={color5Lighter}
          color6Lighter={color6Lighter}
          color7Lighter={color7Lighter}
          color5Rgba12={color5Rgba12}
          color6Rgba12={color6Rgba12}
          background={currentSlideIndex === 8 ? currentSlideBackground : getDefaultBackground(8)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 9}>
        <PhotographySlide
          bind:this={photographyRef}
          color1Hex={color1Hex}
          color4Hex={color4Hex}
          bind:photoLabel1
          bind:photoLabel2
          bind:photoLabel3
          bind:photoLabel4
          bind:photoEmoji1
          bind:photoEmoji2
          bind:photoEmoji3
          bind:photoEmoji4
          bind:guidelineTitle1
          bind:guidelineItems
          bind:guidelineTitle2
          bind:doText
          bind:dontText
          color6Lighter={color6Lighter}
          color7Lighter={color7Lighter}
          color8Lighter={color8Lighter}
          color6Rgba10={color6Rgba10}
          color7Rgba10={color7Rgba10}
          background={currentSlideIndex === 9 ? currentSlideBackground : getDefaultBackground(9)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 10}>
        <ApplicationsSlide
          bind:this={applicationsRef}
          bind:applications
          color1Hex={color1Hex}
          color4Hex={color4Hex}
          color7Lighter={color7Lighter}
          color8Lighter={color8Lighter}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color7Rgba12={color7Rgba12}
          color8Rgba12={color8Rgba12}
          color1Rgba5={color1Rgba5}
          background={currentSlideIndex === 10 ? currentSlideBackground : getDefaultBackground(10)}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 11}>
        <ThankYouSlide
          bind:this={thankYouRef}
          bind:thankYouText
          bind:subtitleText
          bind:contactName
          bind:contactEmail
          bind:contactRole
          bind:contactCompany
          bind:website
          bind:phone
          color1Hex={color1Hex}
          color2Hex={color2Hex}
          color3Hex={color3Hex}
          color4Hex={color4Hex}
          background={currentSlideIndex === 11 ? currentSlideBackground : getDefaultBackground(11)}
          {isEditable}
        />
      </div>
      {#each sectionSlides as dynamicSlide, sectionIndex}
        <div class="slide-wrapper" class:hidden={currentSlideIndex !== defaultSlideCount + sectionIndex}>
          <div class="dynamic-section-slide">
            <div class="dynamic-section-header">
              <div>
                <h2>{dynamicSlide.title}</h2>
                {#if dynamicSlide.partLabel}
                  <p class="dynamic-section-label">{dynamicSlide.partLabel}</p>
                {/if}
              </div>
              <span class="dynamic-section-pill">Guideline {sectionIndex + 1}</span>
            </div>
            <div class="dynamic-section-body">
              {#each dynamicSlide.sections as section}
                <div class="dynamic-section-card">
                  <h3>{section.title}</h3>
                  {#if section.description}
                    <p>{section.description}</p>
                  {/if}
                  {#if section.points && section.points.length}
                    <ul>
                      {#each section.points as point}
                        <li>{point}</li>
                      {/each}
                    </ul>
                  {/if}
                  {#if section.examples && section.examples.length}
                    <div class="dynamic-section-examples">
                      {#each section.examples as example}
                        <span class="example-chip">{example}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
      {/if}
    </div>
  </div>
  
  <!-- Editing Panel -->
  <EditingPanel
    isOpen={showEditingPanel && isEditable}
    slideType={currentSlideName}
    editableData={editingPanelData}
    on:update={handleEditingPanelUpdate}
    on:close={() => showEditingPanel = false}
  />
</div>

<style>
  .slide-manager {
    display: flex;
    flex-direction: column;
    min-height: 600px;
    max-height: 90vh;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .controls-left,
  .controls-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .btn:hover:not(:disabled) {
    background: #f5f5f5;
  }
  
  .btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .btn-primary {
    background: #28a745;
    color: white;
    border-color: #28a745;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #218838;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .slide-counter {
    padding: 0 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .slide-navigation {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
  }
  
  .nav-item {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
    transition: all 0.2s;
  }
  
  .nav-item:hover {
    background: #f5f5f5;
    border-color: #007bff;
  }
  
  .nav-item.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .slide-viewer {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: #f9fafb;
    padding: 2rem;
  }
  
  .slide-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 760px;
    padding: 20px;
    background: #f9fafb;
    position: relative;
  }

  .dynamic-section-slide {
    background: #ffffff;
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);
    border: 1px solid #e4e7ec;
    width: 100%;
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dynamic-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .dynamic-section-header h2 {
    margin: 0;
    font-size: 1.75rem;
    color: #111827;
  }

  .dynamic-section-label {
    margin: 0.2rem 0 0;
    color: #6b7280;
    font-size: 0.95rem;
  }

  .dynamic-section-pill {
    padding: 0.35rem 0.9rem;
    background: #eef2ff;
    color: #4338ca;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .dynamic-section-body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
  }

  .dynamic-section-card {
    border: 1px solid #e4e7ec;
    border-radius: 18px;
    padding: 1.2rem;
    background: #fdfdfd;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .dynamic-section-card h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .dynamic-section-card p {
    margin: 0;
    color: #475467;
    line-height: 1.4;
  }

  .dynamic-section-card ul {
    padding-left: 1.2rem;
    margin: 0;
    color: #475467;
  }

  .dynamic-section-card li {
    margin-bottom: 0.25rem;
  }

  .dynamic-section-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .example-chip {
    padding: 0.25rem 0.8rem;
    background: #f4f8ff;
    color: #1d4ed8;
    border-radius: 999px;
    font-size: 0.8rem;
  }
  
  .slide-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 720px;
  }
  
  .slide-wrapper.hidden {
    display: none;
  }
</style>

