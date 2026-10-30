---
title: Endpoint Control
description: Take an upstream endpoint (an IP or a hostname) out of rotation everywhere it is used in a project, and put it back, from the elchi UI.
sidebar_position: 2.5
tags: [operations]
---

**Endpoint Control** (**Operations → Endpoint Control**, `/endpoint-control`) lists every upstream endpoint of the current project and lets you **disable** or **enable** it everywhere it is used. This is like disabling a server in a load balancer: one action, every place.

An endpoint is an **IP** (IPv4 or IPv6) or a **hostname**. A disable reaches every place that names it, on every Envoy version:
- [endpoint resources](/envoy-configuration/resources/endpoints) (EDS);
- clusters' own endpoints (the `load_assignment` of a STATIC, STRICT_DNS or LOGICAL_DNS cluster).

The same address used in three endpoint resources and one cluster is disabled in all four at once.

## The list

Each row is one endpoint (one address), whatever the number of places it is used in.

| Column | Meaning |
| --- | --- |
| **Endpoint** | The address, in normalized form. A hostname is marked as one. |
| **Ports** | The ports it is used on. A disabled port is struck through. |
| **Used in** | How many endpoint resources and clusters use it. *used nowhere* is a disabled address that nothing uses any more; it stays listed so that it can be enabled. |
| **State** | *in rotation*, *disabled on <ports>*, or *disabled, every port (<who>)*. Hover over the state for the reason. |

- **Search** by a part of an IP or a hostname.
- **Filter** by state: *All*, *In rotation*, *Some ports disabled*, *Disabled*.

The search and the filter are kept in the URL, so a link opens the same view. The page lists at most 5000 endpoints at once, and says so when there are more: search to narrow the list.

Open a row to see **every place the endpoint is used**:
- the endpoint resource or cluster, with a link to it;
- the address as it is written there;
- the source (endpoint resource, kept by discovery, static, DNS);
- for an endpoint resource, the EDS clusters that deliver it;
- the Envoy version.

A cluster that a bootstrap also carries in `static_resources` is marked *also in the bootstrap*. Envoy reads a bootstrap at start, not over xDS, so a disable does not reach that cluster there.

## Disable and enable

Owners, admins and editors see the row actions; viewers see the list only.

- **Disable** → *Every port*, or a single port that is still in rotation.
- **Enable** → *Every port*, or a single disabled port. An address disabled on every port is enabled as a whole.

Each action opens a confirmation that first shows what it reaches:

- **Used in**: every place the endpoint is used.
- **Pushed to**: the listeners, per Envoy version, whose configuration is pushed again.
- **Clusters left with no endpoint to balance to**: when a disable takes out the last endpoint of a cluster, Envoy's **panic mode** keeps sending traffic to the disabled hosts, unless the cluster's panic mode is off (it then answers 503).
- **Saved, unpublished changes go live too**: the listeners the change rebuilds have resource changes that were saved but not published. Tick **Push them with this disable** (or *enable*) to take them live with this change; the confirm button stays off until you do. Or publish or revert them first.
- **Reason** (disable only, optional): kept in the audit log and shown on the row.

After you confirm, the dialog follows the push to the clients:
- **Disabled; published to every client (n of m).** The push is done.
- **Saved, but the push failed on some clients.** The dialog names them. The change stays saved and applies on the next push; disable (or enable) it again to push now.
- **Saved, but its push could not be started.** Disable (or enable) it again to push now.
- **Saved; the push is still running.** The dialog stops following after a minute; follow the push on the **Jobs** page.
- **Nothing to change: it is already disabled** (or *enabled*).

## What a disable does

The control plane serves the endpoint to the proxies as `DRAINING`. Envoy sends it no new requests, open connections end on their own, and health checks go on without bringing it back.

The **stored resources do not change**, so editing or publishing them does not undo a disable. The listener's publish history records the disabled endpoint as a source that cannot be restored.

Envoy's own view of a draining host (`/clusters`) shows the `eds_status_draining` flag.

## Automation

The same state is changed by the automation API's [endpoints API](/automation-api/endpoints), with [API tokens](/automation-api/tokens). A pipeline can drain a server before maintenance and put it back afterwards.

**Reports → Endpoints** shows the same addresses per resource. It is a read-only view; the changes are made here.
