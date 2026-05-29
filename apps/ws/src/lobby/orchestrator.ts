import { prisma } from "@repo/db";
import type { Server } from "socket.io";
import { deltaE, rgbToHsb } from "./color.js";
import {
  MEMORIZE_MS,
  RECALL_MS,
  SCORING_MS,
  deltaEToScorePct,
  randomRgb,
  scoreHitSquare,
} from "./scoring.js";
import type { LobbyPlayer, LobbyState, RGB, RoundScore, Status } from "./types.js";

export type LobbyOrchestratorOptions = {
  code: string;
  io: Server;
  onFinished?: () => void;
};

type DbLobby = NonNullable<Awaited<ReturnType<typeof fetchLobbyFromDb>>>;
type DbLobbyPlayer = DbLobby["players"][number];
type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function fetchLobbyFromDb(code: string) {
  return prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      roundSettings: true,
      brSettings: true,
      players: {
        include: { user: { select: { username: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

function mapDbStatus(status: string): Status {
  if (status === "FINISHED") return "FINISHED";
  return "WAITING";
}

function buildLobbyStateFromDb(lobby: DbLobby, overrides?: Partial<LobbyState>): LobbyState {
  const livesInitial = lobby.brSettings?.startingLives ?? 3;
  const roundsTotal = lobby.roundSettings?.totalRounds ?? 5;

  return {
    code: lobby.code,
    hostUserId: lobby.hostUserId,
    mode: lobby.multiplayerMode,
    scoringMode: lobby.scoringMode,
    livesInitial,
    roundsTotal,
    maxPlayers: lobby.maxPlayers,
    answerTimeLimitSec: lobby.answerTimeLimitSec ?? null,
    status: mapDbStatus(lobby.status),
    players: lobby.players.map((p: DbLobbyPlayer) => ({
      userId: p.userId,
      username: p.user.username,
      isBot: false,
      lives: p.lives ?? livesInitial,
      points: 0,
      eliminatedRound: p.eliminatedRound,
    })),
    currentRound: lobby.currentRound,
    currentTarget: null,
    phaseEndsAt: null,
    submissions: [],
    lastRoundScores: [],
    winnerUserId: null,
    ...overrides,
  };
}

export class LobbyOrchestrator {
  readonly code: string;
  private readonly io: Server;
  private readonly onFinished?: () => void;
  private state: LobbyState | null = null;
  private lobbyId: string | null = null;
  private currentRoundId: string | null = null;
  private phaseTimer: NodeJS.Timeout | null = null;
  private timers = new Set<NodeJS.Timeout>();

  constructor({ code, io, onFinished }: LobbyOrchestratorOptions) {
    this.code = code.toUpperCase();
    this.io = io;
    this.onFinished = onFinished;
  }

  getState(): LobbyState | null {
    return this.state;
  }

  /** True when an in-progress or recently finished match is held in memory. */
  isLive(): boolean {
    const status = this.state?.status;
    return (
      status === "MEMORIZE" ||
      status === "RECALL" ||
      status === "SCORING" ||
      status === "FINISHED"
    );
  }

  async hydrate(): Promise<void> {
    if (this.state && !["WAITING", "FINISHED"].includes(this.state.status)) {
      return;
    }

    const lobby = await fetchLobbyFromDb(this.code);
    if (!lobby) {
      this.state = null;
      return;
    }

    this.lobbyId = lobby.id;

    if (lobby.status === "FINISHED") {
      const winner =
        lobby.players.find((p: DbLobbyPlayer) => p.finalRank === 1)?.userId ??
        lobby.players.sort(
          (a: DbLobbyPlayer, b: DbLobbyPlayer) => (a.finalRank ?? 99) - (b.finalRank ?? 99),
        )[0]?.userId ??
        null;
      this.state = buildLobbyStateFromDb(lobby, {
        status: "FINISHED",
        winnerUserId: winner,
      });
      return;
    }

    this.state = buildLobbyStateFromDb(lobby);
  }

  async start(hostUserId: string): Promise<void> {
    if (!this.state) {
      await this.hydrate();
    }
    const state = this.state;
    if (!state) {
      this.emitError("NOT_FOUND", "Lobby not found");
      return;
    }

    if (state.hostUserId !== hostUserId) {
      this.emitError("FORBIDDEN", "Only the host can start the lobby");
      return;
    }

    if (state.status !== "WAITING") {
      this.emitError("INVALID_STATE", "Lobby is not in waiting state");
      return;
    }

    const eligible =
      state.mode === "BATTLE_ROYALE"
        ? state.players.filter((p) => p.lives > 0)
        : state.players;
    if (eligible.length < 2) {
      this.emitError("NOT_ENOUGH_PLAYERS", "At least 2 players required to start");
      return;
    }

    await this.beginRound(state, 1);
  }

  async submit(userId: string, guess: RGB): Promise<void> {
    const state = this.state;
    if (!state || state.status !== "RECALL") {
      this.emitError("INVALID_STATE", "Submissions are only allowed during recall phase");
      return;
    }

    if (state.submissions.some((s) => s.userId === userId)) {
      return;
    }

    const player = state.players.find((p) => p.userId === userId);
    if (!player) return;
    if (state.mode === "BATTLE_ROYALE" && player.lives <= 0) return;

    state.submissions.push({ userId, guess, submittedAtMs: Date.now() });
    this.emitState({ ...state });

    if (allAliveSubmitted(state)) {
      this.clearPhaseTimer();
      this.scoring();
    }
  }

  /** Remove player from waiting lobby (DB + state). */
  async removePlayer(userId: string): Promise<void> {
    if (!this.lobbyId || !this.state) return;

    if (this.state.status === "WAITING") {
      await prisma.lobbyPlayer.deleteMany({
        where: { lobbyId: this.lobbyId, userId },
      });
      this.state = {
        ...this.state,
        players: this.state.players.filter((p) => p.userId !== userId),
      };
      this.emitState(this.state);
    }
  }

  emitState(state: LobbyState): void {
    this.state = state;
    this.io.to(this.roomName()).emit("lobby:state", state);
  }

  private async beginRound(prev: LobbyState, roundIndex: number): Promise<void> {
    const target = randomRgb();
    const targetHsb = rgbToHsb(target);

    if (!this.lobbyId) {
      this.emitError("INTERNAL", "Lobby id missing");
      return;
    }

    const round = await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.lobby.update({
        where: { id: this.lobbyId! },
        data: { status: "IN_GAME", currentRound: roundIndex },
      });
      return tx.round.create({
        data: {
          lobbyId: this.lobbyId!,
          index: roundIndex,
          targetColors: [targetHsb],
          phase: "MEMORIZE",
        },
      });
    });

    this.currentRoundId = round.id;

    const next: LobbyState = {
      ...prev,
      status: "MEMORIZE",
      currentRound: roundIndex,
      currentTarget: target,
      phaseEndsAt: Date.now() + MEMORIZE_MS,
      submissions: [],
      lastRoundScores: [],
    };
    this.emitState(next);
    this.schedulePhase(MEMORIZE_MS, () => this.recall());
  }

  private recall(): void {
    const state = this.state;
    if (!state || state.status !== "MEMORIZE") return;

    const recallMs = state.answerTimeLimitSec
      ? state.answerTimeLimitSec * 1000
      : RECALL_MS;
    const next: LobbyState = {
      ...state,
      status: "RECALL",
      phaseEndsAt: Date.now() + recallMs,
    };
    this.emitState(next);
    this.schedulePhase(recallMs, () => this.scoring());
  }

  private async scoring(): Promise<void> {
    const state = this.state;
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
      const hit =
        state.scoringMode === "SPEED"
          ? scoreHitSquare(target, sub.guess).hit
          : d < 5;
      const points =
        state.scoringMode === "SPEED"
          ? hit
            ? 1
            : 0
          : deltaEToScorePct(d);
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

        await prisma.$transaction(async (tx: PrismaTx) => {
          for (const p of players) {
            if (p.userId === worst.userId) {
              await tx.lobbyPlayer.update({
                where: { lobbyId_userId: { lobbyId: this.lobbyId!, userId: p.userId } },
                data: {
                  lives: p.lives,
                  eliminatedRound: p.eliminatedRound,
                },
              });
            }
          }
        });
      }
    }

    await this.persistRoundScores(scores);

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

    this.emitState(next);

    if (endgame) {
      await this.finalize(next);
    } else {
      this.schedulePhase(SCORING_MS, () => {
        const cur = this.state;
        if (!cur || cur.status !== "SCORING") return;
        void this.nextRound(cur);
      });
    }
  }

  private async nextRound(prev: LobbyState): Promise<void> {
    await this.beginRound(prev, prev.currentRound + 1);
  }

  private async persistRoundScores(scores: RoundScore[]): Promise<void> {
    if (!this.currentRoundId) return;

    const ranked = [...scores].sort((a, b) => b.pointsAwarded - a.pointsAwarded);

    await prisma.$transaction(async (tx: PrismaTx) => {
      for (let i = 0; i < ranked.length; i++) {
        const s = ranked[i]!;
        await tx.roundScore.create({
          data: {
            roundId: this.currentRoundId!,
            userId: s.userId,
            deltaE: Number.isFinite(s.deltaE) ? s.deltaE : null,
            responseTimeMs: s.submittedAtMs,
            score: s.pointsAwarded,
            rank: i + 1,
          },
        });
      }
      await tx.round.update({
        where: { id: this.currentRoundId! },
        data: { phase: "RESULT" },
      });
    });
  }

  private async finalize(state: LobbyState): Promise<void> {
    if (!this.lobbyId) return;

    const ranks = computeFinalRanks(state);

    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.lobby.update({
        where: { id: this.lobbyId! },
        data: { status: "FINISHED", closedAt: new Date() },
      });

      for (const [userId, rank] of ranks.entries()) {
        await tx.lobbyPlayer.update({
          where: { lobbyId_userId: { lobbyId: this.lobbyId!, userId } },
          data: { finalRank: rank },
        });
        await tx.playerStats.upsert({
          where: { userId },
          update: { multiplayerPlays: { increment: 1 } },
          create: { userId, multiplayerPlays: 1 },
        });
      }
    });

    this.clearPhaseTimer();
    this.onFinished?.();
  }

  private schedulePhase(ms: number, fn: () => void): void {
    this.clearPhaseTimer();
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.phaseTimer = null;
      fn();
    }, ms);
    this.timers.add(t);
    this.phaseTimer = t;
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.timers.delete(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private emitError(code: string, message: string): void {
    this.io.to(this.roomName()).emit("lobby:error", { code, message });
  }

  private roomName(): string {
    return `lobby:${this.code}`;
  }

  dispose(): void {
    this.clearPhaseTimer();
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.state = null;
    this.currentRoundId = null;
  }
}

function allAliveSubmitted(state: LobbyState): boolean {
  const required = state.players.filter((p) =>
    state.mode === "BATTLE_ROYALE" ? p.lives > 0 : true,
  );
  return required.every((p) => state.submissions.some((s) => s.userId === p.userId));
}

function findWinnerByPoints(players: LobbyPlayer[]): string | null {
  if (players.length === 0) return null;
  return players.reduce((best, cur) => (cur.points > best.points ? cur : best)).userId;
}

function computeFinalRanks(state: LobbyState): Map<string, number> {
  const ranks = new Map<string, number>();

  if (state.mode === "BATTLE_ROYALE") {
    const winner = state.winnerUserId;
    if (winner) ranks.set(winner, 1);
    const rest = state.players
      .filter((p) => p.userId !== winner)
      .sort((a, b) => (b.eliminatedRound ?? 0) - (a.eliminatedRound ?? 0));
    let rank = 2;
    for (const p of rest) {
      ranks.set(p.userId, rank++);
    }
    return ranks;
  }

  const sorted = [...state.players].sort((a, b) => b.points - a.points);
  sorted.forEach((p, i) => ranks.set(p.userId, i + 1));
  return ranks;
}
