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
      orchestrator = new LobbyOrchestrator({
        code: normalized,
        io: this.io,
        onFinished: () => this.dispose(normalized),
      });
      this.orchestrators.set(normalized, orchestrator);
    }
    return orchestrator;
  }

  get(code: string): LobbyOrchestrator | undefined {
    return this.orchestrators.get(code.toUpperCase());
  }

  dispose(code: string): void {
    const normalized = code.toUpperCase();
    const orchestrator = this.orchestrators.get(normalized);
    if (orchestrator) {
      orchestrator.dispose();
      this.orchestrators.delete(normalized);
    }
  }

  /** Dispose orchestrator if no sockets remain in the lobby room. */
  async disposeIfRoomEmpty(io: Server, code: string): Promise<void> {
    const normalized = code.toUpperCase();
    const room = `lobby:${normalized}`;
    const sockets = await io.in(room).fetchSockets();
    if (sockets.length === 0) {
      this.dispose(normalized);
    }
  }
}
