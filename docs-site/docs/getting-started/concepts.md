---
title: Core Concepts
description: How Elchi splits responsibilities across its three cooperating processes and the client agent, and how a configuration change flows through them.
sidebar_position: 3
---

Elchi splits responsibilities across three cooperating processes. Understanding what each one owns makes the rest of the docs much easier to follow.

- **Registry** (`:9090`) — Service discovery hub. Tracks controllers and control-planes, routes requests to the right control-plane version.
- **Controller** (REST) — Management plane. Owns xDS resources, users, RBAC, MongoDB persistence, and AI analysis.
- **Control-Plane** (`:18000`) — gRPC xDS server. Streams ADS / VHDS configurations to Envoy with snapshot caching.
- **Client Agent** (Go) — Lightweight host agent. Registers Envoy proxies, exports logs to Syslog/ELK, manages BGP.

Day-to-day, the configuration loop looks like this:

1. You make a change in the UI — say, add a new `Cluster`.
2. The controller validates the change against Envoy's protobuf schemas, persists it to MongoDB, and pushes a snapshot to the control-plane.
3. The control-plane's gRPC stream notifies every connected Envoy, which applies the new config without a restart.

For the full picture — every process, the edge node, and how each wire connects (ports, protocols, auth, and data flows) — see **[Architecture](/getting-started/architecture)**.
