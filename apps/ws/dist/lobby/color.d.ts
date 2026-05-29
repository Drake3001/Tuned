import type { RGB } from "./types.js";
export type Lab = readonly [number, number, number];
export type XYZ = readonly [number, number, number];
export declare function rgbToLab(rgb: RGB): Lab;
export declare function ciede2000(lab1: Lab, lab2: Lab): number;
export declare function deltaE(rgb1: RGB, rgb2: RGB): number;
export declare function rgbToHsb(rgb: RGB): {
    hue: number;
    saturation: number;
    brightness: number;
};
//# sourceMappingURL=color.d.ts.map