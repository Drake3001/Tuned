import type { LobbyState } from "@/lib/mock/lobby-types";
import { LifeIcons } from "./LifeIcons";

export function PlayerSidebar({
  state,
  currentUserId,
}: {
  state: LobbyState;
  currentUserId: string;
}) {
  return (
    <aside className="w-64 shrink-0 space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
        {state.mode === "BATTLE_ROYALE"
          ? "lives"
          : `round ${state.currentRound} / ${state.roundsTotal}`}
      </h3>
      {state.players.map((p) => {
        const dead = state.mode === "BATTLE_ROYALE" && p.lives === 0;
        return (
          <div
            key={p.userId}
            className={`rounded-lg border border-border bg-card p-3 ${dead ? "opacity-50" : ""}`}
            style={
              p.userId === currentUserId
                ? { borderColor: "var(--tuned-orange)" }
                : undefined
            }
          >
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{p.username}</span>
              {state.mode === "BATTLE_ROYALE" ? (
                dead ? (
                  <span className="text-xs text-muted-foreground">elim</span>
                ) : (
                  <LifeIcons lives={p.lives} max={state.livesInitial} />
                )
              ) : (
                <span className="font-mono tabular-nums">{p.points.toFixed(0)}</span>
              )}
            </div>
            {state.status === "RECALL" && (
              <SubmissionIndicator submitted={state.submissions.some((s) => s.userId === p.userId)} />
            )}
          </div>
        );
      })}
    </aside>
  );
}

function SubmissionIndicator({ submitted }: { submitted: boolean }) {
  return (
    <div className="mt-1 text-xs text-muted-foreground">
      {submitted ? "locked in" : "thinking…"}
    </div>
  );
}
