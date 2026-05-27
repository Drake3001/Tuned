import type { LobbyPlayer, LobbyState } from "@/lib/mock/lobby-types";
import { LifeIcons } from "./LifeIcons";

export function PlayerList({
  state,
  currentUserId,
}: {
  state: LobbyState;
  currentUserId: string;
}) {
  return (
    <ul className="space-y-2">
      {state.players.map((p) => (
        <li
          key={p.userId}
          className={`flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 ${
            p.lives === 0 ? "opacity-50" : ""
          }`}
          style={
            p.userId === currentUserId
              ? { borderColor: "var(--tuned-orange)" }
              : undefined
          }
        >
          <span className="flex items-center gap-2 font-medium">
            <span>{p.username}</span>
            {p.userId === state.hostUserId && (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                host
              </span>
            )}
            {p.isBot && (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                bot
              </span>
            )}
          </span>
          {state.mode === "BATTLE_ROYALE" ? (
            p.lives === 0 ? (
              <span className="text-xs text-muted-foreground">
                elim · r{p.eliminatedRound ?? "?"}
              </span>
            ) : (
              <LifeIcons lives={p.lives} max={state.livesInitial} />
            )
          ) : (
            <span className="font-mono tabular-nums">{p.points.toFixed(0)} pts</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function asPlayerList(_: LobbyPlayer[]) {
  /* helper for typing */
}
