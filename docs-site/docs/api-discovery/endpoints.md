---
title: Exploring Endpoints
description: The per-listener endpoints view — confirmed vs attack surface, flat vs path-grouped, the full filter set, two-axis columns, and the endpoint detail page.
sidebar_position: 3
tags: [api-discovery]
---

Clicking a listener on the [dashboards](/api-discovery/dashboards) home opens its **endpoints view** — the working surface of API Discovery. This is where you browse the actual operations the listener serves, filter them down, read their two-axis risk, and drill into any one of them.

An **operation** is a unique `(method, host, normalized_path)` — the OpenAPI notion of an operation. Each is one `api_inventory` document.

## Source toggle: Confirmed vs Attack surface

The **Catalog** toggle switches the data source between the two halves of the [confirmed-vs-attack-surface](/api-discovery/overview#confirmed-vs-attack-surface--route-match-ground-truth) split:

- **Confirmed** — the real API catalog: operations that matched a real Envoy route. This is the clean inventory you export and build policies from.
- **Attack surface** — probe / scanner noise that matched no route (`/.env`, `/cgi-bin` probes, SPA-fallback `200`s). Deliberately kept separate so it never pollutes the real catalog. Current-risk overlay is not computed here — risk on probe noise is meaningless.

## Layout toggle: Flat vs Group by path

For the confirmed catalog, the **View** toggle changes how operations are laid out:

- **Flat** — one row per operation (`GET /users/{id}` and `POST /users/{id}` are separate rows). Best for a precise, per-operation audit.
- **Group by path** — a **path rollup**: one row per normalized path, with all its methods folded in and per-path aggregates (`operation_count`, `total_seen`, worst threat/exposure). Expand a row to see the per-operation breakdown (method, protocol, calls, auth posture, threat/exposure, last seen, deep-link). Best for a high-level surface review and for selecting whole paths to [suggest a Shield policy](/api-discovery/suggest-policy). Grouping applies to the confirmed source only.

## Maturity gate

Route-aware confirmation promotes an endpoint to *confirmed* on a **single** matching request — so a one-off scanner hit against a real route can slip into the clean catalog. The **Maturity** toggle closes that gap:

- **All** — every confirmed operation.
- **Mature ≥5** — hides operations seen fewer than 5 times (`min_seen=5`), dropping one-off noise. Confirmed views only.

Use *Mature* for the high-confidence catalog; use *All* when you want to see everything, including brand-new endpoints that haven't accumulated traffic yet.

## Filters

The collapsible **Filters** panel narrows the list. Filters live in the URL (shareable, restored by back/forward) and apply on **Apply**:

| Filter | Notes |
|---|---|
| **Method** | Multi-select: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE. |
| **Protocol** | Multi-select: `http/1.0`, `http/1.1`, `http/2`, `http/3`, `tcp`, `grpc`. |
| **Risk Flag** | Multi-select over the full [risk-flag catalog](/api-discovery/risk-flags-reference). |
| **PII Category** | Multi-select: `email`, `phone`, `ssn`, `credit_card`, `iban`. |
| **Endpoint Category** | Multi-select: admin / auth / account / payment / data-export / api-docs / metadata-leak. |
| **Host** | Prefix match on the Host header (Mongo `^value` regex, case-sensitive). |
| **Path prefix** | Prefix match on the normalized templated path (e.g. `/api/v1/`). |
| **Risk score range** | Dual slider, 0–255, over `max_risk_score` (the Threat axis). |
| **Last seen** | Date range, with Today / Last 7 days / Last 30 days presets. |

### Geo & raw cross-filters (ClickHouse-backed)

Four more filters pivot the catalog by where traffic came from. They resolve endpoints that served matching traffic within a time window (default last 7 days) and **require ClickHouse**:

| Filter | Notes |
|---|---|
| **Country** | ISO-3166 α-2 (e.g. `TR`, `US`, `DE`). |
| **ASN** | Autonomous System Number of the source network (e.g. `12735`). |
| **Source IP** | Exact IPv4/IPv6 — the Envoy downstream IP, not `X-Forwarded-For`. Only matches when the collector keeps **raw** source IPs (`StoreRawSourceIP=true`); otherwise returns nothing. |
| **User-Agent** | Exact UA string. Only matches when the collector keeps **raw** UAs (`StoreRawUserAgent=true`). |

:::note[Status range is per-event, not per-endpoint]
There is no status-code filter in the inventory list — inventory rows store `status_dist` as an aggregate object, not a per-request status. Filter by status inside an endpoint's **Events** tab instead.
:::

## Columns

The flat table shows, per operation:

| Column | Meaning |
|---|---|
| **Method** / **Path** / **Host** | The operation identity. Path links to the detail page. |
| **Calls** | `seen_count` — total requests observed since `first_seen` (a running counter, not windowed). |
| **Errors** | 5xx sum ÷ calls. Coloured ≥1% red, ≥0.1% amber. |
| **Latency Max** | Slowest single request (`latency_max_ms`), rendered in seconds when ≥1s. |
| **Threat** | The threat-axis flags + `max_risk_score` badge — active attack/abuse. Shows the **current** (last-7d) max when ClickHouse is available; a moon = dormant (hover for lifetime max), a green ↓ = improved below the all-time peak. |
| **Exposure** | The posture-axis flags + `max_posture_score` badge — standing config hygiene. |
| **Last Seen** | Relative time, with a freshness dot (green if within the hour). |

The two axes are the heart of the model — see [Risk Scoring](/api-discovery/risk-scoring). A **Scoring guide** popover on the toolbar summarizes the threat-vs-exposure matrix (`Clean` / `boring-but-open` / `solid-but-under-attack` / `open-&-under-attack`). Sorting is always on the **lifetime** score even when the badge shows current.

Header actions on this view: **Export OpenAPI** (YAML/JSON — see [OpenAPI Export](/api-discovery/openapi-export)) and, when path-groups are selected, **Suggest Shield Policy** (see [Suggest Policy](/api-discovery/suggest-policy)).

## Endpoint detail

Every path links to a deep-linkable detail page with four tabs.

### Overview

MongoDB-sourced aggregates for the operation:

- **KPIs** — Total Calls, Max Latency, **Threat / Exposure** (the two lifetime max scores, `T` and `E`), Auth Posture, and response-size KPIs (Total Egress, Largest Response, derived Avg Response — the `oversized_response` canary lives here).
- **Current-vs-ever posture card** — *"is this endpoint STILL bad?"* — the windowed current posture next to the monotonic lifetime KPIs, so a remediated endpoint reads as improved rather than stuck at its all-time worst.
- **Latency distribution** — fixed buckets: `<5ms`, `5–25ms`, `25–100ms`, `100–500ms`, `500ms–2s`, `≥2s`.
- **Status distribution** — a donut over status classes (2xx/3xx/4xx/5xx/1xx).
- **Categorisation** — the observed metadata: threat flags, exposure flags, PII categories, endpoint categories, auth schemes (with an *Anonymously reachable* warning when `none` + `noauth_observed`), Envoy clusters, routes, content-types, and caller **Origins**.
- **How to fix this endpoint** — a consolidated remediation action plan grouping the endpoint's flags by the single Envoy change that closes several at once, each linking into its [risk-flag guide](/api-discovery/risk-flags-reference).
- **Consumers (hashed)** and **Sample events** — the retained `consumer_hash` values and `sample_event_ids` (drill into them via *Inspect sample requests*, which opens the Events tab in sample mode over a 7-day window).

### Events

The raw per-request log from ClickHouse (up to 500/page over a window, max 7 days): time, status, duration, method, path, host, cluster, source (raw IP or hash), User-Agent (raw or hash), risk (flags + score), and request id. Filter by method, status range, request id, risk flag, and min risk score. An expand row reveals node/stream/protocol, request/response bytes, route, auth, consumer hash, TLS (version/SNI/peer subject), gRPC status/message, and — with **Full fields** on — headers and enrichment `tags`. Requires ClickHouse; degrades gracefully with a clear message when it's offline.

### Analytics

Time-series rollups (1m / 1h / 1d buckets): stacked request volume by status class, latency percentiles (p50/p95/p99), error and client-error rate, throughput (response bytes), and unique-consumer / unique-source-IP counts, plus max risk over time.

### Insights (geo & threat)

Top source **countries**, **ASNs**, and **cities**; the **User-Agent** breakdown; and **threat-intel** hits — each optionally with a time-series stack. Raw UA / IP dimensions are an explicit toggle (they cost extra ClickHouse scans). Requires ClickHouse.

### Admin actions

On the detail header, Admins/Owners get an **Actions** menu:

- **Reset counters & risk** — zero this endpoint's counters and monotonic scores; the collector re-accumulates from the next event.
- **Delete endpoint** — remove the inventory row. If traffic still hits it, the collector recreates it on the next request — so delete is only permanent for genuinely dead endpoints.

Both are also available in bulk at the project level from the [Listeners tab](/api-discovery/dashboards#listeners).

## Endpoint categories

The collector tags each operation with one or more semantic categories (matched by regex on the normalized path), surfaced as chips and as a filter:

| Category | Matches paths like |
|---|---|
| `admin_endpoint` | `/admin`, `/console`, `/management`, `/dashboard` |
| `auth_endpoint` | `/login`, `/signin`, `/oauth`, `/sso`, `/saml`, `/token`, `/password` |
| `account_management` | `/users/{id}/email`, `/users/{id}/password`, `/users/{id}/profile` |
| `payment_endpoint` | `/checkout`, `/payment`, `/billing`, `/charge`, `/refund`, `/invoice` |
| `data_export` | `/export`, `/download`, `/dump`, `/backup`, `/bulk` |
| `api_docs` | `/swagger`, `/openapi`, `/api-docs`, `/redoc`, `/graphiql` |
| `metadata_leak` | `/.env`, `/.git`, `/.aws`, `/.ssh`, `/server-status` (note: generic `config` paths are deliberately excluded to avoid flagging legitimate routes like `/api/v1/config`) |

One endpoint can carry several (`/admin/export` matches both `admin_endpoint` and `data_export`). These categories also drive detectors — `brute_force_suspect` keys off `auth_endpoint`, `payment_abuse_suspect` off `payment_endpoint`.

## Related

- [Risk Scoring: Threat vs Exposure](/api-discovery/risk-scoring)
- [OpenAPI Export](/api-discovery/openapi-export)
- [Suggest Policy](/api-discovery/suggest-policy)
- [Path Normalization](/api-discovery/path-normalization)
