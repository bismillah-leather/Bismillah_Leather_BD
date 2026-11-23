#!/usr/bin/env python3
"""Attach public-read GetObject policy to the configured R2 bucket."""
from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

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


def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def main() -> int:
    env = parse_env(ENV_PATH.read_text(encoding="utf-8"))
    account = env["R2_ACCOUNT_ID"]
    access = env["R2_ACCESS_KEY_ID"]
    secret = env["R2_SECRET_ACCESS_KEY"]
    bucket = env["R2_BUCKET"]
    host = f"{account}.r2.cloudflarestorage.com"
    policy = json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket}/*",
                }
            ],
        }
    ).encode("utf-8")
    now = dt.datetime.now(dt.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = sha256_hex(policy)
    canonical_uri = f"/{bucket}"
    canonical_query = "policy="
    canonical_headers = (
        f"content-type:application/json\n"
        f"host:{host}\n"
        f"x-amz-content-sha256:{payload_hash}\n"
        f"x-amz-date:{amz_date}\n"
    )
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canonical_request = "\n".join(
        ["PUT", canonical_uri, canonical_query, canonical_headers, signed_headers, payload_hash]
    )
    scope = f"{date_stamp}/auto/s3/aws4_request"
    string_to_sign = "\n".join(["AWS4-HMAC-SHA256", amz_date, scope, sha256_hex(canonical_request)])
    signing_key = sign(sign(sign(sign(f"AWS4{secret}".encode(), date_stamp), "auto"), "s3"), "aws4_request")
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()
    authorization = (
        f"AWS4-HMAC-SHA256 Credential={access}/{scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    req = Request(
        f"https://{host}/{bucket}?policy",
        data=policy,
        method="PUT",
        headers={
            "content-type": "application/json",
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
            "authorization": authorization,
        },
    )
    try:
        with urlopen(req, timeout=30) as resp:
            print(f"policy_put={resp.status}")
            return 0
    except HTTPError as err:
        print(f"policy_put={err.code}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
