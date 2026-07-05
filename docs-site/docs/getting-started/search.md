---
title: Global Search
description: Find every place a domain or IP address appears across your Envoy configuration — virtual hosts, routes, filters, endpoints, clusters, listeners, services, and K8s discovery — and jump straight to the resource.
sidebar_position: 7
tags: [search, domains, ip-addresses, resources]
---

Global Search answers a question that is otherwise tedious to chase by hand: *"where is this domain or IP address used across my configuration?"* Instead of opening resources one by one, you type a hostname or address once and Elchi scans the relevant collections and returns every match with enough context to act on it.

## Opening search

Navigate to `/search`. The page leads with a search box titled **Search Domain and IP Addresses**. Type a value and press Enter (or click **Search**); the query is placed in the URL as `?q=<value>`, so a search is shareable and survives a refresh.

Search runs against the **currently selected project**. The backend requires a project parameter and validates that you have access to it before running — so results are scoped to the project in the sidebar selector, not across every project you belong to. Switching projects and re-running the query re-scopes the search.

## What gets indexed

Search is deliberately focused on the two things that are hard to grep for across a distributed config: **IP addresses** and **domains**. It inspects these collections:

| Collection | Matched on |
| --- | --- |
| **Virtual Hosts** | `domains`, plus route `host_rewrite` / `host_redirect` |
| **Routes** | inline virtual-host `domains` and route rewrites/redirects |
| **Filters** | HTTP Connection Manager inline route domains; RBAC IP permissions/principals |
| **Endpoints** | load-balancer endpoint socket addresses |
| **Clusters** | `load_assignment` endpoint addresses |
| **Listeners** | listener socket address |
| **Bootstrap** | admin socket address |
| **Services** | client `downstream_address` |
| **Discovery** | K8s node `ExternalIP` / `InternalIP` |

For the resources these map to, see the [configuration model](/envoy-configuration/config-model) and [Listeners](/envoy-configuration/resources/listeners).

## Query behavior

The backend first sanitizes your input, then decides whether you are searching for an **IP** or a **domain**:

- A value that looks like a full or partial dotted address (for example `10.218.16.1` or `10.218.16`) is treated as an **IP**. IP search is anchored to the start of the address and matches literally, so a partial address behaves like a prefix search across an address space.
- Anything else is treated as a **domain** and matched as a case-insensitive substring, so `example` finds `api.example.com`, `example.org`, and so on.

A collection is only searched if it has fields relevant to the detected query type — an IP query skips the domain-only collections and vice versa.

## Reading results

Results are grouped by collection. When matches span more than one collection, a row of **filter pills** appears (All, plus one per collection with its count) so you can narrow to just Listeners, just Routes, and so on. Each result card shows:

- The resource name and a colored collection tag.
- The resource type (`gtype`) and version as muted metadata.
- One chip per match: the matched **value** in monospace, followed by **context tags** that tell you *where* in the resource it was found — for example the virtual-host name, route name, filter type, K8s node name and address type (Internal/External), locality, port, whether it was an inline route, or the client ID for a service match.

That context is what makes the result actionable: you see not just *that* `10.0.0.5` appears in a cluster, but *which* endpoint and port.

## Deep-linking to the resource

Clicking a result navigates straight to the underlying resource, with the correct identifiers already in the URL:

- **Discovery** results open the K8s discovery view directly.
- **Services** open `/services/<id>` (with the version when known).
- Every other result opens its resource editor, carrying the `resource_id` and `version` so the exact object loads.

This turns search into a navigation tool as much as a lookup: find the domain, click, and you are editing the resource that references it.

:::note Scope of the index
Search targets domain and IP fields specifically — it is not a full-text search over arbitrary configuration values, resource names, or secret contents. If a value you expect isn't found, confirm it lives in one of the indexed fields above and that you are in the right project.
:::
