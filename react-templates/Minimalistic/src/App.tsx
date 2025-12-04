import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { About } from "./components/About";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";

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

  useEffect(() => {
    const root = document.documentElement;
    const setVar = (token: string, value?: string) => {
      if (value) {
        root.style.setProperty(token, value);
      }
    };

    const { colors } = brandConfig;

    // Set brand-specific variables
    setVar("--brand-primary", colors.primary);
    setVar("--brand-secondary", colors.secondary);
    setVar("--brand-accent", colors.accent);
    setVar("--brand-background", colors.background);
    setVar("--brand-text", colors.text);
    setVar("--brand-white", colors.white);
    setVar("--brand-black", colors.black);
    setVar("--brand-surface", colors.surface);
    setVar("--brand-border", colors.border);
    setVar("--brand-muted-text", colors.mutedText);
    setVar("--overlay", `${colors.black}80`); // 50% opacity black overlay
    setVar("--muted-border", colors.border);

    // Map to UI component variables (for backward compatibility with colorPalette)
    const palette = brandConfig.colorPalette;
    setVar("--brand-primary-foreground", palette.primaryForeground);
    setVar("--brand-secondary-foreground", palette.secondaryForeground);
    setVar("--brand-accent-foreground", palette.accentForeground);

    setVar("--font-heading", brandConfig.fonts.heading);
    setVar("--font-body", brandConfig.fonts.body);

    // Sync Tailwind CSS variables with brand colors
    setVar("--background", colors.background);
    setVar("--foreground", colors.text);
    setVar("--card", colors.surface);
    setVar("--card-foreground", colors.text);
    setVar("--primary", colors.primary);
    setVar("--primary-foreground", colors.white);
    setVar("--secondary", colors.secondary);
    setVar("--secondary-foreground", colors.white);
    setVar("--accent", colors.accent);
    setVar("--accent-foreground", colors.white);
    setVar("--border", colors.border);

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
      }

      // Set primary and secondary font families
      root.style.setProperty('--font-primary', `"${typography.primaryFont}", sans-serif`);
      root.style.setProperty('--font-secondary', `"${typography.secondaryFont}", sans-serif`);
    }
  }, [brandConfig]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: brandConfig.colors.background,
        color: brandConfig.colors.text,
        fontFamily: brandConfig.fonts.body,
      }}
    >
      <Navbar brandConfig={brandConfig} />
      <Hero brandConfig={brandConfig} />
      <Services brandConfig={brandConfig} />
      <About brandConfig={brandConfig} />
      <Footer brandConfig={brandConfig} />
    </div>
  );
}