---
title: Snapshot Dump
description: Inspect the exact xDS snapshot the control-plane is serving a live Envoy node — the ground truth of what shipped — and clear a stale snapshot to force a resync.
sidebar_position: 8
tags: [envoy]
---

Authoring config tells you what you *intended* to ship. The **Snapshot Dump**
tells you what an Envoy node is *actually being served* right now. It fetches the
live xDS snapshot the control-plane holds for a specific node and renders it as an
expandable JSON tree, so you can compare the running config against what you
authored — the single most useful move when a change "isn't taking effect."

Envoy edge nodes don't pull config from files; the control-plane pushes a
versioned **snapshot** (listeners, clusters, routes, secrets, …) to each node over
ADS. The Snapshot Dump reads that snapshot back out of the control-plane, so it is
**ground truth**: if a resource isn't in the dump, the node isn't running it,
regardless of what the editor shows.

## When to use it

Reach for the Snapshot Dump whenever authored config and observed behavior
disagree:

- **"My change isn't live."** You edited and published a resource, but Envoy still
  behaves the old way. Dump the node's snapshot and check whether the new value is
  present. If it isn't, the change never reached this node (publish/version/routing
  issue); if it is, the problem is elsewhere (caching, a different listener, client
  behavior).
- **"Which version is this node on?"** The snapshot reflects the resources for a
  given Envoy release. Confirm the node is being served the version you expect (see
  [Versions & Upgrades](/envoy-configuration/versions-and-upgrades)).
- **Confirming a rollout.** After a change, verify each affected node actually
  received the new snapshot before declaring the rollout done.
- **Diffing intent vs. reality.** Read the served listener/route/cluster next to
  the resource you authored to spot a stale reference, a missing secret, or an
  unexpanded template.

The dump is served per node and per Envoy version, so multi-node or
multi-version fleets can be inspected one node at a time.

## The backend contract

The Snapshot Dump is backed by two endpoints on the controller's **bridge** API,
keyed by the Envoy node id:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v3/bridge/nodes/{nodeID}/snapshot` | Return the live xDS snapshot the control-plane is serving this node |
| `DELETE` | `/api/v3/bridge/nodes/{nodeID}/snapshot` | Clear the node's cached snapshot, forcing a fresh rebuild/resync |

Both calls are routed to the correct control-plane instance internally (via the
Registry's `ext_proc` routing) using the `nodeID` — and, for the `GET`, an
optional Envoy version — so you always read the snapshot from the control-plane
that owns that node. The node id is the per-node identity Envoy reports (the same
identity used elsewhere as the metrics/log node label).

## Clearing a snapshot to force a resync

If the served snapshot is stale or wedged, `DELETE`ing it clears the
control-plane's cached snapshot for that node. The control-plane then rebuilds the
snapshot from the current desired config and re-pushes it to the node. Use this as
a targeted "resync this one node" when:

- The dump shows an old value even though the resource was republished.
- A node reconnected but appears to be holding a snapshot from before a change.
- You want to confirm the current config compiles into a clean snapshot from
  scratch.

:::warning
Clearing a snapshot forces the node's config to be rebuilt and re-served. It is a
recovery/debug action against a single node, not a routine publish step — normal
edits ship through the standard publish flow without touching snapshots.
:::

## Reading the dump

The snapshot renders as a collapsible JSON tree. Expand into the resource type you
care about (listeners, clusters, route configurations, secrets) and read the
served values directly. Because this is the raw xDS payload, field names and shape
match Envoy's own resource protos rather than the friendlier editor form — it is
meant for verification and debugging, not authoring.

## Related tools

- [Route Map](/envoy-configuration/route-map) — trace how a request is routed
  through a listener (intent, not the live snapshot).
- [Dependency Graph](/envoy-configuration/dependency-graph) — see how authored
  resources reference each other.
- [Resource model](/envoy-configuration/config-model) — how resources are
  addressed and versioned before they become a snapshot.
