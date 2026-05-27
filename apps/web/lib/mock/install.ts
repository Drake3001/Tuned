"use client";

import { createLobby } from "./lobby-store";
import type { LobbyConfig } from "./lobby-types";

let installed = false;

export function installMockFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    if (url.endsWith("/api/lobby/create") && init?.method === "POST") {
      try {
        const body =
          typeof init.body === "string" ? (JSON.parse(init.body) as LobbyConfig) : (init.body as unknown as LobbyConfig);
        const lobby = createLobby(body);
        return jsonResponse({ lobby: { code: lobby.code } });
      } catch (e) {
        return jsonResponse({ error: String(e) }, 500);
      }
    }
    return original(input, init);
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
