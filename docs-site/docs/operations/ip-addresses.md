---
title: IP Addresses
description: Track a project's public and private IP blocks, ranges and single addresses, see which addresses its services hold and which are free, and pick a free one when deploying a service.
sidebar_position: 2.7
tags: [operations]
---

**IP Addresses** (**Operations → IP Addresses**, `/ip-addresses`) keeps the IP blocks, ranges and single addresses a project deploys its services on. For each one it shows which addresses are in use, by which service on which clients, and which are free. When you deploy a service, the address field offers the free ones.

It only tracks addresses. Adding, editing or removing a block changes nothing on the clients or in the proxies.

## What counts as in use

elchi does not record usage separately; it reads it every time from the deploys themselves:

- **In use**: a service is deployed at the address. This is the **downstream address** given at deploy, which the client puts on its own interface and the listener binds to. An HA pair's **VIP** is one of these.
- **Deploying**: a deploy at the address has started and has not finished yet.

These are the same records the deploy guard reads when it refuses to put two services on one address. So the page cannot drift from what is actually deployed: an undeploy frees the address at once.

A service deployed without an address (on the client's own address) holds no address of a block. Upstream endpoints, GSLB answers and client NIC addresses are not counted.

## Blocks, ranges and single addresses

**Add IPs** adds one of:

- a **block**, written as a CIDR (`10.20.0.0/24`), from a `/16` down;
- a **range**, written first-last (`192.168.1.10-192.168.1.20`), of up to 65 536 addresses, shown with a **range** tag; or
- a **single address** (`203.0.113.7`), shown as the address with a **single address** tag.

Every address of a range is usable, also one ending in `.0` or `.255`. A block leaves out its network and broadcast addresses (except a `/31` or `/32`): they are not counted as free and never offered. If a service is deployed on one of them anyway (a routed block's VIP), it is counted as in use and listed.

IPv4 only, because a deploy address is IPv4. Two blocks or ranges of a project cannot overlap, also when two are added at the same moment. A block is written from its first address: `10.0.0.5/24` is refused with a hint, since it could mean the block `10.0.0.0/24` or the one address `10.0.0.5`. Ranges no service can be deployed on are refused: `0.0.0.0/8`, loopback `127.0.0.0/8`, multicast `224.0.0.0/4` and `240.0.0.0/4` with the broadcast address.

**Public** or **private** is told from the addresses: RFC 1918, the shared `100.64.0.0/10` space and link-local addresses are private.

Each one has an optional **name** and **description**. The edit button changes those two; the addresses cannot change. To change a range, remove it and add it again.

Removing a block or address only stops tracking it. Addresses in use stay in use; they move to **In use outside your blocks**.

## The list

| Column | Meaning |
| --- | --- |
| **Block or address** | The CIDR, the range or the address, its public/private tag, and its name. |
| **Addresses** | How the usable addresses split: in use, deploying, reserved and free. A single address shows its state. |
| **Description** | Its description. |

Open a row to list its addresses. Filter them by **In use**, **Deploying**, **Reserved** or **Free**, or search by a part of an address, a service name or a client name. An address in use shows the service (a link to it), its Envoy version and the clients that run it, or the HA pair. **Held by two services** marks an address two services hold, which the deploy guard should have refused.

**In use outside your blocks** lists the addresses services are deployed on that no block of the project contains, the first 1000 of them (the page says how many there are). Add a block for them to track them.

## Reservations

Open a block and click **Reserve** on a free address to keep it out of use, with an optional note (a gateway, a firewall). A reserved address is not counted as free and is never offered at deploy. **Release** gives it back. An address in use cannot be reserved.

## When deploying

In **Manage service → Deploy** ([Services](./services.md)), the downstream address field lists the free addresses of the project's blocks that start with what you typed, from every block, each with its block and public/private tag. Left out:
- addresses in use, being deployed or reserved;
- addresses already typed on another row of the dialog;
- for an HA pair, VIPs the pair cannot take (off the members' subnets without BGP or a next-hop);
- for an OpenStack client in **fixed** mode, addresses outside the selected interface's subnets.

You can still type any other address; the list is a suggestion, not a limit. A project with no free block address keeps a plain field. The list is read again after every deploy.

## Who can do what

Everyone with access to the project sees the page. A service is named only to those who may see it in the services list: owners and admins, and the users or groups its permissions name. To anyone else its address shows as **a service you cannot see**, still counted as in use and never offered. Owners, admins and editors add, edit and remove blocks and reserve addresses; every change is in the audit log (**Administration → Audit**: `IP_BLOCK_CREATE`, `IP_BLOCK_UPDATE`, `IP_BLOCK_DELETE`, `IP_RESERVE`, `IP_UNRESERVE`).
