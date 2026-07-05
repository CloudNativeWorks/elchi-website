---
title: Listeners
description: How Elchi models Envoy listeners (LDS) — bind addresses, filter chains, the HTTP Connection Manager, and TLS termination.
sidebar_position: 1
tags: [envoy, resources]
---

A **listener** is where Envoy accepts traffic. In xDS terms it is served by the **Listener Discovery Service (LDS)** and carries the resource type `envoy.config.listener.v3.Listener`. Each listener binds an address and port, then runs incoming connections through a chain of **filters** that decide how the connection is read, secured, and proxied. For HTTP, that chain terminates in the **HTTP Connection Manager (HCM)**, which parses requests and hands them to a route configuration.

Listeners sit at the top of the Envoy dependency tree: a listener references filter chains, which reference route configurations, which reference clusters, which reference endpoints and secrets. Everything else Elchi manages ultimately hangs off a listener. For the big picture, see [Resources & the Config Model](/envoy-configuration/config-model).

## In Elchi

Listeners live under **Resources → Listener** (`/resource/listener`). The list shows each listener's name, protocol, address, and port, and lets you filter by name or Envoy version. Use **Add New** to open the create flow.

Every resource in Elchi is created against a specific **Envoy version** — you pick the version first, and Elchi loads the form generated from that version's protobuf schema. This is why a listener authored for `1.36` and one for `1.38` are distinct resources; the fields available match the Envoy build that will run them.

Listeners are unique in one respect: they default to **Managed by Service**. A managed listener does not take a hand-typed bind address — the address is populated from the IPs of the service (edge node) the listener is deployed to, so the same listener definition works across hosts. You can toggle this off to bind a literal address.

Because a single listener document can hold several listener entries, the form presents them as an expandable table. Expanding a row reveals the field editor, where a left-hand anchor lets you switch on exactly the Envoy fields you need — `address`, `filter_chains`, `listener_filters`, `access_log`, `udp_listener_config`, and the various single-value options.

:::tip[Upgrading listeners between versions]
Select one or more listeners of the same version in the list and use **Upgrade** to migrate them — and everything they depend on — to a newer Envoy version. See [Versions & Upgrades](/envoy-configuration/versions-and-upgrades).
:::

## Key fields

| Field | Purpose |
| --- | --- |
| `name` | Stable identifier. Fixed after creation — it is the LDS key other config and the snapshot reference. |
| `address` | The bind address (`socket_address` with `address` + `port_value`, `protocol` TCP/UDP). Auto-filled on managed listeners. |
| `filter_chains` | One or more chains, each with an optional match (SNI, transport protocol) plus its filters and a `transport_socket` for TLS termination. |
| `listener_filters` | Pre-chain filters that run before a filter chain is chosen — e.g. TLS Inspector (SNI/ALPN), HTTP Inspector, Proxy Protocol. |
| `access_log` | Connection-level access logging for the listener. |
| `udp_listener_config` | UDP-specific settings when the listener serves UDP (e.g. QUIC, UDP proxy). |

Inside a filter chain, the **HTTP Connection Manager** is the network filter that turns a TCP connection into HTTP. Its config selects the route configuration (inline or via RDS), the HTTP filter chain (router, auth, rate-limit, CORS, WAF, ext_proc…), and codec/protocol options.

## Relationships

- **References route configuration** — the HCM in a filter chain points at a [Route Configuration](/envoy-configuration/resources/routes), either inline or dynamically over RDS.
- **References HTTP/network filters** — the filter chain is built from [Filters](/envoy-configuration/resources/filters); the HCM's HTTP filter list is where the [Router](/envoy-configuration/resources/routes), WAF, and security filters live.
- **References secrets via a transport socket** — TLS termination attaches a downstream [Transport Socket](/envoy-configuration/resources/transport-sockets) that pulls certificates from [Secrets](/envoy-configuration/resources/secrets).
- **Referenced by bootstrap indirectly** — the proxy learns its listeners over LDS from the control-plane it connects to via its [Bootstrap](/envoy-configuration/resources/bootstrap).
- **The WAF and Shield hook in here** — the OWASP/Coraza WAF is delivered as an HTTP filter in the chain (see [WAF](/traffic-and-certificates/waf)), and the Elchi Shield ext_proc sidecar is wired via an External Processor HTTP filter (see [Shield: Envoy wiring](/shield/envoy-wiring)).

## Example

A minimal HTTPS listener terminating TLS and routing over RDS:

```yaml
name: https_ingress
address:
  socket_address:
    address: 0.0.0.0
    port_value: 443
filter_chains:
  - transport_socket:
      name: envoy.transport_sockets.tls
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
        common_tls_context:
          tls_certificate_sds_secret_configs:
            - name: example_com_cert
    filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          rds:
            route_config_name: main_routes
            config_source: { ads: {} }
          http_filters:
            - name: envoy.filters.http.router
listener_filters:
  - name: envoy.filters.listener.tls_inspector
```

## Tips

- **Name is immutable.** It is the LDS key; renaming means creating a new listener and retiring the old one.
- **Add a TLS Inspector listener filter** when you terminate TLS or match filter chains on SNI/ALPN — without it, SNI-based chain selection won't work.
- **Managed listeners keep addresses portable.** Leave management on unless you truly need a fixed bind address on a specific host.
- **Publishing is atomic.** Saving a listener validates it (frontend proto types, then `protoc-gen-validate` on the controller) and republishes the snapshot; connected proxies pick up the new listener without a restart. Use **Snapshot dump** to confirm what Envoy received.
- **Mind the dependency chain.** A listener that references a route config or secret that isn't published yet will be flagged — check the dependency graph in the UI for orphaned references before publishing.
