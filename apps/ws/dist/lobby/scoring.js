import { deltaE } from "./color.js";
export const MEMORIZE_MS = 3000;
export const RECALL_MS = 12000;
export const SCORING_MS = 4000;
export const HIT_SQUARE_THRESHOLD = 5;
export function deltaEToScorePct(d) {
    return Math.max(0, Math.min(100, 100 - d * 2));
}
export function scoreHitSquare(target, guess, threshold = HIT_SQUARE_THRESHOLD) {
    const d = deltaE(target, guess);
    return { hit: d < threshold, deltaE: d };
}
export function randomRgb() {
    const byte = () => Math.floor(Math.random() * 256);
    return [byte(), byte(), byte()];
}
//# sourceMappingURL=scoring.js.map