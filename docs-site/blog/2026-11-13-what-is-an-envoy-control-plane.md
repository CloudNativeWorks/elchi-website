---
slug: what-is-an-envoy-control-plane
title: "What Is an Envoy Control Plane? xDS Explained"
description: An Envoy control plane serves configuration over the xDS APIs. Learn LDS, RDS, CDS, EDS, SDS, ADS ordering, delta xDS, ACK/NACK and snapshot caches.
authors: [cnw]
tags: [envoy, xds]
date: 2026-11-13
---

An Envoy control plane is a gRPC server that tells Envoy proxies what to run: which listeners to open, how to route requests, which upstream clusters exist, which endpoints are behind them and which certificates to use. Envoy fetches all of this over a family of discovery APIs called **xDS** and applies each update without a restart. The proxy is the data plane; the server that answers its xDS requests is the control plane.

This post explains the xDS APIs, how Aggregated Discovery Service (ADS) orders updates, the difference between state-of-the-world and incremental (delta) xDS, how ACK and NACK work, and what a snapshot cache does. At the end we show where Elchi fits and which of these choices it makes.

<!-- truncate -->

## Static bootstrap vs dynamic configuration

Every Envoy starts from a bootstrap file. A bootstrap can hold the whole configuration under `static_resources`, which works until you need to change something: then you edit the file and restart or hot restart the process. The alternative is `dynamic_resources`, where the bootstrap only says where the management server is and which resource types to fetch from it. From then on, the management server owns the configuration and Envoy keeps a stream open to receive changes.

That management server is the control plane. It is not part of the request path; if it goes away, Envoy keeps serving with the last configuration it accepted.

## The xDS APIs

Each xDS API carries one resource type. The ones every Envoy operator meets are:

| API | Resource | What it holds |
|---|---|---|
| **LDS** (Listener Discovery Service) | `Listener` | Addresses and ports to bind, filter chains, network filters such as the HTTP connection manager or TCP proxy |
| **RDS** (Route Discovery Service) | `RouteConfiguration` | Virtual hosts and routes that the HTTP connection manager uses |
| **CDS** (Cluster Discovery Service) | `Cluster` | Upstream clusters: load balancing policy, timeouts, health checks, TLS to the upstream |
| **EDS** (Endpoint Discovery Service) | `ClusterLoadAssignment` | The endpoints (hosts, ports, weights, health) behind a cluster |
| **SDS** (Secret Discovery Service) | `Secret` | TLS certificates, private keys and validation contexts |

Two more appear in larger setups. **ECDS** (Extension Config Discovery Service) delivers the configuration of a single filter as a `TypedExtensionConfig`, so a filter inside a listener can be updated without resending the whole listener. **VHDS** (Virtual Host Discovery Service) delivers virtual hosts on demand instead of as part of a full route configuration.

The resources reference each other by name. A listener's HTTP connection manager names a route configuration, a route names a cluster, an EDS cluster names its endpoint assignment, and a TLS context names a secret. That reference graph is why the order of updates matters.

The authoritative description of the protocol is the [xDS REST and gRPC protocol](https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol) page in the Envoy documentation.

## Separate streams vs ADS

Envoy can fetch each resource type on its own gRPC stream, possibly from different management servers. That is simple but gives no ordering guarantee between types. If a new route arrives before the cluster it points at, requests that hit that route fail until the cluster shows up.

**ADS (Aggregated Discovery Service)** puts all resource types on a single gRPC stream to a single management server. Because one server sequences everything on one stream, it can apply the ordering the Envoy documentation recommends to avoid dropping traffic during a change:

1. CDS updates first.
2. EDS updates for those clusters after CDS.
3. LDS updates after the clusters and endpoints they need.
4. RDS updates for new listeners after LDS.
5. Only then remove clusters and endpoints that nothing references any more.

This is "make before break": a resource is only referenced once what it depends on is in place, and nothing is removed while it is still referenced.

## State of the world vs incremental (delta) xDS

xDS exists in two flavours, and each works with separate streams or ADS, which gives four variants.

**State of the world (SotW)** uses `DiscoveryRequest` and `DiscoveryResponse`. For listeners and clusters, every response must carry the complete set of resources the client needs, even the ones that did not change. If a listener is missing from an LDS response, Envoy removes it. With hundreds of listeners or thousands of clusters, one small change means resending all of them.

**Incremental, or delta, xDS** uses `DeltaDiscoveryRequest` and `DeltaDiscoveryResponse`. The client subscribes and unsubscribes to resource names (`resource_names_subscribe`, `resource_names_unsubscribe`), the server sends only resources that were added or changed, and it lists removed ones explicitly in `removed_resources`. Each resource carries its own version. On reconnect, the client reports the versions it already has in `initial_resource_versions`, so the server does not have to resend unchanged resources.

The choice is made in the bootstrap: `api_type: GRPC` for SotW and `api_type: DELTA_GRPC` for delta, both under `ads_config` when ADS is used.

## ACK and NACK

xDS is not fire-and-forget. Every response from the server carries a `nonce`, and Envoy answers each one with a new request on the same stream:

- **ACK**: Envoy applied the update. In SotW, the request carries the `version_info` of the accepted response and its `response_nonce`.
- **NACK**: Envoy rejected the update, for example because a listener failed validation. The request carries the `response_nonce` of the rejected response, an `error_detail` with the reason, and, in SotW, the `version_info` of the last version it did accept. Envoy keeps running the previous configuration.

Delta requests carry no `version_info` at all; ACK and NACK are told apart by whether `error_detail` is set, and the nonce says which response it answers.

For an operator this is the most useful signal a control plane has. A NACK is the only place where "the proxy refused this configuration, and here is why" shows up. A control plane that does not record NACKs leaves you comparing what you pushed with what `/config_dump` shows.

## Snapshot caches and go-control-plane

Most control planes are not written from scratch. [envoyproxy/go-control-plane](https://github.com/envoyproxy/go-control-plane) is the reference Go implementation: it ships the generated Go types for the Envoy API, a gRPC server for every xDS variant, and caches that the server reads from.

The most common cache is the **snapshot cache**. The control plane builds a snapshot, a consistent set of listeners, routes, clusters, endpoints, secrets and other resources for one node, and stores it under a key derived from the Envoy node (the `NodeHash`). The server streams that snapshot to every Envoy that maps to the key, answers ACKs and NACKs, and sends a new update whenever the control plane sets a new snapshot. The cache is created with an `ads` flag; when it is set, the cache waits until a request has named all the resources it wants before it responds, which suits ADS clients.

That leaves the hard part to you: turning your own data model into correct Envoy resources, deciding which node gets which snapshot, and keeping references between resources consistent.

## Where Elchi fits

Elchi is a control plane for Envoy fleets with a UI and an API in front of it. Here is how it answers each of the choices above, with the code behind it in the `elchi-backend` and `elchi-client` repositories.

**ADS over delta xDS.** The bootstrap Elchi generates for a deployed listener fetches LDS and CDS through ADS and sets `api_type: DELTA_GRPC` with transport API v3. The other resource types follow from there: route configurations, endpoints, secrets and HTTP filter configurations are referenced from listeners and clusters and fetched over the same aggregated stream. HTTP filters inside the HTTP connection manager are stored as ECDS `config_discovery` references, not inline configuration, so a filter can change without rewriting the listener. The control plane also serves VHDS.

**A snapshot cache keyed by node ID.** The control-plane process builds a go-control-plane snapshot cache with ADS enabled and keys it by the Envoy node ID. Every deployed listener has its own node ID in the form `listener::project::ip`, so each listener gets its own snapshot. The xDS server listens on port 18000 behind the platform's front door. See [Architecture](/getting-started/architecture) for the full wiring.

**NACKs are recorded, not just logged.** When a delta request carries `error_detail`, the control plane stores the error per proxy together with the revision it rejected, and the UI shows it on the service. An ACK records which revision the proxy now runs. One detail we document because it surprises people: the delta server does not resend a resource that was NACKed until its content changes, so the fix is to correct the resource and publish again.

**One control plane per Envoy version.** Envoy's API changes between releases: fields are added, deprecated and removed. A control plane compiled against one release's protobuf definitions can produce configuration that an older proxy does not understand. Elchi builds against `versioned-go-control-plane`, our fork of go-control-plane with one module version per Envoy release, and the release pipeline produces one control-plane binary per supported Envoy version. Each Envoy sends its node ID and an `envoy-version` header on its ADS stream. The registry, which runs as an `ext_proc` filter on the platform's front door, reads both and routes the stream to the control plane built for that version. This is what lets several Envoy versions run side by side in one project; [Run several Envoy versions side by side](/guides/run-multiple-envoy-versions) explains the setup and the listener upgrade.

**What you edit.** Each resource form in the UI is generated from the protobuf schema of the Envoy version it targets, and Elchi assembles the references (ECDS pointers, SDS secrets, EDS assignments) for you. You never write the snapshot by hand. You can still check what a node is served in the [snapshot dump](/envoy-configuration/snapshot-dump).

## Next steps

- Read the [Architecture](/getting-started/architecture) page for every process and connection in an Elchi installation.
- Follow [Manage Envoy without YAML](/guides/manage-envoy-without-yaml) to build a listener, route and cluster from the UI.
- See [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) and [Run several Envoy versions side by side](/guides/run-multiple-envoy-versions) for version routing.
- Learn more about [Elchi Core](https://www.elchi.io/products/core.html), or [book a demo](https://www.elchi.io/contact.html).
