import { useEffect } from "react";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Products } from "./components/Products";
import { Testimonials } from "./components/Testimonials";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";
import { getTemplateContent } from "./template-content";
import { buildBrandTokens, applyBrandTokens } from "./theme/brand-tokens";

export default function App() {
  const brandConfig = getBrandConfig();
  const templateContent = getTemplateContent();
  const tokens = buildBrandTokens(brandConfig);

  // Apply brand tokens as CSS variables
  useEffect(() => {
    applyBrandTokens(tokens);
    
    // Also set brand-specific variables
    const root = document.documentElement;
    const { colors } = brandConfig;
    
    root.style.setProperty("--brand-primary", colors.primary);
    root.style.setProperty("--brand-secondary", colors.secondary);
    root.style.setProperty("--brand-accent", colors.accent);
    root.style.setProperty("--brand-background", colors.background);
    root.style.setProperty("--brand-text", colors.text);
    root.style.setProperty("--brand-white", colors.white);
    root.style.setProperty("--brand-black", colors.black);
    root.style.setProperty("--overlay", `${colors.black}80`);
    root.style.setProperty("--muted-border", colors.text === "#ffffff" ? "#cccccc" : "#cccccc");
  }, [tokens, brandConfig]);

  return (
    <div className="min-h-screen" style={{ background: tokens.gradients.soft }}>
      <Hero config={brandConfig} tokens={tokens} content={templateContent.hero} />
      <About config={brandConfig} tokens={tokens} content={templateContent.about} />
      <Products config={brandConfig} tokens={tokens} content={templateContent.products} />
      <Testimonials
        config={brandConfig}
        tokens={tokens}
        content={templateContent.testimonials}
      />
      <Gallery config={brandConfig} tokens={tokens} content={templateContent.gallery} />
      <Footer config={brandConfig} tokens={tokens} content={templateContent.footer} />
    </div>
  );
}
