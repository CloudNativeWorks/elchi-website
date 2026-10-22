---
title: Edge Network Topologies
description: How an edge host routes with one, two or three NICs — where listener VIPs live, which NIC the downstream replies and the upstream connections leave through, how to move the default route to a data NIC without losing management, when a policy rule is needed, and the internet-facing case with BGP towards the provider.
sidebar_position: 4.5
tags: [operations, elchi-os, networking]
---

This page is the recipe book for the **host networking of an edge node** (an [Elchi OS appliance](/elchi-os/overview) or a plain Linux host running `elchi-client`): which NIC carries what, and exactly what to configure — on the console and on the client's [Network tab](./network-and-bgp.md) — for the common one-, two- and three-NIC layouts. It assumes you know the Network tab's sub-tabs (**Route**, **Routing policy**, **Routing tables**, **BGP**); this page only tells you what to put in them.

## How the host routes — four facts

Everything below follows from four things the agent and the OS do:

1. **A listener's address is a `/32` on a dummy interface, not an address on a NIC.** Every deployed listener gets `elchi-if-<port>` with its downstream address (its VIP on an HA pair). Linux answers ARP for that address on the NIC whose subnet contains it (`arp_ignore=0`, see [kernel settings](/elchi-os/security-and-networking#kernel-settings)), so **a VIP is reachable through the NIC that carries its subnet** — give listeners addresses from the subnet of the NIC you want them served on. On an HA pair the gratuitous ARP for a VIP is sent on that same NIC; a VIP that is in no NIC's subnet is not announced by ARP at all (it is a *routed* VIP — BGP announces it, see [below](#scenario-4--three-nics-internet-facing-default-route-and-bgp-towards-the-provider)).
2. **Routing is by destination, from the main table, and the main table has one default route.** Where a packet *leaves* is decided by the route to its destination — not by the NIC it came in on. Replies to a client, upstream connections from Envoy, the agent's connection to the controller, shield's audit sink: all of them follow the main table, and anything without a more specific route takes the default. Envoy picks the source address of an upstream connection from that route too (the NIC's own address), so you rarely need a bind address on the cluster.
3. **On Elchi OS, management protects itself as soon as a data interface exists.** The console renders a source rule `from <management-ip>/32 lookup 1000` (table `elchi-mgmt`, with the management prefix on-link and the management default route). Anything that *arrives at the management address* — SSH, the UI's commands, the HA heartbeat — is answered through the management gateway whatever the main table says. This is what lets you move the main default route to a data NIC without cutting your own session. The rule is IPv4 only, and it does **not** choose the path of a **new outbound** connection the box opens (the agent to the controller, shield to ClickHouse, NTP, the archive): those take the main table. A plain Linux edge has no such rule; [add it from the UI](#the-management-rule-on-a-plain-linux-edge).
4. **Who configures what.** On Elchi OS the console owns every NIC's identity and addresses (`set interface …`, [console reference](/elchi-os/console#interfaces-and-bonds)) and **a data interface carries no gateway**; routing tables, policy rules and BGP come from the UI, and routes from the UI or — for what the appliance needs before it reaches the UI, or must keep whatever the UI does — from the console (`set route …`, Elchi OS 0.7.3, [Routes](/elchi-os/console#routes)). On a plain Linux host the UI's netplan editor owns the interfaces as well.

A **policy rule** (`from <source> lookup <table>`) is only needed when the *same* destination must leave through *different* NICs depending on who is talking — typically "replies from the listener subnet go out the downstream NIC while everything else uses another default". Destination routes cover every other case.

## Scenario 1 — one NIC

Nothing to configure. Management, listeners (addresses from the NIC's subnet) and upstream traffic share the NIC and its default route. This is the single-node layout; for the interface requirements of an HA pair see [HA Pairs → Setup](/ha-pairs/setup).

## Scenario 2 — two NICs: management + data (single node or HA pair)

Goal: **all downstream traffic (the listeners/VIPs) and all upstream traffic use the data NIC; the management NIC carries only what is addressed to it.**

1. **Console (Elchi OS):** give the data NIC its address — `set interface <nic> static <ip/cidr>`, then `apply` and `network confirm`. The management-protection rule appears with it. *(Plain Linux: address the NIC in the UI's netplan editor.)*
2. **Deploy listeners with addresses from the data subnet.** Replies to on-link clients then leave the data NIC by their connected route; the rest follows the default route, which the next step moves.
3. **UI → Network → Route — but first, the control plane.** If the controller (and the archive, NTP, DNS, shield's ClickHouse) is reached through the *management* gateway, add that route now: **Destination** `<controller IP or subnet>`, **Gateway** `<management gateway>`, **Interface** the management NIC, table empty (main). Do this *before* moving the default: once the default has moved, a new agent connection would leave through the data side, and if that path cannot reach the controller the agent goes dark. On Elchi OS the same route can be a console route instead (`set route <controller-ip>/32 via <management gateway>`), which the UI cannot remove by mistake. A newer agent rolls back a route or rule after which a new connection to the controller fails — moving the default without this route is refused that way when the data side cannot reach the controller (see [below](#when-a-route-cuts-the-agent-off)); `network routes reset` on the console is the way back otherwise.
4. **UI → Network → Route:** add **Destination** `0.0.0.0/0`, **Gateway** `<data gateway>`, **Interface** the data NIC, table empty. The UI replaces the main table's default route (the console's management default survives in table 1000, so nothing is lost). From now on upstream connections, internet-bound replies and every other new connection leave the data NIC.
5. **Verify:** the Route sub-tab's **System routes** group shows `default via <data gateway>` on the data NIC; your SSH/UI session is still alive (it rides table 1000); a request to a listener answers; an upstream behind the data gateway answers through the proxy.

**Undo:** add the management default back first — **Destination** `0.0.0.0/0`, **Gateway** `<management gateway>`, management NIC — then delete the data default. Deleting the data default alone leaves the main table without a default (management sessions still work through table 1000; new connections do not).

**Closed networks:** if both your clients and your upstreams are known subnets, you can leave the default on management and add only `<client subnets>` and `<upstream subnets>` via the data gateway. Internet clients make that impossible — their replies would leave through the management NIC — so move the default as above.

**HA pair:** configure both members identically; VIPs from the data subnet; the pair's heartbeat and fence probes use the management side. See [Deploying services to a pair](/ha-pairs/deploying-services).

## Scenario 3 — three NICs: management + downstream + upstream

Goal: **listeners/VIPs on the downstream NIC, their traffic in and out through it; the backends reached through the upstream NIC; management untouched.**

1. **Console:** address both data NICs (`set interface <nic> static …`, `apply`, `network confirm`).
2. **Listeners:** addresses/VIPs from the **downstream** subnet.
3. **Upstream path (UI → Route, main table):** one route per backend subnet — **Destination** `<backend subnet>`, **Gateway** `<upstream gateway>`, **Interface** the upstream NIC. If the backends are "everywhere", make the upstream gateway the default instead (`0.0.0.0/0` via the upstream gateway, with the control-plane route via management added first, as in scenario 2).
4. **Downstream replies.** Clients *inside* the downstream subnet need nothing — the connected route answers them on the downstream NIC. Clients *beyond* the downstream router (other sites, the internet) would otherwise be answered along the main default (the upstream NIC in step 3's second form): add **one** policy rule for the whole listener subnet, so every VIP is covered without a rule per listener:
   - **Routing tables:** add a table, e.g. ID `200`, name `downstream`.
   - **Route:** **Destination** `0.0.0.0/0`, **Gateway** `<downstream gateway>`, **Interface** the downstream NIC, **Table** `200`.
   - **Routing policy:** **From** `<downstream subnet>` (the subnet the VIPs are taken from), **Table** `200`, a priority in the UI's range.
   Now a reply *sourced from a VIP* looks up table 200 and leaves the downstream NIC; an upstream connection (sourced from the upstream NIC's address) does not match the rule and keeps the main table.
5. **Management:** unchanged (table 1000). Add the controller route via the management gateway if the controller lives behind it.

Envoy's upstream connections take the upstream NIC's address as source because the route to the backend points there; set **Upstream bind config** on a cluster only when that NIC has several addresses and a specific one must be used.

## Scenario 4 — three NICs, internet-facing: default route and BGP towards the provider

Goal: **requests come from the internet through the downstream NIC, which peers with the provider's switch over BGP; the default route is there; backends and internal services are on the upstream NIC; management stays on its own NIC.**

1. **Console:** address the data NICs as above. The downstream NIC's address is the one that peers with the provider.
2. **UI → Network → BGP:** configure the speaker (router ID, AS, the provider's neighbour on the downstream NIC's address, BFD if the provider supports it) and switch on **Advertise VIPs**. The box then announces only its listeners' `/32` VIPs, and only while each listener is healthy; on an HA pair only the active member announces (see [How VIPs are announced](./network-and-bgp.md#how-vips-are-announced)). VIPs announced this way may be addresses the provider routes to you — they do not have to be in the downstream NIC's subnet.
3. **Default route:** either accept it from the provider over BGP, or add it statically — **Destination** `0.0.0.0/0`, **Gateway** `<provider next hop>`, **Interface** the downstream NIC. Add the controller route via the management gateway first if the controller is reached that way.
4. **Internal destinations:** plain destination routes, no policy rule — **Destination** `<internal subnet>`, **Gateway** `<upstream gateway>`, **Interface** the upstream NIC, one per internal subnet (backends, the control plane if it is internal). Since internet replies already follow the default on the downstream NIC and internal subnets are specific prefixes, nothing here needs source-based routing.
5. **HA pair:** both members peer with the provider; the VIP follows the active member and the listener's health, so the provider's routing converges on failover (BFD makes that about a second). The fence probe targets the default gateway — here the provider's next hop — which must be reachable on the downstream NIC's L2.

## Control plane reachable only through a data NIC

Goal: **register an appliance whose controller sits beyond the data NIC's router** — the management network reaches the box (SSH, the console) but not the control plane. The UI cannot add the route the registration needs, because it reaches the box through that registration. On Elchi OS 0.7.3 the console can:

1. **Console:** address the data NIC — `set interface <nic> static <ip/cidr>`.
2. **Console:** `set route <controller-ip>/32 via <data gateway>` — the device is the one whose subnet holds the gateway; `show pending` names it. A whole controller subnet works the same way.
3. `apply`, then `network confirm` within 120 seconds.
4. **Check before registering:** `diagnose route <controller-ip>` must say *Leaves: `<data NIC>`, via `<data gateway>`, source `<data address>`*.
5. **Register:** `set controller …`, `set token`, `apply`. The agent's connection is a new outbound connection, so it takes this route and the data address; the management source rule (table 1000) does not apply to it.

The route lives in the OS's own file (`52-elchi-routes.yaml`), is backed up by the confirm window and carried by upgrades and `config export`, and shows as owner `os` in `show routes`. Remove it with `set route <controller-ip>/32 remove`.

## When a route cuts the agent off

A UI route or policy rule that takes the agent's own path to the controller away cannot be undone from the UI — the UI's command would travel that path. Two safeguards:

- **The agent rolls it back** (elchi-client after v2.1.0). Every route and policy operation, and every table delete, is applied and then verified: the agent's session (a gRPC ping) and a **new** connection to the controller (a TCP connection made the way a reconnect makes it) must still work if they worked before. The second check is what catches the common case: with the main default moved to a data NIC and no route to the controller, the session survives (the management rule carries it) but the next reconnect — a controller restart, an agent restart — would leave through the data side and never arrive. If the change breaks either within 12 seconds, exactly what it changed is undone, the agent's route/policy files keep their previous content, and the UI shows *rolled back*. A rule placed ahead of the management rule (priorities below 1000) can cut even sessions that arrive at the management address.
- **`network routes reset` on the Elchi OS console** removes every route and policy rule the UI set — files and kernel — re-applies the OS's own network configuration and restarts a disconnected agent. The removed files are kept under `/var/lib/elchi/ui-routes-reset/`. The control plane keeps no copy of the UI's network settings, so nothing re-applies them: add back what was right from the UI once the agent is connected.

`show routes` and `show rules` list what is in force with its owner, and `diagnose route <ip> [from <source>]` shows which rule and which route a packet takes — use them before and after.

## The management rule on a plain Linux edge

An Ubuntu host installed with `elchi-install.sh` has no management-protection rule. Before moving its default route to a data NIC, build the equivalent from the UI, in this order:

1. **Routing tables:** add table `100`, name `mgmt`.
2. **Route:** **Destination** `0.0.0.0/0`, **Gateway** `<management gateway>`, **Interface** the management NIC, **Table** `100`.
3. **Route:** **Destination** `<management subnet>`, no gateway (direct), **Interface** the management NIC, **Table** `100` — the on-link prefix, so replies to neighbours on the management segment do not go to the gateway.
4. **Routing policy:** **From** `<management IP>/32`, **Table** `100`.

Then proceed as in scenario 2 or 3. The UI's tables are IDs 100–999 (253–255 are the kernel's); table 1000 is the appliance's own and is refused.

## Limits to keep in mind

- **One default route.** Everything that is not covered by a more specific route or a policy rule leaves through it. "Traffic goes back out the NIC it came in on" is not automatic — it is either a connected route (the client is on that subnet), a destination route, or a source rule as in scenario 3.
- **New outbound connections ignore the management rule.** Add routes for the controller, the archive, NTP/DNS and shield's sinks via the management gateway when they are only reachable there.
- **The console gives data interfaces no gateway**; a route that needs one is a console route (`set route`, tables `main` and `elchi-mgmt` only) or the UI's. Tables, policy rules and BGP are the UI's. The UI refuses tables ≥ 1000 (the OS's); the console refuses the UI's tables 100–999 and a route the UI already defines.
- **IPv4 only** for the management rule; IPv6 on data interfaces is addressing only.
- **Policy rules are per host.** On an HA pair, configure both members; the VIP moves, the rules do not.
- **Firewall:** on Elchi OS the host firewall filters only traffic to the management addresses; listener VIPs on data NICs are never filtered by it (see [Security & Networking](/elchi-os/security-and-networking#host-firewall)).

## Related

- **[Client Network & BGP](./network-and-bgp.md)** — the Network tab: routes, routing policies, routing tables and the BGP speaker, field by field.
- **[Elchi OS console reference](/elchi-os/console#interfaces-and-bonds)** — `set interface`, bonds and VLANs, and the confirm window.
- **[Deploying services to a pair](/ha-pairs/deploying-services)** — VIP placement, GARP and BGP announcement on HA pairs.
- **[Network & External Access](/getting-started/network-access)** — the firewall checklist for every component.
