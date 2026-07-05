---
title: Versions & Upgrades
description: How Elchi runs mixed Envoy versions side by side and migrates resources from one version to another.
sidebar_position: 3
---

Elchi manages multiple Envoy versions from a single interface. The registry routes each proxy to a control-plane that speaks its version, so mixed fleets are first-class.

:::info[Which versions are supported]
The exact supported set is not hardcoded — it is fetched dynamically from the release archive. Any version numbers shown in these docs are illustrative; see **[Envoy versions](/reference/envoy-versions)** for the authoritative, current list and how it is resolved.
:::

## Version-based routing

When a proxy connects, the registry matches it to the right control-plane instance based on the Envoy version it reports. You can run several versions side by side without conflicts.

## Upgrading resources

The upgrade subsystem migrates configurations from one Envoy version to another. Trigger it from **Settings → Upgrade**; the controller:

1. Runs a per-listener dependency analysis to find everything that must move together.
2. Recreates the dependencies, then the listeners, in topological order.
3. Regenerates snapshots and bootstrap configs for the target version.

The migration runs as a tracked background job, so you can watch progress and retry if a step fails — see [Background Jobs](/observability/background-jobs).

:::warning[Confirm the target version is deployed]
The target Envoy version must be one of your deployed `global.versions` (Helm) or `--backend-version` variants (bare-metal) before you upgrade resources into it.
:::

## Cleaning up an old version

Once every resource has migrated off an Envoy version, you can remove that version's leftover resources so the control-plane no longer carries them. From **Settings → Maintenance**, the version cleanup action deletes the resources scoped to a given version (`DELETE /setting/maintenance/cleanup/versions/:version`, with `mode` and `project` scope). It is Owner-gated and destructive — validate that nothing still runs on the version first.

:::danger
Cleanup permanently deletes the version-scoped resources. Take a [backup](/administration/backup-restore) before a large cleanup, and confirm no live proxy still reports the version.
:::
