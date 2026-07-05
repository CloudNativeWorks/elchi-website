---
title: REST API Reference
description: The Elchi controller REST API — base path, authentication and project scoping, and a grouped map of the main endpoint families.
sidebar_position: 6
tags: [reference]
---

The Elchi **controller** exposes a REST API that the UI and any automation drive. This page covers how to reach it, how to authenticate, and a map of the endpoint families — not an exhaustive route dump.

## Base paths

The controller mounts three top-level groups plus a few standalone routes:

| Prefix | Purpose | Auth |
|---|---|---|
| `/api/v3` | The main authenticated API — resources, WAF, GSLB, ACME, Shield, inventory, settings, and more. | JWT (Bearer) |
| `/api/op` | Operational commands to edge clients/services (owner/admin-gated). | JWT (Bearer) |
| `/auth` | Login (issues the JWT). | none |
| `/logout`, `/refresh` | Session teardown / token refresh (standalone). | token |
| `/dns` | GSLB DNS snapshot/changes for the CoreDNS plugin. | zone secret |
| `/api/discovery` | K8s discovery ingest. | discovery token |

The controller process listens on `:8099` by default; on a standard install it sits behind an internal Envoy front on `127.0.0.1:8080`. See the [port reference](/reference/ports).

## Authentication

Elchi uses **JWT bearer tokens**. The flow:

1. **Log in** to get a token:

   ```bash
   curl -s -X POST https://<elchi-host>/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"you","password":"secret"}'
   ```

   The response carries the access token (and a refresh token).

2. **Call the API** with the token on every `/api/v3` and `/api/op` request:

   ```bash
   curl -s https://<elchi-host>/api/v3/shield/policies?project=<project-id> \
     -H 'Authorization: Bearer <token>'
   ```

3. **Refresh** when the access token expires:

   ```bash
   curl -s -X POST https://<elchi-host>/refresh -H 'Authorization: Bearer <refresh-token>'
   ```

4. **Log out** to invalidate the session:

   ```bash
   curl -s -X POST https://<elchi-host>/logout -H 'Authorization: Bearer <token>'
   ```

### Project scoping

Most resources are **scoped to a project**. Read and write endpoints accept a `project` query parameter (e.g. `?project=<project-id>`), and the API enforces that the caller may act within that project. Cross-project access is rejected.

### Roles and gating

Some endpoint groups are restricted beyond ordinary authentication:

- **Owner-only** — project management (`/api/v3/setting/project*`).
- **Admin/Owner-only** — audit logs (`/api/v3/audit`), ACME/DNS credentials (`/api/v3/acme`), edge client & service ops (`/api/op/clients`, `/api/op/services`), settings maintenance/backup, and the API-discovery/threat-intel/GeoIP settings singletons under `/api/v3/setting`.

Owner/admin-gated groups return `403` to under-privileged callers even with a valid token.

## Endpoint families

A grouped map of what lives where under `/api/v3` (plus the operational and standalone groups). This is the "which family do I want" index — the full route list is in the OpenAPI spec.

### Envoy config & resources

| Group | What it does |
|---|---|
| `/xds/:collection` | CRUD for xDS resources (listeners, clusters, routes, endpoints, secrets…). |
| `/eo/:collection/...` | Extensions / HTTP filters CRUD (filter and extension objects attached to resources). |
| `/resource/upgrade` | Migrate a resource across Envoy versions. |
| `/dependency/:name` | Resolve a resource's dependency graph. |
| `/custom/*` | Catalogs & counts — resource/filter lists, counts, error summaries, and **`/custom/available_versions`** (live Envoy version list). |
| `/scenario/*` | Component catalog + scenario compose/execute/validate/import/export. |
| `/templates`, `/routemap`, `/snippets`, `/search` | Config templates, route maps, reusable snippets, and global search. |
| `/bridge/nodes/:nodeID/snapshot` | Inspect/clear a node's live xDS snapshot. |

### Security

| Group | What it does |
|---|---|
| `/waf` | Coraza/CRS WAF config CRUD + versioning, and CRS rule browsing (`/waf/crs`, `/waf/crs/versions`). Version-scoped. |
| `/shield` | elchi-shield policy CRUD, project re-sync, live client status/files, and the security-events feed (`/shield/events*`). |
| `/acme` | ACME certificate lifecycle, DNS credentials, ACME accounts, CA providers. Admin/Owner-gated. |

### GSLB & DNS

| Group | What it does |
|---|---|
| `/gslb` | GSLB record CRUD, per-record IP management, node tracking + proxy. Writes are Admin/Owner. |
| `/dns` (standalone) | DNS snapshot/changes consumed by the CoreDNS plugin (zone-secret auth). |
| `/setting/gslb` | Global GSLB configuration. |

### API Discovery (inventory)

| Group | What it does |
|---|---|
| `/inventory` | Read-only API inventory over Mongo + ClickHouse — the traffic-derived endpoint catalog. Includes operations/attack-surface listings, risk/PII/auth-coverage/security-score analytics, consumers, drift/snapshots, OpenAPI export (`/inventory/openapi`), and **`/inventory/suggest-policy`** (findings → a draft Shield policy). Per-handler project-scope auth. |
| `/setting/api_discovery`, `/setting/threat-intel`, `/setting/geoip` | Collector runtime config, threat-intel feeds, and GeoIP databases (Admin/Owner). |

See the [collector reference](/api-discovery/collector-reference) for the ingest side.

### Platform administration

| Group | What it does |
|---|---|
| `/setting/*` | Users, groups, permissions, tokens, clouds, LDAP, OTP, syslog forwarding, license, and the settings singletons. Mostly Admin/Owner. |
| `/setting/project*` | Project management (**Owner-only**). |
| `/profile/*` | The current user's own profile, password, and OTP. |
| `/audit/logs`, `/audit/stats` | Audit trail (Admin/Owner). |
| `/jobs/*` | Async job queue — list/stats/retry/stuck/workers. |
| `/registry/*` | Registry data + instances; remove stale controller/control-plane entries. |
| `/discovery/*` (standalone) | Kubernetes discovery ingest + cluster listing. |
| `/ai/*` | AI-assisted config/log analysis, model management, and usage stats. |

### Operational commands (`/api/op`)

| Group | What it does |
|---|---|
| `/clients` | Edge client management + the command dispatch endpoint (`POST`); OpenStack interface/subnet lookups. Admin/Owner. |
| `/services` | Service listing, Envoy details, GSLB recreate. Admin/Owner. |

:::note[No published spec for the control API]
Elchi does **not** publish a machine-readable OpenAPI document of the control API — there is no `/api/v1/openapi.json` (or similar) route. This page is the map; read the source or the browser's network tab for exact request/response shapes.

The one OpenAPI surface that *does* exist is **`GET /api/v3/inventory/openapi`**, which exports an OpenAPI 3.0.3 skeleton of the **traffic-discovered API inventory** (see [OpenAPI export](/api-discovery/openapi-export)) — that describes *your* discovered endpoints, not the Elchi control API.
:::

## See also

- [CLI reference](/reference/cli) — command-line surfaces.
- [Port reference](/reference/ports) — where the controller listens.
- [Envoy versions](/reference/envoy-versions) — the `/custom/available_versions` source of truth.
