"use client";

import type { LobbyState, LobbyConfig } from "./lobby-types";
import { requireMockSession } from "./auth";
import { randomRgb } from "./fixtures";

const STORAGE_PREFIX = "tuned:lobby:";
const CHANNEL_PREFIX = "tuned-lobby-";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLobbyCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

export function storageKey(code: string): string {
  return STORAGE_PREFIX + code;
}

export function channelName(code: string): string {
  return CHANNEL_PREFIX + code;
}

export function loadLobby(code: string): LobbyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(code));
    return raw ? (JSON.parse(raw) as LobbyState) : null;
  } catch {
    return null;
  }
}

export function saveLobby(state: LobbyState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(state.code), JSON.stringify(state));
}

export function deleteLobby(code: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(code));
}

export function createLobby(config: LobbyConfig): LobbyState {
  const session = requireMockSession();
  const code = generateLobbyCode();
  const livesInitial = config.livesInitial ?? 3;
  const state: LobbyState = {
    code,
    hostUserId: session.userId,
    mode: config.mode,
    scoringMode: config.scoringMode,
    livesInitial,
    roundsTotal: config.roundsTotal ?? 5,
    maxPlayers: config.maxPlayers ?? 4,
    status: "WAITING",
    players: [
      {
        userId: session.userId,
        username: session.username,
        isBot: false,
        lives: livesInitial,
        points: 0,
        eliminatedRound: null,
      },
      ...generateBots(2, livesInitial),
    ],
    currentRound: 0,
    currentTarget: null,
    phaseEndsAt: null,
    submissions: [],
    lastRoundScores: [],
    winnerUserId: null,
  };
  saveLobby(state);
  return state;
}

const BOT_NAMES = ["bot.crimson", "bot.azure", "bot.olive", "bot.violet", "bot.amber"];

function generateBots(count: number, lives: number) {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }).map((_, i) => ({
    userId: `bot-${i}-${Math.random().toString(36).slice(2, 6)}`,
    username: shuffled[i] ?? `bot.${i}`,
    isBot: true,
    lives,
    points: 0,
    eliminatedRound: null as number | null,
  }));
}

export function pickTarget(): [number, number, number] {
  const [r, g, b] = randomRgb();
  return [r, g, b];
}
