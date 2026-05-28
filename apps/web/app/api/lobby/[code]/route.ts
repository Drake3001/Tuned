import { prisma } from "@repo/db";
import { withAuth } from "../../_utils/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

const lobbyInclude = {
  roundSettings: true,
  brSettings: true,
  players: {
    include: {
      user: {
        select: { username: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: "asc" as const },
  },
};

function serializeLobby(lobby: {
  code: string;
  status: string;
  hostUserId: string;
  multiplayerMode: string;
  scoringMode: string;
  maxPlayers: number;
  currentRound: number;
  answerTimeLimitSec: number | null;
  roundSettings: { totalRounds: number } | null;
  brSettings: { startingLives: number } | null;
  players: Array<{
    userId: string;
    lives: number | null;
    eliminatedRound: number | null;
    finalRank: number | null;
    joinedAt: Date;
    user: { username: string; avatarUrl: string | null };
  }>;
}) {
  return {
    code: lobby.code,
    status: lobby.status,
    hostUserId: lobby.hostUserId,
    mode: lobby.multiplayerMode,
    scoringMode: lobby.scoringMode,
    maxPlayers: lobby.maxPlayers,
    currentRound: lobby.currentRound,
    answerTimeLimitSec: lobby.answerTimeLimitSec,
    roundsTotal: lobby.roundSettings?.totalRounds ?? null,
    livesInitial: lobby.brSettings?.startingLives ?? null,
    players: lobby.players.map((player) => ({
      userId: player.userId,
      username: player.user.username,
      avatarUrl: player.user.avatarUrl,
      lives: player.lives,
      eliminatedRound: player.eliminatedRound,
      finalRank: player.finalRank,
      joinedAt: player.joinedAt.toISOString(),
    })),
  };
}

export const GET = withAuth(async (_req, auth, { params }) => {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();

  const lobby = await prisma.lobby.findUnique({
    where: { code: normalizedCode },
    include: lobbyInclude,
  });

  if (!lobby) {
    return jsonError("Lobby not found", 404);
  }

  const isMember = lobby.players.some((player) => player.userId === auth.userId);
  if (!isMember) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ lobby: serializeLobby(lobby) });
});
