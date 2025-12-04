import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { FeatureCard } from "./components/FeatureCard";
import { FuturisticCube } from "./components/FuturisticCube";
import { Button } from "./components/ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { getBrandConfig } from "./shared-brand-config";
import { getIconComponent } from "./utils/icon-mapper";

export default function App() {
  const brandConfig = getBrandConfig();
  const colors = brandConfig.colors;

  useEffect(() => {
    const colorEntries: Record<string, string | undefined> = {
      "--brand-primary": colors.primary,
      "--brand-secondary": colors.secondary,
      "--brand-accent": colors.accent,
      "--brand-bg": colors.background,
      "--brand-text": colors.text,
      "--brand-white": colors.white,
      "--brand-black": colors.black,
      "--brand-muted": colors.muted ?? colors.text,
      "--brand-border": colors.border ?? colors.text,
      "--brand-surface": colors.surface ?? colors.background,
      "--primary": colors.primary,
      "--primary-foreground": colors.white,
      "--secondary": colors.secondary,
      "--secondary-foreground": colors.white,
      "--accent": colors.accent,
      "--accent-foreground": colors.white,
      "--background": colors.background,
      "--foreground": colors.text,
      "--text": colors.text,
      "--overlay": `${colors.black}80`,
      "--muted-border": colors.border ?? colors.text,
    };

    Object.entries(colorEntries).forEach(([key, value]) => {
      if (value) {
        document.documentElement.style.setProperty(key, value);
      }
    });
    
    // Set typography CSS variables if available
    if (brandConfig.typography) {
      const { typography } = brandConfig;
      const root = document.documentElement;
      
      // Set font families
      root.style.setProperty("--font-primary", typography.primaryFont);
      root.style.setProperty("--font-secondary", typography.secondaryFont);
      
      // Set font hierarchy CSS variables
      if (Array.isArray(typography.fontHierarchy)) {
        typography.fontHierarchy.forEach((h) => {
          const label = String(h.label || '').toLowerCase().replace(/\s+/g, '-');
          if (label && h.font && h.size && h.weight) {
            root.style.setProperty(`--font-${label}-family`, h.font);
            root.style.setProperty(`--font-${label}-size`, h.size);
            root.style.setProperty(`--font-${label}-weight`, h.weight);
          }
        });
      }
      
      // Load Google Fonts if needed
      if (typography.primaryFont && !typography.primaryFont.includes('Arial') && !typography.primaryFont.includes('sans-serif')) {
        const fontName = typography.primaryFont.replace(/\s+/g, '+');
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
      if (typography.secondaryFont && !typography.secondaryFont.includes('Arial') && !typography.secondaryFont.includes('sans-serif')) {
        const fontName = typography.secondaryFont.replace(/\s+/g, '+');
        if (!document.querySelector(`link[href*="${fontName}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
          document.head.appendChild(link);
        }
      }
    }
  }, [colors, brandConfig]);

  const gradientBackground = useMemo(
    () => `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    [colors.primary, colors.secondary]
  );

  const navLinks = brandConfig.navigation?.links ?? [];
  const navCtaLabel = brandConfig.navigation?.ctaLabel ?? "";
  const navCtaIcon = getIconComponent(brandConfig.navigation?.ctaIcon);

  const heroContent = {
    eyebrow: brandConfig.hero?.eyebrow ?? brandConfig.industry,
    primaryCta: brandConfig.hero?.primaryCta ?? brandConfig.brandName,
    primaryCtaIcon: brandConfig.hero?.primaryCtaIcon,
    secondaryCta: brandConfig.hero?.secondaryCta ?? brandConfig.brandDescription,
    secondaryCtaIcon: brandConfig.hero?.secondaryCtaIcon,
    scrollHint: brandConfig.hero?.scrollHint ?? "",
  };
  const PrimaryCtaIcon = getIconComponent(heroContent.primaryCtaIcon);
  const SecondaryCtaIcon = getIconComponent(heroContent.secondaryCtaIcon);

  const featureCards =
    brandConfig.featuresContent?.cards?.length
      ? brandConfig.featuresContent.cards
      : brandConfig.features;

  const featureContent = {
    heading: brandConfig.featuresContent?.heading ?? brandConfig.brandName,
    subheading: brandConfig.featuresContent?.subheading ?? brandConfig.brandDescription,
  };

  const technologyContent = {
    heading: brandConfig.technologyContent?.heading ?? brandConfig.brandName,
    description: brandConfig.technologyContent?.description ?? brandConfig.brandDescription,
    metrics: brandConfig.technologyContent?.metrics ?? [],
    ctaLabel: brandConfig.technologyContent?.ctaLabel ?? "",
    ctaIcon: brandConfig.technologyContent?.ctaIcon,
  };
  const TechnologyCtaIcon = getIconComponent(technologyContent.ctaIcon);

  const innovationContent = {
    heading: brandConfig.innovationContent?.heading ?? brandConfig.brandName,
    description: brandConfig.innovationContent?.description ?? brandConfig.brandDescription,
    ctaLabel: brandConfig.innovationContent?.ctaLabel ?? "",
    ctaIcon: brandConfig.innovationContent?.ctaIcon,
  };
  const InnovationCtaIcon = getIconComponent(innovationContent.ctaIcon);

  const ctaContent = {
    heading: brandConfig.ctaContent?.heading ?? brandConfig.brandName,
    description: brandConfig.ctaContent?.description ?? brandConfig.brandDescription,
    primaryCta: brandConfig.ctaContent?.primaryCta ?? "",
    primaryCtaIcon: brandConfig.ctaContent?.primaryCtaIcon,
    secondaryCta: brandConfig.ctaContent?.secondaryCta ?? "",
    secondaryCtaIcon: brandConfig.ctaContent?.secondaryCtaIcon,
    trustMessage: brandConfig.ctaContent?.trustMessage ?? "",
  };
  const CtaPrimaryIcon = getIconComponent(ctaContent.primaryCtaIcon);
  const CtaSecondaryIcon = getIconComponent(ctaContent.secondaryCtaIcon);

  const footerContent = brandConfig.footerContent ?? {
    description: brandConfig.brandDescription,
    columns: [],
    copyright: "",
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: brandConfig.fonts.body,
      }}
    >
      <AnimatedBackground palette={colors} />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 container mx-auto px-6 py-6"
      >
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            {brandConfig.logoUrl ? (
              <img src={brandConfig.logoUrl} alt={brandConfig.brandName} className="h-10 w-auto" />
            ) : (
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: gradientBackground }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <span style={{ color: colors.text, fontFamily: brandConfig.fonts.heading }}>
                  {brandConfig.brandName.charAt(0)}
                </span>
              </motion.div>
            )}
            <span className="text-xl" style={{ color: colors.text }}>
              {brandConfig.brandName}
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-opacity"
                style={{ color: colors.muted ?? colors.text, opacity: 0.9 }}
              >
                {link.label}
              </a>
            ))}
            {navCtaLabel ? (
              <Button style={{ background: gradientBackground, color: colors.text }}>
                {navCtaLabel}
                {navCtaIcon && <navCtaIcon className="ml-2 h-4 w-4" />}
              </Button>
            ) : null}
          </div>
        </div>
      </motion.nav>

      <section className="relative container mx-auto px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 rounded-full mb-6"
              style={{
                border: `1px solid ${colors.border ?? colors.accent}`,
                backgroundColor: colors.surface ?? colors.background,
              }}
            >
              <span style={{ color: colors.primary }}>{heroContent.eyebrow}</span>
            </motion.div>

            <h1
              className="text-5xl md:text-7xl mb-6 font-bold"
              style={{ fontFamily: brandConfig.fonts.heading, color: colors.text }}
            >
              {brandConfig.brandName}
            </h1>

            <p className="text-xl mb-8" style={{ color: colors.text, opacity: 0.85 }}>
              {brandConfig.brandDescription}
            </p>

            <div className="flex flex-wrap gap-4">
              {heroContent.primaryCta ? (
                <Button size="lg" style={{ background: gradientBackground, color: colors.text }}>
                  {heroContent.primaryCta}
                  {PrimaryCtaIcon && <PrimaryCtaIcon className="ml-2 h-5 w-5" />}
                </Button>
              ) : null}
              {heroContent.secondaryCta ? (
                <Button
                  size="lg"
                  variant="outline"
                  style={{ borderColor: colors.primary, color: colors.text }}
                >
                  {heroContent.secondaryCta}
                  {SecondaryCtaIcon && <SecondaryCtaIcon className="ml-2 h-5 w-5" />}
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12">
              {brandConfig.stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                    {stat.value}
                  </div>
                  <div className="text-sm" style={{ color: colors.text, opacity: 0.6 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <FuturisticCube palette={colors} />
          </motion.div>
        </div>

        {heroContent.scrollHint ? (
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm tracking-wide"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: colors.muted ?? colors.text }}
          >
            {heroContent.scrollHint}
          </motion.div>
        ) : null}
      </section>

      <section id="features" className="relative container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl mb-4" style={{ color: colors.text }}>
            {featureContent.heading}
          </h2>
          <p className="text-xl" style={{ color: colors.muted ?? colors.text }}>
            {featureContent.subheading}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              title={feature.title} 
              description={feature.description} 
              index={index}
              icon={(feature as any).icon}
            />
          ))}
        </div>
      </section>

      <section id="technology" className="relative container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary}33, ${colors.secondary}33)` }}
            />
            <ImageWithFallback
              src={brandConfig.images.technology || brandConfig.images.hero || ""}
              alt={technologyContent.heading}
              className="relative rounded-2xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ color: colors.text }}>
              {technologyContent.heading}
            </h2>
            <p className="text-xl mb-6" style={{ color: colors.muted ?? colors.text }}>
              {technologyContent.description}
            </p>

            <div className="space-y-4 mb-8">
              {technologyContent.metrics.map((stat, i) => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-2" style={{ color: colors.muted ?? colors.text }}>
                    <span>{stat.label}</span>
                    <span style={{ color: colors.primary }}>{stat.value}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.border ?? colors.accent }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${stat.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: gradientBackground }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {technologyContent.ctaLabel ? (
              <Button style={{ background: gradientBackground, color: colors.text }}>
                {technologyContent.ctaLabel}
                {TechnologyCtaIcon && <TechnologyCtaIcon className="ml-2 h-4 w-4" />}
              </Button>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="relative container mx-auto px-6 py-20">
        <div
          className="relative rounded-3xl overflow-hidden backdrop-blur-sm p-12 md:p-16"
          style={{
            border: `1px solid ${colors.border ?? colors.accent}`,
            background: `linear-gradient(135deg, ${(colors.surface ?? colors.background)} 0%, transparent 70%)`,
          }}
        >
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ background: `linear-gradient(135deg, ${colors.primary}33, ${colors.secondary}33)` }}
          />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl mb-6" style={{ color: colors.text }}>
                {innovationContent.heading}
              </h2>
              <p className="text-xl mb-8" style={{ color: colors.muted ?? colors.text }}>
                {innovationContent.description}
              </p>
              {innovationContent.ctaLabel ? (
                <Button size="lg" style={{ backgroundColor: colors.text, color: colors.background }}>
                  {innovationContent.ctaLabel}
                  {InnovationCtaIcon && <InnovationCtaIcon className="ml-2 h-5 w-5" />}
                </Button>
              ) : null}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <ImageWithFallback
                src={brandConfig.images.innovation || brandConfig.images.hero || ""}
                alt={innovationContent.heading}
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-6xl mb-6" style={{ color: colors.text }}>
            {ctaContent.heading}
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: colors.muted ?? colors.text }}>
            {ctaContent.description}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {ctaContent.primaryCta ? (
              <Button size="lg" style={{ background: gradientBackground, color: colors.text }}>
                {ctaContent.primaryCta}
                {CtaPrimaryIcon && <CtaPrimaryIcon className="ml-2 h-5 w-5" />}
              </Button>
            ) : null}

            {ctaContent.secondaryCta ? (
              <Button
                size="lg"
                variant="outline"
                style={{ borderColor: colors.primary, color: colors.text }}
              >
                {ctaContent.secondaryCta}
                {CtaSecondaryIcon && <CtaSecondaryIcon className="ml-2 h-5 w-5" />}
              </Button>
            ) : null}
          </div>

          {ctaContent.trustMessage ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-16 flex flex-wrap justify-center gap-8 items-center"
              style={{ color: colors.muted ?? colors.text, opacity: 0.8 }}
            >
              <span>{ctaContent.trustMessage}</span>
            </motion.div>
          ) : null}
        </motion.div>
      </section>

      <footer className="relative py-12" style={{ borderTop: `1px solid ${colors.border ?? colors.accent}` }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: gradientBackground, color: colors.text }}
                >
                  {brandConfig.brandName.charAt(0)}
                </div>
                <span style={{ color: colors.text }}>{brandConfig.brandName}</span>
              </div>
              <p className="text-sm" style={{ color: colors.muted ?? colors.text }}>
                {footerContent.description}
              </p>
            </div>

            {footerContent.columns.map((column) => (
              <div key={column.title}>
                <div className="mb-4" style={{ color: colors.text }}>
                  {column.title}
                </div>
                <div className="space-y-2 text-sm" style={{ color: colors.muted ?? colors.text }}>
                  {column.links.map((link) => (
                    <div key={link}>{link}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="pt-8 text-center text-sm"
            style={{ borderTop: `1px solid ${colors.border ?? colors.accent}`, color: colors.muted ?? colors.text }}
          >
            {footerContent.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}