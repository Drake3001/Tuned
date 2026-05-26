"use client";

import { useState } from "react";
import { VerticalHueSlider } from "./VerticalHueSlider";
import { VerticalSaturationSlider } from "./VerticalSaturationSlider";
import { VerticalBrightnessSlider } from "./VerticalBrightnessSlider";
import { hsbToRgb, rgbToHsb } from "@/lib/game/color/conversions";
import type { RGB } from "@/lib/game/color";

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

  return (
    <div className="absolute inset-y-0 left-0 flex">
      <VerticalHueSlider value={hsb[0]} onChange={(h) => update([h, hsb[1], hsb[2]])} />
      <VerticalSaturationSlider
        value={hsb[1]}
        hue={hsb[0]}
        brightness={hsb[2]}
        onChange={(s) => update([hsb[0], s, hsb[2]])}
      />
      <VerticalBrightnessSlider
        value={hsb[2]}
        hue={hsb[0]}
        saturation={hsb[1]}
        onChange={(b) => update([hsb[0], hsb[1], b])}
      />
    </div>
  );
}
