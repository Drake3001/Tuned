type Stats = {
  soloPlays: number;
  avgDeltaE: number;
  brWins: number;
  brPlayed: number;
  bestSolo: number;
} | null;

export function StatCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "solo plays", value: stats?.soloPlays ?? 0 },
    { label: "avg ΔE", value: stats ? stats.avgDeltaE.toFixed(2) : "—" },
    { label: "best score", value: stats ? `${stats.bestSolo.toFixed(1)}%` : "—" },
    { label: "BR wins", value: `${stats?.brWins ?? 0} / ${stats?.brPlayed ?? 0}` },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-2 font-mono text-3xl tabular-nums">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
