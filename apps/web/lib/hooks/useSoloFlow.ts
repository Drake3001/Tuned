import { useCallback, useEffect, useState } from "react";
import type { RGB } from "@/lib/game/color";
import { fetchJson } from "@/lib/api/client";

export type Phase = "loading" | "playing" | "submitting" | "result" | "error";

export type Attempt = {
  index: number;
  target: RGB;
  guess: RGB;
  deltaE: number;
  scorePct: number;
};

export type Result = {
  finalScore: number;
  avgDeltaE: number;
  perAttempt: Attempt[];
};

export function useSoloFlow(difficulty: "EASY" | "HARD") {
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targets, setTargets] = useState<RGB[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setError(null);

    fetchJson<{ sessionId: string; difficulty: "EASY" | "HARD"; targets: RGB[] }>(
      "/api/game/solo/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      },
    )
      .then((data) => {
        if (cancelled) return;
        setSessionId(data.sessionId);
        setTargets(data.targets);
        setPhase("playing");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "unknown error");
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [difficulty, nonce]);

  const submit = useCallback(
    async (guesses: RGB[]) => {
      if (!sessionId) return;
      setPhase("submitting");
      try {
        const data = await fetchJson<Result>("/api/game/solo/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, guesses }),
        });
        setResult(data);
        setPhase("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown error");
        setPhase("error");
      }
    },
    [sessionId],
  );

  const restart = useCallback(() => setNonce((n) => n + 1), []);

  return { phase, targets, result, error, submit, restart };
}
