---
title: Risk Flags Reference
description: The complete catalog of API Discovery risk flags — grouped by class, with severity, axis, OWASP API Top-10 mapping, meaning and remediation, plus how active, historical and derived flags work.
sidebar_position: 5
tags: [api-discovery]
---

This is the reference for every risk flag the `elchi-collector` can raise on an endpoint. Flags are grouped by **class**; each entry lists its id, severity (Info 0 · Low 1 · Medium 4 · High 7 · Critical 10), OWASP API Security Top-10 (2023) mapping where one applies, a one-line meaning, and the primary remediation.

Which **scoring axis** a flag feeds — **Threat** or **Exposure** — is fixed per flag in the collector's severity catalog, not by class; see [Risk Scoring](/api-discovery/risk-scoring). Exposure-axis flags are called out below. **Info** flags are descriptive context: they are shown, score 0 and never count as a finding.

Remediation `kind`: **Envoy filter** = add/tune an HTTP filter on the listener's HCM · **TLS / transport** = fix at the listener transport socket / codec · **App-side** = Envoy can't fix it, the app or IdP must · **Informational** = contextual signal, no action.

:::tip[False-positive-first defaults]
Every detector default is chosen for **minimum false positives**: the collector replays a corpus of benign production traffic shapes and attacks through its real pipeline on every test run, and benign traffic must raise no finding except genuine posture residuals. Stricter behaviour is always available through the [collector configuration](/api-discovery/collector-configuration#detector-thresholds).
:::

## Active, historical and derived flags

Per-event flags live in ClickHouse `api_events_raw` (TTL'd). Per endpoint, each fired flag is `$addToSet`-merged into `api_inventory.risk_flags`, so the stored set is the **union of everything seen since the row was created** — and each flag's latest sighting is stamped in `flag_last_seen.<flag>`.

The backend splits that lifetime set in two:

- **Active** — last seen within the active window (`policy.risk_active_days`, default **7** days, 1–90; the per-row cutoff is `max(now − risk_active_days, scores_reset_at)`).
- **Historical** — seen before the cutoff. A fixed flag ages from active to historical on its own; nothing has to be deleted.

The risk filter, the Risk dashboard, the PII and Auth Coverage dashboards, drift and the active scores all use **active** flags. PII categories and the auth markers follow the same rule (`pii_last_seen.<category>`, `auth_last_seen`, `noauth_last_seen`). A per-endpoint **Reset** or a project **Rebaseline** moves every earlier finding to historical at once.

Three flags are **derived and decaying**: the collector never stores them in `risk_flags`; it only stamps their evidence, and the backend evaluates them at read time within the active window. A derived flag whose evidence ever met the rule, but does not now, is reported as historical.

| Derived flag | Rule (within the active window) |
|---|---|
| `mixed_auth_schemes` | ≥ 2 auth schemes other than `none` / `cookie` seen (`auth_scheme_last_seen`) |
| `auth_inconsistent` | an authenticated request, an **accepted** anonymous request **and** an anonymous request **refused** on auth (401/403) — an optional-auth endpoint that never refuses anonymous callers is by design |
| `cors_origin_reflection` | ≥ `detection.cors_reflection_min_origins` (default **3**, 1–8) distinct **foreign** reflected origins — registrable domain different from the API host's, by the Public Suffix List |

## Auth

Authentication / authorization posture.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `basic_auth_plaintext` | Critical | API2 | An `Authorization: Basic` header crossed the wire without effective TLS (no downstream TLS and no trusted TLS proxy) — a reversible username:password in clear text. **Exposure axis.** | Terminate TLS on the listener (or declare the TLS-terminating LB in `trusted_tls_proxy_cidrs`); move off Basic auth. **TLS / transport.** |
| `weak_token_ttl` | High | API2 | A JWT bearer token's lifetime (`exp − iat`) exceeds the configured threshold (default 30 days). Long-lived tokens are effectively static credentials. **Exposure axis.** | Shorten access-token TTL at the IdP (minutes, not days); rely on refresh tokens. **App-side.** |
| `unauthenticated` | Medium | API2 | An anonymous **state-changing** request (POST/PUT/PATCH/DELETE) was **accepted** (2xx/101/304, gRPC OK) on an API surface. Not raised for anonymous reads, pages/assets, auth flows, API docs, monitors, or requests authenticated outside an auth header (mTLS, a session-cookie name, a webhook signature header, a signed URL). **Exposure axis.** | Informational if the endpoint is meant to be public. Otherwise add a JWT Authentication (or OAuth2 / Basic Auth) filter + an RBAC filter requiring an authenticated principal. **Envoy filter.** |

## Attack pattern

Behavioural detectors and probe signatures firing on probable abuse. All feed the **Threat** axis.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `brute_force_suspect` | Critical | API2 | Repeated 401/403 answers to credential **submissions** (mutating calls to an auth endpoint): ≥ 10 per consumer, or anonymously ≥ 20 per source IP when those are also ≥ 50% of that IP's attempts. *Stateful (windowed).* | Local Rate Limit on the auth routes; Ext Authz for a cluster-wide limiter. **Envoy filter.** |
| `payment_abuse_suspect` | Critical | API6 | Card testing: declined (4xx except 401/429) state-changing payment calls from one consumer — else one source IP — at or above the threshold **and** ≥ 50% of its payment calls. *Stateful (windowed).* | Local Rate Limit scoped to payment routes + strong auth; Ext Authz for velocity/fraud scoring. **Envoy filter.** |
| `threat_intel_hit` | Critical | API8 | Source IP matched a configured threat-intel feed. *Enricher.* | RBAC deny policy for the offending CIDRs; front the listener with the WAF. **Envoy filter.** |
| `bfla_suspect` | Critical | API5 | An **anonymous** request succeeded (2xx) on a privileged surface — admin, account management or data export — that is a write or targets an object. Payment is not treated as privileged (guest checkout, provider callbacks); API docs are excluded. | RBAC binding privileged routes to permitted roles, driven from verified JWT claims. **Envoy filter.** |
| `bola_suspect` | High | API1 | A consumer touched ≥ 50 distinct `{id}` values on one endpoint in 60 s with ≥ 10 of them answered 403/404 **and** forbidden ≥ 25% of the ids. API-key and mTLS consumers are skipped by default. *Stateful (windowed).* | The real fix is an ownership check in the upstream. At the edge: Shield JWT `claim_bindings`, RBAC + JWT, Local Rate Limit to slow enumeration. **App-side.** |
| `rate_anomaly` | High | API4 | One consumer exceeded the per-consumer request-rate threshold. *Stateful (windowed); off by default.* | Per-consumer Local Rate Limit (429 + Retry-After). **Envoy filter.** |
| `scanner_user_agent` | High | API8 | User-Agent matched a known scanner / pen-test tool (sqlmap, nuclei, nikto, …). Spoofable — corroborate. *Enricher.* | RBAC deny on the scanner UA values, combined with rate limiting + WAF. **Envoy filter.** |
| `vuln_probe_path` | High | API8 | The path targets a well-known leak/exploit file (`.env`, `.git`, `.aws`, `wp-login.php`, `server-status`, …). | RBAC deny the probe prefixes; confirm none of these files are served. **Envoy filter.** |
| `path_scan_suspect` | High | API8 | Many distinct **404/405** paths from one consumer — else one source IP + User-Agent — inside the window: content discovery (gobuster, ffuf, dirb). *Stateful (windowed).* | Local Rate Limit; RBAC deny sustained scanning CIDRs. **Envoy filter.** |
| `impossible_travel` | High | API2 | The same consumer appeared on ≥ 2 continents with ≥ 2 continent **switches** in the window — or one switch onto a hosting / VPN autonomous system after a non-hosting session on another continent. *Stateful (windowed); needs GeoIP.* | Treat the consumer as compromised: force re-auth, revoke tokens, add step-up MFA. **App-side.** |
| `ip_rate_anomaly` | High | API4 | One source IP exceeded the per-IP request-rate threshold. *Stateful (windowed); off by default.* | Per-source-IP Local Rate Limit; Network Local Rate Limit to cap connections. **Envoy filter.** |
| `replay_suspect` | Medium | API8 | The same **signed or nonce-bound** request (OAuth 1.0a / Hawk on any method; webhook HMAC signature, AWS SigV4 or HTTP Signature on a mutating method) was accepted (2xx) ≥ 3 times within 5 minutes on one listener. Keyed by a salted in-memory fingerprint; bearer / API-key / Basic / cookie / mTLS requests are never fingerprinted. *Stateful (windowed).* | Reject repeated nonces / signatures upstream; enforce signature timestamps. **App-side.** |
| `unsafe_method_on_readonly` | Medium | API8 | A state-changing method (POST/PUT/DELETE/PATCH) hit a path reserved for read-only probes (`/healthz`, `/metrics`, `/favicon.ico`, `/robots.txt`). | RBAC permitting only GET/HEAD on probe paths. **Envoy filter.** |

## Transport

Connection-layer and browser hygiene. Every transport flag is on the **Exposure axis**.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `weak_tls_version` | Critical | API8 | Envoy's own downstream TLS negotiated TLS 1.0 or 1.1. *Toggle: `weak_tls`.* | Set the DownstreamTlsContext minimum protocol to `TLSv1_2` (prefer `TLSv1_3`). **TLS / transport.** |
| `plain_text_transport` | High | API8 | Served over plain HTTP to a **public** host — no TLS on the Envoy connection and no `https` from a trusted TLS-terminating proxy. Internal hosts are not flagged. | Add a TLS transport socket; behind a TLS-terminating LB, list it in `trusted_tls_proxy_cidrs`. **TLS / transport.** |
| `missing_hsts` | High | API8 | A 2xx HTML response over effective TLS (including a trusted TLS proxy) lacked `Strict-Transport-Security`. Not raised on 3xx / non-2xx or for monitors. *Toggle: `missing_hsts`.* | Header Mutation appending `Strict-Transport-Security` on TLS listeners. **Envoy filter.** |
| `cors_credentials_wildcard` | High | API8 | `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`. | CORS filter with an explicit allow-origin list; never `*` with credentials. **Envoy filter.** |
| `permissive_cors` | Medium | API8 | `Access-Control-Allow-Origin: null`, or `*` on an **internal** host for a real cross-origin request. A `*` on a public API is correct CORS and is not flagged. | CORS filter with an explicit allow-origin list. **Envoy filter.** |
| `cors_origin_reflection` | Medium | API8 | *Derived.* The response echoed **cross-site** caller origins in `Access-Control-Allow-Origin` while allowing credentials, for at least `cors_reflection_min_origins` distinct foreign origins in the active window. An allow-list echoing the site's own front-ends is not reflection. | Replace origin echoing with an explicit allow-list. **Envoy filter.** |
| `cookie_missing_secure` | Medium | — | A `Set-Cookie` on an effective-TLS response lacked `Secure`. *Cookie inspection only.* | Set `Secure` on cookies (app or Header Mutation). **App-side.** |
| `cookie_samesite_none_insecure` | Medium | — | `SameSite=None` without `Secure`. *Cookie inspection only.* | Add `Secure` or tighten `SameSite`. **App-side.** |
| `cookie_missing_httponly` | Low | — | A cookie without `HttpOnly` (CSRF/XSRF token cookies are exempt). *Cookie inspection only.* | Set `HttpOnly` on session cookies. **App-side.** |
| `missing_x_content_type_options` | Low | API8 | HTML 2xx response lacks `X-Content-Type-Options: nosniff`. | Header Mutation appending `nosniff`. **Envoy filter.** |
| `missing_x_frame_options` | Low | API8 | HTML 2xx response lacks `X-Frame-Options` (or a frame-ancestors CSP). | Header Mutation appending `X-Frame-Options: DENY`. **Envoy filter.** |
| `missing_csp` | Low | API8 | HTML 2xx response lacks a `Content-Security-Policy`. | Header Mutation appending a CSP. **Envoy filter.** |
| `legacy_protocol` | Info | — | Request used HTTP/1.0 or HTTP/1.1. Operational hygiene, not a finding. | Optionally enable HTTP/2 on the HCM. **Informational.** |
| `unverified_proxy_tls` | Info | — | Plain HTTP claiming `x-forwarded-proto: https` from a private / loopback direct peer that is not in `trusted_tls_proxy_cidrs`. | If the peer is your TLS-terminating LB, add it to `trusted_tls_proxy_cidrs`. **Informational.** |

## Data leak

Sensitive-data exposure.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `pii_observed` | High | API3 | A reporting-enabled PII detector matched the path or a query value, or a leaked secret / JWT was collapsed to `{secret}` / `{token}`. Only the category is kept. **Threat axis.** | Move PII out of URLs (POST bodies over TLS). **App-side.** |
| `credential_in_query` | High | API2 | A query parameter **named** like a credential carrier (`api_key`, `access_token`, `password`, `client_secret`, `jsessionid`, … — `policy.credential_param_names`) was sent in the URL. Only the name is inspected. **Exposure axis.** | Move credentials to headers. **App-side.** |
| `oversized_response` | High | API4 | Response far larger than the endpoint's learned mean — a data-exfil canary. Never raised on `data_export` endpoints or file content types (csv/pdf/zip/tar/octet-stream/image/video). *Stateful (per-endpoint mean).* | Enforce pagination / result caps upstream; verify object-level authorization. **App-side.** |

## Discovery

Contextual surface signals. All on the **Exposure axis**.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `version_disclosure` | Low | API8 | A response header/banner leaked a software version (`Server`, `X-Powered-By`). | Header Mutation removing version banners. **Envoy filter.** |
| `sensitive_path_keyword` | Info | — | Path contains a keyword of a commonly sensitive surface (`admin`, `debug`, `actuator`, `metrics`, `pprof`, …). Context for review, not a finding — `vuln_probe_path` carries the probe-only paths. | Confirm the surface should be reachable. **Informational.** |
| `internal_host` | Info | — | Host is loopback / RFC1918 / link-local / `.local` / `.internal` / `.svc.cluster.local`. | Classification signal. **Informational.** |
| `external_host` | Info | — | Host is public-shaped — internet-facing. | Treat co-occurring findings on external hosts as higher priority. **Informational.** |

## Behavior

Response-status and self-learned baseline signals.

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `error_rate_spike` | Medium | — | The endpoint's **client-error** rate (4xx except 401/429) spiked above its self-learned baseline — the shape of fuzzing. 5xx outages do not count. *Stateful (self-learning baseline).* **Threat axis.** | Classify the 4xx in Events; rate-limit the source. **App-side.** |
| `error_status` | Low | — | Upstream answered 5xx (not a shield block). An operations signal. **Exposure axis.** | Investigate the upstream with the Errors dashboard. **App-side.** |
| `client_error_status` | Info | — | Upstream answered 4xx (not a shield block). | No action for isolated 4xx. **Informational.** |
| `latency_anomaly` | Info | — | Latency deviated from the endpoint's self-learned baseline. | Investigate upstream performance. **Informational.** |
| `geo_change` | Info | — | A consumer changed continent once in the window (one relocation / VPN toggle) without the hosting-AS escalation. | Context for `impossible_travel`. **Informational.** |

## Consistency

The same endpoint behaving differently across events. Both are **derived** (see above).

| Flag | Severity | OWASP | Meaning | Remediation |
|---|---|---|---|---|
| `auth_inconsistent` | High | API5 | The endpoint served authenticated requests, **accepted** anonymous ones **and refused** anonymous ones within the active window — auth is enforced on some calls but not others. **Threat axis.** | Enforce auth uniformly (JWT + RBAC); use Events to find the accepted anonymous calls. **Envoy filter.** |
| `mixed_auth_schemes` | Info | — | ≥ 2 credential types (other than `none` / `cookie`) accepted on the same endpoint within the active window — usually deliberate (JWT for the web app, API key for partners). | Context for an auth review. **Informational.** |

## OWASP API Security Top 10 (2023) coverage

The collector sees **metadata only** (no request/response bodies, no outbound calls), which bounds what it can detect.

| OWASP item | Status | Flags |
|---|---|---|
| **API1 — Broken Object Level Authorization** | Full | `bola_suspect` (plus per-consumer [enumeration indicators](/api-discovery/consumers-and-enumeration)) |
| **API2 — Broken Authentication** | Partial | `brute_force_suspect`, `weak_token_ttl`, `credential_in_query`, `basic_auth_plaintext`, `impossible_travel`, `unauthenticated` |
| **API3 — Broken Object Property Level Authorization** | Out of scope | Requires body inspection — ALS doesn't ship bodies. (`pii_observed` is the closest metadata signal.) |
| **API4 — Unrestricted Resource Consumption** | Partial | `rate_anomaly`, `ip_rate_anomaly`, `oversized_response` |
| **API5 — Broken Function Level Authorization** | Partial | `bfla_suspect`, `auth_inconsistent` (derived) |
| **API6 — Unrestricted Access to Sensitive Business Flows** | Partial | `payment_abuse_suspect` |
| **API7 — Server-Side Request Forgery** | Out of scope | Outbound-only — the collector doesn't see it. |
| **API8 — Security Misconfiguration** | Partial | `weak_tls_version`, `missing_hsts`, `plain_text_transport`, `permissive_cors`, `cors_credentials_wildcard`, `cors_origin_reflection`, `vuln_probe_path`, `scanner_user_agent`, `path_scan_suspect`, `version_disclosure`, `missing_csp`, `missing_x_frame_options`, `missing_x_content_type_options`, `unsafe_method_on_readonly`, `threat_intel_hit`, `replay_suspect` |
| **API9 — Improper Inventory Management** | Foundation | The `api_inventory` catalog **is** the inventory — plus New APIs, Zombies, [Drift](/api-discovery/drift) and [spec coverage](/api-discovery/specs-and-coverage). |
| **API10 — Unsafe Consumption of APIs** | Out of scope | Outbound-only — not visible to the collector. |

:::info[Out-of-scope is a data boundary, not a gap in effort]
API3, API7, and API10 need request bodies or outbound-call visibility that a metadata-only access-log pipeline structurally cannot provide. For inline body inspection and property-level enforcement, that is [Elchi Shield](/shield/overview) — which API Discovery feeds via [suggest-policy](/api-discovery/suggest-policy).
:::

## Related

- [Risk Scoring: Threat vs Exposure](/api-discovery/risk-scoring) — how these flags become scores
- [PII, Auth & Consumers](/api-discovery/pii-and-auth)
- [Collector Configuration](/api-discovery/collector-configuration) — detector thresholds and toggles
- The in-product **API Risk Guide** (`/api-discovery/risks`) — live findings counts + remediation action plan
