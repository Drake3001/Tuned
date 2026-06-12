import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";

export type AuthContext = {
  userId: string;
  username?: string;
  roles?: string[];
};

export type RouteContext = {
  params: Promise<Record<string, string>>;
};

type AuthedHandler = (
  req: Request,
  ctx: AuthContext,
  routeContext: RouteContext,
) => Promise<Response>;

type OptionalAuthedHandler = (
  req: Request,
  ctx: AuthContext | null,
  routeContext: RouteContext,
) => Promise<Response>;

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return null;
  return {
    userId,
    username: session?.user?.username,
    roles: session?.user?.roles,
  };
}

export function withAuth(handler: AuthedHandler) {
  return async (req: Request, routeContext: RouteContext) => {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return handler(req, ctx, routeContext);
  };
}

export function withOptionalAuth(handler: OptionalAuthedHandler) {
  return async (req: Request, routeContext: RouteContext) => {
    const ctx = await getAuthContext();
    return handler(req, ctx, routeContext);
  };
}

export function withRole(role: string, handler: AuthedHandler) {
  return withAuth(async (req, ctx, routeContext) => {
    if (!ctx.roles?.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, ctx, routeContext);
  });
}
