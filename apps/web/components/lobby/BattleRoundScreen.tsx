"use client";

import { useState } from "react";
import { CardSidePicker } from "@/components/picker/CardSidePicker";
import { GameCard, CardTopLeft, CardTopRight, CardActionButton } from "@/components/solo/GameCard";
import { PlayerSidebar } from "./PlayerSidebar";
import { Timer } from "@/components/solo/Timer";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { proximityScore } from "@/lib/game/proximity";
import { legibleLabel, legibleStrong } from "@/lib/game/color/contrast";
import type { RGB } from "@/lib/game/color";
import type { LobbyState, RoundScore } from "@/lib/mock/lobby-types";

type Props = {
  state: LobbyState;
  currentUserId: string;
  onSubmit: (guess: RGB) => void;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BattleRoundScreen({ state, currentUserId, onSubmit }: Props) {
  const [guess, setGuess] = useState<RGB>([128, 128, 128]);
  const remaining = useCountdown(state.phaseEndsAt);
  const meSubmitted = state.submissions.some((s) => s.userId === currentUserId);
  const meDead =
    state.mode === "BATTLE_ROYALE" &&
    state.players.find((p) => p.userId === currentUserId)?.lives === 0;

  const roundLabel =
    state.mode === "ROUND_BASED"
      ? `round ${state.currentRound} / ${state.roundsTotal}`
      : `round ${state.currentRound}`;

  if (state.status === "MEMORIZE" && state.currentTarget) {
    const t = state.currentTarget;
    const bg = `rgb(${t[0]}, ${t[1]}, ${t[2]})`;
    return (
      <GameCard background={bg}>
        <CardTopLeft color={legibleLabel(t, 0.75)}>{roundLabel} · memorize</CardTopLeft>
        <CardTopRight color={legibleLabel(t, 0.55)}>
          <Timer seconds={remaining} />
        </CardTopRight>
      </GameCard>
    );
  }

  if (state.status === "RECALL") {
    const bg = `rgb(${guess[0]}, ${guess[1]}, ${guess[2]})`;
    return (
      <main className="flex min-h-[calc(100vh-120px)] items-center justify-center gap-6 p-6">
        <div
          className="tuned-card relative h-[460px] w-full max-w-2xl overflow-hidden"
          style={{ background: bg }}
        >
          <CardTopLeft color={legibleLabel(guess, 0.75)}>{roundLabel} · recall</CardTopLeft>
          <CardTopRight color={legibleLabel(guess, 0.55)}>
            <Timer seconds={remaining} />
          </CardTopRight>

          {meDead ? (
            <CenterNote color={legibleStrong(guess)}>
              you&apos;re out. spectating remaining players.
            </CenterNote>
          ) : meSubmitted ? (
            <CenterNote color={legibleStrong(guess)}>
              locked in. waiting for the others…
            </CenterNote>
          ) : (
            <>
              <CardSidePicker value={guess} onChange={setGuess} />
              <CardActionButton onClick={() => onSubmit(guess)} ariaLabel="lock in">
                <ArrowIcon />
              </CardActionButton>
            </>
          )}
        </div>
        <PlayerSidebar state={state} currentUserId={currentUserId} />
      </main>
    );
  }

  if (state.status === "SCORING") {
    return (
      <main className="flex min-h-[calc(100vh-120px)] items-center justify-center gap-6 p-6">
        <div className="tuned-card relative w-full max-w-2xl overflow-hidden p-6">
          <h2 className="mb-4 text-xl font-bold">{roundLabel} results</h2>
          <RoundResults state={state} />
        </div>
        <PlayerSidebar state={state} currentUserId={currentUserId} />
      </main>
    );
  }

  return null;
}

function CenterNote({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-8 text-center">
      <p className="text-lg font-medium" style={{ color }}>
        {children}
      </p>
    </div>
  );
}

function RoundResults({ state }: { state: LobbyState }) {
  const target = state.currentTarget;
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {state.lastRoundScores.map((s) => {
        const player = state.players.find((p) => p.userId === s.userId);
        if (!player) return null;
        return (
          <ResultCard
            key={s.userId}
            username={player.username}
            score={s}
            target={target}
            scoringMode={state.scoringMode}
          />
        );
      })}
    </ul>
  );
}

function ResultCard({
  username,
  score,
  target,
  scoringMode,
}: {
  username: string;
  score: RoundScore;
  target: RGB | null;
  scoringMode: LobbyState["scoringMode"];
}) {
  const guess = score.guess;
  const guessBg = guess ? `rgb(${guess[0]}, ${guess[1]}, ${guess[2]})` : "var(--muted)";
  const targetBg = target ? `rgb(${target[0]}, ${target[1]}, ${target[2]})` : "var(--muted)";
  const guessStrong = guess ? legibleStrong(guess) : "var(--foreground)";
  const guessMuted = guess ? legibleLabel(guess, 0.6) : "var(--muted-foreground)";
  const targetMuted = target ? legibleLabel(target, 0.6) : "var(--muted-foreground)";

  return (
    <li className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-rows-2">
        {/* top: this player's guess */}
        <div
          className="flex flex-col justify-between p-3"
          style={{ background: guessBg, color: guessStrong, minHeight: 96 }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{username}</span>
            {scoringMode === "SPEED" ? (
              <span
                className="font-mono text-sm font-bold"
                style={{ color: score.hit ? "#10b981" : "#ef4444" }}
              >
                {score.hit ? "HIT" : "MISS"}
              </span>
            ) : (
              <span className="font-mono text-2xl font-bold leading-none tabular-nums">
                {proximityScore(score.deltaE).toFixed(2)}
                <span className="ml-0.5 text-xs font-medium" style={{ color: guessMuted }}>
                  /10
                </span>
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: guessMuted }}>
            {guess ? "their shot" : "no guess"} · +{score.pointsAwarded.toFixed(0)} pts
          </span>
        </div>
        {/* bottom: shared target */}
        <div
          className="flex items-end p-3"
          style={{ background: targetBg, minHeight: 56 }}
        >
          <span className="text-[10px] uppercase tracking-wider" style={{ color: targetMuted }}>
            target
          </span>
        </div>
      </div>
    </li>
  );
}
