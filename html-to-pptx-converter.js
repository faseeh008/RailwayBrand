/**
 * HTML to PPTX Converter for Brand Guidelines
 * Converts professional HTML templates to PowerPoint slides
 */

import puppeteer from 'puppeteer';
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sampleBrandInput } from './brand-input-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Replace template variables with brand data
 * @param {string} html - HTML template content
 * @param {object} brandInput - Brand input data
 * @returns {string} - HTML with replaced variables
 */
function replaceTemplateVars(html, brandInput) {
  let result = html;
  
  // ============================================
  // SLIDE 1: COVER
  // ============================================
  result = result.replace(/\{\{BRAND_NAME\}\}/g, brandInput.brandName || 'Your Brand');
  result = result.replace(/\{\{TAGLINE\}\}/g, brandInput.tagline || 'Brand Guidelines');
  result = result.replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  
  // ============================================
  // SLIDE 2: BRAND POSITIONING
  // ============================================
  result = result.replace(/\{\{TITLE\}\}/g, 'Brand Positioning');
  result = result.replace(/\{\{MISSION\}\}/g, brandInput.mission || 'Our mission statement');
  result = result.replace(/\{\{VISION\}\}/g, brandInput.vision || 'Our vision statement');
  result = result.replace(/\{\{VALUES\}\}/g, 
    Array.isArray(brandInput.values) 
      ? brandInput.values.join(' • ') 
      : brandInput.values || 'Innovation • Excellence'
  );
  result = result.replace(/\{\{PERSONALITY\}\}/g, brandInput.personality || 'Our brand personality');
  
  // ============================================
  // SLIDE 3: LOGO GUIDELINES
  // ============================================
  // Logo is handled as placeholder with brand name
  
  // ============================================
  // SLIDE 4: COLOR PALETTE
  // ============================================
  const colors = brandInput.colors || {};
  
  // Primary Color
  const primary = colors.primary || { hex: '#2563EB', name: 'Primary', rgb: 'RGB(37, 99, 235)', usage: 'Main brand color' };
  result = result.replace(/\{\{PRIMARY_COLOR\}\}/g, primary.hex);
  result = result.replace(/\{\{PRIMARY_NAME\}\}/g, primary.name);
  result = result.replace(/\{\{PRIMARY_HEX\}\}/g, primary.hex);
  result = result.replace(/\{\{PRIMARY_RGB\}\}/g, primary.rgb || '');
  result = result.replace(/\{\{PRIMARY_USAGE\}\}/g, primary.usage || 'Main brand color');
  
  // Secondary Color
  const secondary = colors.secondary || { hex: '#7C3AED', name: 'Secondary', rgb: 'RGB(124, 58, 237)', usage: 'Accent color' };
  result = result.replace(/\{\{SECONDARY_COLOR\}\}/g, secondary.hex);
  result = result.replace(/\{\{SECONDARY_NAME\}\}/g, secondary.name);
  result = result.replace(/\{\{SECONDARY_HEX\}\}/g, secondary.hex);
  result = result.replace(/\{\{SECONDARY_RGB\}\}/g, secondary.rgb || '');
  result = result.replace(/\{\{SECONDARY_USAGE\}\}/g, secondary.usage || 'Accent color');
  
  // Accent Color
  const accent = colors.accent || { hex: '#10B981', name: 'Accent', rgb: 'RGB(16, 185, 129)', usage: 'Highlights' };
  result = result.replace(/\{\{ACCENT_COLOR\}\}/g, accent.hex);
  result = result.replace(/\{\{ACCENT_NAME\}\}/g, accent.name);
  result = result.replace(/\{\{ACCENT_HEX\}\}/g, accent.hex);
  result = result.replace(/\{\{ACCENT_RGB\}\}/g, accent.rgb || '');
  result = result.replace(/\{\{ACCENT_USAGE\}\}/g, accent.usage || 'Highlights');
  
  // Neutral Color
  const neutral = colors.neutral || { hex: '#6B7280', name: 'Neutral', rgb: 'RGB(107, 114, 128)', usage: 'Text and borders' };
  result = result.replace(/\{\{NEUTRAL_COLOR\}\}/g, neutral.hex);
  result = result.replace(/\{\{NEUTRAL_NAME\}\}/g, neutral.name);
  result = result.replace(/\{\{NEUTRAL_HEX\}\}/g, neutral.hex);
  result = result.replace(/\{\{NEUTRAL_RGB\}\}/g, neutral.rgb || '');
  result = result.replace(/\{\{NEUTRAL_USAGE\}\}/g, neutral.usage || 'Text and borders');
  
  // ============================================
  // SLIDE 5: TYPOGRAPHY
  // ============================================
  const typo = brandInput.typography || {};
  const primaryFont = typo.primaryFont || { name: 'Arial', weights: ['Regular', 'Bold'], usage: 'Headlines' };
  const secondaryFont = typo.secondaryFont || { name: 'Arial', weights: ['Regular'], usage: 'Body text' };
  
  result = result.replace(/\{\{PRIMARY_FONT\}\}/g, primaryFont.name);
  result = result.replace(/\{\{PRIMARY_FONT_WEIGHTS\}\}/g, 
    Array.isArray(primaryFont.weights) ? primaryFont.weights.join(', ') : primaryFont.weights || 'Regular, Bold'
  );
  result = result.replace(/\{\{PRIMARY_FONT_USAGE\}\}/g, primaryFont.usage || 'Headlines');
  
  result = result.replace(/\{\{SECONDARY_FONT\}\}/g, secondaryFont.name);
  result = result.replace(/\{\{SECONDARY_FONT_WEIGHTS\}\}/g, 
    Array.isArray(secondaryFont.weights) ? secondaryFont.weights.join(', ') : secondaryFont.weights || 'Regular'
  );
  result = result.replace(/\{\{SECONDARY_FONT_USAGE\}\}/g, secondaryFont.usage || 'Body text');
  
  // ============================================
  // SLIDE 6-8: Iconography, Photography, Applications
  // ============================================
  // These use predefined layouts with minimal variables
  
  // ============================================
  // SLIDE 9: THANK YOU / CONTACT
  // ============================================
  const contact = brandInput.contact || {};
  result = result.replace(/\{\{CONTACT_WEBSITE\}\}/g, contact.website || '');
  result = result.replace(/\{\{CONTACT_EMAIL\}\}/g, contact.email || '');
  result = result.replace(/\{\{CONTACT_PHONE\}\}/g, contact.phone ? `<br>${contact.phone}` : '');
  result = result.replace(/\{\{DOMAIN\}\}/g, contact.website || 'your-website.com');
  
  return result;
}

// Convert HTML to image using Puppeteer
async function htmlToImage(htmlPath, outputPath, brandInput) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport to match slide dimensions (16:9 ratio)
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 2 // Higher quality
    });
    
    // Read and process HTML
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = replaceTemplateVars(html, brandInput);
    
    // Load HTML
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for any additional content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false
    });
    
    console.log(`✓ Generated: ${path.basename(outputPath)}`);
    
  } finally {
    await browser.close();
  }
}

// Create PPTX from images
async function createPptxFromImages(imageFiles, outputPath, brandInput) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'EternaBrand AI';
  pptx.title = `${brandInput.brandName} Brand Guidelines`;
  
  for (const imageFile of imageFiles) {
    const slide = pptx.addSlide();
    
    // Add image as background (full slide)
    slide.addImage({
      path: imageFile,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%'
    });
  }
  
  const buffer = await pptx.write('nodebuffer');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`\n✅ PPTX created: ${outputPath}`);
  console.log(`   Slides: ${imageFiles.length}`);
  console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
}

/**
 * Main conversion function
 * @param {object} brandInput - Brand input data (optional, uses sample data if not provided)
 * @returns {Promise<string>} - Path to generated PPTX file
 */
async function convertHtmlToPptx(brandInput = null) {
  // Use provided brand input or default to sample
  const input = brandInput || sampleBrandInput;
  
  console.log('🎨 HTML to PPTX Converter Starting...');
  console.log(`📋 Brand: ${input.brandName}\n`);
  
  const templatesDir = path.join(__dirname, 'templates', 'html');
  const imagesDir = path.join(__dirname, 'templates', 'images');
  const outputDir = path.join(__dirname, 'test-output');
  
  // Create directories
  [imagesDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // HTML template files (in order) - All 9 slides
  const templates = [
    'slide-01-cover.html',                // Opening
    'slide-02-brand-positioning.html',    // Content 1
    'slide-03-logo-guidelines.html',      // Content 2
    'slide-04-color-palette.html',        // Content 3
    'slide-05-typography.html',           // Content 4
    'slide-06-iconography.html',          // Content 5
    'slide-07-photography.html',          // Content 6
    'slide-08-applications.html',         // Content 7
    'slide-09-thank-you.html'             // Closing
  ];
  
  console.log('📸 Converting HTML templates to images...\n');
  
  // Convert each HTML to image
  const imageFiles = [];
  for (let i = 0; i < templates.length; i++) {
    const htmlPath = path.join(templatesDir, templates[i]);
    const imagePath = path.join(imagesDir, `slide-${i + 1}.png`);
    
    if (fs.existsSync(htmlPath)) {
      await htmlToImage(htmlPath, imagePath, input);
      imageFiles.push(imagePath);
    } else {
      console.log(`⚠️  Template not found: ${templates[i]}`);
    }
  }
  
  console.log('\n📊 Creating PPTX presentation...\n');
  
  // Create PPTX with brand name
  const sanitizedName = input.brandName.replace(/[^a-zA-Z0-9]/g, '-');
  const pptxPath = path.join(outputDir, `${sanitizedName}-Brand-Guidelines.pptx`);
  await createPptxFromImages(imageFiles, pptxPath, input);
  
  console.log('\n🎯 Features:');
  console.log('   ✅ Professional HTML templates');
  console.log('   ✅ Perfect layout control');
  console.log('   ✅ High-quality rendering');
  console.log('   ✅ NO text overflow');
  console.log('   ✅ Pixel-perfect design');
  console.log('   ✅ Fully customizable with brand data');
  
  console.log('\n✨ Done! Open the PPTX file to see the results.');
  
  return pptxPath;
}

// Export for use as module
export { convertHtmlToPptx, replaceTemplateVars };

// Run the converter if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  convertHtmlToPptx().catch(error => {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}
