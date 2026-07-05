---
title: Port atlas
description: Every port the bare-metal Elchi stack listens on, per service and per node role.
sidebar_position: 9
---

| Service | Port | Where it runs |
|---|---|---|
| Envoy public (TLS) | `0.0.0.0:443` | Every node (configurable via `--port`) |
| Envoy internal (plaintext) | `127.0.0.1:8080` | Every node — UI/API to backend |
| Envoy admin | `127.0.0.1:9901` | Every node — hardcoded loopback only |
| nginx (UI) | `127.0.0.1:8081` | Every node — SPA + config.js, fronted by Envoy |
| Registry gRPC | `0.0.0.0:1870` | Every node — HA peer set; Envoy gRPC HC picks the leader |
| Registry metrics | `:9091` | Every node — hardcoded in backend; OTel scrape target |
| Controller REST | `:1980` | Every node — singleton, uses `versions[0]` binary |
| Controller gRPC | `:1960` | Every node — singleton |
| Control-plane | `:1990, 1991, …` | Every node — one port per variant by 0-indexed list position; same variant gets same port on every node |
| OTel gRPC | `:4317` | Every node — local sink for envoy `/opentelemetry` |
| OTel HTTP | `:4318` | Every node |
| OTel health | `:13133` | Every node |
| OTel prom self-metrics | `:8888` | Every node |
| MongoDB | `:27017` | Standalone for 1-2 VM topology, RS-3 for 3+ |
| Grafana | `127.0.0.1:3000` | M1 only — reverse-proxied at `/grafana/` |
| VictoriaMetrics | `0.0.0.0:8428` | M1 only (with `--vm=local`) |
| CoreDNS | `:53/tcp+udp` | Every node when GSLB enabled |
| CoreDNS webhook | `0.0.0.0:8053` | M1 → M2/M3 push notifications (X-Elchi-Secret auth) |
| ClickHouse native | `0.0.0.0:9000` | CH server TCP wire protocol; cluster member on every node |
| ClickHouse HTTP | `0.0.0.0:8123` | CH HTTP interface; used by collector + backend for queries |
| ClickHouse interserver | `0.0.0.0:9009` | Inter-replica replication (3+ node clusters only) |
| ClickHouse Keeper | `0.0.0.0:9181` | Embedded Raft coordination client port (3+ node clusters only) |
| ClickHouse Keeper Raft | `0.0.0.0:9234` | Keeper inter-peer Raft consensus traffic (3+ node) |
| elchi-collector gRPC | `0.0.0.0:18090` | ALS sink — Envoy data-plane proxies push Access Log Service streams here |
| elchi-collector HTTP | `0.0.0.0:18091` | Prometheus `/metrics` + health endpoint |
