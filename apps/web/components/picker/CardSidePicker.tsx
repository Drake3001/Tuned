"use client";

import { useState } from "react";
import { VSlider } from "./VSlider";
import { hsbToRgb, rgbToHex, rgbToHsb } from "@/lib/game/color/conversions";
import type { RGB } from "@/lib/game/color";

const HUE_GRADIENT =
  "linear-gradient(to top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";

type Props = {
  value: RGB;
  onChange: (rgb: RGB) => void;
};

export function CardSidePicker({ value, onChange }: Props) {
  const [hsb, setHsb] = useState<[number, number, number]>(() => {
    const [h, s, b] = rgbToHsb(value);
    return [h, s, b];
  });

  const update = (next: [number, number, number]) => {
    setHsb(next);
    onChange(hsbToRgb(next));
  };

  const satTop = rgbToHex(hsbToRgb([hsb[0], 1, hsb[2]]));
  const satBot = rgbToHex(hsbToRgb([hsb[0], 0, hsb[2]]));
  const briTop = rgbToHex(hsbToRgb([hsb[0], hsb[1], 1]));
  const briBot = rgbToHex(hsbToRgb([hsb[0], hsb[1], 0]));

  return (
    <div
      className="absolute bottom-6 left-6 top-16 flex items-stretch gap-2 rounded-2xl bg-black/30 p-3 backdrop-blur-md"
      style={{ width: 188 }}
    >
      <VSlider
        value={hsb[0]}
        min={0}
        max={360}
        onChange={(h) => update([h, hsb[1], hsb[2]])}
        trackGradient={HUE_GRADIENT}
        label="hue"
        formatValue={(v) => `${Math.round(v)}°`}
      />
      <VSlider
        value={hsb[1]}
        min={0}
        max={1}
        onChange={(s) => update([hsb[0], s, hsb[2]])}
        trackGradient={`linear-gradient(to bottom, ${satTop}, ${satBot})`}
        label="sat"
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
      <VSlider
        value={hsb[2]}
        min={0}
        max={1}
        onChange={(b) => update([hsb[0], hsb[1], b])}
        trackGradient={`linear-gradient(to bottom, ${briTop}, ${briBot})`}
        label="bri"
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  );
}
