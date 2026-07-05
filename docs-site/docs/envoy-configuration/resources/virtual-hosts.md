---
title: Virtual Hosts
description: How Elchi models Envoy virtual hosts inside a route configuration — domains, per-vhost routes, retries, and header rules.
sidebar_position: 3
tags: [envoy, resources]
---

A **virtual host** is a domain-scoped block inside a route configuration. It carries the type `envoy.config.route.v3.VirtualHost` and answers one question: *for requests whose Host/`:authority` matches my domains, which route applies?* Envoy picks exactly one virtual host per request — the best domain match — and then evaluates that vhost's ordered route table.

Virtual hosts are the domain-routing layer between a [Route Configuration](/envoy-configuration/resources/routes) and its [Clusters](/envoy-configuration/resources/clusters). One route config typically holds several virtual hosts — one per hostname or hostname group you serve.

## In Elchi

Virtual hosts are authored **inside a route configuration**, not as standalone published resources. When editing a route config you switch on the `virtual_hosts` element, which opens the **HTTP Route Components** drawer. There you add virtual hosts to a table, drag to reorder them, and expand each to edit its fields.

Elchi does surface a top-level **Virtual Host** entry in the resource list (`/resource/virtual_host`) for browsing and for the version-scoped model, but in practice the editing you do lives within the parent route config's drawer. As with every resource, the form is generated from the selected Envoy version's protobuf, so the available fields match the target build.

Each virtual host row shows its **name** and its **domains**. Expanding a row reveals the field editor, where an anchor lets you toggle on domains, the route table, header manipulation, retry/hedge policies, and per-filter overrides.

## Key fields

| Field | Purpose |
| --- | --- |
| `name` | Identifier for the vhost (used in stats and as a stable handle). Fixed after creation. |
| `domains` | The host patterns this vhost matches — exact (`api.example.com`), leading-wildcard (`*.example.com`), or catch-all (`*`). Most specific match wins. |
| `routes` | The ordered match/route/redirect/direct-response table evaluated for matching requests. |
| `retry_policy` | Default retry behavior for routes in this vhost (retry conditions, count, per-try timeout). |
| `hedge_policy` | Hedged requests — race a second attempt to cut tail latency. |
| `request_mirror_policies` | Shadow matching traffic to another cluster. |
| `virtual_clusters` | Named request groupings for finer-grained stats. |
| `request_/response_headers_to_add/remove` | Per-vhost header manipulation. |
| `typed_per_filter_config` | Enable/disable/override HTTP filters for just this vhost. |

:::warning[Domain matching precedence]
A request matches at most one virtual host. Envoy prefers the most specific domain: an exact match beats a `*.suffix` wildcard, which beats the `*` catch-all. A domain string may appear in only one virtual host within a route config.
:::

## Relationships

- **Belongs to a route configuration** — a virtual host has no meaning outside its parent [Route Configuration](/envoy-configuration/resources/routes).
- **Contains routes → references clusters** — each route's action names a [Cluster](/envoy-configuration/resources/clusters) upstream.
- **Selected by the HCM's host resolution** — the [Listener](/envoy-configuration/resources/listeners) HCM resolves the incoming Host against these domains.
- **Overrides filters** — per-vhost `typed_per_filter_config` tunes [Filters](/envoy-configuration/resources/filters) declared on the listener's HTTP filter chain.

## Example

Two virtual hosts in one route config — an API host and a wildcard catch-all that redirects to canonical:

```yaml
virtual_hosts:
  - name: api
    domains: ["api.example.com"]
    retry_policy:
      retry_on: "connect-failure,refused-stream"
      num_retries: 3
    routes:
      - match: { prefix: "/" }
        route: { cluster: api_backend }
  - name: catch_all
    domains: ["*"]
    routes:
      - match: { prefix: "/" }
        redirect:
          host_redirect: "www.example.com"
          https_redirect: true
```

## Tips

- **Put specific domains first conceptually, but rely on precedence.** Envoy's most-specific-wins rule means a `*` catch-all vhost is safe to keep as a fallback.
- **A domain can live in only one vhost.** Duplicating a domain across virtual hosts in the same route config is a validation error.
- **Reuse retry/header policy at the vhost level** instead of repeating it on every route.
- **Per-vhost filter overrides are powerful** — use `typed_per_filter_config` to disable, say, auth or rate-limiting on a health-check vhost without touching the global filter chain.
