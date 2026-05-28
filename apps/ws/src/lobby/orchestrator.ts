import type { Server } from "socket.io";
import type { LobbyState, RGB } from "./types.js";

export type LobbyOrchestratorOptions = {
  code: string;
  io: Server;
};

/**
 * Per-lobby state machine. Full game loop (timers, scoring, persistence)
 * will be implemented in a follow-up task.
 */
export class LobbyOrchestrator {
  readonly code: string;
  private readonly io: Server;
  private state: LobbyState | null = null;
  private timers = new Set<NodeJS.Timeout>();

  constructor({ code, io }: LobbyOrchestratorOptions) {
    this.code = code;
    this.io = io;
  }

  getState(): LobbyState | null {
    return this.state;
  }

  /** Load or refresh lobby snapshot from DB (stub). */
  async hydrate(_initialState?: LobbyState): Promise<void> {
    // TODO: load lobby + players from Postgres and build LobbyState
  }

  /** Host starts the match (stub). */
  async start(_hostUserId: string): Promise<void> {
    // TODO: validate host, min players, transition to MEMORIZE
    this.emitError("NOT_IMPLEMENTED", "Lobby start is not implemented yet");
  }

  /** Player submits a color guess for the current round (stub). */
  async submit(_userId: string, _guess: RGB): Promise<void> {
    // TODO: record submission, early scoring if all alive submitted
    this.emitError("NOT_IMPLEMENTED", "Lobby submit is not implemented yet");
  }

  /** Broadcast full lobby snapshot to the room. */
  emitState(state: LobbyState): void {
    this.state = state;
    this.io.to(this.roomName()).emit("lobby:state", state);
  }

  private emitError(code: string, message: string): void {
    this.io.to(this.roomName()).emit("lobby:error", { code, message });
  }

  private roomName(): string {
    return `lobby:${this.code}`;
  }

  dispose(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.state = null;
  }
}
