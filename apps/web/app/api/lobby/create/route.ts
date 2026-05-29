import { prisma } from "@repo/db";
import { withAuth } from "../../_utils/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { generateLobbyCode } from "@/lib/api/lobby-code";

export const runtime = "nodejs";

type CreateBody = {
  mode?: "BATTLE_ROYALE" | "ROUND_BASED";
  scoringMode?: "COLOR_ACCURACY" | "SPEED";
  livesInitial?: number;
  roundsTotal?: number;
  maxPlayers?: number;
  answerTimeLimitSec?: number;
};

async function findActiveLobbyForUser(userId: string) {
  return prisma.lobby.findFirst({
    where: {
      status: { in: ["WAITING", "IN_GAME"] },
      players: { some: { userId } },
    },
    select: { code: true },
  });
}

export const POST = withAuth(async (req, auth) => {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const mode = body.mode;
  const scoringMode = body.scoringMode ?? "COLOR_ACCURACY";
  const maxPlayers = body.maxPlayers ?? 8;

  if (mode !== "BATTLE_ROYALE" && mode !== "ROUND_BASED") {
    return jsonError("mode must be BATTLE_ROYALE or ROUND_BASED", 400);
  }
  if (scoringMode !== "COLOR_ACCURACY" && scoringMode !== "SPEED") {
    return jsonError("scoringMode must be COLOR_ACCURACY or SPEED", 400);
  }
  if (maxPlayers < 2 || maxPlayers > 8) {
    return jsonError("maxPlayers must be between 2 and 8", 400);
  }

  const livesInitial = body.livesInitial ?? 3;
  const roundsTotal = body.roundsTotal ?? 5;
  const answerTimeLimitSec = body.answerTimeLimitSec ?? 12;

  if (mode === "BATTLE_ROYALE" && (livesInitial < 1 || livesInitial > 5)) {
    return jsonError("livesInitial must be between 1 and 5", 400);
  }
  if (mode === "ROUND_BASED" && (roundsTotal < 1 || roundsTotal > 20)) {
    return jsonError("roundsTotal must be between 1 and 20", 400);
  }
  if (answerTimeLimitSec < 5 || answerTimeLimitSec > 60) {
    return jsonError("answerTimeLimitSec must be between 5 and 60", 400);
  }

  const active = await findActiveLobbyForUser(auth.userId);
  if (active) {
    return jsonError("User already has an active lobby", 409);
  }

  let lobby:
    | {
        code: string;
        status: string;
      }
    | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLobbyCode();
    try {
      lobby = await prisma.$transaction(async (tx) => {
        const created = await tx.lobby.create({
          data: {
            code,
            hostUserId: auth.userId,
            multiplayerMode: mode,
            scoringMode,
            maxPlayers,
            answerTimeLimitSec,
            players: {
              create: {
                userId: auth.userId,
                lives: mode === "BATTLE_ROYALE" ? livesInitial : null,
              },
            },
            ...(mode === "ROUND_BASED"
              ? {
                  roundSettings: {
                    create: { totalRounds: roundsTotal },
                  },
                }
              : {
                  brSettings: {
                    create: { startingLives: livesInitial },
                  },
                }),
          },
          select: { code: true, status: true },
        });

        await tx.playerStats.upsert({
          where: { userId: auth.userId },
          update: {},
          create: { userId: auth.userId },
        });

        return created;
      });
      break;
    } catch {
      lobby = null;
    }
  }

  if (!lobby) {
    return jsonError("Failed to generate unique lobby code", 500);
  }

  return jsonOk({ lobby });
});
