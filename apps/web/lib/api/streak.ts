import { prisma } from "@repo/db";
import { utcDayStart, utcDayString } from "./targets";

/**
 * Current daily-challenge streak: consecutive UTC days with a DailyAttempt,
 * ending today or yesterday. Computed on read from DailyAttempt records
 * (PlayerStats.currentStreak is never maintained).
 */
export async function computeDailyStreak(userId: string): Promise<number> {
  const attempts = await prisma.dailyAttempt.findMany({
    where: { userId },
    select: { day: true },
    orderBy: { day: "desc" },
    take: 400,
  });

  const set = new Set(attempts.map((a: { day: Date }) => utcDayString(a.day)));
  const today = utcDayStart();
  const yesterday = utcDayStart();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let cursor: Date;
  if (set.has(utcDayString(today))) cursor = today;
  else if (set.has(utcDayString(yesterday))) cursor = yesterday;
  else return 0;

  let streak = 0;
  while (set.has(utcDayString(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
