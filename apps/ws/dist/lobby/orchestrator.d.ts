import type { Server } from "socket.io";
import type { LobbyState, RGB } from "./types.js";
export type LobbyOrchestratorOptions = {
    code: string;
    io: Server;
    onFinished?: () => void;
};
export declare class LobbyOrchestrator {
    readonly code: string;
    private readonly io;
    private readonly onFinished?;
    private state;
    private lobbyId;
    private currentRoundId;
    private phaseTimer;
    private timers;
    constructor({ code, io, onFinished }: LobbyOrchestratorOptions);
    getState(): LobbyState | null;
    hydrate(): Promise<void>;
    start(hostUserId: string): Promise<void>;
    submit(userId: string, guess: RGB): Promise<void>;
    /** Remove player from waiting lobby (DB + state). */
    removePlayer(userId: string): Promise<void>;
    emitState(state: LobbyState): void;
    private beginRound;
    private recall;
    private scoring;
    private nextRound;
    private persistRoundScores;
    private finalize;
    private schedulePhase;
    private clearPhaseTimer;
    private emitError;
    private roomName;
    dispose(): void;
}
//# sourceMappingURL=orchestrator.d.ts.map