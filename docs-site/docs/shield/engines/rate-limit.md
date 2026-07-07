---
title: Rate Limiting
description: The sharded token-bucket rate limiter — per-IP, per-host, or per-header keys, burst control, and 429 responses with Retry-After.
sidebar_position: 9
tags: [shield, engine]
---

The `rate_limit` engine protects against brute force, credential stuffing, scraping, and plain resource exhaustion by enforcing a **per-key token-bucket** limit. It is a **header-phase, request-only** engine — the body is never buffered for it — and a limited request receives an immediate **429 with a `Retry-After` header** instead of the usual 403.

## When to use it

- Cap per-client request rates on public APIs (`key: ip`).
- Give each partner or API key its own budget (`key: header` on the credential header).
- Throttle an entire vhost regardless of caller (`key: host`).
- Size limits safely first: run in `detect` mode to record would-be-429s without enforcing — see [Modes & Fail Postures](/shield/policies/modes-and-postures).

## Configuration

| Field | Type | Required | Default | Allowed / notes |
|---|---|---|---|---|
| `requests_per_second` | float | **yes** | — | Sustained rate per key. Must be `> 0`. |
| `burst` | int | no | `requests_per_second` (floored to 1) | Bucket capacity (max instantaneous burst). `≥ 0` (`0` = derive from the rate). |
| `key` | string | no | `ip` | `ip` \| `host` \| `header` — the limit dimension. |
| `header` | string | conditional | — | Only used for `key: header` (**required** there) — the request header whose value is the limiter key. It is **ignored for `key: ip`**: the source IP is the pre-derived trusted-hop address (`tx.SourceIP`), not a header you name here. |

:::info
The source IP for `key: ip` is derived from the **trusted hop** (right-side X-Forwarded-For), never the spoofable leftmost token. See [Envoy prerequisites](#envoy-prerequisites).
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-ratelimit
spec:
  defaults:
    mode: block
    fail_mode: fail_open

  domains:
    - hosts: ["gateway.example.com"]
      routes:
        # Per-IP limit: 100 req/s sustained, bursts up to 200.
        - match:
            path_prefix: "/v1/"
          policy:
            mode: block
            engines:
              rate_limit:
                requests_per_second: 100
                burst: 200
                key: ip            # ip | host | header

        # Per-API-key limit (key by a header value) + JWT auth on the same
        # route. Both engines run at the header phase.
        - match:
            path_prefix: "/partner/"
          policy:
            mode: block
            engines:
              rate_limit:
                requests_per_second: 10
                burst: 20
                key: header
                header: "X-Api-Key"
              jwt:
                issuer: "https://auth.example.com/"
                audience: "partner-api"
                algorithms: ["RS256"]
                public_key_file: "/etc/elchi/elchi-shield/keys/jwt-pub.pem"
                leeway: 30s         # clock-skew tolerance

        # Detect-mode (monitor) rate limit: records would-be-429s but allows
        # the request, so you can size limits before enforcing.
        - match:
            path_prefix: "/beta/"
          policy:
            mode: detect
            engines:
              rate_limit:
                requests_per_second: 5
                key: ip
```

## How it decides

**Key selection:**

- `key: ip` (default) → the trusted derived source IP (never a spoofable XFF token).
- `key: host` → the canonicalized host (port stripped, IPv6 brackets removed, lowercased).
- `key: header` → the named header's value.

**Missing key ⇒ shared bucket, not exempt.** When the selector can't be derived — an
absent keyed header, or an empty source IP — the request is counted against one shared
**"unkeyed"** bucket rather than being let through unlimited. This closes the bypass of
simply dropping the header/IP to escape the limit; unkeyed traffic shares a single budget.

**Bucket math:** `requests_per_second` is the refill rate; `burst` is the bucket capacity (default ≈ `requests_per_second`, floored to 1). The first sighting of a key allows the request and leaves `burst − 1` tokens; after that, `tokens += elapsed × rps`, capped at `burst`. If at least 1 token is available the request is allowed and one token is consumed; otherwise it is **blocked with 429**, reason **`ratelimit.exceeded`**, severity Low, and a `Retry-After` header.

The limiter is the one sanctioned stateful engine: 64 shards, each with its own mutex, touched only when a policy opts in — the rest of the hot path stays lock-free.

## Envoy prerequisites

For `key: ip`, the limit is only as trustworthy as the source IP:

- Run Envoy with **`use_remote_address: true`** so the peer address Envoy appends to X-Forwarded-For is authoritative.
- Set **`--xff-trusted-hops`** to the exact number of trusted proxies in front of Envoy. Misconfigure it and clients can mint fresh buckets at will by rotating a spoofed XFF value.

`key: host` and `key: header` have no special Envoy requirements. See [Envoy wiring](/shield/envoy-wiring).

## Verify

Under the limit, requests pass:

```bash
curl -i http://gateway.example.com/v1/items
# HTTP/1.1 200 OK
```

Exhaust the bucket and the next request is limited:

```bash
for i in $(seq 1 250); do
  curl -s -o /dev/null -w "%{http_code}\n" http://gateway.example.com/v1/items
done | sort | uniq -c
#  200 200
#   50 429      <- ratelimit.exceeded, response carries Retry-After
```

In `detect` mode the 429s show up in `detections_total` instead of being returned.

## Gotchas

:::warning
**Never key on an attacker-controlled header.** A spoofable key lets an attacker mint unlimited fresh buckets and bypass the limit entirely. Key-flood resilience is also coarse: each shard caps at 16384 keys and **resets the whole shard map when full**, which can let a burst through during a key flood. Prefer `key: ip` or `key: host` over `key: header` unless the header is a credential your edge guarantees.
:::

:::warning
**Shared state follows policy inheritance.** A `rate_limit` defined at the **domain** level and inherited by N routes is **one combined limiter** across all of them (shared buckets); the same block written on a **route** is independent; two separately-written identical blocks are independent. Define the limit at the scope it should actually apply to — see [policy resolution](/shield/policies/policy-model).
:::

- An empty key (missing IP or absent header) is **not limited** — by design, but it means `key: header` only limits requests that carry the header.

Related engines: [IP reputation](/shield/engines/ip-reputation), [Bot detection](/shield/engines/bot-detection).
