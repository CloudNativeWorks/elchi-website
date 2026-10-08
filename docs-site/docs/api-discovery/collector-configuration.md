---
title: Collector Configuration
description: The elchi-collector runtime config document — header policy, ingest exclusions, path normalization and learned templating, PII switches, credential names, TLS proxies, GraphQL, and FP-first detector thresholds, hot-reloaded from MongoDB.
sidebar_position: 14
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

:::info[Hot reload]
The collector re-reads this document every `RUNTIME_CONFIG_POLL_INTERVAL` (default **2 minutes**). On each poll it validates the new document and, if valid, atomically swaps the live pipeline. One edit fans out to the whole fleet — there is no per-host file distribution. The applied `version` is exported as the `runtime_config_version` metric; alert if it stalls while operators are editing (a dead watcher).
:::

:::warning[Reload discards detector state]
An accepted reload rebuilds the stateful detectors, so their in-flight windows (BOLA distinct-id counts, brute-force rings, rate windows) are **discarded**. This is an acceptable trade-off for an occasional tuning change, but avoid editing the document in a tight loop.
:::

### How it's edited

Two equivalent paths write the same document:

- **UI** — **Settings → API Discovery** exposes the policy and detection knobs as forms (Admin/Owner); saving issues a `PUT /api/v3/setting/api_discovery` to the backend, which validates the same rules as the collector, bumps `version` and stamps `updated_by`. Each `policy` / `detection` sub-tree you send **replaces** the stored one. The backend additionally rejects unknown `pii_detectors` keys. For `credential_param_names`, `pii_detectors` entries, `never_template_segments`, `trusted_tls_proxy_cidrs` and `graphql_paths`, `null` removes the field (= collector default); `[]` for `credential_param_names` / `graphql_paths` disables that feature.
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

:::note[Validation keeps live traffic safe]
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
| `consumers_cap` | int | `10` | Max consumer hashes kept per inventory row (1–100). |
| `query_params_cap` | int | `50` | Max query-parameter **names** kept per inventory row (1–200). |
| `risk_active_days` | int | `7` | Active window for findings (1–90). Stored only — the backend applies it to split active from historical. |

:::warning[Sensitive headers are always dropped]
A fixed set of **14** sensitive headers is stripped before persistence no matter what `header_allowlist` says: `authorization`, `proxy-authorization`, `x-forwarded-authorization`, `x-original-authorization`, `x-forwarded-user`, `cookie`, `set-cookie`, `set-cookie2`, `x-api-key`, `x-auth-token`, `x-csrf-token`, `x-xsrf-token`, `traceparent`, `tracestate`. Their **presence** (for the auth-bearing subset) still sets `auth_observed=true` — the value itself is never stored.
:::

#### Raw-event sampling

At high volume the `api_events_raw` table dominates storage cost, yet most events are routine 2xx traffic. `raw_sample_rate` keeps only 1-in-N **benign** events — a 2xx response whose risk flags are all standing-posture flags (`unauthenticated`, `external_host`, missing security headers, `permissive_cors`, …). Every non-2xx, and every attack-pattern / data-leak / behaviour / probe-path event, is written unconditionally.

Each kept benign row carries `sample_weight = N` (ClickHouse migration 013; the rollups carry the matching `unsampled_count`), so `sum(sample_weight)` estimates the real request count — the dashboards weight their event counts this way. Distinct counts (consumers, source IPs, object ids) become lower bounds. A sampled-out event still updates `api_inventory`, so the **endpoint catalog stays complete**. Benign events are also load-shed when the raw sink falls behind; those are counted in `raw_events_shed_total` and are not represented by any weight. The effective rate is shown to every project member (`GET /api/v3/inventory/collector-info`).

### PII switches & credential names

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `pii_detectors` | object | every detector on | Per-detector **reporting** switches: `email`, `phone_international`, `tr_mobile`, `ssn`, `credit_card`, `iban` (booleans) and `tr_national_id` = `off` \| `named` \| `named_and_endpoint` (default). Absent / `null` / missing key = on. The `{pii}` mask and the query-name filter always run every detector. See [PII detection](/api-discovery/pii-and-auth#per-detector-switches). |
| `credential_param_names` | `[]string` | built-in list (absent / `null`) | Query-parameter names that raise `credential_in_query`; ≤ 64 entries matching `^[a-z0-9_.\-\[\]]{1,64}$`; `[]` disables the flag. See [Credential parameter names](/api-discovery/pii-and-auth#credential-parameter-names). |

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

:::warning[Exclusions blind every detector]
`policy.exclude` is stronger than `trusted_proxy_cidrs`: an excluded host/CIDR/UA is dropped entirely, so **all** attack detection for it is off. Use it only for genuine noise (CORS preflight, kube-probes, load-test sources) and fully-trusted internal traffic. To suppress *IP-keyed signals* without losing the event, use `trusted_proxy_cidrs` instead.
:::

The path deny list (`ingest_deny_patterns`) applies to **GET / HEAD** only — a write to `/healthz` still reaches the pipeline so `unsafe_method_on_readonly` can fire.

### Trusted proxies

`trusted_proxy_cidrs` lists NAT / CGNAT / load-balancer egress ranges. IP-keyed detectors (brute force by source IP, path scan, ip-rate) **skip** these ranges so a shared egress IP doesn't trip source-IP thresholds — but the events are still fully recorded and inventoried.

### Transport behind a TLS-terminating proxy

When a load balancer terminates TLS and forwards plain HTTP to Envoy, every event would read as `plain_text_transport`. List the LB's addresses in `trusted_tls_proxy_cidrs` (CIDR or single IP, IPv4/IPv6, ≤ 64, no `/0`; absent/empty = off) and log `x-forwarded-proto`. An event then counts as TLS (`tls_via_proxy`) only when the Envoy connection has no TLS, the **direct TCP peer** (never an `X-Forwarded-For`-derived address) is in the list, and **every** element of `x-forwarded-proto` is `https`. Effective TLS drives `plain_text_transport`, `basic_auth_plaintext`, `cookie_missing_secure` and `missing_hsts`; `weak_tls_version` still judges only Envoy's own TLS. A private peer claiming https without being listed raises the info flag `unverified_proxy_tls`. This list is deliberately separate from `trusted_proxy_cidrs`.

:::note[Edge Envoys]
An edge Envoy with `use_remote_address: true` and `xff_num_trusted_hops: 0` overwrites `x-forwarded-proto` with its own connection scheme, so the setting is inert there. That is also why only the direct peer is trusted.
:::

### Hosting and egress ASNs

| Field | Default | Purpose |
| --- | --- | --- |
| `hosting_asns` | `[]` | **Extra** hosting / VPN AS numbers for the `impossible_travel` single-switch escalation; the built-in curated list is always on (≤ 1024, 1–4294967295). |
| `trusted_egress_asns` | `[]` | Your own corporate VPN / SASE / VDI / BFF egress ASes — never treated as hosting (subtracted from the list). |

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

Letter+digit ids are **learned** instead ([learned templating](/api-discovery/path-normalization#learned-templating)):

| Field | Default | Accepted |
| --- | --- | --- |
| `path_learn_min_distinct` | `5` | 2–64, ≤ `path_learn_cap` — distinct values before a position becomes `{id}` |
| `path_learn_cap` | `64` | 8–256 — stored value hashes per position |
| `never_template_segments` | `[]` | ≤ 256 lowercase values (1–128 bytes, no `/`) that never learn |

### GraphQL

| Field | Default | Accepted |
| --- | --- | --- |
| `graphql_paths` | `["/graphql"]` (absent / `null`) | ≤ 32 path **suffixes** (segment-aligned, case-insensitive); `[]` = GraphQL detection off |
| `graphql_ops_cap` | `200` | 1–1000 distinct operations per endpoint per collector process; overflow → `(other)` |

See [GraphQL operations](/api-discovery/endpoints#graphql-operations).

## The `detection` block

`detection` controls PII scrubbing, consumer fingerprinting, and every risk detector. See [PII & Auth](/api-discovery/pii-and-auth) for what the detectors mean and how to triage what they fire.

### PII & consumer fingerprinting

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `detect_pii` | bool | `true` | Scan the path and query (decoded, before and after templating) for PII; matching path segments are scrubbed to `{pii}` and reported categories raise `pii_observed`. Per-detector switches live in `policy.pii_detectors`. |
| `extract_consumer_fingerprint` | bool | `true` | Hash the consumer identity (JWT `sub`, else mTLS subject, else API key, else Basic username) into `consumer_hash`. |
| `service_account_patterns` | `[]string` | `[]` | JWT-`sub` substrings; matching consumers skip the `geo_spread` (impossible-travel) detector. |
| `cookie_inspection` | bool | `false` | Read request / response cookies for the `Set-Cookie` flags and the `cookie` scheme. Not needed for cookie-session auth — session cookie **names** reach the collector through the managed `elchi-cookie-names` filter. After a save the backend adds / removes `cookie` and `set-cookie` in the `elchi-als` header lists; listeners must be re-published. |
| `cors_reflection_min_origins` | int | `3` | Distinct foreign reflected origins that make the derived `cors_origin_reflection` active (1–8). Stored only — the backend applies it. |

### Detector thresholds

Count-based (stateful, windowed) detectors keep their state in collector memory. Each takes at least `enabled`, `threshold`, and `window_seconds`. The defaults are **false-positive-first** — chosen so benign production traffic raises no finding — and absent fields resolve to the same values:

| Detector | Default | Notes |
| --- | --- | --- |
| `bola` | on, 50 / 60s, `min_forbidden: 10`, `min_forbidden_ratio: 0.25`, `skip_machine_consumers: true` | Distinct object ids one consumer touches on one endpoint, **and** ≥ 10 in-window 403/404 that are ≥ 25% of the ids; API-key / mTLS consumers skipped (OWASP API1). |
| `brute_force` | on, 10 / 60s, `threshold_ip: 20`, `min_failure_ratio: 0.5` | 401/403 to **mutating** auth calls per consumer; anonymously per source IP when ≥ 20 **and** ≥ 50% of its attempts (OWASP API2). |
| `rate_anomaly` | **off**, 1000 / 60s | Per-consumer total request rate (OWASP API4); baseline before enabling. |
| `payment_abuse` | on, 10 / 60s, `min_failure_ratio: 0.5` | Declines (4xx except 401/429) of mutating payment calls per consumer, else per IP, that are ≥ 50% of its calls (OWASP API6). |
| `replay` | on, 3 / 300s | Salted fingerprint of **signed / nonce-bound** requests, 2xx only, per listener. Bearer / API-key requests are never fingerprinted. |
| `path_scan` | on, 40 / 60s | Distinct **404/405** paths per consumer, else per source IP + User-Agent. |
| `geo_spread` | on, 2 / 3600s, `skip_mtls: true`, `min_switches: 2`, `escalate_hosting_asn: true` | `impossible_travel` needs ≥ 2 continent **switches**, or one switch onto a hosting / VPN AS after a non-hosting session; otherwise the info flag `geo_change`. |
| `ip_rate` | **off**, 1000 / 60s | Requests per source IP — anonymous flood. |
| `normalize_gap` | on, 64 / 3600s | Distinct literal last-segments per prefix — un-normalized id detector. |

Validation: an enabled detector needs threshold > 0 and window > 0; the `bola`, `path_scan`, `geo_spread` and `normalize_gap` thresholds are capped at **128** (the tracker ring size); `min_forbidden_ratio` / `min_failure_ratio` are 0–1 (absent = default, an explicit `0` turns the share gate off — more sensitive, more false positives); `min_switches` is 0–31.

:::info[Upgrading keeps your own values]
A stored value wins over a new default. On upgrade, collector Mongo migration `009` moves only values that still equal the **old** shipped defaults to the FP-first ones (`bola.min_forbidden` 3 → 10, `brute_force.threshold_ip` 100 → 20, and a `credential_param_names` equal to the legacy 18-name list → unset, i.e. the built-in list). Anything an operator changed is left alone.
:::

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
