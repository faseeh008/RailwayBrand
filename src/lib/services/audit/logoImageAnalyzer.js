// @ts-nocheck
// Commented out to avoid bundling in Vercel serverless functions (exceeds 250MB limit)
// Uncomment if deploying to a platform that supports larger bundles (e.g., Railway, Render)
// import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

/**
 * Logo Image Analyzer
 * Analyzes logo images from screenshots or extracted images to verify:
 * - Logo presence and positioning
 * - Colors used in logo
 * - Dimensions and aspect ratio
 * - Clear space/spacing compliance
 * - Overall visual compliance with brand guidelines
 */
export class LogoImageAnalyzer {
  constructor() {
    this.supportedFormats = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
  }

  /**
   * Main method to analyze logo from screenshot or extracted image
   * @param {Object} options - Analysis options
   * @param {string} options.screenshotPath - Path to full page screenshot
   * @param {string} options.logoImagePath - Path to extracted logo image (optional)
   * @param {Object} options.logoElement - DOM element info with position (optional)
   * @param {Object} options.brandGuidelines - Brand logo guidelines
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeLogo(options = {}) {
    const { screenshotPath, logoImagePath, logoElement, brandGuidelines } = options;
    
    console.log('🖼️ Starting logo image analysis...');
    
    try {
      // Step 1: Extract logo region from screenshot if logo element position provided
      // Dynamic import to avoid bundling canvas in serverless functions
      const { createCanvas, loadImage } = await import('canvas');
      let logoImage = null;
      let logoRegion = null;
      
      if (logoImagePath && fs.existsSync(logoImagePath)) {
        // Use provided logo image
        logoImage = await loadImage(logoImagePath);
        logoRegion = {
          x: 0,
          y: 0,
          width: logoImage.width,
          height: logoImage.height
        };
        console.log(`✅ Loaded logo image: ${logoImagePath} (${logoImage.width}x${logoImage.height})`);
      } else if (screenshotPath && fs.existsSync(screenshotPath) && logoElement?.position) {
        // Extract logo region from screenshot
        logoRegion = await this.extractLogoFromScreenshot(screenshotPath, logoElement.position);
        if (logoRegion) {
          logoImage = logoRegion.image;
          console.log(`✅ Extracted logo region from screenshot: ${logoRegion.width}x${logoRegion.height}`);
        }
      } else if (screenshotPath && fs.existsSync(screenshotPath)) {
        // Try to detect logo in screenshot automatically
        logoRegion = await this.detectLogoInScreenshot(screenshotPath, brandGuidelines);
        if (logoRegion) {
          logoImage = logoRegion.image;
          console.log(`✅ Auto-detected logo in screenshot: ${logoRegion.width}x${logoRegion.height}`);
        }
      }
      
      if (!logoImage) {
        return {
          detected: false,
          confidence: 0,
          issues: [{
            category: 'logo',
            type: 'logo_not_detected',
            severity: 'high',
            message: 'No logo image could be extracted or detected from the webpage',
            recommendation: 'Ensure logo is visible and properly implemented'
          }],
          analysis: null
        };
      }
      
      // Step 2: Analyze logo image
      const analysis = await this.analyzeLogoImage(logoImage, brandGuidelines, logoElement);
      
      // Step 3: Check clear space if logo element position provided
      let clearSpaceAnalysis = null;
      if (logoElement?.position && screenshotPath) {
        clearSpaceAnalysis = await this.analyzeClearSpace(
          screenshotPath,
          logoElement.position,
          brandGuidelines?.logo?.clearSpace
        );
      }
      
      // Step 4: Generate issues based on analysis
      const issues = this.generateLogoIssues(analysis, clearSpaceAnalysis, brandGuidelines);
      
      // Step 5: Calculate confidence score
      const confidence = this.calculateConfidence(analysis, issues);
      
      return {
        detected: true,
        confidence,
        issues,
        analysis: {
          ...analysis,
          clearSpace: clearSpaceAnalysis
        },
        logoRegion: logoRegion ? {
          x: logoRegion.x,
          y: logoRegion.y,
          width: logoRegion.width,
          height: logoRegion.height
        } : null
      };
      
    } catch (error) {
      console.error('❌ Logo image analysis failed:', error);
      return {
        detected: false,
        confidence: 0,
        issues: [{
          category: 'logo',
          type: 'logo_analysis_failed',
          severity: 'medium',
          message: 'Failed to analyze logo image',
          recommendation: 'Ensure logo image is accessible and in a supported format'
        }],
        analysis: null,
        error: error.message
      };
    }
  }

  /**
   * Extract logo region from screenshot based on element position
   */
  async extractLogoFromScreenshot(screenshotPath, position) {
    try {
      // Dynamic import to avoid bundling canvas in serverless functions
      const { createCanvas, loadImage } = await import('canvas');
      const screenshot = await loadImage(screenshotPath);
      const { x = 0, y = 0, width = 0, height = 0 } = position;
      
      if (width <= 0 || height <= 0) {
        return null;
      }
      
      // Create canvas for logo region (with some padding for context)
      const padding = 10;
      const logoCanvas = createCanvas(
        Math.min(width + padding * 2, screenshot.width - x),
        Math.min(height + padding * 2, screenshot.height - y)
      );
      const ctx = logoCanvas.getContext('2d');
      
      // Extract logo region with padding
      const sx = Math.max(0, x - padding);
      const sy = Math.max(0, y - padding);
      const sw = Math.min(width + padding * 2, screenshot.width - sx);
      const sh = Math.min(height + padding * 2, screenshot.height - sy);
      
      ctx.drawImage(
        screenshot,
        sx, sy, sw, sh,
        0, 0, sw, sh
      );
      
      return {
        image: logoCanvas,
        x: sx,
        y: sy,
        width: sw,
        height: sh
      };
    } catch (error) {
      console.error('❌ Failed to extract logo from screenshot:', error);
      return null;
    }
  }

  /**
   * Auto-detect logo in screenshot (top-left header area)
   */
  async detectLogoInScreenshot(screenshotPath, brandGuidelines) {
    try {
      const screenshot = await loadImage(screenshotPath);
      
      // Focus on header area (top 20% of image, left 30% of width)
      const headerHeight = Math.floor(screenshot.height * 0.2);
      const headerWidth = Math.floor(screenshot.width * 0.3);
      
      const logoCanvas = createCanvas(headerWidth, headerHeight);
      const ctx = logoCanvas.getContext('2d');
      ctx.drawImage(screenshot, 0, 0, headerWidth, headerHeight, 0, 0, headerWidth, headerHeight);
      
      return {
        image: logoCanvas,
        x: 0,
        y: 0,
        width: headerWidth,
        height: headerHeight
      };
    } catch (error) {
      console.error('❌ Failed to auto-detect logo:', error);
      return null;
    }
  }

  /**
   * Analyze logo image for colors, dimensions, and compliance
   */
  async analyzeLogoImage(logoImage, brandGuidelines, logoElement) {
    const analysis = {
      dimensions: {
        width: logoImage.width,
        height: logoImage.height,
        aspectRatio: (logoImage.width / logoImage.height).toFixed(2)
      },
      colors: [],
      dominantColors: [],
      isCompliant: true,
      complianceIssues: []
    };
    
    // Extract colors from logo
    const colors = await this.extractLogoColors(logoImage);
    analysis.colors = colors.all;
    analysis.dominantColors = colors.dominant;
    
    // Check color compliance
    if (brandGuidelines?.logo?.constraints) {
      const colorConstraints = brandGuidelines.logo.constraints.filter(c => 
        c.toLowerCase().includes('color') || 
        c.toLowerCase().includes('black') || 
        c.toLowerCase().includes('white')
      );
      
      if (colorConstraints.length > 0) {
        const compliance = this.checkColorCompliance(colors.dominant, colorConstraints, brandGuidelines);
        analysis.isCompliant = compliance.isCompliant;
        if (!compliance.isCompliant) {
          analysis.complianceIssues.push({
            type: 'color',
            message: compliance.message
          });
        }
      }
    }
    
    // Check dimensions against guidelines
    if (brandGuidelines?.logo) {
      const dimensionCheck = this.checkDimensions(analysis.dimensions, brandGuidelines.logo, logoElement);
      if (!dimensionCheck.isCompliant) {
        analysis.isCompliant = false;
        analysis.complianceIssues.push({
          type: 'dimension',
          message: dimensionCheck.message
        });
      }
    }
    
    return analysis;
  }

  /**
   * Extract colors from logo image
   */
  async extractLogoColors(logoImage) {
    const canvas = createCanvas(logoImage.width, logoImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(logoImage, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, logoImage.width, logoImage.height);
    const pixels = imageData.data;
    const colorMap = new Map();
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < pixels.length; i += 40) { // RGBA = 4 values per pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Convert to hex
      const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
      
      // Group similar colors (within 10 RGB units)
      const normalized = this.normalizeColor(r, g, b);
      colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1);
    }
    
    // Get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => color);
    
    return {
      all: sortedColors,
      dominant: sortedColors.slice(0, 5) // Top 5 dominant colors
    };
  }

  /**
   * Normalize color to reduce similar colors
   */
  normalizeColor(r, g, b) {
    // Round to nearest 10 for grouping
    const normalizedR = Math.round(r / 10) * 10;
    const normalizedG = Math.round(g / 10) * 10;
    const normalizedB = Math.round(b / 10) * 10;
    return `rgb(${normalizedR},${normalizedG},${normalizedB})`;
  }

  /**
   * Check if logo colors comply with brand guidelines
   */
  checkColorCompliance(logoColors, constraints, brandGuidelines) {
    // Extract allowed colors from brand guidelines
    const allowedColors = new Set();
    if (brandGuidelines?.colors?.primary?.hex) {
      allowedColors.add(brandGuidelines.colors.primary.hex.toLowerCase());
    }
    if (brandGuidelines?.colors?.secondary?.hex) {
      allowedColors.add(brandGuidelines.colors.secondary.hex.toLowerCase());
    }
    if (brandGuidelines?.colors?.palette) {
      brandGuidelines.colors.palette.forEach(c => allowedColors.add(c.toLowerCase()));
    }
    
    // Check if constraints mention black/white only
    const isBlackWhiteOnly = constraints.some(c => 
      c.toLowerCase().includes('black') && c.toLowerCase().includes('white')
    );
    
    if (isBlackWhiteOnly) {
      // Check if logo only uses black/white
      const nonCompliant = logoColors.filter(color => {
        const hex = this.rgbToHex(color);
        return hex && !['#000000', '#FFFFFF', '#000', '#FFF'].includes(hex.toUpperCase());
      });
      
      if (nonCompliant.length > 0) {
        return {
          isCompliant: false,
          message: `Logo uses non-compliant colors. Brand guidelines require black and white only, but found: ${nonCompliant.slice(0, 3).join(', ')}`
        };
      }
    }
    
    return { isCompliant: true };
  }

  /**
   * Check logo dimensions against guidelines
   */
  checkDimensions(dimensions, logoGuidelines, logoElement) {
    const issues = [];
    
    // Check minimum size
    if (logoGuidelines.minDigitalSize) {
      const minSize = this.parseSize(logoGuidelines.minDigitalSize);
      const logoMinSize = Math.min(dimensions.width, dimensions.height);
      
      if (minSize && logoMinSize < minSize.value) {
        issues.push(`Logo size (${logoMinSize}px) is below minimum requirement (${minSize.value}px)`);
      }
    }
    
    // Check aspect ratio
    if (logoGuidelines.aspectRatio) {
      const requiredRatio = this.parseAspectRatio(logoGuidelines.aspectRatio);
      const actualRatio = parseFloat(dimensions.aspectRatio);
      
      if (requiredRatio && Math.abs(actualRatio - requiredRatio) > 0.1) {
        issues.push(`Logo aspect ratio (${dimensions.aspectRatio}) doesn't match requirement`);
      }
    }
    
    return {
      isCompliant: issues.length === 0,
      message: issues.join('; ')
    };
  }

  /**
   * Analyze clear space around logo
   */
  async analyzeClearSpace(screenshotPath, logoPosition, clearSpaceRule) {
    if (!clearSpaceRule) {
      return null;
    }
    
    try {
      const screenshot = await loadImage(screenshotPath);
      const { x, y, width, height } = logoPosition;
      
      // Calculate clear space requirement (simplified - assumes "equal to logo width" rule)
      const clearSpaceRequired = width; // Default: equal to logo width
      
      // Check clear space in all directions
      const checks = {
        top: y >= clearSpaceRequired,
        left: x >= clearSpaceRequired,
        right: (screenshot.width - (x + width)) >= clearSpaceRequired,
        bottom: (screenshot.height - (y + height)) >= clearSpaceRequired
      };
      
      const violations = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([direction]) => direction);
      
      return {
        required: clearSpaceRequired,
        actual: {
          top: y,
          left: x,
          right: screenshot.width - (x + width),
          bottom: screenshot.height - (y + height)
        },
        compliant: violations.length === 0,
        violations
      };
    } catch (error) {
      console.error('❌ Clear space analysis failed:', error);
      return null;
    }
  }

  /**
   * Generate logo issues based on analysis
   */
  generateLogoIssues(analysis, clearSpaceAnalysis, brandGuidelines) {
    const issues = [];
    
    if (!analysis) return issues;
    
    // Color compliance issues
    if (!analysis.isCompliant) {
      analysis.complianceIssues.forEach(issue => {
        if (issue.type === 'color') {
          issues.push({
            category: 'logo',
            type: 'logo_color_violation',
            severity: 'high',
            message: issue.message,
            recommendation: 'Update logo to use only brand-compliant colors',
            details: {
              detectedColors: analysis.dominantColors,
              brandConstraints: brandGuidelines?.logo?.constraints || []
            }
          });
        } else if (issue.type === 'dimension') {
          issues.push({
            category: 'logo',
            type: 'logo_dimension_violation',
            severity: 'medium',
            message: issue.message,
            recommendation: 'Adjust logo size or aspect ratio to match brand guidelines',
            details: {
              currentDimensions: analysis.dimensions,
              brandRequirements: brandGuidelines?.logo || {}
            }
          });
        }
      });
    }
    
    // Clear space issues
    if (clearSpaceAnalysis && !clearSpaceAnalysis.compliant) {
      issues.push({
        category: 'logo',
        type: 'clear_space_violation',
        severity: 'medium',
        message: `Logo clear space requirement not met. Violations: ${clearSpaceAnalysis.violations.join(', ')}`,
        recommendation: `Ensure ${clearSpaceAnalysis.required}px clear space around logo in all directions`,
        details: {
          required: clearSpaceAnalysis.required,
          actual: clearSpaceAnalysis.actual,
          violations: clearSpaceAnalysis.violations
        }
      });
    }
    
    return issues;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(analysis, issues) {
    if (!analysis) return 0;
    
    let confidence = 1.0;
    
    // Reduce confidence for each issue
    issues.forEach(issue => {
      if (issue.severity === 'high') confidence -= 0.3;
      else if (issue.severity === 'medium') confidence -= 0.2;
      else confidence -= 0.1;
    });
    
    // Reduce confidence if dimensions are very small
    if (analysis.dimensions.width < 50 || analysis.dimensions.height < 50) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Parse size string (e.g., "50px", "100pt")
   */
  parseSize(sizeString) {
    if (!sizeString) return null;
    const match = sizeString.match(/(\d+)(px|pt|em|rem)/i);
    if (match) {
      return {
        value: parseInt(match[1]),
        unit: match[2].toLowerCase()
      };
    }
    return null;
  }

  /**
   * Parse aspect ratio string (e.g., "1:1", "16:9")
   */
  parseAspectRatio(ratioString) {
    if (!ratioString) return null;
    const match = ratioString.match(/(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]) / parseFloat(match[2]);
    }
    return null;
  }

  /**
   * Convert RGB string to hex
   */
  rgbToHex(rgbString) {
    const match = rgbString.match(/(\d+),(\d+),(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }
    return null;
  }
}

