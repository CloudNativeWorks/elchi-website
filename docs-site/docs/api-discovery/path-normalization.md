---
title: Path Normalization
description: How API Discovery templates high-cardinality request paths into stable operations, the built-in detectors, operator rules, and the normalization-gap workflow.
sidebar_position: 7
tags: [api-discovery]
---

An API endpoint is an *operation* — a method plus a path *template* like `GET /users/{id}` — not a distinct URL per resource ID. If the collector stored raw paths, `/users/1`, `/users/2`, and `/users/999999` would each spawn their own inventory row, and a busy endpoint would shatter into thousands of near-duplicates. Path normalization templates high-cardinality segments into placeholders so that **one operation is one inventory row**.

:::info[Why it matters]
The inventory is cardinality-capped (100K endpoints per collector by default). Un-normalized IDs burn through that budget fast and drown the real catalog in noise. Good normalization keeps the catalog small, stable, and meaningful. See [Overview](/api-discovery/overview).
:::

## What gets normalized automatically

The built-in detectors template a segment into a placeholder when it looks like an identifier. Recognized shapes:

- Numeric IDs and composite-numeric IDs (e.g. `1-101672939043002`)
- UUIDs, Mongo ObjectIDs, ULIDs, hex IDs
- JWT-like segments and high-entropy / random tokens
- Leaked vendor secrets (AWS `AKIA…`, GitHub `ghp_…`, Stripe `sk_live_…`, Slack, Shopify, GitLab) → `{secret}` (the value is dropped)

**Preserved as-is:** `vN` version segments (`/v1`, `/v2`) and static-asset segments — these are meaningful literals, not identifiers.

The query string is **always stripped** from the path before storage, regardless of normalization.

### Placeholder kinds

The placeholder set is fixed — a downstream dashboard can rely on it never sprouting new members without a schema migration:

| Placeholder | Meaning |
|---|---|
| `{id}` | Generic identifier (numeric / hex / composite) |
| `{uuid}` | UUID |
| `{objectid}` | Mongo ObjectID |
| `{ulid}` | ULID |
| `{token}` | Opaque auth-ish token (also a leaked JWT in a path → `jwt_in_path`) |
| `{dynamic}` | High-entropy / random value |
| `{secret}` | Leaked vendor credential (value dropped → `secret_in_path`) |
| `{traversal}` | Path-traversal shape |
| `{pii}` | A segment that matched a PII detector |

When an operator adds a rule (below), only these placeholders are selectable: **`id`, `uuid`, `objectid`, `ulid`, `token`, `dynamic`**. `secret`, `pii`, and `traversal` are detector-driven and not operator-assignable. Constraining the set keeps downstream dashboards stable — operators map to existing placeholders rather than inventing new ones.

## Operator normalization rules

Deployment-specific ID formats the built-ins don't recognize can be added by an operator via `policy.path_normalize_patterns` — no code change, hot-reloaded:

```js
db.api_collector_config.updateOne(
  { _id: "default" },
  { $set: { "policy.path_normalize_patterns": [
      { regex: "tkt_[a-z0-9]+",  placeholder: "dynamic" },
      { regex: "ORD\\d{6,}",     placeholder: "id" }
  ], version: 4, updated_at: new Date(), updated_by: "spehlivan" }}
)
```

Rules of the road:

- Each rule matches a **whole path segment**. Patterns are whole-segment anchored automatically — a leading `^` / trailing `$` is accepted but redundant.
- **Built-in detectors always win.** A custom pattern only ever catches a shape the built-ins missed; it never overrides one.
- `placeholder` must be one of the six operator-assignable kinds. Pick the one that describes the value.
- Patterns are **validated at load time**: each regex must compile, stay within length / quantifier caps, and must not be broad enough to template static segments (`.*`, `[a-z]+` are rejected). A bad pattern fails the reload and the previous config stays live. Max 64 patterns.
- On every reload the collector logs `runtime config reloaded … normalize_patterns=N` — confirm `N` matches what you set (a rejected reload keeps the old value).

:::note[Leaked credentials in a path]
When normalization collapses a vendor secret or JWT in the path to `{secret}` / `{token}`, the raw value is dropped and the event gains the `secret_in_path` / `jwt_in_path` PII category plus the `pii_observed` flag. See [PII, Auth & Consumers](/api-discovery/pii-and-auth).
:::

## The normalization-gap detector

When a deployment-specific ID format slips past the built-ins, each value spawns its own inventory row and the catalog bloats. The `normalize_gap` detector catches this automatically: it counts distinct **literal** last path-segments per `(project, prefix)`, and once a prefix exceeds the threshold (default 64 distinct segments within the window) it records the prefix in the `api_collector_normalize_gaps` collection.

- Already-templated segments (`{id}`, `{uuid}`, …) are ignored, so a correctly-normalized endpoint never appears.
- Gap documents are TTL-indexed (7 days): once an operator adds a matching pattern, the segments become placeholders, the prefix stops accumulating, and its entry ages out automatically.

### The Normalization Gaps panel

The UI surfaces these suspected gaps in a **Normalization Gaps** panel with a one-click fix:

- Each row shows a ballooning prefix (e.g. `/api/v1/tickets/by-number`) and when it was last updated.
- An **Admin** or **Owner** sees an *"Add normalize rule"* button per row that opens a modal:
  - **Segment regex** — an RE2 regex matching the whole dynamic segment (no `^`/`$` needed), e.g. `TK-\d+` or `[0-9a-f-]{36}`.
  - **Placeholder** — a dropdown of the six operator-assignable kinds (`{id}`, `{uuid}`, `{objectid}`, `{ulid}`, `{token}`, `{dynamic}`).
- Submitting appends the rule to `policy.path_normalize_patterns` (a read-modify-write of the collector config). The collector picks it up on its next poll — **applied within ~2 minutes**.
- A clean state renders *"No normalization gaps — all path prefixes look healthy."*

Editing the collector config is restricted to Admin/Owner roles; other users see the gaps but not the add-rule action.

## Worked example

Suppose your ticketing API uses IDs like `TK-48213`, which the built-in detectors don't recognize as an identifier. Traffic looks like:

```
GET /api/v1/tickets/TK-48213
GET /api/v1/tickets/TK-91007
GET /api/v1/tickets/TK-33540
… hundreds more distinct TK-* values
```

Each distinct value creates its own inventory row. Once the prefix `/api/v1/tickets` crosses the gap threshold, it appears in the Normalization Gaps panel. An operator clicks **Add normalize rule**, enters:

- **Segment regex:** `TK-\d+`
- **Placeholder:** `id`

Within ~2 minutes the collector applies it, and all of those rows collapse into a single operation:

```
GET /api/v1/tickets/{id}
```

The gap document stops being refreshed and ages out, and the catalog is clean again.

## Related

- [Collector Configuration](/api-discovery/collector-configuration) — `detect_pii`, `path_normalize_patterns`, and other runtime knobs.
- [PII, Auth & Consumers](/api-discovery/pii-and-auth) — how `{secret}` / `{pii}` masking ties into PII detection.
- [OpenAPI Export](/api-discovery/openapi-export) — normalized operations become the paths of the exported spec.
