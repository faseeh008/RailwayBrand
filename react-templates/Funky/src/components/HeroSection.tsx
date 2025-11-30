import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { BrandConfig } from "../shared-brand-config";
import { getIconComponent } from "../utils/icon-mapper";
import { Sparkles } from "lucide-react";

interface HeroSectionProps {
  brandConfig: BrandConfig;
}

export function HeroSection({ brandConfig }: HeroSectionProps) {
  const { colors, logoUrl, brandName, brandDescription, images, features, logoIcon, heroCtaIcon } = brandConfig;
  
  // Get icon components
  const LogoIcon = (logoIcon ? getIconComponent(logoIcon) : null) || Sparkles;
  const CtaIcon = heroCtaIcon ? getIconComponent(heroCtaIcon) : null;
  
  // Create gradient strings from brand colors
  const gradient1 = `linear-gradient(to bottom right, ${colors.secondary}, ${colors.primary})`;
  const gradient2 = `linear-gradient(to bottom right, ${colors.accent}, ${colors.secondary})`;
  const heroGradient = `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`;
  const textGradient1 = `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
  const textGradient2 = `linear-gradient(to right, ${colors.accent}, ${colors.secondary}, ${colors.primary})`;
  const imageGradient = `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl opacity-60"
        style={{ background: gradient1 }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 rounded-full blur-3xl opacity-60"
        style={{ background: gradient2 }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6"
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
          ) : LogoIcon ? (
            <LogoIcon className="w-8 h-8" style={{ color: colors.primary }} />
          ) : null}
          <span className="tracking-wider font-bold" style={{ color: colors.primary }}>
            {brandName}
          </span>
        </div>
        <div className="hidden md:flex gap-8">
          {features.slice(0, 4).map((feature, index) => (
            <a
              key={index}
              href="#"
              className="transition-colors"
              style={{ 
                color: colors.text,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text}
            >
              {feature.title}
            </a>
          ))}
        </div>
        <Button
          variant="outline"
          style={{
            borderColor: colors.primary,
            color: colors.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
            e.currentTarget.style.color = colors.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.primary;
          }}
        >
          Shop Now
        </Button>
      </motion.nav>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center mt-12 md:mt-0">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 rounded-full"
            style={{ color: colors.white }}
            style={{ background: heroGradient }}
          >
            {brandConfig.industry} Collection 2024
          </motion.div>
          <h1 className="text-6xl md:text-8xl leading-tight" style={{ color: colors.text }}>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: textGradient1,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {features[0]?.title || "BOLD."}
            </span>
            <br />
            <span style={{ color: colors.text }}>{brandName}</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: textGradient2,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {features[1]?.title || "FEARLESS."}
            </span>
          </h1>
          <p className="max-w-md" style={{ color: colors.text, opacity: 0.7 }}>
            {brandDescription}
          </p>
          <div className="flex gap-4">
            <Button
              style={{
                background: heroGradient,
                color: colors.white,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Explore Collection {CtaIcon && <CtaIcon className="ml-2 w-4 h-4" />}
            </Button>
            <Button variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
              Watch Video
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="relative z-10"
          >
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-50"
              style={{ background: imageGradient }}
            />
            <ImageWithFallback
              src={images.hero || ""}
              alt={brandName}
              className="relative rounded-3xl shadow-2xl w-full h-[600px] object-cover"
            />
          </motion.div>

          {/* Floating Tags */}
          {features.slice(0, 2).map((feature, index) => (
            <motion.div
              key={index}
              animate={{ y: [0, index === 0 ? -10 : 10, 0] }}
              transition={{ duration: 3 + index * 1, repeat: Infinity, delay: index * 0.5 }}
              className="absolute px-6 py-3 rounded-full shadow-xl"
              style={{ backgroundColor: colors.white }}
              style={{
                top: index === 0 ? '2.5rem' : 'auto',
                bottom: index === 1 ? '5rem' : 'auto',
                left: index === 0 ? '-1.5rem' : 'auto',
                right: index === 1 ? '-1.5rem' : 'auto',
                borderWidth: '2px',
                borderColor: index === 0 ? colors.primary + '40' : colors.secondary + '40',
              }}
            >
              <span style={{ color: index === 0 ? colors.primary : colors.secondary }}>
                {index === 0 ? '✨ ' : '🔥 '}{feature.title}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
