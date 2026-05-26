"use client";

import Link from "next/link";
import type { LobbyState } from "@/lib/mock/lobby-types";

export function EndgameScreen({
  state,
  currentUserId,
}: {
  state: LobbyState;
  currentUserId: string;
}) {
  const winner = state.players.find((p) => p.userId === state.winnerUserId);
  const ranked = [...state.players].sort((a, b) => {
    if (state.mode === "BATTLE_ROYALE") {
      if (a.lives > 0 && b.lives <= 0) return -1;
      if (a.lives <= 0 && b.lives > 0) return 1;
      return (b.eliminatedRound ?? 0) - (a.eliminatedRound ?? 0);
    }
    return b.points - a.points;
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-7xl font-black text-transparent">
        {state.mode === "BATTLE_ROYALE" ? "WINNER" : "FINAL STANDINGS"}
      </h1>
      {winner && (
        <p className="mt-2 text-3xl">
          {state.mode === "BATTLE_ROYALE" ? winner.username : `${winner.username} · ${winner.points.toFixed(0)} pts`}
        </p>
      )}
      <ol className="mt-12 space-y-2 text-left">
        {ranked.map((p, i) => (
          <li
            key={p.userId}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2"
            style={
              p.userId === currentUserId
                ? { borderColor: "var(--tuned-orange)" }
                : undefined
            }
          >
            <span>
              <span className="mr-3 font-mono text-muted-foreground">
                #{i + 1}
              </span>
              {p.username}
            </span>
            <span className="text-sm text-muted-foreground">
              {state.mode === "BATTLE_ROYALE"
                ? p.lives > 0
                  ? "survivor"
                  : `elim · r${p.eliminatedRound ?? "?"}`
                : `${p.points.toFixed(0)} pts`}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg px-6 py-3 font-bold"
          style={{
            background: "var(--tuned-orange)",
            color: "var(--tuned-orange-fg)",
          }}
        >
          back home
        </Link>
        <Link
          href="/play/solo"
          className="rounded-lg border border-border px-6 py-3"
        >
          solo again
        </Link>
      </div>
    </main>
  );
}
