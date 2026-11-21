#!/usr/bin/env bash
# Backups for this project only. Does not touch other Compose projects.
# Database dump does not include .env. Keep /opt/bismillah-leather/.env mode 600 separately.
set -euo pipefail

STAMP="$(date -u +%Y-%m-%d-%H%M)"
ROOT="${PROJECT_ROOT:-/opt/bismillah-leather}"
DEST="${BACKUP_DIR:-/opt/backups/bismillah-leather}"
COMPOSE=(docker compose -p bismillah-leather -f "$ROOT/infra/docker-compose.prod.yml" --env-file "$ROOT/.env")

mkdir -p "$DEST"
chmod 700 "$DEST"

echo "Database dump…"
"${COMPOSE[@]}" exec -T postgres pg_dump -U "${POSTGRES_USER:-bismillah}" -d "${POSTGRES_DB:-bismillah}" --no-owner --format=plain \
  | gzip -9 > "$DEST/bismillah-leather-database-${STAMP}.sql.gz"

echo "Compose + Caddy snippet (no .env)…"
tar -C "$ROOT" -czf "$DEST/bismillah-leather-config-${STAMP}.tar.gz" \
  infra/docker-compose.prod.yml \
  infra/docker-compose.yml \
  infra/Dockerfile \
  infra/caddy \
  infra/scripts \
  .env.example

echo "Project tree excluding secrets, git, node_modules, dumps…"
tar -C "$ROOT" --exclude='.env' --exclude='.env.*' --exclude='.git' --exclude='node_modules' --exclude='**/.next' \
  --exclude='infra/backups/*.dump' -czf "$DEST/bismillah-leather-project-${STAMP}.tar.gz" .

cat > "$DEST/bismillah-leather-meta-${STAMP}.txt" <<EOF
created_utc=${STAMP}
project=bismillah-leather
compose=infra/docker-compose.prod.yml
note=Application .env is NOT in these archives. Copy it separately with chmod 600.
EOF

chmod 600 "$DEST"/bismillah-leather-*-"${STAMP}".*
echo "Wrote $DEST (*-${STAMP}.*)"
ls -lh "$DEST"/*-"${STAMP}".*
