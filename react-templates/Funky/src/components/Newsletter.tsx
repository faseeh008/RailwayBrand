import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mail, Gift } from "lucide-react";
import type { BrandConfig } from "../shared-brand-config";

interface NewsletterProps {
  brandConfig: BrandConfig;
}

export function Newsletter({ brandConfig }: NewsletterProps) {
  const { colors } = brandConfig;
  const newsletterGradient = `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
  
  return (
    <section className="py-20 px-6 md:px-12">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-12 md:p-16"
          style={{ color: colors.white }}
          style={{ background: newsletterGradient }}
        >
          {/* Animated Background Shapes */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: `${colors.white}1A` }}
          />
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.3, 1] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: `${colors.white}1A` }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${colors.white}33` }}>
                <Gift className="w-10 h-10" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl mb-4"
            >
              Get 20% Off Your First Order! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-8 max-w-2xl mx-auto"
              style={{ color: colors.background, opacity: 0.9 }}
            >
              {brandConfig.brandDescription}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.text, opacity: 0.5 }} />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pl-12 h-14 rounded-full border-none"
                  style={{ backgroundColor: colors.white, color: colors.text }}
                />
              </div>
              <Button
                className="h-14 px-8 rounded-full"
                style={{
                  backgroundColor: colors.text,
                  color: colors.white,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.text;
                }}
              >
                Subscribe Now
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-6 mt-8 text-sm"
              style={{ color: colors.background, opacity: 0.9 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.white}33` }}>
                  ✓
                </div>
                No spam
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.white}33` }}>
                  ✓
                </div>
                Unsubscribe anytime
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.white}33` }}>
                  ✓
                </div>
                Exclusive deals
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
