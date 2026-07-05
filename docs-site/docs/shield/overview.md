---
title: "Shield: API Security Overview"
description: Elchi Shield is a local Envoy ext_proc API-security and WAF sidecar — 12 security engines enforced entirely on the edge host, configured by files, hot-reloaded atomically.
sidebar_position: 1
tags: [shield, security]
---

Elchi Shield (`elchi-shield`) is a **local Envoy `ext_proc` API-security / WAF engine**. It runs as a sidecar next to Envoy on each edge host, inspects request and response headers and (optionally) bodies through an ordered, Envoy-style security filter pipeline, and returns a per-request decision: **allow**, **block** (an immediate `403`), or record-only **detect** / **shadow**.

Envoy streams each transaction's headers and body chunks to Shield over a local socket (Unix domain socket preferred); Shield answers with allow/block/continue verdicts before the request reaches your backend.

## Where Shield sits in the stack

Shield is strictly a **data-plane sidecar** — it never runs in the central management plane, and data-plane traffic never leaves the box:

- **Downstream → Envoy → Shield → decision.** All inspection happens locally over the `ext_proc` gRPC stream. Nothing is forwarded off-box except (optionally) redacted audit events and metrics.
- **Config arrives as files.** The management plane distributes configuration only: the edge agent (`elchi-client`) writes policy files into a watched directory (`/etc/elchi/elchi-shield/conf.d`). It never calls Shield's API per config change.
- **Hot-reloaded, atomically.** Shield watches the directory, debounces changes, and swaps in a fully validated, precompiled config snapshot with a single atomic pointer swap. **Invalid config never affects live traffic** — the last valid snapshot stays active, and the failure is logged with the offending file and field.
- **Restart-safe.** On boot, Shield reloads the last valid config from disk, and it starts safely even with no config at all (empty snapshot, default posture) rather than blackholing traffic.

## Shield and the WAF (WASM) feature

Elchi already ships an integrated [WAF](/traffic-and-certificates/waf): Coraza with the OWASP Core Rule Set, delivered as an **Envoy WASM filter** through the normal xDS configuration path. Shield is a **parallel, complementary delivery** — a separate `ext_proc` sidecar process with its own file-driven policy model — not a replacement wired into that path.

| | WAF (WASM filter) | Shield (ext_proc sidecar) |
|---|---|---|
| Runs | Inside the Envoy process | As a separate local sidecar |
| Delivery | xDS snapshot (WASM extension config) | Policy files written by elchi-client, hot-reloaded |
| Scope | Coraza / OWASP CRS rules | 12 engines (including the same embedded OWASP CRS), plus built-in checks, DLP, anomaly scoring |
| Policy granularity | Rule scoping | Per-host / per-route policies with modes, fail postures, orderable pipelines |
| Rollout modes | Rule-level tuning | `block` / `detect` / `shadow` / `off` per policy scope |

**When to use which:** use the WASM WAF when CRS-style rule filtering managed inline with your Envoy configuration is all you need. Use Shield when you need richer API security — authentication engines, rate limiting, bot detection, IP reputation, GraphQL/OpenAPI guards, DLP — or safe staged rollout with detect/shadow modes and per-route policies. Both can coexist on the same edge.

## The engine catalog

Beyond built-in header/body checks (required/forbidden headers, JSON validation, sensitive-data detection), a policy can run any combination of **12 pluggable security engines**. Engines are compiled per policy, so different domains and routes can enforce different things (for example, different JWT issuers per domain).

| Category | Engine | What it does |
|---|---|---|
| **Authentication** | [JWT](/shield/engines/jwt) | Bearer-JWT validation with a static HMAC or PEM public key |
| | [JWKS](/shield/engines/jwks) | JWT validation against a JWK Set (local file or remote URL) with key rotation |
| | [API Key](/shield/engines/api-key) | SHA-256-hashed keys with scope-to-path bindings |
| | [HMAC Signing](/shield/engines/hmac-signing) | Native HMAC request signing: timestamp window, nonce replay protection, body-digest binding |
| | [HTTP Signature](/shield/engines/http-signature) | RFC 9421 HTTP Message Signatures |
| | [mTLS / XFCC](/shield/engines/mtls-xfcc) | Authentication by Envoy's forwarded mTLS client-cert identity |
| **Traffic & reputation** | [IP Reputation](/shield/engines/ip-reputation) | CIDR allow/deny, threat-intel feeds, GeoIP/ASN blocking |
| | [Rate Limit](/shield/engines/rate-limit) | Per-key token-bucket limiting (`429` + `Retry-After`) |
| | [Bot Detection](/shield/engines/bot-detection) | Layered scorer: verified crawlers, UA rules, JA3/JA4 fingerprints, header heuristics |
| **Content inspection** | [Coraza WAF](/shield/engines/coraza-waf) | Full ModSecurity-style WAF with the embedded OWASP Core Rule Set |
| | [GraphQL](/shield/engines/graphql) | Query depth/alias/field/batch limits, introspection blocking |
| | [OpenAPI Validation](/shield/engines/openapi-validation) | Positive-security validation against an OpenAPI 3.x spec |

Two content protections ride alongside the engines as built-in body checks: **DLP** (block hard secrets, redact PII in place via body mutation) and **sensitive-data detection**. Engines run in the policy's order and aggregate with "most severe wins"; scoring engines can also contribute to a per-request [anomaly score](/shield/anomaly-scoring) instead of blocking individually.

## Safety posture

Shield is built to be a safe thing to put in the request path:

- **It never crashes the process.** A panic — including one inside a third-party engine — is recovered at the stream boundary; one stream fails, all others keep serving.
- **Loopback-only by design.** Non-loopback TCP binds are refused by default; the preferred transport is a Unix domain socket, local by construction. The sidecar is never exposed externally.
- **Fail-open by default.** Each policy declares an explicit fail posture (`fail_open` / `fail_close`) for inspection errors and timeouts, and the default posture when no policy resolves is fail-open — a bug in an engine never blackholes traffic globally. (A missing or invalid credential is a normal block verdict, not an error, and blocks regardless of the posture.)
- **Resource bounds everywhere.** Header-size and body-size caps, per-policy timeouts, and a process-wide in-flight body budget; over-limit bodies are blocked, never partially inspected.

## Next steps

- [How Shield Works](/shield/how-it-works) — the request pipeline, phases, structural protections, and hot reload.
- [Get Started with Shield](/shield/getting-started) — deploy your first policy in about 10 minutes.
- [Policy Model](/shield/policies/policy-model) — hosts, routes, inheritance, and precedence.
