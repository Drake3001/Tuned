"use client";

import { useEffect, useState } from "react";

/**
 * Ticks down seconds remaining until `phaseEndsAt` (epoch ms).
 * Re-renders ~10x/sec so timers stay smooth between server state pushes.
 */
export function useCountdown(phaseEndsAt: number | null): number {
  const compute = () =>
    phaseEndsAt ? Math.max(0, (phaseEndsAt - Date.now()) / 1000) : 0;

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    if (!phaseEndsAt) {
      setRemaining(0);
      return;
    }
    setRemaining(Math.max(0, (phaseEndsAt - Date.now()) / 1000));
    const id = setInterval(() => {
      const left = Math.max(0, (phaseEndsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [phaseEndsAt]);

  return remaining;
}
