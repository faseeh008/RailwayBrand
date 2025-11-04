// @ts-nocheck

export function generateFixPrompt(
  auditResults,
  brandGuidelines,
  codeSnippet = '',
  options = {},
  scrapedData = null,
  elementPositions = []
) {
  const brandName = brandGuidelines?.brandName || brandGuidelines?.companyName || brandGuidelines?.name || 'Brand';

  // Detect tech stack from scraped data
  const detectTechStack = () => {
    const tech = [];
    const s = scrapedData || {};
    
    // Check for framework indicators in classes/IDs
    const allClasses = (s.elements || [])
      .map(el => el.classes || '')
      .join(' ')
      .toLowerCase();
    
    if (allClasses.includes('react') || allClasses.includes('jsx')) tech.push('React');
    if (allClasses.includes('vue')) tech.push('Vue');
    if (allClasses.includes('svelte')) tech.push('Svelte');
    if (allClasses.includes('angular')) tech.push('Angular');
    if (allClasses.includes('tailwind') || allClasses.includes('tw-')) tech.push('Tailwind CSS');
    if (allClasses.includes('bootstrap')) tech.push('Bootstrap');
    if (allClasses.includes('material') || allClasses.includes('mdc-')) tech.push('Material UI');
    
    // Check for CSS variables (common in modern frameworks)
    if (s.colors && s.colors.some(c => c.includes('var(--'))) {
      tech.push('CSS Variables');
    }
    
    // Check metadata
    if (s.metadata?.description) {
      const meta = s.metadata.description.toLowerCase();
      if (meta.includes('react') || meta.includes('next.js')) tech.push('React/Next.js');
      if (meta.includes('vue') || meta.includes('nuxt')) tech.push('Vue/Nuxt');
    }
    
    return [...new Set(tech)]; // Remove duplicates
  };

  // Clean color name - remove noise like "X Black X White HEX" etc.
  const cleanColorName = (name) => {
    if (!name) return null;
    let cleaned = String(name);
    
    // Remove common noise patterns in order
    cleaned = cleaned
      .replace(/HEX\s*\([^)]+\)/gi, '') // Remove "HEX (#000000)"
      .replace(/RGB\s+\d+\s+\d+\s+\d+/gi, '') // Remove "RGB 0 0 0"
      .replace(/CMYK\s*\d+\s*\d+\s*\d+\s*\d+/gi, '') // Remove CMYK values
      .replace(/Pantone\s+[A-Z0-9\s]+/gi, '') // Remove Pantone references
      .replace(/X\s+Black\s+X\s+White/gi, 'Black, White') // Handle "X Black X White"
      .replace(/X\s+([A-Za-z]+)\s+X/gi, '$1') // Remove "X ColorName X" pattern
      .replace(/X\s+/gi, '') // Remove remaining "X " prefixes
      .replace(/\s+X$/gi, '') // Remove trailing " X"
      .replace(/#[0-9A-Fa-f]{6}/g, '') // Remove hex codes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract meaningful color names from patterns like "Black White" or single colors
    const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'gray', 'grey', 'brown', 'pink'];
    const words = cleaned.toLowerCase().split(/\s+/);
    const foundColors = words.filter(w => colorKeywords.includes(w));
    
    if (foundColors.length > 0) {
      // Capitalize first letter of each color word
      cleaned = foundColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    } else {
      // If no color keywords found, try to extract meaningful text
      const meaningfulWords = words.filter(w => w.length > 2 && !/^[\d\s#()-]+$/.test(w));
      if (meaningfulWords.length > 0) {
        cleaned = meaningfulWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    
    // If cleaned name is just noise, return null
    if (!cleaned || cleaned.length < 2 || /^[\d\s#()-]+$/.test(cleaned)) {
      return null;
    }
    
    return cleaned;
  };

  // Clean and format color values - remove duplicates and noise
  const formatColors = () => {
    const g = brandGuidelines?.colors || {};
    const lines = [];
    
    // Collect all unique hex values first
    const allHexValues = new Set();
    if (g.primary?.hex) allHexValues.add(g.primary.hex);
    if (g.secondary?.hex) allHexValues.add(g.secondary.hex);
    if (Array.isArray(g.palette)) g.palette.forEach(hex => hex && allHexValues.add(hex));
    if (Array.isArray(g.neutral)) {
      g.neutral.forEach(n => {
        if (n?.hex) allHexValues.add(n.hex);
      });
    }
    
    // Format primary color
    if (g.primary) {
      const primaryHex = g.primary.hex || (Array.from(allHexValues)[0]);
      const cleanName = cleanColorName(g.primary.name);
      const displayName = cleanName || primaryHex || 'Primary';
      lines.push(`Primary: ${displayName}${primaryHex && displayName !== primaryHex ? ` (${primaryHex})` : ''}`);
      if (g.primary.usage) lines[lines.length - 1] += ` — ${g.primary.usage}`;
    }
    
    // Format secondary color
    if (g.secondary) {
      const secondaryHex = g.secondary.hex;
      if (secondaryHex) {
        const cleanName = cleanColorName(g.secondary.name);
        const displayName = cleanName || secondaryHex || 'Secondary';
        lines.push(`Secondary: ${displayName}${displayName !== secondaryHex ? ` (${secondaryHex})` : ''}`);
        if (g.secondary.usage) lines[lines.length - 1] += ` — ${g.secondary.usage}`;
      }
    }
    
    // Format palette (deduplicated)
    if (allHexValues.size > 0) {
      const uniquePalette = Array.from(allHexValues);
      lines.push(`Allowed Palette: ${uniquePalette.join(', ')}`);
    }
    
    // Format neutrals - deduplicate by hex and clean names
    if (Array.isArray(g.neutral) && g.neutral.length > 0) {
      const uniqueNeutrals = [];
      const seenHex = new Set();
      
      g.neutral.forEach(neutral => {
        if (neutral?.hex && !seenHex.has(neutral.hex)) {
          seenHex.add(neutral.hex);
          const cleanName = cleanColorName(neutral.name);
          const displayName = cleanName || neutral.hex;
          uniqueNeutrals.push(`${displayName}${displayName !== neutral.hex ? ` (${neutral.hex})` : ''}`);
        }
      });
      
      if (uniqueNeutrals.length > 0) {
        lines.push(`Neutrals: ${uniqueNeutrals.join(', ')}`);
      }
    }
    
    return lines.length > 0 ? lines.join('\n') : 'Not specified';
  };

  // Format typography - clean and concise
  const formatTypography = () => {
    const g = brandGuidelines?.typography || {};
    const lines = [];
    
    if (g.primary?.font) {
      const weights = Array.isArray(g.primary.weights) ? g.primary.weights.join(', ') : 'Regular, Bold';
      lines.push(`Primary Font: "${g.primary.font}"`);
      lines.push(`  Weights: ${weights}`);
      if (g.primary.usage) lines.push(`  Usage: ${g.primary.usage}`);
    }
    
    if (g.secondary?.font) {
      const weights = Array.isArray(g.secondary.weights) ? g.secondary.weights.join(', ') : 'Regular, Bold';
      lines.push(`Secondary Font: "${g.secondary.font}"`);
      lines.push(`  Weights: ${weights}`);
      if (g.secondary.usage) lines.push(`  Usage: ${g.secondary.usage}`);
    }
    
    lines.push('Hierarchy: Headings → primary font | Body → secondary/regular | Buttons → bold weight');
    
    return lines.length > 0 ? lines.join('\n') : 'Not specified';
  };

  // Format logo requirements
  const formatLogo = () => {
    const g = brandGuidelines?.logo || {};
    const lines = [];
    
    if (Array.isArray(g.rules) && g.rules.length > 0) {
      g.rules.slice(0, 4).forEach(rule => {
        lines.push(`- ${rule}`);
      });
    }
    
    if (Array.isArray(g.constraints) && g.constraints.length > 0) {
      lines.push(`Constraints: ${g.constraints.join(' | ')}`);
    }
    
    if (g.clearSpace) {
      lines.push(`Clear Space: ${g.clearSpace}`);
    }
    
    lines.push('Placement: Header/navigation area, prominent position');
    
    return lines.length > 0 ? lines.join('\n') : 'Not specified';
  };

  // Format spacing
  const formatSpacing = () => {
    const g = brandGuidelines?.spacing || {};
    if (!g || Object.keys(g).length === 0) return 'Not specified';
    
    const lines = [];
    if (g.grid) lines.push(`Grid: ${g.grid}`);
    if (g.baseUnit) lines.push(`Base Unit: ${g.baseUnit}`);
    if (g.sectionGap) lines.push(`Section Gap: ${g.sectionGap}`);
    if (g.componentGap) lines.push(`Component Gap: ${g.componentGap}`);
    
    return lines.length > 0 ? lines.join('\n') : 'Not specified';
  };

  // Format audit summary - clean and actionable
  const formatAuditSummary = () => {
    const a = auditResults || {};
    const issues = Array.isArray(a.issues) ? a.issues : [];
    
    const criticalCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;
    
    return {
      overallScore: Math.round((a.overallScore || 0) * 100),
      criticalCount,
      mediumCount,
      lowCount
    };
  };

  // Find relevant elements for an issue
  const findRelevantElements = (issue, maxElements = 3) => {
    if (!elementPositions || !Array.isArray(elementPositions) || elementPositions.length === 0) {
      return [];
    }
    
    const relevant = [];
    const issueCategory = issue.category || 'general';
    const issueText = (issue.message || issue.description || '').toLowerCase();
    
    // Match elements by category and issue type
    elementPositions.slice(0, 20).forEach(el => {
      let isRelevant = false;
      
      if (issueCategory === 'colors') {
        // Match color-related elements
        isRelevant = el.tag === 'button' || 
                    el.classes?.toLowerCase().includes('btn') ||
                    el.classes?.toLowerCase().includes('primary') ||
                    el.classes?.toLowerCase().includes('secondary');
      } else if (issueCategory === 'typography') {
        // Match text elements
        isRelevant = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a'].includes(el.tag?.toLowerCase());
      } else if (issueCategory === 'logo') {
        // Match logo-related elements
        isRelevant = el.tag === 'img' || 
                    el.classes?.toLowerCase().includes('logo') ||
                    el.id?.toLowerCase().includes('logo');
      }
      
      if (isRelevant && relevant.length < maxElements) {
        relevant.push(el);
      }
    });
    
    return relevant;
  };

  // Format key issues - actionable and concise
  const formatKeyIssues = () => {
    const issues = Array.isArray(auditResults?.issues) ? auditResults.issues : [];
    if (!issues.length) return [];
    
    // Group similar issues to reduce redundancy, but preserve distinct issues
    const issueMap = new Map();
    
    issues.slice(0, 8).forEach(issue => {
      // Use a unique key per issue to preserve individual issues
      const issueId = issue.id || `${issue.category}_${issue.type || 'general'}_${issue.message?.substring(0, 50) || 'issue'}`;
      
      if (!issueMap.has(issueId)) {
        const relevantElements = findRelevantElements(issue, 3);
        
        // Build element summary
        let elementSummaryText = 'multiple elements';
        if (relevantElements.length > 0) {
          const elementList = relevantElements.map(el => {
            const parts = [`<${el.tag || 'element'}>`];
            if (el.text && el.text.trim().length > 0 && el.text.trim().length < 30) {
              parts.push(`"${el.text.trim().substring(0, 30)}${el.text.trim().length > 30 ? '...' : ''}"`);
            }
            if (el.classes) parts.push(`[${el.classes}]`);
            if (el.id) parts.push(`#${el.id}`);
            return parts.join(' ');
          });
          elementSummaryText = elementList.join(', ');
        } else if (issue.element) {
          elementSummaryText = issue.element;
        }
        
        issueMap.set(issueId, {
          category: issue.category || 'general',
          severity: issue.severity || 'medium',
          message: issue.message || issue.description || 'Compliance issue detected',
          recommendation: issue.recommendation || issue.suggestion || 'Follow brand guidelines',
          elementCount: relevantElements.length || (issue.element ? 1 : 0),
          elementSummary: elementSummaryText
        });
      }
    });
    
    return Array.from(issueMap.values());
  };

  // Format project context
  const formatProjectContext = () => {
    const s = scrapedData || {};
    const detectedTech = detectTechStack();
    
    const context = [];
    
    if (detectedTech.length > 0) {
      context.push(`Detected Technologies: ${detectedTech.join(', ')}`);
    } else {
      context.push('Detected Technologies: Standard web (HTML/CSS/JS)');
    }
    
    // Current colors in use (unique only)
    if (Array.isArray(s.colors) && s.colors.length > 0) {
      const uniqueColors = [...new Set(s.colors)].slice(0, 8);
      context.push(`Observed Colors: ${uniqueColors.join(', ')}`);
    }
    
    // Current typography
    if (s.typography) {
      const fontList = [];
      if (s.typography.primary) fontList.push(`Primary: ${s.typography.primary}`);
      if (s.typography.secondary) fontList.push(`Secondary: ${s.typography.secondary}`);
      if (Array.isArray(s.typography.fonts) && s.typography.fonts.length > 0) {
        const uniqueFonts = [...new Set(s.typography.fonts)].slice(0, 5);
        fontList.push(`All: ${uniqueFonts.join(', ')}`);
      }
      if (fontList.length > 0) {
        context.push(`Observed Fonts: ${fontList.join(' | ')}`);
      }
    }
    
    return context.join('\n');
  };

  // Build the prompt
  const auditSummary = formatAuditSummary();
  const keyIssues = formatKeyIssues();
  const projectContext = formatProjectContext();
  const detectedTech = detectTechStack();

  const prompt = `SYSTEM ROLE
You are a brand compliance developer assistant. Your task is to update the provided website or application code (regardless of framework or language) to strictly follow the official brand guidelines.

═══════════════════════════════════════════════════════════════════════════════

BRAND INFORMATION
Brand: ${brandName}

COLOR SYSTEM
${formatColors()}

TYPOGRAPHY SYSTEM
${formatTypography()}

LOGO REQUIREMENTS
${formatLogo()}

SPACING RULES
${formatSpacing()}

═══════════════════════════════════════════════════════════════════════════════

AUDIT SUMMARY
Overall Compliance Score: ${auditSummary.overallScore}%
Critical Issues: ${auditSummary.criticalCount}
Important Issues: ${auditSummary.mediumCount}
Minor Issues: ${auditSummary.lowCount}

KEY ISSUES DETECTED
${keyIssues.length > 0 ? keyIssues.map((issue, i) => {
  return `Issue ${i + 1}: [${issue.severity.toUpperCase()}] ${issue.category}
  └─ Problem: ${issue.message}
  └─ Recommendation: ${issue.recommendation}${issue.elementSummary && issue.elementSummary !== 'multiple elements' && issue.elementCount > 0 ? `
  └─ Affected Elements: ${issue.elementSummary}` : ''}`;
}).join('\n\n') : 'No critical issues detected.'}

═══════════════════════════════════════════════════════════════════════════════

PROJECT CONTEXT
${projectContext || 'No additional context available'}

═══════════════════════════════════════════════════════════════════════════════

IMPLEMENTATION INSTRUCTIONS

Your primary objectives:
1. Analyze the audit report and correct all non-compliant elements according to the brand rules above
2. Apply the required brand fonts, color palette, and logo usage rules consistently across all views or templates
3. Ensure spacing and visual hierarchy match brand specifications
4. Maintain existing structure and logic; only adjust design-related elements
5. Where a rule conflicts, prioritize brand consistency over current styling
6. Use the project's detected language/framework (${detectedTech.length > 0 ? detectedTech.join(', ') : 'HTML/CSS/JS'}) when providing code examples

Required Response Format:

SECTION 1: Summary of Required Changes
- Provide a brief overview of what must be updated (colors, fonts, layout, logo, etc.)

SECTION 2: Implementation Plan
- Provide a step-by-step outline of how to apply each change in the existing codebase

SECTION 3: Example Updates
- Provide illustrative updates in the detected language/framework (${detectedTech.length > 0 ? detectedTech.join(' or ') : 'your project uses'})
- Use pseudocode or framework-specific syntax if appropriate

───────────────────────────────────────────────────────────────────────────────

IMPORTANT NOTES

• Do NOT output generic HTML/CSS unless the project explicitly uses vanilla web technologies
• Focus on transformation rules (e.g., "replace unauthorized colors with brand palette")
• Maintain existing functionality—only update visual/styling elements
• If framework-specific, use appropriate configuration files (e.g., tailwind.config.js, theme.ts, etc.)
• Prioritize practical, actionable code examples over generic templates`;

  return prompt.trim();
}

export default { generateFixPrompt };


