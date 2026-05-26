"use client";

import { useEffect, useState } from "react";
import type { RGB } from "@/lib/game/color";
import { Timer } from "./Timer";

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
    <div
      className="fixed inset-0 flex items-start justify-between p-6 transition-colors"
      style={{ background: bg }}
    >
      <div className="rounded-md bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
        memorize · {index + 1} / {total}
      </div>
      <div className="rounded-md bg-black/60 px-3 py-1.5 text-white backdrop-blur">
        <Timer seconds={remaining} />
      </div>
    </div>
  );
}
