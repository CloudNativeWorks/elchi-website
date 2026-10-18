---
title: Monitoring a Pair
description: Pair statuses, member roles, alarms, heartbeat and data-plane indicators, and where HA state appears across the Elchi UI, audit log and metrics.
sidebar_position: 5
tags: [operations, high-availability, observability]
---

The members report their HA state to the controller with every agent ping, and immediately when their role changes. The controller derives a **pair status** from the two reports. The boxes themselves are always the source of truth: the UI can lag them by a few seconds, and a report older than 3 minutes is marked **stale**.

## Pair status

Listed from most to least severe. The HA Pairs page shows the status with a reason whenever it is not **Live**.

| Status | Meaning | What to do |
| --- | --- | --- |
| **Split brain** | Both members report ACTIVE; both may answer for the VIPs. | Check both heartbeat paths and look for a *Heartbeat key mismatch* alarm, then **Push config**. |
| **No active** | Every member reports, none holds the VIPs: the pair serves no traffic. | Check each member's role and alarms. |
| **Handing over** | The active just handed over; the controller waits for the new active's report (a few seconds). | Nothing — transient. |
| **Config pending** | A member has not applied the current configuration revision. | **Push config**; an offline member applies it on reconnect. |
| **Syncing** | A service is not yet on both members; the controller retries. | Wait, or **Sync now**. The Sync column lists what is missing or pending. |
| **Degraded** | The pair works but cannot fail over safely right now. | Read the reason: a member offline or stale, the daemon not running, a member in maintenance or fenced, a member lost, an alarm, the standby not hearing the active, an unfinished listener upgrade, or an unreadable key. |
| **Awaiting peer** | One member serves as ACTIVE (HA mode). | Add a second member to make the pair redundant. |
| **Failed over** | The lower-priority member is active after a failover. There is no automatic fail-back. | Healthy. Fail back with a planned failover if you want. |
| **Live** | Both members healthy, the preferred one active. | — |
| **Unknown** | The members have not reported their roles yet. | Wait for the first reports. |

The HA Pairs page also shows a guidance box with concrete steps for a pair in **Split brain**, **No active** or **Config pending**, and for a pair with a fenced, suspended or critically alarmed member.

## Member roles

**Active**, **Standby**, **Init**, **Demoting**, **Maintenance**, **Fenced** and **Unpaired** — see [How the members decide](./failover-and-maintenance.md#how-the-members-decide). A role badge with the suffix **stale** means the member is offline or its last report is more than 3 minutes old: the role may have changed since.

## Alarms

Members raise alarms; the UI lists the critical ones first. Any alarm, a warning included, makes a two-member pair **Degraded**.

**Critical**

| Alarm | Meaning |
| --- | --- |
| Heartbeat key mismatch | The peer signs heartbeats with another key. **Push config** so both members get the same key. A replaced member that comes back also shows this. |
| Data link down | The member's data NIC has no carrier. |
| VIP conflict | Another device answers ARP for a pair VIP. |
| Isolated | The active lost both its peer and its gateway; it keeps the VIPs fail-safe. |
| Forbidden VIP | A VIP equals a member's own address; it is never brought up. |
| Version mismatch | Different `elchi-ha` protocol major versions; no automatic takeover. |
| Gateway unreachable | No fence target answers: the member cannot tell a dead peer from its own isolation, and will not take over. |
| Standby egress not blocked | The firewall rule that drops VIP-sourced traffic from a standby could not be applied. |

**Warning**

| Alarm | Meaning |
| --- | --- |
| Stray VIP | A standby found a pair VIP on its interfaces and removed it. |
| Clock skew | The members' clocks differ by more than 5 s. |
| Data / Management heartbeat path down | One heartbeat path is silent while the other works. |
| Invalid heartbeats | Heartbeats that fail validation are arriving. |
| Suspended | Three automatic role changes in 10 minutes; discretionary moves are paused (see [Flap suspension](./failover-and-maintenance.md#flap-suspension)). |
| Misconfigured | A required kernel setting is wrong (for example `arp_ignore`); the member will not become active. |
| Fencing disabled | No fence target ever answered; fencing is off on this member. |
| Version skew | The members run different `elchi-ha` versions: finish the upgrade on both. |
| Role file not written | The role file could not be written; the member retries. |
| Local address | A heartbeat address could not be bound on this member. |
| VIP unhealthy / VIP add | A VIP is unhealthy and the peer cannot take it, or adding a VIP failed and is being retried. The UI shows these with the member's own text. |

## Indicators

On the HA Pairs page each member row shows:

- **Heartbeat** — one mark per path (`data ✓`, `mgmt ✗`), with the address and when the peer was last heard.
- **Data plane** — the gateway mark (*gateway* / *gateway unknown*) and the peer mark: on the standby *peer up / peer down* (the active's VIPs as probed), on the active *peer ready / peer not ready / peer in maintenance* (whether a planned failover would be accepted).
- **Config** — the configuration revision, the floating next-hops, and *pending on \<member\>* or *pair mismatch*.
- **Sync** — *In sync*, *N missing on \<member\>* or *N pending*, with **Sync now**.

Expanding a row shows the pair settings: heartbeat port, interval and misses, fence targets, next-hops, preemption (off), each member's priority and addresses, and the revision.

## HA state elsewhere in the UI

| Where | What you see |
| --- | --- |
| **Clients list** | An **HA** column with a pair icon (the pair name in its tooltip) and the role; pair members grouped under a header row (*HA pair · N of 2 members · members hear each other*), a vacant slot row for an HA-mode pair. Search matches pair names. |
| **Client detail** | A pill with the pair and role in the header, and an **HA pair** panel: pair and status, role with priority, epoch and reason, peer, heartbeat paths, data plane, next-hop, VIPs (*held here / on the peer / not here*), configuration revision, `elchi-ha` daemon state and version, alarms. |
| **Services list** | A second status badge such as *HA: Live* or *HA: Degraded* for services served by a pair. |
| **Service detail** | The pair name and status in the header; on **On each client**, members grouped per pair (*HA pair · name · VIP · status*) and single clients separately; a VIP tag per member: *VIP served here* on the active, *VIP ready (peer serves it)* on the standby. |
| **Dashboard** | The Client Resources widget shows pair members side by side in a frame labelled **HA pair**, with role badges. |

Pair names link to the HA Pairs page for Owner and Admin users; other roles see the state but not the page.

## Audit log and metrics

**Audit actions:** `CREATE_HA_PAIR`, `UPDATE_HA_PAIR`, `DELETE_HA_PAIR`, `FORCE_DELETE_HA_PAIR`, `HA_REPLACE_MEMBER`, `HA_FAILOVER`, `HA_MAINTENANCE_ON` / `HA_MAINTENANCE_OFF`, `HA_PUSH`, `HA_SYNC`, and `HA_<command>` for appliance commands sent through the API. Every role change a member reports is recorded as a system entry, **`HA_ROLE_CHANGE`**, with the client, old and new role, epoch, reason, peer data plane, gateway and heartbeat paths.

**Metrics** (the controller pushes them to the registry every 30 s; the registry serves them on its Prometheus `/metrics` endpoint):

| Metric | Labels | Meaning |
| --- | --- | --- |
| `elchi_ha_role` | pair, pair_id, client_id | `1` when the member is ACTIVE, `0` otherwise. |
| `elchi_ha_peer_ok` | pair, pair_id, client_id | `1` when the member hears its peer, `0` otherwise. |
| `elchi_ha_clock_skew_ms` | pair, pair_id, client_id | Clock difference between the members. |

On the appliance itself, `show ha` gives the live view of both members — see [Appliance commands](./appliance-commands.md).
