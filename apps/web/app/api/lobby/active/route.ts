import { prisma } from "@repo/db";
import { withAuth } from "../../_utils/auth";
import { jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

async function findActiveLobbyForUser(userId: string) {
  return prisma.lobby.findFirst({
    where: {
      status: { in: ["WAITING", "IN_GAME"] },
      players: { some: { userId } },
    },
    select: {
      code: true,
      status: true,
      multiplayerMode: true,
      currentRound: true,
    },
  });
}

export const GET = withAuth(async (_req, auth) => {
  const lobby = await findActiveLobbyForUser(auth.userId);

  if (!lobby) {
    return jsonOk({ lobby: null });
  }

  return jsonOk({
    lobby: {
      code: lobby.code,
      status: lobby.status,
      mode: lobby.multiplayerMode,
      currentRound: lobby.currentRound,
    },
  });
});
