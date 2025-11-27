import { motion } from "motion/react";
import type { BrandConfig } from "../shared-brand-config";

interface FuturisticCubeProps {
  palette: BrandConfig["colorPalette"];
}

const withOpacity = (color: string, opacity: number) => `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;

export function FuturisticCube({ palette }: FuturisticCubeProps) {
  const faceTransforms = [
    "translateZ(225px)",
    "rotateY(180deg) translateZ(225px)",
    "rotateY(90deg) translateZ(225px)",
    "rotateY(-90deg) translateZ(225px)",
    "rotateX(90deg) translateZ(225px)",
    "rotateX(-90deg) translateZ(225px)",
  ];

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      <motion.div className="relative w-[450px] h-[450px]" style={{ perspective: "1500px" }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [20, 25, 20], rotateY: [0, 360] }}
          transition={{
            rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
        >
          {faceTransforms.map((transform, index) => (
            <div
              key={transform}
              className="absolute inset-0 backdrop-blur-sm"
              style={{
                transform,
                border: `1px solid ${withOpacity(index % 2 === 0 ? palette.accent : palette.secondary, 0.4)}`,
                background: `linear-gradient(135deg, ${withOpacity(palette.accent, 0.15)}, transparent)`,
                boxShadow: `inset 0 0 60px ${withOpacity(palette.accent, 0.2)}`,
              }}
            >
              <div
                className="absolute inset-[25%] rounded-sm"
                style={{
                  border: `1px solid ${withOpacity(palette.primary, 0.3)}`,
                  background: withOpacity(palette.primary, 0.05),
                }}
              />
            </div>
          ))}

          {[...Array(12)].map((_, i) => {
            const x = (Math.random() - 0.5) * 300;
            const y = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;

            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                  backgroundColor: palette.accent,
                  boxShadow: `0 0 10px ${withOpacity(palette.accent, 0.8)}`,
                }}
                animate={{ y: [0, -20, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            );
          })}
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle, ${withOpacity(palette.accent, 0.2)} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateZ: 360 }}
            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute inset-[-10%] rounded-full"
              style={{
                transform: `rotateX(${60 + i * 30}deg)`,
                border: `1px solid ${withOpacity(palette.primary, 0.2)}`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
