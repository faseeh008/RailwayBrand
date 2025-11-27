import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../icon-registry";

interface HeroProps {
  brandConfig: BrandConfig;
}

export function Hero({ brandConfig }: HeroProps) {
  const palette = brandConfig.colorPalette;
  const heroContent = brandConfig.heroContent;
  const PrimaryIcon = getIconComponent(heroContent.primaryCta.icon);

  return (
    <section
      className="relative overflow-hidden px-6 py-12 md:py-16"
      style={{ backgroundColor: palette.background }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            {heroContent.eyebrow && (
              <div
                className="mb-6 inline-block rounded-full border px-4 py-1.5"
                style={{
                  borderColor: palette.accent,
                  color: palette.text,
                }}
              >
                {heroContent.eyebrow}
              </div>
            )}

            <h1
              className="mb-6 text-5xl font-bold md:text-6xl"
              style={{
                color: palette.text,
                fontFamily: brandConfig.fonts.heading,
              }}
            >
              {heroContent.headline || brandConfig.brandName}
            </h1>

            <p
              className="mb-8 max-w-xl text-lg"
              style={{ color: palette.mutedText }}
            >
              {heroContent.subheadline || brandConfig.brandDescription}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                style={{
                  backgroundColor: palette.primary,
                  color: palette.primaryForeground,
                }}
              >
                {heroContent.primaryCta.label}
                {PrimaryIcon && <PrimaryIcon className="ml-2 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: palette.accent,
                  color: palette.text,
                }}
              >
                {heroContent.secondaryCta.label}
              </Button>
            </div>

            <div
              className="mt-12 grid grid-cols-3 gap-8 border-t pt-8"
              style={{ borderColor: palette.border }}
            >
              {brandConfig.stats.map((stat) => (
                <div key={stat.label}>
                  <div
                    className="mb-1 text-2xl font-bold"
                    style={{ color: palette.text }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: palette.mutedText }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {brandConfig.images.hero && (
            <div className="relative">
              <ImageWithFallback
                src={brandConfig.images.hero}
                alt={`${brandConfig.brandName} hero`}
                className="relative rounded-2xl shadow-xl"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
