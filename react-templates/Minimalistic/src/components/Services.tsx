import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../icon-registry";

interface ServicesProps {
  brandConfig: BrandConfig;
}

export function Services({ brandConfig }: ServicesProps) {
  const colors = brandConfig.colors;
  const servicesContent = brandConfig.servicesContent;

  return (
    <section
      className="px-6 py-20 md:py-24"
      style={{ backgroundColor: colors.background }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2
            className="mb-4 text-4xl font-bold"
            style={{ color: colors.text, fontFamily: brandConfig.fonts.heading }}
          >
            {servicesContent.title}
          </h2>
          <p
            className="mx-auto max-w-2xl"
            style={{ color: colors.mutedText }}
          >
            {servicesContent.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicesContent.items.map((service) => {
            const Icon = getIconComponent(service.icon);
            return (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-2xl border p-8 transition-all hover:shadow-xl"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                {Icon && (
                  <div
                    className="mb-4 inline-flex rounded-xl p-3"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: colors.white }}
                    />
                  </div>
                )}
                <h3
                  className="mb-3 text-xl font-semibold"
                  style={{ color: colors.text }}
                >
                  {service.title}
                </h3>
                <p style={{ color: colors.mutedText }}>
                  {service.description}
                </p>

                <div
                  className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-10"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
