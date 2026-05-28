import { prisma } from "@repo/db";
import { jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

const startedAt = Date.now();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({
      status: "ok",
      db: "ok",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    });
  } catch {
    return jsonOk(
      {
        status: "degraded",
        db: "error",
        uptime: Math.floor((Date.now() - startedAt) / 1000),
      },
      { status: 503 },
    );
  }
}
