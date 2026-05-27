"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/picker/ColorPicker";
import { PlayerSidebar } from "./PlayerSidebar";
import { Timer } from "@/components/solo/Timer";
import { deltaE, type RGB } from "@/lib/game/color";
import type { LobbyState } from "@/lib/mock/lobby-types";

type Props = {
  state: LobbyState;
  currentUserId: string;
  onSubmit: (guess: RGB) => void;
};

export function BattleRoundScreen({ state, currentUserId, onSubmit }: Props) {
  const [guess, setGuess] = useState<RGB>([128, 128, 128]);
  const meSubmitted = state.submissions.some((s) => s.userId === currentUserId);
  const meDead =
    state.mode === "BATTLE_ROYALE" &&
    state.players.find((p) => p.userId === currentUserId)?.lives === 0;
  const remaining = state.phaseEndsAt
    ? Math.max(0, (state.phaseEndsAt - Date.now()) / 1000)
    : 0;

  if (state.status === "MEMORIZE" && state.currentTarget) {
    const t = state.currentTarget;
    return (
      <div
        className="fixed inset-0 flex p-6"
        style={{ background: `rgb(${t[0]},${t[1]},${t[2]})` }}
      >
        <div className="rounded-md bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur">
          memorize · round {state.currentRound}
        </div>
        <div className="ml-auto rounded-md bg-black/60 px-3 py-1.5 text-white backdrop-blur">
          <Timer seconds={remaining} />
        </div>
      </div>
    );
  }

  if (state.status === "RECALL") {
    return (
      <main className="flex min-h-screen gap-6 p-6">
        <div className="flex-1 rounded-2xl border border-border bg-card p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2>
              round {state.currentRound}
              {state.mode === "ROUND_BASED" && ` / ${state.roundsTotal}`} · recall
            </h2>
            <Timer seconds={remaining} />
          </header>
          {meDead ? (
            <p className="text-muted-foreground">
              you're out. spectating remaining players.
            </p>
          ) : meSubmitted ? (
            <p className="text-muted-foreground">
              locked in. waiting for the others…
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ColorPicker value={guess} onChange={setGuess} />
              <button
                type="button"
                onClick={() => onSubmit(guess)}
                className="w-full max-w-sm rounded-lg px-4 py-3 font-bold"
                style={{
                  background: "var(--tuned-orange)",
                  color: "var(--tuned-orange-fg)",
                }}
              >
                lock in
              </button>
            </div>
          )}
        </div>
        <PlayerSidebar state={state} currentUserId={currentUserId} />
      </main>
    );
  }

  if (state.status === "SCORING") {
    return (
      <main className="flex min-h-screen gap-6 p-6">
        <div className="flex-1 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold">
            round {state.currentRound} results
          </h2>
          <RoundResults state={state} />
        </div>
        <PlayerSidebar state={state} currentUserId={currentUserId} />
      </main>
    );
  }

  return null;
}

function RoundResults({ state }: { state: LobbyState }) {
  return (
    <ul className="space-y-2">
      {state.lastRoundScores.map((s) => {
        const player = state.players.find((p) => p.userId === s.userId);
        if (!player) return null;
        return (
          <li
            key={s.userId}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <span className="flex items-center gap-3">
              <span className="font-medium">{player.username}</span>
              {s.guess && (
                <span
                  className="inline-block h-5 w-5 rounded border border-border"
                  style={{ background: `rgb(${s.guess[0]},${s.guess[1]},${s.guess[2]})` }}
                  aria-label="guess"
                />
              )}
            </span>
            <span className="flex items-center gap-3 font-mono text-sm">
              {state.scoringMode === "SPEED" ? (
                <span style={{ color: s.hit ? "#10b981" : "#ef4444" }}>
                  {s.hit ? "HIT" : "MISS"}
                </span>
              ) : (
                <span>
                  ΔE {Number.isFinite(s.deltaE) ? s.deltaE.toFixed(1) : "—"}
                </span>
              )}
              <span className="text-muted-foreground">
                +{s.pointsAwarded.toFixed(0)} pts
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// avoid unused import warnings if we tighten the file later
void deltaE;
