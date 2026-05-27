"use client";

import { useEffect, useState } from "react";
import { InterleavedPhase } from "@/components/solo/InterleavedPhase";
import { ResultScreen } from "@/components/solo/ResultScreen";
import { mockApi } from "@/lib/mock/api";
import type { RGB } from "@/lib/game/color";

type Phase = "loading" | "playing" | "result" | "error";

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
    mockApi
      .getDailyToday()
      .then((d) => {
        setTargets(d.targets);
        setDay(d.day);
        setPhase("playing");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "failed");
        setPhase("error");
      });
  }, []);

  const submit = async (guesses: RGB[]) => {
    try {
      const data = await mockApi.submitDaily(guesses);
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
