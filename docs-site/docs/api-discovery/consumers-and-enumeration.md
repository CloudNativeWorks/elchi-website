---
title: Consumers & Enumeration
description: Per-consumer behaviour from the hashed consumer identity — the Consumers dashboard, machine vs human callers, new consumers and trends, the enumeration / scraping / auth-failure indicators, per-endpoint enumerators, and the BOLA and BFLA detectors.
sidebar_position: 7
tags: [api-discovery]
---

API Discovery keys behaviour on the **consumer** — the salted, one-way `consumer_hash` derived from the JWT `sub`, the mTLS subject, the API key or the Basic username (see [Consumer fingerprinting](/api-discovery/pii-and-auth#consumer-fingerprinting)). This page covers what is built on top of it: the Consumers dashboard, the per-endpoint enumerators card, and the object-level (BOLA) and function-level (BFLA) detectors.

:::info[Requirements]
Consumer analytics read the raw ClickHouse events, so they need ClickHouse. The object-id metrics need collector ClickHouse migration **010** (`object_id_hash`); on an older raw table the UI shows them as *not collected*. Anonymous traffic has no consumer and is reported as one anonymous bucket.
:::

## The Consumers dashboard

The Consumers tab ranks the top consumers over a window (default **24 hours**, max **7 days**; top 10 by default, up to 50). Sort by events, distinct object ids, max ids per endpoint, auth failures, peak requests per minute, or trend.

Per consumer:

| Column | Meaning |
|---|---|
| **Events** | Request count (weighted by `sample_weight` when raw sampling is on) and share of the window |
| **Distinct IPs / endpoints** | Source IPs and listener+path pairs seen |
| **Max risk**, **TI hits** | Worst threat score and threat-intel matches |
| **Distinct object ids** | Distinct `{id}` values touched (object-enumeration evidence — the value is a salted hash, never the id) |
| **Max ids per endpoint** | The most distinct ids on one operation, and which operation |
| **Auth failures** | 401/403 answers that were not shield blocks |
| **Peak RPM** | Max stored rows in any sliding 60 s window |
| **Trend** | Events vs the previous window of equal length (empty when that window is beyond the 7-day raw retention) |

A consumer drawer adds geo / ASN, method and status distributions, top endpoints and source IPs, and an **object access** list (top 20 operations by distinct object ids, with the forbidden count per operation).

### Machine identities

A consumer is marked **automated** when its record carries the `apikey` or `mtls` scheme, or when more than half of its window traffic has a client certificate or a `monitor` / `bot` User-Agent. SDK and CLI user agents stay human-capable — they are attacker tooling as much as integrations. Automated consumers are exempt from the enumeration and scraping indicators.

### New consumers

**New** comes from the persistent consumer record (`api_consumers`, first/last seen, events, schemes, listeners): a consumer is new when its first sighting is inside the window. A one-time backfill seeds the records from the last 7 days of raw events; a window that starts before tracking began reports *before tracking* instead of guessing.

## Indicators

Each consumer row carries indicator chips. The thresholds are request parameters with low-false-positive defaults — on the benign audit corpus they raise no indicator:

| Indicator | Fires when | Default thresholds |
|---|---|---|
| `enumeration` | **not** automated **and** max ids per endpoint ≥ `enum_threshold` **and** the forbidden (403/404) answers on that operation are ≥ `enum_forbidden_pct`% of those ids | 20 ids, 25% |
| `scraping` | **not** automated **and** distinct endpoints ≥ `scrape_breadth` **and** peak RPM ≥ `scrape_rpm` | 25 endpoints, 120 rpm |
| `auth_failure_burst` | upstream 403s ≥ `auth_fail_threshold` **or** distinct endpoints answering 401 ≥ `auth_fail_401_endpoints` | 10, 10 |
| `new_consumer` | the consumer is new in the window | — |

Walking ids the caller is allowed to read is a sync or a prefetch, not an attack — which is why enumeration needs a forbidden share. One expired token re-polling a single endpoint is not an auth-failure burst.

:::note[Shield blocks are their own class]
Auth failures exclude requests the [Shield](/shield/overview) answered (`x-elchi-shield: blocked`). For a window that starts before collector ClickHouse migration **008**, the response says so (`pre_shield_classification`), because such failures may still include shield blocks.
:::

## Per-endpoint enumerators

On an endpoint's detail page, the **Top enumerators** card lists the consumers that touched the most distinct object ids on that exact operation (default window 24 hours, max 7 days; top 10, up to 50): distinct ids, events, auth failures, first and last seen — plus the operation's total distinct ids (anonymous callers included).

## The BOLA detector

`bola_suspect` (High, threat axis, OWASP API1) is the collector's real-time counterpart. It counts, per consumer and endpoint, the distinct values in templated `{id}` / `{uuid}` / `{pii}` positions inside a sliding window and fires only when all of these hold:

| Setting (`detection.bola`) | Default | Meaning |
|---|---|---|
| `threshold` / `window_seconds` | 50 / 60 | distinct ids per consumer + endpoint in the window (≤ 128) |
| `min_forbidden` | 10 | at least this many in-window touches answered 403/404 |
| `min_forbidden_ratio` | 0.25 | forbidden touches ≥ this share of the distinct ids |
| `skip_machine_consumers` | true | API-key and mTLS consumers are never flagged |

Anonymous traffic (no consumer) and non-templated endpoints never enter the tracker. Setting the share to 0 or the skip to false makes the detector more sensitive and noisier.

:::tip[Hand-off to enforcement]
The edge counterpart is Shield's JWT / JWKS `claim_bindings`, which require a verified token claim (for example `sub`) to equal a given path segment — an object-ownership guard. [Suggest Shield Policy](/api-discovery/suggest-policy) can propose it for endpoints with an `{id}` segment.
:::

## The BFLA detector

`bfla_suspect` (Critical, threat axis, OWASP API5) is stateless: an **anonymous** request that succeeded (2xx) on a privileged surface — an admin, account-management or data-export endpoint — that is a write or targets an object. Payment endpoints are not treated as privileged (guest checkout and provider callbacks are public by design), API docs are excluded, and requests authenticated outside an auth header (mTLS, session-cookie name, webhook signature, signed URL) are not anonymous.

## Related

- [PII, Auth & Consumers](/api-discovery/pii-and-auth) — how the consumer identity is derived.
- [Risk Flags Reference](/api-discovery/risk-flags-reference) — every flag and its remediation.
- [Collector Configuration](/api-discovery/collector-configuration#detector-thresholds) — detector thresholds.
