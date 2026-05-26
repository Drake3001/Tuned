"use client";

import { hsbToRgb } from "@/lib/game/color/conversions";
import { rgbToHex } from "@/lib/game/color/conversions";

type Props = {
  value: number; // 0..1
  hue: number;
  brightness: number;
  onChange: (s: number) => void;
};

export function SaturationSlider({ value, hue, brightness, onChange }: Props) {
  const minColor = rgbToHex(hsbToRgb([hue, 0, brightness]));
  const maxColor = rgbToHex(hsbToRgb([hue, 1, brightness]));
  return (
    <label className="flex flex-col gap-2">
      <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>saturation</span>
        <span className="font-mono tabular-nums text-foreground">
          {Math.round(value * 100)}%
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="tuned-slider"
        style={{
          ["--tuned-slider-track" as string]: `linear-gradient(to right, ${minColor}, ${maxColor})`,
        }}
        aria-label="saturation"
      />
    </label>
  );
}
