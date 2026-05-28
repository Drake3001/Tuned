/** RGB tuple [r, g, b] with values 0..255 */
export type RGB = readonly [number, number, number];
export type Mode = "BATTLE_ROYALE" | "ROUND_BASED";
export type ScoringMode = "COLOR_ACCURACY" | "SPEED";
export type Status = "WAITING" | "MEMORIZE" | "RECALL" | "SCORING" | "FINISHED";
export type LobbyPlayer = {
    userId: string;
    username: string;
    isBot: boolean;
    lives: number;
    points: number;
    eliminatedRound: number | null;
};
export type RoundScore = {
    userId: string;
    guess: RGB | null;
    deltaE: number;
    hit: boolean;
    submittedAtMs: number | null;
    pointsAwarded: number;
};
export type LobbyState = {
    code: string;
    hostUserId: string;
    mode: Mode;
    scoringMode: ScoringMode;
    livesInitial: number;
    roundsTotal: number;
    maxPlayers: number;
    status: Status;
    players: LobbyPlayer[];
    currentRound: number;
    currentTarget: RGB | null;
    phaseEndsAt: number | null;
    submissions: Array<{
        userId: string;
        guess: RGB;
        submittedAtMs: number;
    }>;
    lastRoundScores: RoundScore[];
    winnerUserId: string | null;
};
export type LobbyError = {
    code: string;
    message: string;
};
//# sourceMappingURL=types.d.ts.map