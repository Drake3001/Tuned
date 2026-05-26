"use client";

import { useMemo, useState } from "react";
import type { RGB } from "@/lib/game/color";
import { generateSimilarPalette } from "@/lib/game/easy-palette";

type Props = {
  target: RGB;
  onSelect: (rgb: RGB) => void;
};

export function PaletteChoice({ target, onSelect }: Props) {
  const palette = useMemo(() => generateSimilarPalette(target, 5), [target]);
  const [selected, setSelected] = useState<RGB | null>(null);

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm uppercase tracking-wider text-muted-foreground">
        pick the color you saw
      </p>
      <div className="grid grid-cols-5 gap-3">
        {palette.map((c, i) => {
          const isSelected =
            selected && selected[0] === c[0] && selected[1] === c[1] && selected[2] === c[2];
          return (
            <button
              type="button"
              key={i}
              onClick={() => setSelected(c)}
              className="h-20 w-20 rounded-xl border-4 transition hover:scale-105 active:scale-95"
              style={{
                background: `rgb(${c[0]}, ${c[1]}, ${c[2]})`,
                borderColor: isSelected ? "var(--tuned-orange)" : "transparent",
              }}
              aria-label={`color ${i + 1}`}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className="rounded-lg px-6 py-3 font-bold disabled:opacity-40"
        style={{ background: "var(--tuned-orange)", color: "var(--tuned-orange-fg)" }}
      >
        lock in
      </button>
    </div>
  );
}
