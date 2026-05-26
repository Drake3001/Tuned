# Backend Implementation Plan

> Frontend mock w `apps/web/lib/mock/*` symuluje pełen flow. Ten dokument opisuje co backend musi dowieźć, żeby zamienić mock na prawdziwe API. Każdy mock endpoint ma swój odpowiednik w prawdziwym route handlerze — referuj do mock impl jako specyfikacji zachowania.

## Co frontend już ma (gotowe)

- `apps/web/lib/game/color/{ciede2000,space,conversions}.ts` — pure logika, CIEDE2000 zweryfikowana z literaturą Sharma 2005. **Reusable 1:1 w backend.**
- `apps/web/lib/game/scoring.ts` — `scoreColorAccuracy`, `scoreHitSquare`, `deltaEToScorePct`. **Reusable 1:1.**
- `apps/web/lib/game/easy-palette.ts` — `generateSimilarPalette(target, 5)` — 1 target + 4 distractors w ΔE [3, 6]. Backend musi wywoływać tę funkcję w EASY solo + EASY daily.
- Pełen frontend: landing, solo flow (EASY palette + HARD picker), profile, leaderboard, daily, lobby UI z dwoma trybami i dwoma scoring modes.

## Schema bumpy (Prisma migration)

Partner schema w `packages/db/prisma/schema.prisma` jest w 95% gotowy. Brakuje:

- `lobby_round_settings`: dodać `rounds_total Int @default(5)`
- `lobby_br_settings`: dodać `lives_initial Int @default(3)`
- `round_scores`: dodać `is_hit Boolean?` (nullable bo COLOR_ACCURACY mode tego nie używa) i `submitted_at_ms BigInt?` (Unix ms dla SPEED tiebreak; `submittedAt: DateTime` partnera można zostawić)
- Opcjonalnie: indeks `lobby_players(user_id, lobby_id)` jeśli będziemy często szukać aktywnych lobby usera.

Migracja: `npm run db:migrate:dev -- --name add_scoring_modes_fields`.

## Route handlers (`apps/web/app/api/`)

Wszystkie używają next-auth v4 (już zainstalowany). Nazywam helpers `withAuth` (401 jeśli brak) i `withOptionalAuth` (przekazuje `session?` do handlera) — wzór z `tunedgg` repo, ale przepisać pod v4.

### Auth

```
GET/POST /api/auth/[...nextauth]         # next-auth handler
GET     /api/auth/socket-token           # withAuth → short-lived JWT (15m) { userId, username }
```

Konfiguracja Keycloak provider w `apps/web/auth/options.ts`:
- issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KC_REALM}` (z `.env` — patrz Keycloak realm niżej)
- clientId: `tuned-app`, clientSecret z env
- callback `jwt`: woła `upsertFromKeycloak({ keycloakId: profile.sub, username: profile.preferred_username, avatarUrl: profile.picture ?? null })` i wpisuje `token.userId` z naszego UUID, `token.username`
- callback `session`: kopiuje `userId`, `username` na `session`

### Solo

```
POST /api/game/solo/start
  body  { difficulty: "EASY" | "HARD" }
  auth  withOptionalAuth
  out   { sessionId, difficulty, targets: RGB[5] }
  notes EASY: 1 random RGB + (palety distractorów generowane na frontendzie z generateSimilarPalette,
        backend zwraca tylko 5 RGB jako "kolejne targety" tak jak w HARD).
        Tworzy GameSession{ mode: SOLO, difficulty, userId?, targets }.

POST /api/game/solo/submit
  body  { sessionId: UUID, guesses: RGB[5] }
  auth  withOptionalAuth
  rules sessionId istnieje, mode=SOLO, finishedAt is null, Date.now() - startedAt < 10min
  out   { finalScore, avgDeltaE, perAttempt: Attempt[5] }
  side  transactional: ColorAttempt × 5 insert + GameSession.{finalScore, avgDeltaE, finishedAt}
        update + jeśli userId → stats.recomputeForUser(userId)
  errs  404 not found, 409 already submitted, 410 expired, 400 bad payload
```

Mock referencja: `apps/web/lib/mock/api.ts::startSolo / submitSolo`.

### Stats

```
GET /api/stats/me                        # withAuth → { user, stats, recentSessions, dailyAggregates }
GET /api/stats/[username]                # public, cache 30s → { user (no keycloakId), stats }
```

Mock referencja: `mockApi.getProfile`.

### Leaderboard

```
GET /api/leaderboard/all-time?mode=solo  # top 100 wg player_stats.bestSolo desc, cache 60s
GET /api/leaderboard/all-time?mode=br    # top 100 wg player_stats.brWins desc
GET /api/leaderboard/today               # top 100 dailyAttempt finalScore desc
```

Mock referencja: `mockApi.getLeaderboard`.

### Daily

```
GET /api/daily/today
  auth  withOptionalAuth
  out   { day: "YYYY-MM-DD", targets: RGB[5] (tylko dla zalogowanych), alreadyPlayed: boolean }
  notes Generuj targets przez deterministyczny mulberry32 z seed = Number(YYYYMMDD).
        Jeśli nie ma DailyChallenge dla dziś — upsert z targets + seed.

POST /api/daily/submit
  body  { guesses: RGB[5] }
  auth  withAuth
  rules unique (userId, day); jedna próba per dzień (409 jeśli istnieje)
  out   { finalScore, avgDeltaE, perAttempt: Attempt[5] }
  side  DailyAttempt.create(...) + stats.recomputeForUser(userId)
```

Mock referencja: `mockApi.getDailyToday / submitDaily`. Deterministic seed w mock jest w `apps/web/lib/mock/api.ts::todayTargets`.

### Lobby

```
POST /api/lobby/create
  body  {
          mode: "BATTLE_ROYALE" | "ROUND_BASED",
          scoringMode: "COLOR_ACCURACY" | "SPEED",
          livesInitial?: number,   # tylko BR (1..5)
          roundsTotal?: number,    # tylko round-based (1..20)
          maxPlayers?: number,     # 2..8
        }
  auth  withAuth
  rules user nie ma aktywnego lobby (409); generuj 6-znakowy code z alfabetu
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" (bez 0/O/I/1/L); retry max 5×
  out   { lobby: { code, status } }
  side  Lobby + LobbyRoundSettings/LobbyBrSettings + LobbyPlayer(host) w transakcji

POST /api/lobby/[code]/join
  auth  withAuth
  rules status=WAITING, count < maxPlayers, user nie w lobby (idempotent)
  out   { lobby: { code, status } }
```

Mock referencja: `apps/web/lib/mock/install.ts` (przechwyt `POST /api/lobby/create`) + `apps/web/lib/mock/lobby-store.ts::createLobby`.

### Healthcheck

```
GET /api/healthz                         # { status, db, uptime }, 200 ok / 503 degraded
```

## Socket.IO (`apps/web/server.ts` custom server)

Mock referencja: `apps/web/lib/hooks/useLobbyState.ts` + `apps/web/lib/mock/lobby-orchestrator.ts`. Realtime kontrakt 1:1, tylko transport zmienia się z `BroadcastChannel` na Socket.IO.

### Handshake
- Middleware: `socket.handshake.auth.token` → `jose.jwtVerify(token, secret=AUTH_SECRET)` → `socket.data.userId, socket.data.username`. Reject jeśli invalid.

### Eventy

ClientToServer:
- `lobby:join(code, ack)` — server: weryfikuje że user jest w `LobbyPlayer`, joinuje socket do roomu `lobby:<code>`, jeśli orchestrator dla tego lobby nie istnieje to tworzy, emituje pełen `lobby:state` do całego roomu, ack OK.
- `lobby:leave(code)` — usuwa z roomu. W trybie WAITING: usuwa też z LobbyPlayer + emituje update; w trybie IN_PROGRESS: oznacza disconnected (state zachowany dla reconnectu).
- `host:start(code)` — tylko jeśli `socket.data.userId === lobby.hostUserId` i status === WAITING + ≥ 2 graczy. Wywołuje `orchestrator.start(code)`.
- `player:submit(code, guess)` — dispatcher do `orchestrator.submit(code, userId, guess)`.

ServerToClient:
- `lobby:state(state: LobbyState)` — pełen snapshot. Klient renderuje cokolwiek z tego dostaje.
- `round:state(state: LobbyState)` — alias dla compatibility (mock tylko emituje `lobby:state`, ale można równoległy event jeśli się przyda).
- `lobby:error({ code, message })` — błędy biznesowe (np. attempt to start poniżej minimum graczy).

### Orchestrator per-lobby

Klasa `LobbyOrchestrator` (jeden instance per active lobby, w `Map<code, LobbyOrchestrator>`):
- Hold: `state: LobbyState`, `timers: Set<NodeJS.Timeout>`.
- `start()`: jeśli status WAITING → pick random target → status MEMORIZE, currentRound=1, `setTimeout(MEMORIZE_MS, () => recall())`.
- `recall()`: status MEMORIZE → RECALL, `setTimeout(RECALL_MS, () => scoring())`. Każdy `player:submit` od żywego gracza odkłada się do `submissions[]`; jeśli wszyscy żyjący już submitowali — wcześnie `scoring()`.
- `scoring()`: oblicz `RoundScore[]` z `state.submissions` + `state.currentTarget`:
  - jeśli `scoringMode === "SPEED"` → `scoreHitSquare(target, guess).hit`, `points = hit ? 1 : 0`
  - jeśli `scoringMode === "COLOR_ACCURACY"` → `points = deltaEToScorePct(deltaE(target, guess))`
  - Brak submission → `deltaE = Infinity`, `hit = false`, `points = 0`
  - BR: znajdź worst (max ΔE, tiebreak max submittedAtMs) → `player.lives -= 1`. Jeśli `lives === 0` → `eliminatedRound = currentRound`.
- Decyzja end-game:
  - BR: survivors.length ≤ 1 → status FINISHED, winnerUserId = ostatni survivor.
  - ROUND_BASED: `currentRound >= roundsTotal` → status FINISHED, winnerUserId = argmax(points).
- Jeśli nie endgame → status SCORING, `setTimeout(SCORING_MS, () => nextRound())`.
- `nextRound()`: ++round, pick new target, status MEMORIZE → loop.
- Po `END_LOBBY`:
  - `lobby.status = FINISHED`, `closedAt = now`
  - `lobby_players.final_rank` per player (BR: 1 = winner, kolejni wg `eliminatedRound` malejąco; ROUND_BASED: wg `points` malejąco)
  - dla każdego gracza: `stats.recomputeForUser(userId)`

Timings z mock (możesz tweakować):
- `MEMORIZE_MS = 3000`
- `RECALL_MS = 12000`
- `SCORING_MS = 4000`

Reconnect: gdy klient ponownie wejdzie na `/lobby/[code]` i wyśle `lobby:join`, server zwraca pełen snapshot `lobby:state` — klient z `useLobbyState` to już ogarnia.

## Repositories (`packages/db/src/repositories/`)

Wzór z `apps/web/lib/mock/api.ts`. Wystarczy ten zestaw:

- `users.{findByKeycloakId, findByUsername, createFromKeycloak, upsertFromKeycloak, getPublicProfile}`
- `sessions.{createSoloSession, findById, submitAttempts, getRecentByUser}`
- `stats.{getByUser, recomputeForUser, getRecentSessionsByUser, getDailyAggregates}` — recompute idempotent w transakcji
- `lobbies.{create, findByCode (include players + settings), addPlayer, removePlayer, updateStatus, findActiveForUser, finalize(lobbyId, finalRanksByUser)}`
- `daily.{upsert, getByDay, attemptForUser, recordAttempt, leaderboardForDay}`

Każda metoda modyfikująca więcej niż 1 tabelę → `prisma.$transaction`.

## Seed (`packages/db/seed.ts`)

5 userów: `malik`, `retinaboi`, `pixelpicker`, `kawai_kosmita`, `tonalna`. Stabilne UUID-y żeby URL-e były stałe. 5–10 solo sessions per user z różnymi trudnościami. 1 finished BR lobby code `DEMO42`. DailyChallenge dla dziś.

## Keycloak realm

Plik `tuned_realm-realm.json` w repo (jeśli jeszcze nie dorzucony — partner ma go lokalnie). Realm = `tuned_realm`, client = `tuned-app`, sekret w `.env`. Dodać 5 seed userów do `users[]` JSON-merge z credentialem `{type:"password", value:"tuned123", temporary:false}` — Keycloak zhashuje przy imporcie.

**Update `.env.example`:** `KC_REALM=tuned` → `KC_REALM=tuned_realm`.

## Wymagane env vars

```
KC_REALM=tuned_realm
KEYCLOAK_URL=http://localhost:8081
AUTH_KEYCLOAK_ID=tuned-app
AUTH_KEYCLOAK_SECRET=YfymvtZu9DuPQbeNGI453J7yaLx5IT9F   # dev only — rotate w prod
AUTH_KEYCLOAK_ISSUER=http://localhost:8081/realms/tuned_realm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
AUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgresql://tuned:tuned@localhost:5432/tuned?schema=public
```

## Order of work (sugerowany dla BE)

1. `feat/db-schema-scoring-fields` — migracja Prisma z dodatkowymi polami.
2. `feat/db-repositories` — wszystkie repositories.
3. `feat/auth-keycloak-realm` — finalizacja realm-export z 5 userami + update `.env.example`.
4. `feat/auth-nextauth` — Auth.js v4 + Keycloak provider + `withAuth`/`withOptionalAuth`.
5. `feat/api-solo` — `/api/game/solo/{start,submit}`.
6. `feat/api-stats` — `/api/stats/{me,[username]}`.
7. `feat/api-daily` — generator + endpoints.
8. `feat/api-leaderboard`.
9. `feat/api-lobby` — `/api/lobby/create` + `/[code]/join`.
10. `feat/realtime-socket-server` — Socket.IO w custom `server.ts`.
11. `feat/realtime-lobby-orchestrator` — state machine + handlers.
12. `feat/realtime-finalize` — finalize lobby + stats recompute przy END.
13. `chore/db-seed` — seed dev data.
14. `chore/api-healthz`.
15. `chore/ci-pipeline` — GH Actions.

Każdy task = osobny PR do `develop`. Po komplecie → merge `develop` → `master` z tagiem `v0.2.0` (FE-mock było v0.1.0).

## Jak zamienić mock na real (po stronie FE)

Gdy backend dostarczy endpointy, podmienić w `apps/web/`:
- `lib/hooks/useSoloFlow.ts` — `mockApi.startSolo` → `fetch("/api/game/solo/start", ...)`
- `lib/hooks/useLobbyState.ts` — `BroadcastChannel + LobbyDriver` → Socket.IO klient (`socket.io-client`) + handshake przez `/api/auth/socket-token`
- `app/u/[username]/page.tsx`, `app/leaderboard/page.tsx`, `app/daily/page.tsx` — `mockApi.*` → real fetch
- `components/lobby/CreateLobbyModal.tsx` — już woła `/api/lobby/create` (mock przechwytuje), więc tylko usunąć install of mock fetch shim w `app/layout.tsx::MockBootstrap`.
