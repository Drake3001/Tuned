import { deltaE, type RGB } from "./color";

export type SoloScoreBreakdown = {
  perAttempt: Array<{
    index: number;
    target: RGB;
    guess: RGB;
    deltaE: number;
    scorePct: number;
  }>;
  avgDeltaE: number;
  finalScore: number;
};

export type HitSquareResult = {
  hit: boolean;
  deltaE: number;
};

export const HIT_SQUARE_THRESHOLD = 5;

export function deltaEToScorePct(d: number): number {
  // 0 ΔE → 100%, 50 ΔE or worse → 0%. Linear.
  return Math.max(0, Math.min(100, 100 - d * 2));
}

export function scoreColorAccuracy(targets: RGB[], guesses: RGB[]): SoloScoreBreakdown {
  if (targets.length !== guesses.length) {
    throw new Error("targets and guesses must have equal length");
  }
  const perAttempt = targets.map((target, index) => {
    const guess = guesses[index];
    if (!guess) throw new Error(`missing guess at index ${index}`);
    const d = deltaE(target, guess);
    return { index, target, guess, deltaE: d, scorePct: deltaEToScorePct(d) };
  });
  if (perAttempt.length === 0) {
    return { perAttempt, avgDeltaE: 0, finalScore: 0 };
  }
  const avgDeltaE = perAttempt.reduce((s, a) => s + a.deltaE, 0) / perAttempt.length;
  const finalScore = perAttempt.reduce((s, a) => s + a.scorePct, 0) / perAttempt.length;
  return { perAttempt, avgDeltaE, finalScore };
}

// Backwards-compatible alias for solo flow.
export const scoreSolo = scoreColorAccuracy;

export function scoreHitSquare(
  target: RGB,
  guess: RGB,
  threshold = HIT_SQUARE_THRESHOLD,
): HitSquareResult {
  const d = deltaE(target, guess);
  return { hit: d < threshold, deltaE: d };
}
