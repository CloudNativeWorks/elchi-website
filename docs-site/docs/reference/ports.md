---
title: Port Reference
description: A unified port atlas across the whole Elchi stack — central platform and edge node, with exposure guidance for every listener.
sidebar_position: 3
tags: [reference]
---

Elchi is a two-tier system. The **central platform** runs once (the control plane, databases, observability, and the collector). Each **edge node** runs Envoy plus the local agents (`elchi-client`, `elchi-shield`). This page is the single cross-cutting map of every port either tier listens on, and how exposed each one should be.

:::info[Bare-metal specifics live elsewhere]
This atlas is the platform-wide view. For the exact ports the systemd installer opens per node role — including the Envoy front-door remapping, Registry/Controller/Control-plane port math, ClickHouse cluster ports, and CoreDNS — see the [bare-metal port atlas](/installation/bare-metal/port-atlas). Where the two disagree, the bare-metal atlas is authoritative for a systemd install; the numbers below are the process defaults.
:::

## Exposure legend

| Exposure | Meaning |
|---|---|
| **loopback** | Bound to `127.0.0.1` (or a Unix socket) — reachable only from the same host. Never expose. |
| **internal** | Reachable across the trusted platform/edge network (cluster peers, scrapers, xDS). Firewall to known peers. |
| **external** | Intentionally reachable by clients/end-users (the data-plane front door). |

## Central platform

The control plane, its datastores, observability, and API-discovery ingest. Runs on the management node(s).

| Port | Component | Purpose | Exposure |
|---|---|---|---|
| `8099` | Controller (REST) | The REST API surface (`/api/v3`, `/auth`, `/api/op`). Fronted by an internal Envoy on `127.0.0.1:8080`. | internal |
| `50051` | Controller (gRPC) | `CommandStream` to each edge `elchi-client`. Per-instance override via `CONTROLLER_GRPC_PORT`. | internal |
| `18000` | Control-plane (xDS) | Envoy ADS/VHDS management server — edge Envoys pull their config here. | internal |
| `9090` | Registry (gRPC) | Service discovery + version-routing; also the port controllers/control-planes dial to register. | internal |
| `9091` | Registry (metrics) | Prometheus `/metrics` scrape target (hardcoded). | internal |
| `27017` | MongoDB | System of record (config, users, projects, API inventory). | internal |
| `8123` | ClickHouse (HTTP) | Query interface — used by the backend and collector for API events + audit. | internal |
| `9000` | ClickHouse (native) | TCP wire protocol for the CH cluster. | internal |
| `8428` | VictoriaMetrics | Long-term metrics store (management node, when enabled). | internal |
| `3000` | Grafana | Dashboards, reverse-proxied at `/grafana/`. | loopback |
| `4317` / `4318` | OTel Collector | OTLP gRPC / HTTP ingest for Envoy + shield telemetry. | internal |
| `13133` | OTel Collector | Collector health check. | internal |
| `18090` | elchi-collector (gRPC) | Envoy **ALS v3** access-log sink — data-plane proxies push access logs here for API discovery. | internal |
| `18091` | elchi-collector (HTTP) | `/healthz`, `/readyz`, `/metrics`, plus gRPC health. | internal |

:::note
The controller **process** listens on `8099` by default (`CONTROLLER_PORT`); on a bare-metal install it sits behind an internal Envoy plaintext listener on `127.0.0.1:8080` that fronts the UI and API together. Treat `8080` as the front door and `8099` as the origin. See the [bare-metal port atlas](/installation/bare-metal/port-atlas) for the full remapping.
:::

For the collector's env-config and its full metric set, see the [collector reference](/api-discovery/collector-reference).

## Edge node

Every data-plane host: Envoy plus the local Elchi agents.

| Port | Component | Purpose | Exposure |
|---|---|---|---|
| `443` (or `--port`) | Envoy (public) | The client-facing TLS data-plane listener(s). This is the front door. | external |
| `8080` | Envoy (internal) | Plaintext listener fronting the UI/API to the controller. | loopback |
| `9901` | Envoy (admin) | Envoy admin interface — always loopback-bound. | loopback |
| _(varies)_ | Envoy listeners | Additional per-service listeners you define in config. | as configured |
| `9001` | elchi-shield (HTTP) | `/healthz`, `/readyz`, `/metrics`, `/configz`, `/policyz`, `/debug/pprof` — the sidecar's management surface. Loopback-only unless `--allow-non-loopback`. | loopback |
| _(UDS)_ | elchi-shield (ext_proc) | The Envoy `ext_proc` gRPC channel — a Unix domain socket by default (local by construction). | loopback |
| _(outbound)_ | elchi-client | No inbound listener — dials **out** to the Controller gRPC (`CommandStream`) and ships logs/config. | n/a |

:::danger[Shield is never off-box]
`elchi-shield` refuses to bind its ext_proc or HTTP listeners to a non-loopback address unless `--allow-non-loopback` is set. It inspects raw request/response bodies and must stay local. Prefer the default Unix domain socket for ext_proc. See the [Shield reference](/shield/reference).
:::

## See also

- [Bare-metal port atlas](/installation/bare-metal/port-atlas) — systemd-install specifics, per node role.
- [Collector reference](/api-discovery/collector-reference) — `18090`/`18091` env-config and metrics.
- [Shield reference](/shield/reference) — `9001` flags, ext_proc socket, loopback invariant.
