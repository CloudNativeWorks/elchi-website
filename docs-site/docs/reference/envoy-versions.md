---
title: Envoy Versions
description: How Elchi tracks supported Envoy versions — dynamically from the archive, not a hardcoded list — and what "version-scoped" means for resources, WAF, and certificates.
sidebar_position: 4
tags: [reference]
---

This is the **single source of truth** for how Elchi handles Envoy versions. Other pages that mention a specific Envoy version are illustrative; the authoritative, live list always comes from the archive described below.

## Supported versions are fetched, not hardcoded

Elchi does not ship a static list of supported Envoy versions. The controller fetches the current catalog at runtime from the release archive:

```
GET https://archive.elchi.io/index.json
```

The backend surfaces this to the UI through:

```
GET /api/v3/custom/available_versions
```

The handler proxies the archive's `index.json` verbatim — each entry carries the `version`, `release_date`, download `url`, `sha256`, and `size`. Because the list is fetched on demand, **new Envoy builds become available in Elchi as soon as they are published to the archive**, with no backend release required.

```json
{
  "versions": [
    { "version": "1.38.3", "release_date": "…", "url": "https://archive.elchi.io/…", "sha256": "…", "size": 0 }
  ],
  "last_updated": "…",
  "source": "archive.elchi.io"
}
```

:::tip Always query the API for the real list
Any version number quoted in docs is a snapshot in time. To see what your platform can actually deploy right now, call `GET /api/v3/custom/available_versions` (or open the version picker in the UI). Do not treat a hardcoded number in prose as canonical.
:::

## Pinned control-plane baseline

The management plane is built against a pinned **versioned go-control-plane**, which sets the Envoy API baseline the control-plane speaks. As of the current backend `go.mod`:

- `versioned-go-control-plane` — `v0.14.0-envoy1.38.3`
- `versioned-go-control-plane/envoy` — `v1.38.3`

That baseline is **~1.38**. The supported deployable range spans roughly **1.33 – 1.38** — the archive lists what is actually available, and the pinned control-plane defines the newest API vocabulary the platform can emit. Older data-plane binaries in the range are configured against a compatible subset.

## Everything is version-scoped

A single logical object in Elchi exists **per Envoy version**. This is the core mental model — the same listener, WAF policy, or certificate is materialized independently for each version you run:

- **Resources** — every xDS resource (listeners, clusters, routes, filters, extensions) is stored and rendered against a specific Envoy version. Editing "the" listener means editing its per-version instance.
- **WAF configurations** — Coraza/CRS WAF configs are version-scoped; CRS rule sets are themselves versioned (e.g. `GET /api/v3/waf/config?version=…`, `GET /api/v3/waf/crs/versions`).
- **ACME certificates** — issued certificate secrets are materialized per Envoy version so each running data-plane version has a matching secret.

Practically: when you introduce a new Envoy version, its resources/configs/certs are provisioned for that version; when you retire one, its version-scoped objects are cleaned up.

## Upgrade and cleanup flows

Adding a version, migrating resources onto it, and cleaning up a retired version are per-version operations. The backend exposes a resource upgrade path (`POST /api/v3/resource/upgrade`) and version cleanup (`DELETE /api/v3/setting/maintenance/cleanup/versions/:version`).

For the end-to-end walkthrough — how to add a new Envoy version, upgrade resources across versions, and safely retire an old one — see:

- [Versions & upgrades](/envoy-configuration/versions-and-upgrades)

## See also

- [REST API reference](/reference/api) — the `/custom` and `/waf` groups.
- [Port reference](/reference/ports) — where the control-plane (xDS `:18000`) fits.
