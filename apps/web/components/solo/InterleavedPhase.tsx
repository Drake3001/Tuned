"use client";

import { useState } from "react";
import type { RGB } from "@/lib/game/color";
import { deltaE } from "@/lib/game/color";
import { MemorizePhase } from "./MemorizePhase";
import { RecallPhase } from "./RecallPhase";
import { AttemptResultCard } from "./AttemptResultCard";

const MEMORIZE_BY_DIFFICULTY: Record<string, number> = {
  EASY: 4,
  HARD: 2,
};

type Props = {
  targets: RGB[];
  difficulty: "EASY" | "HARD";
  onComplete: (guesses: RGB[]) => void;
};

type Step = "memorize" | "recall" | "attempt-result";

export function InterleavedPhase({ targets, difficulty, onComplete }: Props) {
  const memorizeSec = MEMORIZE_BY_DIFFICULTY[difficulty] ?? 3;
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("memorize");
  const [guesses, setGuesses] = useState<RGB[]>([]);
  const [currentGuess, setCurrentGuess] = useState<RGB | null>(null);

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

  if (step === "recall") {
    return (
      <RecallPhase
        target={target}
        difficulty={difficulty}
        index={index}
        total={targets.length}
        onSubmit={(guess) => {
          setCurrentGuess(guess);
          setStep("attempt-result");
        }}
      />
    );
  }

  if (!currentGuess) return null;
  const d = deltaE(target, currentGuess);
  const isFinal = index + 1 === targets.length;

  return (
    <AttemptResultCard
      index={index}
      total={targets.length}
      target={target}
      guess={currentGuess}
      deltaE={d}
      isFinal={isFinal}
      onNext={() => {
        const nextGuesses = [...guesses, currentGuess];
        setGuesses(nextGuesses);
        setCurrentGuess(null);
        if (isFinal) {
          onComplete(nextGuesses);
        } else {
          setIndex((i) => i + 1);
          setStep("memorize");
        }
      }}
    />
  );
}
