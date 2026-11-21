#!/usr/bin/env bash
# Append Bismillah site to existing Profitnex Caddyfile. Does not replace other sites.
set -euo pipefail
CADDYFILE=/root/profitnex-bank/deploy/Caddyfile
STAMP=$(date -u +%Y%m%d-%H%M%S)
cp -a "$CADDYFILE" "${CADDYFILE}.bak.bismillah.${STAMP}"
echo "Backup: ${CADDYFILE}.bak.bismillah.${STAMP}"

if grep -q 'bismillahletherbd.com' "$CADDYFILE"; then
  echo "Site already present; skip append"
else
  cat >> "$CADDYFILE" << 'EOF'

# Bismillah Leather (isolated compose; host ports on 172.18.0.1)
bismillahletherbd.com, www.bismillahletherbd.com {
	tls internal
	encode gzip zstd
	handle /api/healthz {
		reverse_proxy 172.18.0.1:18102
	}
	handle /api/readyz {
		reverse_proxy 172.18.0.1:18102
	}
	handle /admin* {
		reverse_proxy 172.18.0.1:18101
	}
	handle {
		reverse_proxy 172.18.0.1:18100
	}
}
EOF
  echo "Appended bismillahletherbd.com"
fi

docker exec profitnex-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec profitnex-caddy-1 caddy reload --config /etc/caddy/Caddyfile
echo CADDY_RELOAD_OK
