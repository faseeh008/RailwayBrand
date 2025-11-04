// @ts-nocheck

/**
 * Specific Issue Generator - Creates detailed, user-friendly issues
 * Provides exact values for detected vs expected colors, fonts, etc.
 */

export class SpecificIssueGenerator {
  
  generateColorIssues(scrapedColors, brandColors) {
    const issues = [];
    
    if (!scrapedColors || !Array.isArray(scrapedColors) || scrapedColors.length === 0) {
      return issues;
    }
    
    // DEBUG: Log the data types we're receiving
    console.log('🎨 DEBUG: scrapedColors type:', typeof scrapedColors, 'isArray:', Array.isArray(scrapedColors));
    console.log('🎨 DEBUG: scrapedColors sample:', scrapedColors.slice(0, 3));
    console.log('🎨 DEBUG: brandColors type:', typeof brandColors);
    
    // Convert scraped colors to normalized format
    const normalizedScraped = this.normalizeColorArray(scrapedColors);
    const normalizedBrand = this.getBrandColorValues(brandColors);
    
    // Check for unauthorized colors
    const unauthorizedColors = this.findUnauthorizedColors(normalizedScraped, normalizedBrand.allBrandHexes);
    
    if (unauthorizedColors.length > 0) {
      const detectedColorDetails = unauthorizedColors.map(c => ({
        hex: c,
        name: this.getColorName(c),
        rgb: this.hexToRgb(c)
      }));
      
      const brandColorDetails = normalizedBrand.palette;
      
      issues.push({
        category: 'colors',
        type: 'non_brand_color_detected',
        severity: 'high',
        title: 'Non-Brand Colors Detected',
        message: `Found ${unauthorizedColors.length} unauthorized color${unauthorizedColors.length > 1 ? 's' : ''} not in brand palette`,
        details: {
          detectedColors: detectedColorDetails,
          brandPalette: brandColorDetails,
          detectedCount: normalizedScraped.length,
          brandCount: normalizedBrand.allBrandHexes.length,
          summary: `Design uses ${unauthorizedColors.length} non-brand colors instead of the required ${normalizedBrand.allBrandHexes.length} brand colors`
        },
        expected: brandColorDetails.map(c => c.hex).join(', '),
        found: detectedColorDetails.slice(0, 5).map(c => c.hex).join(', ') + (detectedColorDetails.length > 5 ? ` and ${detectedColorDetails.length - 5} more` : ''),
        recommendation: `Replace unauthorized colors with brand colors: ${brandColorDetails.map(c => c.hex).join(', ')}`
      });
    }
    
    // Check if primary brand color is being used
    if (brandColors.primary?.hex && !this.isColorInList(brandColors.primary.hex, normalizedScraped)) {
      issues.push({
        category: 'colors',
        type: 'primary_color_missing',
        severity: 'high',
        title: 'Primary Brand Color Not Used',
        message: `Your website is not using the primary brand color`,
        details: {
          expectedPrimary: {
            name: brandColors.primary.name || 'Primary',
            hex: brandColors.primary.hex,
            rgb: this.hexToRgb(brandColors.primary.hex),
            usage: brandColors.primary.usage || 'Primary elements'
          },
          detectedColors: normalizedScraped.slice(0, 5).map(hex => ({
            hex: hex,
            name: this.getColorName(hex)
          }))
        },
        expected: `${brandColors.primary.name} (${brandColors.primary.hex})`,
        found: `${normalizedScraped.length} different colors`,
        recommendation: `Add ${brandColors.primary.hex} to your design for headers, buttons, or key elements`
      });
    }
    
    // Check if secondary brand color is being used (only if defined and different from primary)
    if (brandColors.secondary?.hex && brandColors.primary?.hex !== brandColors.secondary.hex) {
      // Normalize the secondary color hex for comparison
      const normalizedSecondaryHex = this.normalizeColor(brandColors.secondary.hex);
      
      // Check if secondary color exists in scraped colors (handle RGB/rgba formats too)
      const hasSecondaryColor = normalizedScraped.some(scrapedColor => {
        const normalizedScrapedColor = this.normalizeColor(scrapedColor);
        // Direct match (both are normalized to hex format)
        return normalizedScrapedColor === normalizedSecondaryHex;
      });
      
      // Only generate issue if secondary color is NOT found
      if (!hasSecondaryColor) {
        issues.push({
          category: 'colors',
          type: 'secondary_color_missing',
          severity: 'low',
          title: 'Secondary Color Could Add Variety',
          message: `Consider adding the secondary brand color for visual interest`,
          details: {
            expectedSecondary: {
              name: brandColors.secondary.name || 'Secondary',
              hex: brandColors.secondary.hex,
              rgb: this.hexToRgb(brandColors.secondary.hex),
              usage: brandColors.secondary.usage || 'Secondary elements'
            },
            detectedColors: normalizedScraped.slice(0, 3).map(hex => ({
              hex: hex,
              name: this.getColorName(hex)
            }))
          },
          // Format expected to include just the hex code for easy parsing
          expected: brandColors.secondary.hex,
          found: 'Not detected',
          recommendation: `Use ${brandColors.secondary.hex} for secondary buttons, borders, or background accents`
        });
      }
    }
    
    return issues;
  }

  generateTypographyIssues(scrapedTypography, brandTypography) {
    const issues = [];
    
    if (!scrapedTypography || !scrapedTypography.fonts || scrapedTypography.fonts.length === 0) {
      issues.push({
        category: 'typography',
        type: 'no_fonts_detected',
        severity: 'high',
        title: 'No Custom Fonts Detected',
        message: 'Website uses only generic system fonts instead of brand typography',
        details: {
          detectedFonts: 'System defaults only (ui-sans-serif, system-ui)',
          expectedFonts: brandTypography ? this.getBrandFontSummary(brandTypography) : 'Brand fonts',
          summary: 'No custom fonts detected - using browser/system defaults'
        },
        expected: brandTypography?.primary?.font || 'Brand fonts',
        found: 'System defaults only',
        recommendation: `Implement ${brandTypography?.primary?.font || 'brand fonts'} using @font-face or web font services`
      });
      return issues;
    }
    
    const detectedFonts = scrapedTypography.fonts || [];
    const primaryDetected = detectedFonts[0] || 'system-ui';
    
    // Primary font mismatch - BUT check if brand font (primary OR secondary) exists ANYWHERE in the font stack first
    if (brandTypography?.primary?.font) {
      const brandPrimaryLower = brandTypography.primary.font.toLowerCase();
      const brandPrimaryVariations = this.getFontVariations(brandTypography.primary.font);
      
      // Also check secondary font if available
      const brandSecondaryLower = brandTypography?.secondary?.font?.toLowerCase();
      const brandSecondaryVariations = brandTypography?.secondary?.font ? 
        this.getFontVariations(brandTypography.secondary.font) : [];
      
      // Check if ANY brand font (primary OR secondary) exists in the detected font stack
      const hasBrandPrimaryFont = detectedFonts.some(detectedFont => {
        const detectedFontLower = detectedFont.toLowerCase();
        
        // Direct match with primary
        if (detectedFontLower === brandPrimaryLower || 
            detectedFontLower.includes(brandPrimaryLower) || 
            brandPrimaryLower.includes(detectedFontLower)) {
          return true;
        }
        
        // Check font family variations for primary
        return brandPrimaryVariations.some(variation => 
          detectedFontLower.includes(variation) || variation.includes(detectedFontLower)
        );
      });
      
      const hasBrandSecondaryFont = brandSecondaryLower ? detectedFonts.some(detectedFont => {
        const detectedFontLower = detectedFont.toLowerCase();
        
        // Direct match with secondary
        if (detectedFontLower === brandSecondaryLower || 
            detectedFontLower.includes(brandSecondaryLower) || 
            brandSecondaryLower.includes(detectedFontLower)) {
          return true;
        }
        
        // Check font family variations for secondary
        return brandSecondaryVariations.some(variation => 
          detectedFontLower.includes(variation) || variation.includes(detectedFontLower)
        );
      }) : false;
      
      // Check if the detected font matches either primary or secondary
      const hasAnyBrandFont = hasBrandPrimaryFont || hasBrandSecondaryFont;
      
      // Only generate issue if NEITHER brand font is found anywhere in the stack
      if (!hasAnyBrandFont) {
        const similarity = this.calculateFontSimilarity(primaryDetected, brandTypography.primary.font);
        
        if (similarity < 0.7) {
          // Determine if secondary font exists to provide better messaging
          const brandFontList = brandTypography.secondary?.font ? 
            `${brandTypography.primary.font} or ${brandTypography.secondary.font}` : 
            brandTypography.primary.font;
          
          // Determine usage context for better messaging
          const primaryUsage = brandTypography.primary.usage || 'Primary text and headings';
          const secondaryUsage = brandTypography.secondary?.usage || 'Secondary text and body';
          const usageContext = brandTypography.secondary?.font ? 
            `${brandTypography.primary.font} (${primaryUsage}) or ${brandTypography.secondary.font} (${secondaryUsage})` :
            `${brandTypography.primary.font} (${primaryUsage})`;
          
          issues.push({
            category: 'typography',
            type: 'primary_font_mismatch',
            severity: 'high',
            title: 'Font Does Not Match Brand Guidelines',
            message: `Website uses "${this.cleanFontName(primaryDetected)}" instead of required brand fonts. Expected: ${usageContext}`,
            details: {
              detectedFont: {
                name: this.cleanFontName(primaryDetected),
                fullFamily: detectedFonts.slice(0, 5).join(', '),
                similarity: Math.round(similarity * 100) + '% match',
                usedIn: 'Various elements (check individual elements for specific usage)'
              },
              expectedFont: {
                name: brandTypography.primary.font,
                weights: brandTypography.primary.weights || ['Regular', 'Bold'],
                usage: brandTypography.primary.usage || 'Primary text and headings'
              },
              secondaryFont: brandTypography.secondary?.font ? {
                name: brandTypography.secondary.font,
                weights: brandTypography.secondary.weights || ['Regular', 'Bold'],
                usage: brandTypography.secondary.usage || 'Secondary text and body'
              } : null,
              summary: `Brand fonts "${brandFontList}" not found in font stack. Found: ${detectedFonts.slice(0, 5).join(', ')}. Use ${usageContext} instead.`
            },
            expected: usageContext,
            found: this.cleanFontName(primaryDetected),
            recommendation: `Replace "${this.cleanFontName(primaryDetected)}" with brand fonts: ${brandFontList}. Ensure at least one brand font is present in your font-family stack. ${brandTypography.secondary?.font ? `You may use ${brandTypography.secondary.font} for ${secondaryUsage} or ${brandTypography.primary.font} for ${primaryUsage}.` : ''}`
          });
        }
      } else if (hasBrandSecondaryFont && !hasBrandPrimaryFont) {
        // Secondary font found but primary not found - this is acceptable but provide a note
        console.log(`ℹ️ Brand secondary font "${brandTypography.secondary.font}" found but primary "${brandTypography.primary.font}" not detected. This is acceptable.`);
        // No issue generated - secondary font is valid
      } else {
        // Brand font (primary or secondary) is found in the stack - no issue needed
        console.log(`✅ Brand font found in font stack (primary: ${hasBrandPrimaryFont}, secondary: ${hasBrandSecondaryFont}) - no typography issue generated`);
      }
    }
    
    // Font weights check
    if (brandTypography?.primary?.weights && scrapedTypography.weights) {
      const missingWeights = this.findMissingWeights(scrapedTypography.weights, brandTypography.primary.weights);
      
      if (missingWeights.length > 0 && !scrapedTypography.weights.includes('700') && !scrapedTypography.weights.includes('bold')) {
        issues.push({
          category: 'typography',
          type: 'font_weights_missing',
          severity: 'medium',
          title: 'Bold Font Weight Not Used',
          message: `Brand guidelines recommend using bold weights for emphasis`,
          details: {
            detectedWeights: scrapedTypography.weights,
            recommendedWeights: brandTypography.primary.weights,
            missingWeights: ['Bold', '700']
          },
          expected: 'Bold (700)',
          found: `Only ${scrapedTypography.weights.join(', ')}`,
          recommendation: `Add font-weight: bold to your headings for proper hierarchy`
        });
      }
    }
    
    return issues;
  }

  generateLogoIssues(scrapedLogo, brandLogo) {
    const issues = [];
    
    // Logo not detected
    if (!scrapedLogo || !scrapedLogo.detected) {
      issues.push({
        category: 'logo',
        type: 'logo_missing',
        severity: 'high',
        title: 'Brand Logo Not Found',
        message: 'Official brand logo is completely absent from required prominent areas',
        details: {
          expectedPlacement: 'Header, navigation, or prominent area',
          logoRules: brandLogo?.rules?.slice(0, 3) || ['Should be clearly visible'],
          colorConstraints: brandLogo?.constraints?.filter(rule => 
            rule.toLowerCase().includes('color') || 
            rule.toLowerCase().includes('black') || 
            rule.toLowerCase().includes('white')
          ) || [],
          summary: 'No brand logo detected in header, navigation, or other prominent areas'
        },
        expected: 'Official brand logo image',
        found: 'No logo detected',
        recommendation: 'Add the official logo to your website header with appropriate sizing'
      });
    }
    
    return issues;
  }

  // Helper methods
  normalizeColorArray(colors) {
    return colors.map(color => this.normalizeColor(color)).filter(Boolean);
  }

  normalizeColor(color) {
    // Handle non-string values
    if (!color || typeof color !== 'string') {
      return null;
    }
    
    // If already hex, return uppercase
    if (color.startsWith('#')) {
      return color.toUpperCase();
    }
    
    // Convert RGB to HEX
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length === 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      }
    }
    
    return color.toUpperCase();
  }

  getBrandColorValues(brandColors) {
    const allBrandHexes = [];
    const palette = [];
    
    if (brandColors?.primary?.hex) {
      allBrandHexes.push(this.normalizeColor(brandColors.primary.hex));
      palette.push({
        name: brandColors.primary.name || 'Primary',
        hex: this.normalizeColor(brandColors.primary.hex),
        usage: brandColors.primary.usage
      });
    }
    
    if (brandColors?.secondary?.hex) {
      allBrandHexes.push(this.normalizeColor(brandColors.secondary.hex));
      palette.push({
        name: brandColors.secondary.name || 'Secondary',
        hex: this.normalizeColor(brandColors.secondary.hex),
        usage: brandColors.secondary.usage
      });
    }
    
    if (brandColors?.palette && Array.isArray(brandColors.palette)) {
      brandColors.palette.forEach(hex => {
        const normalized = this.normalizeColor(hex);
        if (normalized && !allBrandHexes.includes(normalized)) {
          allBrandHexes.push(normalized);
          palette.push({ 
            hex: normalized,
            name: this.getColorName(normalized)
          });
        }
      });
    }
    
    if (brandColors?.neutral && Array.isArray(brandColors.neutral)) {
      brandColors.neutral.forEach(neutral => {
        if (neutral.hex) {
          const normalized = this.normalizeColor(neutral.hex);
          if (normalized && !allBrandHexes.includes(normalized)) {
            allBrandHexes.push(normalized);
            palette.push({ 
              hex: normalized,
              name: neutral.name || this.getColorName(normalized)
            });
          }
        }
      });
    }
    
    return { allBrandHexes, palette };
  }

  findUnauthorizedColors(scrapedColors, brandHexes) {
    return scrapedColors.filter(color => !brandHexes.includes(color));
  }

  isColorInList(colorHex, colorList) {
    const normalized = this.normalizeColor(colorHex);
    return colorList.some(listColor => this.normalizeColor(listColor) === normalized);
  }

  getColorName(hex) {
    // Handle non-string values
    if (!hex || typeof hex !== 'string') {
      return 'Unknown Color';
    }
    
    const commonColors = {
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#FF0000': 'Red',
      '#00FF00': 'Green',
      '#0000FF': 'Blue',
      '#FFFF00': 'Yellow',
      '#FF00FF': 'Magenta',
      '#00FFFF': 'Cyan',
      '#808080': 'Gray',
      '#0A84FF': 'Blue',
      '#E6EDF3': 'Light Blue Gray',
      '#0E141B': 'Dark Blue',
      '#0A0F16': 'Very Dark Blue',
      '#1C2530': 'Dark Gray Blue',
      '#2C3E50': 'Slate Blue',
      '#9BA3AF': 'Medium Gray'
    };
    
    return commonColors[hex.toUpperCase()] || this.estimateColorName(hex);
  }

  estimateColorName(hex) {
    // Handle non-string values
    if (!hex || typeof hex !== 'string') {
      return 'Custom Color';
    }
    
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 'Custom Color';
    
    const { r, g, b } = rgb;
    
    // Black/Gray
    if (r < 50 && g < 50 && b < 50) return 'Very Dark';
    if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r < 100) return 'Dark Gray';
    if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 200) return 'Light Gray';
    
    // Red
    if (r > g * 1.5 && r > b * 1.5) return 'Reddish';
    
    // Green
    if (g > r * 1.5 && g > b * 1.5) return 'Greenish';
    
    // Blue
    if (b > r * 1.5 && b > g * 1.5) return 'Blue';
    
    // Yellow
    if (r > 200 && g > 200 && b < 100) return 'Yellowish';
    
    return 'Custom Color';
  }

  hexToRgb(hex) {
    // Handle non-string values
    if (!hex || typeof hex !== 'string') {
      return null;
    }
    
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return null;
    
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  getBrandFontSummary(brandTypography) {
    const summary = [];
    if (brandTypography?.primary?.font) summary.push(`Primary: ${brandTypography.primary.font}`);
    if (brandTypography?.secondary?.font) summary.push(`Secondary: ${brandTypography.secondary.font}`);
    return summary;
  }

  calculateFontSimilarity(font1, font2) {
    if (!font1 || !font2) return 0;
    
    const clean1 = this.cleanFontName(font1).toLowerCase();
    const clean2 = this.cleanFontName(font2).toLowerCase();
    
    if (clean1 === clean2) return 1.0;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.8;
    
    // Check for similar font names (e.g., "Helvetica Neue" vs "Helvetica")
    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    
    if (commonWords.length > 0) return 0.6;
    
    return 0.3;
  }

  cleanFontName(font) {
    return font.replace(/["']/g, '').replace(/\s*,\s*.*$/, '').trim();
  }

  /**
   * Get font family variations for matching (e.g., "Helvetica Neue BOLD" -> ["helvetica neue bold", "helvetica neue", "helvetica"])
   */
  getFontVariations(fontName) {
    if (!fontName) return [];
    const lower = fontName.toLowerCase();
    const variations = [lower];
    const words = lower.split(/\s+/);
    
    // Add first word if multi-word (e.g., "helvetica neue bold" -> "helvetica neue")
    if (words.length > 1) {
      // Add full name without last word (e.g., "helvetica neue bold" -> "helvetica neue")
      variations.push(words.slice(0, -1).join(' '));
      // Add first word (e.g., "helvetica")
      variations.push(words[0]);
    }
    
    // Add common font family matches
    if (lower.includes('helvetica neue')) {
      variations.push('helvetica neue', 'helvetica');
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  findMissingWeights(detectedWeights, brandWeights) {
    const detected = new Set((detectedWeights || []).map(w => w.toString().toLowerCase()));
    const brand = new Set((brandWeights || []).map(w => w.toString().toLowerCase()));
    
    return Array.from(brand).filter(weight => !detected.has(weight));
  }
}

export default SpecificIssueGenerator;
