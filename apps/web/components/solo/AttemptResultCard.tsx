"use client";

import type { RGB } from "@/lib/game/color";
import { rgbToHsb } from "@/lib/game/color/conversions";
import { legibleLabel, legibleStrong } from "@/lib/game/color/contrast";
import { proximityScore, describeProximity } from "@/lib/game/proximity";
import { CardActionButton } from "./GameCard";

type Props = {
  index: number;
  total: number;
  target: RGB;
  guess: RGB;
  deltaE: number;
  isFinal: boolean;
  onNext: () => void;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatHsb(rgb: RGB): string {
  const [h, s, b] = rgbToHsb(rgb);
  return `H${Math.round(h)} S${Math.round(s * 100)} B${Math.round(b * 100)}`;
}

export function AttemptResultCard({
  index,
  total,
  target,
  guess,
  deltaE,
  isFinal,
  onNext,
}: Props) {
  const guessBg = `rgb(${guess[0]}, ${guess[1]}, ${guess[2]})`;
  const targetBg = `rgb(${target[0]}, ${target[1]}, ${target[2]})`;
  const guessStrong = legibleStrong(guess);
  const guessMuted = legibleLabel(guess, 0.6);
  const guessLabel = legibleLabel(guess, 0.5);
  const targetStrong = legibleStrong(target);
  const targetMuted = legibleLabel(target, 0.55);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <div className="tuned-card relative h-[460px] w-full max-w-2xl overflow-hidden">
        <div className="grid h-full grid-rows-2">
          <section
            className="relative flex flex-col justify-between p-8"
            style={{ background: guessBg, color: guessStrong }}
          >
            <div className="flex items-start justify-between">
              <span style={{ color: guessMuted }} className="text-sm">
                {index + 1} / {total}
              </span>
              <div className="text-right">
                <div
                  className="font-mono text-6xl font-bold leading-none tabular-nums"
                  style={{ color: guessStrong }}
                >
                  {proximityScore(deltaE).toFixed(2)}
                  <span
                    className="ml-1 text-2xl font-medium"
                    style={{ color: guessMuted }}
                  >
                    / 10
                  </span>
                </div>
                <p
                  className="mt-2 max-w-[14ch] text-right text-base"
                  style={{ color: guessMuted }}
                >
                  {describeProximity(proximityScore(deltaE))}
                </p>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: guessLabel }}>
                your selection
              </div>
              <div className="font-mono text-sm" style={{ color: guessStrong }}>
                {formatHsb(guess)}
              </div>
            </div>
          </section>

          <section
            className="relative flex flex-col justify-end p-8"
            style={{ background: targetBg, color: targetStrong }}
          >
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: targetMuted }}>
                original
              </div>
              <div className="font-mono text-sm" style={{ color: targetStrong }}>
                {formatHsb(target)}
              </div>
            </div>
          </section>
        </div>

        <CardActionButton onClick={onNext} ariaLabel={isFinal ? "see summary" : "next color"}>
          <ArrowIcon />
        </CardActionButton>
      </div>
    </div>
  );
}
