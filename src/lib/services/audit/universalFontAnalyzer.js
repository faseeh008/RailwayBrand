/**
 * Universal Font Analyzer
 * Handles multiple font formats with fuzzy matching and family recognition
 */

export class UniversalFontAnalyzer {
  constructor() {
    this.fontFamilies = this.buildFontFamilyGroups();
    this.fontWeightMapping = this.buildWeightMapping();
  }

  buildFontFamilyGroups() {
    return {
      'helvetica': ['helvetica neue', 'arial', 'sans-serif'],
      'helvetica neue': ['helvetica', 'arial', 'sans-serif'],
      'inter': ['system-ui', '-apple-system', 'blinkmacsystemfont', 'sans-serif'],
      'roboto': ['roboto flex', 'roboto condensed', 'sans-serif'],
      'georgia': ['times new roman', 'serif'],
      'monospace': ['courier new', 'monaco', 'consolas'],
      'poppins': ['sans-serif'],
      'lato': ['sans-serif'],
      'open sans': ['sans-serif'],
      'montserrat': ['sans-serif']
    };
  }

  buildWeightMapping() {
    // Map semantic names to numeric values
    return {
      // Semantic to numeric
      'light': 300,
      'thin': 100,
      'hairline': 100,
      'extra-light': 200,
      'ultra-light': 200,
      'normal': 400,
      'regular': 400,
      'medium': 500,
      'semi-bold': 600,
      'demi-bold': 600,
      'bold': 700,
      'extra-bold': 800,
      'ultra-bold': 800,
      'black': 900,
      'heavy': 900,
      
      // Also support reverse mapping (numeric to semantic ranges)
      '100': 100,
      '200': 200,
      '300': 300,
      '400': 400,
      '500': 500,
      '600': 600,
      '700': 700,
      '800': 800,
      '900': 900
    };
  }

  analyzeFontsUniversal(scrapedFonts, brandFonts) {
    console.log('🔤 Starting universal font analysis...');
    
    const normalizedScraped = this.normalizeFontStructure(scrapedFonts);
    const normalizedBrand = this.normalizeFontStructure(brandFonts);
    
    console.log('🔤 Normalized scraped fonts:', normalizedScraped.allFonts.size);
    console.log('🔤 Normalized brand fonts:', normalizedBrand.allFonts.size);
    
    const analysis = {
      primary: this.analyzePrimaryFont(normalizedScraped, normalizedBrand),
      secondary: this.analyzeSecondaryFont(normalizedScraped, normalizedBrand),
      weights: this.analyzeFontWeights(normalizedScraped, normalizedBrand),
      hierarchy: this.analyzeFontHierarchy(normalizedScraped, normalizedBrand)
    };
    
    const issues = [
      ...analysis.primary.issues,
      ...analysis.secondary.issues,
      ...analysis.weights.issues,
      ...analysis.hierarchy.issues
    ];
    
    const score = this.calculateFontScore(analysis);
    const confidence = this.calculateFontConfidence(normalizedScraped, normalizedBrand);
    
    console.log('🔤 Universal font analysis complete:', {
      score: score,
      confidence: confidence,
      issues: issues.length
    });
    
    return {
      score,
      details: {
        primary: analysis.primary.score,
        secondary: analysis.secondary.score,
        weights: analysis.weights.score,
        hierarchy: analysis.hierarchy.score
      },
      issues,
      confidence
    };
  }

  normalizeFontStructure(fontData) {
    // Handle multiple possible font structure formats
    const normalized = {
      primary: null,
      secondary: null,
      allFonts: new Set(),
      weights: new Set(),
      sizes: [],
      usage: {}
    };
    
    if (!fontData) return normalized;
    
    // IMPROVED: Handle typography structure from scraper (with fonts array, primary, secondary, weights)
    if (fontData.typography && typeof fontData.typography === 'object') {
      // Extract all fonts from typography structure
      if (Array.isArray(fontData.typography.fonts)) {
        fontData.typography.fonts.forEach(font => {
          const cleanedFont = this.cleanFontName(font);
          if (cleanedFont && this.isValidFontName(cleanedFont)) {
            normalized.allFonts.add(cleanedFont);
          }
        });
      }
      
      // Use primary/secondary from typography if available
      if (fontData.typography.primary) {
        const cleaned = this.cleanFontName(fontData.typography.primary);
        if (cleaned && this.isValidFontName(cleaned)) {
          normalized.primary = cleaned;
          normalized.allFonts.add(cleaned);
        }
      }
      
      if (fontData.typography.secondary) {
        const cleaned = this.cleanFontName(fontData.typography.secondary);
        if (cleaned && this.isValidFontName(cleaned)) {
          normalized.secondary = cleaned;
          normalized.allFonts.add(cleaned);
        }
      }
      
      // Normalize and add weights (convert numeric to semantic names)
      if (Array.isArray(fontData.typography.weights)) {
        fontData.typography.weights.forEach(weight => {
          const normalizedWeight = this.normalizeWeight(weight);
          if (normalizedWeight) {
            normalized.weights.add(normalizedWeight);
          }
        });
      }
      
      if (Array.isArray(fontData.typography.fontSize)) {
        normalized.sizes = fontData.typography.fontSize;
      }
    }
    
    // IMPROVED: Handle simple array format from scraper
    if (Array.isArray(fontData)) {
      fontData.forEach(font => {
        const cleanedFont = this.cleanFontName(font);
        if (cleanedFont && this.isValidFontName(cleanedFont)) {
          normalized.allFonts.add(cleanedFont);
        }
      });
      
      // Set primary and secondary from array, preferring valid font names
      const validFonts = Array.from(normalized.allFonts).filter(f => this.isValidFontName(f));
      if (validFonts.length > 0) {
        normalized.primary = this.findBestFontName(validFonts) || validFonts[0];
      }
      if (validFonts.length > 1) {
        normalized.secondary = validFonts.find(f => f !== normalized.primary) || validFonts[1];
      }
      
      return normalized;
    }
    
    // First, extract ALL fonts from allFonts array to find valid ones
    if (fontData.allFonts && Array.isArray(fontData.allFonts)) {
      fontData.allFonts.forEach(fontObj => {
        if (typeof fontObj === 'string') {
          const fontName = this.cleanFontName(fontObj);
          if (fontName && this.isValidFontName(fontName)) {
            normalized.allFonts.add(fontName);
          }
        } else if (fontObj.font) {
          const fontName = this.cleanFontName(fontObj.font);
          if (fontName && this.isValidFontName(fontName)) {
            normalized.allFonts.add(fontName);
            
            if (fontObj.weights) {
              fontObj.weights.forEach(weight => {
                const normalizedWeight = this.normalizeWeight(weight);
                if (normalizedWeight) {
                  normalized.weights.add(normalizedWeight);
                }
              });
            }
            
            if (fontObj.usage) {
              normalized.usage[fontName] = fontObj.usage;
            }
          }
        }
      });
    }
    
    // Extract from simple fonts array
    if (fontData.fonts && Array.isArray(fontData.fonts)) {
      fontData.fonts.forEach(font => {
        const fontName = this.cleanFontName(font);
        if (fontName && this.isValidFontName(fontName)) {
          normalized.allFonts.add(fontName);
        }
      });
    }
    
    // Extract from primary font - but validate it's a real font name
    if (fontData.primary) {
      let primaryFont = null;
      if (typeof fontData.primary === 'string') {
        primaryFont = this.cleanFontName(fontData.primary);
      } else if (fontData.primary.font) {
        primaryFont = this.cleanFontName(fontData.primary.font);
        if (fontData.primary.weights) {
          fontData.primary.weights.forEach(weight => {
            const normalizedWeight = this.normalizeWeight(weight);
            if (normalizedWeight) {
              normalized.weights.add(normalizedWeight);
            }
          });
        }
      }
      
      // Only use primary if it's a valid font name
      if (primaryFont && this.isValidFontName(primaryFont)) {
        normalized.primary = primaryFont;
        normalized.allFonts.add(primaryFont);
      }
    }
    
    // Extract from secondary font - but validate it's a real font name
    if (fontData.secondary) {
      let secondaryFont = null;
      if (typeof fontData.secondary === 'string') {
        secondaryFont = this.cleanFontName(fontData.secondary);
      } else if (fontData.secondary.font) {
        secondaryFont = this.cleanFontName(fontData.secondary.font);
        if (fontData.secondary.weights) {
          fontData.secondary.weights.forEach(weight => {
            const normalizedWeight = this.normalizeWeight(weight);
            if (normalizedWeight) {
              normalized.weights.add(normalizedWeight);
            }
          });
        }
      }
      
      // Only use secondary if it's a valid font name
      if (secondaryFont && this.isValidFontName(secondaryFont)) {
        normalized.secondary = secondaryFont;
        normalized.allFonts.add(secondaryFont);
      }
    }
    
    // Extract weights from top-level weights array
    if (Array.isArray(fontData.weights)) {
      fontData.weights.forEach(weight => {
        const normalizedWeight = this.normalizeWeight(weight);
        if (normalizedWeight) {
          normalized.weights.add(normalizedWeight);
        }
      });
    }
    
    // If primary/secondary are invalid, try to extract valid fonts from allFonts
    const validFonts = Array.from(normalized.allFonts).filter(f => this.isValidFontName(f));
    
    if (!normalized.primary && validFonts.length > 0) {
      // Prefer fonts that look like actual font names (common ones, single words, etc.)
      const preferredFont = this.findBestFontName(validFonts);
      normalized.primary = preferredFont || validFonts[0];
    }
    
    if (!normalized.secondary && validFonts.length > 1) {
      normalized.secondary = validFonts.find(f => f !== normalized.primary) || validFonts[1];
    }
    
    return normalized;
  }

  /**
   * Normalize font weight: converts numeric (400, 700) to semantic (regular, bold) and vice versa
   * @param {string|number} weight - Font weight (numeric string like "400" or semantic like "Bold")
   * @returns {string} - Normalized weight in lowercase semantic form
   */
  normalizeWeight(weight) {
    if (!weight) return null;
    
    // Convert to string and lowercase for consistent matching
    const weightStr = String(weight).toLowerCase().trim();
    
    // If it's already a semantic name, return it
    if (this.fontWeightMapping[weightStr]) {
      // Get numeric value and convert back to semantic for consistency
      const numValue = this.fontWeightMapping[weightStr];
      // Map numeric back to semantic name
      for (const [semantic, numeric] of Object.entries(this.fontWeightMapping)) {
        if (numeric === numValue && semantic !== String(numValue)) {
          return semantic.toLowerCase();
        }
      }
      return weightStr;
    }
    
    // If it's a numeric string, convert to semantic
    const numValue = parseInt(weightStr);
    if (!isNaN(numValue)) {
      // Map numeric to semantic name
      for (const [semantic, numeric] of Object.entries(this.fontWeightMapping)) {
        if (numeric === numValue && semantic !== String(numValue)) {
          return semantic.toLowerCase();
        }
      }
      // If no exact match, return the numeric value as string for comparison
      return String(numValue);
    }
    
    // Unknown format, return as-is
    return weightStr;
  }

  cleanFontName(fontName) {
    if (!fontName) return null;
    
    return fontName
      .replace(/\s+(?:bold|regular|light|medium|black|italic|normal)$/gi, '')
      .replace(/["']/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Validates if a font name is actually a font name and not a heading/text
   * Rejects names that contain common non-font words or are clearly not font names
   */
  isValidFontName(fontName) {
    if (!fontName || typeof fontName !== 'string') return false;
    
    const lower = fontName.toLowerCase();
    const words = lower.split(/\s+/);
    
    // Reject if contains common non-font words
    const invalidWords = [
      'guideline', 'guidelines', 'brand', 'branding', 'style', 'styles',
      'manual', 'guide', 'document', 'version', 'updated', 'revised',
      'chapter', 'section', 'page', 'typography', 'font', 'fonts',
      'usage', 'used', 'using', 'use', 'with', 'from', 'for', 'and',
      'the', 'is', 'are', 'there', 'these', 'this', 'that', 'flexibility',
      'built', 'in', 'have', 'been', 'can', 'be', 'should', 'must',
      'primary', 'secondary', 'heading', 'headings', 'body', 'text',
      'element', 'elements', 'general', 'specific', 'recommended'
    ];
    
    // Check if any invalid word appears in the font name
    if (invalidWords.some(word => lower.includes(word))) {
      return false;
    }
    
    // Reject if it's clearly a sentence or phrase (more than 3 words usually)
    if (words.length > 3) {
      return false;
    }
    
    // Reject if it contains numbers (unless it's a font variant like "Helvetica Neue 55")
    if (/\d{2,}/.test(fontName) && !/^(helvetica|futura|univers|avenir)/i.test(fontName)) {
      return false;
    }
    
    // Accept known common font names
    const commonFonts = [
      'helvetica', 'arial', 'times', 'georgia', 'verdana', 'courier',
      'impact', 'comic', 'tahoma', 'trebuchet', 'lucida', 'palatino',
      'garamond', 'baskerville', 'bookman', 'century', 'futura',
      'gill', 'optima', 'perpetua', 'rockwell', 'sabon', 'univers',
      'inter', 'roboto', 'montserrat', 'lato', 'open sans', 'poppins',
      'raleway', 'source sans', 'ubuntu', 'nunito', 'playfair',
      'merriweather', 'crimson', 'lora', 'dancing script', 'pacifico',
      'lobster', 'raleway', 'oswald', 'droid', 'noto sans', 'omnes'
    ];
    
    // Check if it matches any common font
    if (commonFonts.some(font => lower.includes(font) || font.includes(lower))) {
      return true;
    }
    
    // Accept single word or two-word combinations that look like font names
    // (proper nouns starting with capital, or common font-like patterns)
    if (words.length <= 2) {
      // Reject if it's all lowercase and looks like a generic word
      if (words.length === 1 && lower.length < 3) {
        return false;
      }
      
      // Accept if it follows font naming patterns
      return true;
    }
    
    // Default: reject if unsure
    return false;
  }

  /**
   * Finds the best/most likely font name from an array of potential fonts
   * Prioritizes common fonts and shorter, simpler names
   */
  findBestFontName(fontList) {
    if (!Array.isArray(fontList) || fontList.length === 0) return null;
    
    // Priority list of known fonts (most common first)
    const priorityFonts = [
      'omnes', 'montserrat', 'helvetica', 'arial', 'inter', 'roboto',
      'lato', 'open sans', 'poppins', 'times', 'georgia',
      'futura', 'univers', 'gotham', 'proxima nova', 'source sans'
    ];
    
    // First, check for exact matches with priority fonts
    for (const priority of priorityFonts) {
      const match = fontList.find(f => 
        f.toLowerCase().includes(priority) || priority.includes(f.toLowerCase())
      );
      if (match) return match;
    }
    
    // Then prefer shorter names (more likely to be actual font names)
    const sorted = [...fontList].sort((a, b) => a.length - b.length);
    
    // Prefer single-word or two-word fonts
    const simpleFonts = sorted.filter(f => f.split(/\s+/).length <= 2);
    if (simpleFonts.length > 0) {
      return simpleFonts[0];
    }
    
    // Fallback to shortest
    return sorted[0];
  }

  analyzePrimaryFont(scraped, brand) {
    if (!brand.primary) {
      return { score: 0.5, issues: [] };
    }
    
    const scrapedPrimary = scraped.primary || Array.from(scraped.allFonts)[0];
    if (!scrapedPrimary || scraped.allFonts.size === 0) {
      return {
        score: 0,
        issues: [{
          category: 'typography',
          type: 'no_fonts_detected',
          severity: 'high',
          message: 'No fonts detected on the webpage',
          suggestion: 'Ensure text elements use web fonts'
        }]
      };
    }
    
    // IMPROVED: Check ALL fonts in the stack for brand font (primary OR secondary)
    const brandFontLower = brand.primary.toLowerCase();
    const brandFontVariations = this.getFontVariations(brand.primary);
    
    // Also check secondary font if available
    const brandSecondaryLower = brand.secondary?.toLowerCase();
    const brandSecondaryVariations = brand.secondary ? this.getFontVariations(brand.secondary) : [];
    
    // Check if primary brand font exists
    const hasBrandPrimaryFont = Array.from(scraped.allFonts).some(scrapedFont => {
      const scrapedFontLower = scrapedFont.toLowerCase();
      
      // Direct match
      if (scrapedFontLower === brandFontLower || 
          scrapedFontLower.includes(brandFontLower) || 
          brandFontLower.includes(scrapedFontLower)) {
        return true;
      }
      
      // Check font family variations
      return brandFontVariations.some(variation => 
        scrapedFontLower.includes(variation) || variation.includes(scrapedFontLower)
      );
    });
    
    // Check if secondary brand font exists
    const hasBrandSecondaryFont = brandSecondaryLower ? Array.from(scraped.allFonts).some(scrapedFont => {
      const scrapedFontLower = scrapedFont.toLowerCase();
      
      // Direct match
      if (scrapedFontLower === brandSecondaryLower || 
          scrapedFontLower.includes(brandSecondaryLower) || 
          brandSecondaryLower.includes(scrapedFontLower)) {
        return true;
      }
      
      // Check font family variations
      return brandSecondaryVariations.some(variation => 
        scrapedFontLower.includes(variation) || variation.includes(scrapedFontLower)
      );
    }) : false;
    
    // If EITHER primary or secondary brand font is found, give high score (no issue)
    if (hasBrandPrimaryFont || hasBrandSecondaryFont) {
      console.log(`✅ Brand font found in scraped fonts list (primary: ${hasBrandPrimaryFont}, secondary: ${hasBrandSecondaryFont})`);
      return { score: 0.9, issues: [] }; // High score when any brand font is found in stack
    }
    
    // If not found, calculate similarity and generate issue
    const similarity = this.fontSimilarity(scrapedPrimary, brand.primary);
    
    const issues = [];
    
    if (similarity < 0.7) {
      const foundFonts = Array.from(scraped.allFonts).slice(0, 5).join(', ');
      issues.push({
        category: 'typography',
        type: 'primary_font_mismatch',
        severity: similarity < 0.3 ? 'high' : 'medium',
        message: `Primary font should be "${brand.primary}" but found "${scrapedPrimary}"`,
        recommendation: `Update font-family to use "${brand.primary}" as the primary font. Found fonts: ${foundFonts}`,
        suggestion: `Use font-family: "${brand.primary}", ... (with fallbacks)`,
        context: {
          expected: brand.primary,
          found: scrapedPrimary,
          availableFonts: Array.from(scraped.allFonts).join(', ')
        }
      });
    }
    
    return { score: similarity, issues };
  }

  /**
   * Get font family variations for matching (e.g., "Helvetica Neue" -> ["helvetica neue", "helvetica"])
   */
  getFontVariations(fontName) {
    if (!fontName) return [];
    
    const variations = new Set();
    const lower = fontName.toLowerCase();
    
    variations.add(lower); // Add original
    
    // Split multi-word fonts (e.g., "Helvetica Neue" -> ["helvetica", "neue"])
    const words = lower.split(/\s+/);
    
    // Add first word if multi-word (e.g., "helvetica neue" -> "helvetica")
    if (words.length > 1) {
      variations.add(words[0]);
    }
    
    // Add common variations from font family groups
    for (const [family, variants] of Object.entries(this.fontFamilies)) {
      if (lower.includes(family) || family.includes(lower)) {
        variants.forEach(v => variations.add(v));
        variations.add(family);
      }
    }
    
    return Array.from(variations);
  }

  analyzeSecondaryFont(scraped, brand) {
    if (!brand.secondary) {
      return { score: 0.5, issues: [] };
    }
    
    // IMPROVED: Check ALL fonts in the stack for brand secondary font
    const brandFontLower = brand.secondary.toLowerCase();
    const brandFontVariations = this.getFontVariations(brand.secondary);
    
    // Check if brand secondary font (or any variation) exists anywhere in the scraped font stack
    const hasBrandFont = Array.from(scraped.allFonts).some(scrapedFont => {
      const scrapedFontLower = scrapedFont.toLowerCase();
      
      // Direct match
      if (scrapedFontLower === brandFontLower || 
          scrapedFontLower.includes(brandFontLower) || 
          brandFontLower.includes(scrapedFontLower)) {
        return true;
      }
      
      // Check font family variations
      return brandFontVariations.some(variation => 
        scrapedFontLower.includes(variation) || variation.includes(scrapedFontLower)
      );
    });
    
    if (hasBrandFont) {
      console.log(`✅ Brand secondary font "${brand.secondary}" found in scraped fonts list`);
      return { score: 0.9, issues: [] }; // High score when brand font is found in stack
    }
    
    const scrapedSecondary = scraped.secondary || 
                             Array.from(scraped.allFonts).find(f => f !== scraped.primary) || 
                             Array.from(scraped.allFonts)[1];
    
    if (!scrapedSecondary) {
      return {
        score: 0.3,
        issues: [{
          category: 'typography',
          type: 'secondary_font_missing',
          severity: 'medium',
          message: 'Secondary font not detected',
          suggestion: `Use "${brand.secondary}" as secondary font`
        }]
      };
    }
    
    const similarity = this.fontSimilarity(scrapedSecondary, brand.secondary);
    const issues = [];
    
    if (similarity < 0.6) {
      const foundFonts = Array.from(scraped.allFonts).slice(0, 5).join(', ');
      issues.push({
        category: 'typography',
        type: 'secondary_font_mismatch',
        severity: 'medium',
        message: `Secondary font should be similar to "${brand.secondary}"`,
        recommendation: `Use "${brand.secondary}" or a similar font family. Found fonts: ${foundFonts}`,
        suggestion: `Use font-family: "${brand.secondary}", ... (with fallbacks)`
      });
    }
    
    return { score: similarity, issues };
  }

  analyzeFontWeights(scraped, brand) {
    if (brand.weights.size === 0) {
      return { score: 0.5, issues: [] };
    }
    
    const scrapedWeights = new Set(scraped.weights);
    const brandWeights = new Set(brand.weights);
    
    const matchingWeights = [...brandWeights].filter(weight => 
      scrapedWeights.has(weight) || this.findWeightMatch(weight, scrapedWeights)
    ).length;
    
    const score = brandWeights.size > 0 ? matchingWeights / brandWeights.size : 0.5;
    
    const issues = [];
    if (score < 0.5) {
      issues.push({
        category: 'typography',
        type: 'font_weights_missing',
        severity: 'low',
        message: 'Not using all recommended font weights',
        suggestion: `Use font weights: ${Array.from(brandWeights).join(', ')}`
      });
    }
    
    return { score, issues };
  }

  analyzeFontHierarchy(scraped, brand) {
    // Simple hierarchy check - more sophisticated version would analyze component usage
    if (scraped.allFonts.size >= 2 && brand.allFonts.size >= 2) {
      return { score: 0.8, issues: [] };
    }
    
    if (scraped.allFonts.size >= 1 && brand.allFonts.size >= 1) {
      return { score: 0.6, issues: [] };
    }
    
    return { score: 0.3, issues: [] };
  }

  fontSimilarity(font1, font2) {
    if (!font1 || !font2) return 0;
    
    const f1 = font1.toLowerCase();
    const f2 = font2.toLowerCase();
    
    // Exact match
    if (f1 === f2) return 1.0;
    
    // Check font family groups
    for (const [family, variants] of Object.entries(this.fontFamilies)) {
      const inFamily1 = f1 === family || variants.includes(f1);
      const inFamily2 = f2 === family || variants.includes(f2);
      
      if (inFamily1 && inFamily2) return 0.8;
    }
    
    // Partial string match
    if (f1.includes(f2) || f2.includes(f1)) return 0.6;
    
    // Both are generic sans-serif
    if ((f1.includes('sans') && f2.includes('sans')) || 
        (f1.includes('system') && f2.includes('system'))) {
      return 0.5;
    }
    
    return 0.2; // Minimal similarity
  }

  findWeightMatch(brandWeight, scrapedWeights) {
    // Normalize brand weight
    const normalizedBrand = this.normalizeWeight(brandWeight);
    if (!normalizedBrand) return false;
    
    // Get numeric value for brand weight
    let brandNum = this.fontWeightMapping[normalizedBrand];
    if (!brandNum && !isNaN(normalizedBrand)) {
      brandNum = parseInt(normalizedBrand);
    }
    if (!brandNum) return false;
    
    // Check if any scraped weight matches the brand weight (within reasonable range)
    return [...scrapedWeights].some(scrapedWeight => {
      // Try to get numeric value for scraped weight
      let scrapedNum = this.fontWeightMapping[scrapedWeight.toLowerCase()];
      if (!scrapedNum && !isNaN(scrapedWeight)) {
        scrapedNum = parseInt(scrapedWeight);
      }
      
      // If both have numeric values, check if they match (within ±100 for same general weight)
      if (scrapedNum && brandNum) {
        return Math.abs(brandNum - scrapedNum) <= 100;
      }
      
      // Also check if they're the same semantic name
      return scrapedWeight.toLowerCase() === brandWeight.toLowerCase();
    });
  }

  /**
   * Get weight category for matching (light: 100-300, regular: 400-500, bold: 600-900)
   */
  getWeightCategory(weightNum) {
    if (weightNum <= 300) return 'light';
    if (weightNum <= 500) return 'regular';
    return 'bold';
  }

  calculateFontScore(analysis) {
    const weights = {
      primary: 0.4,
      secondary: 0.3,
      weights: 0.2,
      hierarchy: 0.1
    };
    
    return Object.keys(weights).reduce((total, key) => {
      return total + (analysis[key].score * weights[key]);
    }, 0);
  }

  calculateFontConfidence(scraped, brand) {
    const scrapedCount = scraped.allFonts.size;
    const brandCount = brand.allFonts.size;
    
    if (brandCount === 0) return 0.5;
    
    const coverage = Math.min(scrapedCount / brandCount, 1);
    const quality = scrapedCount > 0 ? 0.8 : 0.2;
    
    return (coverage * 0.6 + quality * 0.4);
  }
}
