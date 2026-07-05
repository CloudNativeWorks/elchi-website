---
title: Bootstrap
description: The Envoy bootstrap config Elchi generates for each proxy — node identity, admin, static resources, and the ADS connection back to the control-plane.
sidebar_position: 10
tags: [envoy, resources]
---

The **bootstrap** is the one piece of configuration Envoy reads from disk at startup. Everything else — listeners, routes, clusters, endpoints, secrets — arrives *dynamically* over xDS. The bootstrap's whole job is to tell a fresh proxy **who it is** (node identity), **how to be administered** (admin interface), and **where to get the rest of its config** (the xDS connection back to Elchi's control-plane). Once connected, the proxy is driven entirely by the snapshots Elchi publishes.

Because the bootstrap defines the proxy's identity and its link home, it's the foundation every other resource depends on: the control-plane keys snapshots by the node identity the bootstrap declares.

## In Elchi

Bootstrap lives under **Resources → Bootstrap** (`/resource/bootstrap`). Unlike other resources it isn't something you routinely hand-create — Elchi **generates** the bootstrap for each proxy so it points at the right control-plane with the correct identity. The editor exists to inspect and, where needed, customize the generated config (node, admin, stats sinks, overload/memory managers, DNS resolver), while the identity and xDS wiring stay locked to keep the proxy reachable.

As with all resources, a bootstrap is scoped to an Envoy version, so the generated document matches the Envoy build the client will run.

:::info[Who writes the bootstrap to the host]
The generated bootstrap is delivered to the edge host and handed to Envoy by the local **elchi-client** agent. You don't copy files around by hand — Elchi produces the bootstrap, the client deploys it, and Envoy starts against it. See [Client installation](/installation/client/overview).
:::

## Key fields

| Section | Purpose |
| --- | --- |
| `node` | The proxy's identity — `id` and `cluster`. Elchi sets both to a composite of the listener name and project (see below). This is how snapshots are addressed. |
| `admin` | The local admin interface, bound to `127.0.0.1` on an allocated port. Used for stats, config dump, and health. |
| `static_resources.clusters` | A single static cluster — `elchi-control-plane` — that the dynamic config uses to reach Elchi. |
| `dynamic_resources` | The xDS wiring: `lds_config`/`cds_config` via ADS, and an `ads_config` (delta gRPC) pointing at the control-plane. |
| `stats_sinks` | Metric export (e.g. OTLP to Elchi's collector pipeline). |
| `overload_manager` / `memory_allocator_manager` | Resource-pressure and allocator tuning. |

### Node identity

Elchi builds the node id from the **listener name** and the **project**: `<listener>::<project>` — and, for a managed listener fanned out to several edge clients, it appends the client address: `<listener>::<project>::<ip>`. The control-plane addresses each xDS snapshot to exactly this node id, so the identity in the bootstrap is what pairs a running proxy with the configuration published for it. The same node id is sent as `initial_metadata` (`nodeid` + `envoy-version`) on the ADS stream so the control-plane can route and validate the connection.

### The ADS connection back home

The `dynamic_resources` block wires the proxy to Elchi over **ADS (Aggregated Discovery Service)** using delta gRPC. `lds_config` and `cds_config` both point at the aggregated stream; the `ads_config` names the static `elchi-control-plane` cluster and uses the control-plane's address as its authority. Once this stream is up, LDS/RDS/CDS/EDS/SDS/ECDS all flow over the one connection.

## Relationships

- **Declares the node identity** that every published snapshot is keyed to — the bridge between a proxy and its [Listeners](/envoy-configuration/resources/listeners), [Routes](/envoy-configuration/resources/routes), [Clusters](/envoy-configuration/resources/clusters), [Endpoints](/envoy-configuration/resources/endpoints), and [Secrets](/envoy-configuration/resources/secrets).
- **References the control-plane** via its one static cluster and ADS config — the channel all dynamic resources arrive on.
- **Deployed by elchi-client** to the edge host; see [Client installation](/installation/client/overview).
- **Version-scoped** like every resource; upgrading a listener to a new Envoy version regenerates the bootstrap for that version — see [Versions & Upgrades](/envoy-configuration/versions-and-upgrades).

## Example

The shape of a generated bootstrap (identity + admin + static control-plane cluster + ADS):

```yaml
node:
  id: "https_ingress::my-project"
  cluster: "https_ingress::my-project"
admin:
  address:
    socket_address: { address: 127.0.0.1, port_value: 30001 }
static_resources:
  clusters:
    - name: elchi-control-plane
      type: STRICT_DNS
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          explicit_http_config: { http2_protocol_options: {} }
      load_assignment:
        cluster_name: elchi-control-plane
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address: { address: control-plane.elchi, port_value: 18000 }
dynamic_resources:
  lds_config: { ads: {}, resource_api_version: V3 }
  cds_config: { ads: {}, resource_api_version: V3 }
  ads_config:
    api_type: DELTA_GRPC
    transport_api_version: V3
    grpc_services:
      - envoy_grpc:
          cluster_name: elchi-control-plane
        initial_metadata:
          - { key: nodeid, value: "https_ingress::my-project" }
          - { key: envoy-version, value: "v1.38.3" }
```

## Tips

- **Don't hand-edit identity or the ADS wiring.** The node id and control-plane connection are what make the proxy reachable — change them and it stops receiving config.
- **The admin interface stays on loopback.** It's bound to `127.0.0.1`; never expose it externally.
- **Customize the safe parts.** Stats sinks, overload manager, memory allocator, and DNS resolver are fair game for tuning.
- **Everything else is dynamic.** If a listener or cluster isn't showing up, the problem is almost never the bootstrap — check the published snapshot (**Snapshot dump**) and the dependency graph, not the boot config.
