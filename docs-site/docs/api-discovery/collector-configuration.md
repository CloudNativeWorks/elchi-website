---
title: Collector Configuration
description: The elchi-collector runtime config document — header policy, ingest exclusions, path normalization, and detector thresholds, hot-reloaded from MongoDB.
sidebar_position: 10
tags: [api-discovery, collector]
---

The engine behind [API Discovery](/api-discovery/overview) is the **elchi-collector**: a gRPC service that ingests Envoy Access Log Service (ALS) streams, normalizes them into operations, and writes the endpoint catalog. Its behaviour is split in two:

- **Bootstrap** (environment variables) — the wiring the collector needs *before* it can reach MongoDB: listen addresses, database URIs, batch tuning, retention, the hash salt. These require a restart and are documented in the [Collector Reference](/api-discovery/collector-reference).
- **Runtime** (this page) — header policy, ingest exclusions, path-normalization rules, PII switches, and detector thresholds. These live in a **single MongoDB document** and are **hot-reloaded** without a restart.

This page covers the runtime document: what each knob does, how to edit it, and how reloads behave.

## The runtime config document

Runtime configuration lives in one singleton document in the `api_collector_config` collection, keyed `_id: "default"`. On first startup the collector creates it with sensible defaults; from then on it is the source of truth for every collector replica pointed at the same database.

```js
{
  _id: "default",
  version: 1,                  // monotonic — increment on every update
  updated_at: ISODate(...),
  updated_by: "<who>",
  policy: { /* … header policy, exclusions, normalization */ },
  detection: { /* … PII + detector thresholds */ }
}
```

:::info Hot reload
The collector re-reads this document every `RUNTIME_CONFIG_POLL_INTERVAL` (default **2 minutes**). On each poll it validates the new document and, if valid, atomically swaps the live pipeline. One edit fans out to the whole fleet — there is no per-host file distribution. The applied `version` is exported as the `runtime_config_version` metric; alert if it stalls while operators are editing (a dead watcher).
:::

:::warning Reload discards detector state
An accepted reload rebuilds the stateful detectors, so their in-flight windows (BOLA distinct-id counts, brute-force rings, rate windows) are **discarded**. This is an acceptable trade-off for an occasional tuning change, but avoid editing the document in a tight loop.
:::

### How it's edited

Two equivalent paths write the same document:

- **UI** — **Settings → API Discovery** exposes the policy and detection knobs as forms; saving issues a `PUT /setting/api_discovery` to the backend, which bumps `version` and stamps `updated_by`.
- **Directly** — any admin tool can `$set` fields via `mongosh`. Always bump `version` and set `updated_at` / `updated_by` so the change is attributable and the watcher notices it.

```js
db.api_collector_config.updateOne(
  { _id: "default" },
  { $set: {
      "detection.rate_anomaly.enabled": false,
      "detection.brute_force.window_seconds": 30,
      version: 2, updated_at: new Date(), updated_by: "admin-ui"
  }}
)
```

:::note Validation keeps live traffic safe
Validation runs on every reload. Invalid documents — negative thresholds, an uncompilable deny regex, an enabled detector with a zero threshold — are **rejected**, and the previously-loaded runtime stays live. A bad edit never takes down inspection; it just fails to apply (and bumps `runtime_config_poll_failures_total`).
:::

## The `policy` block

`policy` governs what is captured, what is dropped at intake, and how identity and paths are canonicalized.

### Header & identity capture

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `store_headers` | bool | `false` | When on, persists a `headers` map in ClickHouse. Sensitive headers are always stripped regardless (see below). |
| `header_allowlist` | `[]string` | `["content-type", "user-agent", "x-request-id"]` | Which headers survive into the stored map when `store_headers` is on. |
| `hash_source_ip` | bool | `true` | Store `source_ip_hash` (SHA-256 of salt + IP) instead of exposing the raw value in the hash column. |
| `hash_user_agent` | bool | `true` | Store `user_agent_hash` instead of the raw UA in the hash column. |
| `store_raw_source_ip` | `*bool` | on (null = on) | Persist the raw `source_ip` column. Set `false` to opt out for compliance. |
| `store_raw_user_agent` | `*bool` | on (null = on) | Persist the raw `user_agent` column. Set `false` to opt out. |
| `raw_sample_rate` | int | `0` | `0`/`1` = store every raw event; `N ≥ 2` = store only 1-in-N **benign** events (every risky/non-2xx event is always kept). |

:::warning Sensitive headers are always dropped
A fixed set of **14** sensitive headers is stripped before persistence no matter what `header_allowlist` says: `authorization`, `proxy-authorization`, `x-forwarded-authorization`, `x-original-authorization`, `x-forwarded-user`, `cookie`, `set-cookie`, `set-cookie2`, `x-api-key`, `x-auth-token`, `x-csrf-token`, `x-xsrf-token`, `traceparent`, `tracestate`. Their **presence** (for the auth-bearing subset) still sets `auth_observed=true` — the value itself is never stored.
:::

#### Raw-event sampling

At high volume the `api_events_raw` table dominates storage cost, yet most events are routine 2xx traffic. `raw_sample_rate` keeps only 1-in-N **benign** events — a 2xx response whose risk flags are all standing-posture flags (`unauthenticated`, `external_host`, missing security headers, `permissive_cors`, …). Every non-2xx, and every attack-pattern / data-leak / behaviour / probe-path event, is written unconditionally.

A sampled-out event still updates `api_inventory`, so the **endpoint catalog stays complete** — only the per-event forensic row is skipped. Read tools must therefore not derive request volume from `COUNT(*)` on the raw table; use the inventory counters, which are always exact.

### Ingest denylist & exclusions

Two mechanisms drop events **before** the pipeline (normalize / enrich / detectors), so an excluded event is invisible to every detector and never lands in `api_events_raw`.

| Field | Type | Matches on | Drop reason label |
| --- | --- | --- | --- |
| `ingest_deny_patterns` | `[]string` (regex) | request path | `ingest_filter` |
| `exclude.methods` | `[]string` (exact, uppercased) | HTTP method | `exclude_method` |
| `exclude.hosts` | `[]string` (regex, lowercase) | host | `exclude_host` |
| `exclude.listeners` | `[]string` (exact) | listener name | `exclude_listener` |
| `exclude.projects` | `[]string` (exact) | project id | `exclude_project` |
| `exclude.source_cidrs` | `[]string` (CIDR) | source IP | `exclude_source_ip` |
| `exclude.user_agents` | `[]string` (regex, case-**sensitive**) | User-Agent | `exclude_user_agent` |

On first startup, `ingest_deny_patterns` is seeded with paths that no legitimate API produces — health/readiness probes (`^/healthz$`, `^/readyz$`, `^/ping$`, …), telemetry endpoints (`^/metrics$`, `^/prometheus$`), and static-asset suffixes (`\.ico$`, `\.css$`, `\.woff2?$`, …). Attack probes like `wp-admin`, `\.env`, `\.git`, `actuator` are deliberately **kept flowing** so they surface as `sensitive_path_keyword` / `metadata_leak` instead of being silenced.

```js
// $set REPLACES the whole list — re-include the defaults you want to keep.
db.api_collector_config.updateOne(
  { _id: "default" },
  { $set: { "policy.ingest_deny_patterns": [
      "^/healthz$", "^/metrics$", "\\.ico$",   // keep the shipped ones you want
      "^/_next/static/", "\\.png$"              // plus extras
  ], version: 3, updated_at: new Date(), updated_by: "operator" }}
)
```

:::warning Exclusions blind every detector
`policy.exclude` is stronger than `trusted_proxy_cidrs`: an excluded host/CIDR/UA is dropped entirely, so **all** attack detection for it is off. Use it only for genuine noise (CORS preflight, kube-probes, load-test sources) and fully-trusted internal traffic. To suppress *IP-keyed signals* without losing the event, use `trusted_proxy_cidrs` instead.
:::

### Trusted proxies

`trusted_proxy_cidrs` lists NAT / CGNAT / load-balancer egress ranges. IP-keyed detectors (brute force by source IP, path scan, ip-rate) **skip** these ranges so a shared egress IP doesn't trip source-IP thresholds — but the events are still fully recorded and inventoried.

### Path normalization

Request paths are templated into stable shapes (`/api/users/123` → `/api/users/{id}`) so one endpoint is one inventory row. Built-in detectors catch UUIDs, ObjectIDs, ULIDs, hex IDs, JWT-like strings, numeric and composite-numeric IDs, and high-entropy tokens. Deployment-specific id formats the built-ins miss are added via `policy.path_normalize_patterns` — no code change, hot-reloaded:

```js
db.api_collector_config.updateOne(
  { _id: "default" },
  { $set: { "policy.path_normalize_patterns": [
      { regex: "tkt_[a-z0-9]+",  placeholder: "dynamic" },
      { regex: "ORD\\d{6,}",     placeholder: "id" }
  ], version: 4, updated_at: new Date(), updated_by: "operator" }}
)
```

Each rule matches a **whole path segment**; `placeholder` is one of the fixed set `id | uuid | objectid | ulid | token | dynamic`. Patterns are validated at load time (must compile, stay within length/quantifier caps, and not be broad enough to template static segments — `.*` and `[a-z]+` are rejected), max 64 patterns. See [Path Normalization](/api-discovery/path-normalization) for the full model, including the normalization-gap detector that tells you *which* pattern to add.

## The `detection` block

`detection` controls PII scrubbing, consumer fingerprinting, and every risk detector. See [PII & Auth](/api-discovery/pii-and-auth) for what the detectors mean and how to triage what they fire.

### PII & consumer fingerprinting

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `detect_pii` | bool | `true` | Scan normalized path segments for PII (email/phone/SSN/credit-card/IBAN); matches are scrubbed to `{pii}` and raise the `pii_observed` flag. |
| `extract_consumer_fingerprint` | bool | `true` | Hash the consumer identity (JWT `sub` claim, else mTLS peer subject) into `consumer_hash` and aggregate `consumers[]` per endpoint. |
| `service_account_patterns` | `[]string` | `[]` | JWT-`sub` substrings; matching consumers skip the `geo_spread` (impossible-travel) detector. |

### Detector thresholds

Count-based (stateful, windowed) detectors keep their state in collector memory. Each takes at least `enabled`, `threshold`, and `window_seconds`:

| Detector | Default | Notes |
| --- | --- | --- |
| `bola` | on, 50 / 60s, `min_forbidden: 3` | Distinct object IDs one consumer touches on one endpoint + ≥3 in-window 403/404 (OWASP API1). |
| `brute_force` | on, 10 / 60s, `threshold_ip: 100` | 4xx on an auth endpoint per consumer, falling back to source IP (OWASP API2). |
| `rate_anomaly` | **off**, 1000 / 60s | Per-consumer total request rate (OWASP API4); baseline before enabling. |
| `payment_abuse` | on, 10 / 60s | Mutating methods on payment endpoints per consumer (OWASP API6). |
| `replay` | on, 3 / 300s | Duplicate `(request_id, method, path, status)` within window. |
| `path_scan` | on, 40 / 60s | Distinct 4xx paths per source. |
| `geo_spread` | on, 2 / 3600s, `skip_mtls: true` | Distinct continents per consumer (impossible travel). |
| `ip_rate` | **off**, 1000 / 60s | Requests per source IP — anonymous flood. |
| `normalize_gap` | on, 64 / 3600s | Distinct literal last-segments per prefix — un-normalized id detector. |

The `response_size` detector (per-endpoint mean tracker) and the self-learning `behavior` detector (per-endpoint latency + error-rate baselines) have richer parameter sets:

```js
detection.response_size = {
  enabled: true, multiplier: 10, min_baseline_bytes: 1024,
  min_event_bytes: 65536, warmup_samples: 10, sigma: 4, consecutive_n: 2
}
detection.behavior = {
  enabled: true, warmup_samples: 50, startup_suppress_seconds: 600,
  latency:    { enabled: true, sigma: 5.0, min_latency_ms: 200, consecutive_n: 3 },
  error_rate: { enabled: true, fast_alpha: 0.3, slow_alpha: 0.02,
                multiplier: 3.0, min_rate: 0.25, consecutive_n: 2 }
}
```

Stateless toggles are just on/off (and **default on** when absent, for upgrade compatibility):

| Field | Default | Fires on |
| --- | --- | --- |
| `missing_hsts` | `{enabled: true}` | HTTPS + 2xx response with no `strict-transport-security` header. |
| `weak_tls` | `{enabled: true}` | Negotiated `TLSv1` / `TLSv1_1`. |
| `weak_token_ttl_seconds` | `2592000` (30d) | JWT `exp - iat` greater than this; `0` disables. |

## Retention

Raw events are retained for `RETENTION_DAYS` (default **7**), applied as a ClickHouse table TTL so eviction is a partition drop, not a per-row delete. The `api_inventory` catalog has **no TTL** — it is the canonical endpoint catalog and accumulates for the cluster's lifetime, bounded only by the cardinality cap. Changing `RETENTION_DAYS` only affects newly created tables; changing an existing table needs an explicit `ALTER TABLE … MODIFY TTL`. Retention and every other bootstrap knob are covered in the [Collector Reference](/api-discovery/collector-reference).

## See also

- [Path Normalization](/api-discovery/path-normalization) — how paths become operations, and the normalization-gap feedback loop.
- [PII & Auth](/api-discovery/pii-and-auth) — PII scrubbing, consumer fingerprinting, and auth-posture detection.
- [Threat Intelligence & GeoIP](/api-discovery/threat-intel-geoip) — the enrichment chain that adds geo/reputation context.
- [Collector Reference](/api-discovery/collector-reference) — every bootstrap env var, port, metric, and schema.
