---
title: Risk Flags Reference
description: The complete catalog of API Discovery risk flags — grouped by class, with severity, OWASP API Top-10 mapping, meaning, and remediation for every flag.
sidebar_position: 5
tags: [api-discovery]
---

This is the authoritative reference for every risk flag the `elchi-collector` can raise on an endpoint. Flags are grouped by **class**; each entry lists its id, severity (Low 1 · Medium 4 · High 7 · Critical 10), OWASP API Security Top-10 (2023) mapping where one applies, a one-line meaning, and the primary remediation.

Which **scoring axis** a flag feeds — **Threat** (`max_risk_score`) or **Exposure** (`max_posture_score`) — is set by a fixed posture-flag list, not by class; see [Risk Scoring](/api-discovery/risk-scoring). Posture/exposure flags are called out below.

Remediation `kind`: **Envoy filter** = add/tune an HTTP filter on the listener's HCM · **TLS / transport** = fix at the listener transport socket / codec · **App-side** = Envoy can't fix it, the app or IdP must · **Informational** = contextual signal, no action.

:::note[How flags persist]
Per-event flags live in ClickHouse `api_events_raw` (TTL'd). Per-endpoint, each fired flag is `$addToSet`-merged into `api_inventory.risk_flags`, so an endpoint's flag set is the **union of everything seen since the row was created**. To clear a flag after a fix, delete the inventory row (or use the reset action) and let it rebuild from fresh traffic.
:::

## Auth

Authentication / authorization posture.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `unauthenticated` | Medium | API2 | Request carried no recognised auth header (Authorization / Cookie / X-Api-Key / …). Expected on public endpoints; a signal in clusters on sensitive paths. **Exposure axis.** | Informational if the endpoint is meant to be public. Otherwise add a JWT Authentication (or OAuth2 / Basic Auth) filter + an RBAC filter requiring an authenticated principal. **Envoy filter.** |
| `weak_token_ttl` | High | API2 | A JWT bearer token's lifetime (`exp − iat`) exceeds the configured threshold (default 30d). Long-lived tokens are effectively static credentials. **Exposure axis.** | Shorten access-token TTL at the IdP (minutes, not days); rely on refresh tokens. Enforce JWT validation at the edge. **App-side.** |

## Attack pattern

Behavioural detectors and probe signatures firing on probable abuse.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `brute_force_suspect` | Critical | API2 | Many auth-endpoint 4xx failures from one consumer or source IP inside a rolling window — credential stuffing / password spraying. *Stateful (windowed).* | Add a Local Rate Limit filter on the auth routes (e.g. 5–10 req/min/IP, 429 on over-limit); Ext Authz for a cluster-wide limiter. **Envoy filter.** |
| `payment_abuse_suspect` | Critical | API6 | One consumer hitting a payment endpoint far more than a normal user — card-testing / fraud automation. *Stateful (windowed).* | Local Rate Limit scoped to payment routes + require strong auth (JWT); Ext Authz for velocity/fraud scoring. **Envoy filter.** |
| `threat_intel_hit` | Critical | API8 | Source IP matched a configured threat-intel feed (Spamhaus DROP, AbuseIPDB, custom). *Enricher.* | RBAC deny policy for the offending source-IP CIDRs; front the listener with the WAF for feed-driven blocking. **Envoy filter.** |
| `bfla_suspect` | Critical | API5 | Broken Function-Level Authorization — a consumer reached a privileged function/operation it shouldn't be able to call (the function-level counterpart of BOLA). | RBAC binding privileged routes to permitted roles, driven from verified JWT claims; Ext Authz for per-tenant decisions. **Envoy filter.** |
| `bola_suspect` | High | API1 | One consumer tried many distinct `{id}` values on the same endpoint within the window — object enumeration. *Stateful (windowed).* | The real fix is an ownership check in the upstream. At the edge: RBAC + JWT to constrain access, Local Rate Limit to slow enumeration. **Envoy filter.** |
| `rate_anomaly` | High | API4 | One consumer is exceeding the per-consumer request-rate threshold — abusive client, runaway integration, scraping. *Stateful (windowed); off by default.* | Per-consumer Local Rate Limit (429 + Retry-After); Ext Authz for a shared cross-instance limit. **Envoy filter.** |
| `replay_suspect` | High | API8 | The same `request_id` appeared more than once in the replay window — replay attack, buggy retrying client, or a duplicated log pipeline. *Stateful (windowed).* | Make state-changing endpoints idempotent (idempotency key / nonce, reject repeats); check for a duplicated collector/access-log pipeline; Local Rate Limit for bursts. **App-side.** |
| `scanner_user_agent` | High | API8 | User-Agent matched a known scanner / pen-test tool (sqlmap, nuclei, nikto, …). Spoofable — corroborate. *Enricher.* | RBAC deny on the scanner UA values, but never alone — combine with rate limiting + WAF and correlate with behavioural flags. **Envoy filter.** |
| `vuln_probe_path` | High | API8 | The leading path segment targets a well-known leak/exploit file (`.env`, `.git`, `.aws`, `wp-login.php`, `server-status`, …). Never legitimate against an API. | RBAC deny the probe prefixes outright; confirm none of these files are actually served; front with WAF for updated signatures. **Envoy filter.** |
| `path_scan_suspect` | High | API8 | One source IP / consumer hit many distinct 4xx paths — content-discovery / directory-brute tools (gobuster, ffuf, dirb). *Stateful (windowed).* | Local Rate Limit so one IP can't fan out fast; RBAC deny sustained scanning CIDRs. **Envoy filter.** |
| `impossible_travel` | High | API2 | The same consumer / IP appeared from two locations too far apart to travel between in the elapsed time — stolen credential or token replay. *Stateful (windowed); needs GeoIP.* | Treat the consumer as compromised: force re-auth, revoke sessions/tokens; add step-up MFA; shorten token TTLs. **App-side.** |
| `ip_rate_anomaly` | High | API4 | One source IP is exceeding the per-IP request-rate threshold — automated abuse or a misbehaving client. *Stateful (windowed); off by default.* | Per-source-IP Local Rate Limit; a Network Local Rate Limit filter to cap connections per IP before the HTTP layer. **Envoy filter.** |
| `unsafe_method_on_readonly` | Medium | API8 | A state-changing method (POST/PUT/DELETE/PATCH) hit a path reserved for read-only probes (`/healthz`, `/metrics`, `/favicon.ico`, `/robots.txt`). | RBAC permitting only GET/HEAD on probe paths; confirm the upstream exposes no write handler there. **Envoy filter.** |

## Transport

Connection-layer hygiene. Every transport flag is on the **Exposure axis**.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `weak_tls_version` | Critical | API8 | Connection negotiated TLS 1.0 or 1.1 — deprecated, known-weak. Forbidden under PCI-DSS. *Toggle: `weak_tls`.* | Set the listener's DownstreamTlsContext minimum protocol to `TLSv1_2` (prefer `TLSv1_3`). **TLS / transport.** |
| `plain_text_transport` | High | API8 | Served over plain HTTP with no TLS — anyone on the path can read/modify traffic. | Add a TLS transport socket with a valid cert; keep the plain-HTTP listener only as a 301 redirect to `https://`. **TLS / transport.** |
| `missing_hsts` | High | API8 | A 2xx TLS response lacked `Strict-Transport-Security` — enables SSL-strip / downgrade. Does not fire on 3xx or non-2xx. *Toggle: `missing_hsts`.* | Header Mutation filter appending `Strict-Transport-Security: max-age=31536000; includeSubDomains` on TLS listeners only. **Envoy filter.** |
| `legacy_protocol` | Medium | — | Request used HTTP/1.0 or HTTP/1.1 rather than HTTP/2/3. Hygiene, not an attack. | Enable HTTP/2 on the HCM (codec AUTO/HTTP2), advertise `h2` via ALPN. Some clients legitimately only speak 1.1. **TLS / transport.** |
| `permissive_cors` | Medium | API8 | Over-permissive CORS — `Access-Control-Allow-Origin: *` or a reflected origin with credentials. Any site can call it from a browser. | CORS filter with an explicit allow-origin list; never `*` when credentials are allowed; scope methods/headers tightly. **Envoy filter.** |
| `missing_x_content_type_options` | Low | API8 | Response lacks `X-Content-Type-Options: nosniff` — browsers may MIME-sniff the body. | Header Mutation appending `X-Content-Type-Options: nosniff`. **Envoy filter.** |
| `missing_x_frame_options` | Low | API8 | Response lacks `X-Frame-Options` (or a frame-ancestors CSP) — framing enables clickjacking. | Header Mutation appending `X-Frame-Options: DENY` (or SAMEORIGIN), ideally a frame-ancestors CSP. **Envoy filter.** |
| `missing_csp` | Low | API8 | Response lacks a `Content-Security-Policy` — no defence-in-depth against injected/cross-site scripts. | Header Mutation appending a CSP. Start strict (`default-src 'self'`, or `default-src 'none'` for pure JSON APIs). **Envoy filter.** |

## Data leak

Sensitive-data exposure.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `pii_observed` | High | API3 | PII-shaped data (email/phone/SSN/card/IBAN) observed in the path. The value is scrubbed to `{pii}` before storage — only the category is kept. | Move PII out of URLs/query strings (POST bodies over TLS); return only needed object properties; ensure TLS-only. **App-side.** |
| `oversized_response` | High | API4 | Response body several times the endpoint's learned mean — a data-exfil canary (e.g. a full-table dump through a single-record endpoint). *Stateful (per-endpoint mean).* | Enforce pagination / result caps upstream; verify object-level authorization; edge Buffer / Bandwidth Limit as a backstop. **App-side.** |

## Discovery

Contextual surface signals.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `sensitive_path_keyword` | High | API8 | Path contains a keyword tied to sensitive surfaces (`admin`, `debug`, `.env`, `.git`, `actuator`, `pprof`, …). A hint, not proof. | Confirm the surface should be reachable at all; RBAC deny these prefixes for untrusted principals (or allow internal IPs only); require strong auth if it must stay. **Envoy filter.** |
| `version_disclosure` | Low | API8 | A response header/banner leaked a software/framework version (`Server`, `X-Powered-By`) — helps attackers pick CVEs. **Exposure axis.** | Header Mutation removing `Server`, `X-Powered-By`, `X-AspNet-Version`, and framework banners. **Envoy filter.** |
| `internal_host` | Low | — | Host resolved to an internal address (loopback / RFC1918 / `*.svc.cluster.local` / `*.local`). Context, not threat. **Exposure axis.** | No action — classification signal. Use it to tell east-west from north-south traffic when triaging other flags. **Informational.** |
| `external_host` | Low | — | Host resolved to a public address / FQDN — internet-facing. Context, not threat. **Exposure axis.** | No action — but treat co-occurring flags on external hosts as higher priority. **Informational.** |

## Behavior

Response-status and self-learned baseline signals.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `error_status` | Medium | — | Response status was 5xx — a server-side failure. Concerning when clustered. *(Feeds the Exposure axis as an ambient outcome.)* | Investigate the upstream (5xx is app-generated); use the Errors dashboard + Events tab to find the trigger; rate-limit if attack-driven. **App-side.** |
| `client_error_status` | Low | — | Response status was 4xx — a bad request from the caller. Normal in isolation; meaningful in clusters. *(Ambient outcome on the Exposure axis.)* | No action for isolated 4xx. If clustered from one source, cross-check `path_scan_suspect` / `brute_force_suspect`. **Informational.** |
| `latency_anomaly` | Medium | — | Latency deviated significantly from the endpoint's self-learned baseline. *Stateful (self-learning baseline).* | Investigate upstream performance (slow deps, GC, DB contention); check Analytics for onset; rate-limit if abuse-driven, else tune detector sensitivity. **App-side.** |
| `error_rate_spike` | Medium | — | The endpoint's error rate spiked well above its self-learned baseline. *Stateful (self-learning baseline).* | Check recent deploys / upstream health; classify 4xx vs 5xx in Events; tune the error-rate detector if the baseline is too tight. **App-side.** |

## Consistency

The same endpoint behaving differently across events.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `auth_inconsistent` | High | API2 | The same endpoint has been seen both with and without auth (`auth_observed` **and** `noauth_observed` on the inventory row). Bypass path, conditional route, or misconfig. *Cross-batch (survives restarts).* | Decide the intended posture and enforce auth uniformly (JWT + RBAC requiring an authenticated principal); use the Events list to find the bypassed unauthenticated calls. **Envoy filter.** |

## OWASP API Security Top 10 (2023) coverage

How the flag catalog maps onto the OWASP API Top-10 — from the collector's own coverage matrix. The collector sees **metadata only** (no request/response bodies, no outbound calls), which bounds what it can detect.

| OWASP item | Status | Flags |
|---|---|---|
| **API1 — Broken Object Level Authorization** | Full | `bola_suspect` |
| **API2 — Broken Authentication** | Partial | `brute_force_suspect`, `weak_token_ttl`, `auth_inconsistent`, `impossible_travel`, `unauthenticated` |
| **API3 — Broken Object Property Level Authorization** | Out of scope | Requires request/response **body** inspection — ALS doesn't ship bodies. (`pii_observed` is the closest metadata signal.) |
| **API4 — Unrestricted Resource Consumption** | Partial | `rate_anomaly`, `ip_rate_anomaly`, `oversized_response` |
| **API5 — Broken Function Level Authorization** | Partial | `auth_inconsistent` (cross-batch), `bfla_suspect` |
| **API6 — Unrestricted Access to Sensitive Business Flows** | Partial | `payment_abuse_suspect` |
| **API7 — Server-Side Request Forgery** | Out of scope | Outbound-only — the collector doesn't see it. |
| **API8 — Security Misconfiguration** | Partial | `weak_tls_version`, `missing_hsts`, `plain_text_transport`, `permissive_cors`, `sensitive_path_keyword`, `vuln_probe_path`, `scanner_user_agent`, `path_scan_suspect`, `version_disclosure`, `missing_csp`, `missing_x_frame_options`, `missing_x_content_type_options`, `unsafe_method_on_readonly`, `threat_intel_hit`, `replay_suspect` |
| **API9 — Improper Inventory Management** | Foundation | The entire `api_inventory` catalog **is** the inventory — plus New APIs, Zombies, and Drift dashboards. |
| **API10 — Unsafe Consumption of APIs** | Out of scope | Outbound-only — not visible to the collector. |

:::info[Out-of-scope is a data boundary, not a gap in effort]
API3, API7, and API10 need request bodies or outbound-call visibility that a metadata-only access-log pipeline structurally cannot provide. For inline body inspection and property-level enforcement, that is [Elchi Shield](/shield/overview) — which API Discovery feeds via [suggest-policy](/api-discovery/suggest-policy).
:::

## Related

- [Risk Scoring: Threat vs Exposure](/api-discovery/risk-scoring) — how these flags become scores
- [PII & Auth Detection](/api-discovery/pii-and-auth)
- [Collector Reference](/api-discovery/collector-reference) — detector thresholds and toggles
- The in-product **API Risk Guide** (`/api-discovery/risks`) — live findings counts + remediation action plan
