import { ciede2000 } from "./ciede2000";
import { rgbToLab, type RGB } from "./space";

export type { RGB, Lab, XYZ } from "./space";
export { rgbToLab, srgbToLinear, linearToXyz, xyzToLab } from "./space";
export { ciede2000 } from "./ciede2000";

export function deltaE(rgb1: RGB, rgb2: RGB): number {
  return ciede2000(rgbToLab(rgb1), rgbToLab(rgb2));
}
