import archiver from 'archiver';
import { createWriteStream, readFileSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import type { BrandGuidelinesSpec } from '$lib/types/brand-guidelines';

export interface AssetsGenerationOptions {
	brandGuidelines: BrandGuidelinesSpec;
	logoFiles: Array<{ filename: string; filePath: string; usageTag: string }>;
	outputPath?: string;
}

export class AssetsGenerator {
	private brandGuidelines: BrandGuidelinesSpec;
	private logoFiles: Array<{ filename: string; filePath: string; usageTag: string }>;

	constructor(options: AssetsGenerationOptions) {
		this.brandGuidelines = options.brandGuidelines;
		this.logoFiles = options.logoFiles || [];
	}

	async generateAssetsZip(): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			const archive = archiver('zip', { zlib: { level: 9 } });

			archive.on('data', (chunk) => {
				chunks.push(chunk);
			});

			archive.on('end', () => {
				const buffer = Buffer.concat(chunks);
				resolve(buffer);
			});

			archive.on('error', (err) => {
				reject(err);
			});

			// Add all assets to the archive
			this.addLogosToArchive(archive);
			this.addColorSpecsToArchive(archive);
			this.addTypographySpecsToArchive(archive);
			this.addBrandSpecToArchive(archive);
			this.addReadmeToArchive(archive);

			// Finalize the archive
			archive.finalize();
		});
	}

	private addLogosToArchive(archive: archiver.Archiver): void {
		// Create logos directory
		archive.append(null, { name: 'logos/' });

		this.logoFiles.forEach((logoFile) => {
			try {
				if (existsSync(logoFile.filePath)) {
					const fileBuffer = readFileSync(logoFile.filePath);
					const fileName = this.sanitizeFileName(logoFile.filename);
					archive.append(fileBuffer, { name: `logos/${fileName}` });
				} else {
					console.warn(`Logo file not found: ${logoFile.filePath}`);
				}
			} catch (error) {
				console.error(`Error adding logo ${logoFile.filename}:`, error);
			}
		});

		// Add logo usage guide
		const logoUsageGuide = this.generateLogoUsageGuide();
		archive.append(logoUsageGuide, { name: 'logos/README.md' });
	}

	private addColorSpecsToArchive(archive: archiver.Archiver): void {
		// Create colors directory
		archive.append(null, { name: 'colors/' });

		// Generate colors.json
		const colorsSpec = {
			brand_name: this.brandGuidelines.brand_name,
			primary_palette: this.brandGuidelines.colors.primary_palette,
			secondary_palette: this.brandGuidelines.colors.secondary_palette,
			gradients: this.brandGuidelines.colors.gradients,
			usage_guidelines: this.brandGuidelines.colors.usage_guidelines,
			accessibility_notes: this.brandGuidelines.colors.accessibility_notes,
			generated_at: new Date().toISOString()
		};

		archive.append(JSON.stringify(colorsSpec, null, 2), {
			name: `colors/${this.brandGuidelines.brand_name}_colors.json`
		});

		// Generate CSS variables file
		const cssVariables = this.generateCSSVariables();
		archive.append(cssVariables, {
			name: `colors/${this.brandGuidelines.brand_name}_colors.css`
		});

		// Generate SCSS variables file
		const scssVariables = this.generateSCSSVariables();
		archive.append(scssVariables, {
			name: `colors/${this.brandGuidelines.brand_name}_colors.scss`
		});

		// Generate Adobe Swatch Exchange (ASE) file placeholder
		const aseContent = this.generateASEFile();
		archive.append(aseContent, {
			name: `colors/${this.brandGuidelines.brand_name}_colors.ase`
		});
	}

	private addTypographySpecsToArchive(archive: archiver.Archiver): void {
		// Create typography directory
		archive.append(null, { name: 'typography/' });

		// Generate typography.json
		const typographySpec = {
			brand_name: this.brandGuidelines.brand_name,
			primary_font: this.brandGuidelines.typography.primary_font,
			secondary_font: this.brandGuidelines.typography.secondary_font,
			web_font_stack: this.brandGuidelines.typography.web_font_stack,
			sizes: this.brandGuidelines.typography.sizes,
			hierarchy_rules: this.brandGuidelines.typography.hierarchy_rules,
			sample_text: this.brandGuidelines.typography.sample_text,
			generated_at: new Date().toISOString()
		};

		archive.append(JSON.stringify(typographySpec, null, 2), {
			name: `typography/${this.brandGuidelines.brand_name}_typography.json`
		});

		// Generate CSS typography file
		const cssTypography = this.generateCSSTypography();
		archive.append(cssTypography, {
			name: `typography/${this.brandGuidelines.brand_name}_typography.css`
		});

		// Generate SCSS typography file
		const scssTypography = this.generateSCSSTypography();
		archive.append(scssTypography, {
			name: `typography/${this.brandGuidelines.brand_name}_typography.scss`
		});
	}

	private addBrandSpecToArchive(archive: archiver.Archiver): void {
		// Add the complete brand guidelines JSON
		const brandSpec = {
			...this.brandGuidelines,
			generated_at: new Date().toISOString(),
			version: '1.0'
		};

		archive.append(JSON.stringify(brandSpec, null, 2), {
			name: `${this.brandGuidelines.brand_name}_brand_guidelines.json`
		});

		// Generate a human-readable markdown version
		const markdownSpec = this.generateMarkdownSpec();
		archive.append(markdownSpec, {
			name: `${this.brandGuidelines.brand_name}_brand_guidelines.md`
		});
	}

	private addReadmeToArchive(archive: archiver.Archiver): void {
		const readmeContent = this.generateReadme();
		archive.append(readmeContent, { name: 'README.md' });
	}

	private generateLogoUsageGuide(): string {
		return `# Logo Usage Guide

## Available Logo Files

${this.logoFiles.map((logo) => `- **${logo.filename}** (${logo.usageTag})`).join('\n')}

## Usage Guidelines

${this.brandGuidelines.logo.usage_rules.map((rule) => `- ${rule}`).join('\n')}

## Clear Space Requirements

- **Measurement Method**: ${this.brandGuidelines.logo.clear_space.measurement_method}
- **Minimum Clear Space**: ${this.brandGuidelines.logo.clear_space.minimum_clear_space}
- **Description**: ${this.brandGuidelines.logo.clear_space.visual_guide_description}

## Minimum Sizes

- **Print Minimum**: ${this.brandGuidelines.logo.minimum_sizes.print_minimum}
- **Digital Minimum**: ${this.brandGuidelines.logo.minimum_sizes.digital_minimum}
- **Measurement**: ${this.brandGuidelines.logo.minimum_sizes.measurement_method}

## Color Variants

${this.brandGuidelines.logo.color_variants
	.map(
		(variant) => `- **${variant.variant_name}**: ${variant.hex_color} - ${variant.usage_context}`
	)
	.join('\n')}

## Do's and Don'ts

### Do's
${this.brandGuidelines.dos_and_donts.dos.map((doItem) => `- ${doItem.description}`).join('\n')}

### Don'ts
${this.brandGuidelines.dos_and_donts.donts
	.map((dontItem) => `- ${dontItem.description}`)
	.join('\n')}

---
*Generated on ${new Date().toLocaleDateString()}*
`;
	}

	private generateCSSVariables(): string {
		let css = `/* ${this.brandGuidelines.brand_name} Color Variables */\n\n`;
		css += `:root {\n`;

		// Primary colors
		this.brandGuidelines.colors.primary_palette.forEach((color, index) => {
			const varName = `--color-primary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			css += `  ${varName}: ${color.hex};\n`;
			css += `  ${varName}-rgb: ${color.rgb};\n`;
		});

		// Secondary colors
		this.brandGuidelines.colors.secondary_palette.forEach((color, index) => {
			const varName = `--color-secondary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			css += `  ${varName}: ${color.hex};\n`;
			css += `  ${varName}-rgb: ${color.rgb};\n`;
		});

		css += `}\n\n`;

		// Usage classes
		css += `/* Usage Classes */\n`;
		css += `.text-primary { color: var(--color-primary-1); }\n`;
		css += `.bg-primary { background-color: var(--color-primary-1); }\n`;
		css += `.text-secondary { color: var(--color-secondary-1); }\n`;
		css += `.bg-secondary { background-color: var(--color-secondary-1); }\n`;

		return css;
	}

	private generateSCSSVariables(): string {
		let scss = `// ${this.brandGuidelines.brand_name} Color Variables\n\n`;

		// Primary colors
		this.brandGuidelines.colors.primary_palette.forEach((color, index) => {
			const varName = `$color-primary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			scss += `${varName}: ${color.hex};\n`;
		});

		scss += `\n`;

		// Secondary colors
		this.brandGuidelines.colors.secondary_palette.forEach((color, index) => {
			const varName = `$color-secondary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			scss += `${varName}: ${color.hex};\n`;
		});

		scss += `\n`;

		// Color maps
		scss += `$primary-colors: (\n`;
		this.brandGuidelines.colors.primary_palette.forEach((color, index) => {
			const varName = `primary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			scss += `  "${varName}": ${color.hex},\n`;
		});
		scss += `);\n\n`;

		scss += `$secondary-colors: (\n`;
		this.brandGuidelines.colors.secondary_palette.forEach((color, index) => {
			const varName = `secondary-${index + 1}`.toLowerCase().replace(/\s+/g, '-');
			scss += `  "${varName}": ${color.hex},\n`;
		});
		scss += `);\n`;

		return scss;
	}

	private generateASEFile(): string {
		// This is a placeholder for Adobe Swatch Exchange format
		// In a real implementation, you would use a library like 'ase-utils' to generate proper ASE files
		return `Adobe Swatch Exchange file for ${this.brandGuidelines.brand_name}
This is a placeholder file. In production, use a proper ASE library to generate this file.

Colors:
${this.brandGuidelines.colors.primary_palette
	.map((color) => `${color.name}: ${color.hex} (RGB: ${color.rgb}, CMYK: ${color.cmyk})`)
	.join('\n')}

${this.brandGuidelines.colors.secondary_palette
	.map((color) => `${color.name}: ${color.hex} (RGB: ${color.rgb}, CMYK: ${color.cmyk})`)
	.join('\n')}
`;
	}

	private generateCSSTypography(): string {
		let css = `/* ${this.brandGuidelines.brand_name} Typography */\n\n`;

		// Font imports
		if (this.brandGuidelines.typography.primary_font.web_link) {
			css += `@import url('${this.brandGuidelines.typography.primary_font.web_link}');\n`;
		}
		if (this.brandGuidelines.typography.secondary_font.web_link) {
			css += `@import url('${this.brandGuidelines.typography.secondary_font.web_link}');\n`;
		}

		css += `\n`;

		// Font variables
		css += `:root {\n`;
		css += `  --font-primary: "${this.brandGuidelines.typography.primary_font.name}", ${this.brandGuidelines.typography.primary_font.fallback_suggestions.join(', ')};\n`;
		css += `  --font-secondary: "${this.brandGuidelines.typography.secondary_font.name}", ${this.brandGuidelines.typography.secondary_font.fallback_suggestions.join(', ')};\n`;
		css += `  --font-stack: ${this.brandGuidelines.typography.web_font_stack};\n`;
		css += `}\n\n`;

		// Typography classes
		css += `/* Typography Classes */\n`;
		css += `.font-primary { font-family: var(--font-primary); }\n`;
		css += `.font-secondary { font-family: var(--font-secondary); }\n\n`;

		// Size classes
		const sizes = this.brandGuidelines.typography.sizes;
		css += `.text-h1 { font-size: ${sizes.h1}; font-family: var(--font-primary); font-weight: bold; }\n`;
		css += `.text-h2 { font-size: ${sizes.h2}; font-family: var(--font-primary); font-weight: bold; }\n`;
		css += `.text-h3 { font-size: ${sizes.h3}; font-family: var(--font-primary); font-weight: bold; }\n`;
		css += `.text-body { font-size: ${sizes.body}; font-family: var(--font-secondary); }\n`;
		css += `.text-caption { font-size: ${sizes.caption}; font-family: var(--font-secondary); }\n`;

		return css;
	}

	private generateSCSSTypography(): string {
		let scss = `// ${this.brandGuidelines.brand_name} Typography\n\n`;

		// Font imports
		if (this.brandGuidelines.typography.primary_font.web_link) {
			scss += `@import url('${this.brandGuidelines.typography.primary_font.web_link}');\n`;
		}
		if (this.brandGuidelines.typography.secondary_font.web_link) {
			scss += `@import url('${this.brandGuidelines.typography.secondary_font.web_link}');\n`;
		}

		scss += `\n`;

		// Font variables
		scss += `$font-primary: "${this.brandGuidelines.typography.primary_font.name}", ${this.brandGuidelines.typography.primary_font.fallback_suggestions.join(', ')};\n`;
		scss += `$font-secondary: "${this.brandGuidelines.typography.secondary_font.name}", ${this.brandGuidelines.typography.secondary_font.fallback_suggestions.join(', ')};\n`;
		scss += `$font-stack: ${this.brandGuidelines.typography.web_font_stack};\n\n`;

		// Font weights
		scss += `$font-weights: (\n`;
		scss += `  "primary": (${this.brandGuidelines.typography.primary_font.weights.map((w) => `"${w.toLowerCase()}"`).join(', ')}),\n`;
		scss += `  "secondary": (${this.brandGuidelines.typography.secondary_font.weights.map((w) => `"${w.toLowerCase()}"`).join(', ')})\n`;
		scss += `);\n\n`;

		// Size variables
		const sizes = this.brandGuidelines.typography.sizes;
		scss += `$font-sizes: (\n`;
		scss += `  "h1": ${sizes.h1},\n`;
		scss += `  "h2": ${sizes.h2},\n`;
		scss += `  "h3": ${sizes.h3},\n`;
		scss += `  "body": ${sizes.body},\n`;
		scss += `  "caption": ${sizes.caption}\n`;
		scss += `);\n`;

		return scss;
	}

	private generateMarkdownSpec(): string {
		return `# ${this.brandGuidelines.brand_name} Brand Guidelines

## Overview
${this.brandGuidelines.short_description}

## Positioning Statement
${this.brandGuidelines.positioning_statement}

## Brand Personality & Voice

### Personality Traits
${this.brandGuidelines.voice_and_tone.personality_traits.map((trait) => `- ${trait}`).join('\n')}

### Communication Style
${this.brandGuidelines.voice_and_tone.communication_style}

### Sample Sentences
${this.brandGuidelines.voice_and_tone.sample_sentences.map((sentence) => `- "${sentence}"`).join('\n')}

## Logo System

### Primary Logo
- **File**: ${this.brandGuidelines.logo.primary.filename}
- **Usage**: ${this.brandGuidelines.logo.primary.recommended_usage}
- **Description**: ${this.brandGuidelines.logo.primary.description}

### Clear Space Requirements
- **Measurement Method**: ${this.brandGuidelines.logo.clear_space.measurement_method}
- **Minimum Clear Space**: ${this.brandGuidelines.logo.clear_space.minimum_clear_space}

### Minimum Sizes
- **Print**: ${this.brandGuidelines.logo.minimum_sizes.print_minimum}
- **Digital**: ${this.brandGuidelines.logo.minimum_sizes.digital_minimum}

## Color Palette

### Primary Colors
${this.brandGuidelines.colors.primary_palette
	.map((color) => `- **${color.name}**: ${color.hex} (RGB: ${color.rgb}, CMYK: ${color.cmyk})`)
	.join('\n')}

### Secondary Colors
${this.brandGuidelines.colors.secondary_palette
	.map((color) => `- **${color.name}**: ${color.hex} (RGB: ${color.rgb}, CMYK: ${color.cmyk})`)
	.join('\n')}

## Typography

### Primary Font
- **Name**: ${this.brandGuidelines.typography.primary_font.name}
- **Usage**: ${this.brandGuidelines.typography.primary_font.usage}
- **Weights**: ${this.brandGuidelines.typography.primary_font.weights.join(', ')}

### Secondary Font
- **Name**: ${this.brandGuidelines.typography.secondary_font.name}
- **Usage**: ${this.brandGuidelines.typography.secondary_font.usage}
- **Weights**: ${this.brandGuidelines.typography.secondary_font.weights.join(', ')}

### Font Sizes
- **H1**: ${this.brandGuidelines.typography.sizes.h1}
- **H2**: ${this.brandGuidelines.typography.sizes.h2}
- **H3**: ${this.brandGuidelines.typography.sizes.h3}
- **Body**: ${this.brandGuidelines.typography.sizes.body}
- **Caption**: ${this.brandGuidelines.typography.sizes.caption}

## Contact Information

- **Name**: ${this.brandGuidelines.legal_contact.name}
- **Role**: ${this.brandGuidelines.legal_contact.role}
- **Company**: ${this.brandGuidelines.legal_contact.company}
- **Email**: ${this.brandGuidelines.legal_contact.email}

---
*Generated on ${new Date().toLocaleDateString()} | Version ${this.brandGuidelines.version}*
`;
	}

	private generateReadme(): string {
		return `# ${this.brandGuidelines.brand_name} Brand Assets

This package contains all the essential brand assets and guidelines for ${this.brandGuidelines.brand_name}.

## Package Contents

### 📁 logos/
Contains all logo files in various formats and usage guidelines.

### 📁 colors/
- \`${this.brandGuidelines.brand_name}_colors.json\` - Complete color specification
- \`${this.brandGuidelines.brand_name}_colors.css\` - CSS custom properties
- \`${this.brandGuidelines.brand_name}_colors.scss\` - SCSS variables
- \`${this.brandGuidelines.brand_name}_colors.ase\` - Adobe Swatch Exchange file

### 📁 typography/
- \`${this.brandGuidelines.brand_name}_typography.json\` - Complete typography specification
- \`${this.brandGuidelines.brand_name}_typography.css\` - CSS typography classes
- \`${this.brandGuidelines.brand_name}_typography.scss\` - SCSS typography variables

### 📄 Brand Guidelines
- \`${this.brandGuidelines.brand_name}_brand_guidelines.json\` - Complete brand specification (machine-readable)
- \`${this.brandGuidelines.brand_name}_brand_guidelines.md\` - Human-readable brand guidelines

## Quick Start

### For Web Development
1. Include the CSS files in your project
2. Use the provided CSS classes and custom properties
3. Reference the typography guidelines for proper font usage

### For Design
1. Use the logo files from the \`logos/\` directory
2. Reference the color specifications for consistent brand colors
3. Follow the typography guidelines for text styling

### For Print
1. Use high-resolution logo files
2. Reference CMYK color values for print materials
3. Follow minimum size requirements for logo usage

## Brand Guidelines

For complete brand guidelines, see:
- \`${this.brandGuidelines.brand_name}_brand_guidelines.md\` (human-readable)
- \`${this.brandGuidelines.brand_name}_brand_guidelines.json\` (machine-readable)

## Contact

For questions about brand usage:
- **Name**: ${this.brandGuidelines.legal_contact.name}
- **Email**: ${this.brandGuidelines.legal_contact.email}
- **Role**: ${this.brandGuidelines.legal_contact.role}

---
*Generated on ${new Date().toLocaleDateString()} | Version ${this.brandGuidelines.version}*
`;
	}

	private sanitizeFileName(fileName: string): string {
		return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
	}
}
