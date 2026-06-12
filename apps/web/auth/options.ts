import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { prisma } from "../../../packages/db/src";
import { parseKeycloakRolesFromSignIn } from "@/lib/auth/roles";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID ?? "",
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET ?? "",
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, account, profile, user }) {
      // On first sign-in with Keycloak, persist user and store our DB userId in the JWT.
      if (account?.provider === "keycloak") {
        token.roles = parseKeycloakRolesFromSignIn(
          profile,
          account.id_token,
          account.access_token,
        );

        const keycloakId =
          account.providerAccountId ?? (typeof (profile as any)?.sub === "string" ? ((profile as any).sub as string) : null);
        if (keycloakId) {
          const username =
            (typeof (profile as any)?.preferred_username === "string" && (profile as any).preferred_username) ||
            user?.name ||
            "Gracz";

          try {
            const dbUser = await prisma.user.upsert({
              where: { keycloakId },
              update: { username },
              create: {
                keycloakId,
                username,
                playerStats: { create: {} },
              },
              select: { id: true, username: true },
            });

            token.keycloakId = keycloakId;
            token.userId = dbUser.id;
            token.username = dbUser.username;
          } catch (error) {
            console.error("Błąd zapisu gracza do bazy:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) session.user.userId = token.userId;
        if (token.username) session.user.username = token.username;
        if (token.keycloakId) session.user.keycloakId = token.keycloakId;
        if (token.roles) session.user.roles = token.roles;
      }
      return session;
    },
  },
};

