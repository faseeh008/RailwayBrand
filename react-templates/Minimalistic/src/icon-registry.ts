import type { ComponentType, SVGProps } from "react";
import * as Icons from "lucide-react";

export type IconName = keyof typeof Icons;

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

export const getIconComponent = (iconName?: IconName): LucideIcon | null => {
  if (!iconName) {
    return null;
  }

  const icon = Icons[iconName as IconName];
  if (typeof icon === "function") {
    return icon as LucideIcon;
  }

  return null;
};


