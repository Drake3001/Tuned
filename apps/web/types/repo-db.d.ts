import type { PrismaClient } from "../../../packages/db/generated/prisma/client";

declare module "@repo/db" {
  export const prisma: PrismaClient;
}

