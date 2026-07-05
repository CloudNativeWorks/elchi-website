---
title: Clusters
description: How Elchi models Envoy clusters (CDS) — discovery type, load balancing, health checks, circuit breakers, and outlier detection.
sidebar_position: 4
tags: [envoy, resources]
---

A **cluster** is an upstream pool — the set of hosts Envoy can send a request to, plus the policy for choosing among them. In xDS terms it is served by the **Cluster Discovery Service (CDS)** and carries the type `envoy.config.cluster.v3.Cluster`. A cluster answers *how do I reach this backend?*: how endpoints are discovered, how load is balanced, when a host is considered unhealthy, and how the connection is secured.

Clusters are the target of routing: a [Route](/envoy-configuration/resources/routes) sends matching traffic to a cluster by name. Where a cluster's endpoints come from depends on its **discovery type** — either baked in, resolved from DNS, or streamed live over [EDS](/envoy-configuration/resources/endpoints).

## In Elchi

Clusters live under **Resources → Cluster** (`/resource/cluster`). Create one with **Add New**, choosing an Envoy version first — the form is generated from that version's cluster protobuf.

The editor is organized around the `Cluster` message with a left-hand anchor that switches on the sections you need. The two required foundations are the **name** and the **discovery type**; everything else — load-balancing policy, health checks, circuit breakers, outlier detection, connection options, transport socket — is optional and toggled on as needed.

Elchi keeps the load-balancing sub-configs mutually exclusive in the UI (you pick one of ring-hash, maglev, original-dst, least-request, or round-robin), and it keeps the discovery type and its inline load assignment / EDS config consistent so you don't end up with a STATIC cluster that also points at EDS.

## Key fields

| Field | Purpose |
| --- | --- |
| `name` | Stable CDS key; routes reference it. Fixed after creation. |
| `cluster_discovery_type` | `STATIC`, `STRICT_DNS`, `LOGICAL_DNS`, `EDS`, or `ORIGINAL_DST` — decides where endpoints come from. |
| `load_assignment` | Inline endpoints (localities → `lb_endpoints`) for STATIC/DNS clusters. |
| `eds_cluster_config` | For `EDS` clusters: the config source that streams endpoints (see [Endpoints](/envoy-configuration/resources/endpoints)). |
| `lb_policy` / `*_lb_config` | Load-balancing algorithm and its tuning (round-robin, least-request, ring-hash, maglev, original-dst). |
| `health_checks` | Active health checking — HTTP, gRPC, or TCP probes that eject unhealthy hosts. |
| `circuit_breakers` | Per-priority limits on connections, pending requests, requests, and retries. |
| `outlier_detection` | Passive ejection based on observed errors (consecutive 5xx, gateway errors, success rate). |
| `common_lb_config` | Cross-cutting LB options (panic threshold, zone-aware routing, healthy-panic behavior). |
| `upstream_connection_options` | TCP keepalive and related connection settings. |
| `typed_extension_protocol_options` | Per-cluster HTTP protocol options (HTTP/1 vs HTTP/2, upstream codec). |
| `transport_socket` | Upstream TLS/mTLS — an [Upstream Transport Socket](/envoy-configuration/resources/transport-sockets). |

:::info[Discovery type drives everything else]
`STATIC` and the DNS types carry their endpoints inline in `load_assignment`. An `EDS` cluster instead names an `eds_cluster_config` and receives its endpoints as a separate xDS resource — that's the split Elchi models as the [Endpoints](/envoy-configuration/resources/endpoints) resource.
:::

## Relationships

- **Referenced by routes** — a [Route](/envoy-configuration/resources/routes) or weighted-cluster action names this cluster.
- **References endpoints** — an `EDS` cluster pulls its hosts from a matching [ClusterLoadAssignment](/envoy-configuration/resources/endpoints); STATIC/DNS clusters embed them inline.
- **References a transport socket + secret** — upstream TLS attaches an [Upstream Transport Socket](/envoy-configuration/resources/transport-sockets) that references [Secrets](/envoy-configuration/resources/secrets) for client certs and CA validation.
- **Pulled into a listener's snapshot** — when a listener is published, the control-plane resolves the routes' clusters (and their endpoints/secrets) into the same xDS snapshot streamed to that proxy.

## Example

An EDS cluster with active health checks, circuit breakers, and outlier detection:

```yaml
name: api_backend
connect_timeout: 2s
type: EDS
eds_cluster_config:
  eds_config: { ads: {} }
lb_policy: LEAST_REQUEST
health_checks:
  - timeout: 1s
    interval: 5s
    unhealthy_threshold: 3
    healthy_threshold: 2
    http_health_check: { path: "/healthz" }
circuit_breakers:
  thresholds:
    - priority: DEFAULT
      max_connections: 1024
      max_pending_requests: 1024
      max_requests: 1024
outlier_detection:
  consecutive_5xx: 5
  interval: 10s
  base_ejection_time: 30s
```

## Tips

- **Match discovery type to reality.** Use `STRICT_DNS`/`LOGICAL_DNS` for hostname backends, `EDS` when Elchi's discovery syncs endpoints for you, `STATIC` for fixed IPs.
- **Combine active + passive health.** `health_checks` proactively probes; `outlier_detection` reacts to live errors. Together they eject bad hosts quickly.
- **Set circuit breakers.** Unbounded clusters let one slow upstream exhaust resources — cap connections and pending requests per priority.
- **Upstream HTTP/2 needs protocol options.** For gRPC or HTTP/2 upstreams, configure `typed_extension_protocol_options`.
- **Publish resolves the tree.** Publishing a cluster re-snapshots every listener that transitively routes to it; check the dependency graph for broken references and use **Snapshot dump** to confirm CDS/EDS landed.
