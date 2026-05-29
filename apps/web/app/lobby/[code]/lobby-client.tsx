"use client";

import Link from "next/link";
import { useLobbyState } from "@/lib/hooks/useLobbyState";
import { LobbyCode } from "@/components/lobby/LobbyCode";
import { PlayerList } from "@/components/lobby/PlayerList";
import { BattleRoundScreen } from "@/components/lobby/BattleRoundScreen";
import { EndgameScreen } from "@/components/lobby/EndgameScreen";

export function LobbyClient({ code }: { code: string }) {
  const { state, me, error, errorCode, pendingWsSync, start, submit } = useLobbyState(code);

  if (errorCode === "LOBBY_NOT_LIVE") {
    return (
      <main className="mx-auto max-w-md px-6 py-12 text-center">
        <p className="text-muted-foreground">
          This match is no longer live. Ask your friends for a new lobby or check the
          endgame screen.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm underline"
          style={{ color: "var(--tuned-orange)" }}
        >
          back home
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-12 text-center text-red-400">
        {error}
      </main>
    );
  }

  if (!state || !me || pendingWsSync) {
    return (
      <main className="p-12 text-center text-muted-foreground">
        loading lobby…
      </main>
    );
  }

  if (state.status === "FINISHED") {
    return <EndgameScreen state={state} currentUserId={me.userId} />;
  }

  if (state.status !== "WAITING") {
    return <BattleRoundScreen state={state} currentUserId={me.userId} onSubmit={submit} />;
  }

  const isHost = me.userId === state.hostUserId;
  const canStart = isHost && state.players.length >= 2;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">lobby</h1>
      <p className="text-sm text-muted-foreground">
        {state.mode === "BATTLE_ROYALE" ? "battle royale" : `${state.roundsTotal} rounds`} · {" "}
        {state.scoringMode === "SPEED" ? "hit the square" : "color accuracy"}
      </p>
      <div className="my-8 flex justify-center">
        <LobbyCode code={code} />
      </div>
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
        players
      </p>
      <PlayerList state={state} currentUserId={me.userId} />
      {isHost ? (
        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="mt-8 w-full rounded-lg px-4 py-3 font-bold disabled:opacity-50"
          style={{
            background: "var(--tuned-orange)",
            color: "var(--tuned-orange-fg)",
          }}
        >
          start
        </button>
      ) : (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          waiting for host…
        </p>
      )}
    </main>
  );
}
