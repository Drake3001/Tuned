import { LobbyOrchestrator } from "./orchestrator.js";
/**
 * Holds one LobbyOrchestrator per active lobby code.
 */
export class LobbyManager {
    io;
    orchestrators = new Map();
    constructor(io) {
        this.io = io;
    }
    getOrCreate(code) {
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
    get(code) {
        return this.orchestrators.get(code.toUpperCase());
    }
    dispose(code) {
        const normalized = code.toUpperCase();
        const orchestrator = this.orchestrators.get(normalized);
        if (orchestrator) {
            orchestrator.dispose();
            this.orchestrators.delete(normalized);
        }
    }
    /** Dispose orchestrator if no sockets remain in the lobby room. */
    async disposeIfRoomEmpty(io, code) {
        const normalized = code.toUpperCase();
        const room = `lobby:${normalized}`;
        const sockets = await io.in(room).fetchSockets();
        if (sockets.length === 0) {
            this.dispose(normalized);
        }
    }
}
//# sourceMappingURL=manager.js.map