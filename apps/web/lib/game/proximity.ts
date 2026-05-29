// Shared proximity scoring used by solo + multiplayer result views.

// 0..10 closeness; ΔE 0 → 10, ΔE 50+ → 0. Linear.
export function proximityScore(deltaE: number): number {
  if (!Number.isFinite(deltaE)) return 0;
  return Math.max(0, Math.min(10, 10 - deltaE * 0.2));
}

export function describeProximity(score: number): string {
  if (score >= 9.5) return "Practically pixel-perfect.";
  if (score >= 9) return "Honestly, eerie.";
  if (score >= 8) return "Trained eye.";
  if (score >= 6) return "Close. Real close.";
  if (score >= 3) return "You remembered a color. Just not this one.";
  return "Different color entirely.";
}
