---
title: Extensions
description: How Elchi surfaces Envoy typed_config extensions — reusable, separately-managed configs referenced by other resources.
sidebar_position: 9
tags: [envoy, resources]
---

Envoy is built almost entirely out of **extensions**: pluggable implementations selected through a `typed_config` (an Envoy `@type` URL plus its fields). Access loggers, compression libraries, DNS resolvers, HTTP protocol options, health-check event sinks, resolver configs — these aren't part of a listener or cluster's core message, they're attached as typed extension configs. Elchi models the reusable ones as their own **Extensions** so you configure them once and reference them from many resources.

Some extensions are also delivered dynamically over the **Extension Config Discovery Service (ECDS)** — the same mechanism Elchi uses to hot-swap an HTTP filter's config (for example, the Shield ext_proc filter) without redeploying the whole listener.

## In Elchi

Extensions live under **Extensions** in the UI (`/extensions/...`). Each extension type has its own list and create flow; you pick an Envoy version first and edit a form generated from that version's protobuf for the extension's message. Types Elchi surfaces here include:

| Extension | Envoy category | Used by |
| --- | --- | --- |
| Access Log | `envoy.access_loggers` | Listeners / HCM access logging |
| Compressor Library | `envoy.compression.compressor` | The Compressor HTTP filter |
| DNS Resolver | `envoy.network.dns_resolver` | Clusters / dynamic forward proxy |
| HealthCheck Event File Sink | `envoy.health_check.event_sinks` | Cluster health-check event logging |
| HTTP Protocol Options | `envoy.upstreams.http.http_protocol_options` | Upstream codec selection on clusters |
| Cluster Dynamic Forward Proxy | `envoy.clusters` | On-demand DNS resolution clusters |

You author an extension as a named, reusable resource, then **reference it** from the resource that consumes it — an access-logger extension from a listener's `access_log`, a compressor library from the Compressor filter, HTTP protocol options from a cluster's `typed_extension_protocol_options`, and so on.

:::info[Extensions vs. filters]
[Filters](/envoy-configuration/resources/filters) are the units of the request/connection path. **Extensions** are the supporting typed configs those filters and core resources plug into — the shared building blocks, not the chain itself. Elchi keeps them separate so one extension config can be reused across many filters and resources.
:::

## Key fields

Like filters, every extension is a **name** plus a **typed_config** whose `@type` decides the applicable fields. Elchi's generated form edits those fields directly. What each extension exposes depends entirely on its type — an access logger configures a sink and format; a compressor library configures the algorithm and levels; HTTP protocol options select HTTP/1 vs HTTP/2 upstream behavior.

## Relationships

- **Referenced by listeners** — access-logger extensions provide a [Listener](/envoy-configuration/resources/listeners)'s access logging.
- **Referenced by clusters** — DNS resolver, HTTP protocol options, and health-check event sinks attach to a [Cluster](/envoy-configuration/resources/clusters).
- **Referenced by filters** — e.g. the Compressor [filter](/envoy-configuration/resources/filters) points at a compressor library extension.
- **Delivered over ECDS** — HTTP filter configs (including the Shield ext_proc filter) can be pushed dynamically; see [Shield: Envoy wiring](/shield/envoy-wiring).
- **Tracked as references** — Elchi records these `config_discovery`/`typed_config` links so publishing and the dependency graph resolve the full tree.

## Example

An HTTP protocol options extension pinning an upstream to HTTP/2, referenced from a cluster:

```yaml
# Extension: HTTP Protocol Options
name: h2_upstream
typed_config:
  "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
  explicit_http_config:
    http2_protocol_options: {}
---
# Cluster referencing it
name: grpc_backend
typed_extension_protocol_options:
  envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
    "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
    explicit_http_config:
      http2_protocol_options: {}
```

## Tips

- **Configure once, reference everywhere.** Extensions exist to avoid duplicating typed configs across resources.
- **Match the extension to its consumer's Envoy version.** A compressor library or access logger must be the same version as the resource that references it.
- **ECDS enables hot config swaps.** Dynamically-delivered extension configs update a filter's behavior without republishing the listener.
- **Check references before deleting.** An extension referenced by a live filter/cluster will show up in the dependency graph — removing it breaks those consumers.
