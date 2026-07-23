---
title: Topology
description: How components distribute across 1, 2, and 3+ VM clusters — Mongo RS, per-node OTel and collector, ClickHouse replication, and the M1 storage tier.
sidebar_position: 10
---

**1 VM:** all-in-one. **2 VM:** Mongo standalone on M1; M2 connects over LAN. **3+ VM:** Mongo replica set across the first 3 nodes; additional nodes (4+) run no mongod. Registry runs on every node with HA leader election (Mongo lease, TTL 30s, renew 10s). UI/Envoy/backend run on every node — each node's front-door Envoy round-robins UI traffic across all peers' nginx instances and uses `ext_proc` + the registry to decide which control-plane / controller to route each request to (`x-target-cluster` header).

**OTEL collector on every node.** Each node ships its own `otelcol-contrib` instance bound to `0.0.0.0:4317/4318`; that node's Envoy routes `/opentelemetry` traffic to `127.0.0.1:4317` (no cross-node hop). All collectors export to the singleton VictoriaMetrics on M1 — or to `--vm-endpoint` when `--vm=external`. Failure mode: M1 OTEL outage no longer cascades to M2/M3 envoys, and the per-node collector's `sending_queue` buffers writes if VM is briefly unreachable.

**Storage tier stays on M1:** VictoriaMetrics TSDB and Grafana UI are still singletons. With `--vm=external` the TSDB moves out entirely; Grafana stays on M1.

**ClickHouse on the first 3 nodes.** Same first-3-nodes rule as Mongo: 1–2 node installs run `clickhouse-server` standalone on M1. 3+ node installs run a clustered CH with embedded Keeper on nodes 1–3: the `elchi` database is created as `ENGINE = Replicated('/clickhouse/databases/elchi', '{shard}', '{replica}')`, so the cluster-unaware collector's plain `CREATE TABLE` DDL is auto-promoted to `ReplicatedMergeTree` and tables replicate across all members via Keeper. On a ClickHouse member the collector writes to **127.0.0.1** — the Replicated engine handles fan-out — which keeps a 2 → 3 node growth from creating a peer-DDL race. Nodes beyond 3 run no local ClickHouse; their collectors reach the three cluster replicas over the LAN (comma-separated host list, driver-side load balancing / failover).

**elchi-collector on every node.** The collector ingests the Envoy ALS (Access Log Service) gRPC stream from data-plane proxies on its local `:18090` and writes events to ClickHouse (via loopback on the first 3 nodes; over the LAN to the three replicas on nodes 4+) + MongoDB. `/metrics` on `:18091` is scraped by the per-node OTel collector. ClickHouse replication carries the rows cluster-wide; cross-node ALS routing is not needed.
