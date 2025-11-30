import type { BrandConfig } from "../shared-brand-config";
import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface GalleryProps {
  config: BrandConfig;
  tokens: BrandTokens;
  content: TemplateContent["gallery"];
}

export function Gallery({ config, tokens, content }: GalleryProps) {
  const galleryImages = config.images.gallery ?? [];
  const tiles = content.tiles.map((tile, index) => ({
    ...tile,
    image: galleryImages[index] ?? galleryImages[0] ?? config.images.hero,
  }));

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: withAlpha(tokens.colors.background, 0.92) }}
    >
      <div
        className="absolute top-10 right-10 w-80 h-80 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.accent, 0.15) }}
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.secondary, 0.15) }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 space-y-6">
          <div
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl"
            style={{
              background: tokens.colors.surface,
              color: tokens.colors.text,
            }}
          >
            {content.badgeLabel}
          </div>

          <h2 className="text-6xl space-y-2" style={{ color: tokens.colors.text }}>
            {content.headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>

          <p className="text-xl" style={{ color: tokens.colors.mutedText }}>
            {content.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto">
          {tiles.map((tile, index) => (
            <div
              key={`${tile.image}-${index}`}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-xl border transition-transform hover:-translate-y-1"
              style={{ borderColor: tokens.colors.border, background: tokens.colors.surface }}
            >
              <ImageWithFallback
                src={tile.image}
                alt={`Gallery tile ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(180deg, transparent 20%, ${withAlpha(
                    tokens.colors.text,
                    0.8,
                  )})`,
                }}
              >
                <div className="text-sm font-semibold" style={{ color: tokens.colors.onPrimary }}>
                  Engagement snapshot
                </div>
                <div
                  className="flex gap-4 text-lg font-medium"
                  style={{ color: tokens.colors.onPrimary }}
                >
                  <span>{tile.likes} likes</span>
                  <span>{tile.comments} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <a
            className="inline-flex items-center justify-center px-10 py-5 rounded-full text-xl shadow-2xl transition-transform hover:-translate-y-1"
            style={{
              background: tokens.gradients.primary,
              color: tokens.colors.onPrimary,
            }}
            href="#"
          >
            {content.ctaLabel}
          </a>
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
          <div
            className="p-8 rounded-3xl shadow-2xl"
            style={{ background: tokens.gradients.accent }}
          >
            <div
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ background: tokens.colors.surface }}
            >
              <div className="aspect-video flex items-center justify-center relative">
                <div className="text-center space-y-4 px-8" style={{ color: tokens.colors.text }}>
                  <div className="text-2xl font-semibold">{content.videoTitle}</div>
                  <div style={{ color: tokens.colors.mutedText }}>{content.videoSubtitle}</div>
                  <div className="pt-4">
                    <button
                      className="px-8 py-4 rounded-full text-lg"
                      style={{
                        background: tokens.gradients.primary,
                        color: tokens.colors.onPrimary,
                        border: "none",
                      }}
                    >
                      {content.videoCta}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
