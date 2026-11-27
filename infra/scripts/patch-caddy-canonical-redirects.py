"""Patch only the Bismillah Leather site blocks: 301 www + old typo → apex.

Does not replace the host Caddyfile. Idempotent. Cloudflare Flexible: apex HTTP
still reverse-proxies (no HTTP→HTTPS 308 on the canonical host).
"""
from datetime import datetime, timezone
from pathlib import Path

p = Path("/root/profitnex-bank/deploy/Caddyfile")
text = p.read_text()

if "redir https://bismillahleatherbd.com{uri} 301" in text and "http://bismillahleatherbd.com {" in text:
    print("ALREADY_PATCHED")
    raise SystemExit(0)

http_new = """http://bismillahleatherbd.com {
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

http://www.bismillahleatherbd.com, http://bismillahletherbd.com, http://www.bismillahletherbd.com {
	redir https://bismillahleatherbd.com{uri} 301
}
"""

https_new = """bismillahleatherbd.com {
	tls internal
	encode gzip zstd

	header {
		X-Content-Type-Options nosniff
		Referrer-Policy strict-origin-when-cross-origin
	}

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

www.bismillahleatherbd.com, bismillahletherbd.com, www.bismillahletherbd.com {
	tls internal
	redir https://bismillahleatherbd.com{uri} 301
}
"""


def block_span(src: str, marker: str) -> tuple[int, int]:
    idx = src.find(marker)
    if idx < 0:
        raise SystemExit("BLOCK_NOT_FOUND: " + marker)
    brace = src.find("{", idx)
    if brace < 0:
        raise SystemExit("BRACE_NOT_FOUND: " + marker)
    depth = 0
    i = brace
    while i < len(src):
        ch = src[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(src) and src[end] == "\n":
                    end += 1
                return idx, end
        i += 1
    raise SystemExit("UNBALANCED: " + marker)


http_marker = "http://bismillahleatherbd.com, http://www.bismillahleatherbd.com"
https_marker = "bismillahleatherbd.com, www.bismillahleatherbd.com, bismillahletherbd.com"

http_start, http_end = block_span(text, http_marker)
https_start, https_end = block_span(text, https_marker)

stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
bak = p.with_name(p.name + ".bak.bismillah.canonical." + stamp)
bak.write_text(text)
print("BACKUP=" + str(bak))

# Replace later span first so earlier indices stay valid.
if http_start > https_start:
    text = text[:http_start] + http_new + text[http_end:]
    text = text[:https_start] + https_new + text[https_end:]
else:
    text = text[:https_start] + https_new + text[https_end:]
    http_start, http_end = block_span(text, http_marker)
    text = text[:http_start] + http_new + text[http_end:]

p.write_text(text)
print("PATCHED")
