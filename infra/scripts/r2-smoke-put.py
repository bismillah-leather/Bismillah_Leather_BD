#!/usr/bin/env python3
"""Upload a 1-byte object to R2 using VPS .env. Prints only HTTP status, never secrets."""
from __future__ import annotations

import datetime as dt
import hashlib
import hmac
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ENV_PATH = Path("/opt/bismillah-leather/.env")


def parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def main() -> int:
    env = parse_env(ENV_PATH.read_text(encoding="utf-8"))
    account = env.get("R2_ACCOUNT_ID", "")
    access = env.get("R2_ACCESS_KEY_ID", "")
    secret = env.get("R2_SECRET_ACCESS_KEY", "")
    bucket = env.get("R2_BUCKET", "")
    public = env.get("R2_PUBLIC_URL", "").rstrip("/")
    if not all([account, access, secret, bucket, public]):
        print("R2 incomplete")
        return 1

    key = "_health/r2-smoke.txt"
    body = b"ok"
    host = f"{account}.r2.cloudflarestorage.com"
    content_type = "text/plain"
    now = dt.datetime.now(dt.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = sha256_hex(body)
    canonical_uri = f"/{bucket}/{key}"
    canonical_headers = (
        f"content-type:{content_type}\n"
        f"host:{host}\n"
        f"x-amz-content-sha256:{payload_hash}\n"
        f"x-amz-date:{amz_date}\n"
    )
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canonical_request = "\n".join(
        ["PUT", canonical_uri, "", canonical_headers, signed_headers, payload_hash]
    )
    scope = f"{date_stamp}/auto/s3/aws4_request"
    string_to_sign = "\n".join(
        ["AWS4-HMAC-SHA256", amz_date, scope, sha256_hex(canonical_request.encode())]
    )
    signing_key = sign(sign(sign(sign(f"AWS4{secret}".encode(), date_stamp), "auto"), "s3"), "aws4_request")
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()
    authorization = (
        f"AWS4-HMAC-SHA256 Credential={access}/{scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    url = f"https://{host}{canonical_uri}"
    req = Request(
        url,
        data=body,
        method="PUT",
        headers={
            "content-type": content_type,
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
            "authorization": authorization,
        },
    )
    try:
        with urlopen(req, timeout=30) as resp:
            put_status = resp.status
    except HTTPError as err:
        put_status = err.code
        print(f"put={put_status}")
        return 1
    print(f"put={put_status}")
    pub_req = Request(
        f"{public}/{key}",
        method="GET",
        headers={"User-Agent": "bismillah-leather-r2-smoke/1"},
    )
    try:
        with urlopen(pub_req, timeout=30) as resp:
            print(f"public_get={resp.status}")
    except HTTPError as err:
        print(f"public_get={err.code}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
