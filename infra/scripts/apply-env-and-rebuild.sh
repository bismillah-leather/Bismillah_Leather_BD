#!/usr/bin/env bash
# Recreate shop containers so they pick up /opt/bismillah-leather/.env.
# Does not seed. Does not touch other Compose projects.
set -euo pipefail
cd /opt/bismillah-leather
python3 - <<'PY'
from pathlib import Path
keys = []
public = []
for raw in Path(".env").read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    v = v.strip().strip("'").strip('"')
    if not v:
        continue
    keys.append(k)
    if k.startswith("NEXT_PUBLIC_"):
        public.append(k)
print("ENV_KEYS_SET", len(keys))
print("NEXT_PUBLIC", ",".join(public) or "none")
for name in ("SEED_ADMIN_EMAIL", "R2_ACCOUNT_ID", "R2_BUCKET", "EPS_STORE_ID", "PATHAO_CLIENT_ID", "STEADFAST_API_KEY", "NEXT_PUBLIC_GTM_ID", "NEXT_PUBLIC_GA_ID"):
    present = any(k == name for k in keys)
    print(f"{name}={'set' if present else 'missing'}")
PY
docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env \
  up -d --build --force-recreate web admin api
echo RECREATED
docker compose -p bismillah-leather -f infra/docker-compose.prod.yml ps
curl -sf http://172.18.0.1:18100/api/health || true
echo
curl -sf http://172.18.0.1:18102/healthz || true
echo
