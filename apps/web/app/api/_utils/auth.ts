import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";

export type AuthContext = {
  userId: string;
  username?: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return null;
  return { userId, username: session?.user?.username };
}

export function withAuth<T>(handler: (ctx: AuthContext) => Promise<T>) {
  return async () => {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return handler(ctx);
  };
}

