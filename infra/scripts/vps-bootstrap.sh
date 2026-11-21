#!/usr/bin/env bash
set -euo pipefail
cd /opt/bismillah-leather
if [ -f infra/.dockerignore ]; then mv -f infra/.dockerignore .dockerignore; fi
chmod +x infra/scripts/*.sh

python3 - << 'PY'
from pathlib import Path

web = Path("/opt/bismillah-leather/apps/web/next.config.ts")
admin = Path("/opt/bismillah-leather/apps/admin/next.config.ts")
needle = "const nextConfig: NextConfig = {"
insert = """const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "1"
    ? { output: "standalone" as const, outputFileTracingRoot: rootDir }
    : {}),"""
for p in (web, admin):
    text = p.read_text()
    if "BUILD_STANDALONE" in text:
        print(f"already patched {p}")
        continue
    if needle not in text:
        raise SystemExit(f"cannot patch {p}")
    p.write_text(text.replace(needle, insert, 1))
    print(f"patched {p}")
PY

if [ -f .env ]; then
  echo ".env already exists, not overwriting"
else
  umask 077
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
  SESSION_SECRET=$(openssl rand -hex 32)
  ADMIN_MASTER_KEY=$(openssl rand -hex 16)
  ENCRYPTION_KEY=$(openssl rand -hex 16)
  REVALIDATE_SECRET=$(openssl rand -hex 24)
  cat > .env << EOF
POSTGRES_USER=bismillah
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=bismillah
WEB_PUBLISH=172.18.0.1:18100
ADMIN_PUBLISH=172.18.0.1:18101
API_PUBLISH=172.18.0.1:18102
NEXT_PUBLIC_STORE_URL=https://bismillahletherbd.com
NEXT_PUBLIC_API_URL=/
SESSION_SECRET=${SESSION_SECRET}
ADMIN_MASTER_KEY=${ADMIN_MASTER_KEY}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
REVALIDATE_SECRET=${REVALIDATE_SECRET}
SEED_ADMIN_EMAIL=owner@bismillahletherbd.com
SEED_ADMIN_PASSWORD=unused-do-not-seed
REDIS_CACHE_URL=redis://redis-cache:6379
REDIS_CORE_URL=redis://redis-core:6379
EOF
  chmod 600 .env
  echo "wrote /opt/bismillah-leather/.env (chmod 600)"
fi

ufw allow from 172.18.0.0/16 to any port 18100 proto tcp comment 'bismillah web' || true
ufw allow from 172.18.0.0/16 to any port 18101 proto tcp comment 'bismillah admin' || true
ufw allow from 172.18.0.0/16 to any port 18102 proto tcp comment 'bismillah api' || true

docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env config --quiet
echo COMPOSE_OK
