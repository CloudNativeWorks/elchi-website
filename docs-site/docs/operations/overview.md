---
title: Fleet Operations
description: The management console for a running Elchi fleet — deployed Envoy services, connected edge clients, and how the controller drives them.
sidebar_position: 1
tags: [operations]
---

Fleet Operations is the console for the fleet you have already installed. Once the [Elchi Client](/installation/client/overview) is running on an edge host and has [registered with the control plane](/installation/client/installation), that host shows up here — and everything you deploy to it, every command you send it, and every Envoy it runs is managed from these two views:

- **Services** — the Envoy deployments. A service is a named Envoy configuration (a bootstrap plus its xDS resources) and the set of clients it is deployed to. This is where you see deployment status, drill into a running Envoy, inspect configuration errors, and recover GSLB records.
- **Clients** — the edge agent nodes. Each connected `elchi-client` is a row here. This is where you send remote lifecycle commands (deploy, restart, network, shield, and more), read host statistics and logs, and — on cloud hosts — look up interfaces and available IPs.

:::note Where installation ends and operations begins
[Installation](/installation/client/overview) covers getting the agent onto a host and connected. **Operations covers everything after that** — using the connected fleet. If a host is not appearing under Clients, that is an installation/connectivity problem; start with the [client installation guide](/installation/client/installation).
:::

## Services vs. Clients vs. the Registry

These three concepts are easy to conflate. They are distinct:

| Concept | What it is | Where it lives |
| --- | --- | --- |
| **Service** | A named Envoy deployment (config + the clients it targets) | `/services` list, `/services/:id` detail |
| **Client** | A connected edge node running the `elchi-client` agent next to Envoy | `/clients` list, `/clients/:id` detail |
| **Registry** | The control-plane component that tracks which controller each client is connected to, so commands reach clients across a multi-controller (HA) deployment | Backend service discovery — see [Registry & HA](/administration/registry-and-ha) |

A single service is typically deployed to **several** clients (an Envoy fleet serving one config). A single client can host **several** services. The Registry is the glue that lets one controller send a command to a client that is actually connected to a *different* controller.

## Two paths from the controller to the edge

Elchi drives the edge over two separate channels. Understanding which is which explains why some changes appear instantly and others are explicit actions.

### 1. The command stream (lifecycle)

Every connected `elchi-client` holds a persistent bidirectional gRPC stream to a controller (the `CommandService` stream it opens after registering). Fleet Operations pushes **commands** down this stream — deploy, restart, fetch logs, apply network config, sync shield policy, and so on. This is the channel behind the [Clients](./clients.md) command dispatch and the [Services](./services.md) deploy/lifecycle actions.

When you trigger a command, the controller:

1. **Authorizes** it against your role and the specific command type, service, project and version.
2. **Selects a processor** for the command type, which validates your payload and turns it into a protobuf message.
3. **Fans out** to the target clients (in parallel, capped at a small worker pool, with per-client serialization so two sends never race on one stream).
4. For each client, sends directly if that client is connected to *this* controller; otherwise asks the **Registry** which controller owns the client and **forwards** the request there over HTTP. That controller sends it down its own stream.
5. **Collects** each client's response and returns them together. Command dispatch supports **partial success** — one unreachable client does not fail the others.

Because the stream is persistent, a client that was offline when something changed is reconciled on reconnect (for example, shield configuration is re-pushed to a client the moment it reconnects).

### 2. The xDS snapshot path (Envoy configuration)

Envoy itself is configured over ADS/xDS by the control plane, not by discrete commands. When an Envoy resource changes, the controller walks the dependency graph to the affected listener and **pokes** the control plane to rebuild that node's snapshot; Envoy pulls the update over its existing xDS stream. This is why editing a route or cluster propagates without a per-client "push" command — the config path is continuous, the command path is discrete.

:::tip
Rule of thumb: if it changes **what Envoy is configured to do**, it rides the xDS path. If it changes **the host or the Envoy process** (deploy it, restart it, read its logs, apply networking, sync a shield policy), it is a command on the stream — and you drive it from [Clients](./clients.md) or [Services](./services.md).
:::

## Where to go next

- **[Services](./services.md)** — the deployed Envoy view: status, envoy details, and GSLB recovery.
- **[Clients](./clients.md)** — the edge-node view: remote commands and cloud interface/IP lookups.
- **[Registry & HA](/administration/registry-and-ha)** — how command routing survives multiple controllers.
- **[Shield deployment](/shield/deployment)** — how shield policies reach the edge (a command on the stream).
