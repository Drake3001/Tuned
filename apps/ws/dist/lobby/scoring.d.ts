import type { RGB } from "./types.js";
export declare const MEMORIZE_MS = 3000;
export declare const RECALL_MS = 12000;
export declare const SCORING_MS = 4000;
export declare const HIT_SQUARE_THRESHOLD = 5;
export declare function deltaEToScorePct(d: number): number;
export declare function scoreHitSquare(target: RGB, guess: RGB, threshold?: number): {
    hit: boolean;
    deltaE: number;
};
export declare function randomRgb(): RGB;
//# sourceMappingURL=scoring.d.ts.map