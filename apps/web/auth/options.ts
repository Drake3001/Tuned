import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { prisma } from "../../../packages/db/src";

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
    async signIn({ user, account }) {
      if (account?.provider === "keycloak" && account.providerAccountId) {
        try {
          await prisma.user.upsert({
            where: { keycloakId: account.providerAccountId },
            update: { username: user.name ?? "Gracz" },
            create: {
              keycloakId: account.providerAccountId,
              username: user.name ?? "Gracz",
              playerStats: { create: {} },
            },
          });
        } catch (error) {
          console.error("Błąd zapisu gracza do bazy:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "keycloak" && account.providerAccountId) {
        (token as any).keycloakId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) (session.user as any).id = token.sub;
        if ((token as any).keycloakId) (session.user as any).keycloakId = (token as any).keycloakId;
      }
      return session;
    },
  },
};

