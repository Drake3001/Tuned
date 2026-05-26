#!/usr/bin/env bash
# Export the current Keycloak realm (and users) into infra/keycloak for docker compose --import-realm.
# Run from repo root after you have configured realms/users in the admin console.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMPORT_DIR="$ROOT/infra/keycloak"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

REALM="${KC_REALM:-}"
if [[ -z "$REALM" ]]; then
  echo "KC_REALM is not set. Add it to .env (see .env.example)." >&2
  exit 1
fi

# Docker creates a directory if the bind-mount source file did not exist before first up.
if [[ -d "$IMPORT_DIR/realm-export.json" ]]; then
  echo "Removing mistaken directory infra/keycloak/realm-export.json ..."
  rm -rf "$IMPORT_DIR/realm-export.json"
fi

mkdir -p "$IMPORT_DIR"

echo "Stopping Keycloak ..."
docker compose stop keycloak

echo "Exporting realm '$REALM' to $IMPORT_DIR ..."
docker compose run --rm --no-deps \
  -v "$IMPORT_DIR:/opt/keycloak/data/import" \
  keycloak \
  export --dir /opt/keycloak/data/import --realm "$REALM" --users realm_file

echo "Starting Keycloak ..."
docker compose start keycloak

echo ""
echo "Exported files:"
ls -la "$IMPORT_DIR"

echo ""
echo "Commit infra/keycloak/*.json so other machines get the same realm on 'docker compose up'."
