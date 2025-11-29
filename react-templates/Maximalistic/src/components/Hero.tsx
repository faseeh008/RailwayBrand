import type { BrandConfig } from "../shared-brand-config";
import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";

interface HeroProps {
  config: BrandConfig;
  tokens: BrandTokens;
  content: TemplateContent["hero"];
}

export function Hero({ config, tokens, content }: HeroProps) {
  const heroImages = [config.images.hero, ...(config.images.gallery ?? [])].filter((img) => img && img.trim() !== "");
  const [primaryImage, secondaryImage, tertiaryImage] = [
    heroImages[0] || "",
    heroImages[1] || heroImages[0] || "",
    heroImages[2] || heroImages[0] || "",
  ];
  const metrics = content.metrics.length ? content.metrics : config.stats;
  const collageBadgePositions = [
    { top: "-1rem", left: "2rem", transform: "rotate(-8deg)" },
    { bottom: "2rem", left: "2rem", transform: "rotate(10deg)" },
    { top: "40%", right: "1rem", transform: "rotate(6deg)" },
  ];

  return (
    <section
      className="relative overflow-hidden min-h-screen"
      style={{ background: tokens.gradients.primary }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse"
          style={{ background: withAlpha(tokens.colors.accent, 0.25) }}
        />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-3xl animate-pulse"
          style={{ background: withAlpha(tokens.colors.secondary, 0.25) }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full blur-2xl"
          style={{ background: withAlpha(tokens.colors.primary, 0.3) }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <div
              className="inline-block px-6 py-2 rounded-full rotate-2 shadow-lg"
              style={{
                background: tokens.colors.surface,
                color: tokens.colors.text,
              }}
            >
              {content.badgeLabel}
            </div>

            <h1 className="text-7xl lg:text-8xl space-y-2 leading-none font-semibold">
              <div className="relative inline-block">
                <span style={{ color: tokens.colors.onPrimary }}>{content.highlights[0]}</span>
                <div
                  className="absolute -bottom-2 left-0 w-full h-3 -rotate-1"
                  style={{ background: tokens.colors.onAccent, opacity: 0.3 }}
                />
              </div>
              <div style={{ color: tokens.colors.onSecondary }}>{content.highlights[1]}</div>
              <div style={{ color: tokens.colors.onAccent }}>{content.highlights[2]}</div>
            </h1>

            <p
              className="text-xl max-w-lg"
              style={{ color: withAlpha(tokens.colors.onPrimary, 0.9) }}
            >
              {content.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full transform hover:scale-105 transition-transform"
                style={{
                  background: tokens.gradients.accent,
                  color: tokens.colors.onPrimary,
                  boxShadow: `0 20px 40px ${withAlpha(tokens.colors.text, 0.25)}`,
                  border: "none",
                }}
              >
                {content.primaryCta}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-full transform hover:scale-105 transition-transform"
                style={{
                  background: withAlpha(tokens.colors.background, 0.2),
                  color: tokens.colors.onPrimary,
                  borderColor: withAlpha(tokens.colors.onPrimary, 0.4),
                  backdropFilter: "blur(8px)",
                }}
              >
                {content.secondaryCta}
              </Button>
            </div>

            <div className="flex gap-8 pt-4 flex-wrap">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-4xl font-semibold" style={{ color: tokens.colors.onPrimary }}>
                    {metric.value}
                  </div>
                  <div style={{ color: withAlpha(tokens.colors.onPrimary, 0.7) }}>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[600px] lg:h-[700px]">
            <div
              className="absolute top-0 right-0 w-80 h-96 rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform z-10 border-8"
              style={{ borderColor: tokens.colors.background }}
            >
              <ImageWithFallback
                src={primaryImage}
                alt={`${config.brandName} primary showcase`}
                className="w-full h-full object-cover"
              />
            </div>

            <div
              className="absolute top-24 left-0 w-64 h-72 rounded-3xl overflow-hidden shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform z-20 border-8"
              style={{ borderColor: tokens.colors.accent }}
            >
              <ImageWithFallback
                src={secondaryImage}
                alt={`${config.brandName} secondary showcase`}
                className="w-full h-full object-cover"
              />
            </div>

            <div
              className="absolute bottom-0 right-20 w-72 h-64 rounded-3xl overflow-hidden shadow-2xl transform rotate-6 hover:rotate-0 transition-transform z-10 border-8"
              style={{ borderColor: tokens.colors.secondary }}
            >
              <ImageWithFallback
                src={tertiaryImage}
                alt={`${config.brandName} tertiary showcase`}
                className="w-full h-full object-cover"
              />
            </div>

            {content.collageLabels.map((label, index) => {
              const position = collageBadgePositions[index] ?? collageBadgePositions[0];
              return (
                <div
                  key={label}
                  className="absolute px-6 py-3 rounded-full shadow-xl z-30"
                  style={{
                    ...position,
                    background: tokens.colors.surface,
                    color: tokens.colors.text,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill={tokens.colors.background}
          />
        </svg>
      </div>
    </section>
  );
}
