"use client";

import { hsbToRgb, rgbToHex } from "@/lib/game/color/conversions";

type Props = {
  value: number;
  hue: number;
  brightness: number;
  onChange: (s: number) => void;
};

export function VerticalSaturationSlider({ value, hue, brightness, onChange }: Props) {
  const top = rgbToHex(hsbToRgb([hue, 1, brightness]));
  const bot = rgbToHex(hsbToRgb([hue, 0, brightness]));
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="tuned-vslider"
      style={{
        ["--tuned-vslider-track" as string]: `linear-gradient(to bottom, ${top}, ${bot})`,
      }}
      aria-label="saturation"
      // @ts-expect-error firefox-only attribute
      orient="vertical"
    />
  );
}
