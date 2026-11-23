#!/usr/bin/env python3
"""Enable r2.dev public access for the configured bucket. Never prints secrets."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ENV_PATH = Path("/opt/bismillah-leather/.env")
PAYLOAD = Path("/tmp/r2-payload.env")


def parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def cf_json(method: str, url: str, token: str, body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except HTTPError as err:
        raw = err.read().decode("utf-8") if err.fp else ""
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw[:200]}
        return err.code, parsed


def main() -> int:
    env = parse_env(ENV_PATH.read_text(encoding="utf-8"))
    payload = parse_env(PAYLOAD.read_text(encoding="utf-8")) if PAYLOAD.exists() else {}
    token = payload.get("CLOUDFLARE_API_TOKEN", "")
    account = env.get("R2_ACCOUNT_ID", "")
    bucket = env.get("R2_BUCKET", "")
    if not token or not account or not bucket:
        print("missing token or r2 config")
        return 1
    base = f"https://api.cloudflare.com/client/v4/accounts/{account}/r2/buckets/{bucket}"
    get_status, get_body = cf_json("GET", f"{base}/domains/managed", token)
    print(f"managed_get={get_status}")
    result = get_body.get("result") or {}
    print(f"managed_enabled={result.get('enabled')}")
    domain = result.get("domain") or result.get("bucketId") or ""
    if domain:
        print(f"managed_domain_set={'yes' if domain else 'no'}")
    put_status, put_body = cf_json("PUT", f"{base}/domains/managed", token, {"enabled": True})
    print(f"managed_put={put_status}")
    print(f"managed_ok={put_body.get('success')}")
    after_status, after_body = cf_json("GET", f"{base}/domains/managed", token)
    after = after_body.get("result") or {}
    print(f"after_enabled={after.get('enabled')}")
    errors = put_body.get("errors") or after_body.get("errors") or get_body.get("errors") or []
    if errors:
        codes = ",".join(str(e.get("code")) for e in errors if isinstance(e, dict))
        print(f"api_error_codes={codes or 'yes'}")
    return 0 if put_body.get("success") or after.get("enabled") else 1


if __name__ == "__main__":
    raise SystemExit(main())
