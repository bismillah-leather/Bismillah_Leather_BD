#!/usr/bin/env bash
# Pull origin/main and rebuild only the bismillah-leather stack.
# Keeps .env and Postgres/Redis volumes. Does not seed. Does not touch other apps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env)

if [[ ! -f .env ]]; then
  echo "Missing $ROOT/.env — copy from .env.example and fill secrets first." >&2
  exit 1
fi

if [[ -d .git ]]; then
  git fetch origin
  if [[ "$ROOT" == "/opt/bismillah-leather" || "${VPS_RESET:-}" == "1" ]]; then
    git reset --hard origin/main
  else
    git pull --ff-only origin main
  fi
fi

sed -i 's/\r$//' infra/scripts/*.sh 2>/dev/null || true
chmod +x infra/scripts/*.sh 2>/dev/null || true

"${COMPOSE[@]}" up -d --build

echo
"${COMPOSE[@]}" ps
echo
echo "Health (loopback via Caddy network):"
curl -sf http://172.18.0.1:18100/api/health || true
echo
curl -sf http://172.18.0.1:18102/healthz || true
echo
echo "UPDATE_OK  (no seed, no other compose projects touched)"
