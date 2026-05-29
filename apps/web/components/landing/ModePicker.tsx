"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DifficultyPicker, type Difficulty } from "./DifficultyPicker";
import { CreateLobbyModal } from "@/components/lobby/CreateLobbyModal";
import { JoinLobbyModal } from "@/components/lobby/JoinLobbyModal";

export function ModePicker() {
  const [difficulty, setDifficulty] = useState<Difficulty>("HARD");
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const router = useRouter();

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          difficulty
        </span>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/play/solo?difficulty=${difficulty}`}
          className="group rounded-xl border border-border bg-card p-8 transition hover:scale-[1.02]"
          style={{ borderColor: undefined }}
        >
          <h3 className="text-2xl font-bold">solo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            5 colors, one at a time. EASY uses a palette of 5 similar hues; HARD uses
            3 sliders.
          </p>
          <div
            className="mt-6 text-sm group-hover:underline"
            style={{ color: "var(--tuned-orange)" }}
          >
            play →
          </div>
        </Link>
        <div className="flex flex-col rounded-xl border border-border bg-card p-8 text-left transition hover:scale-[1.02]">
          <button
            type="button"
            onClick={() => setLobbyOpen(true)}
            className="flex-1 text-left"
          >
            <h3 className="text-2xl font-bold">multiplayer</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              up to 8 players. battle royale (3 lives) or round-based (sum points).
              scoring: color accuracy or hit-the-square.
            </p>
            <div className="mt-6 text-sm" style={{ color: "var(--tuned-orange)" }}>
              create lobby →
            </div>
          </button>
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="mt-4 self-start rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            join with code
          </button>
        </div>
        <Link
          href="/daily"
          className="rounded-xl border border-border bg-card p-8 transition hover:scale-[1.02]"
        >
          <h3 className="text-2xl font-bold">daily</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            same 5 colors for everyone. one shot per day. leaderboard resets at
            midnight UTC.
          </p>
          <div className="mt-6 text-sm" style={{ color: "var(--tuned-orange)" }}>
            today's challenge →
          </div>
        </Link>
      </div>
      <CreateLobbyModal
        open={lobbyOpen}
        onClose={() => setLobbyOpen(false)}
        onCreated={(code) => router.push(`/lobby/${code}`)}
      />
      <JoinLobbyModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={(code) => router.push(`/lobby/${code}`)}
      />
    </section>
  );
}
