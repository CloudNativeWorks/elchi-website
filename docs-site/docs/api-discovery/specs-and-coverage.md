---
title: OpenAPI Specs & Coverage
description: Import OpenAPI / Swagger specs, keep their versions, scope them to listeners, hosts and path prefixes, and compare them with observed traffic — documented, undocumented, unused, deprecated-in-use, parameter and status drift.
sidebar_position: 10
tags: [api-discovery, openapi]
---

[OpenAPI Export](/api-discovery/openapi-export) goes from traffic to a spec. **Specs** goes the other way: you upload the specs your teams maintain, and API Discovery tells you how the observed traffic lines up with them — what is documented, what is shadow, what the spec promises but nobody calls, and where the live API has drifted from its contract. It lives on the **Specs** tab of `/api-discovery`.

## Importing a spec

- **Formats** — OpenAPI 3.x and Swagger 2.0, YAML or JSON; up to 5 MiB and 20 000 operations. Path- and operation-level `servers` are honoured; external `$ref`s are reported as warnings.
- **Who** — uploading, re-scoping and deleting specs requires the Admin or Owner role; every project member can read them.
- **Versions** — specs are grouped by **name** (case-insensitive). Uploading under an existing name creates the next version; exactly one version per name is **current** and the previous one is marked superseded. Version numbers are never reused, even after a delete. Deleting the current version promotes the newest remaining one. A versions drawer lists every version of a name.

## Scope

Each spec has a **scope** that says which traffic it describes:

| Field | Matching |
|---|---|
| `listener_name` | exact listener; empty = any |
| `host_prefix` | on **label boundaries**: `example.com` = the host and its subdomains (never `badexample.com` or `example.com.evil.net`); `*.example.com` = subdomains only; `api.` = left-label prefix; a port is compared only if given; empty = any host |
| `path_prefixes` | on **segment boundaries** (`/up` covers `/up/x`, not `/upload`; `{x}` matches one segment); up to 32. Defaults to the spec's own base paths |

A new version inherits the previous version's listener, host and custom prefixes for fields you leave empty (unless you turn inheritance off). The scope of the current version can be edited later; a **scope preview** shows how many observed operations a candidate scope covers, with samples, before you save it.

## Coverage

Coverage compares **all current specs** with the observed operations — confirmed HTTP rows seen in a window (default 7 days, up to 90). Every observed operation lands in exactly one status:

| Status | Meaning |
|---|---|
| **Documented** | Matched by exactly one spec |
| **Overlap** | Matched by two or more specs |
| **Undocumented** | Inside some spec's scope, matched by none — shadow API |
| **Unscoped** | Inside no spec's scope |

On top of that, coverage reports:

- **Unused spec operations** — in a spec, never observed in the window.
- **Out of scope** — spec operations outside that spec's own path prefixes (not counted as unused).
- **Deprecated in use** — operations the spec marks deprecated that still receive traffic.
- **Parameter drift** — observed query-parameter names the spec does not declare.
- **Status drift** — observed status codes the spec has no response for. A response key covers a code when it is equal, the same `NXX` class, or `default`.

Coverage can be filtered by listener (then only specs whose scope can cover that listener contribute to unused / out-of-scope), and the endpoint detail page shows a **documented** badge for each row: documented, overlap, undocumented or unscoped, with the specs and scopes involved. A row is eligible only when it is confirmed and was seen within the last 7 days; gRPC, TCP and GraphQL rows are not compared.

:::note[Where the drift data comes from]
Parameter and status drift are computed from the raw ClickHouse events in the window (query-parameter names; per-code counts of non-blocked responses). When ClickHouse is unavailable the comparison falls back to the inventory's lifetime `query_params` and `status_dist` — the response says which source was used. A window longer than the 7-day raw retention adds a warning.
:::

## Comparing one spec

**Compare** runs the same resolution for a single spec version and lists one category at a time: `undocumented` (default), `unused`, `deprecated_in_use`, `param_drift`, `status_drift` or `out_of_scope`, with a summary of every count. It works for superseded versions too, so you can see how a new version changes the picture before relying on it.

## Related

- [OpenAPI Export](/api-discovery/openapi-export) — generate a spec skeleton from the confirmed catalog.
- [Drift](/api-discovery/drift) — how the observed surface changed over time.
- [Shield OpenAPI validation](/shield/engines/openapi-validation) — enforce a spec at the edge.
