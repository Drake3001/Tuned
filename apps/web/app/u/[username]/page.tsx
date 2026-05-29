"use client";

import { use, useEffect, useState } from "react";
import { StatCards } from "@/components/profile/StatCards";
import { fetchJson } from "@/lib/api/client";

type ProfileData = {
  user: { username: string; avatarUrl: string | null; createdAt: string };
  stats: {
    soloPlays: number;
    multiplayerPlays: number;
    currentStreak: number;
    bestSolo: number;
    avgDeltaE: number;
    brWins: number;
  } | null;
  daily: Array<{ day: string; avgScore: number; plays: number }>;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<ProfileData>(`/api/stats/${encodeURIComponent(username)}`)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "failed to load profile");
        setData(null);
      });
  }, [username]);

  if (error) return <p className="p-12 text-center text-red-400">{error}</p>;
  if (!data) return <p className="p-12 text-center text-muted-foreground">loading…</p>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div
          className="grid h-16 w-16 place-items-center rounded-full text-2xl font-bold"
          style={{
            background: "var(--tuned-orange)",
            color: "var(--tuned-orange-fg)",
          }}
        >
          {data.user.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{data.user.username}</h1>
          <p className="text-sm text-muted-foreground">
            joined {new Date(data.user.createdAt).toLocaleDateString()}
          </p>
        </div>
        {data.stats && data.stats.currentStreak > 0 && (
          <div
            className="ml-auto flex items-center gap-2 rounded-full border border-border px-4 py-2"
            title="consecutive days of daily challenges"
          >
            <span className="text-xl leading-none">🔥</span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {data.stats.currentStreak}
            </span>
            <span className="text-sm text-muted-foreground">
              day{data.stats.currentStreak === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <StatCards
        stats={
          data.stats
            ? {
                soloPlays: data.stats.soloPlays,
                avgDeltaE: data.stats.avgDeltaE,
                bestSolo: data.stats.bestSolo,
                brPlayed: data.stats.multiplayerPlays,
                brWins: data.stats.brWins,
              }
            : null
        }
      />
    </main>
  );
}
