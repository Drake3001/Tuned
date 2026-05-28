"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { Socket } from "socket.io-client";
import type { LobbyState } from "@/lib/mock/lobby-types";
import type { RGB } from "@/lib/game/color";
import { fetchJson } from "@/lib/api/client";
import { mapApiLobbyToState, type ApiLobby } from "@/lib/api/lobby-mapper";
import { getSocket } from "@/lib/socket";

type Me = {
  userId: string;
  username: string;
};

type LobbyErrorPayload = {
  code: string;
  message: string;
};

function joinLobbyRoom(socket: Socket, code: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.emit("lobby:join", code, (result: { ok?: boolean }) => {
      if (result?.ok) {
        resolve();
        return;
      }
      reject(new Error("Failed to join lobby room"));
    });
  });
}

export function useLobbyState(code: string) {
  const { data: session, status } = useSession();
  const [state, setState] = useState<LobbyState | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pendingWsSync, setPendingWsSync] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const statusRef = useRef<LobbyState["status"] | null>(null);
  const normalizedCode = code.toUpperCase();

  const loadLobby = useCallback(async () => {
    await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}/join`, {
      method: "POST",
    });

    const { lobby } = await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}`);
    setState(mapApiLobbyToState(lobby));
    setPendingWsSync(lobby.status === "IN_GAME");
  }, [normalizedCode]);

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.userId;
    const username = session?.user?.username;
    if (!userId || !username) {
      setError("Not authenticated");
      return;
    }

    setMe({ userId, username });
    setError(null);
    setErrorCode(null);

    let cancelled = false;
    let initialJoinDone = false;
    let lobbyErrorReceived = false;

    const onState = (next: LobbyState) => {
      if (cancelled) return;
      statusRef.current = next.status;
      setState(next);
      setPendingWsSync(false);
    };

    const onLobbyError = (payload: LobbyErrorPayload) => {
      if (cancelled) return;
      lobbyErrorReceived = true;
      setError(payload.message);
      setErrorCode(payload.code);
      setPendingWsSync(false);
    };

    const onConnect = () => {
      if (cancelled || !initialJoinDone) return;
      const socket = socketRef.current;
      if (!socket) return;
      void joinLobbyRoom(socket, normalizedCode).catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to reconnect to lobby");
        }
      });
    };

    void (async () => {
      try {
        await loadLobby();
        if (cancelled) return;

        const socket = await getSocket();
        if (cancelled) return;

        socketRef.current = socket;
        socket.on("lobby:state", onState);
        socket.on("lobby:error", onLobbyError);
        socket.on("connect", onConnect);

        await joinLobbyRoom(socket, normalizedCode);
        initialJoinDone = true;
      } catch (e: unknown) {
        if (!cancelled && !lobbyErrorReceived) {
          setError(e instanceof Error ? e.message : "Failed to connect to lobby");
          setState(null);
          setPendingWsSync(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.off("lobby:state", onState);
        socket.off("lobby:error", onLobbyError);
        socket.off("connect", onConnect);
        if (statusRef.current === "WAITING" || statusRef.current === null) {
          socket.emit("lobby:leave", normalizedCode);
        }
      }
      socketRef.current = null;
    };
  }, [loadLobby, normalizedCode, session?.user?.userId, session?.user?.username, status]);

  const start = useCallback(() => {
    socketRef.current?.emit("host:start", normalizedCode);
  }, [normalizedCode]);

  const submit = useCallback(
    (guess: RGB) => {
      socketRef.current?.emit("player:submit", normalizedCode, guess);
    },
    [normalizedCode],
  );

  return { state, me, error, errorCode, pendingWsSync, start, submit, reload: loadLobby };
}
