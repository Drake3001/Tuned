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

export function useLobbyState(code: string) {
  const { data: session, status } = useSession();
  const [state, setState] = useState<LobbyState | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const normalizedCode = code.toUpperCase();

  const loadLobby = useCallback(async () => {
    await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}/join`, {
      method: "POST",
    });

    const { lobby } = await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}`);
    setState(mapApiLobbyToState(lobby));
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

    let cancelled = false;

    const onState = (next: LobbyState) => {
      if (!cancelled) setState(next);
    };

    const onLobbyError = (payload: LobbyErrorPayload) => {
      if (!cancelled) setError(payload.message);
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

        await new Promise<void>((resolve, reject) => {
          socket.emit("lobby:join", normalizedCode, (result: { ok?: boolean }) => {
            if (result?.ok) {
              resolve();
              return;
            }
            reject(new Error("Failed to join lobby room"));
          });
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to connect to lobby");
          setState(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.off("lobby:state", onState);
        socket.off("lobby:error", onLobbyError);
        socket.emit("lobby:leave", normalizedCode);
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

  return { state, me, error, start, submit, reload: loadLobby };
}
