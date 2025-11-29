# React Templates - Brand Configuration Documentation

## Overview

All templates (Funky, Futuristic, Maximalistic, Minimalistic) are configured to accept brand data via JSON injection through `window.__BRAND_CONFIG__`. The templates automatically convert your JSON data into a complete brand configuration with computed colors, derived values, and CSS variables.

---

## JSON Input Structure

### Required JSON Format

Your build scripts (`buildFunky.ts`, `buildFuturistic.ts`, etc.) should inject this JSON structure into `window.__BRAND_CONFIG__`:

```json
{
  "brandName": "Your Brand Name",
  "industry": "Fashion",
  "colors": {
    "primary": "#F5F5F2",
    "secondary": "#E1E1DD",
    "accent": "#FFB46A"
  },
  "images": {
    "hero": "https://example.com/hero-image.jpg",
    "gallery": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }
}
```

### JSON Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brandName` | `string` | ✅ Yes | The brand name displayed throughout the template |
| `industry` | `string` | ✅ Yes | Industry category (e.g., "Fashion", "Technology", "Furniture") |
| `colors.primary` | `string` | ✅ Yes | Primary brand color (hex format: `#RRGGBB`) |
| `colors.secondary` | `string` | ✅ Yes | Secondary brand color (hex format) |
| `colors.accent` | `string` | ✅ Yes | Accent brand color (hex format) |
| `images.hero` | `string` | ❌ Optional | Hero section image URL |
| `images.gallery` | `string[]` | ❌ Optional | Array of gallery image URLs |

---

## How It Works: Data Flow

```
1. Build Script (build<Theme>.ts)
   ↓
2. Injects JSON into window.__BRAND_CONFIG__
   ↓
3. Template's getBrandConfig() reads window.__BRAND_CONFIG__
   ↓
4. convertUserConfig() transforms JSON to BrandConfig
   ↓
5. computeColors() derives background, text, white, black
   ↓
6. App.tsx sets CSS variables from BrandConfig
   ↓
7. Components use CSS variables and BrandConfig.colors
```

---

## Variable Naming Conventions

### Internal TypeScript Variables

#### `UserBrandConfig` Interface
- **Purpose**: Defines the JSON structure your build scripts provide
- **Location**: `src/shared-brand-config.ts`
- **Fields**:
  - `brandName: string`
  - `industry: string`
  - `colors: { primary, secondary, accent }`
  - `images?: { hero?, gallery? }`

#### `BrandConfig` Interface
- **Purpose**: Internal configuration with computed values
- **Location**: `src/shared-brand-config.ts`
- **Fields**:
  - `brandName: string`
  - `brandDescription: string` (auto-generated)
  - `colors: { primary, secondary, accent, background, text, white, black, ... }`
  - `images: { hero, gallery }`
  - `industry: string`
  - `stats: Array<{ value, label }>`
  - `features: Array<{ title, description }>`

### CSS Variables (Set in App.tsx)

All templates set these CSS variables on `document.documentElement`:

| CSS Variable | Source | Usage |
|-------------|--------|-------|
| `--brand-primary` | `colors.primary` | Primary brand color |
| `--brand-secondary` | `colors.secondary` | Secondary brand color |
| `--brand-accent` | `colors.accent` | Accent brand color |
| `--brand-background` | `colors.background` | Page background |
| `--brand-text` | `colors.text` | Main text color |
| `--brand-white` | `colors.white` | White/light color for contrast |
| `--brand-black` | `colors.black` | Black/dark color for overlays |
| `--overlay` | `colors.black + 80` | 50% opacity overlay (for modals) |
| `--muted-border` | `colors.border` | Subtle borders/grids |
| `--primary` | `colors.primary` | Tailwind CSS primary |
| `--primary-foreground` | `colors.white` | Text on primary buttons |
| `--secondary` | `colors.secondary` | Tailwind CSS secondary |
| `--secondary-foreground` | `colors.white` | Text on secondary buttons |
| `--accent` | `colors.accent` | Tailwind CSS accent |
| `--accent-foreground` | `colors.white` | Text on accent buttons |
| `--background` | `colors.background` | Tailwind CSS background |
| `--foreground` | `colors.text` | Tailwind CSS foreground |

---

## Theme-Specific Implementations

### 🎨 Funky Theme

**File**: `Funky/src/shared-brand-config.ts`

**Color Computation Logic**:
```typescript
// Light threshold: RGB sum > 382
background: isLight ? "#F5F5F2" : "#1f2937"
text: isLight ? "#1f2937" : "#ffffff"
white: "#ffffff"
black: "#000000"
```

**Auto-Generated Content**:
- `brandDescription`: `"Discover ${brandName} - Premium ${industry} collection."`
- `stats`: `["24/7", "120+", "12"]` with labels `["Creative Flow", "Happy Clients", "Brand Touchpoints"]`
- `features`: Three default features with funky descriptions

**CSS Variables Set**: All standard variables + gradient backgrounds

**Components Using Colors**:
- `HeroSection.tsx` → Uses `colors.white`, `colors.black`, `colors.primary`
- `CollectionGrid.tsx` → Uses `colors.background`, `colors.text`
- `CategoryShowcase.tsx` → Uses `colors.accent`, `colors.secondary`
- `Footer.tsx` → Uses `colors.text`, `colors.mutedText`

---

### 🚀 Futuristic Theme

**File**: `Futuristic/src/shared-brand-config.ts`

**Color Computation Logic**:
```typescript
// Always prefers dark tech backgrounds
background: "#0f172a" (always dark)
text: "#ffffff" (always white)
muted: "rgba(255,255,255,0.75)"
border: "rgba(255,255,255,0.25)"
surface: "rgba(15,23,42,0.8)"
```

**Additional Image Support**:
- `images.technology` - Technology section image
- `images.innovation` - Innovation section image
- `images.gallery` - Gallery images

**Auto-Generated Content**:
- `brandDescription`: `"The Future of ${industry}"`
- `stats`: `["99.9%", "10M+", "500+"]` with labels `["Uptime", "Users", "Countries"]`
- `features`: Four tech-focused features
- `navigation`, `hero`, `featuresContent`, `technologyContent`, `innovationContent`, `ctaContent`, `footerContent` - All auto-generated

**CSS Variables Set**: All standard variables + tech-specific variables (`--brand-muted`, `--brand-border`, `--brand-surface`)

**Components Using Colors**:
- `AnimatedBackground.tsx` → Uses `colors` object
- `FuturisticCube.tsx` → Uses `colors` object
- `App.tsx` → Uses `colors` for all sections

---

### 🎯 Maximalistic Theme

**File**: `Maximalistic/src/shared-brand-config.ts`

**Color Computation Logic**:
```typescript
// Prefers light backgrounds with vibrant colors
background: isLight ? "#ffffff" : "#0a0a0a"
text: isLight ? "#0a0a0a" : "#ffffff"
white: "#ffffff"
black: "#000000"
```

**Additional Files**:
- `src/template-content.ts` - Centralized text content (hero, about, products, testimonials, gallery, footer)
- `src/theme/brand-tokens.ts` - Advanced token system with gradients and computed colors

**Token System**:
- `buildBrandTokens()` - Creates gradients and computed colors
- `applyBrandTokens()` - Sets CSS variables from tokens
- Gradients: `primary`, `accent`, `soft`

**Auto-Generated Content**:
- `brandDescription`: `"Bold Design, Maximum Impact - ${industry}"`
- `stats`: `["1000+", "100k+", "24/7"]` with labels `["Projects", "Customers", "Support"]`
- `features`: Three design-focused features

**CSS Variables Set**: All standard variables + token-based variables

**Components Using Colors**:
- `Hero.tsx` → Uses `tokens.colors` and `tokens.gradients`
- `About.tsx` → Uses `tokens.colors`
- `Products.tsx` → Uses `tokens.colors`
- `Testimonials.tsx` → Uses `tokens.colors`
- `Gallery.tsx` → Uses `tokens.colors`
- `Footer.tsx` → Uses `tokens.colors`

---

### 🎭 Minimalistic Theme

**File**: `Minimalistic/src/shared-brand-config.ts`

**Color Computation Logic**:
```typescript
// Clean minimal aesthetic
background: isLight ? "#ffffff" : "#0a0a0a"
text: isLight ? "#0a0a0a" : "#ffffff"
surface: isLight ? "#f7f7f7" : "#171717"
border: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"
mutedText: isLight ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.7)"
```

**Backward Compatibility**:
- Maintains `colorPalette` interface for legacy support
- Automatically converts `colorPalette` to `colors` if needed

**Auto-Generated Content**:
- `brandDescription`: `"Pure Design, Timeless Comfort - ${industry}"`
- `stats`: `["500+", "50k+", "Free"]` with labels `["Products", "Happy Homes", "Delivery"]`
- `navigation`: Auto-generated navigation config
- `heroContent`: Auto-generated hero content
- `aboutContent`: Auto-generated about content
- `servicesContent`: Auto-generated services content
- `footerContent`: Auto-generated footer content

**CSS Variables Set**: All standard variables + minimal-specific variables

**Components Using Colors**:
- `Navbar.tsx` → Uses `colors.surface`, `colors.border`, `colors.text`
- `Hero.tsx` → Uses `colors.background`, `colors.text`, `colors.accent`
- `Services.tsx` → Uses `colors.surface`, `colors.border`
- `About.tsx` → Uses `colors.background`, `colors.text`
- `Footer.tsx` → Uses `colors.border`, `colors.mutedText`

---

## Color Computation Algorithm

All themes use a similar `computeColors()` function:

```typescript
function computeColors(primary: string, secondary: string, accent: string) {
  // 1. Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  };

  // 2. Determine if primary color is light or dark
  const primaryRgb = hexToRgb(primary);
  const isLight = primaryRgb.r + primaryRgb.g + primaryRgb.b > 382;

  // 3. Compute derived colors based on theme
  // (Theme-specific logic here)

  return {
    primary,
    secondary,
    accent,
    background,  // Computed
    text,        // Computed
    white,       // Always "#ffffff"
    black,       // Always "#000000"
    // ... theme-specific additional colors
  };
}
```

**Light/Dark Detection**:
- **Threshold**: RGB sum > 382 = Light color
- **Light colors** (sum > 382): Use light backgrounds, dark text
- **Dark colors** (sum ≤ 382): Use dark backgrounds, light text

---

## Component Usage Patterns

### Accessing Brand Config

```typescript
import { getBrandConfig } from "./shared-brand-config";

const brandConfig = getBrandConfig();
const colors = brandConfig.colors;
```

### Using Colors in Components

```typescript
// Direct color usage
<div style={{ backgroundColor: colors.background, color: colors.text }}>

// CSS variables (set in App.tsx)
<div className="bg-[var(--brand-primary)] text-[var(--brand-white)]">

// Inline styles with colors
<Button style={{ backgroundColor: colors.primary, color: colors.white }}>
```

### Image Handling

```typescript
// Hero image
{brandConfig.images.hero && (
  <img src={brandConfig.images.hero} alt={brandConfig.brandName} />
)}

// Gallery images
{brandConfig.images.gallery?.map((img, idx) => (
  <img key={idx} src={img} alt={`Gallery ${idx + 1}`} />
))}
```

---

## Build Script Integration

### Example Build Script Structure

```typescript
// buildFunky.ts
export function buildFunky(brandData: any) {
  const config = {
    brandName: brandData.brandName,
    industry: brandData.industry,
    colors: {
      primary: brandData.colors.primary,
      secondary: brandData.colors.secondary,
      accent: brandData.colors.accent
    },
    images: {
      hero: brandData.images?.hero || "",
      gallery: brandData.images?.gallery || []
    }
  };
  
  // Inject into window before React app loads
  (window as any).__BRAND_CONFIG__ = config;
}
```

### HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
  <script>
    // Inject brand config BEFORE React app loads
    window.__BRAND_CONFIG__ = {
      brandName: "My Brand",
      industry: "Fashion",
      colors: {
        primary: "#F5F5F2",
        secondary: "#E1E1DD",
        accent: "#FFB46A"
      },
      images: {
        hero: "https://example.com/hero.jpg",
        gallery: ["https://example.com/img1.jpg"]
      }
    };
  </script>
</head>
<body>
  <div id="root"></div>
  <script src="./main.js"></script>
</body>
</html>
```

---

## UI Components Color Updates

All UI components in `src/components/ui/` have been updated to use CSS variables:

### Updated Components

| Component | Change | Before | After |
|-----------|--------|--------|-------|
| `button.tsx` | Destructive variant text | `text-white` | `text-[var(--brand-white)]` |
| `badge.tsx` | Destructive variant text | `text-white` | `text-[var(--brand-white)]` |
| `dialog.tsx` | Overlay background | `bg-black/50` | `style={{ backgroundColor: "var(--overlay)" }}` |
| `sheet.tsx` | Overlay background | `bg-black/50` | `style={{ backgroundColor: "var(--overlay)" }}` |
| `drawer.tsx` | Overlay background | `bg-black/50` | `style={{ backgroundColor: "var(--overlay)" }}` |
| `alert-dialog.tsx` | Overlay background | `bg-black/50` | `style={{ backgroundColor: "var(--overlay)" }}` |

---

## Default Configurations

If `window.__BRAND_CONFIG__` is not provided, each theme uses a default configuration:

### Funky Defaults
- `brandName`: "FUNKIFY"
- `colors.primary`: "#9333ea"
- `colors.secondary`: "#ec4899"
- `colors.accent`: "#f59e0b"
- `industry`: "Fashion"

### Futuristic Defaults
- `brandName`: "NEXUS"
- `colors.primary`: "#3b82f6"
- `colors.secondary`: "#8b5cf6"
- `colors.accent`: "#06b6d4"
- `industry`: "Technology"

### Maximalistic Defaults
- `brandName`: "VIBRANT"
- `colors.primary`: "#f97316"
- `colors.secondary`: "#ec4899"
- `colors.accent`: "#fde047"
- `industry`: "Creative"

### Minimalistic Defaults
- `brandName`: "MONO"
- `colors.primary`: "#0a0a0a"
- `colors.secondary`: "#171717"
- `colors.accent`: "#404040"
- `industry`: "Furniture"

---

## Summary

### What You Provide (JSON)
```json
{
  "brandName": "...",
  "industry": "...",
  "colors": { "primary": "...", "secondary": "...", "accent": "..." },
  "images": { "hero": "...", "gallery": [...] }
}
```

### What Templates Generate
- ✅ Computed colors (background, text, white, black, surface, border, mutedText)
- ✅ CSS variables for dynamic theming
- ✅ Auto-generated content (descriptions, stats, features)
- ✅ Image fallback handling
- ✅ Theme-specific styling

### Key Functions
- `getBrandConfig()` - Retrieves config from `window.__BRAND_CONFIG__` or defaults
- `convertUserConfig()` - Transforms your JSON to internal `BrandConfig`
- `computeColors()` - Derives colors from primary/secondary/accent
- `applyBrandTokens()` (Maximalistic) - Applies advanced token system

All templates are now fully dynamic and ready to consume your brand data! 🎉

