"use client";

const LEVELS = ["EASY", "HARD"] as const;
export type Difficulty = (typeof LEVELS)[number];

type Props = {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
};

export function DifficultyPicker({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-sm">
      {LEVELS.map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onChange(lvl)}
          className="rounded-md px-5 py-1.5 transition"
          style={
            value === lvl
              ? {
                  background: "var(--tuned-orange)",
                  color: "var(--tuned-orange-fg)",
                }
              : undefined
          }
        >
          {lvl.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
