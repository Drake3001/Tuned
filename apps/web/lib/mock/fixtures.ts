import type { RGB } from "@/lib/game/color";

export const MOCK_USERS = [
  { id: "u-malik", username: "malik", avatarUrl: null },
  { id: "u-retinaboi", username: "retinaboi", avatarUrl: null },
  { id: "u-pixelpicker", username: "pixelpicker", avatarUrl: null },
  { id: "u-kawai", username: "kawai_kosmita", avatarUrl: null },
  { id: "u-tonalna", username: "tonalna", avatarUrl: null },
] as const;

export type MockStat = {
  username: string;
  avatarUrl: string | null;
  soloPlays: number;
  avgDeltaE: number;
  bestSolo: number;
  brPlayed: number;
  brWins: number;
};

export const MOCK_STATS: Record<string, MockStat> = {
  malik: {
    username: "malik",
    avatarUrl: null,
    soloPlays: 32,
    avgDeltaE: 7.4,
    bestSolo: 92.8,
    brPlayed: 5,
    brWins: 2,
  },
  retinaboi: {
    username: "retinaboi",
    avatarUrl: null,
    soloPlays: 21,
    avgDeltaE: 5.9,
    bestSolo: 95.4,
    brPlayed: 7,
    brWins: 4,
  },
  pixelpicker: {
    username: "pixelpicker",
    avatarUrl: null,
    soloPlays: 14,
    avgDeltaE: 9.1,
    bestSolo: 89.3,
    brPlayed: 3,
    brWins: 0,
  },
  kawai_kosmita: {
    username: "kawai_kosmita",
    avatarUrl: null,
    soloPlays: 18,
    avgDeltaE: 8.2,
    bestSolo: 90.2,
    brPlayed: 4,
    brWins: 1,
  },
  tonalna: {
    username: "tonalna",
    avatarUrl: null,
    soloPlays: 27,
    avgDeltaE: 6.5,
    bestSolo: 93.7,
    brPlayed: 6,
    brWins: 1,
  },
};

export type MockDailyPoint = { day: string; avgScore: number; plays: number };

export function mockDailyAggregates(): MockDailyPoint[] {
  const out: MockDailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    out.push({
      day,
      avgScore: 70 + Math.random() * 25,
      plays: 1 + Math.floor(Math.random() * 3),
    });
  }
  return out;
}

function randomByte() {
  return Math.floor(Math.random() * 256);
}
export function randomRgb(): RGB {
  return [randomByte(), randomByte(), randomByte()];
}
