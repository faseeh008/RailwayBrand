import { HeroSection } from "./components/HeroSection";
import { CollectionGrid } from "./components/CollectionGrid";
import { CategoryShowcase } from "./components/CategoryShowcase";
import { FeaturedVideo } from "./components/FeaturedVideo";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";
import { useEffect } from "react";

// Helper to load Google Fonts dynamically
function loadGoogleFonts(fonts: string[]) {
  const uniqueFonts = [...new Set(fonts.filter(Boolean))];
  if (uniqueFonts.length === 0) return;

  const fontFamilies = uniqueFonts.map(font => font.replace(/ /g, '+')).join('&family=');
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// Helper to find typography style by label
function getTypographyStyle(fontHierarchy: Array<{label: string; font: string; size: string; weight: string}>, label: string) {
  return fontHierarchy.find(h => h.label.toLowerCase().includes(label.toLowerCase()));
}

export default function App() {
  const brandConfig = getBrandConfig();

  // Inject brand config CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = brandConfig;

    // Set brand-specific variables
    root.style.setProperty("--brand-primary", colors.primary);
    root.style.setProperty("--brand-secondary", colors.secondary);
    root.style.setProperty("--brand-accent", colors.accent);
    root.style.setProperty("--brand-background", colors.background);
    root.style.setProperty("--brand-text", colors.text);
    root.style.setProperty("--brand-white", colors.white);
    root.style.setProperty("--brand-black", colors.black);

    // Map to UI component variables
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.white);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.white);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.white);
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.text);
    root.style.setProperty("--text", colors.text);
    root.style.setProperty("--overlay", `${colors.black}80`); // 50% opacity black overlay
    // Compute muted color (light gray for borders/grids) from text color
    const mutedColor = colors.text === "#ffffff" ? "#cccccc" : "#cccccc"; // Light gray for subtle elements
    root.style.setProperty("--muted-border", mutedColor);

    // Set font families (fallback)
    if (brandConfig.fonts.heading) {
      root.style.setProperty("--font-heading", brandConfig.fonts.heading);
    }
    if (brandConfig.fonts.body) {
      root.style.setProperty("--font-body", brandConfig.fonts.body);
    }

    // Set typography CSS variables from generated typography
    const typography = brandConfig.typography;
    if (typography && typography.fontHierarchy && typography.fontHierarchy.length > 0) {
      // Load Google Fonts
      const fontsToLoad = [
        typography.primaryFont,
        typography.secondaryFont,
        ...typography.fontHierarchy.map(h => h.font)
      ];
      loadGoogleFonts(fontsToLoad);

      // Set CSS variables for each typography level
      const h1Style = getTypographyStyle(typography.fontHierarchy, 'heading 1');
      const h2Style = getTypographyStyle(typography.fontHierarchy, 'heading 2');
      const bodyStyle = getTypographyStyle(typography.fontHierarchy, 'body');

      if (h1Style) {
        root.style.setProperty('--font-h1-family', `"${h1Style.font}", sans-serif`);
        root.style.setProperty('--font-h1-size', h1Style.size);
        root.style.setProperty('--font-h1-weight', h1Style.weight);
      }

      if (h2Style) {
        root.style.setProperty('--font-h2-family', `"${h2Style.font}", sans-serif`);
        root.style.setProperty('--font-h2-size', h2Style.size);
        root.style.setProperty('--font-h2-weight', h2Style.weight);
      }

      if (bodyStyle) {
        root.style.setProperty('--font-body-family', `"${bodyStyle.font}", sans-serif`);
        root.style.setProperty('--font-body-size', bodyStyle.size);
        root.style.setProperty('--font-body-weight', bodyStyle.weight);
        document.body.style.fontFamily = `"${bodyStyle.font}", sans-serif`;
      }

      // Set primary and secondary font families
      root.style.setProperty('--font-primary', `"${typography.primaryFont}", sans-serif`);
      root.style.setProperty('--font-secondary', `"${typography.secondaryFont}", sans-serif`);
    }
  }, [brandConfig]);

  // Create gradient background from brand colors
  const backgroundGradient = `linear-gradient(to bottom right, ${brandConfig.colors.background}, ${brandConfig.colors.primary}15, ${brandConfig.colors.secondary}15)`;

  return (
    <div className="min-h-screen" style={{ background: backgroundGradient }}>
      <HeroSection brandConfig={brandConfig} />
      <CollectionGrid brandConfig={brandConfig} />
      <CategoryShowcase brandConfig={brandConfig} />
      <FeaturedVideo brandConfig={brandConfig} />
      <Newsletter brandConfig={brandConfig} />
      <Footer brandConfig={brandConfig} />
    </div>
  );
}
