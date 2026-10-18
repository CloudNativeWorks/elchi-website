---
title: Versions & Upgrades
description: How Elchi runs mixed Envoy versions side by side and migrates resources from one version to another.
sidebar_position: 3
---

Elchi manages multiple Envoy versions from a single interface. The registry routes each proxy to a control-plane that speaks its version, so mixed fleets are first-class.

:::info[Which versions are supported]
The exact supported set is not hardcoded in these docs — the UI reads it from its runtime config (`AVAILABLE_VERSIONS`), which the installer fills from the Envoy versions you deploy. Any version numbers shown in these docs are illustrative; the authoritative, current list is the **Envoy versions** panel on **Settings → General** (see [Settings](/administration/settings-overview#envoy-versions)).
:::

## Version-based routing

When a proxy connects, the registry matches it to the right control-plane instance based on the Envoy version it reports. You can run several versions side by side without conflicts.

## Upgrading resources

The upgrade subsystem migrates configurations from one Envoy version to another. Trigger it from the **Listener** list (sidebar **Traffic path → Listener**, `/resource/listener`):

1. Tick the listeners to move. All selected listeners must be on the same Envoy version, and listeners already on the newest version can't be selected.
2. Click **Upgrade (N) from &lt;version&gt;** in the page header to open **Upgrade Listeners**.
3. Pick a **Target Version** (only higher versions are offered), optionally tick **Dry run (preview changes only)**, then click **Upgrade** and confirm with **Yes, Upgrade**. Managed listeners are switched to the new version via Envoy hot restart with no traffic interruption.

The controller then:

1. Runs a per-listener dependency analysis to find everything that must move together.
2. Recreates the dependencies, then the listeners, in topological order.
3. Regenerates snapshots and bootstrap configs for the target version.

Other resources (clusters, routes, secrets, …) have an **Upgrade** entry in their row's **⋮** menu when more than one Envoy version is configured: it opens **Upgrade &lt;type&gt;**, where you **Select Target Version** to copy that resource to a newer version. Upgrade (and Duplicate) is disabled for ACME-managed resources.

The migration runs as a tracked background job, so you can watch progress and retry if a step fails — see [Background Jobs](/observability/background-jobs).

:::warning[Confirm the target version is deployed]
The target Envoy version must be one of your deployed `global.versions` (Helm) or `--backend-version` variants (bare-metal) before you upgrade resources into it.
:::

## Cleaning up an old version

Once every resource has migrated off an Envoy version, you can remove that version's leftover resources so the control-plane no longer carries them. Open **Settings → Maintenance → Cleanup** (the **Resource cleanup** panel):

1. **Version** — pick a version that still has documents in the current project. Each option shows its resource count and tags such as a listener count, **not served by control plane**, **no control plane running** or **not in this UI**. A version that still has listeners (or ACME certificates that exist only on that version) is disabled — upgrade or delete those first.
2. **Cleanup mode** — **All resources** (including default/system resources), **Default resources only**, or **User resources only** (keep defaults).
3. Click **Clean up resources** and confirm.

This calls `DELETE /setting/maintenance/cleanup/versions/:version` with `mode` and `project`. It is destructive — deleted resources cannot be recovered.

:::danger
Cleanup permanently deletes the version-scoped resources. Take a [backup](/administration/backup-restore) before a large cleanup, and confirm no live proxy still reports the version.
:::
