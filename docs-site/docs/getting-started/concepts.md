---
title: "Elchi Core Concepts: Processes, Agent, Config Flow"
sidebar_label: Core Concepts
description: "How Elchi splits work across the registry, controller and control plane plus the edge agent, and how a configuration change flows to Envoy."
sidebar_position: 3
---

# Core Concepts

Elchi splits responsibilities across three cooperating processes. Understanding what each one owns makes the rest of the docs much easier to follow.

## The three backend processes and the agent

- **Registry** (`:9090`) — Service discovery hub. Tracks controllers and control-planes, routes requests to the right control-plane version.
- **Controller** (REST) — Management plane. Owns xDS resources, users, RBAC, MongoDB persistence, and AI analysis.
- **Control-Plane** (`:18000`) — gRPC xDS server. Streams ADS / VHDS configurations to Envoy with snapshot caching.
- **Client Agent** — Lightweight host agent. Registers Envoy proxies, exports logs to Syslog/ELK, manages BGP. On Elchi OS appliances it also runs `elchi-ha`, which lets two boxes share VIPs as an [HA pair](/ha-pairs/overview).

## How a configuration change reaches Envoy

Day-to-day, the configuration loop looks like this:

1. You make a change in the UI — say, add a new `Cluster`.
2. The controller validates the change against Envoy's protobuf schemas, persists it to MongoDB, and pushes a snapshot to the control-plane.
3. The control-plane's gRPC stream notifies every connected Envoy, which applies the new config without a restart.

## Key terms

- **Project** — the unit of isolation. Resources and API tokens belong to a project, and users are attached to projects as members; each user has one role (Owner, Admin, Editor or Viewer). See [Authentication & Access](/administration/auth-and-access).
- **Resource** — one Envoy configuration object (listener, route, cluster, endpoints, secret, filter, bootstrap), edited in a form generated from the protobuf definitions of a specific Envoy version. See [Resources & the Config Model](/envoy-configuration/config-model).
- **Envoy version** — every resource belongs to one Envoy version, and each configured version has its own control-plane variant, so proxies on different versions are served side by side. See [Versions & Upgrades](/envoy-configuration/versions-and-upgrades).
- **Save and publish** — a save stores a draft; a publish validates the change and pushes a new snapshot that connected proxies apply live. The [Snapshot Dump](/envoy-configuration/snapshot-dump) shows exactly what a proxy is served.
- **Client and service** — a client is a host running the agent; a service is a deployed listener running there as its own Envoy process. See [Services](/operations/services) and [Clients](/operations/clients).

## Where to go next

For the full picture — every process, the edge node, and how each wire connects (ports, protocols, auth, and data flows) — see **[Architecture](/getting-started/architecture)**.
