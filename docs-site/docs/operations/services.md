---
title: Services
description: The Services console — view deployed Envoy services, drill into a running Envoy, track configuration errors, and recover GSLB records.
sidebar_position: 2
tags: [operations]
---

![The Services view — deployed Envoy services](/img/docs/services-light.webp#gh-light-mode-only)
![The Services view — deployed Envoy services](/img/docs/services-dark.webp#gh-dark-mode-only)

A **service** is a named Envoy deployment: an Envoy [bootstrap](/envoy-configuration/resources/bootstrap) plus the xDS resources that configure it, together with the set of edge [clients](./clients.md) it is deployed to. The Services console is where you see the deployment status of every service across the fleet and drill into any single running Envoy.

## The services list

Open **Services** (`/services`) for the paginated list of every service in the current project. Each row is one service.

| Column | Meaning |
| --- | --- |
| **Name** | The service (deployment) name. |
| **Status** | Fleet health of this deployment — see below. |
| **Version** | The Envoy version the service targets. |
| **Deployed** | How many clients the service is deployed to. |
| **IP Addresses** | The downstream address of each client running it (a `+N more` link opens the full list). |
| **Admin Port** | The Envoy admin port for the deployment. |

### Status

Status reflects how many of the service's target clients are currently connected:

| Status | Meaning |
| --- | --- |
| **Live** | All target clients are connected. |
| **Partial** | Some, but not all, clients are connected. |
| **Offline** | The service is deployed but none of its clients are connected. |
| **Not Deployed** | The service has no client targets yet. |

A service served by an [HA pair](/ha-pairs/overview) shows a second badge with the pair's status, such as **HA: Live** or **HA: Degraded**. Its detail page groups the clients per pair (*HA pair · name · VIP · status*) and marks which member serves the VIP. Deploying to a pair always targets every member of the pair at one VIP — see [Deploying services to a pair](/ha-pairs/deploying-services).

### Filtering

The filter bar narrows the list by **name**, **version**, **status**, or **IP address**. Enter your terms and click **Search** (or press Enter); **Clear** resets them. Filtering resets you to the first page.

### Row actions

Click a row to open its detail page. The actions menu (the icon in the first column) offers:

- **Edit** — open the service detail page.
- **Create GSLB** — recreate the service's GSLB record (see [Recreate GSLB](#recreate-gslb-disaster-recovery) below).

## Service detail

Clicking a service opens `/services/:id`, which loads the service document together with its Envoy details and any configuration errors. A status badge in the header summarizes live deployment health. The page is organized into tabs.

### Overview

The default tab shows the service summary and its deployment controls: **Manage service** (deploy to or remove from clients), the lifecycle actions **Start**, **Stop**, **Restart** and **Reload** on every client (Stop and Restart ask for confirmation), and **Refresh status**, which asks every client for the service's status now. **Manage service** opens a drawer with a **Deploy** / **Remove** mode switch and the client list. All of these are commands on the [command stream](./overview.md#1-the-command-stream-lifecycle) — the same dispatch mechanism described under [Clients](./clients.md).

#### On each client: the VIP health gate

The **On each client** panel shows one card per client running the service: its state and uptime, memory and CPU, and — while the proxy is active — the listener's **VIP state** as the agent's health gate reports it. This applies to single clients as well as HA pair members.

The agent probes every listener (by default every 5 s: the unit is active, Envoy is LIVE, `/ready` answers 200 and a listener is bound). After 3 failed probes it withdraws the listener's VIP; it announces it again only after 2 good probes and a 20 s hold-down, so one bad sample never flaps a route. A unit that restarts 3 times within 5 minutes is **held** for 15 minutes. These are the `client.vip_health` defaults in the agent config.

| Tag | Meaning |
| --- | --- |
| **VIP announced** | The VIP is on the interface (with BGP, peers see the route). |
| **VIP withdrawn** | The VIP was removed: the listener is unhealthy, draining or not yet back. |
| **VIP held** | Crash loop: no automatic announcement until the hold ends or you resume it. |
| **… (reported only, no BGP)** | The host has no BGP, so the state is reported but nothing is withheld from peers. |

On an HA pair member an announced VIP reads **VIP served here** (active) or **VIP ready (peer serves it)** (standby), because `elchi-ha` owns the address there. Hover the tag for the **reason**, since when, **held until**, and the **last probe** with its detail.

Each card also offers:

- **Drain** — after confirmation, sends `POST /healthcheck/fail` to that client's Envoy admin: `/ready` answers 503 and HTTP responses tell clients to reconnect (`connection: close`). Within about 15 s the VIP is withdrawn and new connections go elsewhere; connections still open then are cut.
- **Undrain** — `POST /healthcheck/ok`: the listener reports ready again and the VIP is announced after the hold-down. When the last probe shows the listener draining only **Undrain** is offered (and vice versa); with no probe yet (gate off or not probed) both are shown so a drain can always be undone.
- **Resume VIP** — shown only on a **held** listener. After confirmation it releases the hold on that client (a `SERVICE` command, sub-type `SUB_VIP_RESUME`); the VIP is announced again after healthy probes. On the host itself the same is `elchi-client vip resume <admin-port>`, and `elchi-client vip status` lists every listener's state.

#### Removing a service from an offline client

In **Manage service**, switch to **Remove**: deployed clients that are offline can still be selected, marked **Offline — detach only**. Clicking **Remove service** detaches the service record without contacting the agent, and a **Forced Removal** notice confirms it. If the host is still alive, the Envoy unit keeps running until it is removed there (`system listener remove <name>` on Elchi OS, otherwise `sudo elchi-client undeploy-local <name>-<port> --yes`); the client's page then flags it as an [orphan listener unit](./clients.md#orphan-listener-units).

An offline **HA pair member** is not detached: the removal is recorded as pending and completes when the member reconnects.

### Clusters

A read-only view of the deployment's clusters. This tab is disabled until the service is actually deployed to at least one client.

### Envoy

The **Envoy** tab surfaces the details of the running Envoy(s) for this service. It is backed by the envoy-details endpoint:

```bash
GET /api/op/services/envoys/:service_id?project=<project>
```

This returns the stored service document — the deployed Envoy configuration and the per-node state the controller tracks for it. Like Clusters, the tab is available once the service is deployed.

:::note[Bootstrap context]
The Envoy a service deploys is anchored by its **bootstrap** configuration. For what the bootstrap contains and how it is authored, see [Bootstrap](/envoy-configuration/resources/bootstrap).
:::

### Configuration errors

If the control plane recorded errors while building this service's configuration, an error badge appears next to the service name in the header. Clicking it opens a drawer that separates **active** from **resolved** errors and, for each, shows the severity, the human-readable message, the raw message, the offending resource (name, type, node id), first/last-seen timestamps, occurrence count, and a suggested fix where available. You can select errors and **Resolve** them (mark handled) or **Clear** them (delete permanently).

## Recreate GSLB (disaster recovery)

The **Create GSLB** action — from the list row menu or the confirmation dialog — recreates the [GSLB](/gslb/overview) record for a service:

```bash
POST /api/op/services/:service_id/recreate-gslb?project=<project>
```

This is a **disaster-recovery** operation. Its purpose is to rebuild GSLB records and their IP health records after they have been lost — most commonly after restoring the platform from a backup that did not carry the GSLB state.

Behavior:

- **If no GSLB record exists** for the service, a new one is created — the FQDN is derived from the service name and the project's GSLB zone, and each of the service's client IPs is added with a health record.
- **If a record already exists**, the operation is additive: it adds any of the service's IPs that are missing and skips the ones already present. It does not tear down or replace the existing record.

The response reports what happened:

```json
{
  "success": true,
  "message": "GSLB record already exists. Added 2 IPs, skipped 3 existing IPs.",
  "gslb_record_id": "…",
  "fqdn": "my-service.gslb.example.com",
  "ips_added": 2,
  "ips_skipped": 3,
  "already_exists": true
}
```

:::warning[Probe configuration is not restored]
Recreate-GSLB rebuilds the record and its IP health entries, but it does **not** restore probe configuration. After recreating, reconfigure the health probes manually. See [GSLB Overview](/gslb/overview).
:::

:::note[Requirements]
Recreate-GSLB requires the **Admin** or **Owner** role, a `project`, and that **GSLB is enabled** for that project. If GSLB is not configured or not enabled, the operation is rejected.
:::

## Related

- **[Clients](./clients.md)** — the edge nodes a service is deployed to, and the command dispatch behind deploy/lifecycle actions.
- **[GSLB Overview](/gslb/overview)** — global load balancing and health probes.
- **[Bootstrap](/envoy-configuration/resources/bootstrap)** — the Envoy bootstrap a service deploys.
