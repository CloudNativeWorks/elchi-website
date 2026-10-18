---
title: HA Pairs Overview
description: Active/passive pairs of Elchi OS edge appliances that share virtual IPs — how a pair elects its active member, fails over, and keeps services up without BGP.
sidebar_position: 1
tags: [operations, high-availability]
---

An **HA pair** is two [edge clients](/operations/clients) that serve the same services on the same **virtual IP addresses (VIPs)**. Only one member — the **active** one — holds the VIPs at any moment. The other member, the **standby**, runs the very same Envoys warm and takes the VIPs over within about two seconds if the active member fails, or within milliseconds on a planned failover.

HA pairs remove the single edge box as a single point of failure in networks where BGP/ECMP is not available. They work on a plain Layer 2 network with gratuitous ARP, and they also work with [BGP](#bgp-and-routed-vips) when you have it.

:::note[Two different kinds of "HA" in Elchi]
This section is about **edge HA**: two appliances sharing a VIP in the data plane. Running several controllers and control planes for the **management plane** is a different feature — see [Registry & High Availability](/administration/registry-and-ha).
:::

## How a pair works

```text
                 clients / upstream router
                           │
                   VIP 172.31.1.45 (ARP)
                           │
          ┌────────────────┴────────────────┐
          │                                 │
 ┌────────▼─────────┐  heartbeat   ┌────────▼─────────┐
 │ member A  ACTIVE │◄────────────►│ member B STANDBY │
 │ holds VIP /32    │ UDP 8650 on  │ same Envoys, warm│
 │ Envoy serving    │ data + mgmt  │ VIP not on a NIC │
 └────────┬─────────┘              └────────┬─────────┘
          │      agent ⇄ controller (config, status)
          └────────────────┬────────────────┘
                     Elchi control plane
```

- **The boxes decide who is active, not the control plane.** Each member runs a small daemon, `elchi-ha`, that heartbeats its peer, probes the peer's data plane and the gateway, and elects the active member. The control plane stores the pair, pushes its configuration to both members, keeps their services in step, and shows what the members report. A control-plane outage never moves a VIP.
- **The standby is hot.** Both members receive the same xDS configuration and run the same Envoy listeners, bound to the VIP through `ip_nonlocal_bind`. The standby simply does not have the address on an interface, and a firewall rule drops any traffic it would send from a VIP.
- **Takeover** adds the VIP as a `/32` on the active member and sends gratuitous ARP so the network learns the new owner. With BGP, the new active member starts announcing the VIP and the old one stops.
- **No automatic fail-back.** Preemption is off: after a failover the lower-priority member stays active and the pair reads **Failed over**, which is a healthy state. You move the VIPs back with a [planned failover](./failover-and-maintenance.md#planned-failover) when it suits you.
- **The agent, Envoy and the daemon are independent.** Restarting or upgrading the agent, an xDS update, an Envoy hot restart or a restart of `elchi-ha` itself never moves the VIP and never causes a false failover. An OS upgrade goes standby first; on the active member it hands the VIPs over as a planned failover before the reboot.

## What triggers a failover

| Event | What the pair does |
| --- | --- |
| Active member powered off, crashed or isolated from its peer | The standby confirms the peer is gone on **every** heartbeat path **and** that the peer's data plane is not answering, then takes over (≈2 s). |
| Active member's data link or VIP link loses carrier | The active hands over to the standby (≈1 s). |
| Active member loses its gateway while the standby still reaches its own | Planned handover to the standby. |
| A listener on the active turns unhealthy (≈3 s), or its unit is down for 10 s or more, and the standby is ready for it and for every other VIP | Planned handover. The whole member moves, never a single VIP. |
| Operator failover from the UI, API or appliance console | Planned handover (≈50 ms). |
| Active member rebooted or shut down from the console, or factory reset | Planned handover with listener draining before the box goes down. |
| Heartbeat lost but the peer's data plane still answers | **No failover** — a heartbeat partition never creates a split brain. |
| One Envoy crash on the active | **No failover** — the unit restarts (a few seconds). Repeated crashes hold the listener and hand over. |
| High load | **No failover** — load is not a failover signal. |

The full decision rules are in [Failover & Maintenance](./failover-and-maintenance.md#how-the-members-decide).

## Measured behaviour

Measured on Elchi OS appliances with continuous traffic (one request every 100 ms):

| Scenario | Result |
| --- | --- |
| Planned failover (UI / API / console) | ≈50 ms, at most 1 request lost |
| Planned failover with 100 VIPs | All VIPs on the new active in ≈3.3 s, longest gap 417 ms |
| Active member powered off | Takeover ≈2.0–2.2 s, 2–3 requests lost |
| Reboot of the active (planned handover), `elchi-ha` killed, agent restarted | 0 requests lost |
| Heartbeat cut for 30 s, data plane up | No failover, no split brain |
| Data NIC unplugged on the active | Handover ≈1 s, 1 request lost |
| Agent upgraded on both members (standby first) | 0 requests lost |
| Planned failover over BGP | Route moves in 200–500 ms, at most 1 request lost |
| Active powered off over BGP with BFD | Longest gap ≈1.9 s (without BFD it is bounded by the BGP hold time) |
| Randomised fault soak (1 872 samples) | VIP on both boxes at once: 0 times |

## Requirements

- **Elchi OS appliances.** Both members must run [Elchi OS](/elchi-os/overview); HA pairs are not available on a client installed on a general-purpose Linux host. The appliance ships the `elchi-ha` service, the firewall rules for the heartbeat and the kernel settings the pair needs.
- **One project, at most two members.** Both members belong to the same project and to no other pair.
- **Owner or Admin role** to create, operate and view pairs. Other roles see each member's pair and role on the Clients pages.
- **A shared data subnet** for on-link VIPs — both members need an address in the subnet the VIP lives in. VIPs outside the members' subnets need a [floating next-hop or BGP](./deploying-services.md#where-a-vip-can-live).
- **UDP 8650** open between the members on the data and the management networks (the appliance firewall already opens it, for the peer's addresses only). See [Network requirements](./setup.md#network-requirements).
- **IPv4.** VIPs, next-hops, fence targets and heartbeat addresses are IPv4.
- **Licensing:** each member is a client, so a full pair uses **two** client slots of your license (a pair in HA mode, one). A member that is temporarily away keeps its slot.

## BGP and routed VIPs

BGP is **not required**. When both members run BGP, only the member that holds the VIPs announces them (the others' `redistribute connected` sees nothing to announce), so the router follows every failover. Turn on **BFD** on the BGP neighbours of pair members so that a powered-off member's routes are withdrawn in about a second instead of after the BGP hold time — see [Deploying services](./deploying-services.md#bgp).

## Where to go next

1. **[Setting up a pair](./setup.md)** — HA mode, creating a pair, adding the second member, settings and network requirements.
2. **[Deploying services](./deploying-services.md)** — deploying to a pair, VIP placement, routed VIPs, GSLB and OpenStack.
3. **[Failover & Maintenance](./failover-and-maintenance.md)** — failover, maintenance, replacing a member, upgrades.
4. **[Monitoring a pair](./monitoring.md)** — statuses, roles, alarms and where they appear.
5. **[Appliance commands](./appliance-commands.md)** — `show ha`, `system ha …` and the edge CLI.
6. **[HA Pairs API](./api.md)** — the REST endpoints.
