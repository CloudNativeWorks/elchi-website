---
title: Changelog & Releases
description: Where to find release notes for every Elchi component, and how the components are versioned together.
sidebar_position: 13
tags: [reference]
---

Elchi is a multi-component platform, and each component is released and versioned
independently. Rather than duplicate release notes here, this page points you to
the authoritative source for each component and explains how their versions relate.

## Release notes by component

Every component publishes its release notes on GitHub. The distribution mirror,
[**elchi-archive**](https://github.com/CloudNativeWorks/elchi-archive/releases), is
the single public place where installable artifacts (binaries, charts, install
scripts) are re-published for unauthenticated download.

| Component | What it is | Releases |
|---|---|---|
| **elchi** (UI) | The React management console | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-backend** | Controller + Control-Plane + Registry | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-client** | The edge agent (bundles Shield) | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-shield** | The ext_proc API-security sidecar | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-collector** | The API Discovery ingest service | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **Helm charts** | `elchi-stack`, `elchi-discovery` | [charts.elchi.io](https://charts.elchi.io/) |
| **Install scripts / mirror** | Standalone + single-host installers | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |

:::tip[Current versions at a glance]
The UI and backend version badges in the top navigation bar always show the latest
published release of each — they are read at build time from the public release
archive (`archive.elchi.io/index.json`), which is also where the installers and
the appliance pull their artifacts from.
:::

## Release highlights

Short summaries of notable feature releases, with links into the docs. The
component release notes above remain the authoritative list of versions,
fixes and upgrade steps.

### API Discovery — October 2026

Spans **elchi-backend**, **elchi-collector**, the **elchi** UI and
**elchi-shield**; check each component's release notes for the exact versions.

- **Active vs historical findings.** Flags, PII categories and auth markers carry
  last-seen stamps; findings older than `policy.risk_active_days` (default 7)
  become historical, and lists, filters, dashboards and drift use the active
  view. `mixed_auth_schemes` (now info), `auth_inconsistent` and
  `cors_origin_reflection` (foreign origins only) are derived at read time and
  decay on their own — see [Risk Flags Reference](/api-discovery/risk-flags-reference#active-historical-and-derived-flags).
- **Active scores and a gated Security Score.** Endpoints sort and filter by
  their active threat / exposure score; the Security Score is 0–100 with an
  A–F grade and excludes pillars with insufficient data — see
  [Risk Scoring](/api-discovery/risk-scoring).
- **False-positive-first defaults.** BOLA, brute force and payment abuse need a
  failure share, path scan counts only 404/405, impossible travel needs two
  continent switches (or one onto a hosting / VPN AS), replay fingerprints only
  signed / nonce-bound requests. Collector Mongo migration 009 moves only
  untouched old defaults.
- **PII.** Turkish national id (TCKN, named or endpoint-level evidence) and
  Turkish mobile numbers; per-detector reporting switches; configurable
  credential query-parameter names — see [PII, Auth & Consumers](/api-discovery/pii-and-auth).
- **Cookie-session apps** are recognised as authenticated without cookie
  inspection, through the managed `elchi-cookie-names` filter.
- **TLS behind a proxy.** `policy.trusted_tls_proxy_cidrs` +
  `x-forwarded-proto` count proxy-terminated TLS as TLS.
- **Consumers & enumeration.** Persistent consumer records, machine vs human
  callers, new-consumer and trend signals, enumeration / scraping /
  auth-failure indicators and per-endpoint enumerators — see
  [Consumers & Enumeration](/api-discovery/consumers-and-enumeration).
- **OpenAPI specs & coverage.** Versioned spec import with listener / host /
  path scopes; documented, undocumented, unused, deprecated-in-use, parameter
  and status drift — see [OpenAPI Specs & Coverage](/api-discovery/specs-and-coverage).
- **Drift & ownership.** Daily snapshots with a change feed
  ([Drift & Snapshots](/api-discovery/drift)); ownership rules, overrides, a
  Teams tab and CSV export ([Ownership & Teams](/api-discovery/ownership-and-teams)).
- **Learned path templating.** Letter+digit ids are learned per position and
  merged into `{id}` rows, with pin / unlearn overrides — see
  [Path Normalization](/api-discovery/path-normalization#learned-templating).
- **GraphQL operations** are inventoried one row per operation from request
  metadata; collector ClickHouse migration 014 adds operation dimensions to the
  rollups, so errors and analytics split by operation.
- **Exact windows and sampling.** Error and analytics windows are exact to the
  minute; with raw sampling, event counts are weighted by `sample_weight`
  (ClickHouse migration 013).
- **Shield.** DLP `tr_national_id` and `phone` kinds (named mode by default),
  JWT / JWKS `claim_bindings`, and policy bundles that carry their own
  `files/…` data files. Deploy the new Shield before the backend that emits
  these fields.

## How the pieces are versioned

- **Components version independently.** The UI, backend, Shield, collector, and
  client each move on their own cadence. A given platform install pins a specific
  version of each (see the installer's version flags on
  [install.sh](/installation/bare-metal/install-sh) and
  [upgrade.sh](/installation/bare-metal/upgrade-sh)).
- **Shield ships with the client.** Each `elchi-client` release bundles a matching
  `elchi-shield` version, so upgrading the edge agent upgrades Shield with it (see
  [Client installation](/installation/client/installation)).
- **Envoy versions are decoupled.** Supported Envoy versions are discovered
  dynamically from the release archive, not pinned to a platform version — see
  [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) for the model
  and how your resources move between them.
- **Backend release tags encode the trio.** Backend tags carry the platform,
  control-plane, and Envoy versions together (for example
  `elchi-v1.6.18-v0.14.0-envoy1.39.3`), so a tag tells you exactly which
  go-control-plane and Envoy baseline it targets.

## Upgrading

- **Helm:** bump the chart/app versions and `helm upgrade` — see
  [Platform installation](/installation/helm-platform/installation).
- **Bare-metal:** [upgrade.sh](/installation/bare-metal/upgrade-sh) performs a
  version-diff upgrade across the stack.
- **Edge clients:** re-run the client installer to pick up a new agent + Shield
  bundle.

Always read the target release's notes before upgrading — breaking changes and
migration steps are called out there.
