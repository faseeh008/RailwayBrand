import type { BrandConfig } from "../shared-brand-config";

/**
 * Get typography styles for a specific label (H1, H2, Body, etc.)
 */
export function getTypographyStyle(
  config: BrandConfig,
  label: string
): {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
} {
  const typography = config.typography;
  
  if (!typography || !typography.fontHierarchy) {
    // Fallback to default styles
    const defaultStyles: Record<string, { fontSize: string; fontWeight: string }> = {
      h1: { fontSize: '48px', fontWeight: '700' },
      h2: { fontSize: '32px', fontWeight: '700' },
      body: { fontSize: '16px', fontWeight: '400' },
    };
    const normalizedLabel = label.toLowerCase();
    const defaultStyle = defaultStyles[normalizedLabel] || defaultStyles.body;
    return {
      fontFamily: typography?.primaryFont || config.fonts?.heading || 'Arial, sans-serif',
      fontSize: defaultStyle.fontSize,
      fontWeight: defaultStyle.fontWeight,
    };
  }
  
  // Find matching hierarchy entry
  const hierarchy = typography.fontHierarchy.find(
    (h) => h.label.toLowerCase() === label.toLowerCase()
  );
  
  if (hierarchy) {
    return {
      fontFamily: hierarchy.font || typography.primaryFont || config.fonts?.heading || 'Arial, sans-serif',
      fontSize: hierarchy.size || '16px',
      fontWeight: hierarchy.weight || '400',
    };
  }
  
  // If label not found, use primary font with defaults
  const normalizedLabel2 = label.toLowerCase();
  const defaultSizes: Record<string, { fontSize: string; fontWeight: string }> = {
    h1: { fontSize: '48px', fontWeight: '700' },
    h2: { fontSize: '32px', fontWeight: '700' },
    h3: { fontSize: '24px', fontWeight: '600' },
    body: { fontSize: '16px', fontWeight: '400' },
  };
  const defaultStyle2 = defaultSizes[normalizedLabel2] || defaultSizes.body;
  
  return {
    fontFamily: typography.primaryFont || config.fonts?.heading || 'Arial, sans-serif',
    fontSize: defaultStyle2.fontSize,
    fontWeight: defaultStyle2.fontWeight,
  };
}

