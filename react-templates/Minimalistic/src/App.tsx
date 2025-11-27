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

    const palette = brandConfig.colorPalette;
    setVar("--brand-primary", palette.primary);
    setVar("--brand-primary-foreground", palette.primaryForeground);
    setVar("--brand-secondary", palette.secondary);
    setVar("--brand-secondary-foreground", palette.secondaryForeground);
    setVar("--brand-accent", palette.accent);
    setVar("--brand-accent-foreground", palette.accentForeground);
    setVar("--brand-bg", palette.background);
    setVar("--brand-surface", palette.surface);
    setVar("--brand-border", palette.border);
    setVar("--brand-text", palette.text);
    setVar("--brand-muted-text", palette.mutedText);
    setVar("--font-heading", brandConfig.fonts.heading);
    setVar("--font-body", brandConfig.fonts.body);

    // Sync Tailwind CSS variables with brand palette
    setVar("--background", palette.background);
    setVar("--foreground", palette.text);
    setVar("--card", palette.surface);
    setVar("--card-foreground", palette.text);
    setVar("--primary", palette.primary);
    setVar("--primary-foreground", palette.primaryForeground);
    setVar("--secondary", palette.secondary);
    setVar("--secondary-foreground", palette.secondaryForeground);
    setVar("--accent", palette.accent);
    setVar("--accent-foreground", palette.accentForeground);
    setVar("--border", palette.border);
  }, [brandConfig]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: brandConfig.colorPalette.background,
        color: brandConfig.colorPalette.text,
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