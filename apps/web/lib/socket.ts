"use client";

import { io, type Socket } from "socket.io-client";
import { fetchJson } from "@/lib/api/client";

type SocketTokenResponse = {
  token: string;
  expiresAt: number;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

async function fetchSocketToken(): Promise<string> {
  const { token } = await fetchJson<SocketTokenResponse>("/api/auth/socket-token");
  return token;
}

async function connectSocket(): Promise<Socket> {
  const token = await fetchSocketToken();

  const s = io(WS_URL, {
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  s.io.on("reconnect_attempt", () => {
    void fetchSocketToken()
      .then((nextToken) => {
        s.auth = { token: nextToken };
      })
      .catch(() => {
        // Keep existing auth; server may still accept if token is valid.
      });
  });

  s.on("connect_error", (err) => {
    if (err.message !== "UNAUTHORIZED") return;

    void fetchSocketToken()
      .then((nextToken) => {
        s.auth = { token: nextToken };
        if (!s.connected) s.connect();
      })
      .catch(() => {
        // Token refresh failed; socket.io will retry with existing auth.
      });
  });

  await new Promise<void>((resolve, reject) => {
    s.once("connect", () => resolve());
    s.once("connect_error", (err) => reject(err));
    s.connect();
  });

  return s;
}

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = connectSocket()
    .then((s) => {
      socket = s;
      connectPromise = null;
      return s;
    })
    .catch((err) => {
      connectPromise = null;
      throw err;
    });

  return connectPromise;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectPromise = null;
}
