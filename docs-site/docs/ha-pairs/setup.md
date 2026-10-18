---
title: Setting Up a Pair
description: Start an Elchi OS appliance in HA mode, create a pair from one or two clients, add or replace the second member, and tune heartbeat, fencing and next-hop settings.
sidebar_position: 2
tags: [operations, high-availability]
---

A pair is created and managed on the **HA Pairs** page (sidebar → **Administration** → **HA Pairs**, `/clients/ha-pairs`). The page is visible to **Owner** and **Admin** users. It lists every pair of the selected project and refreshes every 5 seconds.

There are three ways to end up with a pair:

| Path | When to use it |
| --- | --- |
| [Install the appliance in HA mode](#1-install-the-appliance-in-ha-mode) | You are installing a new edge box and know it will be paired later. |
| [Enable HA mode on a client](#2-enable-ha-mode-on-an-existing-client) | A single Elchi OS client already serves traffic and should become the first member of a pair. |
| [Create a pair](#3-create-a-pair) from one or two clients | You have the boxes ready and want to set the pair up in one step. |

A pair with **one member** is a fully working pair in **HA mode**: the member serves as ACTIVE and the pair status is **Awaiting peer**. When you add the second box, every service of the pair is deployed to it automatically at the same VIPs, and it joins as STANDBY.

## 1. Install the appliance in HA mode

The Elchi OS setup wizard asks **"Install as an HA appliance (pair with a second one later)?"**. Answer yes (or set the OVF property `elchi.client.ha`), and the appliance writes `client.ha: true` to `/etc/elchi/config.yaml`.

When the agent registers, it reports HA mode and its heartbeat addresses. The control plane then creates a single-member pair named `<client>-ha` (or `<client>-ha-2`, … if the name is taken). This happens once per client: a client you later unpair is not paired again automatically.

## 2. Enable HA mode on an existing client

On the **Clients** list, open the row menu of an Elchi OS client and choose **Enable HA mode**, or use the **Enable HA mode** button on the client's detail page.

The dialog proposes a **Pair name** (the client name with a `-ha` suffix). Confirm with **Enable HA mode**. The client becomes the first member of the pair, keeps serving as ACTIVE, and the pair shows **Awaiting peer**.

## 3. Create a pair

Click **Create pair** on the HA Pairs page.

1. **Name** — 1–64 characters of letters, digits, space, `.`, `-` or `_`, starting with a letter or digit. Unique within the project (case-insensitive).
2. **Members** — pick one or two clients. Only Elchi OS clients that are not already in a pair are listed. A greyed-out client says why it cannot be picked:
   - *not connected* — the client must be online;
   - *no HA addresses reported* — the agent is too old or has no usable IPv4 address.
3. **Services on the members.** At most **one** of the two clients may already have services. If one has, its services are deployed to the other one at the same addresses (the dialog says so). If both have services, the pair is refused: pair an empty client with a loaded one.
4. **Priority of each member** — 1–1000, different for the two members. Defaults: **200** for the first, **100** for the second. The higher priority wins the start-up election. There is no automatic fail-back, so the priority decides only the next election, not the current roles.
5. **Advanced** (optional) — see [Pair settings](#pair-settings).

Click **Create pair**. The controller generates the pair's heartbeat key, configures `elchi-ha` on the members and, if one member had services, starts syncing them to the other one (the pair reads **Syncing** until done).

## Add the second member

On a pair with a free slot, click **Add member** (in the vacant member slot or the row's **⋮** menu).

- **Client** — an Elchi OS client of the project that is connected, in no pair and has **no services**. When the pair serves services, loaded clients are greyed out (*has services*). To pair a client that already has services, start the pair from it with **Enable HA mode** or **Create pair**.
- **Priority** — 1–1000; empty keeps the slot's priority. It must differ from the other member's.
- **Data / management address override** — optional, see below.
- **Services deployed to the new member** — the dialog lists every service of the pair (name · address · version). For an OpenStack client, pick the **OpenStack interface** that will carry each VIP as an allowed address pair.

Click **Add member**. The new member joins as **STANDBY**, and every pair service is deployed to it at the pair's VIPs. The pair goes **Syncing** → **Live**; in tests this took about 4 seconds. Failed deployments are retried with back-off and are listed under the pair's **Sync** column.

The same dialog replaces a lost member — see [Replacing a failed member](./failover-and-maintenance.md#replacing-a-failed-member).

## Pair settings

Name and priorities are set on the Create pair form, the rest under **Advanced**. Everything except the next-hops changes later with **⋮ → Edit pair**; next-hops have their own **⋮ → Routed VIPs (next-hops)** dialog. Saving raises the pair's **configuration revision** and pushes it to the connected members; an offline member applies it when it reconnects.

| Setting | Default | Range | Meaning |
| --- | --- | --- | --- |
| **Name** | — | 1–64 chars | Display name. Rename at any time. |
| **Priority** (per member) | 200 / 100 | 1–1000, distinct | Start-up election rank. Higher wins. |
| **Data address override** (per member) | address the agent reports | IPv4 | Pins the heartbeat's data-path address. Leave empty unless you need another address. |
| **Management address override** (per member) | address the agent reports | IPv4 | Pins the heartbeat's management-path address. |
| **Heartbeat port** | 8650 | fixed | UDP. The appliance firewall opens only this port for the peer. |
| **Interval (ms)** | 250 | 100–1000 | How often each member sends a heartbeat on each path. |
| **Misses** | 3 | 2–10 | Missed heartbeats on **every** path before the peer is considered lost (default ≈750 ms). |
| **Fence targets** | none (default gateways are used) | up to 8 unicast IPv4 | Witness addresses a member probes to tell its own isolation from a lost peer. |
| **Floating next-hops** | none | up to 4 IPv4 | Addresses the active member holds so a router can route [routed VIPs](./deploying-services.md#routed-vips-and-floating-next-hops) through them. Managed with **⋮ → Routed VIPs (next-hops)**. |

The heartbeat key is generated by the controller and never shown. Rotate it with **⋮ → Rotate secret…** — see [Secret rotation](./failover-and-maintenance.md#rotating-the-heartbeat-key).

### Heartbeat paths

Each member heartbeats its peer over **two paths at once**: the **data** network and the **management** network, on the addresses the agents report. A path that goes silent while the other still works raises a warning (*Data heartbeat path down* / *Management heartbeat path down*); the peer counts as lost only when **every** path is silent. Messages are signed with the pair's key (HMAC-SHA256) and protected against replay; datagrams from any address other than the peer's are dropped.

### Fence targets

A member that stops hearing its peer must know whether the peer died or whether it is itself cut off. It answers that by ARP-probing **fence targets** every second — your gateway or another always-on address on the data network. Without fence targets, the members probe their default gateways.

- A member whose gateway does not answer **does not take over**: it cannot tell a dead peer from its own isolation.
- If no fence target ever answered, fencing is turned off on that member and the alarm *Fencing disabled* is raised.
- An active member that is isolated keeps its VIPs (alarm *Isolated*) unless its uplink has no carrier, in which case it **fences** itself and gives up its VIPs. A fenced member returns to standby once its gateway answers again and it hears the peer (or 10 s later).

Fence targets must be unicast IPv4 addresses: not in `0.0.0.0/8`, not loopback, link-local (`169.254.0.0/16`), multicast or `240.0.0.0/4`. They may not be a member's own address, a next-hop or a service VIP.

## Network requirements

| Traffic | Between | Notes |
| --- | --- | --- |
| **UDP 8650** heartbeat | member ↔ member, on the data **and** management addresses | Opened by the appliance firewall for the peer's two addresses only (the set is filled from the pair configuration). |
| **TCP** to the VIP's listener ports | standby → active's VIPs | Data-plane probe: the standby checks that the active really serves before it decides anything. |
| **ARP / L2** | members ↔ gateway, members ↔ clients | Gratuitous ARP on takeover, duplicate-address probes, fence-target probes. |
| Agent → controller | both members | The normal client connection (see [Network Access](/getting-started/network-access)). |
| BGP TCP 179, BFD UDP 3784/3785/4784/7784 | members ↔ routers | Only with BGP; opened for configured neighbours only. |

The appliance ships the kernel settings the pair needs. `elchi-ha` checks the first three:

| Setting | Required | If wrong |
| --- | --- | --- |
| `net.ipv4.conf.*.arp_ignore` | `0` on `all`, `default` and every NIC that carries a VIP or next-hop | The member is **misconfigured**: it refuses to become active, and its peer reports it as not ready (misconfigured). |
| `net.ipv4.conf.all.arp_announce` | `2` recommended | Warning. |
| `net.ipv4.ip_nonlocal_bind` | `1` | Warning. |
| `net.ipv4.conf.{all,default}.arp_filter` | `1` (image default, not checked by `elchi-ha`) | Prevents ARP flux when several NICs share one L2 segment. |

:::tip[After you add a NIC]
The agent reports the members' data and management addresses when it starts. After adding or re-addressing a NIC on a member, restart the agent (`systemctl restart elchi-client`, or the console's service restart) so the pair sees the new subnet.
:::

## Unpair

**⋮ → Unpair** deletes the pair. Both members leave HA: `elchi-ha` is unconfigured on them.

- A pair that still serves services cannot be unpaired cleanly. **Undeploy the services first**; the dialog lists them.
- **Force unpair** (type the pair name to arm it) deletes a serving pair anyway. All members must be connected. The services stay on one member (the active one) and are removed from the other, so the same VIP is never on two independent boxes.
- An unpaired client is not put back into HA mode automatically.
