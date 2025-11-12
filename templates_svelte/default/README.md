# Svelte Slide Components for Brand Guidelines

This directory contains Svelte components that replicate the HTML/CSS templates as editable, reactive components that can be converted to editable PPTX files using `pptxgenjs`.

## Components

1. **CoverSlide.svelte** - Cover slide with brand name, tagline, and date
2. **BrandIntroductionSlide.svelte** - Brand introduction with positioning statement
3. **BrandPositioningSlide.svelte** - Mission, vision, values, and target audience
4. **LogoGuidelinesSlide.svelte** - Logo usage guidelines and specifications
5. **ColorPaletteSlide.svelte** - Color palette with swatches (up to 8 colors)
6. **TypographySlide.svelte** - Typography system with primary and secondary fonts
7. **IconographySlide.svelte** - Icon library and usage guidelines
8. **PhotographySlide.svelte** - Photography style guidelines
9. **ApplicationsSlide.svelte** - Brand application examples
10. **LogoDosSlide.svelte** - Logo "Do's" examples
11. **LogoDontsSlide.svelte** - Logo "Don'ts" examples
12. **ThankYouSlide.svelte** - Closing slide with contact information

## Features

- ✅ **Editable**: All components support `isEditable` prop for inline editing
- ✅ **Type-safe**: Uses TypeScript interfaces for all data
- ✅ **PPTX Export**: Each component exports `getSlideData()` for PPTX conversion
- ✅ **Reactive**: Uses Svelte reactivity for live updates
- ✅ **Design-matched**: Replicates the exact design from HTML templates

## Usage Example

```svelte
<script lang="ts">
  import CoverSlide from '$lib/templates_svelte/default/CoverSlide.svelte';
  import { convertSvelteSlidesToPptx } from '$lib/services/svelte-slide-to-pptx';
  
  let coverSlideRef: CoverSlide;
  let isEditable = false;
  let brandName = 'My Brand';
  
  async function downloadPPTX() {
    const slideData = coverSlideRef.getSlideData();
    const blob = await convertSvelteSlidesToPptx({
      slides: [slideData],
      brandName: brandName
    });
    
    // Download the blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName}-Brand-Guidelines.pptx`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<CoverSlide
  bind:this={coverSlideRef}
  bind:brandName
  tagline="Brand Guidelines"
  primaryColor="#1E40AF"
  {isEditable}
/>

<button onclick={downloadPPTX}>Download Editable PPTX</button>
```

## Converting to PPTX

Each component implements a `getSlideData()` method that returns a `SlideData` object. This object contains:

- Layout information (background, dimensions)
- Element array with positions, styles, and content
- Type information for proper PPTX rendering

The `convertSvelteSlidesToPptx()` service converts these slide data objects into editable PPTX files where:
- Text elements are editable text boxes
- Images are editable/replaceable images
- Shapes are editable shapes
- Color swatches are editable color rectangles with text

## Benefits Over HTML Templates

1. **Type Safety**: TypeScript interfaces ensure data consistency
2. **Direct Data Access**: No HTML parsing needed
3. **Better Editing**: Reactive bindings for live updates
4. **Easier Maintenance**: Component-based architecture
5. **Editable PPTX**: Generates truly editable PowerPoint files (not images)



