import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../icon-registry";

interface FooterProps {
  brandConfig: BrandConfig;
}

export function Footer({ brandConfig }: FooterProps) {
  const colors = brandConfig.colors;
  const footerContent = brandConfig.footerContent;
  const currentYear = new Date().getFullYear();

  const legalCopy = footerContent.legalText
    .replace("{year}", String(currentYear))
    .replace("{brand}", brandConfig.brandName);

  const contactLinks = [
    brandConfig.contact.email
      ? { label: brandConfig.contact.email, href: `mailto:${brandConfig.contact.email}` }
      : null,
    brandConfig.contact.phone
      ? { label: brandConfig.contact.phone, href: `tel:${brandConfig.contact.phone}` }
      : null,
    brandConfig.contact.address
      ? { label: brandConfig.contact.address }
      : null,
  ].filter(Boolean) as Array<{ label: string; href?: string }>;

  const columns = [...footerContent.columns];
  if (contactLinks.length > 0) {
    columns.push({
      title: brandConfig.contact.title ?? "Contact",
      links: contactLinks,
    });
  }

  return (
    <footer
      className="px-6 py-16"
      style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.background,
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              {brandConfig.logoUrl ? (
                <img
                  src={brandConfig.logoUrl}
                  alt={brandConfig.brandName}
                  className="h-9 w-auto"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <span style={{ color: colors.white }}>
                    {brandConfig.brandName[0]}
                  </span>
                </div>
              )}
              <span style={{ color: colors.text }}>
                {brandConfig.brandName}
              </span>
            </div>
            <p className="mb-6" style={{ color: colors.mutedText }}>
              {brandConfig.brandDescription}
            </p>
            <div className="flex gap-4">
              {footerContent.social.map((social) => {
                const Icon = getIconComponent(social.icon);
                if (!Icon) return null;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border transition-all"
                    style={{ borderColor: colors.border }}
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" style={{ color: colors.text }} />
                  </a>
                );
              })}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <div
                className="mb-4 font-semibold"
                style={{ color: colors.text }}
              >
                {column.title}
              </div>
              <div className="flex flex-col gap-3">
                {column.links.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{ color: colors.mutedText }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span
                      key={link.label}
                      style={{ color: colors.mutedText }}
                    >
                      {link.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-12 border-t pt-8 text-center"
          style={{
            borderColor: colors.border,
            color: colors.mutedText,
          }}
        >
          {legalCopy}
        </div>
      </div>
    </footer>
  );
}
