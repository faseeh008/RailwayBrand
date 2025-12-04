import { useEffect } from "react";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Products } from "./components/Products";
import { Testimonials } from "./components/Testimonials";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";
import { getTemplateContent } from "./template-content";
import { buildBrandTokens } from "./theme/brand-tokens";

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
  const templateContent = getTemplateContent();
  const tokens = buildBrandTokens(brandConfig);

  // Set typography CSS variables
  useEffect(() => {
    const root = document.documentElement;
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
  }, [brandConfig.typography]);

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
