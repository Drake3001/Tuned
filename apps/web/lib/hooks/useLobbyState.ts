"use client";

import { useEffect, useRef, useState } from "react";
import type { LobbyState } from "@/lib/mock/lobby-types";
import { channelName, loadLobby } from "@/lib/mock/lobby-store";
import { LobbyDriver } from "@/lib/mock/lobby-orchestrator";
import { requireMockSession, type MockSession } from "@/lib/mock/auth";
import type { RGB } from "@/lib/game/color";

export function useLobbyState(code: string) {
  const [state, setState] = useState<LobbyState | null>(null);
  const [me, setMe] = useState<MockSession | null>(null);
  const driverRef = useRef<LobbyDriver | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = requireMockSession();
    setMe(session);
    const initial = loadLobby(code);
    if (initial) setState(initial);

    const ch = new BroadcastChannel(channelName(code));
    channelRef.current = ch;
    ch.onmessage = (e) => {
      const data = e.data as LobbyState;
      if (data?.code === code) setState(data);
    };

    const broadcast = (next: LobbyState) => {
      setState(next);
      try {
        ch.postMessage(next);
      } catch {
        // ignore disconnected channels
      }
    };
    const driver = new LobbyDriver(code, broadcast);
    driverRef.current = driver;

    return () => {
      driver.dispose();
      ch.close();
    };
  }, [code]);

  const start = () => {
    driverRef.current?.hostStart();
  };

  const submit = (guess: RGB) => {
    if (!me) return;
    driverRef.current?.submitForUser(me.userId, guess);
  };

  return { state, me, start, submit };
}
