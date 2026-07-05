---
title: Metrics, Audit & Health
description: Shield's full Prometheus metric set, the ClickHouse audit sink and its schema, metric delivery (scrape or OTLP push), and the loopback health endpoints.
sidebar_position: 10
---

Shield is built to be operated: every decision, failure, and resource bound is observable. This page catalogs the Prometheus metrics, the audit pipeline and its ClickHouse schema, and the loopback health endpoints. The [Overview dashboard](/shield/ui/overview-dashboard) in the UI is built on exactly these series.

## Prometheus metrics

All metrics live under the **`elchi_shield_`** namespace and carry a constant **`instance`** label (`--instance-id`, default `<hostname>-shield`) so a fleet of sidecars never mixes series. Per-request series additionally carry a **`listener`** label — the first ext_proc `request_attribute` Envoy sends (by convention the node id, `listener::project::ip`), falling back to `--listener-id`. Histograms use exponential buckets sized for sub-millisecond work.

### Request tallies

| Metric | Labels | Meaning |
|---|---|---|
| `requests_total` | `listener` | Requests processed (counted once per request, on the request direction) |
| `requests_allowed_total` | `listener` | Requests allowed |
| `requests_blocked_total` | `listener` | Requests blocked (a block on either direction counts) |
| `detections_total` | `listener` | Detect-mode would-block detections (request still allowed) |
| `shadow_detections_total` | `listener` | Shadow-mode would-block detections |

### Findings

| Metric | Labels | Meaning |
|---|---|---|
| `findings_total` | `listener`, `engine`, `action` | Findings by the engine that produced them and the action taken (`block` / `detect` / `shadow`). Structural body checks carry their own engine labels: `dlp`, `body_size` (truncation guard), `body_decode` (undecodable encoding); the cross-engine scorer reports as `anomaly` |

### Body handling

| Metric | Labels | Meaning |
|---|---|---|
| `body_inspected_bytes_total` | `listener` | Body bytes decoded and inspected |
| `body_mutations_total` | `listener` | Bodies rewritten by [DLP redaction](/shield/policies/dlp) |
| `body_budget_rejections_total` | `listener`, `reason` | Bodies truncated/blocked at intake by a memory bound: `per_request_cap` or `inflight_budget` |

### Latency and pipeline

| Metric | Labels | Meaning |
|---|---|---|
| `processing_latency_seconds` | `listener`, `phase` | Histogram of per-phase processing latency (`request_headers`, `request_body`, `response_headers`, `response_body`) |
| `stage_latency_seconds` | `stage` | Histogram of per-pipeline-stage latency |
| `stage_actions_total` | `stage`, `action` | Stage results by action — which check does the work |

### Reliability

| Metric | Labels | Meaning |
|---|---|---|
| `extproc_errors_total` | `kind` | ext_proc stream errors by kind (recovered panic, transport drop, pipeline-build failure, …) |
| `timeouts_total` | — | Per-request processing timeouts |
| `fail_open_total` | — | Fail-open posture applications (inspection failed, request allowed) |
| `fail_close_total` | — | Fail-close posture applications (inspection failed, request denied) |

### Config

| Metric | Labels | Meaning |
|---|---|---|
| `active_config_version` | `version` | Active config version (value is always 1; join on the label) |
| `config_reload_success_total` / `config_reload_failure_total` | — | Reload outcomes |
| `config_last_reload_success_timestamp_seconds` | — | Unix time of the last successful reload |
| `config_reload_failures_consecutive` | — | Consecutive failed reloads (0 after a success) — the "edge is stuck on last-good" signal |
| `config_age_seconds` | — | Seconds since the active config was built |

### Audit pipeline

| Metric | Labels | Meaning |
|---|---|---|
| `audit_enabled` | — | 1 if an audit sink is active, 0 if audit is off — including a configured sink that failed to init and silently degraded. Alert on 0 where a sink is expected |
| `audit_events_dropped_total` | — | Events dropped by the bounded queue or rate cap (a forensic gap) |
| `audit_export_errors_total` | — | Events the sink failed to write (e.g. ClickHouse unreachable) |
| `audit_queue_depth` | — | Current depth of the async audit queue |

### Live gauges and build info

| Metric | Labels | Meaning |
|---|---|---|
| `streams_in_flight` | — | ext_proc streams currently being served |
| `inflight_body_bytes` | — | Body bytes currently buffered across all streams |
| `build_info` | `version`, `revision`, `goversion`, `build_time` | Build metadata (value 1) — join to confirm rollouts |

The registry also exports the standard **`go_*`** collectors (goroutines, heap/GC detail, scheduler latency) and **`process_*`** collectors (CPU, open FDs, RSS), all carrying the `instance` label. `go_goroutines` is the canonical leak signal.

## Metric delivery: scrape or push

`/metrics` on the loopback HTTP server (`--http-addr`, default `127.0.0.1:9001`) is **always scrapeable**. Setting `--metrics-otlp-endpoint host:port` *additionally* pushes the same registry to an OTel Collector over OTLP/gRPC on a fixed interval (`--metrics-otlp-interval`, default 15s) — the collector forwards them on (e.g. to VictoriaMetrics), matching Envoy's stats-sink pipeline. Push init is non-fatal: a down collector never stops Shield, and the scrape endpoint keeps working. The OTLP resource carries `service.name=elchi-shield` and `service.instance.id=<instance>`.

## Audit sinks

Audit events are emitted asynchronously (bounded queue, drop-on-full — never blocking the request path) to one of two sinks:

- **ClickHouse** — the default whenever `--audit-clickhouse-dsn` is set. Batched inserts (default 500 rows, 1s time-based flush) into the central ClickHouse.
- **OTLP** — `--audit-otel-endpoint` sends events to an OTel Collector instead.

:::info[There is no local-file sink]
When neither sink is configured, audit is simply **off**: events are skipped, never written to a local file. A misconfigured or unreachable sink degrades to no-audit (non-fatal — traffic is unaffected); watch `audit_enabled` to catch a sidecar that booted without the audit you expected.
:::

Volume is bounded at the source: **findings (block/detect/shadow) are always audited**, while the allow stream is sampled per policy (`sampling_rate`, default 0.05) with an optional global cap (`--audit-max-per-sec`).

### The ClickHouse table

Shield provisions `elchi_shield_audit` (name overridable with `--audit-clickhouse-table`) best-effort at startup — a pre-provisioned table with an INSERT-only user also works:

```sql
CREATE TABLE IF NOT EXISTS elchi_shield_audit (
    ts             DateTime64(3) CODEC(DoubleDelta, ZSTD),
    instance       LowCardinality(String),
    node_id        LowCardinality(String),
    project_id     LowCardinality(String),
    listener       LowCardinality(String),
    request_id     String CODEC(ZSTD),
    phase          LowCardinality(String),
    direction      LowCardinality(String),
    action         LowCardinality(String),
    severity       LowCardinality(String),
    reason         String CODEC(ZSTD),
    rule_id        LowCardinality(String),
    policy_id      LowCardinality(String),
    engine         LowCardinality(String),
    host           LowCardinality(String),
    path           String CODEC(ZSTD),
    method         LowCardinality(String),
    status_code    UInt16 CODEC(ZSTD),
    config_version LowCardinality(String)
) ENGINE = MergeTree
PARTITION BY toYYYYMMDD(ts)
ORDER BY (project_id, ts)
TTL toDateTime(ts) + INTERVAL 7 DAY
```

Key properties: dictionary-encoded (`LowCardinality`) and ZSTD-compressed columns keep it small; **daily partitions** with a **row TTL (default 7 days**, `--audit-clickhouse-ttl-days`) bound it in time — old partitions are dropped whole. Shield also maintains a per-minute rollup (`elchi_shield_audit_1m` + a materialized view) that the backend's event summaries can aggregate instead of scanning raw rows. And by design, the table stores **no header or body values** — the path is query-stripped and reason strings carry no request content (see [Security Events](/shield/ui/security-events) for the full redaction model).

## Health endpoints

All on the loopback HTTP server (never exposed off-box):

| Endpoint | Purpose |
|---|---|
| `/healthz` | Liveness — the process is up |
| `/readyz` | Readiness — **has a non-empty, valid config to enforce**. A sidecar with no policy is deliberately not ready |
| `/configz` | The active config: version (content hash), hash, source files, domain count, built-at/age, instance and build info, plus the **last reload error** and cumulative rejected-reload count — this is what `elchi-client` polls to confirm a push (see [Deploying Policies to Edges](/shield/deployment)) |
| `/policyz?host=&path=&method=&content_type=` | Decision **explainability**: resolves a request shape to its policy and reports the structure — policy id, mode, fail posture, timeout, body-inspection flags, engine names, and the exact stage order per pipeline. Structure only; never rules, secrets, or payloads |
| `/debug/pprof/*` | Go profiling (on by default, `--pprof`) |

## Sample PromQL

```promql
# Blocked share of traffic per edge (5m):
sum by (instance) (rate(elchi_shield_requests_blocked_total[5m]))
  / sum by (instance) (rate(elchi_shield_requests_total[5m]))

# p99 processing latency per phase:
histogram_quantile(0.99,
  sum by (le, phase) (rate(elchi_shield_processing_latency_seconds_bucket[5m])))

# Which engine is blocking (top 5):
topk(5, sum by (engine) (rate(elchi_shield_findings_total{action="block"}[5m])))

# ALERT: an edge is rejecting config pushes (stuck on last-good):
elchi_shield_config_reload_failures_consecutive > 0

# ALERT: audit evidence is being lost:
rate(elchi_shield_audit_events_dropped_total[5m]) > 0
  or rate(elchi_shield_audit_export_errors_total[5m]) > 0

# ALERT: inspection failures are closing traffic:
rate(elchi_shield_fail_close_total[5m]) > 0
```
