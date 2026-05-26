import { deltaE, type RGB } from "./color";
import { rgbToHsb, hsbToRgb } from "./color/conversions";

const MIN_DELTA = 3;
const MAX_DELTA = 6;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function jitterChannel(value: number, amount: number): number {
  return value + (Math.random() * 2 - 1) * amount;
}

function perturbHsb(target: RGB): RGB {
  const [h, s, b] = rgbToHsb(target);
  const newH = (h + jitterChannel(0, 30) + 360) % 360;
  const newS = clamp01(s + jitterChannel(0, 0.18));
  const newB = clamp01(b + jitterChannel(0, 0.18));
  return hsbToRgb([newH, newS, newB]);
}

function perturbRgb(target: RGB, amount: number): RGB {
  return [
    clampByte(jitterChannel(target[0], amount)),
    clampByte(jitterChannel(target[1], amount)),
    clampByte(jitterChannel(target[2], amount)),
  ];
}

/**
 * Generate `count` palette entries given a target. The output contains the
 * target plus (count - 1) distractors, each within ΔE [MIN_DELTA, MAX_DELTA]
 * of the target (≈80–90% similarity per `100 - 2·ΔE` curve). Order is
 * shuffled — caller can recover the correct index via deepEqual to `target`.
 */
export function generateSimilarPalette(target: RGB, count = 5): RGB[] {
  const distractors: RGB[] = [];
  let attempts = 0;
  const cap = 200;
  while (distractors.length < count - 1 && attempts < cap) {
    attempts++;
    const candidate =
      Math.random() < 0.75 ? perturbHsb(target) : perturbRgb(target, 30);
    const d = deltaE(target, candidate);
    if (d < MIN_DELTA || d > MAX_DELTA) continue;
    // de-dup vs existing distractors
    const dup = distractors.some((c) => deltaE(c, candidate) < 1);
    if (dup) continue;
    distractors.push(candidate);
  }
  // Fallback: if we couldn't fill, pad with broader perturbations.
  while (distractors.length < count - 1) {
    distractors.push(perturbRgb(target, 50));
  }
  const all = [target, ...distractors];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i]!;
    all[i] = all[j]!;
    all[j] = tmp;
  }
  return all;
}
