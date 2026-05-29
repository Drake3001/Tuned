import { prisma } from "@repo/db";
import type { RGB } from "@/lib/game/color";
import { scoreColorAccuracy } from "@/lib/game/scoring";
import { rgbToHsb } from "@/lib/game/color/conversions";
import { withOptionalAuth } from "../../../_utils/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { deleteSoloSession, getSoloSession } from "@/lib/api/solo-store";

export const runtime = "nodejs";

type SubmitBody = {
  sessionId?: string;
  guesses?: RGB[];
};

function isValidRgb(value: unknown): value is RGB {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 255)
  );
}

export const POST = withOptionalAuth(async (req, auth) => {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { sessionId, guesses } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return jsonError("sessionId is required", 400);
  }
  if (!Array.isArray(guesses) || guesses.length !== 5 || !guesses.every(isValidRgb)) {
    return jsonError("guesses must be an array of 5 RGB tuples", 400);
  }

  const meta = getSoloSession(sessionId);
  if (!meta) {
    return jsonError("Session not found or expired", 404);
  }

  if (auth && meta.userId && meta.userId !== auth.userId) {
    return jsonError("Forbidden", 403);
  }

  if (meta.persisted) {
    const dbSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: { id: true, finishedAt: true, userId: true, context: true, soloDifficulty: true },
    });

    if (!dbSession || dbSession.context !== "SOLO") {
      return jsonError("Session not found", 404);
    }
    if (dbSession.finishedAt) {
      return jsonError("Session already submitted", 409);
    }
    if (auth && dbSession.userId !== auth.userId) {
      return jsonError("Forbidden", 403);
    }
  }

  const result = scoreColorAccuracy(meta.targets, guesses);

  if (meta.persisted) {
    await prisma.$transaction(async (tx) => {
      await tx.colorAttempt.createMany({
        data: result.perAttempt.map((attempt) => {
          const [targetHue, targetSaturation, targetBrightness] = rgbToHsb(attempt.target);
          const [guessHue, guessSaturation, guessBrightness] = rgbToHsb(attempt.guess);
          return {
            sessionId,
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

      await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          finalScore: result.finalScore,
          finishedAt: new Date(),
        },
      });

      await tx.playerStats.upsert({
        where: { userId: meta.userId! },
        update: { soloPlays: { increment: 1 } },
        create: { userId: meta.userId!, soloPlays: 1 },
      });
    });
  }

  deleteSoloSession(sessionId);
  return jsonOk({
    finalScore: result.finalScore,
    avgDeltaE: result.avgDeltaE,
    perAttempt: result.perAttempt,
  });
});
