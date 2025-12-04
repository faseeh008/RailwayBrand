import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { About } from "./components/About";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";

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
    
    // Set typography CSS variables if available
    if (brandConfig.typography) {
      const { typography } = brandConfig;
      
      // Set font families
      setVar("--font-primary", typography.primaryFont);
      setVar("--font-secondary", typography.secondaryFont);
      
      // Set font hierarchy CSS variables
      if (Array.isArray(typography.fontHierarchy)) {
        typography.fontHierarchy.forEach((h) => {
          const label = String(h.label || '').toLowerCase().replace(/\s+/g, '-');
          if (label && h.font && h.size && h.weight) {
            setVar(`--font-${label}-family`, h.font);
            setVar(`--font-${label}-size`, h.size);
            setVar(`--font-${label}-weight`, h.weight);
          }
        });
      }
      
      // Load Google Fonts if needed
      if (typography.primaryFont && !typography.primaryFont.includes('Arial') && !typography.primaryFont.includes('sans-serif')) {
        const fontName = typography.primaryFont.replace(/\s+/g, '+');
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
      if (typography.secondaryFont && !typography.secondaryFont.includes('Arial') && !typography.secondaryFont.includes('sans-serif')) {
        const fontName = typography.secondaryFont.replace(/\s+/g, '+');
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
    }

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