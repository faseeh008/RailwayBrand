import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Products } from "./components/Products";
import { Testimonials } from "./components/Testimonials";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";
import { getBrandConfig } from "./shared-brand-config";
import { getTemplateContent } from "./template-content";
import { buildBrandTokens } from "./theme/brand-tokens";

export default function App() {
  const brandConfig = getBrandConfig();
  const templateContent = getTemplateContent();
  const tokens = buildBrandTokens(brandConfig);

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
