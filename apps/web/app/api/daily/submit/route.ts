import { prisma } from "@repo/db";
import type { RGB } from "@/lib/game/color";
import { scoreColorAccuracy } from "@/lib/game/scoring";
import { rgbToHsb } from "@/lib/game/color/conversions";
import { withAuth } from "../../_utils/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { hsbRecordsToRgb, utcDayStart } from "@/lib/api/targets";
import type { HsbColor } from "@/lib/api/targets";

export const runtime = "nodejs";

type SubmitBody = {
  guesses?: RGB[];
};

function isValidRgb(value: unknown): value is RGB {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 255)
  );
}

export const POST = withAuth(async (req, auth) => {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { guesses } = body;
  if (!Array.isArray(guesses) || guesses.length !== 5 || !guesses.every(isValidRgb)) {
    return jsonError("guesses must be an array of 5 RGB tuples", 400);
  }

  const dayStart = utcDayStart();
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { day: dayStart },
  });

  if (!challenge) {
    return jsonError("Daily challenge not found", 404);
  }

  const existing = await prisma.dailyAttempt.findUnique({
    where: {
      userId_day: {
        userId: auth.userId,
        day: dayStart,
      },
    },
    select: { userId: true },
  });

  if (existing) {
    return jsonError("Daily attempt already submitted", 409);
  }

  const targets = hsbRecordsToRgb(challenge.targetColors as HsbColor[]);
  const result = scoreColorAccuracy(targets, guesses);

  await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({
      data: {
        userId: auth.userId,
        context: "SOLO",
        soloDifficulty: challenge.soloDifficulty,
        finalScore: result.finalScore,
        finishedAt: new Date(),
      },
    });

    await tx.colorAttempt.createMany({
      data: result.perAttempt.map((attempt) => {
        const [targetHue, targetSaturation, targetBrightness] = rgbToHsb(attempt.target);
        const [guessHue, guessSaturation, guessBrightness] = rgbToHsb(attempt.guess);
        return {
          sessionId: session.id,
          index: attempt.index + 1,
          targetHue,
          targetSaturation,
          targetBrightness,
          guessHue,
          guessSaturation,
          guessBrightness,
          deltaE: attempt.deltaE,
        };
      }),
    });

    await tx.dailyAttempt.create({
      data: {
        userId: auth.userId,
        day: dayStart,
        sessionId: session.id,
        score: result.finalScore,
      },
    });

    await tx.playerStats.upsert({
      where: { userId: auth.userId },
      update: { soloPlays: { increment: 1 } },
      create: { userId: auth.userId, soloPlays: 1 },
    });
  });

  return jsonOk({
    finalScore: result.finalScore,
    avgDeltaE: result.avgDeltaE,
    perAttempt: result.perAttempt,
  });
});
