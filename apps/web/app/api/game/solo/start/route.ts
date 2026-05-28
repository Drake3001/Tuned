import { randomUUID } from "crypto";
import { prisma } from "@repo/db";
import { withOptionalAuth } from "../../_utils/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { generateTargets } from "@/lib/api/targets";
import { putSoloSession } from "@/lib/api/solo-store";

export const runtime = "nodejs";

type StartBody = {
  difficulty?: "EASY" | "HARD";
};

export const POST = withOptionalAuth(async (req, auth) => {
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const difficulty = body.difficulty;
  if (difficulty !== "EASY" && difficulty !== "HARD") {
    return jsonError("difficulty must be EASY or HARD", 400);
  }

  const targets = generateTargets(5);
  const startedAt = Date.now();

  if (auth) {
    const session = await prisma.gameSession.create({
      data: {
        userId: auth.userId,
        context: "SOLO",
        soloDifficulty: difficulty,
      },
      select: { id: true },
    });

    putSoloSession(session.id, {
      targets,
      difficulty,
      startedAt,
      userId: auth.userId,
      persisted: true,
    });

    return jsonOk({ sessionId: session.id, difficulty, targets });
  }

  const sessionId = randomUUID();
  putSoloSession(sessionId, {
    targets,
    difficulty,
    startedAt,
    persisted: false,
  });

  return jsonOk({ sessionId, difficulty, targets });
});
