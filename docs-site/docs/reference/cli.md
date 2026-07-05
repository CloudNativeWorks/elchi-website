---
title: CLI Reference
description: A map of every command-line surface in the Elchi platform — installers, the stack operator helper, the Shield sidecar CLI, the client installer, and collector env-config — with a link to each one's full docs.
sidebar_position: 5
tags: [reference]
---

Elchi has several command-line surfaces, spread across the installer suite, the edge agents, and the central services. This page is the "where do I find X CLI" map: a one-paragraph summary of each, with a link to its complete reference. It does not duplicate the flag tables — it points you at the page that owns them.

## Bare-metal installer suite

The bare-metal platform is provisioned and maintained by a small family of shell scripts. Each is a self-contained CLI with its own flags.

### `install.sh`

The primary installer. It provisions a management node or joins an edge node to an existing platform, laying down systemd units for the controller, control-plane, registry, Envoy, and the supporting datastores. Its flags control topology (single-node vs multi-node), the Envoy front-door port, VictoriaMetrics mode, and node role. Start here for a fresh install.

→ [`install.sh` reference](/installation/bare-metal/install-sh)

### `upgrade.sh`

Upgrades an existing bare-metal install in place — pulls new binaries and rolls the systemd services, preserving config and data. Use this to move the platform to a new Elchi release without re-running the full installer.

→ [`upgrade.sh` reference](/installation/bare-metal/upgrade-sh)

### `uninstall.sh`

Tears down an Elchi install: stops and removes the systemd units and (optionally) the data directories. Flags gate how destructive the removal is.

→ [`uninstall.sh` reference](/installation/bare-metal/uninstall-sh)

### `validate.sh`

A read-only preflight/health checker — verifies prerequisites and that a running install's services and ports are healthy. Run it before `install.sh` on a new host, or after an upgrade to confirm the stack came back cleanly.

→ [`validate.sh` reference](/installation/bare-metal/validate-sh)

## `elchi-stack` operator helper

`elchi-stack` is the day-2 operator wrapper around the installed platform — a convenience CLI for common lifecycle and inspection tasks on a running bare-metal stack (service control, status, and stack-level operations) so you don't hand-drive systemd. It sits on top of the installer output.

→ [`elchi-stack` helper reference](/installation/bare-metal/elchi-stack-helper)

## `elchi-shield` sidecar CLI

`elchi-shield` (the `ext_proc` API-security/WAF sidecar) is a single binary run next to Envoy on each edge node. Its CLI configures the ext_proc socket, the loopback HTTP/metrics address (`127.0.0.1:9001`), body/time limits, XFF trust hops, audit sinks, and the watched config directory. It also ships a **`validate` subcommand** that checks a policy config directory without starting the service — useful in CI and before a deploy.

→ [Shield CLI & `validate` reference](/shield/reference)

## `elchi-client` installer

`elchi-client` is the lightweight edge agent that registers the node with the controller, ships logs, manages networking, and applies the lifecycle commands the controller pushes over the `CommandStream`. It is installed on each edge host via its own installer flow (not the bare-metal management installer).

→ [Client installation](/installation/client/installation)

## elchi-collector env-config

The central **elchi-collector** (ALS v3 ingest → API inventory) is configured entirely through environment variables rather than flags — the gRPC/HTTP listen addresses (`:18090` / `:18091`), ClickHouse/MongoDB DSNs, TLS, and normalization tuning. Its reference documents every variable and the metrics it exposes.

→ [Collector configuration & reference](/api-discovery/collector-reference)

## See also

- [Port reference](/reference/ports) — every listen port these binaries open.
- [REST API reference](/reference/api) — the controller API the UI and automation drive.
- [Envoy versions](/reference/envoy-versions) — how deployable versions are resolved.
