---
title: Architecture
description: The conceptual map of the whole Elchi stack — the three backend processes, the datastores and observability tier, the edge node, and the wire-level map of every inter-component connection.
sidebar_position: 4
tags: [getting-started, architecture, reference]
---

Elchi is a **two-tier distributed system**. A **central platform** runs once — the control plane, its datastores, the observability tier, and the API-discovery collector. Every **edge node** runs Envoy plus the local agents (`elchi-client`, `elchi-shield`) and feeds telemetry back to the center.

[Core Concepts](/getting-started/concepts) is the short introduction to the three backend processes; this page is the full map — every process, every datastore, and a wire-level table of who talks to whom, on which port, with what authentication, carrying what.

## The central platform

The backend is a **three-process distributed system** (`elchi-backend`), fronted by MongoDB (the system of record) and backed by ClickHouse (API events + security audit) plus a metrics stack.

| Process | Port(s) | Owns |
|---|---|---|
| **Controller** | `8099` (REST origin, fronted by an internal Envoy on `8080`) · `50051` (gRPC) | The REST API surface (`/api/v3`, `/auth`, `/api/op`), users + RBAC, projects, MongoDB persistence, AI analysis, and WAF / GSLB / ACME management. Also runs the `CommandStream` gRPC server each edge `elchi-client` dials. |
| **Control-Plane** | `18000` (xDS) | The Envoy **ADS / VHDS** management server with snapshot caching. Edge Envoys subscribe here and apply config live, without a restart. |
| **Registry** | `9090` (gRPC) · `9091` (metrics) | Service discovery + version-routing. Controllers and control-planes register here; it routes a controller's request to the right control-plane version. |

Supporting stores and observability:

- **MongoDB** (`27017`) — the **system of record**: xDS config, users, projects, tokens, and the `api_inventory` endpoint catalog.
- **ClickHouse** (`9000` native / `8123` HTTP) — high-volume event storage: the collector's `api_events_raw` (API discovery) and Shield's security-audit events.
- **VictoriaMetrics** (`8428`) + **Grafana** (`3000`) — long-term metrics store and dashboards.
- **OTel Collector** (`4317`/`4318` OTLP, `13133` health) — the telemetry ingest hub for Envoy stats and Shield metrics.
- **elchi-collector** (`18090` ALS gRPC, `18091` HTTP) — the passive **Envoy ALS v3** access-log sink behind [API Discovery](/api-discovery/overview).

See the [Port Reference](/reference/ports) for the exposure classification (loopback / internal / external) of every listener.

## The edge node

Every data-plane host runs the same local stack:

- **Envoy** — the data-plane proxy. Public TLS listener(s) on `443` (or `--port`); admin on `9901` (always loopback).
- **elchi-client** — the lightweight Go agent. It has **no inbound listener**; it dials **out** to the Controller's `CommandStream` (`50051`), registers the node, ships logs (Syslog / Elastic), manages BGP/FRR + networking, and runs the lifecycle commands the Controller pushes.
- **elchi-shield** — the local `ext_proc` WAF sidecar. Envoy reaches it over a **Unix domain socket** (loopback by construction); its management surface (`/healthz`, `/metrics`, `/configz`, …) is on `9001`, loopback-only unless `--allow-non-loopback`. See [Wiring Shield into Envoy](/shield/envoy-wiring).
- **Envoy → collector (ALS)** — Envoy also streams access logs to the central collector's `18090` for API discovery.

## Wire map

Every inter-component connection in the stack. Ports are process defaults (a bare-metal systemd install remaps some — see the [Port Reference](/reference/ports)). "Exposure" follows the same legend: **loopback** (same host only), **internal** (trusted platform/edge network), **external** (client-facing).

| Protocol | Port | From → To | Auth | Carries |
|---|---|---|---|---|
| HTTPS/REST | `8099` (origin) / `8080` (Envoy front-door) | Operators, Discovery agent → Controller | JWT bearer / API token | UI + REST API (`/api/v3`, `/auth`, `/api/op`) |
| gRPC | `50051` | `elchi-client` (edge) → Controller | Client/agent token ¹ | `CommandStream` — lifecycle commands (Deploy, Bootstrap, WafVersion, Service, log/network config) |
| gRPC (xDS) | `18000` | Edge Envoy → Control-Plane | Envoy `node.id`, network-restricted ¹ | ADS / VHDS config snapshots (live, no restart) |
| gRPC | `9090` | Controller, Control-Plane → Registry | internal (network-restricted) | Register, heartbeat, snapshot-notify, version routing |
| gRPC | `18000` | Controller → Control-Plane (via Registry routing) | internal | Snapshot push |
| gRPC (ext_proc) | UDS (`/run/elchi-shield/*.sock`) | Edge Envoy → elchi-shield | Filesystem perms (loopback) | Per-request headers/body for WAF inspection → allow/block/continue |
| gRPC (ALS v3) | `18090` | Edge Envoy → elchi-collector | plain TCP, or TLS/mTLS when configured | Access logs for API discovery (`node.id` = `listener::project::ip`) |
| TCP (CH native) / HTTP | `9000` / `8123` | elchi-collector, Controller → ClickHouse | DSN credentials (`CLICKHOUSE_URI`) | `api_events_raw` writes + read-API queries; Shield audit events |
| MongoDB wire | `27017` | Controller, Control-Plane, collector → MongoDB | DSN credentials (`MONGO_URI`) | System-of-record reads/writes; `api_inventory` |
| OTLP gRPC/HTTP | `4317` / `4318` | Envoy stats-sink, elchi-shield → OTel Collector | internal | Metrics push |
| HTTP | `8428` | OTel Collector → VictoriaMetrics | internal | Metrics remote-write |
| HTTPS | `8053` | Controller → GSLB nodes (CoreDNS) | `X-Elchi-Secret` | Notify-on-change (push) |
| HTTPS | `8099` (`/dns/snapshot`) | GSLB node (CoreDNS) → Controller | `X-Elchi-Secret` header (not JWT) | Zone DNS record snapshot (poll) |
| DNS UDP/TCP | `53` | Resolvers/clients → GSLB nodes (CoreDNS) | none (public authoritative) | GSLB DNS answers |
| HTTPS | `8099` (`/api/discovery`) | Discovery agent → Controller | Per-project **discovery token** | K8s cluster + endpoint sync |

¹ The exact credential on the `CommandStream` (`50051`) and the xDS stream (`18000`) is network-restricted and node-identity-based; treat both as **internal-only, firewalled to the edge fleet** rather than internet-exposed. See [Network & External Access](/getting-started/network-access).

## Node identity — `listener::project::ip` {#node-identity}

Elchi attributes every edge signal to a listener and project through a single shared convention: the **Envoy `node.id`**, formatted

```text
listener_name::project_id::listener_ip
```

(the trailing IP is optional). This one string is the canonical identity threaded across the whole edge data path:

- **elchi-shield** reads it from the ext_proc `request_attribute` Envoy sends (`request_attributes: ["xds.node.id"]`), uses the first field as the `listener` metric label, and parses `project_id` to scope audit events. See [Wiring Shield into Envoy](/shield/envoy-wiring).
- **elchi-collector** parses the same `node.id` off each ALS entry into the `project_id`, `listener_name`, and `listener_ip` columns of `api_events_raw` and the `api_inventory` unique key. See the [Collector Reference](/api-discovery/collector-reference).
- **The Registry** uses node identity for discovery and version-routing.

Because Shield's metrics/audit and the collector's inventory both key off the *same* `node.id`, a listener's WAF events and its discovered endpoints line up under one project without any extra correlation step. Set the `node.id` consistently on every edge Envoy.

## The gRPC contract — elchi-proto

The `CommandStream` and all edge agent communication share a single protobuf contract, published in **`elchi-proto`** (`github.com/CloudNativeWorks/elchi-proto`). It is consumed as a Go module (or a git submodule) so the Controller server and the `elchi-client` agent are generated from the same definitions. The `client/` package holds the service and message definitions — `client.proto` (the main service), `commands.proto` / `subcommands.proto` (command types), plus the per-subsystem messages (`register`, `identity`, `network`, `frr`, `stats`, `rsyslog`, `filebeat`, `shield`, …). Keeping the wire contract in one repo is what lets the control plane and the edge agents evolve in lockstep.

:::note
`elchi-proto` is the transport contract only. The **policy content** an edge receives (Envoy bootstrap, WAF version, and — as it lands — Shield policy files) rides these messages; the message shapes live in `elchi-proto`, the semantics in the Controller and the agents.
:::

## End-to-end flows

Four representative paths tie the map together.

### a. Config change → Envoy

```text
UI/REST → Controller → validate (Envoy protobuf schemas)
        → persist to MongoDB → push snapshot to Control-Plane
        → Control-Plane ADS/VHDS stream → edge Envoy applies live (no restart)
```

You change a resource in the UI; the Controller validates it against Envoy's protobuf schemas, writes it to MongoDB, and hands a snapshot to the Control-Plane, whose xDS stream (`:18000`) notifies every connected Envoy.

### b. Traffic → API inventory

```text
client → edge Envoy → (serves request) → ALS v3 access log
       → elchi-collector :18090 → normalize path (/users/123 → /users/{id})
       → ClickHouse api_events_raw (forensic, TTL'd)
       + MongoDB api_inventory (endpoint catalog + risk)
```

Every request Envoy serves is mirrored as an access-log entry to the collector, which normalizes the path, writes the raw event to ClickHouse, and upserts the per-operation row in the MongoDB inventory. See [API Discovery](/api-discovery/overview).

### c. Traffic → security events

```text
client → edge Envoy → ext_proc (UDS) → elchi-shield
       → per-policy inspection → allow / block / continue → Envoy
       → (block/detect/shadow finding) → ClickHouse security-audit
```

In parallel, Envoy consults Shield over the ext_proc socket **before** the router. Shield inspects and returns a decision; findings are written to the ClickHouse audit table (sampled for allows, always for findings). See [How Shield Works](/shield/how-it-works).

### d. GSLB DNS resolution

```text
CoreDNS node → poll GET /dns/snapshot (X-Elchi-Secret) → Controller
            → cache zone records
client resolver → DNS :53 → CoreDNS answers from cache
Controller (record change) → notify :8053 (X-Elchi-Secret) → CoreDNS re-polls
```

The GSLB CoreDNS nodes are authoritative for your zone; they poll the Controller's snapshot API on an interval and are nudged by a push notification on change. See [GSLB Nodes & CoreDNS](/traffic-and-certificates/gslb/nodes-coredns).

## See also

- [Core Concepts](/getting-started/concepts) — the short intro to the three processes.
- [Port Reference](/reference/ports) — exposure classification for every listener.
- [Network & External Access](/getting-started/network-access) — the firewall checklist (egress + ingress).
- [Wiring Shield into Envoy](/shield/envoy-wiring) · [Collector Reference](/api-discovery/collector-reference) — the two edge data-path integrations.
- [Security Model](/administration/security-overview) — the platform's trust and secrets map.
