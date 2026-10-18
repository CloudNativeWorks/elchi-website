---
title: Client Network & BGP
description: The Network tab of a client — the netplan editor with safety-mode rollback, static routes, routing policies, routing tables, and FRR/BGP (configuration, neighbours with BFD, policies, routes, logs) including how service VIPs are announced.
sidebar_position: 4
tags: [operations]
---

The **Network** tab of a [client's detail page](./clients.md#client-detail) (`/clients/:client_id` → **Network**) is where you manage the host networking of an edge node: its interfaces, static routes, policy-routing rules, routing tables and — on a BGP-enabled client — its FRR BGP speaker. Every change is a command on the [command stream](./overview.md#1-the-command-stream-lifecycle): the controller validates it and the `elchi-client` agent applies it on the host.

The tab has five sub-tabs:

| Sub-tab | What it manages |
| --- | --- |
| **Interfaces** | The interface inventory and the netplan editor. |
| **Route** | Static routes, in the main table or a custom table. |
| **Routing policy** | Policy-routing rules (`ip rule`) that select a routing table. |
| **Routing tables** | Named routing tables that routes and policies refer to. |
| **BGP** | FRR BGP — shown only when the client registered with BGP enabled (see [Prerequisite](#prerequisite-a-bgp-enabled-client)). |

## Required roles

| Action | Roles |
| --- | --- |
| View interfaces, routes, policies, tables; read BGP configuration, neighbours, policies, routes and summary; read FRR logs | Every role, Viewer included |
| Apply netplan, add/remove routes, policies or tables | **Owner** or **Admin** |
| Any BGP write: save the configuration, add/edit/remove neighbours or policy objects, Clear BGP | **Owner** or **Admin** |

Only the reads in the first row are open to Editors and Viewers; any other network or FRR operation is refused for them.

## Interfaces

The **Interfaces** sub-tab shows one card per interface (the loopback is hidden) with its link state (**up**, **down** or **no carrier**) and speed, addressing (**Static**, **DHCP**, **No address**), addresses, the parent or members of a VLAN or bond, bond mode, MTU, MAC address (and the permanent MAC if it differs) and driver. A badge shows who owns the interface: **Elchi OS**, **Management**, **UI**, **Legacy UI**, **Service**, or **Unmanaged**.

Interfaces named `elchi-if-*` are listed separately under **Service interfaces** — "Elchi-managed service interfaces (listener VIPs)". The agent creates these for deployed listeners; you do not edit them here.

### The netplan editor

**Edit network configuration** opens the **Netplan configuration editor**: a YAML editor with the complete netplan configuration Elchi manages on the host (`/etc/netplan/99-elchi-interfaces.yaml`). If there is no such file yet, the editor starts from a commented template. It "will affect all network interfaces on the system", so the editor shows the available interfaces (with their first address) above it.

- **Examples** opens a drawer of ready-made configurations: Basic DHCP, Static IP, Multiple Interfaces, Bond Active-Backup, Bond 802.3ad (LACP), VLAN, Bridge, Advanced Static, Complex Multi-Setup, and Link-Local Interfaces.
- **Do not put routes or routing policies in this YAML.** The agent rejects any `routes` or `routing-policy` key; use the **Route** and **Routing policy** sub-tabs instead.
- **Apply configuration** sends the YAML; **Cancel** discards it.

Before anything is written, the controller checks that the YAML is not empty and has a `network:` root. The agent then checks for the forbidden keys and validates the file with `netplan generate` against a staged copy of the host's netplan directory, so a file that would break the other netplan files is refused. Interfaces without any IPv6 setting get `accept-ra: false` added on the host.

### Safety mode and automatic rollback

The editor's **Safety mode** switch is **On** by default. The agent saves the current file first so it can restore it, then writes the new one and runs `netplan apply` (with a 60-second limit).

| Safety mode | What happens after `netplan apply` |
| --- | --- |
| **On** | The agent checks that it can still reach the controller. It waits a 3-second grace period, then checks every 500 ms (gRPC ping to the controller, with TCP/ICMP fallbacks). Two successful checks in a row confirm the change. Five failed checks in a row, or the end of the 10-second window without a successful check, trigger a **rollback**. |
| **Off** | No connectivity check — "Changes will be applied directly without rollback protection." |

In both modes, a `netplan apply` that fails (netplan rejects the file) is rolled back at once. A rollback writes back the previous file, or an empty `network: version: 2` file if there was none, and applies it again. If the rollback itself fails, the error says so and the file needs manual repair.

There is no separate confirm step: the agent's connectivity check is the confirmation (`netplan try` is not used). The UI has no rollback button either.

:::warning[Network interruption]
Applying netplan changes the host's networking system-wide and can briefly interrupt SSH sessions and running services. Keep Safety mode on unless you know the controller stays reachable.
:::

### Elchi OS clients

On an [Elchi OS appliance](/elchi-os/overview) the console owns the interfaces (see [Console commands](/elchi-os/console)). The Interfaces sub-tab is then read-only — "Interfaces are configured from the Elchi OS console" — and shows the console commands (`set interface …`, `set bond …`, `apply`, which must be confirmed within 120 s with `network confirm`, and `show interfaces`). The agent refuses a netplan apply on these hosts. Routes, routing policies, routing tables and BGP stay editable from the UI. If a file written by the UI on an older release (`99-elchi-interfaces.yaml`) is still present, a warning asks you to move that configuration to the console and remove the file.

## Routes

The **Route** sub-tab lists the host's routes: static routes first, then a **System routes** group. Columns are **Interface**, **Destination**, **Gateway** (`direct` when empty), **Scope**, **Protocol**, **Table** (`Main` when empty), **Metric** and **Source IP**.

Routes installed by a protocol or the system are locked and cannot be selected: `bgp`, `ospf`, `isis`, `zebra`, `bird`, `kernel`, `redirect`, `dhcp`, and `ra`. On an Elchi OS client, routes configured on the console are locked as well (**Elchi OS**). Select other routes and use **Remove selected** to delete them.

**Add route** opens a form; switch on **Multiple routes** to add several at once.

| Field | Notes |
| --- | --- |
| **Destination** | Required. CIDR, e.g. `192.168.1.0/24`; `default` or `0.0.0.0/0` for the default route. |
| **Gateway** | Required. Next hop reachable on the selected interface (or mark it on-link). It must be the same address family as the destination. |
| **Interface** | Required. Service (VIP) interfaces are grouped apart from the regular ones. |
| **Table** | Optional. Empty = main table; other tables are used only by matching routing policies. Tables 1000 and above belong to the OS and are refused. |
| **Metric (optional)** | Lowest metric wins; empty = kernel default. |
| **Source IP (optional)** | Preferred source address, which must be an address on this host. It is applied to the kernel and saved to netplan (`from:`). |
| **Scope (optional)** | **Global**, **Link** or **Host**. |
| **Protocol (optional)** | **Static**, **Kernel**, **DHCP**, **Boot** (empty = boot). Netplan cannot store it, so after a reboot the route comes back as static. Routes tagged kernel or dhcp cannot be deleted from here until then. |
| **On-link gateway** | Treat the gateway as directly reachable even if it is outside the interface's subnets. |

The agent applies routes to the kernel and persists them per interface in `/etc/netplan/99-elchi-route-<interface>.yaml`, so they survive a reboot.

## Routing policies

The **Routing policy** sub-tab lists policy-routing rules "in the order the kernel evaluates them" (priority, then IPv4 before IPv6). Columns are **Priority**, **From**, **To** (`any` when empty), **Match** (other selectors such as `fwmark`, `iif`, `oif`), **Table**, **Family** and **Owner**. Expand a row to see the full rule and its interface.

| Owner | Meaning |
| --- | --- |
| **UI** | Added from the Elchi UI; kept across a reboot. |
| **OS** | Defined in another netplan file (the OS, cloud-init); it comes back at every boot, so change it there. Locked. |
| **Not persisted** | In the kernel only, in no netplan file; lost at the next reboot. |
| **External** | Another program's rule (a VPN, a container network). Elchi neither changes nor removes it. Locked. |

Owners are reported by agents from 1.7.7 on. **OS** and **External** rules cannot be selected for **Remove selected**.

**Add policy** (switch on **Multiple policies** for several):

| Field | Notes |
| --- | --- |
| **From (optional)** | Source network in CIDR form. |
| **To (optional)** | Destination network in CIDR form; must be the same address family as From. |
| **Table** | Required — the routing table the rule looks up. Tables 1000 and above are refused. |
| **Interface** | Required. |
| **Priority** | 100–999 (default 100). Lower number = higher priority. Elchi manages only rules in this range. |
| **Address family** | Follows the From/To address; you choose **IPv4** or **IPv6** only for a rule without From/To. |

Policies are persisted in `/etc/netplan/99-elchi-policy-<interface>.yaml`.

## Routing tables

The **Routing tables** sub-tab lists the routing tables with their **ID**, **Name** and **Usage** (how many routes and policies use each table, or **Not in use**). The system tables 253 (`default`), 254 (`main`) and 255 (`local`) are marked **System**. They are reserved and cannot be edited or removed.

**Add table** opens a dialog with **Table ID** and **Table name**. The name must start with a letter and contain only letters, digits, underscores and hyphens (up to 32 characters). The form accepts IDs 1–252, but the controller accepts only Elchi's management range 100–999, so the IDs that work from the UI are **100–252**. Editing a table changes only its name.

Removing a table also removes, on the host, the kernel routes in that table and the policy rules that point at it, so nothing is left orphaned. The agent stores table definitions in `/var/lib/elchi/rt_tables.conf`, linked into `/etc/iproute2/rt_tables.d/elchi.conf`.

## BGP

### Prerequisite: a BGP-enabled client

The **BGP** sub-tab appears only for a client that registered with BGP enabled — `client.bgp: true` in the agent's [configuration](/installation/client/configuration). The [client installer](/installation/client/installation#with-bgp-routing) sets this with `--enable-bgp`. That flag also installs FRR 10.4 from the official FRR repository and enables the `zebra` and `bgpd` daemons. `--upgrade` does not install FRR, so run a full install to add BGP to an existing host.

The BGP sub-tab has its own tabs: **Configuration**, **Neighbors**, **Policies**, **Routes** and **Logs**.

### Configuration

At the top, the **BGP summary** shows **Router ID**, **AS number**, **RIB entries**, **Peers**, **Table version** and **VRF name**, plus a neighbour table (**Neighbor**, **V**, **AS**, **MsgRcvd**, **MsgSent**, **State**, **InQ**, **OutQ**, **Up/Down**, **PfxSnt**, **PfxRcd**). Each neighbour row has a **Hard Clear** (resets the session) and a **Soft Clear** (refreshes routes) action.

Below it, the **BGP configuration** form:

| Field | Notes |
| --- | --- |
| **AS number** | Required, 1–4294967295. Changing it re-creates the BGP process: the UI asks first, all neighbours are re-added under the new AS (their policies kept), and every session resets. If a neighbour cannot be re-created, the previous configuration is restored. |
| **Router ID** | Required, dotted quad — usually a stable IP of the box. Changing it resets the sessions. |
| **Keepalive time (seconds)** / **Hold time (seconds)** | Global timers (1–65535 / 3–65535). |
| **Advertise VIPs (redistribute connected)** | Announces only the /32 VIPs of this box's deployed listeners — see [How VIPs are announced](#how-vips-are-announced). |
| **Redistribute static** | Advertises FRR static routes to all peers, unfiltered. |
| **Redistribute kernel** | Advertises kernel routes FRR did not install (e.g. `ip route`) to all peers, unfiltered. |
| **Redistribute local** | Advertises the /32 of every address on the box to all peers, unfiltered — not just the VIPs. Needs FRR 10 or newer. |
| **Maximum paths** | Equal-cost paths, 1–32. |
| **Administrative distance** | `external-internal-local`, e.g. `20-100-200`. |
| **Always compare MED**, **Log neighbor changes**, **Deterministic MED** | Best-path and logging switches. |
| **Enable graceful restart** / **Preserve forwarding state** / **Disable graceful restart** | Enable and Disable are mutually exclusive. With GR enabled you can also set **Restart timer**, **Stale path timer**, **Select defer time** and **RIB stale timer** (seconds). |

**Save configuration** applies the form and the agent writes it to FRR's saved configuration (`write memory`). **Clear BGP** clears the routes of all neighbours (`*`), with a **Soft clear** switch (on by default) and a **Direction** of **All**, **In** or **Out**.

### Neighbors

The **Neighbors** tab lists each peer: **Peer IP**, **Remote AS**, **Description**, **State** (Established green, Active/Connect/OpenSent/OpenConfirm amber, Idle red) and **Last reset**. Click a row to see its details: basic and connection information, timers, message and prefix statistics, the IPv4 unicast address family, graceful restart, and the last reset reason.

**Add BGP neighbor** (or the edit icon) opens a drawer. Save the configuration first: the neighbour is created under the AS from the Configuration tab.

| Section | Field | Notes |
| --- | --- | --- |
| Basic | **Neighbor address** | Required, IPv4. Cannot be changed when editing. |
| | **Remote AS** | Required, 1–4294967295. |
| | **Description** | Free text. |
| | **Password (MD5)** | Write-only: the agent never returns it. When one is set the field shows **set**; leave it empty to keep it, type a new one to replace it, or turn on **Remove password**. |
| | **Update source** | Interface or local IP to open the session from (e.g. a loopback). |
| | **Shutdown** | On save, the session is closed and stays down until you switch Shutdown off. Routes learned from the peer are dropped, and everything this box advertises to it — VIPs included — is withdrawn. |
| | **BFD** | Bidirectional Forwarding Detection (FRR `bfdd`, single hop, 300 ms × 3): a lost peer is detected in about a second instead of after the hold time, and its routes are withdrawn at once. Recommended on HA pair members. The peer must run BFD towards this box too; without it the BGP session is not affected. |
| IPv4 unicast | **Next hop self** | Sets this router as next hop on routes sent to the peer (typical for iBGP). |
| | **Soft reconfiguration** | Keeps an unfiltered copy of received routes so inbound policy changes apply without a session reset. Costs memory. |
| | **Maximum prefix limit (in)** | If the peer sends more prefixes, FRR closes the session and keeps it down until it is cleared (**Hard Clear** in the summary). No warning-only or restart mode. Empty = no limit. |
| | **Maximum prefix limit (out)** | At most this many prefixes are advertised; the rest are not sent and the session stays up. Empty = no limit. |
| Route maps | **Route map in** / **Route map out** | Pick from the route maps on the Policies tab. |
| Prefix lists | **Prefix list in** / **Prefix list out** | Pick from the prefix lists on the Policies tab. |
| Timers | **Keepalive interval** / **Hold time** | Per-neighbour override (1–65535 / 3–65535), sent only when **both** are filled; otherwise the global timers apply. |
| Advanced | **Allow AS in** | 1–10: accept routes whose AS path already holds your AS that many times. |
| | **Weight** | 0–65535, preference for routes learned from this peer, on this router only: higher wins and is compared before any other attribute. Never advertised. Empty = 0. |
| | **Disable connected check** | Single-hop eBGP to a peer address that is not directly connected. |
| eBGP | **EBGP multihop** / **EBGP multihop TTL** | Allow an eBGP peer more than one hop away; TTL 1–255, empty = 255. |
| Graceful restart | **Enable graceful restart** / **Graceful restart helper mode** / **Disable graceful restart** | Per-neighbour GR mode; the three are mutually exclusive. |

:::note[BFD on the box]
BFD needs FRR's `bfdd` daemon. The Elchi OS image enables it. The client installer enables only `zebra` and `bgpd`, so on an installer-built host turn on `bfdd` in `/etc/frr/daemons` before using BFD. The BFD switch also needs an agent build that includes BFD support; no released agent has it yet (v1.7.7 and earlier do not).
:::

Removing a neighbour (delete icon, confirmed) removes it from FRR.

### Policies

The **Policies** tab has three lists — **Route maps**, **Community lists** and **Prefix lists** — each showing one row per sequence, with **Add**, edit, delete and **Remove selected**. Names are uppercase letters, digits, `_` and `-`; sequence numbers are 1–65535.

| Object | Fields |
| --- | --- |
| **Prefix list** | **Prefix list name**, **Sequence number**, **Action** (Permit/Deny), **Network prefix** (IPv4 CIDR), optional **ge** / **le** (0–32). |
| **Community list** | **Community list name**, **Sequence number**, **Type** (Standard/Expanded), **Action**, **Community values** (comma-separated, e.g. `65001:100, 65001:200`). |
| **Route map** | **Route map name**, **Sequence number**, **Action**; **Match conditions** (match type **Prefix list** or **Community list** plus the list to match); **Set actions**: **Set local preference**, **Set metric** (MED), **Set community**, **Set next hop**, and a **Description**. |

A prefix or community list that a route map uses cannot be deleted until it is removed from the route map. The agent also refuses to delete a route map, prefix list or community list that is still referenced in FRR's running configuration (by a neighbour, a `redistribute … route-map`, or a route map's `match`), and it rejects references to objects that do not exist. Both rules prevent a dangling reference that FRR would treat as deny-all. Deleting one sequence row removes only that sequence.

The built-in `ELCHI-VIP-ONLY` objects that the agent maintains are not shown here.

### Routes

The **Routes** tab has **Received routes** (with **Total routes**, **Total paths** and **Router ID**; columns **Network**, **Peer ID**, **Next hop**, **Origin**, **Weight**, **Paths**, **AS path**) and **Advertised routes** (columns **Network**, **Next hop**, **Origin**, **Weight**, **Valid**, **Neighbors**). Click a row to see every path and its details. **Refresh routes** reloads both lists.

### Logs

The **Logs** tab shows the FRR service's systemd journal (`frr`), newest first. You can search, filter by level (Info, Warning, Error, Debug, Trace, Critical) and choose how many lines to fetch (100 by default).

## How VIPs are announced

When **Advertise VIPs (redistribute connected)** is on, the agent configures `redistribute connected route-map ELCHI-VIP-ONLY`. `ELCHI-VIP-ONLY` is a built-in prefix list and route map that the agent creates itself:

- the prefix list permits only /32 host routes (`0.0.0.0/0 ge 32`);
- the route map has **one entry per VIP interface** (`match interface elchi-if-<port>` plus that prefix list).

So of everything "connected", only the /32 VIPs of the box's deployed listeners are announced — not NIC subnets, loopbacks, or a dummy interface someone added for another purpose. The agent keeps the entries in step with the `elchi-if-*` interfaces after every configuration save, deploy and undeploy, and on a periodic reconcile. Until the first VIP exists the route map has no entries, so nothing is advertised. Your own per-neighbour route maps and prefix lists apply on top of it.

On a BGP client, the VIP also follows the listener's health: the agent takes the address off — and BGP withdraws the route — while the listener is not ready, and puts it back once it is.

In an [HA pair](/ha-pairs/overview) where both members run BGP, this filter means **only the active member, which holds the VIPs, announces them**; the standby announces nothing. For failover timing with and without BFD, see [Deploying services to a pair → BGP](/ha-pairs/deploying-services#bgp).

## Related

- **[Clients](./clients.md)** — the client list, detail page and the command dispatch behind every network operation.
- **[Client installation](/installation/client/installation)** — installer flags, including `--enable-bgp`.
- **[Deploying services to a pair](/ha-pairs/deploying-services)** — VIP placement and BGP announcement on HA pairs.
