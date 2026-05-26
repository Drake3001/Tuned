"use client";

type Props = {
  value: number;
  onChange: (h: number) => void;
};

export function VerticalHueSlider({ value, onChange }: Props) {
  return (
    <input
      type="range"
      min={0}
      max={360}
      step={1}
      value={Math.round(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      className="tuned-vslider tuned-vslider-hue"
      aria-label="hue"
      // @ts-expect-error firefox-only attribute, not in React types
      orient="vertical"
    />
  );
}
