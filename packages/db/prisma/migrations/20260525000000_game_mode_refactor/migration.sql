-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlayContext" AS ENUM ('SOLO', 'MULTIPLAYER');

-- CreateEnum
CREATE TYPE "SoloDifficulty" AS ENUM ('EASY', 'HARD');

-- CreateEnum
CREATE TYPE "MultiplayerGameMode" AS ENUM ('ROUND_BASED', 'BATTLE_ROYALE');

-- CreateEnum
CREATE TYPE "ScoringMode" AS ENUM ('COLOR_ACCURACY', 'SPEED');

-- CreateEnum
CREATE TYPE "LobbyStatus" AS ENUM ('WAITING', 'IN_GAME', 'FINISHED');

-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('MEMORIZE', 'RECALL', 'RESULT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "keycloakId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "userId" TEXT NOT NULL,
    "soloPlays" INTEGER NOT NULL DEFAULT 0,
    "multiplayerPlays" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "streakUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lobbyId" TEXT,
    "context" "PlayContext" NOT NULL,
    "soloDifficulty" "SoloDifficulty",
    "finalScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "targetRgb" INTEGER[],
    "guessRgb" INTEGER[],
    "deltaE" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColorAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "status" "LobbyStatus" NOT NULL DEFAULT 'WAITING',
    "multiplayerMode" "MultiplayerGameMode" NOT NULL,
    "scoringMode" "ScoringMode" NOT NULL DEFAULT 'COLOR_ACCURACY',
    "answerTimeLimitSec" INTEGER,
    "maxPlayers" INTEGER NOT NULL DEFAULT 8,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyRoundSettings" (
    "lobbyId" TEXT NOT NULL,
    "totalRounds" INTEGER NOT NULL,

    CONSTRAINT "LobbyRoundSettings_pkey" PRIMARY KEY ("lobbyId")
);

-- CreateTable
CREATE TABLE "LobbyBrSettings" (
    "lobbyId" TEXT NOT NULL,
    "startingLives" INTEGER NOT NULL,

    CONSTRAINT "LobbyBrSettings_pkey" PRIMARY KEY ("lobbyId")
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "lobbyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lives" INTEGER,
    "eliminatedRound" INTEGER,
    "finalRank" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyPlayer_pkey" PRIMARY KEY ("lobbyId","userId")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "targetColors" JSONB NOT NULL,
    "phase" "RoundPhase" NOT NULL DEFAULT 'MEMORIZE',

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundScore" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deltaE" DOUBLE PRECISION,
    "responseTimeMs" INTEGER,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "RoundScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "day" DATE NOT NULL,
    "targetColors" JSONB NOT NULL,
    "soloDifficulty" "SoloDifficulty" NOT NULL DEFAULT 'HARD',
    "seed" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "DailyAttempt" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "sessionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAttempt_pkey" PRIMARY KEY ("userId","day")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_keycloakId_key" ON "User"("keycloakId");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_code_key" ON "Lobby"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoundScore_roundId_userId_key" ON "RoundScore"("roundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttempt_sessionId_key" ON "DailyAttempt"("sessionId");

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorAttempt" ADD CONSTRAINT "ColorAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyRoundSettings" ADD CONSTRAINT "LobbyRoundSettings_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyBrSettings" ADD CONSTRAINT "LobbyBrSettings_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundScore" ADD CONSTRAINT "RoundScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_day_fkey" FOREIGN KEY ("day") REFERENCES "DailyChallenge"("day") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
