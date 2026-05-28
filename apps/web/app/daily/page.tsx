"use client";

import { useEffect, useState } from "react";
import { InterleavedPhase } from "@/components/solo/InterleavedPhase";
import { ResultScreen } from "@/components/solo/ResultScreen";
import { fetchJson } from "@/lib/api/client";
import type { RGB } from "@/lib/game/color";

type Phase = "loading" | "playing" | "result" | "error" | "alreadyPlayed";

type ResultData = {
  finalScore: number;
  avgDeltaE: number;
  perAttempt: Array<{
    index: number;
    target: RGB;
    guess: RGB;
    deltaE: number;
    scorePct: number;
  }>;
};

export default function DailyPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [targets, setTargets] = useState<RGB[]>([]);
  const [day, setDay] = useState<string>("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ day: string; targets: RGB[]; alreadyPlayed: boolean }>("/api/daily/today")
      .then((d) => {
        setDay(d.day);
        if (d.alreadyPlayed) {
          setPhase("alreadyPlayed");
          return;
        }
        setTargets(d.targets);
        setPhase("playing");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "failed");
        setPhase("error");
      });
  }, []);

  const submit = async (guesses: RGB[]) => {
    try {
      const data = await fetchJson<ResultData>("/api/daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guesses }),
      });
      setResult(data);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
      setPhase("error");
    }
  };

  if (phase === "loading") return <p className="p-12 text-center">loading…</p>;
  if (phase === "error")
    return <p className="p-12 text-center text-red-400">{error}</p>;
  if (phase === "alreadyPlayed")
    return (
      <p className="p-12 text-center text-muted-foreground">
        you already played today&apos;s challenge ({day})
      </p>
    );
  if (phase === "playing")
    return <InterleavedPhase targets={targets} difficulty="HARD" onComplete={submit} />;
  if (phase === "result" && result)
    return (
      <ResultScreen
        finalScore={result.finalScore}
        perAttempt={result.perAttempt}
        difficulty={`DAILY · ${day}`}
      />
    );
  return null;
}
