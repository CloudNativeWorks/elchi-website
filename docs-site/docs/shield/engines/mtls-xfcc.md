---
title: mTLS Identity (XFCC)
description: Authenticate by the mTLS client-certificate identity Envoy forwards in x-forwarded-client-cert — SPIFFE/DNS SANs, subjects, or fingerprints.
sidebar_position: 7
tags: [shield, engine]
---

The `xfcc` engine authenticates requests by the **mTLS client-certificate identity that Envoy verified and forwarded** in the `x-forwarded-client-cert` (XFCC) header. Shield itself never sees the TLS handshake — it trusts that Envoy verified the peer certificate and matches the forwarded identity against an allow-list of SPIFFE/URI SANs, DNS SANs, subjects, or certificate fingerprints. It runs at the **header phase**, inspects **requests only**, and an allow-list miss blocks with a **403**. This engine has the most subtle trust model of the authentication engines — read the [gotchas](#gotchas) before deploying it.

## When to use it

- Zero-trust service-to-service auth: only workloads presenting an allow-listed SPIFFE ID (or DNS SAN) may call this route.
- Enforcing that a client certificate was presented at all (`require_present`) on listeners that terminate mTLS.
- Pinning specific certificates by fingerprint for a small set of known clients.

## Configuration

Configure under `policy.engines.xfcc`.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `header_name` | string | no | `x-forwarded-client-cert` | XFCC header. |
| `require_present` | bool | no | `false` | Require the XFCC header (presence-only auth). |
| `uris` | string[] | — | — | Allowed SPIFFE/URI SANs. |
| `dns_names` | string[] | — | — | Allowed DNS SANs (case-insensitive). |
| `subjects` | string[] | — | — | Allowed certificate subjects. |
| `hashes` | string[] | — | — | Allowed cert fingerprints. |

:::info Validation rule
`require_present: true` **or** at least one allow-list dimension (`uris`/`dns_names`/`subjects`/`hashes`) is required. The allow-list dimensions are **OR'd** — a certificate matching any one of them is allowed.
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-mtls
spec:
  defaults:
    mode: block
    fail_mode: fail_close

  domains:
    - hosts: ["mtls.example.com"]
      routes:
        # mTLS identity: require a client cert whose SPIFFE ID (or DNS SAN)
        # is allow-listed. Envoy must set XFCC from the verified peer cert
        # (set_current_client_cert_details + SANITIZE_SET).
        - match:
            path_prefix: "/mtls/"
          policy:
            mode: block
            engines:
              xfcc:
                require_present: true
                uris:
                  - "spiffe://cluster.local/ns/payments/sa/checkout"
                dns_names:
                  - "checkout.payments.svc"
```

## How it decides

1. Read the XFCC header (default `x-forwarded-client-cert`). Missing or blank:
   - `require_present: true` ⇒ block **`xfcc.missing`**;
   - otherwise ⇒ allow (pass-through).
2. If no allow-list is configured ⇒ allow (presence-only auth).
3. Otherwise parse the header and match **ONLY the last (rightmost) element** — the one Envoy appended for the verified peer:
   - a match in **any** of `subjects` (DN), `hashes` (cert fingerprint, case-insensitive), `uris` (SANs, e.g. SPIFFE IDs), or `dns_names` (SANs, case-insensitive) ⇒ allow;
   - no match ⇒ block **`xfcc.no_match`**.

Parsing is **quote/escape-aware**, so a `\"` inside a Subject DN cannot smuggle a comma or semicolon to forge element or field boundaries.

## Envoy prerequisites

This engine **requires** Envoy configuration beyond the standard `ext_proc` wiring — without it, the XFCC header is either absent or attacker-influencable:

- The listener must terminate **mTLS** and **verify** the client certificate.
- The HTTP connection manager must forward the verified identity and **strip anything client-supplied**:

```yaml
http_connection_manager:
  forward_client_cert_details: SANITIZE_SET
  set_current_client_cert_details:
    uri: true
    dns: true
    subject: true
    cert: true
```

:::danger SANITIZE_SET is mandatory
`SANITIZE_SET` replaces any client-supplied XFCC header with the identity Envoy itself verified. Under `APPEND_FORWARD`, earlier XFCC elements can be client-supplied — the engine defends by matching only the rightmost element, but the trusted configuration is `SANITIZE_SET`. The engine trusts that Envoy verified the peer certificate; it cannot detect spoofing itself.
:::

See [Envoy wiring](/shield/envoy-wiring) for the full listener setup.

## Verify

```bash
# Passing request: present the allow-listed client certificate to Envoy
curl -i https://mtls.example.com/mtls/transfer \
  --cert checkout.crt --key checkout.key --cacert ca.crt
# → 200 from the upstream

# Blocked request: a valid mTLS handshake, but an identity not on the allow-list
curl -i https://mtls.example.com/mtls/transfer \
  --cert other-service.crt --key other-service.key --cacert ca.crt
# → 403, x-elchi-shield: blocked   (reason: xfcc.no_match)

# Blocked request: no client certificate (with require_present: true on a
# listener where the cert is optional)
curl -i https://mtls.example.com/mtls/transfer --cacert ca.crt
# → 403, x-elchi-shield: blocked   (reason: xfcc.missing)
```

## Gotchas

:::danger "Auth that authenticates nothing"
`require_present: false` with no allow-list is a **no-op** — the engine always allows. It is easy to misconfigure this into auth that authenticates nothing. For real enforcement you need an allow-list (and usually `require_present: true`).
:::

- **Only the rightmost XFCC element is trusted.** Envoy appends the verified-peer identity last; earlier elements can be client-supplied under `APPEND_FORWARD`. Matching them would let a client prepend a forged allow-listed identity — which is why the engine never does, and why you should run `SANITIZE_SET`.
- The allow-list dimensions are **OR'd**, not AND'd — adding a broad `dns_names` entry can unintentionally widen access even when `uris` is strict.
- A block from this engine is deterministic; `fail_open` governs internal engine errors only. See [modes and postures](/shield/policies/modes-and-postures).
