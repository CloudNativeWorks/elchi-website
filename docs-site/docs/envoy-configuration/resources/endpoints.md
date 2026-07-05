---
title: Endpoints
description: How Elchi models Envoy endpoints (EDS) — the ClusterLoadAssignment, localities, priorities, weights, and their link to clusters.
sidebar_position: 5
tags: [envoy, resources]
---

An **endpoints** resource is the concrete list of upstream hosts for an EDS cluster. In xDS terms it is served by the **Endpoint Discovery Service (EDS)** and carries the type `envoy.config.endpoint.v3.ClusterLoadAssignment`. Where a [Cluster](/envoy-configuration/resources/clusters) defines *how* to load-balance, the ClusterLoadAssignment defines *what* to balance across: the actual addresses, grouped into localities with priorities and weights.

Splitting endpoints out of the cluster is what lets Envoy update the host list without touching cluster policy — you can add, drain, or reweight hosts by pushing a new EDS resource while the cluster definition stays stable.

## In Elchi

Endpoints live under **Resources → Endpoint** (`/resource/endpoint`). Create one with **Add New**, choosing an Envoy version first — the form is generated from that version's `ClusterLoadAssignment` protobuf.

The key link is the **`cluster_name`**: it must match the name of the EDS cluster this assignment feeds. Elchi uses that name to pair the two resources when it assembles the snapshot. The editor lets you switch on the `endpoints` section (the localities and their hosts) and an optional `policy` section for load-balancing weights and overprovisioning.

:::tip[Automatic vs. manual endpoints]
When Elchi's service **discovery** is active for a cluster, endpoints are populated for you from discovered services. In that case the editor shows a banner warning you **not** to hand-edit the LB endpoints and localities — your manual entries would be overwritten by the next discovery sync. Edit endpoints manually only for clusters you manage by hand.
:::

## Key fields

| Field | Purpose |
| --- | --- |
| `cluster_name` | Must equal the EDS cluster's name. This is how the assignment is matched to its cluster. Fixed after creation. |
| `endpoints` | A list of **localities**, each with a `locality` (region/zone/sub-zone), a `priority`, a `load_balancing_weight`, and its `lb_endpoints`. |
| `endpoints[].lb_endpoints` | The actual hosts — each an `endpoint.address` (socket address) with optional per-endpoint `load_balancing_weight` and `health_status`. |
| `policy` | Assignment-wide policy: `overprovisioning_factor`, `endpoint_stale_after`, and drop overrides. |

**Localities, priorities, and weights** are how you shape traffic:

- **Locality** groups hosts by region/zone/sub-zone; combined with the cluster's `common_lb_config`, it enables zone-aware routing.
- **Priority** implements failover tiers — Envoy sends traffic to priority 0 while it has healthy capacity, spilling to priority 1+ only when it doesn't.
- **Weight** biases the share of traffic a locality or endpoint receives.

## Relationships

- **Feeds exactly one cluster** — a ClusterLoadAssignment is meaningless without the matching `EDS` [Cluster](/envoy-configuration/resources/clusters); the `cluster_name` binds them.
- **Populated by discovery** — Elchi's service discovery can generate and keep this resource in sync (the `elchi_discovery` metadata on the cluster drives it).
- **Resolved into the snapshot** — when a listener routing to the cluster is published, the control-plane pulls the matching endpoints into the same xDS snapshot streamed to the proxy.

## Example

A ClusterLoadAssignment with two localities across failover priorities:

```yaml
cluster_name: api_backend
endpoints:
  - locality: { region: eu-west, zone: eu-west-1a }
    priority: 0
    load_balancing_weight: 100
    lb_endpoints:
      - endpoint:
          address:
            socket_address: { address: 10.0.1.11, port_value: 8080 }
      - endpoint:
          address:
            socket_address: { address: 10.0.1.12, port_value: 8080 }
  - locality: { region: eu-west, zone: eu-west-1b }
    priority: 1
    lb_endpoints:
      - endpoint:
          address:
            socket_address: { address: 10.0.2.21, port_value: 8080 }
policy:
  overprovisioning_factor: 140
```

## Tips

- **`cluster_name` is the join key.** A typo means the EDS cluster gets no endpoints and every request fails — double-check it matches the cluster exactly.
- **Only EDS clusters use this resource.** STATIC and DNS clusters carry their hosts inline in the cluster's `load_assignment` instead.
- **Use priorities for failover, weights for splits.** Don't overload a single priority to fake failover — that's what priority tiers are for.
- **Leave discovery-managed endpoints alone.** If the banner says discovery is active, manage capacity through the discovery source, not by editing this resource.
