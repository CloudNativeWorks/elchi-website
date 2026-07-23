---
title: Routes
description: How Elchi models Envoy route configurations (RDS) — virtual hosts, match/route/redirect rules, and header manipulation.
sidebar_position: 2
tags: [envoy, resources]
---

A **route configuration** tells the HTTP Connection Manager how to turn an incoming request into an upstream decision. In xDS terms it is served by the **Route Discovery Service (RDS)** and carries the resource type `envoy.config.route.v3.RouteConfiguration`. A route config is essentially a list of **virtual hosts**, each matched by domain, and each holding an ordered list of **routes** that match on path/headers/method and then route, redirect, or directly respond.

Route configs are the middle layer of the request path: a listener's HCM selects a route config, the route config selects a virtual host by `:authority`/Host, and the virtual host's first matching route selects a cluster. See [Resources & the Config Model](/envoy-configuration/config-model) for how the layers fit together.

## In Elchi

Route configurations live under **Resources → Route** (`/resource/route`). Create one with **Add New**, choosing an Envoy version first — the form is generated from that version's route protobuf, so available fields track the target Envoy build.

The editor is organized around the `RouteConfiguration` message. A tag bar lets you switch on the parts you need; the headline element is **`virtual_hosts`**, which opens a dedicated drawer (**HTTP Route Components**) where you build and reorder virtual hosts. The other route-config-level sections — request/response header manipulation, request mirror policies, and per-filter config — are edited inline.

:::note[Inline vs. dynamic virtual hosts]
Elchi authors virtual hosts inline in the route config. The control-plane does serve VHDS (Virtual Host Discovery Service), but this resource flow doesn't use it — define your virtual hosts directly. See [Virtual Hosts](/envoy-configuration/resources/virtual-hosts).
:::

## Key fields

| Field | Purpose |
| --- | --- |
| `name` | Stable identifier and RDS key. A listener's HCM references this name over RDS. Fixed after creation. |
| `virtual_hosts` | The ordered set of [Virtual Hosts](/envoy-configuration/resources/virtual-hosts) — each with its own domains and route table. |
| `request_headers_to_add` / `request_headers_to_remove` | Mutate request headers for all routes in the config. |
| `response_headers_to_add` / `response_headers_to_remove` | Mutate response headers for all routes in the config. |
| `request_mirror_policies` | Shadow a copy of matching traffic to another cluster without affecting the live response. |
| `typed_per_filter_config` | Override HTTP-filter behavior (e.g. disable a filter) at the route-config scope. |

Within a virtual host, each **route** is a match-plus-action:

- **match** — path (`prefix`, `path`, `safe_regex`, or URI-template), plus optional headers, query parameters, and method.
- **route** — forward to a `cluster` (or `weighted_clusters`), with timeout, retry policy, prefix rewrite/regex rewrite, and host rewrite.
- **redirect** — return a 3xx to a new scheme/host/path.
- **direct_response** — return a fixed status and body without an upstream.

## Relationships

- **Referenced by listeners** — a [Listener](/envoy-configuration/resources/listeners)'s HCM selects this route config inline or over RDS.
- **Contains virtual hosts** — which contain the routes; see [Virtual Hosts](/envoy-configuration/resources/virtual-hosts).
- **References clusters** — a route's action names a [Cluster](/envoy-configuration/resources/clusters) (single or weighted) as its upstream.
- **References filters via per-filter config** — [Filters](/envoy-configuration/resources/filters) can be tuned or disabled per route/vhost with `typed_per_filter_config`.

## Example

A route config with one virtual host that redirects HTTP→HTTPS on a legacy host and routes API traffic to a cluster:

```yaml
name: main_routes
virtual_hosts:
  - name: api
    domains: ["api.example.com"]
    routes:
      - match: { prefix: "/v1/" }
        route:
          cluster: api_backend
          timeout: 15s
          retry_policy:
            retry_on: "5xx,reset"
            num_retries: 2
      - match: { prefix: "/" }
        direct_response:
          status: 404
    request_headers_to_add:
      - header: { key: "x-forwarded-proto", value: "https" }
```

## Tips

- **Order matters.** Envoy evaluates routes top-to-bottom and takes the first match — put specific prefixes before catch-alls. Elchi lets you drag to reorder virtual hosts and routes.
- **Name is the RDS key.** Renaming a route config breaks the listener that references it; create-and-retire instead.
- **Header manipulation composes across scopes.** Route-config, virtual-host, and route-level header rules all apply — keep them from fighting each other.
- **Publish together.** A route that references a not-yet-published cluster will be flagged as a broken reference; check the dependency graph before publishing and use **Snapshot dump** to confirm the RDS payload reached Envoy.
