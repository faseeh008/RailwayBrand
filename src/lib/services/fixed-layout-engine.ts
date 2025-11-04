/**
 * Fixed Layout Engine for Brand Guidelines
 * Uses predefined templates with variable content injection
 */

import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import type { BrandData, StepData } from '$lib/types/presentation-agent';

export interface FixedLayoutTemplate {
  metadata: {
    template_name: string;
    version: string;
    description: string;
    slide_size: string;
    pixels_per_inch: number;
    total_slides: number;
  };
  layout_engine: {
    grid_system: {
      columns: number;
      gutter: number;
      margin: number;
    };
    typography: {
      primary_font: string;
      secondary_font: string;
      heading_sizes: Record<string, number>;
      line_height_multiplier: number;
    };
    color_system: Record<string, string>;
    spacing: Record<string, number>;
  };
  slide_templates: SlideTemplate[];
  content_extraction_rules: Record<string, Record<string, string>>;
  variable_mapping: Record<string, string>;
}

export interface SlideTemplate {
  template_name: string;
  slide_type: string;
  layout: {
    background: {
      type: string;
      colors?: string[];
      direction?: string;
      color?: string;
    };
    regions: LayoutRegion[];
  };
}

export interface LayoutRegion {
  type: string;
  role: string;
  position: { x: number; y: number; w: number; h: number };
  style: Record<string, any>;
  content_binding?: string;
  content?: LayoutRegion[];
}

export class FixedLayoutEngine {
  private template: FixedLayoutTemplate;
  private pptx: PptxGenJS;

  constructor(template: FixedLayoutTemplate) {
    this.template = template;
    this.pptx = new PptxGenJS();
    this.setupPresentation();
  }

  private setupPresentation() {
    this.pptx.layout = 'LAYOUT_16x9';
    this.pptx.author = 'EternaBrand AI';
    this.pptx.title = 'Brand Guidelines';
  }

  /**
   * Generate complete presentation with fixed layouts
   */
  async generatePresentation(
    stepHistory: StepData[],
    brandData: BrandData
  ): Promise<Buffer> {
    console.log('🎨 Generating presentation with fixed layouts...');
    
    // 1. Cover Slide
    await this.addCoverSlide(brandData);
    
    // 2. Content Slides (one per step)
    for (const [index, step] of stepHistory.entries()) {
      await this.addContentSlide(step, brandData, index);
    }
    
    // 3. Closing Slide
    await this.addClosingSlide(brandData);
    
    console.log(`✅ Generated ${this.pptx.slides.length} slides with fixed layouts`);
    
    return await this.pptx.write();
  }

  /**
   * Add cover slide with fixed layout
   */
  private async addCoverSlide(brandData: BrandData) {
    const template = this.template.slide_templates.find(t => t.template_name === 'cover_slide');
    if (!template) throw new Error('Cover slide template not found');

    const slide = this.pptx.addSlide();
    
    // Set background
    this.setBackground(slide, template.layout.background);
    
    // Add regions
    for (const region of template.layout.regions) {
      await this.addRegion(slide, region, brandData, null);
    }
  }

  /**
   * Add content slide with fixed layout based on step type
   */
  private async addContentSlide(step: StepData, brandData: BrandData, index: number) {
    const templateName = this.getTemplateNameForStep(step.step);
    const template = this.template.slide_templates.find(t => t.template_name === templateName);
    
    if (!template) {
      console.warn(`Template not found for step: ${step.step}, using default`);
      return;
    }

    const slide = this.pptx.addSlide();
    
    // Set background
    this.setBackground(slide, template.layout.background);
    
    // Extract content based on step type
    const extractedContent = this.extractContentFromStep(step);
    
    // Add regions
    for (const region of template.layout.regions) {
      await this.addRegion(slide, region, brandData, step, extractedContent);
    }
  }

  /**
   * Add closing slide with fixed layout
   */
  private async addClosingSlide(brandData: BrandData) {
    const template = this.template.slide_templates.find(t => t.template_name === 'closing_slide');
    if (!template) throw new Error('Closing slide template not found');

    const slide = this.pptx.addSlide();
    
    // Set background
    this.setBackground(slide, template.layout.background);
    
    // Add regions
    for (const region of template.layout.regions) {
      await this.addRegion(slide, region, brandData, null);
    }
  }

  /**
   * Determine template name based on step type
   */
  private getTemplateNameForStep(stepType: string): string {
    const templateMap: Record<string, string> = {
      'brand-positioning': 'brand_positioning_slide',
      'logo-guidelines': 'logo_guidelines_slide',
      'color-palette': 'color_palette_slide',
      'typography': 'typography_slide',
      'iconography': 'iconography_slide',
      'photography': 'photography_slide',
      'applications': 'applications_slide'
    };
    
    return templateMap[stepType] || 'brand_positioning_slide';
  }

  /**
   * Extract structured content from step data
   */
  private extractContentFromStep(step: StepData): Record<string, any> {
    const content = step.content || '';
    const stepType = step.step;
    
    const extractionRules = this.template.content_extraction_rules[stepType];
    if (!extractionRules) return {};

    const extracted: Record<string, any> = {};
    
    // Extract based on patterns
    for (const [key, pattern] of Object.entries(extractionRules)) {
      const regex = new RegExp(pattern, 'i');
      const match = content.match(regex);
      if (match) {
        extracted[key] = match[1]?.trim() || '';
      }
    }
    
    // Special handling for different step types
    switch (stepType) {
      case 'brand-positioning':
        extracted.mission = this.extractMission(content);
        extracted.vision = this.extractVision(content);
        extracted.values = this.extractValues(content);
        break;
        
      case 'color-palette':
        extracted.primaryColor = this.extractPrimaryColor(content);
        extracted.secondaryColor = this.extractSecondaryColor(content);
        extracted.accentColor = this.extractAccentColor(content);
        extracted.neutralColor = this.extractNeutralColor(content);
        extracted.colorNames = this.extractColorNames(content);
        extracted.colorUsage = this.extractColorUsage(content);
        break;
        
      case 'typography':
        extracted.primaryFont = this.extractPrimaryFont(content);
        extracted.secondaryFont = this.extractSecondaryFont(content);
        extracted.primaryFontFamily = this.extractFontFamily(extracted.primaryFont);
        extracted.secondaryFontFamily = this.extractFontFamily(extracted.secondaryFont);
        break;
    }
    
    return extracted;
  }

  /**
   * Add a region to the slide
   */
  private async addRegion(
    slide: any,
    region: LayoutRegion,
    brandData: BrandData,
    stepData: StepData | null,
    extractedContent: Record<string, any> = {}
  ) {
    const content = this.resolveContentBinding(region.content_binding, brandData, stepData, extractedContent);
    
    switch (region.type) {
      case 'text':
        this.addTextRegion(slide, region, content);
        break;
      case 'logo':
        await this.addLogoRegion(slide, region, content);
        break;
      case 'image':
        await this.addImageRegion(slide, region, content);
        break;
      case 'color_swatch':
        this.addColorSwatchRegion(slide, region, content);
        break;
      case 'card':
        this.addCardRegion(slide, region, content);
        break;
      case 'divider':
        this.addDividerRegion(slide, region);
        break;
      case 'icon_grid':
        this.addIconGridRegion(slide, region, content);
        break;
    }
  }

  /**
   * Resolve content binding to actual content
   */
  private resolveContentBinding(
    binding: string | undefined,
    brandData: BrandData,
    stepData: StepData | null,
    extractedContent: Record<string, any>
  ): string {
    if (!binding) return '';
    
    // Handle special cases
    if (binding === '{{BRAND_NAME}}') return brandData.brandName || 'Brand';
    if (binding === '{{CURRENT_DATE}}') return new Date().toLocaleDateString();
    if (binding === '{{STEP_TITLE}}') return stepData?.title || 'Content';
    if (binding === '{{BRAND_LOGO}}') return brandData.logoFiles?.[0]?.fileData || '';
    
    // Handle extracted content
    const key = binding.replace(/[{}]/g, '').toLowerCase();
    if (extractedContent[key]) return extractedContent[key];
    
    return binding;
  }

  /**
   * Add text region
   */
  private addTextRegion(slide: any, region: LayoutRegion, content: string) {
    if (!content) return;
    
    slide.addText(content, {
      x: region.position.x,
      y: region.position.y,
      w: region.position.w,
      h: region.position.h,
      fontSize: region.style.fontSize,
      fontFace: region.style.fontFamily,
      color: region.style.color,
      bold: region.style.fontWeight === 'bold',
      italic: region.style.fontStyle === 'italic',
      align: region.style.textAlign,
      valign: 'middle'
    });
  }

  /**
   * Add logo region
   */
  private async addLogoRegion(slide: any, region: LayoutRegion, logoData: string) {
    if (!logoData) return;
    
    try {
      slide.addImage({
        data: logoData,
        x: region.position.x,
        y: region.position.y,
        w: region.position.w,
        h: region.position.h
      });
    } catch (error) {
      console.warn('Failed to add logo:', error);
    }
  }

  /**
   * Add image region
   */
  private async addImageRegion(slide: any, region: LayoutRegion, imageData: string) {
    if (!imageData) return;
    
    try {
      slide.addImage({
        data: imageData,
        x: region.position.x,
        y: region.position.y,
        w: region.position.w,
        h: region.position.h
      });
    } catch (error) {
      console.warn('Failed to add image:', error);
    }
  }

  /**
   * Add color swatch region
   */
  private addColorSwatchRegion(slide: any, region: LayoutRegion, color: string) {
    if (!color) return;
    
    // Add colored rectangle
    slide.addShape('rect', {
      x: region.position.x,
      y: region.position.y,
      w: region.position.w,
      h: region.position.h,
      fill: { color: color },
      line: { color: '#E0E0E0', width: 2 }
    });
    
    // Add color code text
    slide.addText(color, {
      x: region.position.x,
      y: region.position.y + region.position.h + 0.1,
      w: region.position.w,
      h: 0.3,
      fontSize: 12,
      color: '#666666',
      align: 'center'
    });
  }

  /**
   * Add card region (background with border)
   */
  private addCardRegion(slide: any, region: LayoutRegion, content: string) {
    // Add card background
    slide.addShape('rect', {
      x: region.position.x,
      y: region.position.y,
      w: region.position.w,
      h: region.position.h,
      fill: { color: region.style.backgroundColor || '#F8F8F8' },
      line: { color: '#E0E0E0', width: 1 }
    });
    
    // Add content if it's a simple card
    if (content && !region.content) {
      slide.addText(content, {
        x: region.position.x + 0.2,
        y: region.position.y + 0.2,
        w: region.position.w - 0.4,
        h: region.position.h - 0.4,
        fontSize: 14,
        color: '#2C2C2C',
        valign: 'top'
      });
    }
  }

  /**
   * Add divider region
   */
  private addDividerRegion(slide: any, region: LayoutRegion) {
    slide.addShape('line', {
      x: region.position.x,
      y: region.position.y,
      w: region.position.w,
      h: 0,
      line: { 
        color: region.style.color || '#8B4513', 
        width: region.style.thickness || 3 
      }
    });
  }

  /**
   * Add icon grid region
   */
  private addIconGridRegion(slide: any, region: LayoutRegion, icons: string[]) {
    if (!icons || icons.length === 0) return;
    
    const cols = region.style.gridColumns || 6;
    const rows = region.style.gridRows || 2;
    const iconSize = region.style.iconSize || 1.2;
    const spacing = region.style.spacing || 0.3;
    
    const cellWidth = region.position.w / cols;
    const cellHeight = region.position.h / rows;
    
    icons.slice(0, cols * rows).forEach((icon, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = region.position.x + col * cellWidth + (cellWidth - iconSize) / 2;
      const y = region.position.y + row * cellHeight + (cellHeight - iconSize) / 2;
      
      // Add icon placeholder (you can replace with actual icon rendering)
      slide.addShape('rect', {
        x: x,
        y: y,
        w: iconSize,
        h: iconSize,
        fill: { color: '#E0E0E0' },
        line: { color: '#CCCCCC', width: 1 }
      });
    });
  }

  /**
   * Set slide background
   */
  private setBackground(slide: any, background: any) {
    if (background.type === 'gradient') {
      slide.background = {
        fill: {
          type: 'gradient',
          angle: background.direction === 'diagonal' ? 45 : 0,
          stops: background.colors.map((color: string, index: number) => ({
            position: index * 100,
            color: color
          }))
        }
      };
    } else if (background.type === 'solid') {
      slide.background = {
        fill: { color: background.color }
      };
    }
  }

  // Content extraction helper methods
  private extractMission(content: string): string {
    const patterns = [
      /mission[:\s]*([^\n]+)/i,
      /our mission[:\s]*([^\n]+)/i,
      /mission statement[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Our mission is to deliver exceptional value to our customers.';
  }

  private extractVision(content: string): string {
    const patterns = [
      /vision[:\s]*([^\n]+)/i,
      /our vision[:\s]*([^\n]+)/i,
      /vision statement[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'To be the leading provider in our industry.';
  }

  private extractValues(content: string): string {
    const patterns = [
      /values?[:\s]*([^\n]+)/i,
      /core values?[:\s]*([^\n]+)/i,
      /our values?[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Integrity, Innovation, Excellence, Customer Focus';
  }

  private extractPrimaryColor(content: string): string {
    const patterns = [
      /primary[:\s]*#([A-Fa-f0-9]{6})/i,
      /main color[:\s]*#([A-Fa-f0-9]{6})/i,
      /brand color[:\s]*#([A-Fa-f0-9]{6})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `#${match[1]}`;
    }
    
    return '#2C504D';
  }

  private extractSecondaryColor(content: string): string {
    const patterns = [
      /secondary[:\s]*#([A-Fa-f0-9]{6})/i,
      /accent[:\s]*#([A-Fa-f0-9]{6})/i,
      /second color[:\s]*#([A-Fa-f0-9]{6})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `#${match[1]}`;
    }
    
    return '#8B4513';
  }

  private extractAccentColor(content: string): string {
    const patterns = [
      /accent[:\s]*#([A-Fa-f0-9]{6})/i,
      /highlight[:\s]*#([A-Fa-f0-9]{6})/i,
      /tertiary[:\s]*#([A-Fa-f0-9]{6})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `#${match[1]}`;
    }
    
    return '#D2B48C';
  }

  private extractNeutralColor(content: string): string {
    const patterns = [
      /neutral[:\s]*#([A-Fa-f0-9]{6})/i,
      /gray[:\s]*#([A-Fa-f0-9]{6})/i,
      /grey[:\s]*#([A-Fa-f0-9]{6})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return `#${match[1]}`;
    }
    
    return '#6B6B6B';
  }

  private extractColorNames(content: string): string {
    const colors = [
      this.extractPrimaryColor(content),
      this.extractSecondaryColor(content),
      this.extractAccentColor(content),
      this.extractNeutralColor(content)
    ];
    
    return colors.join(' • ');
  }

  private extractColorUsage(content: string): string {
    // Extract usage guidelines from content
    const lines = content.split('\n').filter(line => 
      line.toLowerCase().includes('usage') || 
      line.toLowerCase().includes('guideline') ||
      line.toLowerCase().includes('rule')
    );
    
    return lines.slice(0, 3).join(' • ') || 'Use primary colors for main elements, secondary for accents.';
  }

  private extractPrimaryFont(content: string): string {
    const patterns = [
      /primary font[:\s]*([^\n]+)/i,
      /main font[:\s]*([^\n]+)/i,
      /heading font[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Montserrat';
  }

  private extractSecondaryFont(content: string): string {
    const patterns = [
      /secondary font[:\s]*([^\n]+)/i,
      /body font[:\s]*([^\n]+)/i,
      /text font[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Open Sans';
  }

  private extractFontFamily(fontName: string): string {
    // Map common font names to font families
    const fontMap: Record<string, string> = {
      'montserrat': 'Montserrat',
      'open sans': 'Open Sans',
      'roboto': 'Roboto',
      'lato': 'Lato',
      'poppins': 'Poppins',
      'inter': 'Inter',
      'helvetica': 'Helvetica',
      'arial': 'Arial'
    };
    
    return fontMap[fontName.toLowerCase()] || fontName;
  }
}

/**
 * Load template and create layout engine
 */
export async function createFixedLayoutEngine(): Promise<FixedLayoutEngine> {
  try {
    // Load template from file
    const templatePath = '/home/pc/folder1/AI-Brand-Guideline-Assistant/brand-guidelines-template.json';
    const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    const template = templateData as FixedLayoutTemplate;
    
    return new FixedLayoutEngine(template);
  } catch (error) {
    console.error('Failed to load template:', error);
    throw new Error('Template loading failed');
  }
}

/**
 * Generate presentation with fixed layouts
 */
export async function generateFixedLayoutPresentation(
  stepHistory: StepData[],
  brandData: BrandData
): Promise<Buffer> {
  const engine = await createFixedLayoutEngine();
  return await engine.generatePresentation(stepHistory, brandData);
}
