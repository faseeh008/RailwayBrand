import { motion } from "motion/react";

interface FeatureCardProps {
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      className="relative group"
    >
      <div
        className="relative p-8 rounded-2xl backdrop-blur-sm overflow-hidden"
        style={{
          border: "1px solid var(--brand-border)",
          background: "linear-gradient(135deg, var(--brand-surface), transparent)",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
            filter: "blur(20px)",
          }}
        />

        <div className="relative z-10 space-y-3">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-semibold"
            style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}
          >
            {title.charAt(0)}
          </div>

          <h3 style={{ color: "var(--brand-text)" }}>{title}</h3>
          <p style={{ color: "var(--brand-muted)" }}>{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
