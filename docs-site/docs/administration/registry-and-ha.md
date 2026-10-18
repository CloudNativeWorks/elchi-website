---
title: Registry & High Availability
description: Live topology visibility for controllers, control-planes, and clients, plus leader election and multi-controller HA.
sidebar_position: 1
---

![The service registry](/img/docs/registry-light.webp#gh-light-mode-only)
![The service registry](/img/docs/registry-dark.webp#gh-dark-mode-only)

The registry is the discovery hub that tracks controllers, control-planes, and clients. The **Registry** page gives you live visibility into your topology:

- **Instances** — every active controller and control-plane, with its zone, version, node count, and uptime.
- **Leader election** — see which instance currently holds leadership for scheduled work (snapshots, renewals).
- **Cleanup** — remove a stale controller or control-plane that no longer reports in.

Multiple controllers share one MongoDB, elect a leader for singleton tasks, and standby nodes hydrate from registry snapshots — so the management plane keeps running through instance failures.

:::tip[High availability at the edge]
This page covers the **management plane**. To keep the **data plane** up when an edge box fails, pair two Elchi OS appliances so they share VIPs active/passive — see [Edge HA Pairs](/ha-pairs/overview). The edge pair keeps serving and failing over even while the control plane is down.
:::
