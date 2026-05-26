"use client";

import { use, useEffect, useState } from "react";
import { StatCards } from "@/components/profile/StatCards";
import { ProgressChart } from "@/components/profile/ProgressChart";
import { mockApi } from "@/lib/mock/api";

type Profile = Awaited<ReturnType<typeof mockApi.getProfile>>;

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [data, setData] = useState<Profile | null>(null);

  useEffect(() => {
    mockApi.getProfile(username).then(setData).catch(() => setData(null));
  }, [username]);

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
      </div>

      <StatCards
        stats={
          data.stats
            ? {
                soloPlays: data.stats.soloPlays,
                avgDeltaE: data.stats.avgDeltaE,
                bestSolo: data.stats.bestSolo,
                brPlayed: data.stats.brPlayed,
                brWins: data.stats.brWins,
              }
            : null
        }
      />

      <h2 className="mb-4 mt-12 text-lg font-bold">last 30 days</h2>
      <ProgressChart data={data.daily} />
    </main>
  );
}
