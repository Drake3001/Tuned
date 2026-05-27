"use client";

export function Timer({ seconds }: { seconds: number }) {
  const s = Math.max(0, seconds);
  const text =
    s >= 60
      ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
      : s.toFixed(1);
  return <span className="font-mono text-2xl tabular-nums">{text}</span>;
}
