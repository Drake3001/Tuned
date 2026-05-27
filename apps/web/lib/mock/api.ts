import type { RGB } from "@/lib/game/color";
import { generateSimilarPalette } from "@/lib/game/easy-palette";
import { randomRgb, MOCK_STATS, MOCK_USERS, mockDailyAggregates } from "./fixtures";
import { scoreColorAccuracy } from "@/lib/game/scoring";

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

function todayTargets(): RGB[] {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const seed = Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`,
  );
  const rng = mulberry32(seed);
  return Array.from({ length: 5 }, () => [
    Math.floor(rng() * 256),
    Math.floor(rng() * 256),
    Math.floor(rng() * 256),
  ]);
}

type SoloSession = {
  id: string;
  difficulty: "EASY" | "HARD";
  targets: RGB[];
  startedAt: number;
  finishedAt: number | null;
};

const sessions = new Map<string, SoloSession>();

function makeSessionId(): string {
  return `sess-${Math.random().toString(36).slice(2, 10)}`;
}

function generateTargets(difficulty: "EASY" | "HARD"): RGB[] {
  return Array.from({ length: 5 }, () => randomRgb());
}

export type MockApi = {
  startSolo: (difficulty: "EASY" | "HARD") => Promise<{
    sessionId: string;
    difficulty: "EASY" | "HARD";
    targets: RGB[];
  }>;
  startSoloPalette: (
    difficulty: "EASY" | "HARD",
  ) => Promise<{
    sessionId: string;
    targets: RGB[];
    palettes: RGB[][];
  }>;
  submitSolo: (
    sessionId: string,
    guesses: RGB[],
  ) => Promise<{
    finalScore: number;
    avgDeltaE: number;
    perAttempt: Array<{
      index: number;
      target: RGB;
      guess: RGB;
      deltaE: number;
      scorePct: number;
    }>;
  }>;
  getProfile: (username: string) => Promise<{
    user: { username: string; avatarUrl: string | null; createdAt: string };
    stats: typeof MOCK_STATS[string] | null;
    daily: ReturnType<typeof mockDailyAggregates>;
  }>;
  getLeaderboard: (kind: "solo" | "br" | "today") => Promise<
    Array<{ rank: number; username: string; value: number; avatarUrl: string | null }>
  >;
  getDailyToday: () => Promise<{
    day: string;
    targets: RGB[];
    alreadyPlayed: boolean;
  }>;
  submitDaily: (
    guesses: RGB[],
  ) => Promise<{
    finalScore: number;
    avgDeltaE: number;
    perAttempt: Array<{
      index: number;
      target: RGB;
      guess: RGB;
      deltaE: number;
      scorePct: number;
    }>;
  }>;
};

function delay<T>(value: T, ms = 150 + Math.random() * 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockApi: MockApi = {
  async startSolo(difficulty) {
    const id = makeSessionId();
    const targets = generateTargets(difficulty);
    sessions.set(id, {
      id,
      difficulty,
      targets,
      startedAt: Date.now(),
      finishedAt: null,
    });
    return delay({ sessionId: id, difficulty, targets });
  },

  async startSoloPalette(difficulty) {
    const id = makeSessionId();
    const targets = generateTargets(difficulty);
    const palettes = targets.map((t) => generateSimilarPalette(t, 5));
    sessions.set(id, {
      id,
      difficulty,
      targets,
      startedAt: Date.now(),
      finishedAt: null,
    });
    return delay({ sessionId: id, targets, palettes });
  },

  async submitSolo(sessionId, guesses) {
    const sess = sessions.get(sessionId);
    if (!sess) throw new Error("session not found");
    if (sess.finishedAt) throw new Error("already submitted");
    const result = scoreColorAccuracy(sess.targets, guesses);
    sess.finishedAt = Date.now();
    return delay(result);
  },

  async getProfile(username) {
    const user = MOCK_USERS.find((u) => u.username === username) ?? MOCK_USERS[0]!;
    return delay({
      user: {
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      stats: MOCK_STATS[user.username] ?? null,
      daily: mockDailyAggregates(),
    });
  },

  async getLeaderboard(kind) {
    const users = [...MOCK_USERS];
    const rows = users.map((u, i) => {
      const s = MOCK_STATS[u.username];
      const value =
        kind === "br"
          ? (s?.brWins ?? 0)
          : kind === "today"
            ? 50 + Math.random() * 50
            : (s?.bestSolo ?? 0);
      return { username: u.username, avatarUrl: u.avatarUrl, value };
    });
    rows.sort((a, b) => b.value - a.value);
    return delay(rows.map((r, i) => ({ rank: i + 1, ...r })));
  },

  async getDailyToday() {
    const day = new Date().toISOString().slice(0, 10);
    return delay({ day, targets: todayTargets(), alreadyPlayed: false });
  },

  async submitDaily(guesses) {
    return delay(scoreColorAccuracy(todayTargets(), guesses));
  },
};
