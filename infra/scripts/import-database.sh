#!/usr/bin/env bash
# Copy every table from the current Prisma Postgres (or any Postgres) into the
# self-hosted Docker database. Does not print connection strings.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
COMPOSE=(docker compose -f "$ROOT/infra/docker-compose.prod.yml" --env-file "$ROOT/.env")
DUMP_DIR="$ROOT/infra/backups"
DUMP_FILE="$DUMP_DIR/bismillah.dump"

if [[ -z "${SOURCE_DIRECT_URL:-}" ]]; then
  echo "Set SOURCE_DIRECT_URL to the current database DIRECT_URL (Prisma Postgres direct TCP), then re-run." >&2
  exit 1
fi

mkdir -p "$DUMP_DIR"
chmod 700 "$DUMP_DIR"

echo "Dumping source database (custom format, no owner)…"
docker run --rm \
  -e SOURCE_DIRECT_URL \
  -v "$DUMP_DIR:/backups" \
  postgres:18 \
  pg_dump "$SOURCE_DIRECT_URL" --no-owner --no-acl --format=custom --file=/backups/bismillah.dump

echo "Starting self-hosted Postgres…"
"${COMPOSE[@]}" up -d postgres

echo "Waiting for Postgres…"
for _ in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -q; then
    break
  fi
  sleep 2
done

echo "Restoring into Docker Postgres (replaces existing objects)…"
"${COMPOSE[@]}" exec -T postgres \
  pg_restore --no-owner --no-acl --clean --if-exists --dbname="${POSTGRES_DB:-bismillah}" --username="${POSTGRES_USER:-bismillah}" /backups/bismillah.dump \
  || true

echo "Applying Prisma migrations (no-op if dump already includes them)…"
"${COMPOSE[@]}" run --rm migrate

echo "Done. Start the shop with: pnpm vps:up"
