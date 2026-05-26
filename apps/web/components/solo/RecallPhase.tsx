"use client";

import { useState } from "react";
import type { RGB } from "@/lib/game/color";
import { ColorPicker } from "@/components/picker/ColorPicker";
import { PaletteChoice } from "./PaletteChoice";

type Props = {
  target: RGB;
  difficulty: "EASY" | "HARD";
  index: number;
  total: number;
  onSubmit: (guess: RGB) => void;
};

export function RecallPhase({ target, difficulty, index, total, onSubmit }: Props) {
  const [guess, setGuess] = useState<RGB>([128, 128, 128]);

  if (difficulty === "EASY") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-12">
        <header className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <span>recall · {index + 1} / {total}</span>
        </header>
        <PaletteChoice target={target} onSelect={onSubmit} />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-6"
      style={{ background: `rgb(${guess[0]}, ${guess[1]}, ${guess[2]})` }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-black/60 px-4 py-2 text-white backdrop-blur">
          <span>recall · {index + 1} / {total}</span>
          <span className="text-xs uppercase tracking-wider opacity-75">
            match the color you saw
          </span>
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl bg-black/30 p-6 backdrop-blur">
          <ColorPicker value={guess} onChange={setGuess} showHex />
          <button
            type="button"
            onClick={() => onSubmit(guess)}
            className="w-full rounded-lg px-4 py-3 font-bold"
            style={{
              background: "var(--tuned-orange)",
              color: "var(--tuned-orange-fg)",
            }}
          >
            {index + 1 === total ? "submit" : "lock in & next"}
          </button>
        </div>
      </div>
    </main>
  );
}
