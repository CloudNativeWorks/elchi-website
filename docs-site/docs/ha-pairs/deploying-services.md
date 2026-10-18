---
title: Deploying Services to a Pair
description: Deploy and remove services on an HA pair — one VIP for both members, on-link vs routed VIPs, floating next-hops, BGP and BFD, offline members, standby-first changes, GSLB and OpenStack.
sidebar_position: 3
tags: [operations, high-availability]
---

A pair always serves **as a whole**: a service is deployed to **both** members at **one** downstream address — the **VIP** — and removed from both. You deploy with the normal **Deploy** dialog of a service; there is no separate pair deployment screen.

## Deploying

In the service's deploy dialog, a pair appears as **one row** named after the pair (for example `edge-ha`), with both members listed underneath and their current roles. A single-member pair is a normal row with the pair name.

1. **Select the pair row.** Selecting it selects both members.
2. **Enter the VIP** in the address field (placeholder *Pair VIP (both members)*). Both members get the same address.
3. Deploy.

Both members receive the same bootstrap and xDS configuration. On the **active** member the agent brings the VIP up; on the **standby** the listener is started and bound to the VIP, but the address stays off its interfaces until it becomes active.

The dialog checks the VIP before sending, with the same rules as the controller, and shows any problem under the address field. The controller's own refusal is shown verbatim.

### Rules

- **Both members, same address.** A deploy that names only one member of a pair, or two different addresses, is refused: *"pair X: deploy to both members … a pair always serves as a whole"*.
- **Canonical IPv4 only.** Write `172.31.1.45`, not `172.31.1.45/32`.
- **The VIP belongs to the pair.** A client outside the pair can never use the pair's VIP (*"address X is served by HA pair Y"*), and the pair cannot take an address a single client already serves. A member's heartbeat address and the pair's next-hops are reserved project-wide as well.
- **Changing a VIP** means undeploying the service from the pair and deploying it again with the new address.
- **A pair and single clients can serve one service.** You can deploy a service to a pair (at its VIP) and to stand-alone clients (each at its own address) in the same deploy; the single clients are not part of the pair's election.

## Where a VIP can live

| Placement | Condition | How the VIP moves |
| --- | --- | --- |
| **On-link** | The VIP is inside a data subnet on which **both** members have an address. | The active member adds the `/32` and sends gratuitous ARP. |
| **Routed** via a floating next-hop | The VIP is outside the members' subnets, and the pair has a [floating next-hop](#routed-vips-and-floating-next-hops). | The router routes the VIP (or its block) via the next-hop; the active member holds the next-hop. |
| **Routed** via BGP | The VIP is outside the members' subnets, and **both** members run BGP. | Only the active member announces the VIP. |

A VIP is refused when it is:

- a member's own address, or the network or broadcast address of the subnet;
- on a subnet only one member has (*"both members need a NIC on that subnet"*);
- on a member's **management** network (use a data subnet);
- the pair's next-hop, or a reserved address (`0.0.0.0/8`, loopback, link-local, multicast, `240.0.0.0/4`);
- outside the members' data subnets with neither a next-hop nor BGP on both members: *"gratuitous ARP cannot move it — choose an on-link VIP, set a floating next-hop on the pair, or configure BGP on both members"*.

## Routed VIPs and floating next-hops

A VIP outside the members' subnets cannot move by gratuitous ARP. Give the pair a **floating next-hop** instead — the same model as a NetScaler SNIP or an F5 floating self-IP:

1. Pick a **free** address on a data subnet that both members share (for example `172.31.2.40`). Open **⋮ → Routed VIPs (next-hops)** on the pair and add it (up to 4).
2. On the upstream router, route the VIP block via that address:

   ```text
   ip route 198.51.100.0/28 via 172.31.2.40
   ```

3. Deploy services with VIPs from that block. The deploy dialog reminds you which route the router needs.

The active member holds the next-hop (on a dedicated interface, `elchi-ha-nh`), so the router's route follows every failover. Return traffic leaves by the members' own routing: if their default gateway is elsewhere, add a policy route for the block on both members.

Next-hop rules: IPv4, on-link on a data subnet of both members, not a member's address, not another pair's or service's address. A next-hop list change is refused if a routed VIP of the pair would lose its path.

## BGP

When both members run BGP, the agent's `redistribute connected` is filtered to the VIP `/32`s, so **only the member that holds the VIPs announces them** — the standby announces nothing. A member coming back from a power cut joins as standby with zero prefixes.

| Event | Without BFD | With BFD |
| --- | --- | --- |
| Planned failover | Route moves in 200–500 ms | same |
| Active powered off | The router keeps the dead path until the **hold timer** expires (3/9 s timers: ≈7.5 s gap; 1/3 s: ≈2.3–3.25 s) | Dead path withdrawn in ≈1 s (longest gap ≈1.9 s) |

Turn on **BFD** for the neighbours of pair members (BGP neighbour drawer → **BFD** switch). The router must run BFD towards the members too. Without BFD, use short BGP timers on pair members.

## Offline members

- **Deploy:** an offline member is not refused. The connected member is deployed now; the offline one is recorded as **pending** (*"Deploy pending on X: the HA pair member is offline; it completes when the member reconnects"*). If no member is connected, the deploy is refused.
- **Undeploy:** an offline pair member is **not** force-detached. The removal is recorded as pending and completes when it reconnects.
- **On reconnect** the controller pushes the current pair configuration, compares the member's units with the service records, deploys what is missing and removes orphan units.
- Pending work is retried by a reconciler with back-off (2, 4, 8 … minutes, up to 24 h). The HA Pairs page shows it in the **Sync** column; **Sync now** retries pending deployments immediately.

## Standby first

Changes that restart or remove a listener are applied to the **standby first**, then to the active member. If the standby step fails, the active member is left untouched. This applies to:

- undeploy, bootstrap updates and listener (Envoy version) upgrades;
- service **Restart**, **Reload** and **Stop**.

For bootstrap updates, **Restart** and **Reload**, the controller waits (up to 30 s) until the standby reports that it is standby, hears its peer and has the VIP healthy and ready before it touches the active member. Undeploy and **Stop** go to the active member as soon as the standby's step succeeds.

With a member disconnected, bootstrap updates and **Restart** / **Reload** / **Stop** are refused for the pair as a whole, and a listener upgrade skips the pair. An undeploy is recorded as pending for the offline member (see [Offline members](#offline-members)). A half-finished listener upgrade is completed by the reconciler; the pair reads **Degraded** meanwhile.

:::warning[Stop stops both members]
**Stop** on a pair service stops the proxy on both members (standby first): the VIP serves nothing until the service is started again — a failover cannot help.
:::

## GSLB

A pair's VIP is **one** GSLB row, owned by the pair rather than by a member, so the record and the DNS feed are untouched by failovers. Removing the service from both members removes the row. A service served by a pair and by single clients has one row per address. The GSLB health probe must be able to reach the VIP.

## OpenStack

On OpenStack, a member serves each VIP as an **allowed address pair** on one of its ports, so pair deployments use IP mode `aap`. When you add a member to a serving pair, the Add member dialog asks for the **OpenStack interface** of each service. An allowed address pair is kept while another client still uses the same port.
