import { prisma } from "@repo/db";
import { withOptionalAuth } from "../../_utils/auth";
import { jsonOk } from "@/lib/api/http";
import {
  dailySeedForDay,
  deterministicDailyTargets,
  hsbRecordsToRgb,
  rgbToHsbRecord,
  utcDayStart,
  utcDayString,
} from "@/lib/api/targets";
import type { HsbColor } from "@/lib/api/targets";

export const runtime = "nodejs";

export const GET = withOptionalAuth(async (_req, auth) => {
  const dayStart = utcDayStart();
  const day = utcDayString(dayStart);
  const seed = dailySeedForDay(dayStart);
  const targetColors = deterministicDailyTargets(dayStart).map(rgbToHsbRecord);

  await prisma.dailyChallenge.upsert({
    where: { day: dayStart },
    update: {},
    create: {
      day: dayStart,
      targetColors,
      seed,
      soloDifficulty: "HARD",
    },
  });

  let alreadyPlayed = false;
  if (auth) {
    const attempt = await prisma.dailyAttempt.findUnique({
      where: {
        userId_day: {
          userId: auth.userId,
          day: dayStart,
        },
      },
      select: { userId: true },
    });
    alreadyPlayed = attempt != null;
  }

  return jsonOk({
    day,
    targets: auth ? hsbRecordsToRgb(targetColors as HsbColor[]) : [],
    alreadyPlayed,
  });
});
