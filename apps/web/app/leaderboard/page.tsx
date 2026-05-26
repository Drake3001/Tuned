"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { mockApi } from "@/lib/mock/api";

type Tab = "solo" | "br" | "today";
type Row = {
  rank: number;
  username: string;
  avatarUrl: string | null;
  value: number;
};

const TABS: Array<{ key: Tab; label: string; valueLabel: string }> = [
  { key: "solo", label: "all-time solo", valueLabel: "%" },
  { key: "br", label: "all-time BR", valueLabel: "wins" },
  { key: "today", label: "today", valueLabel: "%" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("solo");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    mockApi.getLeaderboard(tab).then(setRows).catch(() => setRows([]));
  }, [tab]);

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">leaderboard</h1>
      <div className="mb-6 inline-flex rounded-lg border border-border bg-muted/40 p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            type="button"
            className="rounded-md px-4 py-1.5"
            style={
              tab === t.key
                ? {
                    background: "var(--tuned-orange)",
                    color: "var(--tuned-orange-fg)",
                  }
                : undefined
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <LeaderboardTable rows={rows} valueLabel={current.valueLabel} />
    </main>
  );
}
