import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { FeatureCard } from "./components/FeatureCard";
import { FuturisticCube } from "./components/FuturisticCube";
import { Button } from "./components/ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { getBrandConfig } from "./shared-brand-config";

export default function App() {
  const brandConfig = getBrandConfig();
  const palette = brandConfig.colorPalette;

  useEffect(() => {
    const paletteEntries: Record<string, string | undefined> = {
      "--brand-primary": palette.primary,
      "--brand-secondary": palette.secondary,
      "--brand-accent": palette.accent,
      "--brand-bg": palette.background,
      "--brand-text": palette.text,
      "--brand-muted": palette.muted ?? palette.text,
      "--brand-border": palette.border ?? palette.text,
      "--brand-surface": palette.surface ?? palette.background,
    };

    Object.entries(paletteEntries).forEach(([key, value]) => {
      if (value) {
        document.documentElement.style.setProperty(key, value);
      }
    });
  }, [palette]);

  const gradientBackground = useMemo(
    () => `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
    [palette.primary, palette.secondary]
  );

  const navLinks = brandConfig.navigation?.links ?? [];
  const navCtaLabel = brandConfig.navigation?.ctaLabel ?? "";

  const heroContent = {
    eyebrow: brandConfig.hero?.eyebrow ?? brandConfig.industry,
    primaryCta: brandConfig.hero?.primaryCta ?? brandConfig.brandName,
    secondaryCta: brandConfig.hero?.secondaryCta ?? brandConfig.brandDescription,
    scrollHint: brandConfig.hero?.scrollHint ?? "",
  };

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
  };

  const innovationContent = {
    heading: brandConfig.innovationContent?.heading ?? brandConfig.brandName,
    description: brandConfig.innovationContent?.description ?? brandConfig.brandDescription,
    ctaLabel: brandConfig.innovationContent?.ctaLabel ?? "",
  };

  const ctaContent = {
    heading: brandConfig.ctaContent?.heading ?? brandConfig.brandName,
    description: brandConfig.ctaContent?.description ?? brandConfig.brandDescription,
    primaryCta: brandConfig.ctaContent?.primaryCta ?? "",
    secondaryCta: brandConfig.ctaContent?.secondaryCta ?? "",
    trustMessage: brandConfig.ctaContent?.trustMessage ?? "",
  };

  const footerContent = brandConfig.footerContent ?? {
    description: brandConfig.brandDescription,
    columns: [],
    copyright: "",
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        fontFamily: brandConfig.fonts.body,
      }}
    >
      <AnimatedBackground palette={palette} />

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
                <span style={{ color: palette.text, fontFamily: brandConfig.fonts.heading }}>
                  {brandConfig.brandName.charAt(0)}
                </span>
              </motion.div>
            )}
            <span className="text-xl" style={{ color: palette.text }}>
              {brandConfig.brandName}
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-opacity"
                style={{ color: palette.muted ?? palette.text, opacity: 0.9 }}
              >
                {link.label}
              </a>
            ))}
            {navCtaLabel ? (
              <Button style={{ background: gradientBackground, color: palette.text }}>
                {navCtaLabel}
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
                border: `1px solid ${palette.border ?? palette.accent}`,
                backgroundColor: palette.surface ?? palette.background,
              }}
            >
              <span style={{ color: palette.primary }}>{heroContent.eyebrow}</span>
            </motion.div>

            <h1
              className="text-5xl md:text-7xl mb-6 font-bold"
              style={{ fontFamily: brandConfig.fonts.heading, color: palette.text }}
            >
              {brandConfig.brandName}
            </h1>

            <p className="text-xl mb-8" style={{ color: palette.text, opacity: 0.85 }}>
              {brandConfig.brandDescription}
            </p>

            <div className="flex flex-wrap gap-4">
              {heroContent.primaryCta ? (
                <Button size="lg" style={{ background: gradientBackground, color: palette.text }}>
                  {heroContent.primaryCta}
                </Button>
              ) : null}
              {heroContent.secondaryCta ? (
                <Button
                  size="lg"
                  variant="outline"
                  style={{ borderColor: palette.primary, color: palette.text }}
                >
                  {heroContent.secondaryCta}
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
                  <div className="text-3xl font-bold" style={{ color: palette.primary }}>
                    {stat.value}
                  </div>
                  <div className="text-sm" style={{ color: palette.text, opacity: 0.6 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <FuturisticCube palette={palette} />
          </motion.div>
        </div>

        {heroContent.scrollHint ? (
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm tracking-wide"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: palette.muted ?? palette.text }}
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
          <h2 className="text-4xl md:text-5xl mb-4" style={{ color: palette.text }}>
            {featureContent.heading}
          </h2>
          <p className="text-xl" style={{ color: palette.muted ?? palette.text }}>
            {featureContent.subheading}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feature, index) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} index={index} />
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
              style={{ background: `linear-gradient(135deg, ${palette.primary}33, ${palette.secondary}33)` }}
            />
            <ImageWithFallback
              src={brandConfig.images.technology || brandConfig.images.hero}
              alt={technologyContent.heading}
              className="relative rounded-2xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ color: palette.text }}>
              {technologyContent.heading}
            </h2>
            <p className="text-xl mb-6" style={{ color: palette.muted ?? palette.text }}>
              {technologyContent.description}
            </p>

            <div className="space-y-4 mb-8">
              {technologyContent.metrics.map((stat, i) => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-2" style={{ color: palette.muted ?? palette.text }}>
                    <span>{stat.label}</span>
                    <span style={{ color: palette.primary }}>{stat.value}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: palette.border ?? palette.accent }}
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
              <Button style={{ background: gradientBackground, color: palette.text }}>
                {technologyContent.ctaLabel}
              </Button>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="relative container mx-auto px-6 py-20">
        <div
          className="relative rounded-3xl overflow-hidden backdrop-blur-sm p-12 md:p-16"
          style={{
            border: `1px solid ${palette.border ?? palette.accent}`,
            background: `linear-gradient(135deg, ${(palette.surface ?? palette.background)} 0%, transparent 70%)`,
          }}
        >
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ background: `linear-gradient(135deg, ${palette.primary}33, ${palette.secondary}33)` }}
          />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl mb-6" style={{ color: palette.text }}>
                {innovationContent.heading}
              </h2>
              <p className="text-xl mb-8" style={{ color: palette.muted ?? palette.text }}>
                {innovationContent.description}
              </p>
              {innovationContent.ctaLabel ? (
                <Button size="lg" style={{ backgroundColor: palette.text, color: palette.background }}>
                  {innovationContent.ctaLabel}
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
                src={brandConfig.images.innovation || brandConfig.images.hero}
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
          <h2 className="text-4xl md:text-6xl mb-6" style={{ color: palette.text }}>
            {ctaContent.heading}
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: palette.muted ?? palette.text }}>
            {ctaContent.description}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {ctaContent.primaryCta ? (
              <Button size="lg" style={{ background: gradientBackground, color: palette.text }}>
                {ctaContent.primaryCta}
              </Button>
            ) : null}

            {ctaContent.secondaryCta ? (
              <Button
                size="lg"
                variant="outline"
                style={{ borderColor: palette.primary, color: palette.text }}
              >
                {ctaContent.secondaryCta}
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
              style={{ color: palette.muted ?? palette.text, opacity: 0.8 }}
            >
              <span>{ctaContent.trustMessage}</span>
            </motion.div>
          ) : null}
        </motion.div>
      </section>

      <footer className="relative py-12" style={{ borderTop: `1px solid ${palette.border ?? palette.accent}` }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: gradientBackground, color: palette.text }}
                >
                  {brandConfig.brandName.charAt(0)}
                </div>
                <span style={{ color: palette.text }}>{brandConfig.brandName}</span>
              </div>
              <p className="text-sm" style={{ color: palette.muted ?? palette.text }}>
                {footerContent.description}
              </p>
            </div>

            {footerContent.columns.map((column) => (
              <div key={column.title}>
                <div className="mb-4" style={{ color: palette.text }}>
                  {column.title}
                </div>
                <div className="space-y-2 text-sm" style={{ color: palette.muted ?? palette.text }}>
                  {column.links.map((link) => (
                    <div key={link}>{link}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="pt-8 text-center text-sm"
            style={{ borderTop: `1px solid ${palette.border ?? palette.accent}`, color: palette.muted ?? palette.text }}
          >
            {footerContent.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}