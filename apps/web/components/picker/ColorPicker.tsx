"use client";

import { useEffect, useState } from "react";
import { HueSlider } from "./HueSlider";
import { SaturationSlider } from "./SaturationSlider";
import { BrightnessSlider } from "./BrightnessSlider";
import {
  hexToRgb,
  hsbToRgb,
  rgbToHex,
  rgbToHsb,
} from "@/lib/game/color/conversions";
import type { RGB } from "@/lib/game/color";

type Props = {
  value: RGB;
  onChange: (rgb: RGB) => void;
  showHex?: boolean;
};

export function ColorPicker({ value, onChange, showHex = false }: Props) {
  const [hsb, setHsb] = useState(() => rgbToHsb(value));

  // sync internal hsb when value changes externally (e.g. reset)
  useEffect(() => {
    const incoming = rgbToHsb(value);
    const current = hsbToRgb(hsb);
    if (
      current[0] !== value[0] ||
      current[1] !== value[1] ||
      current[2] !== value[2]
    ) {
      setHsb(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value[0], value[1], value[2]]);

  const update = (next: [number, number, number]) => {
    setHsb(next);
    onChange(hsbToRgb(next));
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div
        className="h-24 w-full rounded-xl border border-border"
        style={{ background: rgbToHex(value) }}
        aria-label="current color preview"
      />
      <HueSlider value={hsb[0]} onChange={(h) => update([h, hsb[1], hsb[2]])} />
      <SaturationSlider
        value={hsb[1]}
        hue={hsb[0]}
        brightness={hsb[2]}
        onChange={(s) => update([hsb[0], s, hsb[2]])}
      />
      <BrightnessSlider
        value={hsb[2]}
        hue={hsb[0]}
        saturation={hsb[1]}
        onChange={(b) => update([hsb[0], hsb[1], b])}
      />
      {showHex && (
        <input
          value={rgbToHex(value)}
          onChange={(e) => {
            const parsed = hexToRgb(e.target.value);
            if (parsed) {
              setHsb(rgbToHsb(parsed));
              onChange(parsed);
            }
          }}
          className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-center font-mono text-sm uppercase tracking-widest"
          aria-label="hex color"
          maxLength={7}
        />
      )}
    </div>
  );
}
