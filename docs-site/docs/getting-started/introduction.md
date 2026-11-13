---
title: "What Is Elchi? Envoy Control Plane Introduction"
sidebar_label: Introduction
description: "Elchi is a visual control plane for Envoy proxy fleets: typed config validated and pushed over xDS, edge agents on VMs, WAF, API discovery and GSLB."
sidebar_position: 1
---

# Introduction to Elchi

![From a client connection to live Envoy config](/img/docs/flow.png)

**Elchi is a visual control plane for Envoy proxy fleets.** You build every Envoy resource (listeners, routes, clusters, endpoints, secrets, filters) in forms generated from Envoy's own protobuf definitions; Elchi validates each change, stores it, and pushes it to running proxies over xDS, which apply it without a restart. It is built by CloudNativeWorks.

## What it replaces

Without a control plane, an Envoy fleet is run from hand-written YAML bootstraps or a home-grown xDS server. Both break the same way: a cluster renamed in one file but not in the route that references it, a field that exists in one Envoy release but not the next, a reload that nobody can roll back. Elchi keeps the references between resources in one model, validates against the API of the exact Envoy version each proxy runs, and records every publish.

## The components

- **Central platform** (`elchi-backend`): the **controller** (REST API, UI backend, users and RBAC), the **control plane** (the gRPC xDS server on `:18000`, one variant per configured Envoy version) and the **registry** (routes each proxy and request to the control plane for its Envoy version). MongoDB is the system of record, ClickHouse stores API events and security audit, and VictoriaMetrics holds metrics.
- **Edge node**: Envoy plus **elchi-client**, an agent that dials out to the controller, runs each deployed listener as a systemd service and hot-restarts it on upgrade. **Shield** (`elchi-shield`) is an optional `ext_proc` sidecar for API security: a WAF with the OWASP Core Rule Set, authentication, rate limiting and DLP.
- **API Discovery**: `elchi-collector` reads Envoy access logs (ALS) and builds a risk-scored inventory of every API you serve.
- **GSLB**: health-checked DNS that answers only with healthy edge IPs.

## How to install it

The platform runs on Kubernetes with Helm, on Docker Swarm, on a single VM with kind, or on plain VMs with systemd and no containers. Edges are Linux hosts running the client, or [Elchi OS](/elchi-os/overview) appliances with the agent and Shield built in.

## Who it is for

Platform and network teams that run Envoy as an edge proxy or API gateway, often on VMs and bare metal rather than inside a service mesh, and want one place to configure, upgrade and secure the fleet.

## Where to go next

- **[Quick Start](/getting-started/quickstart)**: Elchi running on a Kubernetes cluster with Helm.
- **[Install the Platform](/installation/helm-platform/installation)**: the full Helm install of controller, control plane, registry, MongoDB, ClickHouse and VictoriaMetrics.
- **[Set up the Client](/installation/client/overview)**: install the agent on Linux hosts and register their Envoy proxies.
- **[Endpoint Discovery](/installation/discovery-agent/overview)**: keep Envoy endpoints filled with the node IPs of your Kubernetes clusters.
- **[Core Concepts](/getting-started/concepts)** and **[Architecture](/getting-started/architecture)**: how the pieces connect.
