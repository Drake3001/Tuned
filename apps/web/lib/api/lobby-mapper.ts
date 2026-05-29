import type { LobbyState, Mode, ScoringMode, Status } from "@/lib/mock/lobby-types";

type ApiLobbyPlayer = {
  userId: string;
  username: string;
  lives: number | null;
  eliminatedRound: number | null;
};

type ApiLobby = {
  code: string;
  status: string;
  hostUserId: string;
  mode: Mode;
  scoringMode: ScoringMode;
  maxPlayers: number;
  currentRound: number;
  roundsTotal: number | null;
  livesInitial: number | null;
  players: ApiLobbyPlayer[];
};

function mapLobbyStatus(status: string): Status {
  if (status === "FINISHED") return "FINISHED";
  if (status === "IN_GAME") return "WAITING";
  return "WAITING";
}

export function mapApiLobbyToState(lobby: ApiLobby): LobbyState {
  const livesInitial = lobby.livesInitial ?? 3;
  const roundsTotal = lobby.roundsTotal ?? 5;

  return {
    code: lobby.code,
    hostUserId: lobby.hostUserId,
    mode: lobby.mode,
    scoringMode: lobby.scoringMode,
    livesInitial,
    roundsTotal,
    maxPlayers: lobby.maxPlayers,
    status: mapLobbyStatus(lobby.status),
    players: lobby.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      isBot: false,
      lives: player.lives ?? livesInitial,
      points: 0,
      eliminatedRound: player.eliminatedRound,
    })),
    currentRound: lobby.currentRound,
    currentTarget: null,
    phaseEndsAt: null,
    submissions: [],
    lastRoundScores: [],
    winnerUserId: null,
  };
}

export type { ApiLobby };
