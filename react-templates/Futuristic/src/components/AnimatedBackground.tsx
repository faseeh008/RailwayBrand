import { motion } from "motion/react";
import type { BrandConfig } from "../shared-brand-config";
import { RotatingSphere } from "./RotatingSphere";

interface AnimatedBackgroundProps {
  palette: BrandConfig["colorPalette"];
}

const withOpacity = (color: string, opacity: number) => `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;

export function AnimatedBackground({ palette }: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${withOpacity(palette.background, 1)}, ${withOpacity(
            palette.accent,
            0.4
          )})`,
        }}
      />

      <RotatingSphere palette={palette} />

      <motion.div className="absolute bottom-[10%] left-[10%] w-[450px] h-[450px]" style={{ perspective: "1500px" }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: 360, rotateY: 360 }}
          transition={{
            rotateX: { duration: 20, repeat: Infinity, ease: "linear" },
            rotateY: { duration: 15, repeat: Infinity, ease: "linear" },
          }}
        >
          {[
            "translateZ(225px)",
            "rotateY(180deg) translateZ(225px)",
            "rotateY(90deg) translateZ(225px)",
            "rotateY(-90deg) translateZ(225px)",
            "rotateX(90deg) translateZ(225px)",
            "rotateX(-90deg) translateZ(225px)",
          ].map((transform, idx) => (
            <div
              key={transform}
              className="absolute inset-0 backdrop-blur-sm"
              style={{
                transform,
                border: `3px solid ${withOpacity(idx % 2 === 0 ? palette.primary : palette.secondary, 0.7)}`,
                background: `linear-gradient(135deg, ${withOpacity(palette.primary, 0.25)}, transparent)`,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: `linear-gradient(135deg, ${withOpacity(palette.primary, 0.2)}, ${withOpacity(
            palette.secondary,
            0.2
          )})`,
        }}
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `linear-gradient(135deg, ${withOpacity(palette.accent, 0.2)}, ${withOpacity(palette.secondary, 0.2)})`,
        }}
        animate={{ rotate: -360, scale: [1, 1.3, 1] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, scale: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
      />

      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl"
        style={{
          background: `linear-gradient(135deg, ${withOpacity(palette.secondary, 0.2)}, ${withOpacity(palette.accent, 0.2)})`,
        }}
        animate={{ rotate: 360, x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: "linear" },
          x: { duration: 15, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-20 h-20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            border: `1px solid ${withOpacity(palette.primary, 0.3)}`,
          }}
          animate={{ rotate: [0, 360], scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, ${palette.primary} 1px, transparent 1px),
            linear-gradient(to bottom, ${palette.primary} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}