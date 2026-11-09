---
title: How to Run Several Envoy Versions Side by Side and Upgrade Listeners with Zero Downtime
description: Deploy one Elchi control-plane variant per Envoy version so proxies on different versions are served at the same time, then move listeners to the newer version with the listener upgrade, which copies their dependencies to the target version and switches the running Envoy by hot restart.
sidebar_position: 3
tags: [guide]
---

To run several Envoy versions at once, each proxy has to be served by a control plane that builds configuration for its version. Elchi deploys one control-plane variant per configured Envoy version, and the registry routes each proxy to the variant that matches the version it reports, so listeners on different versions run side by side in one project. To move a listener to a newer version, you use the listener upgrade: it copies the listener's dependencies into the target version, moves the listener and its bootstrap, and the edge agent switches the running Envoy with a hot restart, which keeps existing connections open when the two Envoy binaries are hot-restart compatible.

## When you need this

- You need a newer Envoy release for one service without moving every service at the same time.
- You want to test a new Envoy version on a few listeners before the rest of the fleet.
- You want to retire an old Envoy version once nothing uses it, without rebuilding configuration by hand.
- An upgrade must not drop the connections a listener is carrying.

## Steps

1. **Deploy a control-plane variant for each version.** With Helm, list the backend variants in `global.versions`; with the bare-metal installer, pass several variant tags to `--backend-version` (each runs side by side). The versions the platform configures appear in the **Envoy versions** panel on **Settings → General**. See [Helm configuration](/installation/helm-platform/configuration) and [install.sh](/installation/bare-metal/install-sh).
2. **Build resources per version.** Every listener, cluster, route and other resource is created for one Envoy version, and its form is generated from that version's protobuf schema. Resources on different versions do not interfere with each other.
3. **Make the target Envoy binary available on the edge.** A client's **Apps** tab lists the Envoy versions downloaded on the node and the releases you can install on it. The upgrade fails if the target version is not on the agent, and it also fails while any client of the service is disconnected. See [Clients](/operations/clients).
4. **Start the listener upgrade.** Open **Traffic path → Listener**, tick the listeners to move (all on the same Envoy version), and click **Upgrade (N) from &lt;version&gt;**. Pick a **Target Version** (only higher versions are offered). Tick **Dry run (preview changes only)** to see the changes first, then click **Upgrade** and confirm with **Yes, Upgrade**.
5. **Follow the job.** The upgrade runs as a tracked `RESOURCE_UPGRADE` background job that you can watch and retry if a step fails. See [Background Jobs](/observability/background-jobs).
6. **Verify.** Check the node's served snapshot (**Registry → Control Planes → Details**) for the new version, and send traffic through the listener.
7. **Upgrade the remaining resources and clean up.** Other resources (clusters, routes, secrets and so on) can be copied to a newer version on their own from their row's **⋮** menu (**Upgrade**). When no listener is left on the old version, remove its leftover resources in **Settings → Maintenance → Cleanup**. Take a [backup](/administration/backup-restore) first: the cleanup cannot be undone.

## How it works

**Version routing.** When a proxy connects, the registry matches it to the control-plane instance that serves the Envoy version it reports. The snapshot that instance builds contains only resources of that version, so proxies on different versions never receive each other's configuration.

**Dependency copy.** For a listener upgrade, the controller runs a per-listener dependency analysis to find everything that has to move together (route configurations, clusters, endpoints, filters, secrets and so on). It recreates those dependencies in the target version, then the listeners, in topological order, and regenerates the snapshots and bootstrap configuration for the target version. Dependencies are copied, so the originals stay on the old version until you clean them up.

**Hot restart on the edge.** Each deployed listener runs as its own Envoy process under systemd. The elchi-client agent compares the running binary's `--hot-restart-version` with the target binary's. When they match, it starts the new Envoy with Envoy's hot restart: the new process takes over the listening sockets while the old process drains, and the agent reports the epoch change. In Elchi's end-to-end test suite, a hot-restart listener upgrade under a steady 20 requests per second completed with 0 dropped requests. When the two binaries are not hot-restart compatible, the agent falls back to a full restart and reports that connections were dropped, so check the job result after an upgrade between distant versions.

## Related docs

- [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) - version routing, the upgrade subsystem and version cleanup.
- [Settings: Envoy versions](/administration/settings-overview#envoy-versions) - the versions this control plane configures.
- [Snapshot Dump](/envoy-configuration/snapshot-dump) - confirm which version a node is served.
- [Background Jobs](/observability/background-jobs) - follow and retry the upgrade job.
- [Registry & HA](/administration/registry-and-ha) - how the registry tracks control planes.
