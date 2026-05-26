// Color space conversions: sRGB → linear → XYZ (D65) → Lab.
// All functions pure. Inputs/outputs are immutable tuples.

export type RGB = readonly [number, number, number];
export type Lab = readonly [number, number, number];
export type XYZ = readonly [number, number, number];

// D65 reference white (2° observer).
const D65: XYZ = [95.047, 100.0, 108.883];

function srgbChannelToLinear(c: number): number {
  // c is 0..255; normalize and gamma-expand.
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

export function srgbToLinear(rgb: RGB): RGB {
  return [srgbChannelToLinear(rgb[0]), srgbChannelToLinear(rgb[1]), srgbChannelToLinear(rgb[2])];
}

export function linearToXyz(lin: RGB): XYZ {
  // sRGB → XYZ matrix (D65). Result on 0..100 scale.
  const [r, g, b] = lin;
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100,
  ];
}

function fLab(t: number): number {
  // CIE: f(t) = t^(1/3) for t > (6/29)^3, else (1/3)(29/6)^2 t + 4/29.
  const eps = 216 / 24389; // = (6/29)^3
  const k = 24389 / 27; // = (29/3)^3
  return t > eps ? Math.cbrt(t) : (k * t + 16) / 116;
}

export function xyzToLab(xyz: XYZ): Lab {
  const fx = fLab(xyz[0] / D65[0]);
  const fy = fLab(xyz[1] / D65[1]);
  const fz = fLab(xyz[2] / D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function rgbToLab(rgb: RGB): Lab {
  return xyzToLab(linearToXyz(srgbToLinear(rgb)));
}
