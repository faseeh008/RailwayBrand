import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../icon-registry";

interface AboutProps {
  brandConfig: BrandConfig;
}

export function About({ brandConfig }: AboutProps) {
  const palette = brandConfig.colorPalette;
  const aboutContent = brandConfig.aboutContent;
  const HighlightIcon = getIconComponent(aboutContent.highlightIcon);
  const aboutImage = brandConfig.images.gallery[0];

  return (
    <section
      className="px-6 py-20 md:py-24"
      style={{ backgroundColor: palette.background }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {aboutImage && (
            <div className="relative order-2 lg:order-1">
              <ImageWithFallback
                src={aboutImage}
                alt={`About ${brandConfig.brandName}`}
                className="relative rounded-2xl shadow-xl"
              />
            </div>
          )}

          <div className="order-1 lg:order-2">
            <h2
              className="mb-6 text-4xl font-bold"
              style={{ color: palette.text, fontFamily: brandConfig.fonts.heading }}
            >
              {aboutContent.title}
            </h2>
            <p
              className="mb-8 text-lg"
              style={{ color: palette.mutedText }}
            >
              {aboutContent.description || brandConfig.brandDescription}
            </p>

            <div className="space-y-4">
              {aboutContent.highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: palette.accent }}
                  >
                    {HighlightIcon && (
                      <HighlightIcon
                        className="h-4 w-4"
                        style={{ color: palette.accentForeground }}
                      />
                    )}
                  </div>
                  <span style={{ color: palette.text }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
