---
title: Cluster Endpoints
description: Point an EDS cluster at another endpoints resource (backend-blue to backend-green, and back) for a blue/green release, from the elchi UI.
sidebar_position: 2.6
tags: [operations]
---

**Cluster Endpoints** (**Operations → Cluster Endpoints**, `/cluster-endpoints`) lists the EDS clusters of an Envoy version and the [endpoints resource](/envoy-configuration/resources/endpoints) each uses. A **switch** points a cluster at another endpoints resource. For example, `payments` goes from `backend-blue` to `backend-green`, and back if the release goes wrong.

Every listener that uses the cluster gets the switch at once. Envoy keeps the old endpoints serving until the new ones are ready, then swaps them; requests in flight finish.

## The list

Pick the **Envoy version** first: a cluster exists once per version, and a switch is for one version. Search by a part of the cluster's name or of its endpoints resource's name. The version and the search are kept in the URL.

The list holds only EDS clusters that name an endpoints resource (`eds_cluster_config.service_name`). STATIC and DNS clusters carry their endpoints themselves and cannot be switched.

| Column | Meaning |
| --- | --- |
| **Cluster** | The cluster, with a link to it. |
| **Endpoints resource** | The one it uses now. *missing* means no such resource exists in this version, and Envoy serves the cluster with no host. |
| **Endpoints** | How many endpoints that resource holds, and how many of them are [disabled](./endpoint-control.md). |
| **Last switch** | Where it came from, when, and who switched it. |

Open a row to see the listeners that use the cluster, its current addresses and its switch history.

## Switch

Owners, admins and editors see the row actions; viewers see the list only.

- **Switch** opens the dialog: pick the endpoints resource to switch to. Resources with no endpoint, or whose own `cluster_name` is another name, cannot be picked; Envoy would serve no host with them.
- **Switch back** opens the same dialog with the last switch's origin picked. It shows while the cluster still uses the resource that switch put in.

The dialog first shows what the switch reaches:
- **Endpoints**: the addresses before and after.
- **Pushed to**: the listeners whose configuration is pushed again.
- Warnings: every endpoint of the target is disabled, or Kubernetes discovery keeps it.
- **Saved, unpublished changes go live too**: the listeners have resource changes that were saved but not published. Tick **Push them with this switch** to take them live with it; the button stays off until you do. Or publish or revert them first.
- **Reason** (optional): kept in the audit log and the switch history.

After you confirm, the dialog follows the push to the clients:
- **Switched to <target>; published to every client (n of m).**
- **Switched, but the push failed on some clients.** The dialog names them. The switch stays saved and applies on the next push; switch it again to push now.
- **Switched, but its push could not be started.** Switch it again to push now.
- **Switched; the push is still running.** The dialog stops following after a minute; follow it on the **Jobs** page.
- **Nothing to change: it uses <target> already.**

If someone else switched the cluster while the dialog was open, the switch is refused; close the dialog and open it again.

The stored cluster changes, so the listener's publish history names the cluster as changed.

## Automation

The automation API's [clusters API](/automation-api/clusters) makes the same switch with an [API token](/automation-api/tokens) scoped `clusters:write`. A release pipeline can switch, check, and switch back.
