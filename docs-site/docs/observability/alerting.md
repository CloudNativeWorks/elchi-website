---
title: Recommended Alerts
description: A tiered set of PromQL alerting rules for an Elchi platform — config health, shield safety, collector backpressure, and backend/registry health — using the exact documented metric names, with honestly-framed starting thresholds.
sidebar_position: 4
tags: [operations]
---

This page turns the metrics Elchi already exports into concrete alerts. Every expression uses a **documented metric name verbatim** (from [Shield Observability](/shield/observability) and [Collector Reference](/api-discovery/collector-reference)); every threshold is a **starting point** to tune against your own baseline, not a tuned production value.

:::info[Where these metrics live]
Shield and collector metrics reach Prometheus/VictoriaMetrics via the OTLP push path already described in [Metrics & Logs](/observability/metrics-and-logs): shield's `/metrics` is always scrapeable and *also* pushes over OTLP when `--metrics-otlp-endpoint` is set; the collector is scraped at `:18091/metrics`. All the PromQL below assumes those series have landed in your metrics store. Shield series carry an `instance` label (and per-request series a `listener` label), so alert `by (instance)` to pin a noisy edge.
:::

:::warning[Thresholds are starting points — measure your baseline first]
The comparison values below (`> 0`, rates, `for:` windows) are deliberately conservative defaults. Some signals — like `audit_events_dropped_total > 0` — genuinely warrant "any is bad." Others — like a fail-close *rate* — need a threshold set from your own traffic. Run for a week, look at the normal range, then set thresholds above it. Do not page on an unmeasured number.
:::

## Tier 1 — Config health (a push is failing)

Config is delivered as files and hot-reloaded atomically; a bad config **keeps the last-good one active** rather than taking traffic down. That safety is exactly why a failing push is *silent* on the data path — you must alert on it explicitly.

### An edge is rejecting config pushes

`config_reload_failures_consecutive` is `0` after any successful reload and climbs while the edge is stuck rejecting a newer config (it stays on last-good). Any non-zero value means a push is not landing.

```promql
# Shield: an edge is stuck on last-good config
elchi_shield_config_reload_failures_consecutive > 0
```

**Threshold:** `> 0` is meaningful on its own; add `for: 5m` to ignore the brief remove-then-recreate window of an `elchi-client` push. When it fires, read `/configz` on that edge for the attributed reload error.

### Active config is stale

`config_age_seconds` is the seconds since the active config was built. A value far above your normal push cadence means either nothing is being pushed or pushes are being rejected (correlate with the alert above).

```promql
# Shield: active config older than expected (tune the bound to your push cadence)
elchi_shield_config_age_seconds > 86400
```

**Threshold:** `86400` (24h) is a placeholder — set it to a few multiples of how often you actually push policy. A long age is only a problem if you *expected* a change.

The collector has the analogous signal — `runtime_config_version` should advance when you change its runtime config doc (covered under [collector](#tier-3--collector-ingest-health) below).

## Tier 2 — Shield safety (you are losing protection or evidence)

These are the alerts that mean the security function itself is degraded.

### Forensic audit is being lost

Two distinct failure modes, both a forensic gap: the bounded queue dropped events (`audit_events_dropped_total`), or the sink rejected writes (`audit_export_errors_total`, e.g. ClickHouse unreachable).

```promql
# Shield: audit evidence is being dropped or failing to export
rate(elchi_shield_audit_events_dropped_total[5m]) > 0
  or rate(elchi_shield_audit_export_errors_total[5m]) > 0
```

**Threshold:** treat any sustained non-zero rate as actionable — findings (block/detect/shadow) are always meant to be audited, so a drop is lost evidence. Also alert on a sink that silently degraded to no-audit at boot:

```promql
# Shield: a sidecar booted WITHOUT the audit sink it was expected to have
elchi_shield_audit_enabled == 0
```

Only alert on `audit_enabled == 0` for edges where a sink is configured (audit is legitimately off when no DSN/endpoint is set — see [Shield Observability](/shield/observability)).

### Inspection failures are closing traffic

`fail_close_total` counts requests denied because inspection *failed* (not because a rule matched). A spike means an engine is erroring — a bad JWKS fetch, a Coraza body-processing failure — and fail-close policies are turning that into denied traffic.

```promql
# Shield: inspection failures are denying requests (fail-close firing)
rate(elchi_shield_fail_close_total[5m]) > 0
```

**Threshold:** a low steady trickle may be normal; page on a *spike* relative to baseline. Pair with `timeouts_total`, which is the most common cause:

```promql
# Shield: per-request processing timeouts rising
rate(elchi_shield_timeouts_total[5m]) > 0
```

### The engine is panicking

`extproc_errors_total` is labeled by `kind`; a recovered panic is the one to page on (the process survives — one stream dies — but a panicking engine is a bug).

```promql
# Shield: recovered panics in the ext_proc path
rate(elchi_shield_extproc_errors_total{kind="panic"}[5m]) > 0
```

**Threshold:** any panic rate is worth investigating. (The exact `kind` label values are enumerated in [Shield Observability](/shield/observability); confirm the panic label against your build.)

### A goroutine leak (the slow-burn outage)

`go_goroutines` is the canonical leak signal. Healthy shield goroutines are per-stream (end with the stream) or fixed; a steady climb that never comes back down is a leak that ends in OOM.

```promql
# Shield: goroutines trending up over an hour (leak signal)
deriv(go_goroutines{instance=~".*-shield"}[1h]) > 0
  and go_goroutines{instance=~".*-shield"} > 1000
```

**Threshold:** a positive one-hour derivative *combined with* an absolute floor avoids paging on normal load ramps. Set the floor from your observed steady-state count.

### Approaching resource caps

`streams_in_flight` near the server's `MaxConcurrentStreams` ceiling, or `inflight_body_bytes` near `--max-inflight-body-bytes`, means shield is about to shed load. `body_budget_rejections_total` is the confirmation that bodies are already being truncated/blocked at intake.

```promql
# Shield: bodies being rejected at intake by a memory bound
rate(elchi_shield_body_budget_rejections_total[5m]) > 0
```

**Threshold:** any sustained rate means a client is sending oversized bodies *or* the process-wide body budget is undersized for concurrency — the `reason` label (`per_request_cap` vs `inflight_budget`) tells you which. There is no exported gauge of the *ceiling*, so alert on the rejection rate and on `streams_in_flight` / `inflight_body_bytes` growth rather than a percentage-of-cap expression.

## Tier 3 — Collector ingest health

The collector is non-blocking by design (`drop_new` backpressure), so it protects Envoy at the cost of dropping events under sink pressure — which means **drops are your signal that discovery/forensics are incomplete**, not that traffic is affected.

### Events are being dropped (backpressure)

`elchi_collector_events_dropped_total` labels every drop with a `reason` (`backpressure`/`drop_new`/`drop_old`, `inventory_cardinality`, `malformed`, `panic`, the exclude filters, …).

```promql
# Collector: events dropped due to sink backpressure
sum by (reason) (rate(elchi_collector_events_dropped_total{reason=~"backpressure|drop_new|drop_old"}[5m])) > 0
```

**Threshold:** backpressure drops mean ClickHouse can't keep up — scale the collector out or the sink up (see [Sizing & Capacity](/administration/sizing-and-capacity)). A rising `inventory_cardinality` reason instead means you've hit `MONGO_INVENTORY_CARDINALITY_CAP` — expected on very large surfaces, not an outage.

### Enrichment is failing

```promql
# Collector: enricher errors (GeoIP / threat-intel / UA lookups failing)
sum by (enricher) (rate(elchi_collector_enrich_errors_total[5m])) > 0
```

**Threshold:** correlate with `elchi_collector_geoip_lookups_total{result="no_db"}` — a spike of `no_db` means the GeoIP database isn't synced, not that lookups are erroring.

### Runtime config isn't advancing

`elchi_collector_runtime_config_version` should increase when you publish a new runtime config doc. Flat-when-you-expected-a-change means the poll is failing.

```promql
# Collector: runtime config version stuck despite a published change
changes(elchi_collector_runtime_config_version[30m]) == 0
```

**Threshold:** this is only meaningful right after you push a change; pair it with `elchi_collector_runtime_config_poll_failures_total` rising, which is the unambiguous failure signal.

## Tier 4 — Backend, jobs, and registry

:::note[Backend job/registry health is surfaced via the UI and controller endpoints, not (all) as Prometheus series]
Unlike shield and the collector, the backend's **job system and registry are primarily observed through the controller REST endpoints and the UI** — the sources document `GET /jobs/stuck`, `GET /jobs/stats`, and the Registry instances view, not a documented `elchi_backend_*` Prometheus metric set. The checks below are framed accordingly: alert on what the platform actually exposes, and don't invent metric names that aren't there.
:::

### Stuck background jobs

A **stuck job** is one whose heartbeat has gone stale (**> 5 min**), meaning a worker died or a step hung. Persistent stuck jobs point at an upstream problem (control-plane unreachable, a bad config, a DNS-01 that can't validate). Monitor this via `GET /jobs/stuck` — a healthy system shows few or none, clearing on retry. See [Background Jobs](/observability/background-jobs) for the full job lifecycle and the live-log drill-down.

**Recommendation:** wire a periodic probe of `/jobs/stuck` (or watch the Jobs view) and alert when the stuck count stays non-zero across two consecutive checks. If your controller exposes a Prometheus series for this in your build, alert on that instead — but confirm the metric name against your deployment rather than assuming one.

### Registry instance count dropped

The Registry tracks every active controller and control-plane instance (with zone, version, node count, uptime) and runs leader election for singleton work. A drop in the live instance count below your HA replica target means an instance failed — the platform keeps running (standbys hydrate from registry snapshots), but you've lost redundancy.

**Recommendation:** alert when the observed instance count falls below your configured replica count (defaults are **4** controllers / **4** control-planes — see [Sizing & Capacity](/administration/sizing-and-capacity) and [Registry & HA](/administration/registry-and-ha)). If you expose backend pod readiness in your metrics store, a Kubernetes-level `kube_deployment_status_replicas_available` alert against those deployments is the most reliable version of this check.

### Elevated 5xx

If you surface backend API error rates (e.g. via the API discovery errors dashboard or an ingress metric), alert on a rising 5xx share the same way you would any API — from a measured baseline. The sources don't define a single canonical backend 5xx series, so use whatever your ingress/gateway already exports.

## Putting it together

A minimal first cut, in priority order:

1. `config_reload_failures_consecutive > 0` (`for: 5m`) — pushes aren't landing.
2. `audit_events_dropped_total` / `audit_export_errors_total` rate `> 0` — losing evidence.
3. `fail_close_total` / `timeouts_total` spike — inspection is failing closed.
4. `extproc_errors_total{kind="panic"}` — an engine bug.
5. `go_goroutines` climbing — a leak.
6. `elchi_collector_events_dropped_total{reason=~"drop_.*|backpressure"}` — the pipeline is shedding.
7. Stuck jobs / registry instance drop — control-plane health.

Tune each threshold against a week of your own data before you let it page someone.

## See also

- [Metrics & Logs](/observability/metrics-and-logs) — the full telemetry pipeline and where each signal goes.
- [Shield Observability](/shield/observability) — the complete `elchi_shield_*` metric catalog and audit model.
- [Collector Reference](/api-discovery/collector-reference) — the complete `elchi_collector_*` metric catalog.
- [Background Jobs](/observability/background-jobs) — the async job system and its stuck-job detection.
- [Sizing & Capacity](/administration/sizing-and-capacity) — what to change when an alert says you're undersized.
