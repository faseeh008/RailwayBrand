import type { BrandConfig } from "../shared-brand-config";
import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { getTypographyStyle } from "../utils/typography";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card } from "./ui/card";

interface TestimonialsProps {
  config: BrandConfig;
  tokens: BrandTokens;
  content: TemplateContent["testimonials"];
}

export function Testimonials({ config, tokens, content }: TestimonialsProps) {
  const galleryImages = config.images.gallery ?? [];
  const getAvatar = (index?: number) => {
    if (typeof index === "number" && galleryImages[index]) {
      return galleryImages[index];
    }
    return galleryImages[0] ?? config.images.hero;
  };

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: withAlpha(tokens.colors.background, 0.9) }}
    >
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.accent, 0.18) }}
      />
      <div
        className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.secondary, 0.18) }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 space-y-6">
          <div
            className="inline-block px-8 py-3 rounded-full shadow-xl"
            style={{
              background: tokens.colors.surface,
              color: tokens.colors.text,
            }}
          >
            {content.badgeLabel}
          </div>

          <h2 
            className="space-y-2" 
            style={{ 
              ...getTypographyStyle(config, 'H2'),
              color: tokens.colors.text 
            }}
          >
            {content.headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {content.entries.map((entry) => (
            <Card
              key={entry.name}
              className="relative p-8 rounded-3xl shadow-2xl transition-transform hover:-translate-y-1"
              style={{ borderColor: withAlpha(tokens.colors.primary, 0.2) }}
            >
              <div className="text-sm font-medium mb-4" style={{ color: tokens.colors.mutedText }}>
                Rating {entry.rating.toFixed(1)}/5
              </div>
              <p 
                className="leading-relaxed mb-6" 
                style={{ 
                  ...getTypographyStyle(config, 'Body'),
                  color: tokens.colors.text 
                }}
              >
                "{entry.quote}"
              </p>
              <div
                className="flex items-center gap-4 pt-6"
                style={{ borderTop: `1px solid ${tokens.colors.border}` }}
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-lg flex-shrink-0"
                  style={{ borderColor: tokens.colors.background }}
                >
                  <ImageWithFallback
                    src={getAvatar(entry.imageIndex)}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: tokens.colors.text }}>
                    {entry.name}
                  </div>
                  <div className="text-sm" style={{ color: tokens.colors.mutedText }}>
                    {entry.role}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-8 mt-20 max-w-5xl mx-auto">
          {content.stats.map((stat) => (
            <div
              key={stat.label}
              className="p-8 rounded-3xl text-center shadow-2xl transition-transform hover:-translate-y-1"
              style={{ background: tokens.gradients.accent }}
            >
              <div className="text-5xl mb-2" style={{ color: tokens.colors.onPrimary }}>
                {stat.value}
              </div>
              <div style={{ color: withAlpha(tokens.colors.onPrimary, 0.85) }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
