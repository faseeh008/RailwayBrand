<script lang="ts">
  import { onMount } from 'svelte';
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
  import { convertSvelteSlidesToPptx } from '$lib/services/svelte-slide-to-pptx';
  import type { SlideData } from '$lib/types/slide-data';
  
  export let brandData: any = null;
  
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
  let isDownloading = false;
  let downloadProgress = { current: 0, total: 0 };
  
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
  let website = 'your-website.com';
  let email = 'contact@example.com';
  let phone = '';
  
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
    // Colors will be set by reactive statement below
    primaryFont = extractFont(brandData, 'primary') || 'Arial';
    secondaryFont = extractFont(brandData, 'secondary') || 'Arial';
    primaryWeights = extractFontWeights(brandData, 'primary') || 'Regular, Bold';
    secondaryWeights = extractFontWeights(brandData, 'secondary') || 'Regular, Medium';
    icons = extractIcons(brandData);
    applications = extractApplications(brandData);
    website = brandData?.contact?.website || brandData?.legal_contact?.website || 'your-website.com';
    email = brandData?.contact?.email || brandData?.legal_contact?.email || 'contact@example.com';
    phone = brandData?.contact?.phone || brandData?.legal_contact?.phone || '';
  }
  
  // Reactive statement to ensure colors are updated when color values change
  $: if (brandData && primaryColor && secondaryColor) {
    colors = extractColorsArray(brandData, primaryColor, secondaryColor, color2, color3);
  }
  
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
        return data.colors.allColors.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || c,
          usage: c.usage || 'Brand color'
        }));
      }
      
      // Try core_palette
      if (Array.isArray(data.colors.core_palette) && data.colors.core_palette.length > 0) {
        return data.colors.core_palette.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || c,
          usage: c.usage || 'Brand color'
        }));
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
    
    return fallbackColors;
  }
  
  function extractPositioningStatement(data: any): string {
    // Try direct property first
    if (data?.positioningStatement || data?.positioning_statement) {
      return data.positioningStatement || data.positioning_statement;
    }
    
    // Try to parse from stepHistory
    const positioningStep = data?.stepHistory?.find((s: any) => s.step === 'brand-positioning');
    if (positioningStep?.content) {
      const content = positioningStep.content;
      
      // If it's an object, extract directly
      if (typeof content === 'object' && content.positioning_statement) {
        return content.positioning_statement;
      }
      
      // If it's a string, parse it
      if (typeof content === 'string') {
        // Try to find positioning statement in markdown format
        const match = content.match(/\*\*Positioning Statement\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is) ||
                     content.match(/Positioning Statement[:\s]+(.+?)(?=\n\n|\n(?:Mission|Vision)|$)/is) ||
                     content.match(/Positioning[:\s]+(.+?)(?=\n\n|\n(?:Mission|Vision)|$)/is);
        if (match && match[1]) {
          return match[1].trim();
        }
        
        // Fallback: use first paragraph
        const firstPara = content.split('\n\n').find(p => p.trim().length > 20);
        if (firstPara) return firstPara.trim();
      }
    }
    
    return 'Our brand positioning statement';
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
  
  // Color variants for gradients
  $: color1Lighter = lightenColor(primaryColor, 0.9);
  $: color2Lighter = lightenColor(color2, 0.9);
  $: color3Lighter = lightenColor(color3, 0.9);
  $: color4Lighter = lightenColor(secondaryColor, 0.9);
  $: color5Lighter = lightenColor('#60A5FA', 0.9);
  $: color6Lighter = lightenColor('#3B82F6', 0.9);
  $: color7Lighter = lightenColor('#1E40AF', 0.9);
  $: color8Lighter = lightenColor('#2563EB', 0.9);
  $: color1Hex = primaryColor;
  $: color2Hex = color2;
  $: color3Hex = color3;
  $: color4Hex = secondaryColor;
  $: color1Rgba10 = hexToRgba(primaryColor, 0.1);
  $: color2Rgba10 = hexToRgba(color2, 0.1);
  $: color3Rgba10 = hexToRgba(color3, 0.1);
  $: color1Rgba15 = hexToRgba(primaryColor, 0.15);
  $: color2Rgba15 = hexToRgba(color2, 0.15);
  $: color3Rgba15 = hexToRgba(color3, 0.15);
  $: color1Rgba12 = hexToRgba(primaryColor, 0.12);
  $: color2Rgba12 = hexToRgba(color2, 0.12);
  $: color3Rgba12 = hexToRgba(color3, 0.12);
  $: color4Rgba12 = hexToRgba(secondaryColor, 0.12);
  $: color5Rgba12 = hexToRgba('#60A5FA', 0.12);
  $: color6Rgba12 = hexToRgba('#3B82F6', 0.12);
  $: color7Rgba12 = hexToRgba('#1E40AF', 0.12);
  $: color4Rgba8 = hexToRgba(secondaryColor, 0.08);
  $: color5Rgba8 = hexToRgba('#60A5FA', 0.08);
  $: color6Rgba8 = hexToRgba('#3B82F6', 0.08);
  $: color5Rgba10 = hexToRgba('#60A5FA', 0.1);
  $: color6Rgba10 = hexToRgba('#3B82F6', 0.1);
  $: color7Rgba10 = hexToRgba('#1E40AF', 0.1);
  $: color1Rgba5 = hexToRgba(primaryColor, 0.05);
  $: color8Rgba12 = hexToRgba('#2563EB', 0.12);
  
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
        symbol: typeof icon === 'string' ? icon : (icon.symbol || icon.icon || icon.emoji || '◐'),
        name: typeof icon === 'string' ? 'Icon' : (icon.name || icon.label || 'Icon')
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
            symbol: typeof icon === 'string' ? icon : (icon.symbol || icon.icon || icon.emoji || '◐'),
            name: typeof icon === 'string' ? 'Icon' : (icon.name || icon.label || 'Icon')
          }));
        }
        
        if (Array.isArray(content)) {
          return content.map((icon: any) => ({
            symbol: typeof icon === 'string' ? icon : (icon.symbol || icon.icon || icon.emoji || '◐'),
            name: typeof icon === 'string' ? 'Icon' : (icon.name || icon.label || 'Icon')
          }));
        }
        
        // Try to find icon arrays in object
        for (const key in content) {
          if (Array.isArray(content[key])) {
            const potentialIcons = content[key];
            if (potentialIcons.length > 0 && (potentialIcons[0].symbol || potentialIcons[0].icon || typeof potentialIcons[0] === 'string')) {
              return potentialIcons.map((icon: any) => ({
                symbol: typeof icon === 'string' ? icon : (icon.symbol || icon.icon || icon.emoji || '◐'),
                name: typeof icon === 'string' ? 'Icon' : (icon.name || icon.label || 'Icon')
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
          // Pattern 1: • Symbol Name or - Symbol Name or * Symbol Name
          let match = line.match(/^[\s]*[•\-\*]\s*([^\s]+)\s+(.+)/);
          if (match) {
            icons.push({
              symbol: match[1].trim(),
              name: match[2].trim()
            });
            continue;
          }
          
          // Pattern 2: **Symbol**: Name or Symbol: Name
          match = line.match(/\*\*([^\*]+)\*\*[:\s]+(.+)/i) || line.match(/([^\s:]+)[:\s]+(.+)/);
          if (match && match[1].length <= 3) { // Symbols are usually 1-3 characters
            icons.push({
              symbol: match[1].trim(),
              name: match[2].trim()
            });
            continue;
          }
          
          // Pattern 3: Symbol - Name or Symbol – Name
          match = line.match(/([^\s\-–]+)\s*[–\-]\s*(.+)/);
          if (match && match[1].length <= 3) {
            icons.push({
              symbol: match[1].trim(),
              name: match[2].trim()
            });
            continue;
          }
          
          // Pattern 4: Just a symbol and name separated by space (if line is short)
          if (line.trim().length < 50 && line.trim().split(/\s+/).length === 2) {
            const parts = line.trim().split(/\s+/);
            if (parts[0].length <= 3) {
              icons.push({
                symbol: parts[0],
                name: parts[1]
              });
            }
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
                  symbol: typeof icon === 'string' ? icon : (icon.symbol || icon.icon || icon.emoji || '◐'),
                  name: typeof icon === 'string' ? 'Icon' : (icon.name || icon.label || 'Icon')
                });
              });
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }
    
    // Remove duplicates based on symbol
    const uniqueIcons = icons.filter((icon, index, self) => 
      index === self.findIndex(i => i.symbol === icon.symbol)
    );
    
    if (uniqueIcons.length > 0) {
      return uniqueIcons.slice(0, 12); // Return up to 12 icons
    }
    
    // Default icons if none found
    return [
      { symbol: '◐', name: 'Brand' },
      { symbol: '★', name: 'Featured' },
      { symbol: '♥', name: 'Favorites' },
      { symbol: '◆', name: 'Premium' },
      { symbol: '✓', name: 'Success' },
      { symbol: '→', name: 'Navigation' },
      { symbol: '⊕', name: 'Add' },
      { symbol: '⚙', name: 'Settings' }
    ];
  }
  
  function lightenColor(hex: string, amount: number): string {
    if (!hex || !hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
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
  
  async function downloadAllSlidesPPTX() {
    if (isDownloading) return;
    
    isDownloading = true;
    try {
      console.log('🔄 Collecting slide data from all components...');
      
      const allSlideData: SlideData[] = [];
      
      // Collect data from all slide components in correct order
      // All slides are rendered (but hidden), so refs should be available
      const slideRefs = [
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
            const slideData = ref.getSlideData();
            if (slideData && slideData.elements && slideData.elements.length > 0) {
              allSlideData.push(slideData);
              console.log(`✅ Collected slide: ${slideData.id} with ${slideData.elements.length} elements`);
            } else {
              console.warn('⚠️ Slide data is empty or invalid:', slideData);
            }
          } catch (error) {
            console.error('❌ Error getting slide data:', error);
          }
        } else {
          console.warn('⚠️ Slide ref not available or missing getSlideData function');
        }
      }
      
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
</script>

<div class="slide-manager">
  <!-- Controls -->
  <div class="controls-bar">
    <div class="controls-left">
      <button
        onclick={() => isEditable = !isEditable}
        class="btn"
        class:active={isEditable}
      >
        {isEditable ? '🔒 Lock Editing' : '✏️ Edit Slides'}
      </button>
      
      <button
        onclick={downloadAllSlidesPPTX}
        disabled={isDownloading}
        class="btn btn-primary"
      >
        {#if isDownloading}
          ⏳ Generating PPTX... ({downloadProgress.current}/{downloadProgress.total})
        {:else}
          📥 Download All Slides as PPTX
        {/if}
      </button>
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
          bind:primaryColor
          bind:color2
          bind:color3
          bind:secondaryColor
          {logoData}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 1}>
        <BrandIntroductionSlide
          bind:this={brandIntroRef}
          bind:positioningStatement
          bind:primaryColor
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color1Rgba10={color1Rgba10}
          color2Rgba10={color2Rgba10}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 2}>
        <BrandPositioningSlide
          bind:this={brandPositioningRef}
          bind:mission
          bind:vision
          bind:values
          bind:personality
          bind:primaryColor
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
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 3}>
        <LogoGuidelinesSlide
          bind:this={logoGuidelinesRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          bind:primaryColor
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color3Rgba12={color3Rgba12}
          color4Rgba12={color4Rgba12}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 4}>
        <LogoDosSlide
          bind:this={logoDosRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          bind:primaryColor
          bind:secondaryColor
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color1Rgba10={color1Rgba10}
          color2Rgba10={color2Rgba10}
          color3Rgba10={color3Rgba10}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 5}>
        <LogoDontsSlide
          bind:this={logoDontsRef}
          bind:brandName
          bind:logoUrl
          bind:logoData
          bind:primaryColor
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color5Lighter={color5Lighter}
          color1Rgba10={color1Rgba10}
          color2Rgba10={color2Rgba10}
          color3Rgba10={color3Rgba10}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 6}>
        <ColorPaletteSlide
          bind:this={colorPaletteRef}
          bind:colors
          bind:primaryColor
          color1Hex={color1Hex}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color4Lighter={color4Lighter}
          color1Rgba15={color1Rgba15}
          color2Rgba15={color2Rgba15}
          color3Rgba10={color3Rgba10}
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
          bind:primaryColor
          color4Lighter={color4Lighter}
          color5Lighter={color5Lighter}
          color6Lighter={color6Lighter}
          color4Rgba8={color4Rgba8}
          color5Rgba8={color5Rgba8}
          color6Rgba8={color6Rgba8}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 8}>
        <IconographySlide
          bind:this={iconographyRef}
          bind:icons
          bind:primaryColor
          bind:secondaryColor
          color5Lighter={color5Lighter}
          color6Lighter={color6Lighter}
          color7Lighter={color7Lighter}
          color5Rgba12={color5Rgba12}
          color6Rgba12={color6Rgba12}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 9}>
        <PhotographySlide
          bind:this={photographyRef}
          bind:primaryColor
          bind:secondaryColor
          color6Lighter={color6Lighter}
          color7Lighter={color7Lighter}
          color8Lighter={color8Lighter}
          color6Rgba10={color6Rgba10}
          color7Rgba10={color7Rgba10}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 10}>
        <ApplicationsSlide
          bind:this={applicationsRef}
          bind:applications
          bind:primaryColor
          bind:secondaryColor
          color7Lighter={color7Lighter}
          color8Lighter={color8Lighter}
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color7Rgba12={color7Rgba12}
          color8Rgba12={color8Rgba12}
          color1Rgba5={color1Rgba5}
          {isEditable}
        />
      </div>
      <div class="slide-wrapper" class:hidden={currentSlideIndex !== 11}>
        <ThankYouSlide
          bind:this={thankYouRef}
          bind:brandName
          bind:primaryColor
          color1Lighter={color1Lighter}
          color2Lighter={color2Lighter}
          color3Lighter={color3Lighter}
          color1Rgba10={color1Rgba10}
          color2Rgba10={color2Rgba10}
          color3Rgba10={color3Rgba10}
          {isEditable}
        />
      </div>
    </div>
  </div>
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

