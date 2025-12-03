// @ts-nocheck
// Commented out to avoid bundling in Vercel serverless functions (exceeds 250MB limit)
// Uncomment if deploying to a platform that supports larger bundles (e.g., Railway, Render)
// import { chromium } from 'playwright';
// import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export class VisualAuditScraper {
  constructor() {
    this.screenshotDir = 'screenshots';
    this.ensureScreenshotDir();
  }

  ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async scrapeWithVisualAnnotations(url) {
    console.log(`:dart: Starting visual audit scraping for: ${url}`);
   
    const scrapedData = await this.enhancedScraping(url);
    const screenshotPath = await this.captureFullPageScreenshot(url);
    const elementPositions = await this.extractElementPositions(url);
   
    // Leave annotation to API layer (+server). Only return raw screenshot and positions here.
    const annotatedPath = null;

    return {
      ...scrapedData,
      visualData: {
        // Maintain legacy field expected by server for annotators
        screenshot: screenshotPath,
        originalScreenshot: screenshotPath,
        annotatedScreenshot: annotatedPath || null,
        elementPositions: elementPositions,
        viewport: scrapedData.viewport,
        timestamp: new Date().toISOString()
      }
    };
  }

  async captureFullPageScreenshot(url) {
    let browser = null;
   
    try {
      console.log(`:camera_with_flash: Capturing full page screenshot for: ${url}`);
     
      // Dynamic import to avoid bundling playwright in serverless functions
      const { chromium } = await import('playwright');
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, // Use system Chromium if available
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu'
        ]
      });
     
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
      });
     
      const page = await context.newPage();
     
      // Handle file:// URLs differently
      if (url.startsWith('file://')) {
        console.log(`:file_folder: Handling local file: ${url}`);
        let filePath = url;
        if (url.startsWith('file://') && !url.startsWith('file:///')) {
          filePath = url.replace('file://', 'file:///');
        }
        // For Windows paths, ensure proper formatting
        if (process.platform === 'win32' && filePath.includes('C:')) {
          filePath = filePath.replace('file:///C:', 'file:///C:');
        }
       
        console.log(`:file_folder: Processed file path: ${filePath}`);
        await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } else {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }
     
      // Wait for content to load
      await this.waitForContent(page);
     
      // Ensure page has content before taking screenshot
      const pageContent = await page.evaluate(() => {
        return {
          bodyHeight: document.body.scrollHeight,
          bodyWidth: document.body.scrollWidth,
          hasContent: document.body.innerHTML.length > 100
        };
      });
     
      console.log(`:straight_ruler: Page dimensions: ${pageContent.bodyWidth}x${pageContent.bodyHeight}, has content: ${pageContent.hasContent}`);
     
      if (!pageContent.hasContent || pageContent.bodyHeight === 0) {
        throw new Error('Page has no content or zero height');
      }
     
      // Set a minimum viewport size if needed
      if (pageContent.bodyWidth < 800) {
        await context.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(1000);
      }
     
      // Capture full page screenshot
      const screenshotPath = path.join(this.screenshotDir, `${Date.now()}-audit.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });
     
      console.log(`:white_check_mark: Screenshot saved to: ${screenshotPath}`);
      return screenshotPath;
     
    } catch (error) {
      console.error(':x: Screenshot capture failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async enhancedScraping(url) {
    let browser = null;
   
    try {
      console.log(`:mag: Starting enhanced scraping for: ${url}`);
     
      // Dynamic import to avoid bundling playwright in serverless functions
      const { chromium } = await import('playwright');
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, // Use system Chromium if available
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu'
        ]
      });
     
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
      });
     
      const page = await context.newPage();
     
      // Handle file:// URLs differently
      if (url.startsWith('file://')) {
        console.log(`:file_folder: Handling local file: ${url}`);
        let filePath = url;
        if (url.startsWith('file://') && !url.startsWith('file:///')) {
          filePath = url.replace('file://', 'file:///');
        }
        // For Windows paths, ensure proper formatting
        if (process.platform === 'win32' && filePath.includes('C:')) {
          filePath = filePath.replace('file:///C:', 'file:///C:');
        }
       
        console.log(`:file_folder: Processed file path: ${filePath}`);
        await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } else {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }
     
      // Wait for content to load
      await this.waitForContent(page);
     
      // Extract comprehensive data
      const websiteData = await this.extractComprehensiveData(page, url);
     
      console.log(`:white_check_mark: Enhanced scraping completed: ${websiteData.elements.length} elements, ${websiteData.colors.length} colors, ${websiteData.fonts.length} fonts`);
      return websiteData;
     
    } catch (error) {
      console.error(':x: Enhanced scraping failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async extractElementPositions(url) {
    let browser = null;
   
    try {
      console.log(`:round_pushpin: Extracting element positions for: ${url}`);
     
      // Dynamic import to avoid bundling playwright in serverless functions
      const { chromium } = await import('playwright');
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, // Use system Chromium if available
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu'
        ]
      });
     
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
      });
     
      const page = await context.newPage();
     
      // Handle file:// URLs differently
      if (url.startsWith('file://')) {
        console.log(`:file_folder: Handling local file: ${url}`);
        let filePath = url;
        if (url.startsWith('file://') && !url.startsWith('file:///')) {
          filePath = url.replace('file://', 'file:///');
        }
        // For Windows paths, ensure proper formatting
        if (process.platform === 'win32' && filePath.includes('C:')) {
          filePath = filePath.replace('file:///C:', 'file:///C:');
        }
       
        console.log(`:file_folder: Processed file path: ${filePath}`);
        await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } else {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }
     
      // Wait for content to load
      await this.waitForContent(page);
     
      // Extract elements with their positions, prioritizing logo detection
      const elements = await page.evaluate(() => {
        const elements = [];
       
        // First, specifically look for logo elements
        const logoSelectors = [
          'header img',
          '.logo img',
          '[class*="logo"] img',
          '[class*="brand"] img',
          'nav img',
          'img[alt*="logo" i]',
          'img[src*="logo" i]',
          '[class*="logo"]'
        ];
       
        const logoElements = new Set();
        logoSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => {
              logoElements.add(el);
            });
          } catch (e) {
            // Ignore invalid selectors
          }
        });
       
        // Add logo elements first with special flag
        logoElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 10 && rect.height > 10) {
            const isImg = el.tagName.toLowerCase() === 'img';
            elements.push({
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.slice(0, 100) || '',
              classes: el.className || '',
              id: el.id || '',
              src: isImg ? (el.src || el.getAttribute('src') || '') : '',
              alt: isImg ? (el.alt || '') : '',
              isLogo: true,
              position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              styles: {
                color: getComputedStyle(el).color,
                backgroundColor: getComputedStyle(el).backgroundColor,
                fontSize: getComputedStyle(el).fontSize,
                fontFamily: getComputedStyle(el).fontFamily,
                fontWeight: getComputedStyle(el).fontWeight
              }
            });
          }
        });
       
        // Get all other relevant elements
        const selectors = [
          'h1, h2, h3, h4, h5, h6',
          'p, span, div[class*="text"]',
          'a, button',
          'img',
          'header, footer, nav',
          'div[class*="card"], section, article'
        ];
       
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            // Skip if already added as logo
            if (logoElements.has(el)) return;
           
            const rect = el.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 10) {
              const isImg = el.tagName.toLowerCase() === 'img';
              elements.push({
                tag: el.tagName.toLowerCase(),
                text: el.textContent?.slice(0, 100) || '',
                classes: el.className || '',
                id: el.id || '',
                src: isImg ? (el.src || el.getAttribute('src') || '') : '',
                alt: isImg ? (el.alt || '') : '',
                isLogo: false,
                position: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                },
                styles: {
                  color: getComputedStyle(el).color,
                  backgroundColor: getComputedStyle(el).backgroundColor,
                  fontSize: getComputedStyle(el).fontSize,
                  fontFamily: getComputedStyle(el).fontFamily,
                  fontWeight: getComputedStyle(el).fontWeight
                }
              });
            }
          });
        });
       
        return elements;
      });
     
      console.log(`:white_check_mark: Extracted ${elements.length} element positions`);
      return elements;
     
    } catch (error) {
      console.error(':x: Element position extraction failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async waitForContent(page) {
    try {
      // Wait for basic content
      await page.waitForSelector('body', { timeout: 5000 });
     
      // Wait for load states (Playwright specific)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
     
      // Wait for any dynamic content
      await page.waitForTimeout(2000);
     
      // Wait for fonts to load (important for web fonts like Google Fonts)
      try {
        await page.evaluate(async () => {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
          // Additional wait for font loading
          await new Promise(resolve => setTimeout(resolve, 500));
        });
      } catch (error) {
        console.log(':warning: Font loading check failed, continuing...');
      }
     
      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
     
      await page.waitForTimeout(1000);
     
      // Scroll back to top
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
     
      await page.waitForTimeout(1000);
     
    } catch (error) {
      console.warn(':warning: Content waiting failed:', error.message);
    }
  }

  async extractComprehensiveData(page, url) {
    try {
      // Extract colors
      const colors = await page.evaluate(() => {
        const colorSet = new Set();
        const elements = document.querySelectorAll('*');
       
        elements.forEach(el => {
          const styles = getComputedStyle(el);
          if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(styles.color);
          }
          if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(styles.backgroundColor);
          }
        });
       
        return Array.from(colorSet);
      });

      // Extract fonts with priority on CSS declarations and Google Fonts
      const fonts = await page.evaluate(() => {
        const fontSet = new Set();
        const declaredFonts = new Set(); // Fonts declared in CSS (highest priority)
        const fontData = {
          primary: null,
          secondary: null,
          weights: new Set(),
          fontSize: []
        };
       
        // Method 0: Extract fonts from Google Fonts links and CSS stylesheets (highest priority)
        try {
          // Check Google Fonts links
          const googleFontsLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
          googleFontsLinks.forEach(link => {
            const href = link.href;
            // Extract font family name from URL: ...?family=Montserrat:wght@400;700
            const familyMatch = href.match(/family=([^:&]+)/i);
            if (familyMatch) {
              const fontName = decodeURIComponent(familyMatch[1].replace(/\+/g, ' '));
              const cleanFont = fontName.trim();
              if (cleanFont) {
                declaredFonts.add(cleanFont);
                fontSet.add(cleanFont);
                if (!fontData.primary) {
                  fontData.primary = cleanFont;
                }
                console.log(`:white_check_mark: Found font from Google Fonts link: ${cleanFont}`);
              }
            }
          });
         
          // Extract from CSS stylesheets and <style> tags
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              Array.from(sheet.cssRules || []).forEach(rule => {
                if (rule.style && rule.style.fontFamily) {
                  const fontFamily = rule.style.fontFamily;
                  fontFamily.split(',').forEach(font => {
                    const cleanFont = font.trim().replace(/['"]/g, '');
                    if (cleanFont && cleanFont !== 'serif' && cleanFont !== 'sans-serif' && cleanFont !== 'monospace' &&
                        !cleanFont.includes('ui-') && !cleanFont.includes('system-')) {
                      declaredFonts.add(cleanFont);
                      fontSet.add(cleanFont);
                      if (!fontData.primary) {
                        fontData.primary = cleanFont;
                      } else if (!fontData.secondary && cleanFont !== fontData.primary) {
                        fontData.secondary = cleanFont;
                      }
                    }
                  });
                }
                // Also check @font-face rules
                if (rule instanceof CSSFontFaceRule) {
                  const fontFamily = rule.style.fontFamily;
                  if (fontFamily) {
                    const cleanFont = fontFamily.replace(/['"]/g, '').trim();
                    if (cleanFont) {
                      declaredFonts.add(cleanFont);
                      fontSet.add(cleanFont);
                      if (!fontData.primary) {
                        fontData.primary = cleanFont;
                      }
                    }
                  }
                }
              });
            } catch (e) {
              // Cross-origin stylesheet or other error
            }
          });
         
          // Check inline <style> tags
          Array.from(document.querySelectorAll('style')).forEach(styleTag => {
            const styleText = styleTag.textContent || styleTag.innerText || '';
            // Extract font-family declarations
            const fontFamilyMatches = styleText.match(/font-family\s*:\s*([^;]+)/gi);
            if (fontFamilyMatches) {
              fontFamilyMatches.forEach(match => {
                const fontValue = match.replace(/font-family\s*:\s*/i, '').trim();
                fontValue.split(',').forEach(font => {
                  const cleanFont = font.trim().replace(/['"]/g, '');
                  if (cleanFont && cleanFont !== 'serif' && cleanFont !== 'sans-serif' && cleanFont !== 'monospace' &&
                      !cleanFont.includes('ui-') && !cleanFont.includes('system-')) {
                    declaredFonts.add(cleanFont);
                    fontSet.add(cleanFont);
                    if (!fontData.primary) {
                      fontData.primary = cleanFont;
                    } else if (!fontData.secondary && cleanFont !== fontData.primary) {
                      fontData.secondary = cleanFont;
                    }
                  }
                });
              });
            }
          });
        } catch (e) {
          console.warn(':warning: Failed to extract fonts from CSS/links:', e);
        }
       
        // Method 1: Get fonts from all elements (but prioritize declared fonts)
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const styles = getComputedStyle(el);
          if (styles.fontFamily && styles.fontFamily !== 'inherit') {
            // Clean and add fonts
            styles.fontFamily.split(',').forEach(font => {
              const cleanFont = font.trim().replace(/['"]/g, '');
              // Skip generic and system fonts
              if (cleanFont && cleanFont !== 'serif' && cleanFont !== 'sans-serif' && cleanFont !== 'monospace' &&
                  !cleanFont.includes('ui-') && !cleanFont.includes('system-') &&
                  cleanFont !== 'cursive' && cleanFont !== 'fantasy') {
               
                fontSet.add(cleanFont);
               
                // Prioritize declared fonts from CSS
                if (declaredFonts.has(cleanFont)) {
                  if (!fontData.primary || !declaredFonts.has(fontData.primary)) {
                    fontData.primary = cleanFont;
                  } else if (!fontData.secondary && cleanFont !== fontData.primary) {
                    fontData.secondary = cleanFont;
                  }
                } else if (!fontData.primary) {
                  fontData.primary = cleanFont;
                } else if (!fontData.secondary && cleanFont !== fontData.primary) {
                  fontData.secondary = cleanFont;
                }
              }
            });
           
            // Track weights
            if (styles.fontWeight) {
              fontData.weights.add(styles.fontWeight);
            }
            if (styles.fontSize) {
              fontData.fontSize.push(styles.fontSize);
            }
          }
        });
       
        // Ensure primary/secondary are from declared fonts if available
        if (declaredFonts.size > 0) {
          const declaredArray = Array.from(declaredFonts);
          if (declaredArray.length > 0 && (!fontData.primary || !declaredFonts.has(fontData.primary))) {
            fontData.primary = declaredArray[0];
          }
          if (declaredArray.length > 1 && (!fontData.secondary || !declaredFonts.has(fontData.secondary))) {
            fontData.secondary = declaredArray[1];
          }
        }
       
        // Method 2: Check body computed style if no fonts found
        if (fontSet.size === 0) {
          try {
            const bodyStyle = getComputedStyle(document.body);
            if (bodyStyle.fontFamily) {
              bodyStyle.fontFamily.split(',').forEach(font => {
                const cleanFont = font.trim().replace(/['"]/g, '');
                if (cleanFont && cleanFont !== 'serif' && cleanFont !== 'sans-serif' && cleanFont !== 'monospace' &&
                    !cleanFont.includes('ui-') && !cleanFont.includes('system-')) {
                  fontSet.add(cleanFont);
                  if (!fontData.primary) {
                    fontData.primary = cleanFont;
                  }
                }
              });
            }
           
            const htmlStyle = getComputedStyle(document.documentElement);
            if (htmlStyle.fontFamily && fontSet.size === 0) {
              htmlStyle.fontFamily.split(',').forEach(font => {
                const cleanFont = font.trim().replace(/['"]/g, '');
                if (cleanFont && cleanFont !== 'serif' && cleanFont !== 'sans-serif' && cleanFont !== 'monospace' &&
                    !cleanFont.includes('ui-') && !cleanFont.includes('system-')) {
                  fontSet.add(cleanFont);
                  if (!fontData.primary) {
                    fontData.primary = cleanFont;
                  }
                }
              });
            }
          } catch (e) {
            console.warn('Failed to get body/html styles');
          }
        }
       
        console.log(`:abc: Font detection found ${fontSet.size} fonts:`, Array.from(fontSet));
       
        return {
          fonts: Array.from(fontSet),
          primary: fontData.primary,
          secondary: fontData.secondary,
          weights: Array.from(fontData.weights),
          fontSize: Array.from(new Set(fontData.fontSize))
        };
      });

      // Extract elements
      const elements = await page.evaluate(() => {
        const elements = [];
        const selectors = [
          'h1, h2, h3, h4, h5, h6',
          'p, span, div',
          'a, button',
          'img',
          'header, footer, nav',
          'section, article'
        ];
       
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            elements.push({
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.slice(0, 100) || '',
              classes: el.className || '',
              id: el.id || ''
            });
          });
        });
       
        return elements;
      });

      return {
        url,
        colors,
        fonts: fonts.fonts || fonts, // Keep fonts array for compatibility
        typography: fonts, // Also include full typography object
        elements,
        viewport: { width: 1920, height: 1080 },
        timestamp: new Date().toISOString()
      };
     
    } catch (error) {
      console.error(':x: Data extraction failed:', error);
      throw error;
    }
  }
}