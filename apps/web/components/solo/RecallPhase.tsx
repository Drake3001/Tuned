"use client";

import { useState } from "react";
import type { RGB } from "@/lib/game/color";
import { CardSidePicker } from "@/components/picker/CardSidePicker";
import { PaletteChoice } from "./PaletteChoice";
import { GameCard, CardTopLeft, CardTopRight, CardActionButton } from "./GameCard";
import { legibleLabel } from "@/lib/game/color/contrast";

type Props = {
  target: RGB;
  difficulty: "EASY" | "HARD";
  index: number;
  total: number;
  onSubmit: (guess: RGB) => void;
};

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RecallPhase({ target, difficulty, index, total, onSubmit }: Props) {
  const [guess, setGuess] = useState<RGB>([128, 128, 128]);

  if (difficulty === "EASY") {
    return (
      <GameCard>
        <div className="flex h-full flex-col p-8">
          <header className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">
              {index + 1} / {total}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              tuned.gg
            </span>
          </header>
          <div className="flex flex-1 items-center justify-center">
            <PaletteChoice target={target} onSelect={onSubmit} />
          </div>
        </div>
      </GameCard>
    );
  }

  const bg = `rgb(${guess[0]}, ${guess[1]}, ${guess[2]})`;
  const labelColor = legibleLabel(guess, 0.75);
  const mutedColor = legibleLabel(guess, 0.5);
  return (
    <GameCard background={bg}>
      <CardTopLeft color={labelColor}>
        {index + 1} / {total}
      </CardTopLeft>
      <CardTopRight color={mutedColor}>tuned.gg</CardTopRight>
      <CardSidePicker value={guess} onChange={setGuess} />
      <CardActionButton
        onClick={() => onSubmit(guess)}
        ariaLabel={index + 1 === total ? "submit" : "lock in"}
      >
        <TargetIcon />
      </CardActionButton>
    </GameCard>
  );
}
