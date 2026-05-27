"use client";

type Props = {
  value: number; // 0..360
  onChange: (h: number) => void;
};

export function HueSlider({ value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>hue</span>
        <span className="font-mono tabular-nums text-foreground">
          {Math.round(value)}°
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tuned-slider tuned-slider-hue"
        aria-label="hue"
      />
    </label>
  );
}
