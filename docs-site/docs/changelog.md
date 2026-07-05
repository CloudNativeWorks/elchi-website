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
| **elchi** (UI) | The React management console | [github.com/CloudNativeWorks/elchi/releases](https://github.com/CloudNativeWorks/elchi/releases) |
| **elchi-backend** | Controller + Control-Plane + Registry | [elchi-backend/releases](https://github.com/CloudNativeWorks/elchi-backend/releases) |
| **elchi-client** | The edge agent (bundles Shield) | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-shield** | The ext_proc API-security sidecar | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **elchi-collector** | The API Discovery ingest service | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |
| **Helm charts** | `elchi-stack`, `elchi-discovery` | [charts.elchi.io](https://charts.elchi.io/) |
| **Install scripts / mirror** | Standalone + single-host installers | [elchi-archive/releases](https://github.com/CloudNativeWorks/elchi-archive/releases) |

:::tip[Current versions at a glance]
The UI and backend version badges in the top navigation bar always show the latest
published release of each — they are fetched at build time from GitHub.
:::

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
  [Envoy Versions](/reference/envoy-versions) for the model, and
  [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) for how your
  resources move between them.
- **Backend release tags encode the trio.** Backend tags carry the platform,
  control-plane, and Envoy versions together (for example
  `elchi-v1.4.8-v0.14.0-envoy1.36.2`), so a tag tells you exactly which
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
