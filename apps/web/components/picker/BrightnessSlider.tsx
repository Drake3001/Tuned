"use client";

import { hsbToRgb, rgbToHex } from "@/lib/game/color/conversions";

type Props = {
  value: number; // 0..1
  hue: number;
  saturation: number;
  onChange: (b: number) => void;
};

export function BrightnessSlider({ value, hue, saturation, onChange }: Props) {
  const minColor = rgbToHex(hsbToRgb([hue, saturation, 0]));
  const maxColor = rgbToHex(hsbToRgb([hue, saturation, 1]));
  return (
    <label className="flex flex-col gap-2">
      <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>brightness</span>
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
        aria-label="brightness"
      />
    </label>
  );
}
