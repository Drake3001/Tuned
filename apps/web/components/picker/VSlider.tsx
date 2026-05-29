"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  trackGradient: string;
  label: string;
  formatValue: (v: number) => string;
};

const TRACK_WIDTH = 44;

export function VSlider({
  value,
  min,
  max,
  onChange,
  trackGradient,
  label,
  formatValue,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const pct = (value - min) / (max - min);

  const handleAt = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = clientY - rect.top;
      const t = 1 - Math.max(0, Math.min(1, y / rect.height));
      onChange(min + t * (max - min));
    },
    [min, max, onChange],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      handleAt(e.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [handleAt]);

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div
        ref={trackRef}
        className="relative cursor-pointer rounded-full border border-black/10 shadow-inner"
        style={{
          width: TRACK_WIDTH,
          flex: 1,
          minHeight: 0,
          background: trackGradient,
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          draggingRef.current = true;
          setDragging(true);
          handleAt(e.clientY);
        }}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = (max - min) / 100;
          if (e.key === "ArrowUp" || e.key === "ArrowRight")
            onChange(Math.min(max, value + step));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft")
            onChange(Math.max(min, value - step));
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-1.5 -right-1.5 h-3 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] ring-2 ring-black/15"
          style={{
            top: `calc(${(1 - pct) * 100}% - 6px)`,
            // no transition while dragging → thumb tracks the finger 1:1.
            // keep a tiny ease only for keyboard steps.
            transition: dragging ? "none" : "top 60ms linear",
          }}
        />
      </div>
      <div className="flex flex-col items-center text-center">
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {label}
        </span>
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
}
