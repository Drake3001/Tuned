"use client";

import { useState } from "react";
import type { RGB } from "@/lib/game/color";
import { MemorizePhase } from "./MemorizePhase";
import { RecallPhase } from "./RecallPhase";

const MEMORIZE_BY_DIFFICULTY: Record<string, number> = {
  EASY: 4,
  HARD: 2,
};

type Props = {
  targets: RGB[];
  difficulty: "EASY" | "HARD";
  onComplete: (guesses: RGB[]) => void;
};

export function InterleavedPhase({ targets, difficulty, onComplete }: Props) {
  const memorizeSec = MEMORIZE_BY_DIFFICULTY[difficulty] ?? 3;
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<"memorize" | "recall">("memorize");
  const [guesses, setGuesses] = useState<RGB[]>([]);

  const target = targets[index];
  if (!target) return null;

  if (step === "memorize") {
    return (
      <MemorizePhase
        target={target}
        durationSec={memorizeSec}
        index={index}
        total={targets.length}
        onComplete={() => setStep("recall")}
      />
    );
  }

  return (
    <RecallPhase
      target={target}
      difficulty={difficulty}
      index={index}
      total={targets.length}
      onSubmit={(guess) => {
        const next = [...guesses, guess];
        setGuesses(next);
        if (next.length >= targets.length) {
          onComplete(next);
        } else {
          setIndex((i) => i + 1);
          setStep("memorize");
        }
      }}
    />
  );
}
