---
title: Overview Dashboard
description: The live Shield metrics dashboard — traffic, latency, findings, audit pipeline, sidecar health, and per-edge config rollout, fed by VictoriaMetrics.
sidebar_position: 2
---

**Shield → Overview** is a live operational dashboard for the project's Shield sidecars, fed by the metrics pipeline (Shield pushes to the OTel Collector, which forwards to VictoriaMetrics; the UI queries `query_range`). It answers the *rates-and-latency* questions — how much traffic Shield is seeing, what share is blocked, how much latency it adds, whether the edges are healthy — and complements the per-event [Security Events](/shield/ui/security-events) feed, which answers *what exactly happened to this request*.

The tab is gated to **Admin** and **Owner** roles. Traffic panels are scoped to the current project via the `listener` metric label (the Envoy node id, `listener::project::ip`); sidecar-health panels have no project dimension and are shown **across all edges** by `instance`.

## Reading the numbers

A range selector switches the window between **1h / 6h / 24h / 7d**, and the page auto-refreshes every **30 seconds** (only while the tab is active). Two things to keep in mind when reading any value:

- The y-axis is **per second**. Every point is a `rate()` **average over a rate window** derived from the selected range, plotted at the step resolution — both are stated under the title (e.g. "each point is a 5m average at 30s resolution").
- The stat tiles show the **latest window-averaged value, not an instantaneous reading**. A tile reading `1.22/s` means "averaged over the last rate window", not "right now".

Time charts share a synced crosshair, and vertical **reload markers** are drawn wherever a config reload landed on any edge — so a traffic or latency shift can be correlated with a policy push at a glance. Quiet panels (flat-zero in the window) are hidden to keep the common case compact, and the Health section auto-expands when an edge needs attention.

Four headline tiles are always visible: **Requests** (rate reaching Shield), **Blocked** (with the blocked share of traffic), **Detected** (detect-mode would-blocks — findings that were logged but allowed), and **Latency p95** (Shield's *own* processing time per request, not the backend's).

## Traffic & latency

- **Throughput** — requests, blocked, and detected per second on one chart.
- **Blocked share of traffic (%)** — blocked as a ratio of requests, with a now-tag that turns warning/error at high shares. A high share is normal under an attack or demo load, alarming on real traffic.
- **Request processing latency (p50 / p95 / p99)** — Shield's per-request processing time, drawn against a dashed **200 ms reference line**. Note this line is a fixed dashboard reference, not the actual default: the built-in default `timeout` is **50 ms**, and the real budget is per-policy (see [Body Inspection & Limits](/shield/policies/body-inspection)). The tag shows p99 as a share of the 200 ms reference.
- **Latency by phase (p95)** — the same latency split by processing phase (`request_headers`, `request_body`, `response_headers`, `response_body`), which localizes cost to header checks vs body/WAF inspection.
- **Requests by edge** — request rate per edge in this project, labeled `listener (ip)` from the node id.

## Security findings

A row of tiles first: **Body inspected** (bytes/s decoded and inspected), **DLP redactions** (bodies rewritten per second via the body-mutation channel), **Intake rejections** (bodies truncated/blocked per second by the per-request cap or the process-wide in-flight budget — a DoS bound), and **Detect+shadow** (would-block findings per second across all engines).

- **Blocked findings by engine** — a stacked chart of block-action findings per engine (top 8, the rest folded into "other"), with a table of the top blockers and their share of blocks.
- **Would-block by engine (detect / shadow)** — shown when any policy runs in a monitor mode; what *would* be blocked if those policies were switched to `block`. This is the chart to watch during a [shadow rollout](/shield/policies/modes-and-postures).
- **DLP redactions & intake rejections** — the redaction and truncation rates over time (rejections split by reason: `per_request_cap` vs `inflight_budget`).

## Audit & pipeline

Tiles: **Audit queue** (current depth of the bounded, drop-on-full queue — persistently high means the sink can't keep up), **Audit dropped** (events dropped per second; non-zero means the Security Events feed has a forensic gap), **Export errors** (the sink — ClickHouse/OTLP — rejected events, e.g. unreachable), and **ext_proc errors** (stream errors: recovered panics, transport drops, build failures). The section header flags **audit degraded** whenever drops or export errors are non-zero.

- **Audit dropped & export errors** — the two loss rates over time, across all edges.
- **Pipeline stages** — a table of every pipeline stage with its per-second action rates (continue/allow/deny/…) and p95 latency: *which check does the work*, and which check is slow.

## Sidecar & config

Tiles: **Goroutines** (the canonical leak signal — a steady climb with flat traffic is a leak), **Memory (RSS)**, **Streams / body** (concurrent ext_proc streams in flight and buffered body bytes — live load and memory pressure), and **CPU** (cores busy across shield edges).

- **Goroutines & in-flight streams** — the leak/load signal over time.
- **Config & rollout (per edge)** — a per-edge table joining `build_info` with config state: the running Shield **version** (with revision on hover), the **config age** (seconds since the active config was built — a growing age with recent pushes means the edge is stuck on last-good), and the consecutive **reload-failure** streak.

## Health

Tiles for **Fail-open**, **Fail-close**, **Timeouts**, and the worst **consecutive reload-failure** streak, plus:

- **Fail-close / timeouts / ext_proc errors** over time (all edges).
- **Per-edge health (current)** — a table sorted worst-first by fail-close rate, then reload failures, then timeouts, so the edge needing attention is always on top.

:::tip
Fail-close events mean requests were **denied because inspection failed**, not because a rule matched — that is an availability problem, not a security event. Timeouts plus fail-close on one edge usually point at an overloaded sidecar or an unreachable dependency. See [Metrics, Audit & Health](/shield/observability) for the underlying metrics and alerting queries.
:::

## When to use it vs Security Events

Use the Overview dashboard for **trends and health**: is blocking spiking, which engine dominates, is latency inside the budget, did the last policy push apply everywhere. Switch to [Security Events](/shield/ui/security-events) when you need **individual events**: which requests were blocked, from which edge, by which rule, with what reason.
