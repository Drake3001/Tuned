import { prisma } from "@repo/db";
import { jsonOk } from "@/lib/api/http";
import { utcDayStart } from "@/lib/api/targets";

export const runtime = "nodejs";

export async function GET() {
  const dayStart = utcDayStart();

  const attempts = await prisma.dailyAttempt.findMany({
    where: { day: dayStart },
    orderBy: { score: "desc" },
    take: 100,
    select: {
      score: true,
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return jsonOk(
    attempts.map((attempt, index) => ({
      rank: index + 1,
      username: attempt.user.username,
      avatarUrl: attempt.user.avatarUrl,
      value: attempt.score,
    })),
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
