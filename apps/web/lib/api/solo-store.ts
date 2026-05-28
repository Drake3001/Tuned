import type { RGB } from "@/lib/game/color";

export type SoloSessionMeta = {
  targets: RGB[];
  difficulty: "EASY" | "HARD";
  startedAt: number;
  userId?: string;
  persisted: boolean;
};

const SOLO_TARGET_STORE = new Map<string, SoloSessionMeta>();

const SOLO_TTL_MS = 10 * 60 * 1000;

export function putSoloSession(sessionId: string, meta: SoloSessionMeta) {
  SOLO_TARGET_STORE.set(sessionId, meta);
}

export function getSoloSession(sessionId: string): SoloSessionMeta | null {
  const meta = SOLO_TARGET_STORE.get(sessionId);
  if (!meta) return null;
  if (Date.now() - meta.startedAt > SOLO_TTL_MS) {
    SOLO_TARGET_STORE.delete(sessionId);
    return null;
  }
  return meta;
}

export function deleteSoloSession(sessionId: string) {
  SOLO_TARGET_STORE.delete(sessionId);
}
