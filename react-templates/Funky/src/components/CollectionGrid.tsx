import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { BrandConfig } from "../shared-brand-config";

interface CollectionGridProps {
  brandConfig: BrandConfig;
}

export function CollectionGrid({ brandConfig }: CollectionGridProps) {
  const { colors, images, features } = brandConfig;
  
  // Create collections from features and gallery images
  const collections = features.slice(0, 3).map((feature, index) => ({
    id: index + 1,
    title: feature.title,
    description: feature.description,
    image: images.gallery[index] || images.hero || "",
    gradient: `linear-gradient(to right, ${index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.accent}, ${index === 0 ? colors.secondary : index === 1 ? colors.accent : colors.primary})`,
  }));
  return (
    <section className="py-20 px-6 md:px-12">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl mb-4" style={{ color: colors.text }}>
            Featured <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >Collections</span>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: colors.text, opacity: 0.7 }}>
            {brandConfig.brandDescription}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="group relative overflow-hidden rounded-3xl shadow-xl cursor-pointer"
            >
              <div className="aspect-[3/4] relative">
                <ImageWithFallback
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t to-transparent" style={{ background: `linear-gradient(to top, ${colors.black}CC, ${colors.black}33, transparent)` }} />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{ color: colors.white }}>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    <p className="text-sm mb-2 opacity-90">{collection.description}</p>
                    <h3 className="mb-4">{collection.title}</h3>
                    <div
                      className="inline-block px-4 py-2 rounded-full text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ background: collection.gradient }}
                    >
                      Shop Now →
                    </div>
                  </motion.div>
                </div>

                {/* Decorative Corner */}
                <div
                  className="absolute top-4 right-4 w-16 h-16 rounded-full blur-xl opacity-60"
                  style={{ background: collection.gradient }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
