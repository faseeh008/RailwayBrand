// @ts-nocheck
/**
 * Advanced Color Extractor with Context Awareness
 * Handles all color formats and provides proper categorization
 */
export class AdvancedColorExtractor {
  constructor() {
    this.colorContexts = {
      'primary': ['primary', 'main', 'brand', 'core'],
      'secondary': ['secondary', 'accent', 'supporting'],
      'neutral': ['black', 'white', 'gray', 'grey', 'neutral'],
      'semantic': ['success', 'error', 'warning', 'info', 'danger']
    };
  }

  /**
   * Extract colors with proper context and categorization
   */
  extractColorsWithContext(text) {
    console.log('🎨 Starting enhanced color extraction...');
    
    // Step 1: Extract ALL color values with positions
    const allColorMatches = this.findAllColorValues(text);
    console.log(`🎨 Found ${allColorMatches.length} raw color matches`);
    
    // Step 2: Group colors by context and proximity
    const groupedColors = this.groupColorsByContext(allColorMatches, text);
    
    // Step 3: Categorize colors based on naming patterns
    const categorized = this.categorizeColors(groupedColors);
    
    // Step 4: Build final structure
    const result = this.buildColorStructure(categorized);
    
    console.log('🎨 Final color extraction:', result);
    return result;
  }

  /**
   * Find all color values in various formats (enhanced)
   */
  findAllColorValues(text) {
    const colorPatterns = [
      // Hex codes in various formats
      { pattern: /#([A-Fa-f0-9]{6})\b/g, type: 'hex' },
      { pattern: /#([A-Fa-f0-9]{3})\b/g, type: 'hex_short' },
      { pattern: /\b([A-Fa-f0-9]{6})\b(?!\w)/g, type: 'hex_raw' },
      
      // Color names with hex codes (Buffer specific patterns)
      { pattern: /(\w+(?:\s+\w+)*)\s+#([A-Fa-f0-9]{6})/gi, type: 'named_hex' },
      { pattern: /#([A-Fa-f0-9]{6})\s+(\w+(?:\s+\w+)*)/gi, type: 'hex_named' },
      
      // Section headers with colors
      { pattern: /(Primary colors?|Secondary colors?)[\s\S]{1,200}?(#([A-Fa-f0-9]{6}))/gi, type: 'section_colors' },
      
      // RGB formats
      { pattern: /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, type: 'rgb' },
      { pattern: /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/g, type: 'rgba' },
      
      // Common color names
      { pattern: /\b(black|white|red|blue|green|yellow|purple|orange|pink|brown|gray|grey)\b/gi, type: 'color_name' }
    ];
    
    const matches = [];
    
    for (const { pattern, type } of colorPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const context = this.getContext(text, match.index, 100);
        matches.push({
          value: match[0],
          hex: this.extractHexFromMatch(match, type),
          name: this.extractColorName(match, type, context),
          type: type,
          position: match.index,
          context: context
        });
      }
    }
    
    return matches;
  }

  /**
   * Extract hex value from match based on type
   */
  extractHexFromMatch(match, type) {
    try {
      switch(type) {
        case 'hex':
          return match[1] ? `#${match[1].toUpperCase()}` : null;
        case 'hex_short':
          const short = match[1];
          return short && short.length === 3 ? `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`.toUpperCase() : null;
        case 'hex_raw':
          return match[1] ? `#${match[1].toUpperCase()}` : null;
        case 'named_hex':
          return match[2] ? `#${match[2].toUpperCase()}` : null;
        case 'hex_named':
          return match[1] ? `#${match[1].toUpperCase()}` : null;
        case 'section_colors':
          return match[3] ? `#${match[3].toUpperCase()}` : null;
        case 'rgb':
          const [r, g, b] = match.slice(1, 4);
          return (r && g && b) ? this.rgbToHex(parseInt(r), parseInt(g), parseInt(b)) : null;
        case 'rgba':
          const [r2, g2, b2] = match.slice(1, 4);
          return (r2 && g2 && b2) ? this.rgbToHex(parseInt(r2), parseInt(g2), parseInt(b2)) : null;
        default:
          return null;
      }
    } catch (error) {
      console.warn('⚠️ Error extracting hex from match:', error);
      return null;
    }
  }

  /**
   * Extract color name from match based on type and context
   */
  extractColorName(match, type, context) {
    switch(type) {
      case 'named_hex':
        return match[1].trim();
      case 'hex_named':
        return match[2].trim();
      case 'section_colors':
        return this.inferColorNameFromSection(match[1], context);
      case 'color_name':
        return match[1].trim();
      default:
        return this.inferColorNameFromContext(context, this.extractHexFromMatch(match, type));
    }
  }

  /**
   * Infer color name from section context
   */
  inferColorNameFromSection(sectionName, context) {
    const sectionLower = sectionName.toLowerCase();
    if (sectionLower.includes('primary')) return 'Primary Color';
    if (sectionLower.includes('secondary')) return 'Secondary Color';
    return 'Brand Color';
  }

  /**
   * Infer color name from context
   * PRIORITY: Use hex value first, then context
   */
  inferColorNameFromContext(context, hex) {
    // FIRST: Determine color name from hex value (most reliable)
    const colorFromHex = this.getNameFromHex(hex);
    
    // SECOND: Check if context has explicit color name near this hex
    const contextColorName = this.extractColorNameFromContext(context, hex);
    
    // Prefer hex-based name, but use context if it's more specific
    if (contextColorName && contextColorName !== colorFromHex) {
      // Only use context if it's a real color name, not a false match
      const commonColorNames = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'teal', 'cyan'];
      const contextLower = contextColorName.toLowerCase();
      if (commonColorNames.some(name => contextLower.includes(name))) {
        return contextColorName;
      }
    }
    
    return colorFromHex;
  }

  /**
   * Get color name from hex value (RELIABLE)
   */
  getNameFromHex(hex) {
    if (!hex) return 'Unknown';
    
    const upperHex = hex.toUpperCase();
    
    // Exact matches for common colors
    if (upperHex === '#000000' || upperHex === '#000') return 'Black';
    if (upperHex === '#FFFFFF' || upperHex === '#FFF') return 'White';
    if (upperHex === '#FF0000' || upperHex === '#F00') return 'Red';
    if (upperHex === '#00FF00' || upperHex === '#0F0') return 'Green';
    if (upperHex === '#0000FF' || upperHex === '#00F') return 'Blue';
    if (upperHex === '#FFFF00' || upperHex === '#FF0') return 'Yellow';
    if (upperHex === '#FFA500' || upperHex === '#FA0') return 'Orange';
    if (upperHex === '#800080' || upperHex === '#808') return 'Purple';
    if (upperHex === '#FFC0CB') return 'Pink';
    if (upperHex === '#808080') return 'Gray';
    
    // Check if it's a grayscale (R=G=B)
    const rgb = this.hexToRgb(hex);
    if (rgb && rgb.r === rgb.g && rgb.g === rgb.b) {
      if (rgb.r < 128) return 'Black';
      if (rgb.r > 200) return 'White';
      return 'Gray';
    }
    
    // Try to infer from RGB values
    return this.inferColorNameFromRgb(rgb);
  }

  /**
   * Infer color name from RGB values
   */
  inferColorNameFromRgb(rgb) {
    if (!rgb) return 'Unknown Color';
    
    const { r, g, b } = rgb;
    
    // Grayscale detection
    if (Math.abs(r - g) < 5 && Math.abs(g - b) < 5) {
      if (r < 50) return 'Black';
      if (r > 200) return 'White';
      return 'Gray';
    }
    
    // Color dominance detection
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (g > 200 && r < 100 && b < 100) return 'Green';
    if (b > 200 && r < 100 && g < 100) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && g < 150 && b < 150) return 'Red';
    if (r > 150 && g > 100 && b < 100) return 'Orange';
    if (r > 150 && g < 100 && b > 150) return 'Purple';
    if (r > 200 && g > 150 && b > 150) return 'Pink';
    
    return `Color with RGB(${r},${g},${b})`;
  }

  /**
   * Extract color name from context near the hex value
   * But ONLY use it if it matches the hex value
   */
  extractColorNameFromContext(context, hex) {
    const contextLower = context.toLowerCase();
    const upperHex = hex ? hex.toUpperCase() : '';
    
    // Only return a name if the context is ABOUT THIS SPECIFIC COLOR
    if (upperHex === '#000000' && contextLower.includes('black')) return 'Black';
    if (upperHex === '#FFFFFF' && contextLower.includes('white')) return 'White';
    
    // Try to find color names in the context
    const colorNamePatterns = [
      { pattern: /\b(black|white|red|blue|green|yellow|orange|purple|pink|brown|gray|grey|teal|cyan)\b/gi, hex: hex }
    ];
    
    for (const { pattern, hex: targetHex } of colorNamePatterns) {
      const matches = context.match(pattern);
      if (matches && matches.length > 0) {
        // Verify this name makes sense for this hex
        const suggestedName = matches[0].trim();
        if (this.isValidColorNameForHex(suggestedName, hex)) {
          return suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1);
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a color name is valid for a given hex value
   */
  isValidColorNameForHex(name, hex) {
    const nameLower = name.toLowerCase();
    const upperHex = hex.toUpperCase();
    
    // Black validation
    if (nameLower === 'black' && (upperHex === '#000000' || upperHex === '#000')) return true;
    if (nameLower === 'black' && upperHex !== '#000000' && upperHex !== '#000') return false;
    
    // White validation
    if (nameLower === 'white' && (upperHex === '#FFFFFF' || upperHex === '#FFF')) return true;
    if (nameLower === 'white' && upperHex !== '#FFFFFF' && upperHex !== '#FFF') return false;
    
    // Other colors - accept if name matches context intent
    return true;
  }

  /**
   * Group colors by context and proximity
   */
  groupColorsByContext(matches, text) {
    const groups = {
      primary: [],
      secondary: [],
      accent: [],
      neutral: [],
      uncategorized: []
    };

    for (const match of matches) {
      const context = match.context.toLowerCase();
      let categorized = false;

      // Check for primary colors context
      if (context.includes('primary color') || context.includes('primary colors')) {
        groups.primary.push(match);
        categorized = true;
      }
      
      // Check for secondary colors context
      if (context.includes('secondary color') || context.includes('secondary colors')) {
        groups.secondary.push(match);
        categorized = true;
      }

      // Check for neutral colors
      if (context.includes('black') || context.includes('white') || context.includes('gray')) {
        groups.neutral.push(match);
        categorized = true;
      }

      // Check by position in color sections
      if (!categorized) {
        const section = this.findColorSection(text, match.position);
        if (section.includes('primary')) {
          groups.primary.push(match);
        } else if (section.includes('secondary')) {
          groups.secondary.push(match);
        } else {
          groups.uncategorized.push(match);
        }
      }
    }

    return groups;
  }

  /**
   * Find color section for a position
   */
  findColorSection(text, position) {
    // Look backwards for section headers
    const start = Math.max(0, position - 500);
    const sectionText = text.substring(start, position);
    
    const sectionMatch = sectionText.match(/(primary colors?|secondary colors?|accent colors?|neutral)/i);
    return sectionMatch ? sectionMatch[1].toLowerCase() : '';
  }

  /**
   * Categorize colors based on naming patterns
   */
  categorizeColors(groupedColors) {
    const categorized = {
      primary: [],
      secondary: [],
      accent: [],
      neutral: []
    };

    // Process primary colors (first 1-2 colors from primary group)
    categorized.primary = groupedColors.primary.slice(0, 2).map(match => ({
      name: match.name,
      hex: match.hex,
      usage: 'Primary brand elements'
    }));

    // Process secondary colors
    categorized.secondary = groupedColors.secondary.slice(0, 3).map(match => ({
      name: match.name,
      hex: match.hex,
      usage: 'Secondary elements, products'
    }));

    // Process neutral colors
    categorized.neutral = groupedColors.neutral.map(match => ({
      name: match.name,
      hex: match.hex,
      usage: this.getNeutralUsage(match.name)
    }));

    // Handle uncategorized - assign based on color properties
    for (const match of groupedColors.uncategorized) {
      // Skip matches with null or invalid hex values
      if (!match.hex || match.hex === null) {
        continue;
      }
      
      if (this.isNeutralColor(match.hex)) {
        categorized.neutral.push({
          name: match.name,
          hex: match.hex,
          usage: this.getNeutralUsage(match.name)
        });
      } else if (categorized.primary.length < 2) {
        categorized.primary.push({
          name: match.name,
          hex: match.hex,
          usage: 'Primary brand color'
        });
      } else {
        categorized.accent.push({
          name: match.name,
          hex: match.hex,
          usage: 'Accent elements'
        });
      }
    }

    return categorized;
  }

  /**
   * Check if color is neutral
   */
  isNeutralColor(hex) {
    if (!hex || hex === null) return false;
    const neutralHexes = ['#000000', '#231F20', '#FFFFFF', '#B8B8B8', '#636363', '#3D3D3D'];
    return neutralHexes.includes(hex.toUpperCase());
  }

  /**
   * Get neutral color usage
   */
  getNeutralUsage(colorName) {
    const name = colorName.toLowerCase();
    if (name.includes('black')) return 'Headings, text';
    if (name.includes('white')) return 'Backgrounds';
    if (name.includes('gray')) return 'Secondary text, borders';
    return 'Neutral elements';
  }

  /**
   * Build final color structure
   */
  buildColorStructure(categorized) {
    const palette = [
      ...categorized.primary.map(c => c.hex).filter(hex => hex && hex !== null),
      ...categorized.secondary.map(c => c.hex).filter(hex => hex && hex !== null),
      ...categorized.accent.map(c => c.hex).filter(hex => hex && hex !== null),
      ...categorized.neutral.map(c => c.hex).filter(hex => hex && hex !== null)
    ];

    return {
      primary: categorized.primary[0] || null,
      secondary: categorized.secondary[0] || null,
      accent: categorized.accent[0] || null,
      neutral: categorized.neutral.filter(c => c.hex && c.hex !== null),
      palette: [...new Set(palette)] // Remove duplicates
    };
  }

  /**
   * Normalize all color values to 6-digit hex
   */
  normalizeColorValue(colorMatch) {
    const formatType = colorMatch.format;
    const groups = colorMatch.groups;
    
    switch (formatType) {
      case 'hex':
        return `#${groups[0].toUpperCase()}`;
        
      case 'hex_short':
        // Expand 3-digit to 6-digit hex
        const hexVal = groups[0];
        return `#${hexVal[0]}${hexVal[0]}${hexVal[1]}${hexVal[1]}${hexVal[2]}${hexVal[2]}`.toUpperCase();
        
      case 'hex_raw':
        return `#${groups[0].toUpperCase()}`;
        
      case 'rgb':
        const [r, g, b] = groups;
        return this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
        
      case 'rgba':
        const [r2, g2, b2] = groups;
        return this.rgbToHex(parseInt(r2), parseInt(g2), parseInt(b2));
        
      case 'named_hex':
      case 'simple_named_hex':
        return `#${groups[1].toUpperCase()}`;
        
      case 'color_name':
        return this.colorNameToHex(groups[0].toLowerCase());
        
      default:
        return colorMatch.value;
    }
  }

  /**
   * Convert RGB to hex
   */
  rgbToHex(r, g, b) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Convert hex to RGB
   */
  hexToRgb(hex) {
    if (!hex) return null;
    
    const cleanHex = hex.replace('#', '');
    
    // Handle 6-digit hex
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return { r, g, b };
    }
    
    // Handle 3-digit hex
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r, g, b };
    }
    
    return null;
  }

  /**
   * Convert color names to hex
   */
  colorNameToHex(colorName) {
    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    return colorMap[colorName] || `#${colorName}`;
  }

  /**
   * Determine color category based on context
   */
  determineColorCategory(colorValue, context) {
    const contextLower = context.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.colorContexts)) {
      if (keywords.some(keyword => contextLower.includes(keyword))) {
        return category;
      }
    }
    
    // Fallback categorization
    const colorUpper = colorValue.toUpperCase();
    if (['#000000', '#FFFFFF', '#333333', '#666666', '#999999'].includes(colorUpper)) {
      return 'neutral';
    }
    
    return 'palette'; // Default category
  }

  /**
   * Extract color usage from context
   */
  extractColorUsage(context) {
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('button')) return 'buttons';
    if (contextLower.includes('text')) return 'text';
    if (contextLower.includes('background')) return 'background';
    if (contextLower.includes('logo')) return 'logo';
    if (contextLower.includes('accent')) return 'accent';
    if (contextLower.includes('primary')) return 'primary';
    if (contextLower.includes('secondary')) return 'secondary';
    
    return 'general';
  }

  /**
   * Extract color usage rules and constraints
   */
  extractColorUsageRules(text) {
    const rules = [];
    
    const rulePatterns = [
      /(?:do not|don't|never|avoid)[^.]*color[^.]*\./gi,
      /(?:always|must|should)[^.]*color[^.]*\./gi,
      /use.*color.*on.*background/gi,
      /color.*pair/gi,
      /contrast.*ratio/gi,
      /accessibility.*color/gi
    ];
    
    for (const pattern of rulePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        rules.push(...matches);
      }
    }
    
    return rules;
  }

  /**
   * Get context window around a position
   */
  getContextWindow(text, position, windowSize = 200) {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.substring(start, end);
  }

  /**
   * Get context around a position (alias for getContextWindow)
   */
  getContext(text, position, length) {
    return this.getContextWindow(text, position, length);
  }
}
