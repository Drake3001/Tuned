import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  wsPort: Number(process.env.WS_PORT ?? 3001),
  databaseUrl: requireEnv("DATABASE_URL"),
  socketTokenSecret:
    process.env.SOCKET_TOKEN_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    (() => {
      throw new Error(
        "Missing SOCKET_TOKEN_SECRET (or NEXTAUTH_SECRET/AUTH_SECRET)",
      );
    })(),
};
