"use client";

import type { RGB } from "@/lib/game/color";
import { rgbToHsb } from "@/lib/game/color/conversions";
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

function describe(d: number): string {
  if (d < 1) return "Practically pixel-perfect.";
  if (d < 3) return "Honestly, eerie.";
  if (d < 6) return "Trained eye.";
  if (d < 12) return "You remembered a color. Close to this one.";
  if (d < 25) return "You remembered a color. Just not this one.";
  return "Different color entirely.";
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

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <div className="tuned-card relative h-[460px] w-full max-w-2xl overflow-hidden">
        <div className="grid h-full grid-rows-2">
          <section
            className="relative flex flex-col justify-between p-8"
            style={{ background: guessBg, color: "rgba(255,255,255,0.95)" }}
          >
            <div className="flex items-start justify-between">
              <span style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm">
                {index + 1} / {total}
              </span>
              <div className="text-right">
                <div className="font-mono text-6xl font-bold leading-none tabular-nums">
                  {deltaE.toFixed(2)}
                </div>
                <p
                  className="mt-2 max-w-[14ch] text-right text-base"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {describe(deltaE)}
                </p>
              </div>
            </div>
            <div>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                your selection
              </div>
              <div className="font-mono text-sm">{formatHsb(guess)}</div>
            </div>
          </section>

          <section
            className="relative flex flex-col justify-end p-8"
            style={{ background: targetBg, color: "rgba(0,0,0,0.85)" }}
          >
            <div>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: "rgba(0,0,0,0.55)" }}
              >
                original
              </div>
              <div className="font-mono text-sm">{formatHsb(target)}</div>
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
