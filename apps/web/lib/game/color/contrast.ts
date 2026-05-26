import type { RGB } from "./space";

// Perceived luminance using Rec. 709 coefficients on gamma-decoded sRGB.
export function relativeLuminance(rgb: RGB): number {
  const f = (c: number) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}

export function isLight(rgb: RGB): boolean {
  return relativeLuminance(rgb) > 0.5;
}

// Returns a translucent label color legible against the supplied background.
export function legibleLabel(rgb: RGB, alpha = 0.75): string {
  return isLight(rgb)
    ? `rgba(0, 0, 0, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
}

export function legibleStrong(rgb: RGB): string {
  return isLight(rgb) ? "#0b0b0c" : "#fafafa";
}
