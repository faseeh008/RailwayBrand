// @ts-nocheck

/**
 * SpecificRecommendationGenerator
 * Produces actionable recommendations with concrete CSS/HTML examples
 */
export class SpecificRecommendationGenerator {
  // ------------ Public API ------------
  generateColorRecommendations(colorIssues, brandColors) {
    const recs = [];
    const primaryHex = this.extractHex(brandColors?.primary) || '#000000';
    const secondaryHex = this.extractHex(brandColors?.secondary) || null;

    (colorIssues || []).forEach(issue => {
      switch (issue.type) {
        case 'primary_color_missing':
          recs.push({
            priority: 'high',
            category: 'colors',
            title: `Use primary brand color ${primaryHex}`,
            message: `Apply ${primaryHex} to key UI elements`,
            action: `Add ${primaryHex} to CTAs, important accents, and brand marks`,
            steps: [
              `Set primary buttons background to ${primaryHex}`,
              `Use ${primaryHex} for key accents (borders, focus states)`,
              `Ensure contrast-compliant foreground (e.g., white on dark backgrounds)`
            ],
            cssExample: this.generateColorCSS(primaryHex),
            estimatedTime: '20 minutes',
            expectedResult: `Primary brand color ${primaryHex} appears on CTAs and key accents`
          });
          break;

        case 'non_brand_color_detected': {
          const detected = issue.details?.detectedColors?.map(c => c.hex) || [];
          const replacement = primaryHex;
          recs.push({
            priority: 'medium',
            category: 'colors',
            title: 'Replace non-brand colors with approved palette',
            message: `Swap ${detected.join(', ')} with ${replacement}${secondaryHex ? ` or ${secondaryHex}` : ''}`,
            action: 'Update color tokens and CSS declarations',
            steps: [
              `Find usages of: ${detected.join(', ')}`,
              `Replace with ${replacement}${secondaryHex ? ` or ${secondaryHex}` : ''}`,
              'Retest contrast for text elements'
            ],
            cssExample: this.generateColorReplacementCSS(detected, replacement),
            estimatedTime: '25-40 minutes',
            expectedResult: 'Only approved brand colors are used across UI'
          });
          break; }

        case 'secondary_color_missing':
          if (secondaryHex) {
            recs.push({
              priority: 'low',
              category: 'colors',
              title: `Introduce secondary brand color ${secondaryHex}`,
              message: 'Use secondary color for visual hierarchy and accents',
              action: `Apply ${secondaryHex} to secondary buttons, borders, or subtle backgrounds`,
              steps: [
                `Style secondary buttons with ${secondaryHex}`,
                `Use ${secondaryHex} for divider borders or tags`
              ],
              cssExample: this.generateSecondaryColorCSS(secondaryHex),
              estimatedTime: '15-20 minutes',
              expectedResult: `Secondary brand color ${secondaryHex} appears in supporting roles`
            });
          }
          break;
      }
    });

    return recs;
  }

  generateTypographyRecommendations(fontIssues, brandTypography) {
    const recs = [];
    const primaryFont = brandTypography?.primary?.font || brandTypography?.primaryFont || 'Arial';
    const brandWeights = [
      ...(Array.isArray(brandTypography?.primary?.weights) ? brandTypography.primary.weights : []),
      ...(Array.isArray(brandTypography?.secondary?.weights) ? brandTypography.secondary.weights : []),
      ...(Array.isArray(brandTypography?.weights) ? brandTypography.weights : [])
    ];

    (fontIssues || []).forEach(issue => {
      switch (issue.type) {
        case 'no_fonts_detected':
          recs.push({
            priority: 'high',
            category: 'typography',
            title: `Implement ${primaryFont} web font`,
            message: 'Add font files or use a CDN and apply globally',
            action: `Load ${primaryFont} and update font-family`,
            steps: [
              `Load ${primaryFont} via @font-face or a font CDN`,
              'Apply global font-family to text elements',
              'Verify FOUT/FOIT and fallbacks'
            ],
            cssExample: this.generateFontImplementationCSS(primaryFont),
            estimatedTime: '25-35 minutes',
            expectedResult: `${primaryFont} used across headings and body`
          });
          break;

        case 'primary_font_mismatch':
          recs.push({
            priority: 'high',
            category: 'typography',
            title: `Change primary font to ${primaryFont}`,
            message: `Detected different primary font; switch to ${primaryFont}`,
            action: 'Update global and heading selectors',
            steps: [
              `Replace current primary font with "${primaryFont}"`,
              'Update heading/body selectors to ensure inheritance'
            ],
            cssExample: this.generateFontReplacementCSS(primaryFont, brandWeights),
            estimatedTime: '20-30 minutes',
            expectedResult: `Headings and body render with ${primaryFont}`
          });
          break;

        case 'font_weights_missing': {
          const missing = issue.details?.missingWeights || [];
          if (missing.length > 0) {
            recs.push({
              priority: 'low',
              category: 'typography',
              title: 'Add missing font weights',
              message: `Configure ${missing.join(', ')}`,
              action: 'Include additional font-face sources and apply via CSS',
              steps: missing.map(w => `Ensure font-weight: ${w} is available and used where appropriate`),
              cssExample: this.generateFontWeightCSS(missing),
              estimatedTime: '15-25 minutes',
              expectedResult: 'Improved hierarchy with proper weights'
            });
          }
          break; }
      }
    });

    return recs;
  }

  generateLogoRecommendations(logoIssues, brandLogo) {
    const recs = [];
    (logoIssues || []).forEach(issue => {
      if (issue.type === 'logo_missing') {
        recs.push({
          priority: 'high',
          category: 'logo',
          title: 'Add official brand logo to header',
          message: 'Place the logo in the header for brand recognition',
          action: 'Insert HTML and CSS for logo placement',
          steps: [
            'Upload SVG/PNG logo asset',
            'Insert HTML in header linking to homepage',
            'Apply CSS for sizing and responsiveness'
          ],
          htmlExample: this.generateLogoHTML(brandLogo),
          cssExample: this.generateLogoCSS(),
          estimatedTime: '15 minutes',
          expectedResult: 'Visible, accessible logo in site header'
        });
      }
    });
    return recs;
  }

  // ------------ CSS/HTML Helpers ------------
  generateColorCSS(primaryHex) {
    return `/* Primary brand color usage (scoped to key elements) */\n.primary-button, .cta-button {\n  background-color: ${primaryHex};\n  color: #FFFFFF;\n}\n\n.brand-accent, .focus-ring {\n  border-color: ${primaryHex};\n}\n\n.brand-link {\n  color: ${primaryHex};\n}`;
  }

  generateColorReplacementCSS(detectedColors, replacementHex) {
    const sample = (detectedColors || []).slice(0, 2);
    return `/* Replace non-brand colors with approved brand color */\n/* Before */\n.element { color: ${sample[0] || '#AAAAAA'}; }\n/* After */\n.element { color: ${replacementHex}; }`;
  }

  generateSecondaryColorCSS(secondaryHex) {
    return `.button-secondary {\n  background-color: transparent;\n  border: 1px solid ${secondaryHex};\n  color: ${secondaryHex};\n}\n.tag, .badge-outline {\n  border-color: ${secondaryHex};\n}`;
  }

  generateFontImplementationCSS(fontName) {
    const safe = (fontName || 'BrandFont').replace(/"/g, '\\"');
    return `/* Load font (example using Google Fonts link or self-hosted @font-face) */\n/* HTML <head>: */\n<!-- <link href=\"https://fonts.googleapis.com/css2?family=${safe.replace(/\s+/g, '+')}:wght@400;500;700&display=swap\" rel=\"stylesheet\"> -->\n\n/* Global font-family */\nbody, h1, h2, h3, h4, h5, h6, p, a, button, input, textarea {\n  font-family: \"${safe}\", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n}`;
  }

  generateFontReplacementCSS(fontName, weights = []) {
    const safe = (fontName || 'BrandFont').replace(/"/g, '\\"');
    return `/* Replace primary font with ${safe} */\n:root {\n  --brand-font: \"${safe}\";\n}\nbody, h1, h2, h3, h4, h5, h6, p {\n  font-family: var(--brand-font), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n}\n/* Ensure weights available: ${weights.join(', ') || '400, 500, 700'} */`;
  }

  generateFontWeightCSS(missingWeights) {
    const rules = (missingWeights || []).map(w => `.weight-${w} {\n  font-weight: ${w};\n}`).join('\n');
    return rules || '/* No missing weights */';
  }

  generateLogoHTML(brandLogo) {
    const brandName = brandLogo?.brandName || 'Brand';
    return `<!-- Header logo -->\n<a href=\"/\" class=\"brand-logo\" aria-label=\"${brandName} Home\">\n  <img src=\"/assets/brand-logo.svg\" alt=\"${brandName} Logo\" width=\"140\" height=\"40\" />\n</a>`;
  }

  generateLogoCSS() {
    return `.brand-logo {\n  display: inline-flex;\n  align-items: center;\n  height: 40px;\n}\n.brand-logo img {\n  height: 100%;\n  width: auto;\n}`;
  }

  // ------------ utilities ------------
  extractHex(input) {
    if (!input) return null;
    if (typeof input === 'string') return this.normalizeHex(input);
    if (typeof input === 'object' && input.hex) return this.normalizeHex(input.hex);
    return null;
  }

  normalizeHex(hex) {
    if (!hex || typeof hex !== 'string') return null;
    const c = hex.trim();
    if (c.startsWith('#')) return c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toUpperCase() : c.toUpperCase();
    return null;
  }
}

export default SpecificRecommendationGenerator;





