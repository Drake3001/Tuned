import type { Server } from "socket.io";
import { LobbyOrchestrator } from "./orchestrator.js";

/**
 * Holds one LobbyOrchestrator per active lobby code.
 */
export class LobbyManager {
  private readonly orchestrators = new Map<string, LobbyOrchestrator>();

  constructor(private readonly io: Server) {}

  getOrCreate(code: string): LobbyOrchestrator {
    const normalized = code.toUpperCase();
    let orchestrator = this.orchestrators.get(normalized);
    if (!orchestrator) {
      orchestrator = new LobbyOrchestrator({ code: normalized, io: this.io });
      this.orchestrators.set(normalized, orchestrator);
    }
    return orchestrator;
  }

  get(code: string): LobbyOrchestrator | undefined {
    return this.orchestrators.get(code.toUpperCase());
  }

  /** Remove orchestrator when lobby ends or room is empty (stub). */
  dispose(code: string): void {
    const normalized = code.toUpperCase();
    const orchestrator = this.orchestrators.get(normalized);
    if (orchestrator) {
      orchestrator.dispose();
      this.orchestrators.delete(normalized);
    }
  }
}
