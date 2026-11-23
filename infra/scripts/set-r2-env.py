#!/usr/bin/env python3
"""Upsert R2_* keys in VPS .env from /tmp/r2-payload.env. Never prints secret values."""
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone

ENV_PATH = Path("/opt/bismillah-leather/.env")
PAYLOAD = Path("/tmp/r2-payload.env")
REQUIRED = ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL")


def parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def upsert(text: str, updates: dict[str, str]) -> str:
    lines = text.splitlines()
    found: set[str] = set()
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in updates:
                out.append(f"{key}={updates[key]}")
                found.add(key)
                continue
        out.append(line)
    missing = [k for k in updates if k not in found]
    if missing:
        if out and out[-1].strip():
            out.append("")
        out.append("# Cloudflare R2 (product image hosting)")
        for key in missing:
            out.append(f"{key}={updates[key]}")
    return "\n".join(out).rstrip() + "\n"


def existing_value(parsed: dict[str, str], key: str) -> str:
    return parsed.get(key, "").strip()


def list_bucket(account_id: str, token: str) -> str:
    import json
    import urllib.request

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    buckets = (data.get("result") or {}).get("buckets") or []
    names = [b.get("name") for b in buckets if b.get("name")]
    if not names:
        raise SystemExit("R2_BUCKET missing and Cloudflare API returned no buckets")
    return names[0]


def main() -> int:
    if not PAYLOAD.exists():
        print("missing payload", file=sys.stderr)
        return 1
    if not ENV_PATH.exists():
        print("missing env", file=sys.stderr)
        return 1

    payload = parse_env(PAYLOAD.read_text(encoding="utf-8"))
    env = parse_env(ENV_PATH.read_text(encoding="utf-8"))
    updates: dict[str, str] = {}
    for key in REQUIRED:
        value = payload.get(key, "").strip()
        if not value:
            print(f"missing {key}", file=sys.stderr)
            return 1
        updates[key] = value

    bucket = payload.get("R2_BUCKET", "").strip() or existing_value(env, "R2_BUCKET")
    token = payload.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not bucket:
        if not token:
            print("missing R2_BUCKET", file=sys.stderr)
            return 1
        bucket = list_bucket(updates["R2_ACCOUNT_ID"], token)
    updates["R2_BUCKET"] = bucket

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup = ENV_PATH.with_name(f".env.bak.r2.{stamp}")
    shutil.copy2(ENV_PATH, backup)
    ENV_PATH.write_text(upsert(ENV_PATH.read_text(encoding="utf-8"), updates), encoding="utf-8")
    ENV_PATH.chmod(0o600)

    check = parse_env(ENV_PATH.read_text(encoding="utf-8"))
    ok = all(check.get(k, "").strip() for k in (*REQUIRED, "R2_BUCKET"))
    print(f"R2_ACCOUNT_ID={'set' if check.get('R2_ACCOUNT_ID') else 'missing'}")
    print(f"R2_ACCESS_KEY_ID={'set' if check.get('R2_ACCESS_KEY_ID') else 'missing'}")
    print(f"R2_SECRET_ACCESS_KEY={'set' if check.get('R2_SECRET_ACCESS_KEY') else 'missing'}")
    print(f"R2_PUBLIC_URL={'set' if check.get('R2_PUBLIC_URL') else 'missing'}")
    print(f"R2_BUCKET={'set' if check.get('R2_BUCKET') else 'missing'}")
    print(f"R2_BUCKET_NAME={check.get('R2_BUCKET','')}")
    print(f"backup={backup.name}")
    print("ok" if ok else "incomplete")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
