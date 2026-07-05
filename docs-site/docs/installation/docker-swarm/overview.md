---
title: "Docker Swarm: Overview"
description: What the Docker Swarm installer deploys, the prebuilt-image model, and how it compares to bare-metal and Helm/kind.
sidebar_position: 1
tags: [installation, docker]
---

The Docker Swarm installer brings the full Elchi **control plane** up on Docker Swarm with a single command — online or fully air-gapped, single-node or multi-node HA. It is the third Elchi deployment path, alongside the [bare-metal systemd installer](/installation/bare-metal/overview) and the [kind + Helm single-host installer](/installation/kind-quickstart), and the production [Helm chart](/installation/helm-platform/overview).

It reuses the **pre-built `jhonbrownn/*` images** already on Docker Hub — the same images the Helm chart consumes. Nothing is built locally. Third-party services (MongoDB, ClickHouse, VictoriaMetrics, Grafana, OpenTelemetry, Envoy) run their official upstream images. Source lives at [elchi-archive/deploy/docker/](https://github.com/CloudNativeWorks/elchi-archive/tree/main/deploy/docker).

:::note This is Docker **Swarm**, not Compose
The installer runs `docker stack deploy` against a Swarm cluster (it initializes Swarm for you if needed). It is not a `docker compose` setup.
:::

## What it deploys

All services share the `elchi-net` overlay network and address each other by **Swarm service DNS** (`tasks.<service>`), replacing the bare-metal installer's `/etc/hosts` aliases.

| Service | Image | Mode | Notes |
|---|---|---|---|
| `elchi-envoy` | `envoyproxy/envoy` | global | Edge L7 router + TLS, publishes `:<port>` |
| `elchi-registry` | `jhonbrownn/elchi-backend` | global | xDS routing / ext_proc target |
| `elchi-controller-node<i>` | `jhonbrownn/elchi-backend` | 1 **per node** | REST + gRPC API singleton (version-agnostic) |
| `elchi-cp-<envoy>-node<i>` | `jhonbrownn/elchi-backend` | 1 **per node per variant** | control-plane (xDS) |
| `elchi-ui` | `jhonbrownn/elchi` | global | SPA (nginx); `config.js` injected |
| `elchi-mongo` | `mongo:8.0` | 1 (M1) | standalone; scoped `elchi` app user |
| `elchi-clickhouse` | `clickhouse/clickhouse-server` | 1 (M1) | event store (collector) |
| `elchi-victoriametrics` | `victoriametrics/victoria-metrics` | 1 (M1) | metrics TSDB |
| `elchi-grafana` | `grafana/grafana` | 1 (M1) | served at `/grafana/` |
| `elchi-otel` | `otel/opentelemetry-collector-contrib` | global | per-node metrics sink |
| `elchi-collector` | `jhonbrownn/elchi-collector` | global | Envoy ALS → ClickHouse |
| `elchi-coredns` | `jhonbrownn/elchi-coredns` | global | GSLB DNS (optional) |

The single elchi-backend image serves all three backend roles (registry / controller / control-plane) via subcommand. One control-plane service and one Envoy cluster is generated **per backend variant**; the embedded Envoy version must be unique across variants.

## What it does NOT install

This is a **control-plane-only** stack, exactly like the bare-metal installer. It does **not** run the data-plane components that live on your edge hosts:

- the **elchi-client** agent, and
- the **elchi-shield** WAF sidecar.

Those install separately on each edge node — see [Edge Client](/installation/client/overview). If shield's audit sink is pointed at this stack's ClickHouse (`--shield-audit-dsn=…` on the edge), make port `9000` reachable from the edge hosts and grant the DSN user `CREATE`/`INSERT`; shield auto-creates its `elchi_shield_audit` table.

## Container images

The Elchi-specific images live on Docker Hub under `jhonbrownn/*`. Third-party services use pinned upstream tags so `save-images.sh` produces a reproducible offline bundle. Defaults are the single source of truth in [`versions.env`](https://github.com/CloudNativeWorks/elchi-archive/blob/main/deploy/docker/versions.env) and can be overridden per component with the version flags (see [Installer Flags](/installation/docker-swarm/flags)).

| Component | Image | Default tag | Override flag |
|---|---|---|---|
| Backend (registry / controller / control-plane) | `jhonbrownn/elchi-backend` | `v1.6.6-v0.14.0-envoy1.38.3` | `--backend-version=<csv>` |
| UI (nginx SPA) | `jhonbrownn/elchi` | `v1.5.5` | `--ui-version` |
| CoreDNS (GSLB plugin) | `jhonbrownn/elchi-coredns` | `v0.1.4` | `--coredns-version` |
| Collector (Envoy ALS ingest) | `jhonbrownn/elchi-collector` | `v0.1.11` | `--collector-version` |
| Envoy (edge) | `envoyproxy/envoy` | `v1.37.0` | — |
| MongoDB | `mongo` | `8.0` | — |
| ClickHouse | `clickhouse/clickhouse-server` | `24.8` | — |
| Grafana | `grafana/grafana` | `11.6.0` | — |
| VictoriaMetrics | `victoriametrics/victoria-metrics` | `v1.93.5` | — |
| OpenTelemetry Collector | `otel/opentelemetry-collector-contrib` | `0.89.0` | — |

Point the Elchi images at a private mirror (for example a local `registry:2` used for air-gapped multi-node distribution) with `--image-repo=<registry>/<namespace>`.

## Which path should I choose?

| Path | Use when | Notes |
|---|---|---|
| **Docker Swarm** (this) | You want the control plane in containers on one or more Linux hosts without Kubernetes | Prebuilt images, online or air-gapped, single-node or auto-HA |
| [**Bare-metal / systemd**](/installation/bare-metal/overview) | You want no container runtime — plain systemd services on the VMs | Per-service `MemoryMax`/`CPUQuota` caps; host-managed lifecycle |
| [**Helm**](/installation/helm-platform/overview) | You already run Kubernetes | Production Kubernetes deployment |
| [**kind + Helm**](/installation/kind-quickstart) | Evaluation on a single VM with no existing cluster | Wraps the Helm chart in a local kind cluster |

## Where things live

- **Editable config, secrets, TLS and dashboards** are host **bind-mounts** under `/etc/elchi` (override with `--etc-dir=`), on **every node**. Operators edit a file in place and apply it with a service update — see [Upgrade & Uninstall](/installation/docker-swarm/upgrade-and-uninstall).
- Only the **generated `stack.yml`** lives under `~/.elchi-docker/gen` (override with `--state-dir=`).

## Next steps

- [Quick Start](/installation/docker-swarm/quickstart) — the one-liner and the happy path.
- [Installer Flags](/installation/docker-swarm/flags) — the full flag reference.
- [High Availability](/installation/docker-swarm/high-availability) — multi-node, auto replica set + Keeper cluster.
- [Offline / Air-Gapped](/installation/docker-swarm/offline-airgap) — `save-images.sh` and `--offline`.
