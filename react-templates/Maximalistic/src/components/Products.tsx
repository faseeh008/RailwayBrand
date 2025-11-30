import type { BrandConfig } from "../shared-brand-config";
import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { getIconComponent } from "../utils/icon-mapper";

interface ProductsProps {
  config: BrandConfig;
  tokens: BrandTokens;
  content: TemplateContent["products"];
}

export function Products({ config, tokens, content }: ProductsProps) {
  const galleryImages = config.images.gallery ?? [];
  const getImage = (index?: number) => {
    if (typeof index === "number" && galleryImages[index]) {
      return galleryImages[index];
    }
    return galleryImages[0] ?? config.images.hero;
  };

  const variantGradient = {
    primary: tokens.gradients.primary,
    secondary: tokens.gradients.accent,
    accent: tokens.gradients.soft,
  };

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: withAlpha(tokens.colors.background, 0.95) }}
    >
      <div
        className="absolute top-10 left-20 w-96 h-96 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.primary, 0.12) }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.secondary, 0.12) }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 space-y-6">
          <div
            className="inline-block px-6 py-3 rounded-full shadow-xl"
            style={{
              background: tokens.colors.surface,
              color: tokens.colors.text,
              border: `1px solid ${tokens.colors.border}`,
            }}
          >
            {content.badgeLabel}
          </div>

          <h2 className="text-6xl leading-tight space-y-2" style={{ color: tokens.colors.text }}>
            {content.headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>

          <p className="text-xl max-w-2xl mx-auto" style={{ color: tokens.colors.mutedText }}>
            {content.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.items.map((product) => (
            <div
              key={product.name}
              className="group relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border"
              style={{
                background: tokens.colors.surface,
                borderColor: tokens.colors.border,
              }}
            >
              <div className="absolute top-4 left-4 z-20">
                <span
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: variantGradient[product.variant],
                    color: tokens.colors.onPrimary,
                    boxShadow: `0 15px 30px ${withAlpha(tokens.colors.text, 0.15)}`,
                  }}
                >
                  {product.badge}
                </span>
              </div>

              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={getImage(product.imageIndex)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 40%, ${withAlpha(
                      tokens.colors.background,
                      0.8,
                    )})`,
                  }}
                />
              </div>

              <div className="p-6 space-y-4">
                <div
                  className="flex items-center justify-between text-sm font-medium"
                  style={{ color: tokens.colors.mutedText }}
                >
                  <span>Rating {product.rating.toFixed(1)}/5</span>
                  <span>Craft index #{content.items.indexOf(product) + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  {product.icon && (() => {
                    const Icon = getIconComponent(product.icon);
                    return Icon ? <Icon className="w-5 h-5" style={{ color: tokens.colors.primary }} /> : null;
                  })()}
                  <h3 className="text-2xl" style={{ color: tokens.colors.text }}>
                    {product.name}
                  </h3>
                </div>

                <p style={{ color: tokens.colors.mutedText }}>{product.description}</p>

                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: `1px solid ${tokens.colors.border}` }}
                >
                  <div className="text-3xl font-semibold" style={{ color: tokens.colors.text }}>
                    {product.price}
                  </div>
                  <Button
                    className="rounded-full px-6"
                    style={{
                      background: tokens.gradients.accent,
                      color: tokens.colors.onPrimary,
                      border: "none",
                    }}
                  >
                    Reserve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button
            size="lg"
            className="px-12 py-6 rounded-full text-xl flex items-center gap-2 mx-auto"
            style={{
              background: tokens.gradients.primary,
              color: tokens.colors.onPrimary,
              boxShadow: `0 25px 50px ${withAlpha(tokens.colors.text, 0.2)}`,
              border: "none",
            }}
          >
            {content.ctaLabel}
            {content.ctaIcon && (() => {
              const Icon = getIconComponent(content.ctaIcon);
              return Icon ? <Icon className="w-5 h-5" /> : null;
            })()}
          </Button>
        </div>
      </div>
    </section>
  );
}
