---
title: Sizing & Capacity
description: Per-component resource guidance for an Elchi platform — control plane, MongoDB, ClickHouse, VictoriaMetrics, collector, and the shield sidecars — anchored to the Helm chart defaults, with a "what grows with what" model for planning capacity.
sidebar_position: 11
tags: [operations]
---

Elchi has two very different capacity profiles. The **central platform** (backend, MongoDB, ClickHouse, VictoriaMetrics, collector, UI) is sized once and grows with your *fleet size and traffic volume*. The **edge** — Envoy plus an `elchi-shield` sidecar per node — is sized per host and grows with *that node's request rate*. This page gives starting points for both.

:::warning[These are starting points, not a capacity spec]
Every number here is either a **Helm chart default** (cited as such — a conservative starting value the chart ships) or an explicit **recommendation**. None of them is a guaranteed capacity ceiling. The only honest sizing method is: deploy with the defaults, watch the metrics from [Recommended Alerts](/observability/alerting), and adjust. Treat the requests/limits below as "measure, then tune."
:::

## What grows with what

Before picking numbers, know the scaling driver for each component. Overprovisioning the wrong axis wastes money; underprovisioning the storage tier is what actually causes outages.

| Component | Primary scaling driver | Grows fastest with |
| --- | --- | --- |
| Controller / Control-Plane | Number of managed edge nodes + xDS churn | Fleet size, config-change frequency |
| Registry | Number of controller/control-plane instances | HA replica count (small) |
| **MongoDB** (system of record) | Config objects + API inventory cardinality | Distinct endpoints discovered, number of resources |
| **ClickHouse** (API events + shield audit) | Traffic volume × retention | **Requests/sec × retention days — the biggest storage consumer** |
| VictoriaMetrics | Active time series | Number of edges × metric cardinality × retention |
| Collector | ALS events/sec + distinct endpoints | Edge request rate, endpoint count |
| **elchi-shield** (per edge) | That node's request rate + body inspection | req/s on the node, whether bodies are inspected |

The single most important planning fact: **ClickHouse is almost always the largest and fastest-growing store**, because it holds one row per API request (in the collector's `api_events_raw`) plus shield's audit findings, both bounded only by retention. MongoDB grows slowly (it is cardinality-capped); VictoriaMetrics grows with series count, not raw traffic.

## Control plane (backend)

The backend runs three processes — Controller, Control-Plane, and Registry — each with its own resource block in the Helm chart. The chart's defaults:

| Process | Requests (cpu / mem) | Limits (cpu / mem) | Default replicas |
| --- | --- | --- | --- |
| Controller | `100m` / `128Mi` | `2000m` / `2Gi` | **4** |
| Control-Plane | `100m` / `256Mi` | `1000m` / `4Gi` | **4** |
| Registry | `50m` / `64Mi` | `500m` / `512Mi` | (runs with the backend) |

*(Sourced: `charts/elchi-stack/charts/elchi-backend/values.yaml` for resources; `global.elchiBackend.controllerDefaultReplicas` / `controlPlaneDefaultReplicas`, both `4`, in `values.yaml`.)*

The replica count of **4** for Controller and Control-Plane is what the chart ships for HA — see [Registry & HA](/administration/registry-and-ha) for how leader election and standby hydration make those replicas resilient rather than merely redundant. The wide request-to-limit gap (e.g. Controller `128Mi` → `2Gi`) means these pods idle cheaply but can burst under a fleet-wide config push.

**Recommendation:** keep 4/4 for any production deployment; the Control-Plane's `4Gi` limit is the one to watch first as your xDS snapshot (number of listeners/clusters/routes across the fleet) grows. Scale replicas out before raising limits — the processes are horizontally scalable behind the Registry.

## MongoDB — the system of record

MongoDB holds all configuration (the source of truth) and the collector's `api_inventory` endpoint catalog. Chart defaults:

- `replicaCount: 1`, requests `100m` / `256Mi`, limits `1000m` / `2Gi`, persistence **`5Gi`** *(`charts/.../mongodb/values.yaml`)*.

MongoDB grows slowly and predictably. Config objects are small. The inventory is **cardinality-capped** — the collector admits at most `MONGO_INVENTORY_CARDINALITY_CAP` (default `100000`) distinct endpoints per instance before new keys are dropped (see [Collector Reference](/api-discovery/collector-reference)), so inventory size is bounded by *distinct operations*, not raw request volume.

:::warning[The bundled single-replica MongoDB is not a production datastore]
`replicaCount: 1` with a `5Gi` PVC is a get-started default. For production, point Elchi at an **external, replicated MongoDB** — exactly what the office-deployment example does (`installMongo: false` with an external `mongodb.hosts` replica set in `values_office.yaml`). MongoDB is the system of record; its durability is your platform's durability. See [Storage](/installation/helm-platform/storage) and [Production Deployment](/installation/helm-platform/production).
:::

## ClickHouse — API events + shield audit (biggest storage consumer)

ClickHouse stores two append-only streams: the collector's `api_events_raw` (one row per API request) and shield's `elchi_shield_audit` (one row per security finding, plus sampled allows). Chart defaults:

- `replicaCount: 1`, requests `250m` / `256Mi`, limits `1000m` / `2Gi`, persistence **`10Gi`** *(`charts/.../clickhouse/values.yaml`)*.

The `10Gi` default is a starting PVC, not a capacity plan. Both tables are **TTL-bounded** — `RETENTION_DAYS` (default **`7`**) for the collector's raw events, and shield's audit TTL (default **7 days**, `--audit-clickhouse-ttl-days`) — and daily-partitioned so old data is dropped whole. That TTL is what keeps ClickHouse from growing without bound.

### Estimating ClickHouse storage

Storage is roughly:

```
raw_events_bytes  ≈  events_per_sec × 86400 × retention_days × bytes_per_row_stored
```

Two things make `bytes_per_row_stored` far smaller than a raw event: the schema is `LowCardinality`-dictionary-encoded and ZSTD-compressed, which the collector docs put at **10–20× compression** versus raw. So the *stored* bytes-per-row is a fraction of the logical row.

:::note[This is a recommendation-grade estimate]
There is **no official bytes-per-row figure** in the sources. The 10–20× compression ratio *is* sourced (see [Collector Reference](/api-discovery/collector-reference), `api_events_raw` schema notes). To size ClickHouse honestly: run at real traffic for a day, read the actual on-disk partition size from `system.parts`, divide by that day's event count to get *your* bytes-per-row, then multiply out by `RETENTION_DAYS`. Do not commit a hard PVC number from a formula alone.
:::

Shield's audit stream is smaller than the collector's raw events for most fleets, because **findings are always audited but the allow stream is sampled** (`sampling_rate` default `0.05` — 5%) with an optional `--audit-max-per-sec` cap. Reducing the sampling rate or the retention is the direct lever if the audit table outgrows its budget.

**Recommendation:** for anything past a demo, use an **external ClickHouse** (`installClickhouse: false`) on disks sized from a measured day of traffic, and shorten `RETENTION_DAYS` before adding disk if you are storage-bound. Forensic depth trades directly against storage.

## VictoriaMetrics — the metrics store

VictoriaMetrics ingests Envoy stats, shield metrics, and collector metrics (via the OTLP push path documented in [Metrics & Logs](/observability/metrics-and-logs)). Chart defaults:

- requests `50m` / `128Mi`, limits `1000m` / `2Gi`, persistence **`5Gi`**, `retentionPeriod: "15d"` *(`charts/.../victoriametrics/values.yaml`)*.

VictoriaMetrics grows with **active time series**, not request volume — that is, the number of edges times metric cardinality times retention. Shield's per-request metrics carry an `instance` and a `listener` label (capped at `maxListenerSeries`), so a large fleet multiplies series by node count. The `15d` retention is longer than the 7-day event TTL by design: metrics are cheap and useful for trend analysis.

**Recommendation:** watch VictoriaMetrics memory as you add edges; series count, not traffic, is the driver. Raise the PVC and `retentionPeriod` together, and prefer an external VictoriaMetrics for large fleets (as `values_office.yaml` does with an external `victoriametrics.endpoint`).

## Collector — ALS ingestion

The collector is **stateless and horizontally scaled** — ALS streams from edge Envoys are load-balanced across replicas. Chart defaults:

- `replicaCount: 3`, requests `100m` / `128Mi`, limits `1000m` / `512Mi` *(`charts/.../elchi-collector/values.yaml`)*.

Memory is bounded on purpose, not left to chance:

| Knob | Default | What it bounds |
| --- | --- | --- |
| `goMemLimit` | `500MiB` (chart) / `GOMEMLIMIT` env | Go soft heap cap; set ~80% of the container mem limit so GC turns aggressive before OOMKill |
| `batch.queueSize` | `20000` | Total in-flight items across shards (~18 MB of buffers) |
| `batch.maxSize` / `maxBytes` | `20000` rows / `8MiB` | Per-flush budget to ClickHouse (total, divided across shards) |
| `batch.backpressurePolicy` | `drop_new` | Keeps ingest non-blocking when the sink is slow (drops rather than stalls Envoy) |
| `MONGO_INVENTORY_CARDINALITY_CAP` | `100000` | Distinct endpoints admitted per instance |
| `ENRICHER_TIMEOUT` | `50ms` | Per-enricher budget so one slow lookup can't starve the chain |

The collector scales with **events/sec and endpoint count**. Because the batch budgets are *total and divided across shards*, adding shards makes each ClickHouse insert smaller without raising memory. The `512Mi` limit paired with a `500MiB` `goMemLimit` is a deliberately tight box — see [Collector Reference](/api-discovery/collector-reference) for the full env surface.

**Recommendation:** scale the collector *out* (more replicas) before *up*; it is stateless and the chart already defaults to 3. Watch `elchi_collector_events_dropped_total` (backpressure) and OOM signals; if you see drops with headroom on CPU, the ClickHouse sink is the bottleneck, not the collector.

## elchi-shield — the edge sidecar

Shield runs **on each edge node, in the Envoy data path** over `ext_proc`. Its footprint is dominated by the ext_proc transport, not the inspection engine: the engine's hot path is sub-microsecond and allocation-lean (policy resolve ≈ 55 ns, 0 allocs), while the per-request cost is the gRPC stream lifecycle. On a single 10-core box (Envoy + driver co-resident), shield sustains roughly **~39k req/s passthrough, ~31k header-only, ~23k body-inspecting** — figures from `docs/PERFORMANCE.md`, explicitly labeled *relative, not absolute*; re-measure on your hardware.

The memory-safety bounds you actually size against:

| Flag / setting | Default | What it bounds |
| --- | --- | --- |
| `--max-inflight-body-bytes` | `256MiB` (`256<<20`) | Total body bytes buffered across **all** concurrent streams (process-wide cap) |
| `--max-body-bytes` | `1MiB` (`1<<20`) | Per-request body cap when a policy sets none |
| `--mem-limit-bytes` (`GOMEMLIMIT`) | unset | Soft heap cap; must sit **well above** the in-flight body budget or GC thrashes |
| `MaxConcurrentStreams` | raised off gRPC's default 100 | Concurrent ext_proc streams the server accepts |

*(Sourced: `cmd/elchi-shield/main.go` flag defaults.)*

Two cost multipliers to plan around:

1. **Body inspection is the expensive path.** Headers-only policies avoid all body buffering and a second ext_proc round-trip. Body-inspecting policies (Coraza WAF, DLP, GraphQL, OpenAPI) buffer the body — and the `--max-inflight-body-bytes` cap is a *process-wide* budget precisely so per-request caps don't become a ×concurrency memory DoS. Enable body inspection only on routes that need it.
2. **`GOMEMLIMIT` must exceed the body budget.** Shield warns at startup if `--mem-limit-bytes < 2 × --max-inflight-body-bytes`. Size the container memory limit above the body budget with room for the runtime, then set `GOMEMLIMIT` to ~80% of it.

:::note[Shield sizing is per-node and mostly self-bounding]
There is **no official per-node CPU/memory recommendation** in the sources — shield is not in the Helm platform chart (it deploys to edges via `elchi-client`, not Helm). The right approach: give it a CPU *limit* (Go 1.25+ sizes `GOMAXPROCS` from it automatically), set `GOMEMLIMIT` above the body budget, and watch `inflight_body_bytes`, `streams_in_flight`, and `go_goroutines`. The engine will not be your bottleneck; the transport and body buffering will.
:::

## See also

- [Storage](/installation/helm-platform/storage) — PVCs, storage classes, and external datastores.
- [Production Deployment](/installation/helm-platform/production) — replica counts, external stores, and HA wiring.
- [Collector Reference](/api-discovery/collector-reference) — the full collector env surface and batch tuning.
- [Recommended Alerts](/observability/alerting) — the metrics to watch while you tune these numbers.
- [Registry & HA](/administration/registry-and-ha) — what the control-plane replica count buys you.
