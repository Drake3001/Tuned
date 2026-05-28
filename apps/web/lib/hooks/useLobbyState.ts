"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { LobbyState } from "@/lib/mock/lobby-types";
import type { RGB } from "@/lib/game/color";
import { fetchJson } from "@/lib/api/client";
import { mapApiLobbyToState, type ApiLobby } from "@/lib/api/lobby-mapper";

type Me = {
  userId: string;
  username: string;
};

export function useLobbyState(code: string) {
  const { data: session, status } = useSession();
  const [state, setState] = useState<LobbyState | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLobby = useCallback(async () => {
    const normalizedCode = code.toUpperCase();

    await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}/join`, {
      method: "POST",
    });

    const { lobby } = await fetchJson<{ lobby: ApiLobby }>(`/api/lobby/${normalizedCode}`);
    setState(mapApiLobbyToState(lobby));
  }, [code]);

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

    loadLobby().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to load lobby");
      setState(null);
    });
  }, [code, loadLobby, session?.user?.userId, session?.user?.username, status]);

  const start = () => {
    console.warn("Lobby start will be handled by websocket server");
  };

  const submit = (_guess: RGB) => {
    console.warn("Lobby submit will be handled by websocket server");
  };

  return { state, me, error, start, submit, reload: loadLobby };
}
