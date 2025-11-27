import { motion } from "motion/react";
import type { BrandConfig } from "../shared-brand-config";

interface RotatingSphereProps {
  palette: BrandConfig["colorPalette"];
}

const withOpacity = (color: string, opacity: number) => `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;

export function RotatingSphere({ palette }: RotatingSphereProps) {
  const particles = [];
  const radius = 400;
  const particleCount = 150;

  for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(-1 + (2 * i) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    particles.push({ x, y, z, id: i });
  }

  return (
    <div className="absolute top-[5%] right-[5%] w-[800px] h-[800px] flex items-center justify-center">
      <motion.div
        className="relative w-full h-full"
        style={{ perspective: "2000px" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          {particles.map((particle) => {
            const scale = (particle.z + radius) / (2 * radius);
            return (
              <motion.div
                key={particle.id}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate3d(${particle.x}px, ${particle.y}px, ${particle.z}px)`,
                  opacity: 0.5 + scale * 0.5,
                  backgroundColor: palette.primary,
                }}
                animate={{
                  boxShadow: [
                    `0 0 15px ${withOpacity(palette.primary, 0.8)}`,
                    `0 0 30px ${withOpacity(palette.secondary, 1)}`,
                    `0 0 15px ${withOpacity(palette.primary, 0.8)}`,
                  ],
                  backgroundColor: [palette.primary, palette.secondary, palette.primary],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: particle.id * 0.01 }}
              />
            );
          })}

          {[...Array(15)].map((_, i) => (
            <div
              key={`circle-${i}`}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `rotateY(${i * 12}deg) rotateX(60deg)`,
                transformStyle: "preserve-3d",
                border: `2px solid ${withOpacity(palette.primary, 0.3)}`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}