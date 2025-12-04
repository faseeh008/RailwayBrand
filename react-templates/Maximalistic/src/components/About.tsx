import type { BrandConfig } from "../shared-brand-config";
import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { getTypographyStyle } from "../utils/typography";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AboutProps {
  config: BrandConfig;
  tokens: BrandTokens;
  content: TemplateContent["about"];
}

export function About({ config, tokens, content }: AboutProps) {
  const galleryImages = config.images.gallery ?? [];
  const fallbackImage = config.images.hero;
  const collageSources = [0, 1, 2].map((index) => galleryImages[index] ?? fallbackImage);
  const pillarGradients = [tokens.gradients.primary, tokens.gradients.accent, tokens.gradients.soft];

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: withAlpha(tokens.colors.background, 0.9) }}
    >
      <div
        className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.primary, 0.15) }}
      />
      <div
        className="absolute bottom-20 left-10 w-64 h-64 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.secondary, 0.15) }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[600px]">
            {collageSources.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="absolute rounded-3xl overflow-hidden shadow-2xl border-8"
                style={{
                  top: index === 0 ? 0 : index === 1 ? "8rem" : "auto",
                  bottom: index === 2 ? 0 : "auto",
                  left: index === 0 ? 0 : index === 2 ? "4rem" : "auto",
                  right: index === 1 ? 0 : index === 2 ? "auto" : "-1rem",
                  width: index === 1 ? "20rem" : "18rem",
                  height: index === 0 ? "20rem" : index === 1 ? "18rem" : "16rem",
                  transform:
                    index === 0 ? "rotate(-6deg)" : index === 1 ? "rotate(4deg)" : "rotate(6deg)",
                  borderColor: [tokens.colors.primary, tokens.colors.secondary, tokens.colors.accent][
                    index
                  ],
                }}
              >
                <ImageWithFallback
                  src={image}
                  alt={`${config.brandName} studio collage ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              {content.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 rounded-full text-sm"
                  style={{
                    background: tokens.colors.surface,
                    color: tokens.colors.text,
                    border: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            <div>
              <h2 
                className="leading-tight space-y-2" 
                style={{ 
                  ...getTypographyStyle(config, 'H2'),
                  color: tokens.colors.text 
                }}
              >
                {content.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            <div className="space-y-4">
              {content.paragraphs.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className="p-6 rounded-2xl shadow-lg"
                  style={{
                    ...getTypographyStyle(config, 'Body'),
                    background: tokens.colors.surface,
                    borderLeft: `8px solid ${
                      [tokens.colors.primary, tokens.colors.accent][index % 2]
                    }`,
                    color: tokens.colors.text,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {content.pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl shadow-xl"
                  style={{
                    background: pillarGradients[index % pillarGradients.length],
                  }}
                >
                  <h3 className="text-2xl mb-2" style={{ color: tokens.colors.onPrimary }}>
                    {pillar.title}
                  </h3>
                  <p style={{ color: withAlpha(tokens.colors.onPrimary, 0.85) }}>
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
