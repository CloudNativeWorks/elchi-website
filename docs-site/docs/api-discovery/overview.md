---
title: API Discovery Overview
description: A traffic-derived API inventory built from Envoy access logs — confirmed endpoint catalog, risk scoring, PII/auth detection, OpenAPI export, and a bridge to Shield policies.
sidebar_position: 1
tags: [api-discovery]
---

API Discovery turns the traffic already flowing through your Envoy edges into a **living inventory of every API operation your platform serves** — without touching request bodies and without forwarding a single byte off-box. It answers the questions a security team actually has: *What endpoints do we expose? Which are unauthenticated? Which carry PII? Which are being scanned right now? Which have we forgotten about?*

It is a **passive, metadata-only** system. Envoy ships access-log records; the `elchi-collector` normalizes and scores them; the Elchi UI presents the catalog. Nothing in this pipeline sits in the request path, so it can never block, slow, or break live traffic.

## What it is (and is not)

API Discovery is **traffic-derived discovery** — an inventory built by observing real requests, not by parsing an uploaded OpenAPI spec. Every endpoint in the catalog is there because something actually called it.

It is **not** an API gateway, a WAF, a policy engine, or a traffic recorder. For inline enforcement (block/detect/redact), that is [Elchi Shield](/shield/overview) — and API Discovery feeds Shield through the [suggest-policy bridge](/api-discovery/suggest-policy).

## The data flow

```
Envoy (ALS v3 access logs)
        │
        ▼
   elchi-collector   ── normalize paths, fingerprint consumers,
        │                run detectors + enrichment, score risk
        ├──────────────► ClickHouse  api_events_raw     (forensic, TTL'd — default 7 days)
        │                            api_events_1m/1h/1d (time-series rollups)
        └──────────────► MongoDB     api_inventory       (canonical per-operation catalog, NO TTL)
        ▼
   Elchi UI  /api-discovery  (dashboards, endpoints, risk model)
```

- **Envoy** emits **Access Log Service (ALS) v3** records over gRPC to the collector. No inline filter, no ext_proc — just the access-log sink Envoy already has.
- **elchi-collector** ingests those records, normalizes paths (`/users/123` → `/users/{id}`), fingerprints the consumer, runs its detectors + enrichment chain, and assigns a per-event risk score. It then writes to two stores.
- **ClickHouse `api_events_raw`** — the forensic fast lane: raw per-event rows, columnar + ZSTD compressed, evicted by a partition-drop TTL after `RETENTION_DAYS` (default **7 days**). Backing the dashboard time-series are pre-aggregated `api_events_1m` / `1h` / `1d` rollup tables.
- **MongoDB `api_inventory`** — the **canonical endpoint catalog**: one document per unique operation, upserted idempotently, with **no TTL**. This is the inventory; it grows monotonically (bounded by a cardinality cap, default 100K endpoints per collector).
- **Elchi UI** at `/api-discovery` reads both: the inventory for the catalog and risk aggregates, ClickHouse for per-event drill-down, geo, and analytics.

:::info[One collector, one control plane — many edges]
The collector is a central, passive gRPC service shared by the whole fleet. Each edge Envoy points its ALS sink at it. The inventory is keyed on the Envoy `node.id` (`listener::project::ip`), so multiple listener replicas collapse into a single endpoint row.
:::

## Privacy posture: metadata only

API Discovery is deliberately built so that turning it on does **not** create a new data-exfiltration surface:

- **No request or response bodies** are ever shipped or stored — ALS carries metadata, not payloads.
- **No query strings** — the path is stored query-stripped and normalized; redirect `Location` headers have their query/fragment stripped (so OAuth `code`, SAML state, etc. can't leak).
- **Sensitive headers are dropped** before persistence regardless of config: `Authorization`, `Proxy-Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`, `X-Auth-Token`, `X-Csrf-Token`. Their *presence* is recorded as `auth_observed`; the value never is.
- **Source IP and User-Agent are always hashed** (`SHA-256(salt + value)`). The raw columns are **also populated by default** — raw retention is a per-field **opt-out** (`store_raw_source_ip` / `store_raw_user_agent: false`) for a stricter, hash-only posture. See [PII, Auth & Consumers](/api-discovery/pii-and-auth).
- **PII is scrubbed before it is stored** — a detected email / SSN / card number in a path segment is replaced with `{pii}`; only the *category* is recorded, never the value.

See [PII & Auth Detection](/api-discovery/pii-and-auth) for the full detector list.

## How to enable it

Discovery is enabled per Envoy listener by turning on `api_discovery` on the listener's HTTP Connection Manager and pointing an **ALS v3 gRPC access-log sink** at the collector. Two things must be present:

**1. A node id the collector can key on** — `listener_name::project_id::listener_ip` (the trailing IP is optional):

```yaml
node:
  id: "public-edge::acme-prod::10.0.1.42"
  cluster: envoy
```

**2. An HTTP gRPC ALS sink** on the listener's HCM, logging the specific headers the collector extracts:

```yaml
access_log:
  - name: envoy.access_loggers.http_grpc
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.grpc.v3.HttpGrpcAccessLogConfig
      common_config:
        log_name: elchi
        transport_api_version: V3
        grpc_service:
          envoy_grpc:
            cluster_name: elchi_collector
        buffer_size_bytes: 262144      # 256 KiB
        buffer_flush_interval: 1s
      additional_request_headers_to_log:
        - authorization                 # presence only — value dropped by policy
        - user-agent
        - x-forwarded-for               # source-IP fallback
        - x-request-id                  # correlation
      additional_response_headers_to_log:
        - content-type
        - grpc-status
        - location                      # query string stripped before persistence
        - strict-transport-security     # presence drives the missing_hsts flag
      additional_response_trailers_to_log:
        - grpc-status
        - grpc-message
```

Once traffic flows, listeners appear at `/api-discovery` within a couple of flush intervals. If the tab is empty, the UI's own hint is the checklist: *"Enable `api_discovery` on a listener's HCM extension to start collecting events."*

:::tip[Behind an edge / CDN]
Because source IP is derived from Envoy's downstream connection (never the spoofable leftmost `X-Forwarded-For`), configure Envoy with `use_remote_address` + `xff_num_trusted_hops` so the recorded client IP is the real caller and not your edge. See the [collector configuration](/api-discovery/collector-configuration).
:::

## Confirmed vs attack surface — route-match ground truth

The single most important concept in the catalog is the split between **confirmed** (real) endpoints and **attack surface** (probe/scan noise). The distinction is not a guess — it is **Envoy's route match**, the ground truth of whether a request hit a configured route:

- **Confirmed (`confirmed: true`)** — the request **matched a real Envoy route** (a `route_name` / upstream cluster is present and the request is *not* `no_route_found`). This is a real endpoint **regardless of status code**: a `401`/`403`/`500` from a real backend is a real protected-or-broken endpoint, not attack surface.
- **Attack surface (`confirmed != true`)** — the request **matched no route** (`no_route_found`), or carried scanner/probe risk flags, or served static-asset / SPA content. This is a genuine probe or shadow scan — `/.env`, `/cgi-bin`, `wp-login.php`, SPA-fallback `200`s — and it is kept **out of the real API catalog**.

The `confirmed` flag is **sticky** (`$max`-merged): once an operation is seen as real, it stays real. Status code is used only as a fallback (2xx–3xx + an API content-type) when the access log carries no routing signal at all.

The endpoints view exposes both as a toggle, plus a **maturity gate** that hides one-off hits, because route-aware confirmation can promote an endpoint on a single match. See [Exploring Endpoints](/api-discovery/endpoints).

## What you get

| Capability | Where |
|---|---|
| **Endpoint inventory** — per-operation catalog, confirmed vs attack surface, path-rollup grouping | [Exploring Endpoints](/api-discovery/endpoints) |
| **Discovery dashboards** — new APIs, auth coverage, bots/scanners, PII, zombies, risk, security score, transport, errors, drift, consumers | [Discovery Dashboards](/api-discovery/dashboards) |
| **Two-axis risk scoring** — Threat (active attack/abuse) vs Exposure (config hygiene), current-vs-lifetime, A–F grade | [Risk Scoring](/api-discovery/risk-scoring) |
| **Full risk-flag catalog** — every flag, OWASP API Top-10 mapping, per-flag remediation | [Risk Flags Reference](/api-discovery/risk-flags-reference) |
| **PII & auth detection** — PII categories, consumer fingerprinting, auth schemes | [PII & Auth Detection](/api-discovery/pii-and-auth) |
| **Path normalization** — how IDs collapse into templates, and how to fix gaps | [Path Normalization](/api-discovery/path-normalization) |
| **OpenAPI export** — export the discovered surface as OpenAPI 3.x (YAML/JSON) | [OpenAPI Export](/api-discovery/openapi-export) |
| **Suggest-policy bridge** — draft a Shield `SecurityPolicy` from discovered endpoints | [Suggest Policy](/api-discovery/suggest-policy) |
| **Operations & tuning** — collector env, runtime config, detector thresholds | [Collector Configuration](/api-discovery/collector-configuration) · [Collector Reference](/api-discovery/collector-reference) |

## Related

- [Elchi Shield — inline API security](/shield/overview) — the enforcement counterpart that Discovery feeds
- [Shield: Getting Started](/shield/getting-started)
- [Observability: metrics & logs](/observability/metrics-and-logs)
