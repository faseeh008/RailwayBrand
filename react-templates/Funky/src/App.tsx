import { HeroSection } from "./components/HeroSection";
import { CollectionGrid } from "./components/CollectionGrid";
import { CategoryShowcase } from "./components/CategoryShowcase";
import { FeaturedVideo } from "./components/FeaturedVideo";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";
import { useEffect } from "react";

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
    
    // Set font families
    if (brandConfig.fonts.heading) {
      root.style.setProperty("--font-heading", brandConfig.fonts.heading);
      document.body.style.fontFamily = brandConfig.fonts.heading;
    }
    if (brandConfig.fonts.body) {
      root.style.setProperty("--font-body", brandConfig.fonts.body);
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
