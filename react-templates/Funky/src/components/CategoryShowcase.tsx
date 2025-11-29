import { motion } from "motion/react";
import { Shirt, Package, Sparkles, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { BrandConfig } from "../shared-brand-config";

interface CategoryShowcaseProps {
  brandConfig: BrandConfig;
}

export function CategoryShowcase({ brandConfig }: CategoryShowcaseProps) {
  const { colors, images, features, stats } = brandConfig;
  
  // Create categories from features
  const categories = features.slice(0, 4).map((feature, index) => {
    const categoryColors = [colors.primary, colors.secondary, colors.accent, colors.primary];
    const icons = [Shirt, Package, Sparkles, Star];
    return {
      icon: icons[index] || Shirt,
      title: feature.title,
      count: stats[index]?.value + " " + stats[index]?.label || `${(index + 1) * 25}+ Items`,
      color: categoryColors[index],
    };
  });

  // Create gradient background from brand colors
  const sectionGradient = `linear-gradient(to bottom right, ${colors.primary}dd, ${colors.secondary}dd, ${colors.accent}dd)`;
  const imageGradient = `linear-gradient(to right, ${colors.accent}, ${colors.secondary}, ${colors.primary})`;

  return (
    <section className="py-20 px-6 md:px-12 relative overflow-hidden" style={{ background: sectionGradient, color: colors.white }}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 border rounded-full"
            style={{ borderColor: colors.white }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div
              className="absolute -inset-8 rounded-full blur-3xl opacity-40"
              style={{ background: imageGradient }}
            />
            <div className="relative grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="rounded-2xl overflow-hidden shadow-2xl"
              >
                <ImageWithFallback
                  src={images.gallery[0] || images.hero || ""}
                  alt={brandConfig.brandName}
                  className="w-full h-64 object-cover"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="rounded-2xl overflow-hidden shadow-2xl mt-8"
              >
                <ImageWithFallback
                  src={images.gallery[1] || images.hero || ""}
                  alt={brandConfig.brandName}
                  className="w-full h-64 object-cover"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Categories */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-5xl md:text-6xl mb-4">
                Explore Our <span style={{ color: colors.accent }}>Categories</span>
              </h2>
              <p style={{ color: colors.background, opacity: 0.8 }}>
                {brandConfig.brandDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="backdrop-blur-lg p-6 rounded-2xl cursor-pointer group"
                    style={{ backgroundColor: `${colors.white}1A`, borderColor: `${colors.white}33`, borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="w-6 h-6" style={{ color: colors.white }} />
                    </div>
                    <h3 className="mb-1" style={{ color: colors.white }}>{category.title}</h3>
                    <p className="text-sm" style={{ color: colors.background, opacity: 0.8 }}>{category.count}</p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 pt-4"
            >
              {stats.slice(0, 2).map((stat, index) => (
                <div key={index} className="backdrop-blur-lg px-6 py-3 rounded-full" style={{ backgroundColor: `${colors.white}33` }}>
                  <span style={{ color: index === 0 ? colors.accent : colors.secondary }}>
                    {index === 0 ? '⭐ ' : '🎉 '}{stat.value}
                  </span> {stat.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
