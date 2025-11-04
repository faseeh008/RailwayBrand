// @ts-nocheck
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export class ScreenshotAnnotator {
  constructor() {
    this.issueTypes = {
      colors: { color: '#FF6B6B', label: 'Color Issue' },
      // Use blue for typography per request
      typography: { color: '#3B82F6', label: 'Typography Issue' },
      // Use yellow for logo per request
      logo: { color: '#FACC15', label: 'Logo Issue' },
      spacing: { color: '#FFA726', label: 'Spacing Issue' }
    };
  }

  async annotateScreenshot(screenshotPath, auditResults, elementPositions = [], brandGuidelines = null) {
    try {
      console.log(`🎨 Starting screenshot annotation...`);
      
      const image = await loadImage(screenshotPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      
      // Draw original screenshot
      ctx.drawImage(image, 0, 0);
      
      // Extract allowed colors from brand guidelines
      const allowedColors = this.extractAllowedColors(brandGuidelines);
      console.log(`🎨 Allowed colors from brand guidelines:`, allowedColors);
      
      // Add annotations for each issue
      if (auditResults.issues && auditResults.issues.length > 0) {
        auditResults.issues.forEach((issue, index) => {
          this.annotateIssue(ctx, issue, index, elementPositions, allowedColors);
        });
      }
      
      // Note: Legend is now displayed in the fullscreen modal overlay, not on the screenshot
      // This prevents it from covering the logo area
      // this.addLegend(ctx, canvas.width, canvas.height);
      
      // Add overall score (positioned at bottom-right to avoid overlap)
      this.addScoreOverlay(ctx, canvas.width, canvas.height, auditResults.overallScore || 0);
      
      // Save annotated screenshot
      const annotatedPath = screenshotPath.replace('.png', '-annotated.png');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(annotatedPath, buffer);
      
      console.log(`✅ Annotated screenshot saved to: ${annotatedPath}`);
      return annotatedPath;
      
    } catch (error) {
      console.error('❌ Screenshot annotation failed:', error);
      throw error;
    }
  }

  // Extract allowed colors from brand guidelines
  extractAllowedColors(brandGuidelines) {
    if (!brandGuidelines) return new Set();
    
    const allowedColors = new Set();
    const colors = brandGuidelines.colors || {};
    
    // Add primary color
    if (colors.primary?.hex) {
      allowedColors.add(this.normalizeColorToHex(colors.primary.hex));
    }
    
    // Add secondary color
    if (colors.secondary?.hex) {
      allowedColors.add(this.normalizeColorToHex(colors.secondary.hex));
    }
    
    // Add palette colors
    if (Array.isArray(colors.palette)) {
      colors.palette.forEach(color => {
        const normalized = this.normalizeColorToHex(color);
        if (normalized) allowedColors.add(normalized);
      });
    }
    
    // Add neutral colors
    if (Array.isArray(colors.neutral)) {
      colors.neutral.forEach(neutral => {
        if (neutral?.hex) {
          const normalized = this.normalizeColorToHex(neutral.hex);
          if (normalized) allowedColors.add(normalized);
        }
      });
    }
    
    return allowedColors;
  }

  // Normalize color to hex format for comparison
  normalizeColorToHex(color) {
    if (!color) return null;
    
    const colorStr = String(color).trim().toLowerCase();
    
    // Already hex format
    if (colorStr.startsWith('#')) {
      return colorStr.length === 7 ? colorStr : colorStr.length === 4 ? 
        `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}` : colorStr;
    }
    
    // RGB format
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    // RGBA format (ignore alpha)
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    return null;
  }

  // Check if a color is compliant with brand guidelines
  isColorCompliant(elementColor, allowedColors) {
    if (!elementColor || allowedColors.size === 0) return true; // If no guidelines, assume compliant
    
    const normalized = this.normalizeColorToHex(elementColor);
    if (!normalized) return true; // Can't normalize, assume compliant
    
    // Check if color matches any allowed color
    return allowedColors.has(normalized);
  }

  annotateIssue(ctx, issue, index, elementPositions, allowedColors = new Set()) {
    // Resolve category robustly; map aliases like 'color' -> 'colors'
    const category = this.resolveCategory(issue);
    const issueConfig = this.issueTypes[category] || this.issueTypes.layout;
    
    // Find relevant elements for this issue
    const relevantElements = this.findRelevantElements({ ...issue, category }, elementPositions, allowedColors);
    
    // Draw ONLY element outlines. Do not draw badges, labels, or general boxes.
    if (relevantElements.length > 0) {
      relevantElements.forEach(element => {
        this.drawElementHighlight(ctx, element, issueConfig.color, index + 1);
      });
    }
  }

  // Normalize and robustly resolve an issue category
  resolveCategory(issue) {
    const direct = (issue?.category || issue?.Category || '').toString().toLowerCase().trim();
    const type = (issue?.type || issue?.Type || '').toString().toLowerCase();
    const group = (issue?.group || issue?.Group || '').toString().toLowerCase();
    const tags = Array.isArray(issue?.tags) ? issue.tags.map(t => String(t).toLowerCase()) : [];

    const candidates = [direct, type, group, ...tags];

    // Map common aliases to our canonical keys
    const normalize = (val) => {
      if (!val) return '';
      if (val === 'color' || val.includes('color')) return 'colors';
      if (val.startsWith('typography') || val.includes('font') || val === 'text') return 'typography';
      if (val.includes('logo')) return 'logo';
      if (val.includes('spacing') || val.includes('margin') || val.includes('padding')) return 'spacing';
      if (val.includes('layout') || val.includes('grid')) return 'layout';
      return '';
    };

    for (const c of candidates) {
      const norm = normalize(c);
      if (norm && this.issueTypes[norm]) return norm;
    }

    // Fallback to text-based inference
    return this.determineIssueCategory(issue);
  }

  // Try to infer the category based on message/type text when not provided
  determineIssueCategory(issue) {
    const text = (issue?.message || issue?.description || '').toLowerCase();
    const type = (issue?.type || '').toLowerCase();
    if (
      text.includes('color') || text.includes('palette') || text.includes('hex') ||
      type.includes('color') || type.includes('palette')
    ) {
      return 'colors';
    }
    if (
      text.includes('font') || text.includes('typography') || text.includes('heading') || text.includes('text') ||
      type.includes('font') || type.includes('typography')
    ) {
      return 'typography';
    }
    if (
      text.includes('logo') || type.includes('logo')
    ) {
      return 'logo';
    }
    if (
      text.includes('spacing') || text.includes('margin') || text.includes('padding') ||
      type.includes('spacing')
    ) {
      return 'spacing';
    }
    return 'layout';
  }

  findRelevantElements(issue, elementPositions, allowedColors = new Set()) {
    if (!elementPositions || elementPositions.length === 0) {
      return [];
    }

    switch (issue.category) {
      case 'colors':
        return elementPositions.filter(el => {
          if (!el.styles || !el.position) return false;
          
          // Check if element has colors that are non-compliant
          const textColor = el.styles.color;
          const bgColor = el.styles.backgroundColor;
          
          // Check text color (skip if no text color specified)
          const hasTextColor = textColor && textColor !== 'transparent' && textColor !== '';
          const textColorCompliant = !hasTextColor || this.isColorCompliant(textColor, allowedColors);
          
          // Check background color (ignore transparent/empty backgrounds)
          const isTransparentBg = !bgColor || bgColor === 'transparent' || 
                                  bgColor === 'rgba(0, 0, 0, 0)' || 
                                  bgColor === '' ||
                                  bgColor === 'rgba(255, 255, 255, 0)';
          const hasBgColor = bgColor && !isTransparentBg;
          const bgColorCompliant = !hasBgColor || this.isColorCompliant(bgColor, allowedColors);
          
          // Only highlight if either color is non-compliant and actually present
          return (hasTextColor && !textColorCompliant) || (hasBgColor && !bgColorCompliant);
        });
      
      case 'typography':
        return elementPositions.filter(el => 
          el.styles && el.styles.fontFamily && this.isTextElement(el)
        );
      
      case 'logo':
        return elementPositions.filter(el => {
          const classes = (el.classes || '').toLowerCase();
          const id = (el.id || '').toLowerCase();
          return el.tag === 'img' || classes.includes('logo') || id.includes('logo');
        });
      
      case 'layout':
        return elementPositions.filter(el => 
          el.tag === 'header' || el.tag === 'footer' || el.tag === 'nav'
        );
      
      default:
        // Generic matching based on issue message
        return elementPositions.filter(el => 
          this.elementMatchesIssue(el, issue)
        );
    }
  }

  isTextElement(element) {
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(element.tag);
  }

  elementMatchesIssue(element, issue) {
    const issueText = issue.message?.toLowerCase() || '';
    const elementText = element.text?.toLowerCase() || '';
    const elementClasses = element.classes?.toLowerCase() || '';
    
    return issueText.includes(elementText) || 
           elementClasses.includes(issueText) ||
           issueText.includes(element.tag);
  }

  drawElementHighlight(ctx, element, color, issueNumber) {
    // Handle both nested and direct position structures
    const position = element.position || element;
    const { x = 0, y = 0, width = 0, height = 0 } = position;
    
    // Skip if position is invalid
    if (!width || !height || width < 5 || height < 5) {
      return;
    }
    
    // Draw highlight rectangle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    
    // Draw corner markers
    const markerSize = 8;
    ctx.fillStyle = color;
    
    // Top-left
    ctx.fillRect(x - markerSize/2, y - markerSize/2, markerSize, markerSize);
    // Top-right
    ctx.fillRect(x + width - markerSize/2, y - markerSize/2, markerSize, markerSize);
    // Bottom-left
    ctx.fillRect(x - markerSize/2, y + height - markerSize/2, markerSize, markerSize);
    // Bottom-right
    ctx.fillRect(x + width - markerSize/2, y + height - markerSize/2, markerSize, markerSize);
  }

  addLegend(ctx, canvasWidth, canvasHeight) {
    // Fixed position at top-left (always visible regardless of scroll)
    const legendX = 20;
    const legendY = 20; // Fixed at top instead of bottom
    
    // Calculate legend height based on number of issue types
    const legendItemHeight = 20;
    const titleHeight = 30;
    const padding = 20;
    const itemCount = Object.keys(this.issueTypes).length;
    const legendHeight = titleHeight + (itemCount * legendItemHeight) + padding;
    
    // Legend background with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(legendX, legendY, 220, legendHeight);
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY, 220, legendHeight);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Legend title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Audit Issues Legend', legendX + 12, legendY + 22);
    
    // Issue type items
    let yOffset = legendY + titleHeight + 8;
    Object.entries(this.issueTypes).forEach(([type, config]) => {
      // Color indicator (square with border)
      ctx.fillStyle = config.color;
      ctx.fillRect(legendX + 12, yOffset - 8, 14, 14);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX + 12, yOffset - 8, 14, 14);
      
      // Label
      ctx.fillStyle = '#333333';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(config.label, legendX + 32, yOffset);
      
      yOffset += legendItemHeight;
    });
  }

  addScoreOverlay(ctx, canvasWidth, canvasHeight, overallScore) {
    const scoreColor = this.getScoreColor(overallScore);
    const scoreText = `Overall Compliance: ${Math.round(overallScore * 100)}%`;
    
    // Calculate position - place at bottom-right to avoid overlapping with screenshot content
    const scoreWidth = 240;
    const scoreHeight = 70;
    const scoreX = canvasWidth - scoreWidth - 20; // 20px from right edge
    const scoreY = canvasHeight - scoreHeight - 20; // 20px from bottom edge
    
    // Score background with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(scoreX, scoreY, scoreWidth, scoreHeight);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(scoreX, scoreY, scoreWidth, scoreHeight);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Score text
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, scoreX + scoreWidth / 2, scoreY + 28);
    
    // Score bar
    const barWidth = 200;
    const barHeight = 14;
    const barX = scoreX + 20;
    const barY = scoreY + 42;
    
    // Background bar with rounded ends
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress bar with rounded ends
    ctx.fillStyle = scoreColor;
    ctx.fillRect(barX, barY, barWidth * overallScore, barHeight);
  }

  getSeverityColor(severity) {
    const colors = {
      high: '#FF6B6B',
      medium: '#FFA726',
      low: '#42A5F5'
    };
    return colors[severity] || '#666666';
  }

  getScoreColor(score) {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FFA726';
    return '#FF6B6B';
  }
}
