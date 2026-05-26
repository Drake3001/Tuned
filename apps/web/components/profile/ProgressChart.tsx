"use client";

type Point = { day: string; avgScore: number; plays: number };

export function ProgressChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        no plays yet
      </div>
    );
  }
  const w = 720;
  const h = 240;
  const pad = 32;
  const xs = (i: number) =>
    pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
  const ys = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  const path = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(p.avgScore).toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full">
        {[0, 25, 50, 75, 100].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={ys(g)}
            y2={ys(g)}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="var(--tuned-orange)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((p, i) => (
          <circle
            key={i}
            cx={xs(i)}
            cy={ys(p.avgScore)}
            r={2.5}
            fill="var(--tuned-orange)"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}
