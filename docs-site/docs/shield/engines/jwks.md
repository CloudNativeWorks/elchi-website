---
title: JWKS
description: Bearer JWT validation against a JWK Set (local file or remote URL) with key rotation, background refresh, and no request-path network I/O.
sidebar_position: 3
tags: [shield, engine]
---

The `jwks` engine validates a bearer JWT like the [`jwt` engine](/shield/engines/jwt), but resolves the verification key by the token's `kid` from a **JWK Set** — a local file or a remote URL — which is what enables **key rotation** against an OAuth2/OIDC identity provider. It runs at the **header phase**, inspects **requests only**, and a missing or invalid token always blocks with a **403** (no anonymous pass-through; `fail_open` does not apply to a bad credential).

## When to use it

- OAuth2 / OIDC bearer auth where the IdP publishes keys at a `.well-known/jwks.json` endpoint and rotates them.
- Multiple concurrent signing keys (`kid`-selected) instead of the single static key of the `jwt` engine.
- Air-gapped sidecars: point `file` at a JWKS written by the management plane — hot-reloaded, zero network egress.

## Configuration

Configure under `policy.engines.jwks`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `file` | string | one-of | — | Local JWKS file (hot-reloaded, no network). |
| `url` | string | one-of | — | Remote JWKS URL (fetched at load, then background-refreshed). Must be **https** (or a loopback host). |
| `issuer` | string | no | — | Expected `iss`. |
| `audience` | string | no | — | Expected `aud`. |
| `algorithms` | string[] | **yes** | — | **Asymmetric only**: `RS*`/`ES*`/`PS*`. `HS*` is rejected (a JWKS holds asymmetric keys; allowing HS invites RS256→HS256 confusion). `EdDSA` passes config validation but is **not currently loadable** — the JWKS parser builds only RSA and EC keys, so OKP/Ed25519 keys are silently skipped; don't rely on it yet. |
| `required_claims` | string[] | no | — | Claims that must be present. |
| `header_name` | string | no | `Authorization` | Header carrying the token. |
| `leeway` | duration | no | `0` | `≥ 0`, `≤ 5m`. |
| `refresh_interval` | duration | no | `10m` | Background URL refresh cadence. `≥ 0`. |
| `http_timeout` | duration | no | `10s` | URL fetch timeout. `≥ 0`. |

:::info[Exactly one source]
Set exactly **one** of `file` / `url`. `refresh_interval` and `http_timeout` apply to the `url` source only.
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-jwks
spec:
  defaults:
    mode: block
    fail_mode: fail_close

  domains:
    - hosts: ["mtls.example.com"]
      routes:
        # OIDC bearer auth against a remote JWKS endpoint. Keys are cached and
        # refreshed in the background; RS256/ES256 are pinned.
        - match:
            path_prefix: "/api/"
          policy:
            mode: block
            engines:
              jwks:
                url: "https://idp.example.com/.well-known/jwks.json"
                refresh_interval: 10m
                http_timeout: 5s
                issuer: "https://idp.example.com/"
                audience: "secure-api"
                algorithms: ["RS256", "ES256"]
                required_claims: ["sub"]
                leeway: 30s

        # Local JWKS file (written by the management plane, hot-reloaded) — no
        # network egress from the sidecar.
        - match:
            path_prefix: "/internal/"
          policy:
            mode: block
            engines:
              jwks:
                file: "/etc/elchi/elchi-shield/keys/jwks.json"
                algorithms: ["RS256"]
                audience: "internal"
```

## How it decides

The block flow is identical to the `jwt` engine, with `jwks.*` reasons:

1. Read the token header (default `Authorization`). Missing or blank ⇒ block **`jwks.missing`**.
2. Strip the `Bearer ` prefix, parse and verify. Any failure (bad signature, expired, wrong `iss`/`aud`, disallowed `alg`) ⇒ block **`jwks.invalid`**.
3. Enforce `required_claims` (present and non-empty) ⇒ otherwise block **`jwks.missing_claim`**.
4. Otherwise allow.

Key resolution looks up the token's `kid` in an in-memory map. **An unknown `kid` blocks — it never triggers a hot-path network fetch.** If the token omits `kid` and exactly one key is configured, that key is used. A token with no `exp` is always rejected.

## Envoy prerequisites

Nothing beyond the standard `ext_proc` filter wiring. See [Envoy wiring](/shield/envoy-wiring).

## Verify

```bash
# Passing request: token signed by a key currently published in the JWKS
curl -i https://mtls.example.com/api/orders \
  -H "Authorization: Bearer $IDP_ISSUED_JWT"
# → 200 from the upstream

# Blocked request: no bearer token
curl -i https://mtls.example.com/api/orders
# → 403, x-elchi-shield: blocked   (reason: jwks.missing)

# Blocked request: token with a kid that is not in the key set
curl -i https://mtls.example.com/api/orders \
  -H "Authorization: Bearer $UNKNOWN_KID_JWT"
# → 403, x-elchi-shield: blocked
```

## Gotchas

:::tip[Rotation procedure]
Publish the new key (new `kid`) in the JWKS **before** issuing tokens signed with it — a token whose `kid` Shield hasn't refreshed yet will block. Budget for the `refresh_interval` (default 10m) between publishing and issuing.
:::

- **No request-path network I/O, ever** — verification only reads an atomic pointer to an immutable `kid→key` map. A remote URL is fetched once at load, then refreshed in the background; **a failed refresh keeps the last-good keys** (degrades closed-ish, not open).
- **JWKS parsing is hardened:** a duplicate `kid` rejects the whole set; RSA keys must be ≥ 2048 bits; EC points are validated on-curve; the fetch body is capped at 1 MiB and gated on HTTP 200.
- A bad URL, file, or parse at config load **aborts the reload** — the last-good config stays active. The background refresher is stopped cleanly when a snapshot is retired.
- `leeway` defaults to `0` — same clock-skew caveat as the [`jwt` engine](/shield/engines/jwt): set a small leeway (e.g. `30s`) in production.
- A missing or invalid credential blocks deterministically; `fail_open` governs internal engine errors only. See [modes and postures](/shield/policies/modes-and-postures).
