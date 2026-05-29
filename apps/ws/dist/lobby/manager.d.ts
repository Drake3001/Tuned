import type { Server } from "socket.io";
import { LobbyOrchestrator } from "./orchestrator.js";
/**
 * Holds one LobbyOrchestrator per active lobby code.
 */
export declare class LobbyManager {
    private readonly io;
    private readonly orchestrators;
    constructor(io: Server);
    getOrCreate(code: string): LobbyOrchestrator;
    get(code: string): LobbyOrchestrator | undefined;
    dispose(code: string): void;
    /** Dispose orchestrator if no sockets remain in the lobby room. */
    disposeIfRoomEmpty(io: Server, code: string): Promise<void>;
}
//# sourceMappingURL=manager.d.ts.map