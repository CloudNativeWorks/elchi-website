---
title: JWT
description: Static-key bearer JWT validation with a hard algorithm allow-list, mandatory expiry, and required-claims enforcement.
sidebar_position: 2
tags: [shield, engine]
---

The `jwt` engine validates a bearer JSON Web Token against a **static key** — a shared HMAC secret or a PEM public key. It runs at the **header phase** (the body is never buffered for it) and inspects **requests only**. A missing or invalid token always blocks with a **403**; there is no anonymous pass-through, and `fail_open` does not let a bad credential through — the fail posture only governs rare internal engine errors.

If you need key **rotation** or an IdP-published key set, use the [`jwks` engine](/shield/engines/jwks) instead — `jwt` is deliberately single-key.

## When to use it

- A service-to-service or partner API where tokens are signed with one known key that rarely changes.
- Symmetric (`HS*`) setups where both sides share a secret and no JWKS endpoint exists.
- Pinning a single asymmetric public key (`RS*`/`ES*`/`PS*`/`EdDSA`) without depending on any network fetch.
- Enforcing that specific claims (`sub`, `scope`, …) are present before a request reaches the upstream.

## Configuration

Configure under `policy.engines.jwt`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `issuer` | string | no | — | Expected `iss`. |
| `audience` | string | no | — | Expected `aud`. |
| `algorithms` | string[] | **yes** | — | Allowlist. `HS256/384/512`, `RS256/384/512`, `ES256/384/512`, `PS256/384/512`, `EdDSA`. **`none` is rejected.** |
| `hmac_secret` | string | one-of | — | Symmetric key (for `HS*`). |
| `public_key_file` | string | one-of | — | PEM file (for `RS*`/`ES*`/`PS*`/`EdDSA`). |
| `required_claims` | string[] | no | — | Claims that must be present. |
| `header_name` | string | no | `Authorization` | Header carrying the token. |
| `leeway` | duration | no | `0` (strict) | Clock-skew tolerance for `exp`/`nbf`/`iat`. `≥ 0`, `≤ 5m`. |

:::info[Exactly one key]
Set exactly **one** of `hmac_secret` / `public_key_file`. Mixing symmetric and asymmetric keys in one verifier is what enables algorithm-confusion attacks, so the config schema forbids it. The key family must also match the listed algorithms — an HS secret can't verify an RS token, and vice-versa; a mismatch fails at config load, not by silently rejecting every token.
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-jwt
spec:
  defaults:
    mode: block
    fail_mode: fail_close   # auth failures should fail closed

  domains:
    - hosts: ["secure.example.com"]
      routes:
        # Protected API: every request must carry a valid JWT.
        - match:
            path_prefix: "/api/"
          policy:
            mode: block
            engines:
              jwt:
                issuer: "https://auth.example.com/"
                audience: "secure-api"
                algorithms: ["RS256"]
                public_key_file: "/etc/elchi/elchi-shield/keys/jwt-pub.pem"
                required_claims: ["sub", "scope"]
                leeway: 30s
                # header_name defaults to Authorization (Bearer <token>)
```

## How it decides

For each request, in order:

1. Read the token header (default `Authorization`). Missing or blank ⇒ block **`jwt.missing`**.
2. Strip a case-insensitive `Bearer ` prefix.
3. Parse and verify the token. Any failure — bad signature, expired, wrong `iss`/`aud`, disallowed `alg` ⇒ block **`jwt.invalid`**.
4. Enforce `required_claims`: each must be present **and** non-empty ⇒ otherwise block **`jwt.missing_claim`**.
5. Otherwise allow.

**A token with no `exp` is always rejected** — expiry is mandatory, not optional. Block reasons are fixed strings with stable rule IDs; the token, claims, and library error text never appear in logs or audit events.

The policy [`mode`](/shield/policies/modes-and-postures) maps the verdict: `block` returns the 403, `detect`/`shadow` record the finding and allow.

## Envoy prerequisites

Nothing beyond the standard `ext_proc` filter wiring — the engine reads only the request headers Envoy already forwards. See [Envoy wiring](/shield/envoy-wiring).

## Verify

```bash
# Passing request: a valid token signed by the configured key
curl -i https://secure.example.com/api/orders \
  -H "Authorization: Bearer $VALID_JWT"
# → 200 from the upstream

# Blocked request: no token at all
curl -i https://secure.example.com/api/orders
# → 403, x-elchi-shield: blocked   (reason: jwt.missing)

# Blocked request: expired / wrong-key / alg-swapped token
curl -i https://secure.example.com/api/orders \
  -H "Authorization: Bearer $TAMPERED_JWT"
# → 403, x-elchi-shield: blocked   (reason: jwt.invalid)
```

## Gotchas

:::warning[leeway defaults to 0]
`leeway: 0` (the default) is strict: under real-world clock skew, tokens near `exp`/`nbf` get rejected. Set a small leeway (e.g. `30s`) in production.
:::

- **Algorithm confusion is doubly defended:** the `algorithms` allow-list becomes the valid-methods set, *plus* a type-gated key function hands the HMAC secret only to HMAC methods and the public key only to asymmetric ones. `alg: none` is refused outright.
- **Key/algorithm mismatch fails at load** — a configured algorithm that doesn't match the key type fails the config reload, so you learn at reload time instead of debugging silently rejected tokens.
- An empty-string, empty-array, or empty-object claim counts as "missing" for `required_claims`; numeric `0` and boolean `false` do **not**.
- A missing or invalid credential blocks **deterministically** — `fail_open` never applies to it (it governs internal engine errors only). See [modes and postures](/shield/policies/modes-and-postures).
