---
title: HTTP Message Signatures
description: RFC 9421 HTTP Message Signature verification (hmac-sha256) with covered-component control, content-digest body binding, and freshness enforcement.
sidebar_position: 6
tags: [shield, engine]
---

The `http_signature` engine verifies **RFC 9421 HTTP Message Signatures**, pinned to **`hmac-sha256`** — no algorithm negotiation, no asymmetric-confusion surface. The client signs a set of *covered components* (`@method`, `@path`, headers, …) and Shield verifies the signature against a shared secret. It runs at the **header phase**, moving to the **body phase** only when the signature covers `content-digest` (which binds the body). Requests only; a failed signature always blocks with a **403** (`fail_open` does not apply to a bad credential). It is stateful only through the replay cache it shares with [`hmac_sign`](/shield/engines/hmac-signing).

Prefer this engine over `hmac_sign` when you want a **standards-based** scheme with off-the-shelf client libraries; prefer `hmac_sign` when you control both ends and want the simpler native canonical string.

## When to use it

- Interop with clients/ecosystems that already speak RFC 9421 (standard `Signature` / `Signature-Input` headers).
- Signing that must cover specific message components — method, authority, path, query, selected headers — under a standardized canonicalization.
- Body integrity via the standard `Content-Digest` mechanism instead of a custom digest header.

## Configuration

Configure under `policy.engines.http_signature`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `secret` | string | **yes** | — | Shared HMAC key. **≥ 64 bytes** (RFC 9421 hmac-sha256 requirement). |
| `signature_name` | string | no | `sig1` | Label expected in `Signature-Input`. |
| `covered_components` | string[] | no | `@method`, `@authority`, `@path` (+`@query` covered by default) | Components the signature must cover. |
| `max_age` | duration | no | `10s` | Reject a signature whose `created` is older than this. `≥ 0`, `≤ 1h`. |

:::info[Freshness is always enforced]
Freshness checking is **always on** — the underlying RFC 9421 verifier defaults to requiring `created` and rejecting anything older than ~10s. Setting `max_age: 0` does **not** disable it (it falls back to that ~10s default); `max_age` only *widens or tightens* the window. Set it to the tightest value your clients' clock skew allows. (Note: replay protection is separate — it only applies when the client sends a `nonce`.)
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-httpsig
spec:
  defaults:
    mode: block
    fail_mode: fail_close

  domains:
    - hosts: ["auth.example.com"]
      routes:
        - match:
            path_prefix: "/partner/"
          policy:
            mode: block
            inspect_request_body: true    # needed because content-digest is covered
            engines:
              http_signature:
                # RFC 9421 hmac-sha256 requires a key of at least 64 bytes.
                secret: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
                signature_name: sig1
                covered_components:
                  - "@method"
                  - "@authority"
                  - "@path"
                  - "content-digest"      # binds the body to the signature
                max_age: 30s              # explicit freshness window
```

## How it decides

1. Verify the RFC 9421 signature (label `signature_name` in `Signature-Input`) over the covered components with the shared secret. Any failure ⇒ block **`httpsig.invalid`**.
2. **If `content-digest` is covered**, additionally:
   - require the `Content-Digest` header to be present ⇒ otherwise block **`httpsig.digest_missing`**;
   - **recompute the digest over the actual body** and compare ⇒ mismatch ⇒ block **`httpsig.digest_mismatch`**. This step exists because the signature alone only proves it covered the *header value*, not that the header value matches the body.
3. Freshness: the signature's `created` timestamp is checked and one older than the freshness window is rejected. `max_age` sets that window; `max_age: 0` falls back to the verifier's built-in ~10s default (it does not turn freshness off).
4. Replay: when the client sends a **`nonce`** signature parameter, it is checked against the shared replay cache (see below); a reused nonce is rejected.

### The shared replay cache

`http_signature` and `hmac_sign` share a sharded, TTL-bounded **two-generation** replay cache: each shard keeps a current and a previous nonce map, rotating (rather than wiping) when the current fills at 16384 nonces/shard, with previous-generation hits promoted back. Evicting a victim's nonce requires flooding two full generations of same-shard nonces within the TTL. Memory is bounded to about 2× the shard cap.

## Envoy prerequisites

Nothing beyond the standard `ext_proc` filter wiring. See [Envoy wiring](/shield/envoy-wiring). (When `content-digest` is covered, the request body is buffered and inspected under the policy's body limits — see [body inspection](/shield/policies/body-inspection).)

## Verify

Producing a valid RFC 9421 signature by hand is impractical — use an RFC 9421 client library (most languages have one) for the passing case:

```bash
# Passing request: signed by an RFC 9421 client library with the shared secret,
# covering @method, @authority, @path and content-digest.
curl -i -X POST https://auth.example.com/partner/orders \
  -H "Signature-Input: $SIG_INPUT" \
  -H "Signature: $SIG" \
  -H "Content-Digest: $DIGEST" \
  -d '{"order":"42"}'
# → 200 from the upstream

# Blocked request: no signature headers at all
curl -i -X POST https://auth.example.com/partner/orders -d '{"order":"42"}'
# → 403, x-elchi-shield: blocked   (reason: httpsig.invalid)

# Blocked request: valid signature but the body was swapped after signing
curl -i -X POST https://auth.example.com/partner/orders \
  -H "Signature-Input: $SIG_INPUT" \
  -H "Signature: $SIG" \
  -H "Content-Digest: $DIGEST" \
  -d '{"order":"9999"}'
# → 403, x-elchi-shield: blocked   (reason: httpsig.digest_mismatch)
```

## Gotchas

:::warning[Replay protection is conditional]
Replay protection applies **only when the client sends a `nonce`** signature parameter (the library invokes the nonce validator only then). A client that sends no nonce is not replay-protected — it relies solely on the freshness window (which is always enforced, ~10s by default, tunable via `max_age`). For true replay protection on repeatable requests, require your clients to send nonces.
:::

- **Bind the body:** include `content-digest` in `covered_components` for any body-bearing endpoint, or the body isn't bound to the signature.
- **The algorithm is pinned** to `hmac-sha256` — there is no negotiation a client (or attacker) can downgrade.
- The `secret` must be **≥ 64 bytes**; shorter keys are rejected at config load.
- A failed or missing signature blocks deterministically; `fail_open` governs internal engine errors only. See [modes and postures](/shield/policies/modes-and-postures).
