"use client";

import { deltaE, type RGB } from "@/lib/game/color";
import { scoreHitSquare, HIT_SQUARE_THRESHOLD } from "@/lib/game/scoring";
import { rgbToHsb, hsbToRgb } from "@/lib/game/color/conversions";
import type { LobbyState, RoundScore } from "./lobby-types";
import { loadLobby, saveLobby, pickTarget, channelName } from "./lobby-store";

export const MEMORIZE_MS = 3000;
export const RECALL_MS = 12000;
export const SCORING_MS = 4000;

type Broadcast = (state: LobbyState) => void;

export class LobbyDriver {
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly code: string,
    private readonly broadcast: Broadcast,
  ) {}

  private read(): LobbyState | null {
    return loadLobby(this.code);
  }

  private write(state: LobbyState) {
    saveLobby(state);
    this.broadcast(state);
  }

  private schedule(ms: number, fn: () => void) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  dispose() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  hostStart() {
    const state = this.read();
    if (!state || state.status !== "WAITING") return;
    if (state.players.filter((p) => p.lives > 0 || state.mode === "ROUND_BASED").length < 2) return;
    this.beginRound(state, 1);
  }

  private beginRound(prev: LobbyState, roundIndex: number) {
    const next: LobbyState = {
      ...prev,
      status: "MEMORIZE",
      currentRound: roundIndex,
      currentTarget: pickTarget(),
      phaseEndsAt: Date.now() + MEMORIZE_MS,
      submissions: [],
      lastRoundScores: [],
    };
    this.write(next);
    this.schedule(MEMORIZE_MS, () => this.startRecall());
  }

  private startRecall() {
    const state = this.read();
    if (!state || state.status !== "MEMORIZE") return;
    const next: LobbyState = {
      ...state,
      status: "RECALL",
      phaseEndsAt: Date.now() + RECALL_MS,
    };
    this.write(next);
    this.scheduleBotSubmissions(next);
    this.schedule(RECALL_MS, () => this.startScoring());
  }

  submitForUser(userId: string, guess: RGB) {
    const state = this.read();
    if (!state || state.status !== "RECALL") return;
    if (state.submissions.some((s) => s.userId === userId)) return;
    const next: LobbyState = {
      ...state,
      submissions: [
        ...state.submissions,
        { userId, guess, submittedAtMs: Date.now() },
      ],
    };
    this.write(next);
    if (allAliveSubmitted(next)) {
      this.startScoring();
    }
  }

  private scheduleBotSubmissions(state: LobbyState) {
    const target = state.currentTarget;
    if (!target) return;
    for (const player of state.players) {
      if (!player.isBot) continue;
      if (player.lives <= 0 && state.mode === "BATTLE_ROYALE") continue;
      const delay = 800 + Math.random() * (RECALL_MS - 2000);
      this.schedule(delay, () => {
        const cur = this.read();
        if (!cur || cur.status !== "RECALL") return;
        if (cur.submissions.some((s) => s.userId === player.userId)) return;
        const skill = 0.5 + Math.random() * 0.45;
        const [h, s, b] = rgbToHsb(target);
        const jit = (1 - skill) * 0.3;
        const jh = ((h + (Math.random() * 2 - 1) * 60 * (1 - skill)) + 360) % 360;
        const js = Math.max(0, Math.min(1, s + (Math.random() * 2 - 1) * jit));
        const jb = Math.max(0, Math.min(1, b + (Math.random() * 2 - 1) * jit));
        this.submitForUser(player.userId, hsbToRgb([jh, js, jb]));
      });
    }
  }

  private startScoring() {
    const state = this.read();
    if (!state || state.status !== "RECALL") return;
    const target = state.currentTarget;
    if (!target) return;

    const alivePlayers =
      state.mode === "BATTLE_ROYALE"
        ? state.players.filter((p) => p.lives > 0)
        : state.players;

    const subByUser = new Map(state.submissions.map((s) => [s.userId, s]));

    const scores: RoundScore[] = alivePlayers.map((p) => {
      const sub = subByUser.get(p.userId);
      if (!sub) {
        return {
          userId: p.userId,
          guess: null,
          deltaE: Number.POSITIVE_INFINITY,
          hit: false,
          submittedAtMs: null,
          pointsAwarded: 0,
        };
      }
      const d = deltaE(target, sub.guess);
      const hit = state.scoringMode === "SPEED" ? scoreHitSquare(target, sub.guess).hit : d < HIT_SQUARE_THRESHOLD;
      const points =
        state.scoringMode === "SPEED"
          ? hit
            ? 1
            : 0
          : Math.max(0, Math.min(100, 100 - d * 2));
      return {
        userId: p.userId,
        guess: sub.guess,
        deltaE: d,
        hit,
        submittedAtMs: sub.submittedAtMs,
        pointsAwarded: points,
      };
    });

    let players = state.players.map((p) => {
      const s = scores.find((x) => x.userId === p.userId);
      if (!s) return p;
      return { ...p, points: p.points + s.pointsAwarded };
    });

    if (state.mode === "BATTLE_ROYALE") {
      const sorted = [...scores].sort((a, b) => {
        if (b.deltaE !== a.deltaE) return b.deltaE - a.deltaE;
        return (b.submittedAtMs ?? 0) - (a.submittedAtMs ?? 0);
      });
      const worst = sorted[0];
      if (worst) {
        players = players.map((p) =>
          p.userId === worst.userId ? { ...p, lives: p.lives - 1 } : p,
        );
        players = players.map((p) =>
          p.userId === worst.userId && p.lives === 0
            ? { ...p, eliminatedRound: state.currentRound }
            : p,
        );
      }
    }

    const survivors = players.filter((p) => p.lives > 0);
    const endgame =
      state.mode === "BATTLE_ROYALE"
        ? survivors.length <= 1
        : state.currentRound >= state.roundsTotal;

    const next: LobbyState = {
      ...state,
      status: endgame ? "FINISHED" : "SCORING",
      players,
      lastRoundScores: scores,
      phaseEndsAt: endgame ? null : Date.now() + SCORING_MS,
      winnerUserId: endgame
        ? state.mode === "BATTLE_ROYALE"
          ? (survivors[0]?.userId ?? null)
          : findWinnerByPoints(players)
        : null,
    };
    this.write(next);

    if (!endgame) {
      this.schedule(SCORING_MS, () => {
        const cur = this.read();
        if (!cur || cur.status !== "SCORING") return;
        this.beginRound(cur, cur.currentRound + 1);
      });
    }
  }
}

function allAliveSubmitted(state: LobbyState): boolean {
  const required = state.players.filter((p) =>
    state.mode === "BATTLE_ROYALE" ? p.lives > 0 : true,
  );
  return required.every((p) =>
    state.submissions.some((s) => s.userId === p.userId),
  );
}

function findWinnerByPoints(players: LobbyState["players"]): string | null {
  if (players.length === 0) return null;
  return players.reduce((best, cur) =>
    cur.points > best.points ? cur : best,
  ).userId;
}

void channelName;
