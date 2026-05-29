import { prisma } from "@repo/db";
import { jsonOk } from "@/lib/api/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return jsonOk({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: { username: { contains: q, mode: "insensitive" } },
    select: { username: true, avatarUrl: true },
    orderBy: { username: "asc" },
    take: 8,
  });

  return jsonOk(
    { users },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
