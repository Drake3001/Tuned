import { prisma } from "@repo/db";
import { jsonError, jsonOk } from "@/lib/api/http";
import { utcDayStart, utcDayString } from "@/lib/api/targets";

export const runtime = "nodejs";

async function computeBestSolo(userId: string): Promise<number | null> {
  const agg = await prisma.gameSession.aggregate({
    where: { userId, context: "SOLO", finalScore: { not: null } },
    _max: { finalScore: true },
  });
  return agg._max.finalScore;
}

async function computeAvgDeltaE(userId: string): Promise<number | null> {
  const agg = await prisma.colorAttempt.aggregate({
    where: { session: { userId, context: "SOLO" } },
    _avg: { deltaE: true },
  });
  return agg._avg.deltaE != null ? Number(agg._avg.deltaE) : null;
}

async function computeBrWins(userId: string): Promise<number> {
  return prisma.lobbyPlayer.count({
    where: {
      userId,
      finalRank: 1,
      lobby: { multiplayerMode: "BATTLE_ROYALE", status: "FINISHED" },
    },
  });
}

async function getDailyAggregates(userId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);

  const attempts = await prisma.dailyAttempt.findMany({
    where: { userId, day: { gte: since } },
    select: { day: true, score: true },
    orderBy: { day: "asc" },
  });

  const byDay = new Map<string, { total: number; count: number }>();
  for (const attempt of attempts) {
    const day = utcDayString(attempt.day);
    const current = byDay.get(day) ?? { total: 0, count: 0 };
    current.total += attempt.score;
    current.count += 1;
    byDay.set(day, current);
  }

  return Array.from(byDay.entries()).map(([day, value]) => ({
    day,
    avgScore: value.total / value.count,
    plays: value.count,
  }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await prisma.user.findFirst({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      playerStats: true,
    },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  const [bestSolo, avgDeltaE, brWins, daily] = await Promise.all([
    computeBestSolo(user.id),
    computeAvgDeltaE(user.id),
    computeBrWins(user.id),
    getDailyAggregates(user.id),
  ]);

  return jsonOk(
    {
      user: {
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        soloPlays: user.playerStats?.soloPlays ?? 0,
        multiplayerPlays: user.playerStats?.multiplayerPlays ?? 0,
        currentStreak: user.playerStats?.currentStreak ?? 0,
        bestSolo: bestSolo ?? 0,
        avgDeltaE: avgDeltaE ?? 0,
        brWins,
      },
      daily,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
