#!/usr/bin/env bash
# Upsert the owner from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Does not seed products.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
sed -i 's/\r$//' packages/db/prisma/sync-owner.ts 2>/dev/null || true
docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env \
  run --rm --entrypoint "" \
  -v "$ROOT/packages/db/prisma/sync-owner.ts:/app/packages/db/prisma/sync-owner.ts" \
  migrate pnpm --filter @bismillah/db exec tsx prisma/sync-owner.ts
