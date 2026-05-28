import type { RGB } from "@/lib/game/color";
import { rgbToHsb } from "@/lib/game/color/conversions";
import { hsbToRgb } from "@/lib/game/color/conversions";

export type HsbColor = { hue: number; saturation: number; brightness: number };

function randomByte() {
  return Math.floor(Math.random() * 256);
}

export function randomRgb(): RGB {
  return [randomByte(), randomByte(), randomByte()];
}

export function generateTargets(count = 5): RGB[] {
  return Array.from({ length: count }, () => randomRgb());
}

export function rgbToHsbRecord(rgb: RGB): HsbColor {
  const [hue, saturation, brightness] = rgbToHsb(rgb);
  return { hue, saturation, brightness };
}

export function hsbRecordToRgb(color: HsbColor): RGB {
  return hsbToRgb([color.hue, color.saturation, color.brightness]);
}

export function hsbRecordsToRgb(colors: HsbColor[]): RGB[] {
  return colors.map(hsbRecordToRgb);
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function utcDayString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function utcDayStart(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function dailySeedForDay(day: Date): bigint {
  const y = day.getUTCFullYear();
  const m = String(day.getUTCMonth() + 1).padStart(2, "0");
  const d = String(day.getUTCDate()).padStart(2, "0");
  return BigInt(`${y}${m}${d}`);
}

export function deterministicDailyTargets(day = new Date()): RGB[] {
  const seed = Number(dailySeedForDay(utcDayStart(day)));
  const rng = mulberry32(seed);
  return Array.from({ length: 5 }, () => [
    Math.floor(rng() * 256),
    Math.floor(rng() * 256),
    Math.floor(rng() * 256),
  ]);
}
