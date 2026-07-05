---
title: Templates & Snippets
description: Reusable Envoy config building blocks in Elchi — per-type resource templates for consistent starting points, and searchable field-level snippets for repeated fragments, with batch operations.
sidebar_position: 6
tags: [envoy]
---

Most Envoy configuration is repetitive: the same health check across every cluster,
the same access-log setup on every listener, the same starting point for a new route
configuration. Elchi has two mechanisms for capturing that repetition so you author
it once and reuse it everywhere — **Templates** (a reusable default for a whole
resource type) and **Snippets** (reusable fragments attached to individual config
fields). Both speed up authoring and, more importantly, keep configuration
**consistent** across a project.

Both are built on the same [resource model](/envoy-configuration/config-model):
everything is keyed by `gtype` (the Envoy proto type), `project`, and `version` (the
Envoy release), so a template or snippet always matches the exact schema of the
resource you're editing.

## Templates

A **Template** is a saved default configuration for an entire resource type. There is
one template per `{ gtype, project, version }` — so a project can define, for
example, its standard Cluster shape or its standard Listener bootstrap, and every new
resource of that type starts from it instead of from a blank form.

Templates are managed inline from the resource editor through a Monaco-based modal:
you can check whether a template exists for the current type, view it, save the
current resource as the template, apply the template to a new resource, or delete it.

| Aspect | Detail |
| --- | --- |
| Check exists | `GET /api/v3/templates/check/:gtype` → `{ exists }` |
| Read | `GET /api/v3/templates/:gtype` |
| Create / update | `POST /api/v3/templates/:gtype` (upsert) |
| Delete | `DELETE /api/v3/templates/:gtype` |
| Required query params | `project`, `version` (on every route) |
| Keyed by | `{ gtype, project, version }` — one template per type |
| Write access | Admin / owner only |

Template writes go through the same typed-config decoding as the normal publish path,
so a saved template is validated the same way a real resource is. For the bootstrap
type, node- and instance-specific fields (admin address, dynamic resources, node
id/cluster) are stripped out — a template captures the reusable shape, not one
node's identity. Every create, update, and delete emits an audit event.

:::tip[Standardize new resources]
Save a fully-configured, reviewed resource as the template for its type. From then
on, anyone creating that resource type in the project starts from the approved
baseline — the same timeouts, health checks, and TLS settings — instead of
rebuilding it and drifting.
:::

## Snippets

A **Snippet** is a smaller, sharper tool: a reusable fragment attached to a specific
**field** of a resource, not the whole resource. A snippet captures something like an
`outlier_detection` block, a single `health_checks` entry, or a filter's config —
and can be dropped into that field on any matching resource.

Snippets are field-aware. Each snippet records the `field_path` it belongs to (e.g.
`health_checks`, `outlier_detection`), whether that field `is_array`, its
`component_type`, and the `gtype` it applies to. When you save from a component in
the editor, that metadata is auto-discovered from where you are, so the snippet knows
exactly where it can be applied later — and, for array fields, whether to append or
replace.

| Aspect | Detail |
| --- | --- |
| Create | `POST /api/v3/snippets` |
| List | `GET /api/v3/snippets` (paginated) |
| Search | `GET /api/v3/snippets/search` |
| Stats | `GET /api/v3/snippets/stats` |
| Read / update / delete | `GET` / `PUT` / `DELETE /api/v3/snippets/:id` |
| Batch create / delete | `POST` / `DELETE /api/v3/snippets/batch` |
| Stored fields | `name`, `component_type`, `gtype`, `field_path`, `is_array`, `version`, `project`, `snippet_data` |
| Write access | Editor / admin / owner (viewers cannot write) |

### Searchable and filterable

Because a project accumulates many snippets, they're built to be found. **List**
filters by `project`, `version`, `component_type`, `gtype`, and a free-text `search`,
with offset/limit pagination and `total` / `hasMore` metadata. **Search** runs a
case-insensitive match across snippet name, component type, and field path.
**Stats** aggregates counts by project, gtype, and version so you can see your
library at a glance.

### Deduplication

Each snippet's content is hashed (sha256, stored as `data_hash`). Creating a snippet
whose content already exists for the same `{ data_hash, project, gtype }` is
rejected as a duplicate. Identical fragments collapse to one entry instead of
sprawling into near-copies. Snippet payloads are size-bounded (up to 100&nbsp;KB).

### Batch operations

The `batch` endpoints create or delete many snippets in one call. On partial success
the response reports exactly which items failed (with per-item index/id and reason)
and returns `207 Partial Content` — so a bulk import of a snippet library either
lands cleanly or tells you precisely what didn't.

:::tip[Templates vs Snippets]
Reach for a **Template** when you want a consistent **starting point for a whole
resource** (one per type). Reach for a **Snippet** when you want to reuse a
**fragment across many resources** — the same health check on twenty clusters, the
same filter block on several listeners. Templates standardize the shape; snippets
standardize the parts.
:::

## Consistency and auditability

Both mechanisms enforce consistency by construction — everyone builds from the same
approved shapes — and both are governed. Writes are role-gated (templates:
admin/owner; snippets: editor and above), and every create, update, and delete emits
an audit event, so the shared building blocks a project relies on have a clear change
history. Combined with the [config model's](/envoy-configuration/config-model)
two-step validation, reused config is as safe as hand-authored config.
