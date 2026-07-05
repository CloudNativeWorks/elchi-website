---
title: PII, Auth & Consumers
description: How API Discovery detects PII in paths, infers auth schemes and consumers, and the metadata-only privacy model that keeps raw data out of storage.
sidebar_position: 6
tags: [api-discovery]
---

API Discovery does more than list endpoints — it enriches every operation with what it can *observe* from traffic metadata: whether sensitive data is leaking into URLs, whether the endpoint is authenticated, and which consumers are calling it. Crucially, all of this is derived from metadata alone. The collector never persists request bodies or query strings, and it hashes the identifiers it does keep. This page covers the three enrichment surfaces — PII, auth, consumers — and the privacy model underneath them.

:::info[Where this data comes from]
These signals are produced by **elchi-collector** as it ingests Envoy access logs (ALS). See [Overview](/api-discovery/overview) for the pipeline, and [Collector Configuration](/api-discovery/collector-configuration) for the knobs referenced below.
:::

## PII detection

When `detect_pii` is enabled (the default), the collector scans each **normalized path segment** against a set of regex detectors. A matching segment is scrubbed to `{pii}` *before* the path is persisted — the raw value never reaches storage.

| Category | Example that would be detected |
|---|---|
| `email` | `user@example.com` |
| `phone` | `+1 415 555 1212`, `(415) 555-1212` |
| `ssn` | `123-45-6789` |
| `credit_card` | `4111 1111 1111 1111` |
| `iban` | `TR32 0010 0099 9990 1234 5678 90` |

On a hit, the collector:

- records the category name in `pii_categories[]` on the event and `$addToSet`s it into the inventory row;
- fires the `pii_observed` risk flag (severity 7, class `data_leak`);
- stores only the category — **the matched value is masked to `{pii}` and dropped**.

:::note[Two normalize-driven categories]
Beyond the five regex detectors, path normalization contributes two more PII categories when it collapses a leaked credential in the path: `secret_in_path` (a vendor secret such as an AWS `AKIA…` / GitHub `ghp_…` / Stripe `sk_live_…` key → `{secret}`) and `jwt_in_path` (a leaked JWT → `{token}`). Both also raise `pii_observed`, and the raw value is dropped, not stored. See [Path Normalization](/api-discovery/path-normalization).
:::

### The PII dashboard

The PII inventory dashboard surfaces every endpoint where PII was observed:

- A hero count of endpoints touching PII, plus a row of **category cards** (email, phone, SSN, credit-card, IBAN) — click one to filter the table to that category.
- A table of the affected operations: method, normalized path (deep-linked to the endpoint detail), listener, call count, and last-seen.
- An empty state of *"No PII observed yet — clean."* when nothing matched.

The `pii_observed` flag is a signal that the *upstream* API accepts IDs/PII in the URL — even though the path is masked before storage, that data still flows through logs, proxies, and browser history. The fix is upstream, not in the collector.

:::tip[Enforce, don't just observe]
API Discovery only sees paths — it cannot inspect bodies (ALS doesn't ship them). To actively **redact PII in request/response bodies** at the edge, use Shield's [DLP policy](/shield/policies/dlp), which mutates the body inline.
:::

## Auth scheme detection

The collector infers the authentication posture of each operation from **header presence** — it never verifies a signature.

### auth_observed / noauth_observed

When any of `Authorization`, `Proxy-Authorization`, `X-Forwarded-Authorization`, `X-Original-Authorization`, `X-Api-Key`, `X-Auth-Token`, or `Cookie` is present on a request, the event is flagged `auth_observed = true`. The header **value is never stored** — only the fact of its presence. Requests with none of these set `noauth_observed = true` on the inventory row. Both booleans are persisted per inventory row.

:::warning[Presence, not verification]
`auth_observed` means a credential *header was present* — not that it was valid, or that the request was actually authorized. A forged or expired token still sets the flag. Treat it as "a credential was attached," nothing stronger.
:::

### auth_schemes[]

When consumer fingerprinting is on, each operation accumulates the recognized auth schemes seen on it, via `$addToSet` into `auth_schemes[]`:

| Value | Meaning |
|---|---|
| `jwt` | JWT bearer token (the `sub` claim was fingerprinted) |
| `mtls` | Mutual TLS — client peer certificate |
| `apikey` | `X-Api-Key` header |
| `none` | Anonymous **or** a non-fingerprintable auth (Basic / opaque Bearer) — *not* proof of "no auth" |

When the whole field is absent, consumer fingerprinting is off (there is no inference to render). `none` is deliberately ambiguous: it covers both genuine anonymous traffic and auth the collector can't fingerprint, so it should never be read as "this endpoint is unauthenticated" — that needs `noauth_observed`.

### auth_inconsistent (cross-batch flag)

This is the one flag whose state lives on the inventory row itself, not in pipeline memory. Once a single `(method, host, path)` row has recorded **both** `auth_observed = true` **and** `noauth_observed = true`, every subsequent upsert appends the `auth_inconsistent` flag (severity 7, class `consistency`). Because the state is in MongoDB, the signal survives collector restarts and replica scale-outs.

It means the same operation is sometimes called with credentials and sometimes without — usually an auth-bypass code path, an over-broad cache, or a health-check route sharing the path. Investigate each as a potential auth bypass.

### The Auth Coverage dashboard

The Auth Coverage dashboard has two modes:

- **Unauthenticated** — endpoints whose observed events never carried an auth header. By default it lists only **write methods** (POST/PUT/PATCH/DELETE), the most damaging to leave open; a *"Include read methods"* toggle adds GET/HEAD/OPTIONS.
- **Inconsistent** — endpoints seen with *both* authenticated and unauthenticated traffic (the `auth_inconsistent` condition).

Each row shows the method, path, call count, worst risk score, and last-seen, plus a banner alert summarizing how many endpoints are exposed. An all-clear state confirms every observed endpoint enforces auth.

## Consumer fingerprinting

When `extract_consumer_fingerprint` is enabled (the default), the collector derives a stable `consumer_hash` per event and aggregates the distinct values into a `consumers[]` array on each inventory row (roughly the 5–10 most recent). Sources, in precedence order:

1. The JWT `sub` claim parsed from `Authorization: Bearer <jwt>`.
2. The mTLS peer certificate subject, when no JWT is present.

The identity is hashed **one-way** with `HASH_SALT` before storage. The token itself is never kept — only the hashed claim.

:::warning[Signatures are not verified]
The collector does **not** verify the JWT signature; that is the upstream service's responsibility. Treat `consumer_hash` as *observed* metadata — a stable grouping key, not an authenticated identity.
:::

### The Consumers dashboard

The Consumers dashboard profiles per-identity behavior over a time window (backed by ClickHouse):

- A top-consumers table keyed by `consumer_hash`, showing event volume, max threat score, threat-intel hits, distinct source IPs, distinct endpoints, and last-seen.
- An **anonymous bucket** card breaking out how many events (and what percentage) had no extractable consumer identity — unfingerprinted traffic collapsed into one bucket.
- A per-consumer detail drawer with KPIs (events, endpoints, source IPs, max threat, critical events, TI hits), geo/ASN, method and status distributions, top source IPs, and the consumer's top endpoints.

Because the hash is one-way, a raw source IP appears in the drawer only when raw source-IP storage is on; otherwise a hashed identifier is shown behind a lock icon.

## The privacy model

API Discovery is designed to give security teams visibility **without** becoming a liability of its own. The guarantees:

| Data | What is kept |
|---|---|
| Request/response bodies | **Never persisted** (ALS doesn't ship them). |
| Query strings | **Never persisted** — always stripped from the path; redirect `Location` headers have their query + fragment stripped too, so OAuth `code` / SAML state can't leak. |
| Path segments matching PII | Masked to `{pii}` before storage; only the category name is kept. |
| Sensitive headers | 14 headers are dropped before persistence regardless of any allowlist: `Authorization`, `Proxy-Authorization`, `X-Forwarded-Authorization`, `X-Original-Authorization`, `X-Forwarded-User`, `Cookie`, `Set-Cookie`, `Set-Cookie2`, `X-Api-Key`, `X-Auth-Token`, `X-CSRF-Token`, `X-XSRF-Token`, `Traceparent`, `Tracestate`. |
| Source IP | Hashed one-way by default (`hash_source_ip`, `SHA-256(salt + value)` truncated to 16 hex chars). |
| User-Agent | Hashed one-way by default (`hash_user_agent`, same scheme). |
| Consumer identity | JWT `sub` / mTLS subject hashed one-way with `HASH_SALT`. |

Everything the collector keeps about *who* made a request is a salted one-way hash. The hashes are useful only for equality (grouping the same identity/IP/UA across events) — they can't be reversed to the original value.

### Raw IP / User-Agent retention

The raw `source_ip` and `user_agent` columns are governed by `store_raw_source_ip` and `store_raw_user_agent`. Per the collector schema these default to **on** (`*bool` nil = on), populating the raw columns alongside the hashes; an operator opts **out** for compliance by setting them to `false`, which leaves those columns empty while the one-way hashes still populate. Turning raw storage off is the stricter, hash-only posture.

:::warning[HASH_SALT is required — and load-bearing]
`HASH_SALT` is a mandatory bootstrap secret. The collector **rejects an empty or whitespace-only value at startup** — without a real salt, an attacker could rainbow-table the IP/UA/consumer hashes. Two consequences:

- Set it to a strong, secret value and manage it like any other credential.
- **Rotating it invalidates every downstream hash join** — all consumer/IP/UA correlations restart from the rotation point. Rotate deliberately, not casually.
:::

## Related

- [Overview](/api-discovery/overview) — the discovery pipeline end to end.
- [Collector Configuration](/api-discovery/collector-configuration) — enabling/tuning `detect_pii`, `extract_consumer_fingerprint`, hashing, and raw-storage toggles.
- [Collector Reference](/api-discovery/collector-reference) — full field and flag catalog.
- [DLP policy](/shield/policies/dlp) — enforce redaction of PII in bodies at the edge.
