---
title: GSLB Statistics
description: The GSLB Statistics dashboard — probe success rate, IP health distribution, error breakdown, latency and success-rate timelines, and the worker/timewheel/write-buffer internals, filtered per controller and time range.
sidebar_position: 5
tags: [gslb, traffic]
---

The **GSLB Statistics** page is the observability surface for the health checker. It surfaces the probe and health-check metrics that each Controller pushes — how many IPs are healthy, whether probes are succeeding, how fast they respond, and how the internal probing machinery is holding up. Use it to confirm GSLB is doing its job and to catch trouble before it reaches DNS.

## Scope: controller and time range

Two selectors at the top scope every chart:

- **Controller** — `All Controllers`, or a specific controller. Because the health checker shards its work across controllers (each owns a subset of shards), per-controller scoping lets you spot an imbalanced or unhealthy node. Aggregate with `All`.
- **Time range** — `Last 15 minutes`, `Last 1 hour` (default), `Last 6 hours`, or `Last 24 hours`. Timelines and rates are computed over this window; a **Refresh** button re-pulls on demand.

## IP health at a glance

Four headline cards summarize the IP population:

| Card | Meaning |
| --- | --- |
| **Total IPs** | All IPs under health checking. |
| **Healthy IPs** | IPs in `passing` (served in DNS), shown against the total. |
| **Critical IPs** | IPs evicted from DNS. A non-zero, rising count is your primary alert signal. |
| **Backoff Active** | IPs currently in circuit-breaker backoff (repeatedly-failing `critical` IPs being probed on graduated backoff). |

The **IP Health Distribution** donut breaks the population into Healthy / Warning / Critical, and a footnote surfaces the **Warning IPs** count — the early-warning tier that is still served but failing checks.

## Probe success and errors

- **Probe Success Rate** — a gauge (red < 30%, amber 30–70%, green ≥ 70%) with raw success and failure counts beneath it. This is the single best "is GSLB healthy?" indicator.
- **Success Rate Timeline** — success percentage over the selected window; a dip localizes when things went wrong.
- **Error Breakdown** — a donut of failure causes (e.g. timeout, connection refused, DNS failure). The health checker categorizes 21+ error types, so this tells you *why* probes fail — a wave of `connection_refused` points at dead backends, `timeout` at network or overloaded targets, `dns_failure` at resolution problems.

## Latency

- **Probe Latency Timeline** — average probe latency over the window, with **Min / Avg / Max** tags. Rising latency often precedes failures — endpoints slow down before they fall over — so treat a climbing average as an early warning even while the success rate still looks fine.

## Health-checker internals

Three panels expose the probing machinery itself. These are capacity/saturation signals — watch them when probe throughput is high or you're scaling the IP population.

**Worker Pool** — the shared, CPU-aware probe worker pool:

| Metric | Watch for |
| --- | --- |
| Active Workers | Current pool size (auto-scales with load). |
| Queue Depth | Pending probe tasks — sustained non-zero means workers can't keep up. |
| Result Queue | Pending probe results awaiting processing. |
| Result Queue Capacity | Percent full; the bar turns red above 80% (backpressure risk). |

**Timewheel Scheduler** — the per-IP probe scheduler:

| Metric | Meaning |
| --- | --- |
| Current Load | Tasks currently scheduled in the wheel. |
| Current Slot | The slot the wheel is executing. |
| Scheduled Total | Cumulative tasks scheduled. |
| Executed Total | Cumulative probes fired — should climb steadily; a flat line means no probing is happening. |

**Write Buffer** — batched persistence of health-state changes to MongoDB:

| Metric | Watch for |
| --- | --- |
| Buffer Size | Pending buffered updates. |
| Flush Total | Cumulative flushes to the database. |
| Flush Errors | Non-zero (red) indicates database write problems. |
| Avg Flush Duration | Per-flush latency; rising values point at database pressure. |
| Buffer Capacity | Percent full; red above 80%. |

A footer strip also reports **Owned Shards** (how many partitions this controller is responsible for) and **Write Buffer Updates Total**.

## What to monitor

For day-to-day operation, the signals that matter most:

1. **Critical IPs** and the **Success Rate gauge** — the health outcome. A jump in critical count or a drop below your success-rate floor means real endpoints are failing.
2. **Error Breakdown** — the *cause*, so you know where to look (backend, network, or DNS).
3. **Latency Timeline** — the leading indicator, catching degradation before eviction.
4. **Owned Shards balance** across controllers — an uneven distribution, or a controller with zero executed probes, signals a sharding or HA problem (see [Registry & HA](/administration/registry-and-ha)).
5. **Flush Errors** and **queue capacity bars** — infrastructure saturation that can stall state updates from reaching DNS.

For the per-IP detail behind these aggregates — individual health states, backoff, and probe error messages — drill into a record's IPs in [Records & IPs](/traffic-and-certificates/gslb/records-and-ips).
