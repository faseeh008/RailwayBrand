// @ts-nocheck
import { json } from '@sveltejs/kit';
import { VisualAuditScraper } from '$lib/services/web-scraping/visualAuditScraper.js';
import { ScreenshotAnnotator } from '$lib/services/web-scraping/screenshotAnnotator.js';
import { enhancedComplianceAnalyzer } from '$lib/services/audit/enhancedComplianceAnalyzer.js';
import { SolutionLLMProcessor } from '$lib/services/audit/solutionLLMProcessor.js';
import { PdfsBrandGuidelineRepository } from '$lib/repositories/pdfsBrandGuidelineRepository.js';
import { ScrapedDataRepository } from '$lib/repositories/scrapedDataRepository.js';
import { AnalysisRepository } from '$lib/repositories/analysisRepository.js';
import { generateFixPrompt } from '$lib/services/prompt/promptBuilder.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract colors from HTML content using regex
 */
function extractColorsFromHTML(html) {
  const colors = new Set();
  
  // Match hex colors (#RGB, #RRGGBB, #RRGGBBAA)
  const hexMatches = html.matchAll(/#([0-9A-Fa-f]{3,8})\b/g);
  for (const match of hexMatches) {
    colors.add(`#${match[1]}`);
  }
  
  // Match rgb/rgba colors
  const rgbMatches = html.matchAll(/rgba?\([^)]+\)/g);
  for (const match of rgbMatches) {
    colors.add(match[0]);
  }
  
  // Match named colors (basic CSS color names)
  const namedColors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey'];
  const htmlLower = html.toLowerCase();
  for (const color of namedColors) {
    if (htmlLower.includes(color)) {
      colors.add(color);
    }
  }
  
  return Array.from(colors);
}

/**
 * Extract fonts from HTML content
 */
function extractFontsFromHTML(html) {
  const fonts = new Set();
  
  // Match font-family declarations
  const fontFamilyMatches = html.matchAll(/font-family\s*:\s*([^;}'"]+)/gi);
  for (const match of fontFamilyMatches) {
    const fontFamilies = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
    fontFamilies.forEach(f => fonts.add(f));
  }
  
  // Match <font> tags with face attribute
  const fontTagMatches = html.matchAll(/<font[^>]*face=["']([^"']+)["']/gi);
  for (const match of fontTagMatches) {
    fonts.add(match[1]);
  }
  
  return Array.from(fonts);
}

/**
 * Extract typography information from HTML
 */
function extractTypographyFromHTML(html) {
  const fonts = extractFontsFromHTML(html);
  
  return {
    primary: fonts[0] || null,
    secondary: fonts[1] || null,
    weights: [],
    sizes: []
  };
}

/**
 * Extract basic element positions from HTML (without browser)
 * This provides approximate positions based on DOM structure
 */
function extractElementPositionsFromHTML(html) {
  const elements = [];
  
  // Basic regex to find common elements
  const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'img', 'a', 'nav', 'header', 'footer', 'div'];
  let yPosition = 100; // Starting Y position
  
  tags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>|<${tag}[^>]*/?>`, 'gi');
    let match;
    let count = 0;
    
    while ((match = regex.exec(html)) !== null && count < 50) { // Limit to avoid too many elements
      count++;
      const fullMatch = match[0];
      const textContent = match[1] || '';
      
      // Extract classes and id
      const classMatch = fullMatch.match(/class=["']([^"']+)["']/);
      const idMatch = fullMatch.match(/id=["']([^"']+)["']/);
      
      // Estimate dimensions based on tag type
      let width = 800;
      let height = 40;
      
      if (tag.match(/^h[1-6]$/)) {
        height = tag === 'h1' ? 60 : tag === 'h2' ? 50 : 40;
        width = 700;
      } else if (tag === 'p') {
        height = Math.min(100, Math.max(20, textContent.length / 50));
        width = 600;
      } else if (tag === 'button') {
        height = 40;
        width = 120;
      } else if (tag === 'img') {
        height = 200;
        width = 300;
      } else if (tag === 'nav' || tag === 'header') {
        height = 60;
        width = 1920;
      }
      
      elements.push({
        tag: tag,
        text: textContent.slice(0, 100),
        classes: classMatch ? classMatch[1] : '',
        id: idMatch ? idMatch[1] : '',
        position: {
          x: 50,
          y: yPosition,
          width: width,
          height: height
        },
        styles: {
          color: 'rgb(0, 0, 0)',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          fontSize: tag.match(/^h[1-6]$/) ? '24px' : '16px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: tag.match(/^h[1-6]$/) ? 'bold' : 'normal'
        }
      });
      
      yPosition += height + 20; // Add spacing between elements
    }
  });
  
  return elements.slice(0, 100); // Limit total elements
}

/**
 * Format recommendations properly
 */
function formatRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }
  
  return recommendations.map((rec) => {
    if (typeof rec === 'string') {
      return rec;
    } else if (typeof rec === 'object' && rec !== null) {
      return {
        title: rec.title || rec.message || 'Recommendation',
        message: rec.message || rec.solution || rec.action || 'Improve brand compliance',
        action: rec.action || rec.solution || '',
        priority: rec.priority || 'medium',
        category: rec.category || 'general'
      };
    } else {
      return rec;
    }
  });
}

export async function POST({ request }) {
  let tempFilePath = null;
  
  try {
    const formData = await request.formData();
    const htmlFile = formData.get('htmlFile');
    const brandId = formData.get('brandId');
    const useVisualAudit = formData.get('useVisualAudit') === 'true';
    
    if (!htmlFile || !(htmlFile instanceof File)) {
      return json({ error: 'HTML file is required' }, { status: 400 });
    }
    
    if (!brandId) {
      return json({ error: 'Brand ID is required' }, { status: 400 });
    }
    
    console.log(`📄 Processing uploaded HTML file: ${htmlFile.name}`);
    
    // Save uploaded file temporarily
    const tempDir = path.join(process.cwd(), 'temp-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    tempFilePath = path.join(tempDir, `${Date.now()}-${htmlFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    const arrayBuffer = await htmlFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log(`💾 Saved HTML file to: ${tempFilePath}`);
    
    // Initialize services
    const brandRepo = new PdfsBrandGuidelineRepository();
    const scrapedRepo = new ScrapedDataRepository();
    const analysisRepo = new AnalysisRepository();
    
    // Get brand guidelines
    const brandGuidelinesId = typeof brandId === 'string' ? parseInt(brandId, 10) : brandId;
    const brandGuidelines = await brandRepo.findById(brandGuidelinesId);
    
    if (!brandGuidelines) {
      return json({ error: 'Brand guidelines not found' }, { status: 404 });
    }
    
    // Track processing start time
    const processingStartTime = Date.now();
    
    let scrapedData;
    
    // Try to use visual scraper if visual audit is enabled
    if (useVisualAudit) {
      try {
        console.log('🎨 Attempting visual scraping with Playwright...');
        const visualScraper = new VisualAuditScraper();
        // Convert to file:// URL for Playwright
        const fileUrl = process.platform === 'win32' 
          ? `file:///${tempFilePath.replace(/\\/g, '/')}`
          : `file://${tempFilePath}`;
        
        scrapedData = await visualScraper.scrapeWithVisualAnnotations(fileUrl);
        console.log('✅ Visual scraping successful');
      } catch (visualError) {
        console.warn('⚠️ Visual scraping failed, falling back to HTML parsing:', visualError);
        // Fallback to HTML parsing
        const htmlContent = fs.readFileSync(tempFilePath, 'utf-8');
        const colors = extractColorsFromHTML(htmlContent);
        const fonts = extractFontsFromHTML(htmlContent);
        const typography = extractTypographyFromHTML(htmlContent);
        const elementPositions = extractElementPositionsFromHTML(htmlContent);
        
        scrapedData = {
          url: htmlFile.name,
          colors: colors,
          fonts: fonts,
          typography: typography,
          elements: elementPositions.map(el => ({
            tag: el.tag,
            text: el.text,
            classes: el.classes || '',
            id: el.id || ''
          })),
          visualData: {
            screenshot: null,
            elementPositions: elementPositions,
            viewport: { width: 1920, height: 1080 },
            timestamp: new Date().toISOString()
          },
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date().toISOString()
        };
      }
    } else {
      // Standard mode: parse HTML directly
      console.log('📄 Parsing HTML file directly...');
      const htmlContent = fs.readFileSync(tempFilePath, 'utf-8');
      const colors = extractColorsFromHTML(htmlContent);
      const fonts = extractFontsFromHTML(htmlContent);
      const typography = extractTypographyFromHTML(htmlContent);
      const elementPositions = extractElementPositionsFromHTML(htmlContent);
      
      scrapedData = {
        url: htmlFile.name,
        colors: colors,
        fonts: fonts,
        typography: typography,
        elements: elementPositions.map(el => ({
          tag: el.tag,
          text: el.text,
          classes: el.classes || '',
          id: el.id || ''
        })),
        visualData: {
          screenshot: null,
          elementPositions: elementPositions,
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date().toISOString()
        },
        viewport: { width: 1920, height: 1080 },
        timestamp: new Date().toISOString()
      };
    }
    
    // Validate scraped data
    if (!scrapedData) {
      return json({
        error: 'HTML file processing failed',
        message: 'No scraped data received'
      }, { status: 500 });
    }
    
    // Prepare data for analysis
    const analysisData = {
      url: scrapedData.url,
      colors: scrapedData.colors || [],
      fonts: scrapedData.fonts || [],
      elements: scrapedData.elements || [],
      typography: scrapedData.typography || { primary: null, secondary: null, weights: [] },
      logo: { rules: [], spacing: null, sizing: null },
      layout: { grid: null, spacing: null },
      imagery: { style: null, tone: null },
      viewport: scrapedData.viewport,
      timestamp: scrapedData.timestamp
    };
    
    console.log('📊 Analysis data structure:', {
      hasColors: !!analysisData.colors && analysisData.colors.length > 0,
      hasFonts: !!analysisData.fonts && analysisData.fonts.length > 0,
      hasTypography: !!analysisData.typography,
      elementsCount: analysisData.elements ? analysisData.elements.length : 0
    });

    // Run audit analysis
    console.log(`🧠 Running compliance analysis...`);
    const auditResults = await enhancedComplianceAnalyzer.analyzeCompliance(
      analysisData, 
      brandGuidelines
    );
    
    // Process recommendations with LLM for actionable solutions
    console.log(`🛠️ Processing recommendations with LLM...`);
    let enhancedRecommendations = [];
    
    try {
      const solutionProcessor = new SolutionLLMProcessor();
      const solutionResults = await solutionProcessor.processIssues(
        auditResults.issues || [],
        brandGuidelines,
        analysisData
      );
      
      if (solutionResults.solutions && solutionResults.solutions.length > 0) {
        enhancedRecommendations = solutionResults.solutions.map(sol => ({
          title: sol.issueTitle || sol.title || 'Solution',
          message: sol.solution || sol.message || sol.problem,
          action: sol.implementation?.steps?.join(', ') || sol.implementation?.css || sol.implementation?.html || '',
          priority: sol.priority || 'high',
          category: sol.category || 'improvement',
          issueTitle: sol.issueTitle,
          problem: sol.problem,
          solution: sol.solution,
          implementation: sol.implementation,
          estimatedTime: sol.estimatedTime,
          expectedResult: sol.expectedResult
        }));
        console.log(`✅ Generated ${enhancedRecommendations.length} LLM-powered actionable solutions`);
      } else {
        enhancedRecommendations = formatRecommendations(auditResults.recommendations || []);
      }
    } catch (solutionError) {
      console.warn('⚠️ LLM solution processing failed, using default recommendations:', solutionError);
      enhancedRecommendations = formatRecommendations(auditResults.recommendations || []);
    }
    
    // Create visual report if screenshot is available
    let visualReport = null;
    if (scrapedData.visualData?.screenshot && useVisualAudit) {
      try {
        console.log(`🎨 Creating visual audit report...`);
        const screenshotAnnotator = new ScreenshotAnnotator();
        const annotatedScreenshot = await screenshotAnnotator.annotateScreenshot(
          scrapedData.visualData.screenshot,
          auditResults,
          scrapedData.visualData.elementPositions || [],
          brandGuidelines
        );
        visualReport = {
          ...auditResults,
          visualData: {
            ...scrapedData.visualData,
            annotatedScreenshot
          }
        };
      } catch (annotationError) {
        console.warn('⚠️ Screenshot annotation failed:', annotationError);
        visualReport = {
          ...auditResults,
          visualData: scrapedData.visualData
        };
      }
    } else {
      visualReport = {
        ...auditResults,
        visualData: scrapedData.visualData
      };
    }
    
    // Convert screenshots to base64 for frontend (if available)
    let screenshotDataUrl = null;
    let targetedScreenshotDataUrl = null;
    
    if (visualReport.visualData?.screenshot && fs.existsSync(visualReport.visualData.screenshot)) {
      try {
        const screenshotBuffer = fs.readFileSync(visualReport.visualData.screenshot);
        screenshotDataUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
        console.log(`✅ Converted screenshot to base64`);
      } catch (error) {
        console.warn('⚠️ Failed to convert screenshot to base64:', error);
      }
    }
    
    if (visualReport.visualData?.annotatedScreenshot && fs.existsSync(visualReport.visualData.annotatedScreenshot)) {
      try {
        const annotatedBuffer = fs.readFileSync(visualReport.visualData.annotatedScreenshot);
        targetedScreenshotDataUrl = `data:image/png;base64,${annotatedBuffer.toString('base64')}`;
        console.log(`✅ Converted annotated screenshot to base64`);
      } catch (error) {
        console.warn('⚠️ Failed to convert annotated screenshot to base64:', error);
        if (screenshotDataUrl) {
          targetedScreenshotDataUrl = screenshotDataUrl;
        }
      }
    } else if (screenshotDataUrl) {
      targetedScreenshotDataUrl = screenshotDataUrl;
    }
    
    // Attach element positions to specific issues
    const issuesWithPositions = (auditResults.issues || []).map((issue, index) => {
      const positions = visualReport.visualData?.elementPositions || [];
      const startIndex = index * 3;
      const endIndex = startIndex + 1;
      const relevantPositions = positions.slice(startIndex, endIndex);
      
      return {
        ...issue,
        elementPositions: relevantPositions
      };
    });
    
    // Store scraped data with visual information
    const scrapedDataWithVisuals = {
      ...scrapedData,
      screenshot: screenshotDataUrl,
      annotatedScreenshot: targetedScreenshotDataUrl || screenshotDataUrl,
      elementPositions: visualReport.visualData?.elementPositions || [],
      viewport: visualReport.visualData?.viewport || { width: 1920, height: 1080 },
      timestamp: visualReport.visualData?.timestamp || new Date().toISOString()
    };
    
    // Save to database
    const savedData = await scrapedRepo.create(scrapedDataWithVisuals);
    
    // Clean up temporary files
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (visualReport.visualData?.screenshot && fs.existsSync(visualReport.visualData.screenshot)) {
        fs.unlinkSync(visualReport.visualData.screenshot);
      }
      if (visualReport.visualData?.annotatedScreenshot && fs.existsSync(visualReport.visualData.annotatedScreenshot)) {
        fs.unlinkSync(visualReport.visualData.annotatedScreenshot);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup failed:', cleanupError);
    }
    
    // Build AI Fix Prompt
    const fixPrompt = generateFixPrompt(
      auditResults,
      brandGuidelines,
      '',
      { level: 'standard' },
      scrapedData,
      visualReport.visualData?.elementPositions || scrapedData.visualData?.elementPositions || []
    );

    // Calculate severity breakdown
    const severityBreakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    (auditResults.issues || []).forEach(issue => {
      const severity = (issue.severity || 'medium').toLowerCase();
      if (severityBreakdown.hasOwnProperty(severity)) {
        severityBreakdown[severity]++;
      } else {
        severityBreakdown.medium++;
      }
    });

    // Convert category scores to percentage integers
    const categoryScores = auditResults.categoryScores || {};
    const categoryScoresForDb = {};
    Object.keys(categoryScores).forEach(key => {
      if (typeof categoryScores[key] === 'number') {
        categoryScoresForDb[key] = Math.round(categoryScores[key] * 100);
      }
    });

    // Prepare analysis result data for database
    const analysisDataForDb = {
      brandGuidelineId: null,
      websiteUrl: htmlFile.name,
      websiteTitle: htmlFile.name,
      violations: (auditResults.issues || []).map(issue => ({
        elementType: issue.element || issue.selector || 'unknown',
        issueType: issue.type || issue.category || 'general',
        severity: (issue.severity || 'medium').toLowerCase(),
        found: issue.found || issue.details?.found || null,
        expected: issue.expected || issue.details?.expected || null,
        suggestion: issue.recommendation || issue.action || '',
        affectedElements: issue.elementPositions?.length || 1,
        examples: issue.examples || [],
        location: issue.location || issue.selector || '',
        impact: issue.impact || '',
        priority: issue.priority || issue.severity || 'medium'
      })),
      issues: issuesWithPositions,
      recommendations: enhancedRecommendations,
      score: Math.round((auditResults.overallScore || 0) * 100),
      totalViolations: auditResults.issues?.length || 0,
      severityBreakdown: severityBreakdown,
      categoryScores: categoryScoresForDb,
      screenshot: screenshotDataUrl,
      annotatedScreenshot: targetedScreenshotDataUrl || screenshotDataUrl,
      fixPrompt: fixPrompt,
      analysisType: 'html_file_compliance',
      processingTime: Date.now() - processingStartTime,
      elementsAnalyzed: scrapedData.elements?.length || visualReport.visualData?.elementPositions?.length || 0
    };

    // Save analysis results to database
    let savedAnalysis = null;
    try {
      console.log('💾 Saving analysis results to database...');
      savedAnalysis = await analysisRepo.create(analysisDataForDb);
      console.log(`✅ Analysis results saved with ID: ${savedAnalysis.id}`);
    } catch (dbError) {
      console.error('❌ Failed to save analysis results to database:', dbError);
    }

    const response = {
      overallScore: auditResults.overallScore,
      categoryScores: auditResults.categoryScores,
      issues: issuesWithPositions,
      recommendations: enhancedRecommendations,
      summary: auditResults.summary,
      confidence: auditResults.confidence,
      detailedSummary: auditResults.detailedSummary,
      skippedCategories: auditResults.skippedCategories,
      visualData: {
        screenshot: screenshotDataUrl,
        targetedScreenshot: targetedScreenshotDataUrl,
        annotatedScreenshot: targetedScreenshotDataUrl || screenshotDataUrl || null,
        elementPositions: visualReport.visualData?.elementPositions || [],
        viewport: visualReport.visualData?.viewport || { width: 1920, height: 1080 },
        timestamp: visualReport.visualData?.timestamp || new Date().toISOString()
      },
      interactive: true,
      scrapedDataId: savedData.id,
      analysisId: savedAnalysis?.id || null,
      fixPrompt,
      url: htmlFile.name
    };
    
    console.log(`✅ HTML file audit completed successfully`);
    
    return json(response);
    
  } catch (error) {
    console.error('❌ HTML file audit failed:', error);
    
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
      }
    }
    
    return json({ 
      error: 'HTML file audit failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

