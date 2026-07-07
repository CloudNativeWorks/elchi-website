---
title: HMAC Signing
description: Native HMAC request signing with a timestamp window, nonce replay protection, key-id rotation, and optional body-digest binding.
sidebar_position: 5
tags: [shield, engine]
---

The `hmac_sign` engine verifies a **native HMAC request signature**: the client signs a canonical string with a shared secret and sends the hex MAC plus a timestamp (and optionally a nonce). Shield enforces a symmetric **timestamp window**, replays are caught by a shared **replay cache**, and with `require_body_digest` the signature also binds the body. It runs at the **header phase** — flipping to the **body phase** only when `require_body_digest` is set — inspects **requests only**, and a missing or invalid signature always blocks with a **403** (`fail_open` does not apply to a bad credential). It is one of the two stateful auth engines (it shares the replay cache with [`http_signature`](/shield/engines/http-signature)).

## When to use it

- Webhook receivers: verify that the caller holds the shared secret and that the payload wasn't replayed or tampered with.
- Server-to-server APIs where a lightweight custom signing scheme is preferred over RFC 9421.
- Secret rotation without downtime, using the `secrets` map with a client-sent key id.

## Configuration

Configure under `policy.engines.hmac_sign`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `secret` | string | one-of | — | Shared secret. **≥ 16 bytes.** |
| `secrets` | map[string]string | one-of | — | Per-key-id secrets for rotation (each **≥ 16 bytes**). |
| `signature_header` | string | no | `X-Signature` | Header carrying the signature. |
| `timestamp_header` | string | no | `X-Timestamp` | Header carrying the epoch-seconds timestamp. |
| `nonce_header` | string | no | `X-Nonce` | Header carrying the nonce. |
| `key_id_header` | string | no | `X-Key-Id` | Header selecting the key id (with `secrets`). |
| `algorithm` | string | no | `sha256` | `sha256` \| `sha512`. |
| `window` | duration | no | `5m` | Timestamp acceptance window. `0` (use default) or `≥ 1s`; `≤ 1h`. |
| `nonce_ttl` | duration | no | `= 2 × window` | Replay-cache TTL. Defaults to twice the window so a signature stays un-replayable for its full acceptance lifetime (a timestamp skewed up to `+window` into the future is valid until `ts + window`). `≤ 1h`. |
| `require_nonce` | bool | no | `false` | Require a nonce (else identical replays within the window are caught by the timestamp). |
| `require_body_digest` | bool | no | `false` | Require the signature to bind a body digest. |

:::info[Exactly one secret source]
Set exactly **one** of `secret` / `secrets`.
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-hmac
spec:
  defaults:
    mode: block
    fail_mode: fail_close

  domains:
    - hosts: ["auth.example.com"]
      routes:
        # HMAC request signing (native scheme). The client signs the canonical
        # string  METHOD\npath\ntimestamp\nnonce\nbody-sha256  and sends the hex
        # MAC plus the timestamp (and optionally a nonce for replay protection).
        - match:
            path_prefix: "/webhook/"
          policy:
            mode: block
            engines:
              hmac_sign:
                # Either a single `secret`, or `secrets` (key-id → secret) for
                # rotation with the client sending X-Key-Id.
                secrets:
                  "2024": "old-shared-secret"
                  "2025": "current-shared-secret"
                algorithm: sha256         # sha256 | sha512
                window: 300s              # timestamp tolerance
                nonce_ttl: 600s
                require_nonce: true       # mandate a nonce (replay protection)
                require_body_digest: true # cover the body (engine buffers it)
```

## How it decides

**Canonical string signed:**

```
method \n path \n timestamp \n nonce \n body-sha256
```

The path is the **full path including the query** — a tampered query breaks the signature. `body-sha256` is included only when `require_body_digest` is set.

Checks run in this order, each with a fixed block reason:

1. Missing signature ⇒ **`sig.missing`**.
2. Non-hex signature ⇒ **`sig.invalid`**.
3. Unparseable timestamp (unix seconds) ⇒ **`sig.invalid_timestamp`**.
4. Window check `|now − ts| ≤ window` — **symmetric**, so a far-future timestamp is rejected too ⇒ **`sig.stale`**.
5. `require_nonce` set but no nonce sent ⇒ **`sig.nonce_missing`**.
6. Resolve the secret — by the `key_id_header` value when the `secrets` map is used; an unknown key id ⇒ **`sig.unknown_key`**.
7. **Constant-time** MAC comparison ⇒ mismatch ⇒ **`sig.invalid`**.
8. **Only after the MAC verifies**, the replay check (keyed on the nonce, or the verified MAC hex when no nonce was sent) ⇒ replay ⇒ **`sig.replayed`**.

### The shared replay cache

`hmac_sign` and `http_signature` share a sharded, TTL-bounded **two-generation** replay cache. Each shard keeps a current and a previous nonce map; when the current fills (16384 nonces/shard) it **rotates** (previous = current) rather than wiping, and a hit in the previous generation is promoted back into the current one. To evict a victim's nonce and replay a captured request, an attacker must flood **two full generations** of distinct same-shard nonces within the TTL — far harder than defeating a single-wipe cache. Memory is bounded to about 2× the shard cap.

## Envoy prerequisites

Nothing beyond the standard `ext_proc` filter wiring. See [Envoy wiring](/shield/envoy-wiring). (With `require_body_digest`, the request body is buffered and inspected under the policy's body limits — see [body inspection](/shield/policies/body-inspection).)

## Verify

```bash
SECRET='current-shared-secret'
TS=$(date +%s)
NONCE=$(uuidgen)
BODY='{"event":"ping"}'
BODY_SHA=$(printf '%s' "$BODY" | shasum -a 256 | cut -d' ' -f1)
SIG=$(printf 'POST\n/webhook/github\n%s\n%s\n%s' "$TS" "$NONCE" "$BODY_SHA" \
  | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Passing request: fresh timestamp, unused nonce, valid MAC
curl -i -X POST https://auth.example.com/webhook/github \
  -H "X-Key-Id: 2025" -H "X-Timestamp: $TS" -H "X-Nonce: $NONCE" \
  -H "X-Signature: $SIG" -d "$BODY"
# → 200 from the upstream

# Blocked request: replaying the exact same request (nonce already seen)
curl -i -X POST https://auth.example.com/webhook/github \
  -H "X-Key-Id: 2025" -H "X-Timestamp: $TS" -H "X-Nonce: $NONCE" \
  -H "X-Signature: $SIG" -d "$BODY"
# → 403, x-elchi-shield: blocked   (reason: sig.replayed)

# Blocked request: no signature at all
curl -i -X POST https://auth.example.com/webhook/github -d "$BODY"
# → 403, x-elchi-shield: blocked   (reason: sig.missing)
```

## Gotchas

:::warning[Body binding is opt-in]
Without `require_body_digest` the body is **not** bound by the signature and can be swapped under a captured header-only signature. Turn it on for any body-bearing endpoint.
:::

- **Replay is recorded only for *verified* requests** — an attacker can't pre-burn a victim's nonce with a bogus signature.
- **Replay works even without a nonce** (identical requests collide on the MAC within the window) — but two *legitimately identical* requests within the window also collide, so clients that legitimately repeat need a nonce.
- Keep `nonce_ttl ≥ window`, or a nonce can expire before its signature goes stale, reopening a replay window (the default ties them together).
- Secrets must be **≥ 16 bytes** — shorter values are rejected at config load.
- A missing or invalid signature blocks deterministically; `fail_open` governs internal engine errors only. See [modes and postures](/shield/policies/modes-and-postures).
