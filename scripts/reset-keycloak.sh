#!/usr/bin/env bash
# Wipe Keycloak data and re-import tuned_realm from infra/keycloak/tuned_realm-realm.json.
# Run from repo root: npm run keycloak:reset
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example to .env first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

REALM="${KC_REALM:-tuned_realm}"
KC_URL="${KEYCLOAK_URL:-http://localhost:8080}"
IMPORT_FILE="$ROOT/infra/keycloak/${REALM}-realm.json"
DB_CONTAINER="${DB_CONTAINER:-tuned-db}"

if [[ ! -f "$IMPORT_FILE" ]]; then
  echo "Missing realm import file: $IMPORT_FILE" >&2
  exit 1
fi

echo "==> Stopping Keycloak..."
docker compose stop keycloak 2>/dev/null || true
docker compose rm -f keycloak 2>/dev/null || true

echo "==> Recreating Keycloak database (drops old realm)..."
if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "Postgres is not running. Starting postgres..."
  docker compose up -d postgres
  sleep 3
fi

docker exec "$DB_CONTAINER" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS keycloak WITH (FORCE);"
docker exec "$DB_CONTAINER" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE keycloak;"

echo "==> Starting Keycloak (imports $IMPORT_FILE)..."
docker compose up -d keycloak

echo "==> Waiting for Keycloak..."
for i in $(seq 1 60); do
  if curl -sf "$KC_URL/realms/$REALM/.well-known/openid-configuration" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "Keycloak did not become ready in time. Check: docker logs tuned-keycloak" >&2
    exit 1
  fi
  sleep 2
done

echo ""
echo "Keycloak reset complete."
echo ""
echo "Realm:     $REALM"
echo "Client:    ${AUTH_KEYCLOAK_ID:-tuned-app}"
echo "Secret:    must match AUTH_KEYCLOAK_SECRET in .env (default: tuned-dev-secret)"
echo ""
echo "Demo users (password: tuned123):"
echo "  admin     — has admin role (daily preview + badge)"
echo "  testuser  — player only"
echo ""
echo "Sign out of the app, then sign back in after a reset."
echo "If web is running: docker compose restart web"
