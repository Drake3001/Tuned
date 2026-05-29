import type { Server } from "socket.io";
import { verifySocketToken } from "../auth/verifySocketToken.js";

declare module "socket.io" {
  interface SocketData {
    userId: string;
    username?: string;
  }
}

export function registerAuthMiddleware(io: Server): void {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        return next(new Error("UNAUTHORIZED"));
      }

      const payload = await verifySocketToken(token);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });
}
