import { json } from '@sveltejs/kit';
import { VisualAuditScraper } from '$lib/services/web-scraping/visualAuditScraper.js';
import { ScreenshotAnnotator } from '$lib/services/web-scraping/screenshotAnnotator.js';
import { FixedScreenshotAnnotator } from '$lib/services/web-scraping/fixedScreenshotAnnotator.js';
import { enhancedComplianceAnalyzer } from '$lib/services/audit/enhancedComplianceAnalyzer.js';
import { SolutionLLMProcessor } from '$lib/services/audit/solutionLLMProcessor.js';
import { PdfsBrandGuidelineRepository } from '$lib/repositories/pdfsBrandGuidelineRepository.js';
import { ScrapedDataRepository } from '$lib/repositories/scrapedDataRepository.js';
import fs from 'fs';
import path from 'path';

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
 * Default recommendations are already formatted, just return them as-is
 */
function formatRecommendations(recommendations) {
  // If recommendations are already formatted correctly, return them
  // Otherwise, convert objects to proper format
  if (!Array.isArray(recommendations)) {
    return [];
  }
  
  return recommendations.map((rec) => {
    if (typeof rec === 'string') {
      return rec;
    } else if (typeof rec === 'object' && rec !== null) {
      // Keep object structure but ensure it has the fields the frontend needs
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
  try {
    const { url, brandId } = await request.json();
    
    console.log(`🎯 Starting visual audit for: ${url} with brand: ${brandId}`);
    
    // Initialize services
    const visualScraper = new VisualAuditScraper();
    const screenshotAnnotator = new ScreenshotAnnotator();
    const brandRepo = new PdfsBrandGuidelineRepository();
    const scrapedRepo = new ScrapedDataRepository();
    
    // Get brand guidelines (brandId can be string (number) for pdfsBrandGuidelines)
    console.log(`📋 Fetching brand guidelines for ID: ${brandId}`);
    const brandGuidelinesId = typeof brandId === 'string' ? parseInt(brandId, 10) : brandId;
    const brandGuidelines = await brandRepo.findById(brandGuidelinesId);
    
    if (!brandGuidelines) {
      console.log(`❌ Brand guidelines not found for ID: ${brandId}`);
      
      // Try to get all guidelines to see what's available
      const allGuidelines = await (brandRepo.findAll && typeof brandRepo.findAll === 'function') ? await brandRepo.findAll() : [];
      console.log(`📊 Available guidelines in database:`, allGuidelines.map((g) => ({ id: g.id, brandName: g.brandName })));
      
      return json({ 
        error: 'Brand guidelines not found',
        debug: {
          requestedId: brandId,
          availableGuidelines: allGuidelines.map((g) => ({ id: g.id, brandName: g.brandName }))
        }
      }, { status: 404 });
    }
    
    // Scrape with visual data
    console.log(`🔍 Starting visual scraping...`);
    let scrapedData;
    try {
      scrapedData = await visualScraper.scrapeWithVisualAnnotations(url);
    } catch (visualError) {
      console.warn('⚠️ Visual scraping failed, falling back to standard scraping:', visualError);
      try {
        // Fallback to standard scraping
        const { EnhancedWebScraper } = await import('$lib/services/web-scraping/enhancedWebScraper.js');
        const standardScraper = new EnhancedWebScraper();
        const standardData = await standardScraper.scrapeWebsite(url);
        
        // Create minimal visual data structure
        scrapedData = {
          ...standardData,
          visualData: {
            screenshot: null,
            elementPositions: [],
            viewport: { width: 1920, height: 1080 },
            timestamp: new Date().toISOString()
          }
        };
      } catch (fallbackError) {
        console.error('❌ Fallback scraping also failed:', fallbackError);
        
        // Final fallback: For file:// URLs, try to read HTML directly
        if (url.startsWith('file://')) {
          try {
            console.log('📁 Attempting to read HTML file directly...');
            // Convert file:// URL to file path
            let filePath = url.replace(/^file:\/\//, '');
            // Handle Windows paths: file:///C:/... -> C:/...
            if (filePath.startsWith('/')) {
              filePath = filePath.substring(1);
            }
            // Handle Windows drive letter: /C:/... -> C:/...
            filePath = filePath.replace(/^\/([A-Za-z]:)/, '$1');
            console.log(`📁 Reading file: ${filePath}`);
            
            const htmlContent = fs.readFileSync(filePath, 'utf-8');
            
            // Basic HTML parsing to extract colors and fonts
            const colors = extractColorsFromHTML(htmlContent);
            const fonts = extractFontsFromHTML(htmlContent);
            const typography = extractTypographyFromHTML(htmlContent);
            
            // Extract element positions from HTML (basic parsing)
            const elementPositions = extractElementPositionsFromHTML(htmlContent);
            
            scrapedData = {
              url: url,
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
                screenshot: null, // No screenshot available without browser
                elementPositions: elementPositions,
                viewport: { width: 1920, height: 1080 },
                timestamp: new Date().toISOString()
              },
              viewport: { width: 1920, height: 1080 },
              timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Successfully extracted data from HTML file: ${colors.length} colors, ${fonts.length} fonts, ${elementPositions.length} elements`);
          } catch (fileError) {
            console.error('❌ File reading also failed:', fileError);
            return json({
              error: 'Visual audit failed',
              message: 'Unable to scrape the website. Please ensure Chrome/Puppeteer is properly installed.',
              details: fallbackError.message,
              suggestion: 'Try running: npx puppeteer browsers install chrome'
            }, { status: 500 });
          }
        } else {
          // Not a file:// URL, can't do anything without a browser
          return json({
            error: 'Visual audit failed',
            message: 'Unable to scrape the website. Please ensure Chrome/Puppeteer is properly installed.',
            details: fallbackError.message,
            suggestion: 'Try running: npx puppeteer browsers install chrome'
          }, { status: 500 });
        }
      }
    }
    
    // Validate scraped data
    if (!scrapedData) {
      return json({
        error: 'Visual audit failed',
        message: 'No scraped data received'
      }, { status: 500 });
    }
    
    // Prepare data for analysis
    const analysisData = {
      url: scrapedData.url,
      colors: scrapedData.colors || [],
      fonts: scrapedData.fonts || [],
      elements: scrapedData.elements || [],
      typography: scrapedData.typography || { primary: null, secondary: null, weights: [] }, // USE ACTUAL SCRAPED DATA
      logo: { rules: [], spacing: null, sizing: null },
      layout: { grid: null, spacing: null },
      imagery: { style: null, tone: null },
      viewport: scrapedData.viewport,
      timestamp: scrapedData.timestamp
    };
    
    // DEBUG: Log what we're passing to the analyzer
    console.log('📊 Analysis data structure:', {
      hasColors: !!analysisData.colors && analysisData.colors.length > 0,
      hasFonts: !!analysisData.fonts && analysisData.fonts.length > 0,
      hasTypography: !!analysisData.typography,
      typographyStructure: analysisData.typography ? Object.keys(analysisData.typography) : 'NONE',
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
      
      // Use LLM-generated solutions as primary recommendations
      if (solutionResults.solutions && solutionResults.solutions.length > 0) {
        // Format LLM solutions to match frontend expectations
        enhancedRecommendations = solutionResults.solutions.map(sol => ({
          title: sol.issueTitle || sol.title || 'Solution',
          message: sol.solution || sol.message || sol.problem,
          action: sol.implementation?.steps?.join(', ') || sol.implementation?.css || sol.implementation?.html || '',
          priority: sol.priority || 'high',
          category: sol.category || 'improvement',
          // Keep all LLM data for detailed view
          issueTitle: sol.issueTitle,
          problem: sol.problem,
          solution: sol.solution,
          implementation: sol.implementation,
          estimatedTime: sol.estimatedTime,
          expectedResult: sol.expectedResult
        }));
        console.log(`✅ Generated ${enhancedRecommendations.length} LLM-powered actionable solutions`);
      } else {
        // Fallback to default recommendations with proper formatting
        console.warn('⚠️ No LLM solutions generated, using fallback');
        enhancedRecommendations = formatRecommendations(auditResults.recommendations || []);
      }
    } catch (solutionError) {
      console.warn('⚠️ LLM solution processing failed, using default recommendations:', solutionError);
      // Format default recommendations properly
      enhancedRecommendations = formatRecommendations(auditResults.recommendations || []);
    }
    
    // Create targeted audit report with enhanced annotations
    // Note: FixedScreenshotAnnotator and ScreenshotAnnotator require a screenshot file
    // They will only run if scrapedData.visualData.screenshot exists (from VisualAuditScraper)
    let visualReport = null;
    if (scrapedData.visualData?.screenshot) {
      try {
        console.log(`🎯 Creating targeted visual audit report using FixedScreenshotAnnotator...`);
        const fixedAnnotator = new FixedScreenshotAnnotator();
        const annotatedScreenshot = await fixedAnnotator.createTargetedAnnotations(
          scrapedData.visualData.screenshot,
          auditResults,
          scrapedData.visualData.elementPositions || []
        );
        console.log(`✅ FixedScreenshotAnnotator created annotated screenshot: ${annotatedScreenshot}`);
        visualReport = {
          ...auditResults,
          visualData: {
            ...scrapedData.visualData,
            annotatedScreenshot
          }
        };
      } catch (annotationError) {
        console.warn('⚠️ FixedScreenshotAnnotator failed, falling back to ScreenshotAnnotator:', annotationError);
        // Fallback to standard annotation using ScreenshotAnnotator
        try {
          console.log(`🎨 Using ScreenshotAnnotator as fallback...`);
          const annotatedScreenshot = await screenshotAnnotator.annotateScreenshot(
            scrapedData.visualData.screenshot,
            auditResults,
            scrapedData.visualData.elementPositions || []
          );
          console.log(`✅ ScreenshotAnnotator created annotated screenshot: ${annotatedScreenshot}`);
          visualReport = {
            ...auditResults,
            visualData: {
              ...scrapedData.visualData,
              annotatedScreenshot
            }
          };
        } catch (fallbackError) {
          console.warn('⚠️ Standard annotation also failed:', fallbackError);
          visualReport = {
            ...auditResults,
            visualData: scrapedData.visualData
          };
        }
      }
    } else {
      console.warn('⚠️ No screenshot available for annotation - FixedScreenshotAnnotator and ScreenshotAnnotator require a screenshot file');
      console.warn('💡 Screenshot generation requires Chrome/Puppeteer. Element positions are still available for interactive highlights.');
    }
    
    // Use visual report if available, otherwise use basic audit results
    const finalReport = visualReport || {
      ...auditResults,
      visualData: scrapedData.visualData
    };
    
    // Convert screenshots to base64 for frontend (if available)
    let screenshotDataUrl = null;
    let targetedScreenshotDataUrl = null;
    
    // Check and convert original screenshot
    if (finalReport.visualData?.screenshot && fs.existsSync(finalReport.visualData.screenshot)) {
      try {
        const screenshotBuffer = fs.readFileSync(finalReport.visualData.screenshot);
        screenshotDataUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
        console.log(`✅ Converted original screenshot to base64`);
      } catch (error) {
        console.warn('⚠️ Failed to convert screenshot to base64:', error);
      }
    } else {
      console.warn('⚠️ Screenshot file does not exist:', finalReport.visualData?.screenshot);
    }
    
    // Check and convert annotated screenshot
    if (finalReport.visualData?.annotatedScreenshot && fs.existsSync(finalReport.visualData.annotatedScreenshot)) {
      try {
        const annotatedBuffer = fs.readFileSync(finalReport.visualData.annotatedScreenshot);
        targetedScreenshotDataUrl = `data:image/png;base64,${annotatedBuffer.toString('base64')}`;
        console.log(`✅ Converted annotated screenshot to base64`);
      } catch (error) {
        console.warn('⚠️ Failed to convert targeted screenshot to base64:', error);
        // Fallback to original screenshot if annotated one fails
        if (screenshotDataUrl) {
          targetedScreenshotDataUrl = screenshotDataUrl;
          console.log(`✅ Using original screenshot as fallback`);
        }
      }
    } else if (screenshotDataUrl) {
      // If no annotated screenshot but we have original, use it
      targetedScreenshotDataUrl = screenshotDataUrl;
      console.log(`✅ Using original screenshot as annotated screenshot`);
    }
    
    // Attach element positions to specific issues
    const issuesWithPositions = (auditResults.issues || []).map((issue, index) => {
      const positions = finalReport.visualData?.elementPositions || [];
      // Only attach positions that might be relevant to this issue
      // For now, we'll use a subset - the first few elements per issue
      const startIndex = index * 3; // 3 elements per issue
      const endIndex = startIndex + 1; // Just 1 element per issue to avoid overflow
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
      elementPositions: finalReport.visualData?.elementPositions || [],
      viewport: finalReport.visualData?.viewport || { width: 1920, height: 1080 },
      timestamp: finalReport.visualData?.timestamp || new Date().toISOString()
    };
    
    // Save to database
    const savedData = await scrapedRepo.create(scrapedDataWithVisuals);
    
    // Clean up temporary files
    try {
      if (finalReport.visualData?.screenshot && fs.existsSync(finalReport.visualData.screenshot)) {
        fs.unlinkSync(finalReport.visualData.screenshot);
      }
      if (finalReport.visualData?.annotatedScreenshot && fs.existsSync(finalReport.visualData.annotatedScreenshot)) {
        fs.unlinkSync(finalReport.visualData.annotatedScreenshot);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup failed:', cleanupError);
    }
    
    // Return comprehensive results
    const response = {
      // Spread audit results
      overallScore: auditResults.overallScore,
      categoryScores: auditResults.categoryScores,
      issues: issuesWithPositions, // Use issues with attached positions
      recommendations: enhancedRecommendations, // Use enhanced recommendations with LLM solutions
      summary: auditResults.summary,
      confidence: auditResults.confidence,
      detailedSummary: auditResults.detailedSummary,
      skippedCategories: auditResults.skippedCategories,
      // Add visual data
      visualData: {
        screenshot: screenshotDataUrl,
        targetedScreenshot: targetedScreenshotDataUrl,
        annotatedScreenshot: targetedScreenshotDataUrl || screenshotDataUrl || null, // For backward compatibility
        elementPositions: finalReport.visualData?.elementPositions || [],
        viewport: finalReport.visualData?.viewport || { width: 1920, height: 1080 },
        timestamp: finalReport.visualData?.timestamp || new Date().toISOString()
      },
      interactive: true,
      scrapedDataId: savedData.id
    };
    
    console.log(`✅ Visual audit completed successfully`);
    console.log(`📊 Response structure:`, {
      hasOverallScore: !!response.overallScore,
      hasIssues: !!response.issues,
      hasVisualData: !!response.visualData,
      issuesCount: response.issues?.length || 0
    });
    
    return json(response);
    
  } catch (error) {
    console.error('❌ Visual audit failed:', error);
    return json({ 
      error: 'Visual audit failed', 
      details: error 
    }, { status: 500 });
  }
}
