"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/client";

export type ActiveLobby = {
  code: string;
  status: "WAITING" | "IN_GAME";
  mode: string;
  currentRound: number;
};

export function useActiveLobby() {
  const { status } = useSession();
  const [activeLobby, setActiveLobby] = useState<ActiveLobby | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    if (status !== "authenticated") {
      setActiveLobby(null);
      setLoading(false);
      return;
    }

    try {
      const { lobby } = await fetchJson<{ lobby: ActiveLobby | null }>("/api/lobby/active");
      setActiveLobby(lobby);
    } catch {
      setActiveLobby(null);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    setLoading(status === "loading");
    void fetchActive();
  }, [fetchActive, status]);

  useEffect(() => {
    const onFocus = () => {
      void fetchActive();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchActive]);

  return { activeLobby, loading };
}
