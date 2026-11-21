#!/usr/bin/env bash
# Restore a gzip SQL dump into THIS project's Postgres only.
set -euo pipefail

DUMP="${1:?Usage: restore-db.sh /opt/backups/bismillah-leather/bismillah-leather-database-YYYY-MM-DD-HHMM.sql.gz}"
ROOT="${PROJECT_ROOT:-/opt/bismillah-leather}"
COMPOSE=(docker compose -p bismillah-leather -f "$ROOT/infra/docker-compose.prod.yml" --env-file "$ROOT/.env")

if [[ ! -f "$DUMP" ]]; then
  echo "Dump not found: $DUMP" >&2
  exit 1
fi

echo "Restoring into bismillah-leather postgres (other containers untouched)…"
gzip -dc "$DUMP" | "${COMPOSE[@]}" exec -T postgres psql -U "${POSTGRES_USER:-bismillah}" -d "${POSTGRES_DB:-bismillah}"
echo "Done. Run: docker compose -p bismillah-leather -f $ROOT/infra/docker-compose.prod.yml restart web admin api"
