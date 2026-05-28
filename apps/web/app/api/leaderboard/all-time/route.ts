import { prisma } from "@repo/db";
import { jsonError, jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "solo";

  if (mode !== "solo" && mode !== "br") {
    return jsonError("mode must be solo or br", 400);
  }

  const users = await prisma.user.findMany({
    select: {
      username: true,
      avatarUrl: true,
      id: true,
    },
  });

  const rows = await Promise.all(
    users.map(async (user) => {
      if (mode === "solo") {
        const agg = await prisma.gameSession.aggregate({
          where: { userId: user.id, context: "SOLO", finalScore: { not: null } },
          _max: { finalScore: true },
        });
        return {
          username: user.username,
          avatarUrl: user.avatarUrl,
          value: agg._max.finalScore ?? 0,
        };
      }

      const wins = await prisma.lobbyPlayer.count({
        where: {
          userId: user.id,
          finalRank: 1,
          lobby: { multiplayerMode: "BATTLE_ROYALE", status: "FINISHED" },
        },
      });

      return {
        username: user.username,
        avatarUrl: user.avatarUrl,
        value: wins,
      };
    }),
  );

  rows.sort((a, b) => b.value - a.value);

  return jsonOk(
    rows.slice(0, 100).map((row, index) => ({
      rank: index + 1,
      ...row,
    })),
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
