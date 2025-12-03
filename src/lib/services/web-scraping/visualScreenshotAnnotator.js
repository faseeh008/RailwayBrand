// @ts-nocheck
// Commented out to avoid bundling in Vercel serverless functions (exceeds 250MB limit)
// Uncomment if deploying to a platform that supports larger bundles (e.g., Railway, Render)
// import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export class VisualScreenshotAnnotator {
  constructor() {
    this.issueTypes = {
      typography: { color: '#FF6B6B', label: 'Typography Issue' },
      logo: { color: '#4ECDC4', label: 'Logo Issue' },
      colors: { color: '#45B7D1', label: 'Color Issue' },
      layout: { color: '#96CEB4', label: 'Layout Issue' },
      spacing: { color: '#FFA726', label: 'Spacing Issue' }
    };
  }

  async createTargetedAnnotations(screenshotPath, auditResults, elementPositions) {
    console.log('🎯 Creating VISUAL annotations (highlights only)...');
    
    const image = await loadImage(screenshotPath);
    
    // Expand canvas with margins for legend
    const marginTop = 120;
    const marginBottom = 40;
    const canvas = createCanvas(image.width, image.height + marginTop + marginBottom);
    const ctx = canvas.getContext('2d');
    
    // White background + draw screenshot shifted down
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, marginTop);
    
    // Check if element positions exist and are valid
    if (!elementPositions || elementPositions.length === 0) {
      console.warn('⚠️ No element positions provided - skipping highlights');
      this.addTargetedLegend(ctx, 20, 20, {}, []);
      this.addScoreOverlay(ctx, canvas.width - 300, 20, auditResults.overallScore);
      
      const annotatedPath = screenshotPath.replace('.png', '-targeted.png');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(annotatedPath, buffer);
      return annotatedPath;
    }
    
    // Process issues
    const issues = auditResults.issues || [];
    const { highlightableIssues, nonHighlightableIssues } = this.filterHighlightableIssues(issues, elementPositions);
    const groupedIssues = this.groupIssuesByCategory(highlightableIssues);
    
    console.log(`📊 Found ${highlightableIssues.length} highlightable issues and ${nonHighlightableIssues.length} non-highlightable issues`);
    
    // VISUAL HIGHLIGHTS ONLY - no interactive elements
    let issueCounter = 1;
    Object.keys(groupedIssues).forEach(category => {
      const categoryIssues = groupedIssues[category];
      if (categoryIssues.length > 0) {
        issueCounter = this.visualHighlightCategoryIssues(
          ctx, 
          category, 
          categoryIssues, 
          elementPositions, 
          issueCounter, 
          marginTop, 
          image.width, 
          image.height
        );
      }
    });
    
    // Add legend and score
    this.addTargetedLegend(ctx, 20, 20, groupedIssues, nonHighlightableIssues);
    this.addScoreOverlay(ctx, canvas.width - 300, 20, auditResults.overallScore);
    
    const annotatedPath = screenshotPath.replace('.png', '-targeted.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(annotatedPath, buffer);
    
    console.log(`✅ Visual annotations created: ${annotatedPath}`);
    return annotatedPath;
  }

  filterHighlightableIssues(issues, elementPositions) {
    const highlightableIssues = [];
    const nonHighlightableIssues = [];

    issues.forEach(issue => {
      const category = this.determineIssueCategory(issue);
      const relevantElements = this.findElementsForIssue(issue, elementPositions, category);

      if (relevantElements.length > 0) {
        highlightableIssues.push({
          ...issue,
          _category: category,
          _elements: relevantElements
        });
      } else {
        nonHighlightableIssues.push({
          ...issue,
          _category: category,
          _reason: 'No relevant elements found'
        });
      }
    });

    return { highlightableIssues, nonHighlightableIssues };
  }

  determineIssueCategory(issue) {
    const issueText = (issue.message || issue.description || '').toLowerCase();
    const issueType = (issue.type || '').toLowerCase();

    if (issueText.includes('font') || issueText.includes('typography') ||
        issueText.includes('text') || issueText.includes('heading') ||
        issueType.includes('font') || issueType.includes('typography')) {
      return 'typography';
    }

    if ((issueText.includes('logo') && !issueText.includes('color')) ||
        (issueText.includes('brand') && issueText.includes('logo')) ||
        issueType.includes('logo_missing') || issueType.includes('logo_not_detected')) {
      return 'logo';
    }

    if ((issueText.includes('color') && !issueText.includes('logo')) ||
        issueText.includes('palette') || issueText.includes('secondary color') ||
        issueText.includes('brand color') || issueText.includes('official color') ||
        issueType.includes('color') || issueType.includes('palette')) {
      return 'colors';
    }

    if (issueText.includes('spacing') || issueText.includes('margin') ||
        issueText.includes('padding') || issueType.includes('spacing')) {
      return 'spacing';
    }

    return 'layout';
  }

  findElementsForIssue(issue, elementPositions, category) {
    let relevantElements = [];

    switch (category) {
      case 'typography':
        relevantElements = this.findTypographyElements(issue, elementPositions);
        break;
      case 'logo':
        relevantElements = this.findLogoElements(issue, elementPositions);
        break;
      case 'colors':
        relevantElements = this.findColorElements(issue, elementPositions);
        break;
      case 'spacing':
        relevantElements = this.findSpacingElements(issue, elementPositions);
        break;
      default:
        relevantElements = this.findGenericElements(issue, elementPositions);
    }

    return this.removeDuplicateElements(relevantElements);
  }

  findTypographyElements(issue, elements) {
    const textElements = elements.filter(el => {
      if (!el.text || el.text.trim().length === 0) return false;

      const isTextElement = el.tag && (
        el.tag.match(/^h[1-6]$/i) ||
        el.tag === 'p' ||
        el.tag === 'span' ||
        (el.tag === 'div' && el.text.length < 500)
      );

      const hasTextClasses = el.classes && (
        el.classes.toLowerCase().includes('text') ||
        el.classes.toLowerCase().includes('heading') ||
        el.classes.toLowerCase().includes('title') ||
        el.classes.toLowerCase().includes('font')
      );

      return isTextElement || hasTextClasses;
    });

    return this.removeDuplicateElements(textElements);
  }

  findLogoElements(issue, elements) {
    const logoElements = elements.filter(el => {
      if (el.tag === 'img') {
        const hasLogoIndicators = (
          el.classes?.toLowerCase().includes('logo') ||
          el.id?.toLowerCase().includes('logo') ||
          el.alt?.toLowerCase().includes('logo') ||
          (el.src && el.src.toLowerCase().includes('logo'))
        );
        return hasLogoIndicators;
      }

      if ((el.tag === 'h1' || el.tag === 'div') && el.text) {
        const isShortText = el.text.length <= 3;
        const hasLogoClasses = el.classes?.toLowerCase().includes('logo');
        const isInHeader = this.isElementInHeader(el, elements);

        return isShortText && (hasLogoClasses || isInHeader);
      }

      return false;
    });

    return this.removeDuplicateElements(logoElements);
  }

  findColorElements(issue, elements) {
    const colorElements = elements.filter(el => {
      const isColorElement = (
        el.tag === 'button' ||
        el.classes?.toLowerCase().includes('button') ||
        el.classes?.toLowerCase().includes('btn') ||
        (el.tag === 'nav' && el.position.width > 200) ||
        el.tag === 'header' ||
        el.tag === 'footer' ||
        (el.classes && (
          el.classes.toLowerCase().includes('primary') ||
          el.classes.toLowerCase().includes('secondary') ||
          el.classes.toLowerCase().includes('accent') ||
          el.classes.toLowerCase().includes('brand')
        ))
      );

      return isColorElement;
    });

    return this.removeDuplicateElements(colorElements);
  }

  findSpacingElements(issue, elements) {
    const spacingElements = elements.filter(el => {
      const isLayoutElement = (
        el.tag === 'div' ||
        el.tag === 'section' ||
        el.tag === 'article' ||
        el.classes?.toLowerCase().includes('container') ||
        el.classes?.toLowerCase().includes('wrapper') ||
        el.classes?.toLowerCase().includes('grid')
      );

      return isLayoutElement && el.position.width > 100;
    });

    return this.removeDuplicateElements(spacingElements);
  }

  findGenericElements(issue, elements) {
    return elements.filter(el => {
      const issueText = (issue.message || issue.description || '').toLowerCase();
      const elementText = el.text?.toLowerCase() || '';
      const elementClasses = el.classes?.toLowerCase() || '';

      return issueText.includes(elementText) ||
             elementClasses.includes(issueText) ||
             issueText.includes(el.tag);
    });
  }

  isElementInHeader(element, allElements) {
    return element.position.y < 200;
  }

  groupIssuesByCategory(issues) {
    const grouped = {
      typography: [],
      logo: [],
      colors: [],
      layout: [],
      spacing: []
    };

    issues.forEach(issue => {
      const category = issue._category || this.determineIssueCategory(issue);
      if (grouped[category]) {
        grouped[category].push(issue);
      } else {
        grouped.layout.push(issue);
      }
    });

    return grouped;
  }

  visualHighlightCategoryIssues(ctx, category, issues, elementPositions, startCounter, screenshotWidth = 1920, screenshotHeight = 1080) {
    let issueCounter = startCounter;
    const issueConfig = this.issueTypes[category] || this.issueTypes.layout;

    // Calculate scaling factors if needed
    const needsScaling = elementPositions.length > 0 && elementPositions[0].position;
    const viewportWidth = needsScaling ? Math.max(...elementPositions.map(el => el.position.x + el.position.width)) : screenshotWidth;
    const viewportHeight = needsScaling ? Math.max(...elementPositions.map(el => el.position.y + el.position.height)) : screenshotHeight;

    const scaleX = screenshotWidth / viewportWidth;
    const scaleY = screenshotHeight / viewportHeight;

    issues.forEach(issue => {
      const relevantElements = issue._elements || [];

      if (relevantElements.length > 0) {
        relevantElements.forEach(element => {
          this.drawVisualHighlight(ctx, element, issueConfig.color, issueCounter, scaleX, scaleY);
        });
        issueCounter++;
      }
    });

    return issueCounter;
  }

  drawVisualHighlight(ctx, element, color, issueNumber, scaleX = 1, scaleY = 1) {
    const { x, y, width, height } = element.position;

    // Scale coordinates to match screenshot dimensions
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;

    // Draw visual highlight rectangle (STATIC - not clickable)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(scaledX - 1, scaledY - 1, scaledWidth + 2, scaledHeight + 2);
    ctx.setLineDash([]);

    // Draw issue number badge (STATIC - not interactive)
    this.drawStaticBadge(ctx, scaledX, scaledY, issueNumber, color);
  }

  drawStaticBadge(ctx, x, y, issueNumber, color) {
    const badgeSize = 24;
    const badgeX = x - badgeSize - 5;
    const badgeY = y - 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(issueNumber.toString(), badgeX + badgeSize/2, badgeY + badgeSize/2);
  }

  addTargetedLegend(ctx, legendX, legendY, groupedIssues, nonHighlightableIssues = []) {
    const issueCounts = {};
    Object.keys(groupedIssues).forEach(category => {
      issueCounts[category] = groupedIssues[category].length;
    });
    
    const totalHighlightable = Object.values(issueCounts).reduce((a, b) => a + b, 0);
    
    // Calculate legend height based on content
    const categoriesWithIssues = Object.keys(this.issueTypes).filter(cat => issueCounts[cat] > 0).length;
    const legendHeight = 80 + (categoriesWithIssues * 20) + (nonHighlightableIssues.length > 0 ? 25 : 0);
    
    // Legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.fillRect(legendX, legendY, 280, legendHeight);
    ctx.strokeRect(legendX, legendY, 280, legendHeight);
    
    // Legend title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Audit Issues Breakdown', legendX + 15, legendY + 25);
    
    // Highlightable issues count
    ctx.font = '12px Arial';
    ctx.fillText(`Visual Highlights: ${totalHighlightable} issues`, legendX + 15, legendY + 45);
    
    // Issue categories with counts
    let yOffset = legendY + 65;
    Object.entries(this.issueTypes).forEach(([category, config]) => {
      const count = issueCounts[category] || 0;
      if (count > 0) {
        // Color indicator
        ctx.fillStyle = config.color;
        ctx.fillRect(legendX + 15, yOffset - 6, 10, 10);
        
        // Category label with count
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.fillText(`${config.label} (${count})`, legendX + 35, yOffset);
        
        yOffset += 20;
      }
    });
    
    // Non-highlightable issues note
    if (nonHighlightableIssues.length > 0) {
      ctx.fillStyle = '#666666';
      ctx.font = 'italic 11px Arial';
      ctx.fillText(`+ ${nonHighlightableIssues.length} additional issues in report`, legendX + 15, yOffset + 10);
    }
  }

  removeDuplicateElements(elements) {
    const uniqueElements = [];
    const seenPositions = new Set();
    elements.forEach(element => {
      const positionKey = `${element.position.x},${element.position.y},${element.position.width},${element.position.height}`;
      if (!seenPositions.has(positionKey)) {
        seenPositions.add(positionKey);
        uniqueElements.push(element);
      }
    });
    return uniqueElements;
  }

  getScoreColor(score) {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FFA726';
    return '#FF6B6B';
  }
}

export default VisualScreenshotAnnotator;


