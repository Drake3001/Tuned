"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSoloFlow } from "@/lib/hooks/useSoloFlow";
import { InterleavedPhase } from "@/components/solo/InterleavedPhase";
import { ResultScreen } from "@/components/solo/ResultScreen";

function SoloInner() {
  const params = useSearchParams();
  const difficultyParam = (params.get("difficulty") ?? "HARD").toUpperCase();
  const difficulty: "EASY" | "HARD" = difficultyParam === "EASY" ? "EASY" : "HARD";
  const flow = useSoloFlow(difficulty);

  if (flow.phase === "loading" || flow.phase === "submitting") {
    return <Centered>{flow.phase === "loading" ? "preparing…" : "scoring…"}</Centered>;
  }
  if (flow.phase === "error") {
    return (
      <Centered>
        <p className="text-red-400">{flow.error ?? "error"}</p>
        <button
          type="button"
          onClick={flow.restart}
          className="mt-4 rounded px-4 py-2 font-bold"
          style={{
            background: "var(--tuned-orange)",
            color: "var(--tuned-orange-fg)",
          }}
        >
          retry
        </button>
      </Centered>
    );
  }
  if (flow.phase === "playing") {
    return (
      <InterleavedPhase
        targets={flow.targets}
        difficulty={difficulty}
        onComplete={flow.submit}
      />
    );
  }
  if (flow.phase === "result" && flow.result) {
    return (
      <ResultScreen
        finalScore={flow.result.finalScore}
        perAttempt={flow.result.perAttempt}
        difficulty={difficulty}
        onPlayAgain={flow.restart}
      />
    );
  }
  return null;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      {children}
    </div>
  );
}

export default function SoloPage() {
  return (
    <Suspense fallback={<Centered>loading…</Centered>}>
      <SoloInner />
    </Suspense>
  );
}
