"use client";

import Link from "next/link";
import type { RGB } from "@/lib/game/color";

type Attempt = {
  index: number;
  target: RGB;
  guess: RGB;
  deltaE: number;
  scorePct: number;
};

type Props = {
  finalScore: number;
  perAttempt: Attempt[];
  difficulty: string;
  onPlayAgain?: () => void;
};

function band(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-yellow-400";
  return "bg-red-500";
}

export function ResultScreen({ finalScore, perAttempt, difficulty, onPlayAgain }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <div className="text-9xl font-black tabular-nums">
          {finalScore.toFixed(1)}
          <span className="text-4xl">%</span>
        </div>
        <p className="mt-2 text-muted-foreground">
          your color accuracy · {difficulty.toLowerCase()}
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {perAttempt.map((a) => (
          <div
            key={a.index}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
          >
            <div
              className="h-10 w-10 rounded border border-border"
              style={{ background: `rgb(${a.target[0]}, ${a.target[1]}, ${a.target[2]})` }}
              aria-label="target"
            />
            <div
              className="h-10 w-10 rounded border border-border"
              style={{ background: `rgb(${a.guess[0]}, ${a.guess[1]}, ${a.guess[2]})` }}
              aria-label="guess"
            />
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span>color {a.index + 1}</span>
                <span className="text-muted-foreground">ΔE {a.deltaE.toFixed(2)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${band(a.scorePct)}`}
                  style={{ width: `${a.scorePct}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-right font-mono tabular-nums">
              {a.scorePct.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {onPlayAgain && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-lg px-6 py-3 font-bold"
            style={{
              background: "var(--tuned-orange)",
              color: "var(--tuned-orange-fg)",
            }}
          >
            play again
          </button>
        )}
        <Link
          href="/"
          className="rounded-lg border border-border px-6 py-3 font-bold hover:bg-muted"
        >
          back home
        </Link>
      </div>
    </main>
  );
}
