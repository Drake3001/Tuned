import type { Server, Socket } from "socket.io";
import { prisma } from "@repo/db";
import { LobbyManager } from "../lobby/manager.js";
import type { RGB } from "../lobby/types.js";

function lobbyRoom(code: string): string {
  return `lobby:${code.toUpperCase()}`;
}

function emitLobbyError(socket: Socket, code: string, message: string): void {
  socket.emit("lobby:error", { code, message });
}

async function assertLobbyMember(
  code: string,
  userId: string,
): Promise<{ isMember: boolean; dbStatus: string | null }> {
  const lobby = await prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      status: true,
      players: {
        where: { userId },
        select: { userId: true },
      },
    },
  });

  if (lobby == null) {
    return { isMember: false, dbStatus: null };
  }

  return {
    isMember: lobby.players.length > 0,
    dbStatus: lobby.status,
  };
}

export function registerHandlers(io: Server, lobbyManager: LobbyManager): void {
  io.on("connection", (socket: Socket) => {
    console.log(`[ws] connected userId=${socket.data.userId}`);

    socket.on("lobby:join", async (code: unknown, ack?: (result: unknown) => void) => {
      if (typeof code !== "string" || code.length === 0) {
        emitLobbyError(socket, "INVALID_CODE", "Lobby code is required");
        ack?.({ ok: false });
        return;
      }

      const normalized = code.toUpperCase();
      const { isMember, dbStatus } = await assertLobbyMember(normalized, socket.data.userId);
      if (!isMember) {
        emitLobbyError(socket, "FORBIDDEN", "You are not a member of this lobby");
        ack?.({ ok: false });
        return;
      }

      const orchestrator = lobbyManager.getOrCreate(normalized);
      await orchestrator.hydrate();

      if (dbStatus === "IN_GAME" && !orchestrator.isLive()) {
        emitLobbyError(
          socket,
          "LOBBY_NOT_LIVE",
          "This match is no longer live. Ask your friends for a new lobby.",
        );
        ack?.({ ok: false });
        return;
      }

      await socket.join(lobbyRoom(normalized));

      const state = orchestrator.getState();
      if (state) {
        orchestrator.emitState(state);
      }

      ack?.({ ok: true });
    });

    socket.on("lobby:leave", async (code: unknown) => {
      if (typeof code !== "string" || code.length === 0) return;

      const normalized = code.toUpperCase();
      await socket.leave(lobbyRoom(normalized));

      const orchestrator = lobbyManager.get(normalized);
      const state = orchestrator?.getState();

      if (orchestrator && state?.status === "WAITING") {
        await orchestrator.removePlayer(socket.data.userId);
      }

      await lobbyManager.disposeIfRoomEmpty(io, normalized);
    });

    socket.on("host:start", async (code: unknown) => {
      if (typeof code !== "string" || code.length === 0) {
        emitLobbyError(socket, "INVALID_CODE", "Lobby code is required");
        return;
      }

      const normalized = code.toUpperCase();
      const orchestrator = lobbyManager.getOrCreate(normalized);
      if (!orchestrator.getState()) {
        await orchestrator.hydrate();
      }
      await orchestrator.start(socket.data.userId);
    });

    socket.on("player:submit", async (code: unknown, guess: unknown) => {
      if (typeof code !== "string" || code.length === 0) {
        emitLobbyError(socket, "INVALID_CODE", "Lobby code is required");
        return;
      }

      if (!isValidRgb(guess)) {
        emitLobbyError(socket, "INVALID_GUESS", "Guess must be an RGB tuple");
        return;
      }

      const normalized = code.toUpperCase();
      const orchestrator = lobbyManager.getOrCreate(normalized);
      await orchestrator.submit(socket.data.userId, guess);
    });

    socket.on("disconnect", async () => {
      console.log(`[ws] disconnected userId=${socket.data.userId}`);
      const rooms = [...socket.rooms].filter((r) => r.startsWith("lobby:"));
      for (const room of rooms) {
        const code = room.replace("lobby:", "");
        await lobbyManager.disposeIfRoomEmpty(io, code);
      }
    });
  });
}

function isValidRgb(value: unknown): value is RGB {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 255)
  );
}
