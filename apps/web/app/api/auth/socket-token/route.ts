import { SignJWT } from "jose";
import { withAuth } from "../../_utils/auth";

export const runtime = "nodejs";

function getSocketTokenSecret() {
  const secret = process.env.SOCKET_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing SOCKET_TOKEN_SECRET (or NEXTAUTH_SECRET/AUTH_SECRET)");
  return new TextEncoder().encode(secret);
}

export const GET = withAuth(async (_req, { userId, username }) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + 15 * 60;

  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expSeconds)
    .sign(getSocketTokenSecret());

  return Response.json({ token, expiresAt: expSeconds });
});
