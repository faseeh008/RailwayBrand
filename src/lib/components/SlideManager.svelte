<script lang="ts">
import { onMount, onDestroy, tick } from 'svelte';
import CoverSlide from '$lib/templates_svelte/default/CoverSlide.svelte';
import BrandIntroductionSlide from '$lib/templates_svelte/default/BrandIntroductionSlide.svelte';
import BrandPositioningSlide from '$lib/templates_svelte/default/BrandPositioningSlide.svelte';
import LogoGuidelinesSlide from '$lib/templates_svelte/default/LogoGuidelinesSlide.svelte';
import ColorPaletteSlide from '$lib/templates_svelte/default/ColorPaletteSlide.svelte';
import TypographySlide from '$lib/templates_svelte/default/TypographySlide.svelte';
import IconographySlide from '$lib/templates_svelte/default/IconographySlide.svelte';
import PhotographySlide from '$lib/templates_svelte/default/PhotographySlide.svelte';
import ApplicationsSlide from '$lib/templates_svelte/default/ApplicationsSlide.svelte';
import LogoDosSlide from '$lib/templates_svelte/default/LogoDosSlide.svelte';
import LogoDontsSlide from '$lib/templates_svelte/default/LogoDontsSlide.svelte';
import ThankYouSlide from '$lib/templates_svelte/default/ThankYouSlide.svelte';
import type { SlideData } from '$lib/types/slide-data';
import EditingPanel from './EditingPanel.svelte';
import {
	Pencil,
	FileDown,
	ChevronLeft,
	ChevronRight,
	Folder,
	Save as SaveIcon,
	Loader2,
	Presentation as PresentationIcon,
	Globe,
	Download,
	Trash2
} from 'lucide-svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  
export let brandData: any = null;
export let onDownloadPPTX: (() => void | Promise<void>) | null = null;
export let onDownloadPDF: (() => void | Promise<void>) | null = null;
export let isDownloading = false;
export let onGoToBrands: (() => void | Promise<void>) | null = null;
export let onSaveSlides:
	| ((payload: { brandDataSnapshot: any; slidesHtml: Array<{ name: string; html: string }> }) => void | Promise<void>)
	| null = null;
export let isSavingSlides = false;

// Mock webpage controls (optional, provided by parent preview-html page)
export let onBuildMockWebpage: (() => void | Promise<void>) | null = null;
export let onVisitMockWebpage: (() => void | Promise<void>) | null = null;
export let onDownloadMockWebpage: (() => void | Promise<void>) | null = null;
export let onDeleteMockWebpage: (() => void | Promise<void>) | null = null;
export let isBuildingMockWebpage = false;
export let hasMockWebpage = false;
  
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
  
// State
let currentSlideIndex = 0;
let isEditable = false;
let showEditingPanel = false;
let editingPanelData: any = {};
let colorSignature = '';
let showExportDropdown = false;
let exportDropdownRef: HTMLDivElement | null = null;
let slideWrappers: Array<HTMLDivElement | null> = [];

function trackSlideWrapper(node: HTMLDivElement, index: number) {
	slideWrappers[index] = node;
	return {
		destroy() {
			if (slideWrappers[index] === node) {
				slideWrappers[index] = null;
			}
		}
	};
}

function handleDocumentClick(event: MouseEvent) {
  if (
    showExportDropdown &&
    exportDropdownRef &&
    !exportDropdownRef.contains(event.target as Node)
  ) {
    showExportDropdown = false;
  }
}

onMount(() => {
  document.addEventListener('click', handleDocumentClick);
});

onDestroy(() => {
  document.removeEventListener('click', handleDocumentClick);
});
  
  // Get current slide name
  $: currentSlideName = slides[currentSlideIndex]?.name || '';
  
// Get current slide's background (reactive to slide index, saved backgrounds, and color palette)
$: currentSlideBackground = (() => {
  colorSignature; // ensure dependency on palette colors
  return slideBackgrounds[currentSlideIndex] || getDefaultBackground(currentSlideIndex);
})();
  
  // Update editing panel data when slide changes or isEditable changes
  $: if (currentSlideIndex !== undefined) {
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

function cloneBrandDataBase() {
	try {
		return structuredClone(brandData ?? {});
	} catch (error) {
		return brandData ? JSON.parse(JSON.stringify(brandData)) : {};
	}
}

function ensureColorEntry(entry: any, fallback: string) {
	if (!entry) return { hex: fallback };
	if (typeof entry === 'string') return { hex: entry };
	return { ...entry, hex: entry.hex || fallback };
}

export function getBrandDataSnapshot() {
	const updated = cloneBrandDataBase();

	updated.brandName = brandName;
	updated.brand_name = brandName;
	updated.tagline = tagline;
	updated.positioningStatement = positioningStatement;
	updated.mission = mission;
	updated.vision = vision;
	updated.values = values;
	updated.personality = personality;

	updated.colors = updated.colors || {};
	updated.colors.primary = ensureColorEntry(updated.colors.primary, primaryColor);
	updated.colors.primary.hex = primaryColor;
	updated.colors.secondary = ensureColorEntry(updated.colors.secondary, secondaryColor);
	updated.colors.secondary.hex = secondaryColor;
	updated.colors.accent = ensureColorEntry(updated.colors.accent, color2);
	updated.colors.accent.hex = color2;
	updated.colors.supporting = ensureColorEntry(updated.colors.supporting, color3);
	updated.colors.supporting.hex = color3;
	updated.colors.allColors = colors.map((color, idx) => ({
		name: color.name || `Color ${idx + 1}`,
		hex: color.hex,
		usage: color.usage || 'Brand color'
	}));

	updated.typography = updated.typography || {};
	updated.typography.primaryFont = {
		name: primaryFont,
		weights: primaryWeights
	};
	updated.typography.supporting = {
		name: secondaryFont,
		weights: secondaryWeights
	};

	updated.icons = icons;
	updated.applications = applications;
	updated.doText = doText;
	updated.dontText = dontText;
	updated.guidelineTitle1 = guidelineTitle1;
	updated.guidelineItems = guidelineItems;
	updated.guidelineTitle2 = guidelineTitle2;

	updated.contact = {
		...(updated.contact || {}),
		name: contactName,
		email: contactEmail,
		role: contactRole,
		company: contactCompany,
		website,
		phone
	};

	return updated;
}

export function getSlidesHtmlSnapshot(): Array<{ name: string; html: string }> {
	return slides.map((slide, index) => {
		const wrapper = slideWrappers[index];
		return {
			name: slide.name,
			html: wrapper ? wrapper.innerHTML : ''
		};
	});
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
    const rawLogoEntry = brandData?.logoFiles?.[0];
    const rawLogoData =
      rawLogoEntry?.fileUrl ||
      rawLogoEntry?.fileData ||
      rawLogoEntry?.url ||
      rawLogoEntry?.filePath ||
      '';
    if (rawLogoData && rawLogoData.startsWith('data:image')) {
      // If it already has the data:image prefix, use it as is
      logoData = rawLogoData;
    } else if (rawLogoData && (rawLogoData.startsWith('http') || rawLogoData.startsWith('/'))) {
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
  
  // Extract colors from colors array in the same order as HTML templates
  // COLOR_1 = colors[0], COLOR_2 = colors[1], etc.
  $: color1Hex = colors.length > 0 ? colors[0].hex : primaryColor;
  $: color2Hex = colors.length > 1 ? colors[1].hex : (colors.length > 0 ? colors[0].hex : color2);
  $: color3Hex = colors.length > 2 ? colors[2].hex : (colors.length > 1 ? colors[1].hex : color3);
  $: color4Hex = colors.length > 3 ? colors[3].hex : (colors.length > 2 ? colors[2].hex : secondaryColor);
  $: color5Hex = colors.length > 4 ? colors[4].hex : '#60A5FA';
  $: color6Hex = colors.length > 5 ? colors[5].hex : '#3B82F6';
  $: color7Hex = colors.length > 6 ? colors[6].hex : '#1E40AF';
  $: color8Hex = colors.length > 7 ? colors[7].hex : '#2563EB';
  
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

$: colorSignature = JSON.stringify({
  c1: color1Hex,
  c2: color2Hex,
  c3: color3Hex,
  c4: color4Hex,
  c5: color5Hex,
  c6: color6Hex,
  c7: color7Hex,
  c8: color8Hex,
  c1L: color1Lighter,
  c2L: color2Lighter,
  c3L: color3Lighter,
  c4L: color4Lighter,
  c5L: color5Lighter,
  c6L: color6Lighter,
  c7L: color7Lighter,
  c8L: color8Lighter,
  c1R: color1Rgba5,
  c7R: color7Rgba12,
  c8R: color8Rgba12
});
  
  // Slide list
  const slides = [
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
  
  
  // Note: Svelte slides are automatically saved server-side when HTML slides are generated
  // via the /api/preview-slides-html endpoint. No client-side saving is needed.
  
</script>

<div class="slide-manager">
  <div class="presentation-header">
    <div class="presentation-title">
      <div class="icon-circle">
        <PresentationIcon class="h-5 w-5" />
      </div>
      <div class="title-text">
        <p class="title-label">Presentation</p>
        <span class="title-subtext">Slides overview</span>
      </div>
    </div>
    <div class="presentation-actions">
      <div class="theme-toggle-chip">
        <ThemeToggle />
      </div>
      <div class="btn-group">
        {#if onGoToBrands}
          <a
            href="/dashboard/my-brands"
            class="btn secondary large"
            onclick={() => onGoToBrands?.()}
          >
            <Folder class="h-4 w-4" />
            Go to My Brands
          </a>
        {/if}

        {#if onBuildMockWebpage}
          {#if !hasMockWebpage}
            <button
              class="btn large btn-build"
              class:loading={isBuildingMockWebpage}
              disabled={isBuildingMockWebpage}
              onclick={() => onBuildMockWebpage?.()}
            >
              {#if isBuildingMockWebpage}
                <Loader2 class="h-4 w-4 animate-spin" />
                Building Mock Webpage...
              {:else}
                <Globe class="h-4 w-4" />
                Build Mock Webpage
              {/if}
            </button>
          {:else}
            {#if onVisitMockWebpage}
              <button
                class="btn large btn-visit"
                onclick={() => onVisitMockWebpage?.()}
              >
                <Globe class="h-4 w-4" />
                Visit Mock Webpage
              </button>
            {/if}

            {#if onDownloadMockWebpage}
              <button
                class="btn navigation"
                onclick={() => onDownloadMockWebpage?.()}
              >
                <Download class="h-4 w-4" />
                Download HTML
              </button>
            {/if}

            {#if onDeleteMockWebpage}
              <button
                class="btn btn-delete"
                onclick={() => onDeleteMockWebpage?.()}
              >
                <Trash2 class="h-4 w-4" />
                Delete
              </button>
            {/if}
          {/if}
        {/if}
      </div>
    </div>
  </div>
  <!-- Controls -->
  <div class="controls-bar">
    <div class="controls-left">
      <button
        onclick={() => {
          if (isEditable) {
            isEditable = false;
            showEditingPanel = false;
          } else {
            isEditable = true;
            showEditingPanel = true;
            updateEditingPanelData();
          }
        }}
        class="btn"
        class:active={isEditable}
      >
        <Pencil class="h-4 w-4" />
        <span>{isEditable ? 'Editing Mode' : 'Edit Slides'}</span>
      </button>
      
      {#if isEditable}
        <button
          class="btn secondary"
          onclick={async () => {
            if (isSavingSlides || !onSaveSlides) return;
            await onSaveSlides({
              brandDataSnapshot: getBrandDataSnapshot(),
              slidesHtml: getSlidesHtmlSnapshot()
            });
            isEditable = false;
            showEditingPanel = false;
          }}
          disabled={isSavingSlides}
        >
          {#if isSavingSlides}
            <Loader2 class="h-4 w-4 animate-spin" />
            Saving Slides...
          {:else}
            <SaveIcon class="h-4 w-4" />
            Save Slides
          {/if}
        </button>
      {:else}
        <div class="export-controls" bind:this={exportDropdownRef}>
          <button
            class="btn"
            class:active={showExportDropdown}
            disabled={isDownloading || (!onDownloadPPTX && !onDownloadPDF)}
            onclick={() => {
              if (isDownloading || (!onDownloadPPTX && !onDownloadPDF)) return;
              showExportDropdown = !showExportDropdown;
            }}
          >
            <FileDown class="h-4 w-4" />
            <span>{isDownloading ? 'Exporting…' : 'Export Slides'}</span>
          </button>

          {#if showExportDropdown}
            <div class="export-dropdown">
              {#if onDownloadPPTX}
                <button
                  class="dropdown-item"
                  onclick={() => {
                    onDownloadPPTX?.();
                    showExportDropdown = false;
                  }}
                  disabled={isDownloading}
                >
                  <FileDown class="h-4 w-4" />
                  <span>PPTX</span>
                </button>
              {/if}
              {#if onDownloadPDF}
                <button
                  class="dropdown-item"
                  onclick={() => {
                    onDownloadPDF?.();
                    showExportDropdown = false;
                  }}
                  disabled={isDownloading}
                >
                  <FileDown class="h-4 w-4" />
                  <span>PDF</span>
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
      
    </div>
  </div>
  
  <div class="slide-workspace">
    <div class="slide-stage" class:panel-open={showEditingPanel && isEditable}>
      <!-- Slide Navigation -->
      <div class="slide-navigation">
        {#each slides as slide, index}
          <button
            onclick={() => goToSlide(index)}
            class="nav-card"
            class:active={currentSlideIndex === index}
          >
            <span class="slide-index">{index + 1}</span>
            <div class="slide-meta">
              <p class="slide-name">{slide.name}</p>
              <p class="slide-hint">Click to focus</p>
            </div>
          </button>
        {/each}
      </div>

      <!-- Slide Viewer -->
      <div class="slide-viewer">
        <div class="slide-nav-overlay">
          <button onclick={prevSlide} disabled={currentSlideIndex === 0} class="btn navigation">
            <ChevronLeft class="h-4 w-4" />
            Previous
          </button>
          <span class="slide-counter">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
          <button onclick={nextSlide} disabled={currentSlideIndex === slides.length - 1} class="btn navigation">
            Next
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
        <div class="slide-container">
      <!-- Render all slides but hide non-visible ones -->
      <!-- This ensures all refs are available for PPTX export -->
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={0}
        class:hidden={currentSlideIndex !== 0}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={1}
        class:hidden={currentSlideIndex !== 1}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={2}
        class:hidden={currentSlideIndex !== 2}
      >
        <BrandPositioningSlide
          bind:this={brandPositioningRef}
          bind:mission
          bind:vision
          bind:values
          bind:personality
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={3}
        class:hidden={currentSlideIndex !== 3}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={4}
        class:hidden={currentSlideIndex !== 4}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={5}
        class:hidden={currentSlideIndex !== 5}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={6}
        class:hidden={currentSlideIndex !== 6}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={7}
        class:hidden={currentSlideIndex !== 7}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={8}
        class:hidden={currentSlideIndex !== 8}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={9}
        class:hidden={currentSlideIndex !== 9}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={10}
        class:hidden={currentSlideIndex !== 10}
      >
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
      <div
        class="slide-wrapper"
        use:trackSlideWrapper={11}
        class:hidden={currentSlideIndex !== 11}
      >
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
        </div>
      </div>
    </div>

    <!-- Editing Panel -->
    <EditingPanel
      isOpen={showEditingPanel && isEditable}
      slideType={currentSlideName}
      editableData={editingPanelData}
      on:update={handleEditingPanelUpdate}
      on:close={() => {
        showEditingPanel = false;
        isEditable = false;
      }}
    />
  </div>
</div>

<style>
  .slide-manager {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    background: transparent;
  }
  
  .presentation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0 0.5rem 0 0.5rem;
    background: transparent;
  }
  
  .presentation-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .icon-circle {
    width: 52px;
    height: 52px;
    border-radius: 999px;
    background: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111827;
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.12);
    margin-top: 0.15rem;
  }
  
  .dark .icon-circle {
    background: #f59e0b;
    color: #111827;
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.2);
  }
  
  .title-text {
    display: flex;
    flex-direction: column;
  }
  
  .title-label {
    font-size: 1.35rem;
    font-weight: 600;
    color: #111827;
  }
  
  :global(.dark) .title-label,
  .dark .title-label {
    color: #ffffff !important;
  }
  
  .title-subtext {
    font-size: 0.95rem;
    color: #6b7280;
    display: block;
  }
  
  .dark .title-subtext {
    color: #d1d5db;
  }
  
  .presentation-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0 0.5rem 0;
    background: transparent;
    border-bottom: none;
    box-shadow: none;
  }
  
  .controls-left,
  .controls-right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .controls-right {
    justify-content: flex-end;
  }
  
  .btn-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .export-controls {
    position: relative;
  }
  
  .export-dropdown {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    min-width: 200px;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 12px;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
    z-index: 20;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  
  .dark .export-dropdown {
    background: oklch(var(--popover));
    border: 1px solid oklch(var(--border));
    box-shadow: var(--shadow-lg);
  }
  
  .dropdown-item {
    width: 100%;
    padding: 0.5rem 0.75rem;
    text-align: left;
    border: none;
    background: transparent;
    border-radius: 9999px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #92400e;
    font-weight: 600;
  }
  
  .dark .dropdown-item {
    color: #111827;
  }

  .dropdown-item:hover:not(:disabled) {
    background: #fff7ed;
  }
  
  .dark .dropdown-item:hover:not(:disabled) {
    background: #fef3c7;
    color: #111827;
  }
  
  .btn {
    padding: 0.55rem 1.25rem;
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: 9999px;
    background: #fff7ed;
    color: #92400e;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  
  .dark .btn {
    border: 1px solid rgba(249, 115, 22, 0.8); /* orange border */
    background: #6b7280; /* grey background */
    color: white; /* white text */
  }
  
  .dark .btn svg {
    color: white;
  }
  
  .dark .btn svg path,
  .dark .btn svg circle,
  .dark .btn svg rect {
    fill: white;
    stroke: white;
  }

  .btn:hover:not(:disabled) {
    background: #fde68a;
    border-color: rgba(217, 119, 6, 0.9);
  }
  
  .dark .btn:hover:not(:disabled) {
    background: #4b5563; /* darker grey on hover */
    border-color: rgba(249, 115, 22, 1); /* brighter orange border on hover */
    color: white;
  }

  .btn.active {
    background: #f59e0b;
    color: #111827;
    border-color: #d97706;
  }
  
  .dark .btn.active {
    background: #4b5563; /* grey background */
    color: white;
    border-color: rgba(249, 115, 22, 1); /* orange border */
  }
  
  .btn.secondary {
    background: #f59e0b;
    color: #111827;
    border-color: #d97706;
  }

  /* Mock webpage buttons */
  .btn-build {
    background: #f97316; /* orange */
    color: #111827;
    border-color: #ea580c;
  }

  .btn-build.loading {
    background: #ea580c; /* darker orange while building */
    border-color: #c2410c;
    color: #111827;
  }

  .btn-build:hover:not(:disabled):not(.loading) {
    background: #ea580c;
    border-color: #c2410c;
  }

  .btn-visit {
    background: #16a34a; /* green */
    color: #ffffff;
    border-color: #16a34a;
  }

  .btn-visit:hover:not(:disabled) {
    background: #15803d;
    border-color: #15803d;
  }

  .btn-delete {
    background: #ef4444; /* red */
    color: #ffffff;
    border-color: #dc2626;
  }

  .btn-delete:hover:not(:disabled) {
    background: #dc2626;
    border-color: #b91c1c;
  }
  
  .dark .btn.secondary {
    background: #6b7280; /* grey background */
    color: white;
    border-color: rgba(249, 115, 22, 0.8); /* orange border */
  }
  
  .btn.large {
    min-width: 170px;
    justify-content: center;
    font-size: 0.95rem;
  }
  
  .btn.navigation {
    background: #fff7ed;
  }
  
  .dark .btn.navigation {
    background: #6b7280; /* grey background */
    color: white;
    border-color: rgba(249, 115, 22, 0.8); /* orange border */
  }
  
  .theme-toggle-chip {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    border: 1px solid rgba(245, 158, 11, 0.35);
    background: #fff7ed;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.06);
  }
  
  .dark .theme-toggle-chip {
    border: 1px solid rgba(245, 158, 11, 0.35);
    background: #fef3c7; /* yellow background */
    box-shadow: var(--shadow-xs);
  }
  
  .btn-primary {
    background: #28a745;
    color: white;
    border-color: #28a745;
  }
  
  .dark .btn-primary {
    background: #6b7280; /* grey background */
    color: white;
    border-color: rgba(249, 115, 22, 0.8); /* orange border */
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #218838;
  }
  
  .dark .btn-primary:hover:not(:disabled) {
    background: #4b5563; /* darker grey on hover */
    border-color: rgba(249, 115, 22, 1); /* brighter orange border on hover */
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
  
  .dark .slide-counter {
    color: #d1d5db;
  }
  
  .slide-workspace {
    position: relative;
    min-height: 720px;
    width: 100%;
  }

  .slide-stage {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.5rem;
    transition: margin 0.3s ease, transform 0.3s ease;
  }
  
  .slide-stage.panel-open {
    margin-right: 380px;
    transform: translateX(-12px);
  }

  .slide-navigation {
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .nav-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(251, 191, 36, 0.35);
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  
  .dark .nav-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #1f2937;
  }

  .nav-card:hover {
    border-color: #f59e0b;
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
  }
  
  .dark .nav-card:hover {
    border-color: oklch(var(--ring));
    box-shadow: var(--shadow-md);
  }

  .nav-card.active {
    border-color: #f59e0b;
    box-shadow: 0 12px 24px rgba(245, 158, 11, 0.3);
  }
  
  .dark .nav-card.active {
    border-color: #ca8a04;
    box-shadow: 0 12px 24px rgba(202, 138, 4, 0.3);
    background: #374151;
  }

  .slide-index {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: #fef3c7;
    color: #b45309;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.95rem;
  }
  
  .dark .slide-index {
    background: #4b5563;
    color: #d1d5db;
  }

  .nav-card.active .slide-index {
    background: #f59e0b;
    color: #111827;
  }
  
  .dark .nav-card.active .slide-index {
    background: #ca8a04;
    color: #fef3c7;
  }

  .slide-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .slide-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 0.2rem;
  }
  
  .dark .slide-name {
    color: #ffffff;
  }

  .slide-hint {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .dark .slide-hint {
    color: #d1d5db;
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
  
  .dark .nav-item {
    border: 1px solid oklch(var(--border));
    background: oklch(var(--card));
    color: oklch(var(--foreground));
  }
  
  .nav-item:hover {
    background: #f5f5f5;
    border-color: #007bff;
  }
  
  .dark .nav-item:hover {
    background: oklch(var(--accent));
    color: oklch(var(--accent-foreground));
    border-color: oklch(var(--ring));
  }
  
  .nav-item.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .dark .nav-item.active {
    background: oklch(var(--primary));
    color: oklch(var(--primary-foreground));
    border-color: oklch(var(--primary));
  }
  
  .slide-viewer {
    position: relative;
    flex: 1;
    overflow: visible;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: transparent;
    padding: 2.5rem 0 0;
  }
  
  .slide-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0;
    background: transparent;
    position: relative;
  }
  
  .slide-nav-overlay {
    position: absolute;
    top: -2rem;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 5;
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

