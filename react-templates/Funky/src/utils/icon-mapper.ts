import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Map icon name strings to Lucide React components
export function getIconComponent(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  
  // Convert icon name to PascalCase and get from lucide-react
  const iconKey = iconName as keyof typeof LucideIcons;
  const Icon = LucideIcons[iconKey];
  
  // Check if it's a valid component (not undefined and is a function/component)
  if (Icon && typeof Icon === 'function') {
    return Icon as LucideIcon;
  }
  
  return null;
}

