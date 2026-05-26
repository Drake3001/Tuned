import Link from "next/link";

type Row = {
  rank: number;
  username: string;
  avatarUrl: string | null;
  value: number;
};

export function LeaderboardTable({
  rows,
  valueLabel,
}: {
  rows: Row[];
  valueLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        be the first
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {rows.map((r) => (
        <li key={r.rank} className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-3">
            <span className="w-8 font-mono text-muted-foreground">#{r.rank}</span>
            <Link href={`/u/${r.username}`} className="font-medium hover:underline">
              {r.username}
            </Link>
          </span>
          <span className="font-mono tabular-nums">
            {r.value.toFixed(1)}
            <span className="ml-1 text-xs text-muted-foreground">{valueLabel}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
