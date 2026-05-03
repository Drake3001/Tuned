tuned-gg/
├── .github/
│   └── workflows/          # Pipeline CI (GitHub Actions) - Lint, Type-check, testy
├── apps/
│   ├── web/                # Warstwa klienta (React) i warstwa serwerowa (Next.js App Router, Route Handlers)
│   └── ws-server/          # Serwer czasu rzeczywistego (WebSocket) w Node.js
├── packages/
│   ├── shared/             # Wspólne typy TypeScript, stałe i czyste funkcje (np. logika color matching, scoring, implementacja CIEDE2000)
│   └── db/                 # Schemat bazy danych i pliki migracji
├── docker-compose.yml      # Infrastruktura do developmentu lokalnego (PostgreSQL, Keycloak)
├── package.json            # Główny plik zarządzający całym monorepo
└── .gitignore