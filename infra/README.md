# Production on a shared Contabo VPS

This stack is isolated from Magic Tissue, Doctors Sheba, Profitnex, and the host Caddy that already owns **:80 / :443**.

**Do not** start the old bundled Caddy (`infra/Caddyfile` + `lb` service). That would steal ports 80/443 from live sites.

Compose project name: `bismillah-leather`.

| Service | Container port | Host bind (loopback only) |
|---|---:|---|
| web | 3000 | `127.0.0.1:18100` |
| admin | 3001 | `127.0.0.1:18101` |
| api | 4000 | `127.0.0.1:18102` |
| postgres | 5432 | none |
| redis-cache | 6379 | none |
| redis-core | 6379 | none |

Confirm `18100–18102` are free on the VPS before `up`. Change `WEB_HOST_PORT` / `ADMIN_HOST_PORT` / `API_HOST_PORT` in `.env` if not.

## Routing (existing Caddy)

Copy `infra/caddy/bismillahletherbd.com.caddy` into the host Caddy **sites include** directory. **Import it; do not overwrite** `/etc/caddy/Caddyfile`.

```
https://bismillahletherbd.com/          → web :18100
https://bismillahletherbd.com/admin     → admin :18101
https://bismillahletherbd.com/api/healthz → api :18102
https://bismillahletherbd.com/api/readyz  → api :18102
```

Do **not** send all of `/api` to Express. Storefront Next.js routes (`/api/reviews`, `/api/account`, checkout actions) live on **web**.

## Seed

`pnpm db:seed` upserts the owner password and rewrites showcase product rows. **Do not run seed on a database you imported.** Use `infra/scripts/import-database.sh` or restore a dump.

## Commands

```bash
docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env config
docker compose -p bismillah-leather -f infra/docker-compose.prod.yml --env-file .env up -d --build
docker compose -p bismillah-leather ps
docker compose -p bismillah-leather logs -f --tail=200
```

Backups: `infra/scripts/backup.sh` → `/opt/backups/bismillah-leather/`. Archives omit `.env`.
