"use client";

import { useEffect, useState } from "react";
import type { RGB } from "@/lib/game/color";
import { GameCard, CardTopLeft, CardTopRight } from "./GameCard";

type Props = {
  target: RGB;
  durationSec: number;
  index: number;
  total: number;
  onComplete: () => void;
};

export function MemorizePhase({ target, durationSec, index, total, onComplete }: Props) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    setRemaining(durationSec);
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, durationSec - (Date.now() - start) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onComplete();
      }
    }, 80);
    return () => clearInterval(id);
  }, [durationSec, onComplete]);

  const bg = `rgb(${target[0]}, ${target[1]}, ${target[2]})`;

  return (
    <GameCard background={bg}>
      <CardTopLeft>
        {index + 1} / {total}
      </CardTopLeft>
      <CardTopRight>{remaining.toFixed(1)}s</CardTopRight>
    </GameCard>
  );
}
