import { useEffect, useMemo } from "react";
import { getBrandConfig } from "./shared-brand-config";
import { Button } from "./components/ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

interface ContactEntry {
  label: string;
  href?: string;
}

export default function App() {
  const brandConfig = getBrandConfig();

  const heroMedia =
    brandConfig.images.hero ||
    brandConfig.images.gallery?.[0] ||
    brandConfig.logoUrl ||
    "";

  const galleryImages = (brandConfig.images.gallery || []).filter(
    (image): image is string => Boolean(image),
  );

  const navTokens = useMemo(() => {
    const tokens = [
      brandConfig.brandName,
      brandConfig.industry,
      brandConfig.brandDescription,
      ...brandConfig.features.map((feature) => feature.title),
    ].filter(Boolean) as string[];

    return Array.from(new Set(tokens));
  }, [brandConfig]);

  const descriptiveCopy = [
    brandConfig.features[0]?.description,
    brandConfig.features[1]?.description,
    brandConfig.brandDescription,
  ].filter(Boolean) as string[];

  const primaryCta = brandConfig.features[0]?.title ?? brandConfig.brandName;
  const secondaryCta = brandConfig.features[1]?.title ?? brandConfig.industry;

  const contactEntries = [
    brandConfig.contact.email && {
      label: brandConfig.contact.email,
      href: `mailto:${brandConfig.contact.email}`,
    },
    brandConfig.contact.phone && {
      label: brandConfig.contact.phone,
      href: `tel:${brandConfig.contact.phone}`,
    },
    brandConfig.contact.address && {
      label: brandConfig.contact.address,
    },
  ].filter(Boolean) as ContactEntry[];

  const galleryLabels = useMemo(() => {
    const labels = [
      ...brandConfig.features.map((feature) => feature.title),
      ...brandConfig.features.map((feature) => feature.description),
      ...brandConfig.stats.map((stat) => stat.label),
      brandConfig.brandDescription,
      brandConfig.industry,
      brandConfig.brandName,
    ].filter(Boolean) as string[];

    if (labels.length > 0) {
      return labels;
    }

    return [brandConfig.brandName].filter(Boolean) as string[];
  }, [brandConfig]);

  useEffect(() => {
    const root = document.documentElement;
    const tokenMap: Record<string, string | undefined> = {
      "--brand-primary": brandConfig.colorPalette.primary,
      "--brand-secondary": brandConfig.colorPalette.secondary,
      "--brand-accent": brandConfig.colorPalette.accent,
      "--brand-background": brandConfig.colorPalette.background,
      "--brand-text": brandConfig.colorPalette.text,
      "--brand-font-heading": brandConfig.fonts.heading,
      "--brand-font-body": brandConfig.fonts.body,
    };

    Object.entries(tokenMap).forEach(([token, value]) => {
      if (value) {
        root.style.setProperty(token, value);
      }
    });
  }, [brandConfig]);

  return (
    <div
      className="min-h-screen bg-background text-foreground transition-colors duration-300"
      style={{ fontFamily: "var(--brand-font-body, inherit)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {brandConfig.logoUrl && (
              <ImageWithFallback
                src={brandConfig.logoUrl}
                alt={brandConfig.brandName}
                className="h-16 w-16 rounded-2xl border border-border object-cover"
              />
            )}
            <div className="space-y-1">
              {brandConfig.industry && (
                <p className="text-sm uppercase tracking-wider text-muted-foreground">
                  {brandConfig.industry}
                </p>
              )}
              <h1
                className="text-4xl font-semibold"
                style={{ fontFamily: "var(--brand-font-heading, inherit)" }}
              >
                {brandConfig.brandName}
              </h1>
            </div>
          </div>

          {brandConfig.brandDescription && (
            <p className="text-lg text-muted-foreground">
              {brandConfig.brandDescription}
            </p>
          )}

          {navTokens.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {navTokens.slice(0, 6).map((token) => (
                <span
                  key={token}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  {token}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            {descriptiveCopy.map((copy, index) => (
              <p
                key={`${copy}-${index}`}
                className="text-base text-muted-foreground"
              >
                {copy}
              </p>
            ))}

            <div className="flex flex-wrap gap-4">
              {primaryCta && (
                <Button size="lg" className="min-w-40 justify-center">
                  {primaryCta}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-40 justify-center"
                >
                  {secondaryCta}
                </Button>
              )}
            </div>
          </div>

          {heroMedia && (
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <ImageWithFallback
                src={heroMedia}
                alt={brandConfig.brandName}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </section>

        {brandConfig.stats.length > 0 && (
          <section className="grid gap-6 md:grid-cols-3">
            {brandConfig.stats.map((stat, index) => (
              <article
                key={`${stat.label}-${stat.value}-${index}`}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <p
                  className="text-3xl font-semibold"
                  style={{ fontFamily: "var(--brand-font-heading, inherit)" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </article>
            ))}
          </section>
        )}

        {brandConfig.features.length > 0 && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {brandConfig.features.map((feature, index) => (
                <article
                  key={`${feature.title}-${feature.description}-${index}`}
                  className="rounded-3xl border border-border bg-card p-6"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {feature.title}
                  </p>
                  <p className="text-lg">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {galleryImages.length > 0 && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {galleryImages.map((image, index) => {
                const label =
                  galleryLabels[index % galleryLabels.length] ||
                  brandConfig.brandName;
                return (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-3xl border border-border bg-card"
                  >
                    <ImageWithFallback
                      src={image}
                      alt={label}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {contactEntries.length > 0 && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {contactEntries.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="rounded-3xl border border-border bg-card p-6"
                >
                  {entry.href ? (
                    <a
                      href={entry.href}
                      className="text-base underline-offset-4 hover:underline"
                    >
                      {entry.label}
                    </a>
                  ) : (
                    <p className="text-base">{entry.label}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-border pt-8 text-sm text-muted-foreground">
          {[brandConfig.brandName, brandConfig.industry, brandConfig.brandDescription]
            .filter(Boolean)
            .join(" • ")}
        </footer>
      </div>
    </div>
  );
}

