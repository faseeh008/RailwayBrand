export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const parseHex = (hex: string): RgbColor | null => {
  const normalized = hex.replace("#", "").trim();
  if (!normalized) return null;

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split("").map((char) => parseInt(char.repeat(2), 16));
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b };
  }

  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b };
  }

  return null;
};

const parseRgb = (value: string): RgbColor | null => {
  const matches = value.match(/rgba?\(([^)]+)\)/i);
  if (!matches) return null;

  const [r, g, b] = matches[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => parseFloat(channel.trim()));

  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;

  return { r, g, b };
};

const toRgb = (value?: string): RgbColor | null => {
  if (!value) return null;
  const trimmed = value.trim();

  if (trimmed.startsWith("#")) {
    return parseHex(trimmed);
  }

  if (trimmed.startsWith("rgb")) {
    return parseRgb(trimmed);
  }

  return null;
};

const rgbToString = (color: RgbColor, alpha?: number) => {
  if (typeof alpha === "number") {
    return `rgba(${clamp(color.r)}, ${clamp(color.g)}, ${clamp(color.b)}, ${Math.min(
      1,
      Math.max(0, alpha),
    )})`;
  }

  return `rgb(${clamp(color.r)}, ${clamp(color.g)}, ${clamp(color.b)})`;
};

export const withAlpha = (value: string | undefined, alpha: number): string => {
  const rgb = toRgb(value);
  if (!rgb) {
    return "transparent";
  }
  return rgbToString(rgb, alpha);
};

export const mixColors = (base: string | undefined, mixWith: string | undefined, ratio: number) => {
  const baseRgb = toRgb(base);
  const mixRgb = toRgb(mixWith);

  if (!baseRgb) return mixWith ?? "transparent";
  if (!mixRgb) return base ?? "transparent";

  const clampedRatio = Math.max(0, Math.min(1, ratio));

  const r = baseRgb.r * (1 - clampedRatio) + mixRgb.r * clampedRatio;
  const g = baseRgb.g * (1 - clampedRatio) + mixRgb.g * clampedRatio;
  const b = baseRgb.b * (1 - clampedRatio) + mixRgb.b * clampedRatio;

  return rgbToString({ r, g, b });
};

const luminance = (value: string | undefined) => {
  const rgb = toRgb(value);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastingColor = (
  reference: string | undefined,
  lightColor: string | undefined,
  darkColor: string | undefined,
) => {
  const referenceLum = luminance(reference);
  const lightLum = luminance(lightColor);
  const darkLum = luminance(darkColor);

  if (referenceLum === 0 && lightLum === 0 && darkLum === 0) {
    return lightColor ?? "currentColor";
  }

  const lightContrast = Math.abs(referenceLum - lightLum);
  const darkContrast = Math.abs(referenceLum - darkLum);

  if (lightContrast >= darkContrast) {
    return lightColor ?? "currentColor";
  }

  return darkColor ?? "currentColor";
};

