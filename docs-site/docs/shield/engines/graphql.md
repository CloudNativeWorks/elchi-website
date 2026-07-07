---
title: GraphQL Guard
description: Query-shape DoS protection for GraphQL — depth, alias, field, and batch limits, introspection blocking, and always-on complexity backstops.
sidebar_position: 11
tags: [shield, engine]
---

The `graphql` engine protects GraphQL endpoints against **query-shape denial of service**: deeply nested queries, alias overloading, root/total field explosions, batched-operation floods, fragment bombs, and schema introspection. It is a **body-phase, request-only** engine — it parses the query once and enforces the configured limits, with two always-on backstops that cannot be disabled.

It targets both delivery paths: a **POST with a matching content-type** (within the optional path allow-list) **and a GET carrying `?query=`** — guarding only POST would let an attacker move a deep query to GET. Everything else passes through with no penalty.

:::info
This is **not a positive-security gate** — a request that doesn't look like GraphQL (including a body that isn't parseable as JSON) simply passes through. Pair it with [OpenAPI validation](/shield/engines/openapi-validation) or the [Coraza WAF](/shield/engines/coraza-waf) for positive security.
:::

## When to use it

- Any exposed GraphQL endpoint — GraphQL's expressiveness makes tiny requests capable of enormous server-side work, which none of the generic engines understand.
- Block introspection (`__schema` / `__type`) on production APIs.
- Cap batched operations, nesting depth, and alias fan-out to match what your real clients actually send.

## Configuration

| Field | Type | Default | Notes |
|---|---|---|---|
| `content_types` | string[] | `application/json`, `application/graphql` | Bodies treated as GraphQL. Also inspects GraphQL-over-GET. |
| `paths` | string[] | — | Restrict to these paths (empty = any). |
| `max_depth` | int | `0` (off) | Max query nesting depth. |
| `max_aliases` | int | `0` (off) | Max aliases. |
| `max_root_fields` | int | `0` (off) | Max root fields (counted through fragments). |
| `max_total_fields` | int | `0` (off) | Max total fields. |
| `max_operations` | int | `0` (off) | Max operations per document (batching). |
| `block_introspection` | bool | `false` | Block introspection queries. |
| `max_fragment_depth` | int | `32` | Fragment-spread recursion bound (DoS). |
| `max_complexity` | int | `100000` | Per-operation node-visit budget. **Always enforced** as a backstop (`0` falls back to the default, it does NOT disable it). |

Rule: at least one of `max_depth` / `max_aliases` / `max_root_fields` / `max_total_fields` / `max_operations` or `block_introspection` is required (a zero individual limit disables only *that* check).

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-graphql
spec:
  defaults:
    mode: block
    fail_mode: fail_close
    inspect_request_body: true
    max_request_body_bytes: 1048576   # 1 MiB

  domains:
    - hosts: ["graph.example.com"]
      routes:
        - match:
            path_prefix: "/graphql"
          policy:
            mode: block
            engines:
              graphql:
                content_types: ["application/json", "application/graphql"]
                paths: ["/graphql"]      # optional; restrict to the GraphQL endpoint
                max_depth: 10            # reject deeply-nested queries
                max_aliases: 15          # alias-overload (response amplification)
                max_root_fields: 20
                max_total_fields: 500
                max_operations: 10       # batched-array cap
                max_fragment_depth: 32   # fragment-cycle bound
                block_introspection: true
```

## How it decides

Only requests that look like GraphQL are inspected: a POST with a matching `content_types` entry (within `paths`, when set), or a GET with a `?query=` parameter. The document is parsed once, then checked — a zero value disables that specific check:

- `max_operations` — batch arrays and multi-operation documents.
- `max_root_fields` — counted **through fragments**, so wrapping fields in fragments can't dodge it.
- `max_depth`, `max_aliases`, `max_total_fields`.
- `block_introspection` — `__schema` / `__type` queries.

A document that fails to parse blocks with **`graphql.parse_error`**. All blocks are severity Medium / 403.

:::note[Parser is token-bounded]
The query is parsed with a hard **token limit (100 000)** *before* any of the limits above are evaluated — the depth/complexity checks run on the parsed document, so the parser itself must be bounded first. An oversized or pathologically deep query (e.g. hundreds of thousands of nested brackets) is rejected as `graphql.parse_error` rather than being allowed to exhaust the parser. This bound is a fixed backstop and is not configurable.
:::

**Always-on backstops (cannot be disabled — a `0` falls back to the default):** `max_fragment_depth` (default **32**, the fragment-spread recursion bound) and `max_complexity` (default **100000**, a per-operation node-visit budget) — the hard guard against a fragment "bomb", a tiny query whose fragments fan out exponentially. Exceeding the node budget blocks **`graphql.complexity`** immediately.

## Envoy prerequisites

The engine runs at the body phase, so the policy must enable body inspection: set `inspect_request_body: true` and a `max_request_body_bytes` cap (see [body inspection](/shield/policies/body-inspection)). No fingerprint or source-IP wiring is required. General setup: [Envoy wiring](/shield/envoy-wiring).

## Verify

A shallow, ordinary query passes:

```bash
curl -i http://graph.example.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ products { id name } }"}'
# HTTP/1.1 200 OK
```

An introspection query is blocked:

```bash
curl -i http://graph.example.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __schema { types { name } } }"}'
# HTTP/1.1 403 Forbidden
```

A deeply nested query (depth > 10 in the example) is also blocked — and the same query moved to GET is caught too:

```bash
curl -i "http://graph.example.com/graphql?query=%7B%20__schema%20%7B%20types%20%7B%20name%20%7D%20%7D%20%7D"
# HTTP/1.1 403 Forbidden
```

## Gotchas

- **Never drop the GET-over-`?query=` path** if you customize targeting — attackers relocate deep queries to GET the moment only POST is guarded.
- **An unparseable-as-JSON body passes through** — this engine only judges requests it can recognize as GraphQL. It is a DoS guard, not a positive-security gate; pair with [OpenAPI](/shield/engines/openapi-validation) or [Coraza](/shield/engines/coraza-waf) for that.
- **The two backstops are deliberately un-disable-able:** setting `max_fragment_depth` or `max_complexity` to `0` restores the default rather than turning the check off.
- Fields you leave at `0` are individually off — but at least one shape limit (or `block_introspection`) must be configured or the engine is rejected at load.
