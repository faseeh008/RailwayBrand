import type { BrandTokens } from "../theme/brand-tokens";
import type { TemplateContent } from "../template-content";
import { withAlpha } from "../utils/color";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getIconComponent } from "../utils/icon-mapper";

interface FooterProps {
  tokens: BrandTokens;
  content: TemplateContent["footer"];
}

export function Footer({ tokens, content }: FooterProps) {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: tokens.gradients.primary, color: tokens.colors.onPrimary }}
    >
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.background, 0.1) }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: withAlpha(tokens.colors.background, 0.1) }}
      />

      <div className="relative container mx-auto px-4 py-16 space-y-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div>
              <h3
                className="mb-2"
                style={{
                  fontFamily: 'var(--font-h1-family, inherit)',
                  fontSize: 'var(--font-h1-size, 2.25rem)',
                  fontWeight: 'var(--font-h1-weight, 600)'
                }}
              >
                <span>{content.brandLines[0]}</span>
                <span className="block">{content.brandLines[1]}</span>
              </h3>
              <p
                style={{
                  color: withAlpha(tokens.colors.onPrimary, 0.7),
                  fontFamily: 'var(--font-body-family, inherit)',
                  fontSize: 'var(--font-body-size, 1rem)',
                  fontWeight: 'var(--font-body-weight, 400)'
                }}
              >
                {content.tagline}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {content.socialLinks.map((link) => {
                const Icon = link.icon ? getIconComponent(link.icon) : null;
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    className="px-4 py-2 rounded-full text-sm flex items-center gap-2"
                    style={{
                      background: tokens.colors.surface,
                      color: tokens.colors.text,
                    }}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4
              className="mb-6"
              style={{
                fontFamily: 'var(--font-h2-family, inherit)',
                fontSize: 'var(--font-h2-size, 1.5rem)',
                fontWeight: 'var(--font-h2-weight, 600)'
              }}
            >
              Quick links
            </h4>
            <ul className="space-y-3">
              {content.quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    className="inline-block transition-transform"
                    style={{ color: withAlpha(tokens.colors.onPrimary, 0.8) }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-6"
              style={{
                fontFamily: 'var(--font-h2-family, inherit)',
                fontSize: 'var(--font-h2-size, 1.5rem)',
                fontWeight: 'var(--font-h2-weight, 600)'
              }}
            >
              Contact
            </h4>
            <ul className="space-y-4" style={{ color: withAlpha(tokens.colors.onPrimary, 0.8) }}>
              <li>{content.contact.address}</li>
              <li>{content.contact.phone}</li>
              <li>{content.contact.email}</li>
            </ul>
          </div>

          <div>
            <h4
              className="mb-6"
              style={{
                fontFamily: 'var(--font-h2-family, inherit)',
                fontSize: 'var(--font-h2-size, 1.5rem)',
                fontWeight: 'var(--font-h2-weight, 600)'
              }}
            >
              Newsletter
            </h4>
            <p className="mb-4" style={{ color: withAlpha(tokens.colors.onPrimary, 0.8) }}>
              {content.newsletter.intro}
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder={content.newsletter.placeholder}
                className="rounded-full px-6"
                style={{
                  background: withAlpha(tokens.colors.background, 0.2),
                  borderColor: withAlpha(tokens.colors.onPrimary, 0.3),
                  color: tokens.colors.onPrimary,
                }}
              />
              <Button
                className="w-full rounded-full py-4"
                style={{
                  background: tokens.gradients.accent,
                  color: tokens.colors.onPrimary,
                  border: "none",
                }}
              >
                {content.newsletter.ctaLabel}
              </Button>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-8 text-center shadow-2xl"
          style={{ background: tokens.colors.surface, color: tokens.colors.text }}
        >
          <h4 className="text-3xl mb-2">{content.hours.heading}</h4>
          <p style={{ color: tokens.colors.mutedText }}>{content.hours.details}</p>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between gap-4 text-sm"
          style={{ borderTop: `1px solid ${withAlpha(tokens.colors.onPrimary, 0.2)}` }}
        >
          <p>{content.bottomNote}</p>
          <p>{content.copyright}</p>
          <div className="flex gap-6">
            {content.legalLinks.map((link) => (
              <a key={link.label} href={link.url} style={{ color: tokens.colors.onPrimary }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
