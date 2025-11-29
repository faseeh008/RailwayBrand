import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../icon-registry";

interface NavbarProps {
  brandConfig: BrandConfig;
}

export function Navbar({ brandConfig }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const colors = brandConfig.colors;

  const { MenuIcon, CloseIcon } = useMemo(() => {
    return {
      MenuIcon: getIconComponent(brandConfig.navigation.menuIcon),
      CloseIcon: getIconComponent(brandConfig.navigation.closeIcon),
    };
  }, [brandConfig.navigation.closeIcon, brandConfig.navigation.menuIcon]);

  const navLinkStyle = {
    color: colors.text,
    opacity: 0.75,
  };

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-lg"
      style={{
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span
              className="font-medium"
              style={{ color: colors.text }}
            >
              {brandConfig.brandName}
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {brandConfig.navigation.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors"
                style={navLinkStyle}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <Button
              variant="ghost"
              style={{ color: colors.text }}
            >
              {brandConfig.navigation.cartLabel}
            </Button>
            <Button
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
              }}
            >
              {brandConfig.navigation.primaryCtaLabel}
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{ color: colors.text }}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              CloseIcon ? <CloseIcon className="h-6 w-6" /> : null
            ) : (
              MenuIcon ? <MenuIcon className="h-6 w-6" /> : null
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div
            className="mt-4 flex flex-col gap-4 border-t pt-4 md:hidden"
            style={{ borderColor: colors.border }}
          >
            {brandConfig.navigation.links.map((link) => (
              <a
                key={`mobile-${link.label}`}
                href={link.href}
                className="transition-colors"
                style={navLinkStyle}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                style={{
                  backgroundColor: colors.primary,
                  color: colors.white,
                }}
              >
                {brandConfig.navigation.mobileCtaLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}