import { motion } from "motion/react";
import { Sparkles, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import type { BrandConfig } from "../shared-brand-config";

interface FooterProps {
  brandConfig: BrandConfig;
}

export function Footer({ brandConfig }: FooterProps) {
  const { colors, logoUrl, brandName, brandDescription } = brandConfig;
  const footerGradient = `linear-gradient(to bottom right, ${colors.text}dd, ${colors.primary}dd, ${colors.secondary}dd)`;
  const bottomGradient = `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`;
  const footerLinks = {
    Shop: ["Men's Collection", "Women's Collection", "Shalwar Kameez", "Suits & Formals", "Casual Wear"],
    About: ["Our Story", "Designers", "Sustainability", "Careers", "Press"],
    Support: ["Contact Us", "FAQs", "Shipping Info", "Returns", "Size Guide"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"],
  };

  return (
    <footer className="pt-20 pb-10 px-6 md:px-12" style={{ background: footerGradient, color: colors.white }}>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
                ) : (
                  <Sparkles className="w-8 h-8" style={{ color: colors.accent }} />
                )}
                <span className="tracking-wider font-bold">{brandName}</span>
              </div>
              <p className="text-sm" style={{ color: colors.background, opacity: 0.8 }}>
                {brandDescription}
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Instagram, color: "hover:text-pink-400" },
                  { icon: Facebook, color: "hover:text-blue-400" },
                  { icon: Twitter, color: "hover:text-cyan-400" },
                  { icon: Youtube, color: "hover:text-red-400" },
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href="#"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: `${colors.white}1A` }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h4 className="mb-4" style={{ color: colors.accent }}>{category}</h4>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href="#"
                      className="text-sm transition-colors"
                      style={{ color: colors.background, opacity: 0.8 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.white;
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.background;
                        e.currentTarget.style.opacity = '0.8';
                      }}
                    >
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t pt-8"
          style={{ borderColor: `${colors.white}1A` }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm" style={{ color: colors.background, opacity: 0.8 }}>
              © 2024 {brandName}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm" style={{ color: colors.background, opacity: 0.8 }}>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="transition-colors"
                style={{ color: colors.background, opacity: 0.8 }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.white}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.background; e.currentTarget.style.opacity = '0.8'; }}
              >
                Privacy
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="transition-colors"
                style={{ color: colors.background, opacity: 0.8 }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.white}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.background; e.currentTarget.style.opacity = '0.8'; }}
              >
                Terms
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="transition-colors"
                style={{ color: colors.background, opacity: 0.8 }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.white}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.background; e.currentTarget.style.opacity = '0.8'; }}
              >
                Cookies
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: bottomGradient }} />
      </div>
    </footer>
  );
}
