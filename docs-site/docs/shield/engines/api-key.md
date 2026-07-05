---
title: API Key
description: SHA-256-hashed API keys from a header or query parameter, with per-key scopes and scope-to-path bindings.
sidebar_position: 4
tags: [shield, engine]
---

The `api_key` engine authenticates requests by an API key carried in a **header or query parameter**, checked against keys stored as **SHA-256 digests** — the config never holds usable plaintext at rest. Optional **scope→path bindings** restrict which key may reach which path prefix. It runs at the **header phase** (no body buffering), inspects **requests only**, and a missing or unknown key always blocks with a **403** — `fail_open` does not apply to a bad credential.

## When to use it

- Partner or machine-to-machine APIs where issuing full JWT/OIDC infrastructure is overkill.
- Tiered access: one key gets `read`, another gets `read`+`write`, and `/v1/admin` requires `write` via a scope binding.
- Keeping credentials out of config files at rest — distribute only the `sha256` digest of each key.

## Configuration

Configure under `policy.engines.api_key`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `source` | string | no | `header` | `header` \| `query`. |
| `name` | string | no | `X-Api-Key` | Header / query parameter carrying the key. |
| `keys` | `APIKeyEntrySpec`[] | **yes** (≥1) | — | Configured credentials. |
| `require_scope_for_path` | `ScopeBindingSpec`[] | no | — | Path-prefix → required-scope bindings. |

### `keys` (`APIKeyEntrySpec`)

Each entry needs `sha256` **or** `key`:

| Field | Type | Notes |
|---|---|---|
| `sha256` | string | 64-char hex SHA-256 digest of the key (preferred, hashed at rest). |
| `key` | string | Raw key (hashed at load). |
| `subject` | string | Identity attributed on success. |
| `scopes` | string[] | Scopes this key carries. |

### `require_scope_for_path` (`ScopeBindingSpec`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `path_prefix` | string | yes | Path prefix to guard. |
| `scope` | string | yes | Scope a key must carry to reach it. |

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-auth
spec:
  defaults:
    mode: block
    fail_mode: fail_close

  domains:
    - hosts: ["auth.example.com"]
      routes:
        # API-key auth: keys stored hashed (sha256) at rest. Provide either a
        # raw `key` (hashed at load) or a precomputed `sha256`. Optional
        # scope→path bindings restrict a key to certain prefixes.
        - match:
            path_prefix: "/v1/"
          policy:
            mode: block
            engines:
              api_key:
                source: header          # header | query
                name: "X-Api-Key"
                keys:
                  - sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
                    subject: "partner-a"
                    scopes: ["read"]
                  - key: "rotate-me-in-prod"   # raw key, hashed at load
                    subject: "partner-b"
                    scopes: ["read", "write"]
                require_scope_for_path:
                  - { path_prefix: "/v1/admin", scope: "write" }
```

Generate a digest for the `sha256` form with:

```bash
printf '%s' 'my-api-key' | shasum -a 256
```

## How it decides

1. Extract the key from the configured header (default `X-Api-Key`) or query parameter. Empty ⇒ block **`apikey.missing`**.
2. SHA-256 the presented value and look it up. Unknown ⇒ block **`apikey.unknown`**.
3. For each scope binding whose `path_prefix` prefixes the **normalized** request path, the key must carry that `scope` ⇒ otherwise block **`apikey.scope`**.
4. Otherwise allow; the matching entry's `subject` is attributed as the identity.

Scope-binding paths are normalized exactly like the router — percent-decoded, dot-segments and duplicate slashes collapsed — so `//v1/admin`, `/v1/%61dmin`, and `/v1/./admin` can't dodge a scope requirement.

## Envoy prerequisites

Nothing beyond the standard `ext_proc` filter wiring. See [Envoy wiring](/shield/envoy-wiring).

## Verify

```bash
# Passing request: a known key with sufficient scope
curl -i https://auth.example.com/v1/orders \
  -H "X-Api-Key: rotate-me-in-prod"
# → 200 from the upstream

# Blocked request: no key
curl -i https://auth.example.com/v1/orders
# → 403, x-elchi-shield: blocked   (reason: apikey.missing)

# Blocked request: a read-only key hitting a write-scoped path
curl -i -X POST https://auth.example.com/v1/admin/users \
  -H "X-Api-Key: $PARTNER_A_KEY"
# → 403, x-elchi-shield: blocked   (reason: apikey.scope)
```

## Gotchas

:::warning[Bindings are prefix matches]
`path_prefix: /admin` also matches `/administrator`. Use trailing slashes deliberately (e.g. `/admin/`) when you mean a directory-style boundary.
:::

- **Prefer `source: header`** — query-string keys leak into URLs, access logs, and `Referer` headers.
- Config stores only **digests** — an exposed config file doesn't leak usable keys. (The lookup is a hash-map lookup, not a constant-time compare; the secret is the SHA-256 preimage.)
- **Duplicate keys are a load error** — two entries hashing to the same digest fail config validation.
- A missing or unknown key blocks deterministically; `fail_open` governs internal engine errors only. See [modes and postures](/shield/policies/modes-and-postures).
