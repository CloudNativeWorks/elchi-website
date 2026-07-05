---
title: Filters
description: How Elchi models Envoy filters — the listener, network, HTTP, and UDP filter categories the UI exposes, and where WAF and ext_proc fit.
sidebar_position: 8
tags: [envoy, resources]
---

![Managing Envoy filters in Elchi](/img/docs/filter.png)

**Filters** are the pluggable units of Envoy's data path. A connection or request flows through an ordered chain of filters, each doing one job — inspect TLS, terminate HTTP, authenticate, rate-limit, mutate headers, proxy to an upstream. Envoy groups filters by *where* they run, and Elchi exposes the same four categories:

| Category | Runs on | Examples |
| --- | --- | --- |
| **Listener filters** | A [Listener](/envoy-configuration/resources/listeners), before a filter chain is chosen | TLS Inspector, HTTP Inspector, Original Dst/Src, Proxy Protocol |
| **Network filters** | A listener filter chain (L4) | HTTP Connection Manager, TCP Proxy, RBAC, Local Rate Limit, Redis/Mongo Proxy, SNI Cluster |
| **HTTP filters** | Inside the HTTP Connection Manager (L7) | Router, JWT Auth, Ext Authz, **External Processor (ext_proc)**, CORS, RBAC, Local Rate Limit, Lua, WASM, Compressor |
| **UDP filters** | A UDP listener | DNS Filter, UDP Proxy |

The single most important network filter is the **HTTP Connection Manager (HCM)** — it turns a TCP connection into HTTP and hosts the ordered **HTTP filter chain**. The **Router** is the terminal HTTP filter that actually dispatches to a cluster; every HTTP filter chain ends with it.

## In Elchi

Filters live under **Filters** in the UI, grouped by the four categories above (`/filters/listener/...`, `/filters/network/...`, `/filters/http/...`, `/filters/udp/...`). Each filter type has its own list and create flow; as with every resource you choose an Envoy version first and get a form generated from that version's protobuf.

You author a filter as a reusable, named resource, then **attach it by reference** where it belongs — listener filters and network filters onto a listener/filter chain, HTTP filters into an HCM's `http_filters` list. HTTP filters can also be overridden per route or per virtual host via `typed_per_filter_config`.

:::info[Ordering is behavior]
Within the HCM, HTTP filters run **in the order listed**, and the Router must be last. Put authentication and security filters (JWT, ext_authz, WAF, ext_proc) ahead of the Router so they can reject a request before it reaches an upstream.
:::

## Where WAF and Shield fit

Two Elchi security features are delivered as HTTP filters in the HCM chain:

- **WAF (Coraza / OWASP CRS)** — delivered as an HTTP **WASM** filter. On an HCM you set the WAF config by name, and Elchi injects the corresponding WASM filter into the chain. See [WAF](/traffic-and-certificates/waf).
- **Elchi Shield (API security)** — a local ext_proc sidecar reached through an Envoy **External Processor (ext_proc)** HTTP filter. Toggling API Security on an HCM prepends the `elchi-shield` ext_proc filter so it runs first in the chain, ahead of routing. See [Shield: Envoy wiring](/shield/envoy-wiring).

Both are ordinary HTTP filters from Envoy's perspective — the difference is that Elchi manages their injection and keeps the filter list consistent for you.

## Key fields

Filter configuration is entirely per-type, but the shape is uniform: a **name** plus a **typed_config** (the Envoy `@type` and its fields). Elchi's generated form drives the typed_config for each filter, so you edit real Envoy fields rather than raw JSON.

| Concept | Purpose |
| --- | --- |
| `name` | The filter instance name within its chain. |
| `typed_config` | The filter's Envoy message (its `@type` decides which fields apply). |
| Per-route override | `typed_per_filter_config` on a route/vhost to enable, disable, or retune an HTTP filter. |

## Relationships

- **Attached to listeners** — listener and network filters build a [Listener](/envoy-configuration/resources/listeners)'s chains; the HCM is the network filter that hosts HTTP filters.
- **Reference route configs** — the HCM points at a [Route Configuration](/envoy-configuration/resources/routes) (inline or RDS).
- **Reference clusters/secrets** — filters like ext_authz, ext_proc, OAuth2, and JWT reach out to a [Cluster](/envoy-configuration/resources/clusters) or use [Secrets](/envoy-configuration/resources/secrets).
- **Complex typed configs live as [Extensions](/envoy-configuration/resources/extensions)** — some filters reference shared, separately-managed extension configs (e.g. access loggers, compressor libraries).

## Example

An HCM HTTP filter chain with security ahead of the Router:

```yaml
http_filters:
  - name: elchi-shield            # ext_proc — API security, runs first
    config_discovery: { config_source: { ads: {} } }
  - name: envoy.filters.http.jwt_authn
  - name: envoy.filters.http.cors
  - name: envoy.filters.http.router   # terminal filter — must be last
```

## Tips

- **The Router is always last.** Anything after it never runs.
- **Order security before routing.** JWT/ext_authz/WAF/ext_proc must precede the Router to gate requests.
- **Attach the right listener filters.** SNI-based chain matching needs the TLS Inspector; protocol detection needs the HTTP Inspector.
- **Use per-route overrides sparingly but deliberately** to exempt health checks or internal paths from auth/rate-limiting.
- **Let Elchi manage WAF/Shield injection** rather than hand-editing the filter list — the toggles keep positions and references consistent.
